import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useDeviceContext } from "@/contexts/DeviceContext";
import { useEffect } from "react";

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  image_url: string | null;
  link: string | null;
  is_active: boolean;
  created_at: string;
}

export const useAppNotifications = () => {
  const { deviceId } = useDeviceContext();
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["app-notifications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as AppNotification[];
    },
  });

  const { data: readIds = [] } = useQuery({
    queryKey: ["notification-reads", deviceId],
    queryFn: async () => {
      if (!deviceId) return [];
      const { data, error } = await supabase
        .from("notification_reads")
        .select("notification_id")
        .eq("device_id", deviceId);
      if (error) throw error;
      return data.map((r) => r.notification_id);
    },
    enabled: !!deviceId,
  });

  const markAsRead = useMutation({
    mutationFn: async (notificationId: string) => {
      if (!deviceId) return;
      const { error } = await supabase
        .from("notification_reads")
        .insert({ notification_id: notificationId, device_id: deviceId });
      if (error && !error.message.includes("duplicate")) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-reads", deviceId] });
    },
  });

  const unreadCount = notifications.filter((n) => !readIds.includes(n.id)).length;

  // Realtime subscription for new notifications
  useEffect(() => {
    const channel = supabase
      .channel("notifications-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ["app-notifications"] });
          // Trigger browser notification if permission granted
          if ("Notification" in window && Notification.permission === "granted") {
            const n = payload.new as AppNotification;
            new Notification(n.title, { body: n.body, icon: "/pwa-icon-192.png" });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return { notifications, readIds, unreadCount, markAsRead, isLoading };
};
