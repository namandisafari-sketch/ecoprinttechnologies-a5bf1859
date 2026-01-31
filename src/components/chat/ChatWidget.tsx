import { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  content: string;
  sender_type: "customer" | "admin";
  created_at: string;
}

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string>("");
  const [customerInfo, setCustomerInfo] = useState({ name: "", phone: "" });
  const [showForm, setShowForm] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Generate or retrieve session ID
    let sid = localStorage.getItem("chat_session_id");
    if (!sid) {
      sid = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      localStorage.setItem("chat_session_id", sid);
    }
    setSessionId(sid);

    // Check for existing conversation
    const savedConversation = localStorage.getItem("chat_conversation_id");
    const savedCustomer = localStorage.getItem("chat_customer_info");
    
    if (savedConversation && savedCustomer) {
      setConversationId(savedConversation);
      setCustomerInfo(JSON.parse(savedCustomer));
      setShowForm(false);
      loadMessages(savedConversation);
    }
  }, []);

  useEffect(() => {
    if (conversationId) {
      // Subscribe to new messages
      const channel = supabase
        .channel(`messages:${conversationId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `conversation_id=eq.${conversationId}`,
          },
          (payload) => {
            const newMsg = payload.new as Message;
            setMessages((prev) => {
              if (prev.find((m) => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [conversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadMessages = async (convId: string) => {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", convId)
      .order("created_at");

    if (!error && data) {
      setMessages(data as Message[]);
    }
  };

  const startConversation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerInfo.name || !customerInfo.phone) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("conversations")
        .insert({
          customer_name: customerInfo.name,
          customer_phone: customerInfo.phone,
          session_id: sessionId,
        })
        .select()
        .single();

      if (error) throw error;

      setConversationId(data.id);
      localStorage.setItem("chat_conversation_id", data.id);
      localStorage.setItem("chat_customer_info", JSON.stringify(customerInfo));
      setShowForm(false);

      // Send welcome message
      await supabase.from("messages").insert({
        conversation_id: data.id,
        sender_type: "customer",
        content: `Hi, I'm ${customerInfo.name}. I'm interested in your products!`,
      });

      loadMessages(data.id);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to start conversation",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !conversationId) return;

    const messageContent = newMessage.trim();
    setNewMessage("");

    try {
      await supabase.from("messages").insert({
        conversation_id: conversationId,
        sender_type: "customer",
        content: messageContent,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
      setNewMessage(messageContent);
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <>
      {/* Chat Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-50 p-4 bg-primary text-primary-foreground rounded-full shadow-lg hover:shadow-xl transition-all duration-300 ${
          isOpen ? "scale-0" : "scale-100"
        }`}
      >
        <MessageCircle className="h-6 w-6" />
      </button>

      {/* Chat Window */}
      <div
        className={`fixed bottom-6 right-6 z-50 w-[360px] max-w-[calc(100vw-48px)] bg-card border border-border rounded-2xl shadow-2xl transition-all duration-300 ${
          isOpen
            ? "scale-100 opacity-100"
            : "scale-90 opacity-0 pointer-events-none"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-primary text-primary-foreground rounded-t-2xl">
          <div>
            <h3 className="font-bold">Sir Wanda Support</h3>
            <p className="text-xs opacity-80">We typically reply instantly</p>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 hover:bg-primary-foreground/20 rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Messages or Form */}
        <div className="h-[400px] overflow-y-auto p-4 space-y-4">
          {showForm ? (
            <form onSubmit={startConversation} className="space-y-4">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <MessageCircle className="h-8 w-8 text-primary" />
                </div>
                <h4 className="font-semibold text-foreground">Start a conversation</h4>
                <p className="text-sm text-muted-foreground">
                  We're here to help with your phone parts needs!
                </p>
              </div>

              <div className="space-y-3">
                <Input
                  placeholder="Your name"
                  value={customerInfo.name}
                  onChange={(e) =>
                    setCustomerInfo({ ...customerInfo, name: e.target.value })
                  }
                  required
                />
                <Input
                  placeholder="Phone number"
                  value={customerInfo.phone}
                  onChange={(e) =>
                    setCustomerInfo({ ...customerInfo, phone: e.target.value })
                  }
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Start Chat
              </Button>
            </form>
          ) : (
            <>
              {messages.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <p>Send us a message!</p>
                  <p className="text-sm">We're here to help you find the right parts</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${
                      msg.sender_type === "customer" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                        msg.sender_type === "customer"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-foreground"
                      }`}
                    >
                      <p className="text-sm">{msg.content}</p>
                      <p
                        className={`text-xs mt-1 ${
                          msg.sender_type === "customer"
                            ? "text-primary-foreground/70"
                            : "text-muted-foreground"
                        }`}
                      >
                        {formatTime(msg.created_at)}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input */}
        {!showForm && (
          <form
            onSubmit={sendMessage}
            className="p-4 border-t border-border flex gap-2"
          >
            <Input
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" size="icon" disabled={!newMessage.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        )}
      </div>
    </>
  );
};

export default ChatWidget;
