import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import {
  MessageCircle,
  Send,
  Loader2,
  User,
  Phone,
  Clock,
  CheckCheck,
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch conversations
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

  // Fetch messages for selected conversation
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

  // Send message mutation
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
    },
    onError: (error) => {
      toast({
        title: "Error sending message",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Real-time subscription for new messages
  useEffect(() => {
    const channel = supabase
      .channel("admin-messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["admin-messages"] });
          queryClient.invalidateQueries({ queryKey: ["admin-conversations"] });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "conversations",
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["admin-conversations"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    sendMessage.mutate(newMessage.trim());
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return date.toLocaleDateString("en-US", { weekday: "short" });
    } else {
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }
  };

  return (
    <div className="h-[calc(100vh-120px)] flex gap-4">
      {/* Conversations List */}
      <Card className="w-80 flex-shrink-0">
        <CardContent className="p-0 h-full flex flex-col">
          <div className="p-4 border-b border-border">
            <h2 className="font-semibold text-lg flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-primary" />
              Conversations
            </h2>
          </div>

          <ScrollArea className="flex-1">
            {loadingConversations ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : conversations && conversations.length > 0 ? (
              <div className="divide-y divide-border">
                {conversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedConversation(conv)}
                    className={`w-full p-4 text-left hover:bg-muted/50 transition-colors ${
                      selectedConversation?.id === conv.id ? "bg-muted" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{conv.customer_name}</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {conv.customer_phone}
                        </p>
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTime(conv.last_message_at)}
                      </div>
                    </div>
                    <Badge
                      variant={conv.status === "active" ? "default" : "secondary"}
                      className="mt-2"
                    >
                      {conv.status}
                    </Badge>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No conversations yet</p>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Chat Area */}
      <Card className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-border flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-full">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">{selectedConversation.customer_name}</p>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {selectedConversation.customer_phone}
                </p>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              {loadingMessages ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : messages && messages.length > 0 ? (
                <div className="space-y-4">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${
                        msg.sender_type === "admin" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                          msg.sender_type === "admin"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-foreground"
                        }`}
                      >
                        <p className="text-sm">{msg.content}</p>
                        <div
                          className={`flex items-center justify-end gap-1 mt-1 ${
                            msg.sender_type === "admin"
                              ? "text-primary-foreground/70"
                              : "text-muted-foreground"
                          }`}
                        >
                          <span className="text-xs">
                            {formatTime(msg.created_at)}
                          </span>
                          {msg.sender_type === "admin" && (
                            <CheckCheck className="h-3 w-3" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  <p>No messages yet</p>
                </div>
              )}
            </ScrollArea>

            {/* Input */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-border flex gap-2">
              <Input
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" disabled={!newMessage.trim() || sendMessage.isPending}>
                {sendMessage.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Select a conversation to start chatting</p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default AdminChat;
