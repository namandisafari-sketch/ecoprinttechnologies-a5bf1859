import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useNotifications } from "@/hooks/useNotifications";
import { useChatPresence } from "@/hooks/useChatPresence";
import { useNotificationSound } from "@/hooks/useNotificationSound";
import TypingIndicator from "@/components/chat/TypingIndicator";
import {
  MessageCircle,
  Send,
  Loader2,
  Phone,
  CheckCheck,
  Bell,
  BellOff,
  ArrowLeft,
  Search,
} from "lucide-react";

interface Conversation {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  status: string;
  last_message_at: string;
  created_at: string;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_type: "customer" | "admin";
  content: string;
  is_read: boolean;
  created_at: string;
}

const AdminChat = () => {
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { permission, requestPermission, showNotification, isSupported } = useNotifications();
  const { playSound } = useNotificationSound();
  const { isRemoteOnline, isRemoteTyping, sendTyping, sendStopTyping } = useChatPresence({
    conversationId: selectedConversation?.id ?? null,
    role: "admin",
  });

  const { data: conversations, isLoading: loadingConversations } = useQuery({
    queryKey: ["admin-conversations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("conversations")
        .select("*")
        .order("last_message_at", { ascending: false });
      if (error) throw error;
      return data as Conversation[];
    },
  });

  const { data: messages, isLoading: loadingMessages } = useQuery({
    queryKey: ["admin-messages", selectedConversation?.id],
    queryFn: async () => {
      if (!selectedConversation) return [];
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", selectedConversation.id)
        .order("created_at");
      if (error) throw error;
      return data as Message[];
    },
    enabled: !!selectedConversation,
  });

  const sendMessage = useMutation({
    mutationFn: async (content: string) => {
      if (!selectedConversation) throw new Error("No conversation selected");
      const { error } = await supabase.from("messages").insert({
        conversation_id: selectedConversation.id,
        sender_type: "admin",
        content,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-messages", selectedConversation?.id] });
      queryClient.invalidateQueries({ queryKey: ["admin-conversations"] });
      setNewMessage("");
      sendStopTyping();
    },
    onError: (error) => {
      toast({ title: "Error sending message", description: error.message, variant: "destructive" });
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel("admin-messages")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
        queryClient.invalidateQueries({ queryKey: ["admin-messages"] });
        queryClient.invalidateQueries({ queryKey: ["admin-conversations"] });
        const newMsg = payload.new as { sender_type: string; content: string; conversation_id: string };
        if (newMsg.sender_type === "customer") {
          playSound();
          showNotification("New customer message", newMsg.content.substring(0, 100), () => {
            const conv = conversations?.find((c) => c.id === newMsg.conversation_id);
            if (conv) setSelectedConversation(conv);
          });
        }
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "conversations" }, () => {
        queryClient.invalidateQueries({ queryKey: ["admin-conversations"] });
        playSound();
        showNotification("New conversation started", "A customer has started a new chat");
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient, showNotification, conversations]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isRemoteTyping]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    sendMessage.mutate(newMessage.trim());
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    if (e.target.value.trim()) {
      sendTyping();
    } else {
      sendStopTyping();
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return date.toLocaleDateString("en-US", { weekday: "short" });
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const filteredConversations = conversations?.filter(
    (c) =>
      c.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.customer_phone.includes(searchQuery)
  );

  const getInitials = (name: string) => name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  const getAvatarColor = (name: string) => {
    const colors = [
      "bg-emerald-500", "bg-blue-500", "bg-purple-500", "bg-orange-500",
      "bg-pink-500", "bg-teal-500", "bg-indigo-500", "bg-rose-500",
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div className="h-[calc(100vh-120px)] flex bg-background rounded-xl overflow-hidden border border-border shadow-lg">
      {/* Conversations Sidebar */}
      <div className={`${selectedConversation ? "hidden md:flex" : "flex"} w-full md:w-[340px] flex-col flex-shrink-0 border-r border-border bg-card`}>
        <div className="px-4 py-3 bg-primary text-primary-foreground flex items-center justify-between">
          <h2 className="font-bold text-lg">Eco Print Chats</h2>
          <div className="flex items-center gap-2">
            {isSupported && (
              <button onClick={requestPermission} className="p-1.5 hover:bg-primary-foreground/20 rounded-full transition-colors">
                {permission === "granted" ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5 opacity-60" />}
              </button>
            )}
          </div>
        </div>

        <div className="p-2 bg-card">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search or start new chat"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-muted/50 border-0 rounded-lg h-9 text-sm"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {loadingConversations ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : filteredConversations && filteredConversations.length > 0 ? (
            <div>
              {filteredConversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConversation(conv)}
                  className={`w-full px-3 py-3 flex items-center gap-3 hover:bg-muted/50 transition-colors border-b border-border/50 ${
                    selectedConversation?.id === conv.id ? "bg-muted" : ""
                  }`}
                >
                  <div className="relative flex-shrink-0">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-sm ${getAvatarColor(conv.customer_name)}`}>
                      {getInitials(conv.customer_name)}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-sm truncate text-foreground">{conv.customer_name}</p>
                      <span className="text-xs text-muted-foreground flex-shrink-0">{formatTime(conv.last_message_at)}</span>
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                        <Phone className="h-3 w-3 flex-shrink-0" />
                        {conv.customer_phone}
                      </p>
                      <Badge variant={conv.status === "active" ? "default" : "secondary"} className="text-[10px] px-1.5 py-0 h-4 flex-shrink-0">
                        {conv.status}
                      </Badge>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No conversations yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`${selectedConversation ? "flex" : "hidden md:flex"} flex-1 flex-col`}>
        {selectedConversation ? (
          <>
            {/* Chat Header with online status */}
            <div className="px-4 py-3 bg-primary text-primary-foreground flex items-center gap-3">
              <button onClick={() => setSelectedConversation(null)} className="md:hidden p-1 hover:bg-primary-foreground/20 rounded-full">
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="relative">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm ${getAvatarColor(selectedConversation.customer_name)}`}>
                  {getInitials(selectedConversation.customer_name)}
                </div>
                {/* Online indicator dot */}
                <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-primary ${isRemoteOnline ? "bg-green-400" : "bg-gray-400"}`} />
              </div>
              <div className="flex-1">
                <p className="font-semibold">{selectedConversation.customer_name}</p>
                <p className="text-xs opacity-80">
                  {isRemoteTyping
                    ? "typing..."
                    : isRemoteOnline
                    ? "online"
                    : "offline"}
                </p>
              </div>
            </div>

            {/* Messages */}
            <div
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto scrollbar-hide p-4 space-y-2"
              style={{
                backgroundColor: "hsl(var(--muted) / 0.3)",
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              }}
            >
              {loadingMessages ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : messages && messages.length > 0 ? (
                <>
                  {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.sender_type === "admin" ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`relative max-w-[75%] rounded-lg px-3 py-2 shadow-sm ${
                          msg.sender_type === "admin"
                            ? "bg-primary/90 text-primary-foreground rounded-tr-none"
                            : "bg-card text-foreground rounded-tl-none"
                        }`}
                      >
                        <p className="text-sm leading-relaxed">{msg.content}</p>
                        <div className={`flex items-center justify-end gap-1 mt-1 ${msg.sender_type === "admin" ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                          <span className="text-[11px]">{formatTime(msg.created_at)}</span>
                          {msg.sender_type === "admin" && <CheckCheck className="h-3.5 w-3.5" />}
                        </div>
                      </div>
                    </div>
                  ))}
                  {isRemoteTyping && <TypingIndicator />}
                  <div ref={messagesEndRef} />
                </>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  <p className="text-sm">No messages yet. Say hello! 👋</p>
                </div>
              )}
            </div>

            {/* Message Input */}
            <form onSubmit={handleSendMessage} className="px-3 py-2 bg-card border-t border-border flex items-center gap-2">
              <Input
                placeholder="Type a message"
                value={newMessage}
                onChange={handleInputChange}
                className="flex-1 rounded-full bg-muted/50 border-0 h-10 px-4 text-sm"
              />
              <Button
                type="submit"
                size="icon"
                disabled={!newMessage.trim() || sendMessage.isPending}
                className="rounded-full h-10 w-10 flex-shrink-0"
              >
                {sendMessage.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-muted/20">
            <div className="text-center text-muted-foreground">
              <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="h-10 w-10 opacity-40" />
              </div>
              <h3 className="text-xl font-light mb-1">Eco Print Support</h3>
              <p className="text-sm">Select a conversation to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminChat;
