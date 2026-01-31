import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";

export const useNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const { toast } = useToast();

  useEffect(() => {
    if ("Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if (!("Notification" in window)) {
      toast({
        title: "Notifications not supported",
        description: "Your browser doesn't support notifications",
        variant: "destructive",
      });
      return false;
    }

    const result = await Notification.requestPermission();
    setPermission(result);
    
    if (result === "granted") {
      toast({
        title: "Notifications enabled",
        description: "You'll receive notifications for new messages",
      });
      return true;
    } else {
      toast({
        title: "Notifications blocked",
        description: "Enable notifications in your browser settings",
        variant: "destructive",
      });
      return false;
    }
  };

  const showNotification = (title: string, body: string, onClick?: () => void) => {
    // Always show toast as fallback
    toast({
      title,
      description: body,
    });

    // Also show browser notification if permitted
    if (permission === "granted" && "Notification" in window) {
      const notification = new Notification(title, {
        body,
        icon: "/favicon.ico",
        badge: "/favicon.ico",
      });

      if (onClick) {
        notification.onclick = () => {
          window.focus();
          onClick();
          notification.close();
        };
      }

      // Auto-close after 5 seconds
      setTimeout(() => notification.close(), 5000);
    }
  };

  return {
    permission,
    requestPermission,
    showNotification,
    isSupported: "Notification" in window,
  };
};
