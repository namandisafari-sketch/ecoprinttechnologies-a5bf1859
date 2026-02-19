import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface PresenceState {
  isOnline: boolean;
  isTyping: boolean;
}

interface UseChatPresenceOptions {
  conversationId: string | null;
  role: "admin" | "customer";
}

export const useChatPresence = ({ conversationId, role }: UseChatPresenceOptions) => {
  const [remotePresence, setRemotePresence] = useState<PresenceState>({
    isOnline: false,
    isTyping: false,
  });
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const remoteTypingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!conversationId) {
      setRemotePresence({ isOnline: false, isTyping: false });
      return;
    }

    const channelName = `presence:${conversationId}`;
    const channel = supabase.channel(channelName, {
      config: { presence: { key: role } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const otherRole = role === "admin" ? "customer" : "admin";
        const otherPresent = !!state[otherRole] && (state[otherRole] as any[]).length > 0;
        setRemotePresence((prev) => ({ ...prev, isOnline: otherPresent }));
      })
      .on("presence", { event: "leave" }, ({ key }) => {
        const otherRole = role === "admin" ? "customer" : "admin";
        if (key === otherRole) {
          setRemotePresence({ isOnline: false, isTyping: false });
        }
      })
      .on("broadcast", { event: "typing" }, ({ payload }) => {
        const otherRole = role === "admin" ? "customer" : "admin";
        if (payload.role === otherRole) {
          setRemotePresence((prev) => ({ ...prev, isTyping: true }));
          // Clear typing after 3 seconds of no typing event
          if (remoteTypingTimeoutRef.current) clearTimeout(remoteTypingTimeoutRef.current);
          remoteTypingTimeoutRef.current = setTimeout(() => {
            setRemotePresence((prev) => ({ ...prev, isTyping: false }));
          }, 3000);
        }
      })
      .on("broadcast", { event: "stop_typing" }, ({ payload }) => {
        const otherRole = role === "admin" ? "customer" : "admin";
        if (payload.role === otherRole) {
          setRemotePresence((prev) => ({ ...prev, isTyping: false }));
        }
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ online_at: new Date().toISOString() });
        }
      });

    channelRef.current = channel;

    return () => {
      if (remoteTypingTimeoutRef.current) clearTimeout(remoteTypingTimeoutRef.current);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [conversationId, role]);

  const sendTyping = useCallback(() => {
    if (!channelRef.current) return;
    channelRef.current.send({
      type: "broadcast",
      event: "typing",
      payload: { role },
    });
    // Auto stop typing after 3s of inactivity
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      channelRef.current?.send({
        type: "broadcast",
        event: "stop_typing",
        payload: { role },
      });
    }, 3000);
  }, [role]);

  const sendStopTyping = useCallback(() => {
    if (!channelRef.current) return;
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    channelRef.current.send({
      type: "broadcast",
      event: "stop_typing",
      payload: { role },
    });
  }, [role]);

  return {
    isRemoteOnline: remotePresence.isOnline,
    isRemoteTyping: remotePresence.isTyping,
    sendTyping,
    sendStopTyping,
  };
};
