import { useEffect, useCallback } from "react";

/**
 * Hook that requests browser notification permission on mount
 * and provides a function to show notifications.
 */
export const useNotificationPermission = () => {
  useEffect(() => {
    if (!("Notification" in window)) return;
    if (Notification.permission === "default") {
      // Request on first interaction instead of immediately
      const requestOnInteraction = () => {
        Notification.requestPermission();
        document.removeEventListener("click", requestOnInteraction);
      };
      document.addEventListener("click", requestOnInteraction, { once: true });
      return () => document.removeEventListener("click", requestOnInteraction);
    }
  }, []);

  const showNotification = useCallback((title: string, options?: NotificationOptions) => {
    if ("Notification" in window && Notification.permission === "granted") {
      try {
        new Notification(title, {
          icon: "/pwa-icon-192.png",
          badge: "/pwa-icon-192.png",
          ...options,
        });
      } catch {
        // Fallback for service worker context
        if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
          navigator.serviceWorker.ready.then((reg) => {
            reg.showNotification(title, {
              icon: "/pwa-icon-192.png",
              badge: "/pwa-icon-192.png",
              ...options,
            });
          });
        }
      }
    }
  }, []);

  return { showNotification, permission: typeof Notification !== "undefined" ? Notification.permission : "denied" };
};
