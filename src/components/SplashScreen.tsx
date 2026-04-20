import { useEffect, useState } from "react";
import { ShoppingBag } from "lucide-react";
import splashImage from "/splash.png";

const SPLASH_DISMISSED_KEY = "splash_dismissed_session";

/**
 * Full-screen splash shown ONLY in standalone PWA / native (Capacitor) contexts.
 * On the regular website (browser tab) it never renders.
 * Stays visible until the user taps "Start Shopping".
 */
const SplashScreen = () => {
  const [shouldShow, setShouldShow] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);

  useEffect(() => {
    // Detect standalone PWA
    const isStandalonePWA =
      window.matchMedia("(display-mode: standalone)").matches ||
      // iOS Safari
      (window.navigator as any).standalone === true;

    // Detect Capacitor native shell
    const isCapacitor =
      typeof (window as any).Capacitor !== "undefined" &&
      (window as any).Capacitor?.isNativePlatform?.() === true;

    // Only show splash in PWA or native — NOT on the regular website
    const inAppContext = isStandalonePWA || isCapacitor;

    // Don't show again in the same session
    const alreadyDismissed = sessionStorage.getItem(SPLASH_DISMISSED_KEY) === "1";

    if (inAppContext && !alreadyDismissed) {
      setShouldShow(true);
      // Lock background scroll while splash is up
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const handleStart = () => {
    setFadingOut(true);
    sessionStorage.setItem(SPLASH_DISMISSED_KEY, "1");
    setTimeout(() => {
      setShouldShow(false);
      document.body.style.overflow = "";
    }, 400);
  };

  if (!shouldShow) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-end justify-center transition-opacity duration-500 ${
        fadingOut ? "opacity-0" : "opacity-100"
      }`}
      style={{
        paddingBottom: "env(safe-area-inset-bottom)",
        backgroundColor: "#0a2818", // matches splash dark green so letterboxing blends
      }}
    >
      {/* Background image — cover so it fills the entire screen */}
      <img
        src={splashImage}
        alt="Eco Print Technologies"
        className="absolute inset-0 h-full w-full object-cover"
        draggable={false}
      />

      {/* Start Shopping button */}
      <button
        onClick={handleStart}
        className="relative z-10 mb-12 inline-flex items-center gap-2 rounded-full bg-primary px-8 py-4 text-base font-semibold text-primary-foreground shadow-2xl shadow-primary/40 ring-1 ring-primary-foreground/20 transition-all duration-200 hover:scale-105 hover:bg-primary/90 active:scale-95 sm:mb-16 sm:px-10 sm:py-5 sm:text-lg"
        aria-label="Start Shopping"
      >
        <ShoppingBag className="h-5 w-5" />
        Start Shopping
        <span className="ml-1 text-xl leading-none">→</span>
      </button>
    </div>
  );
};

export default SplashScreen;
