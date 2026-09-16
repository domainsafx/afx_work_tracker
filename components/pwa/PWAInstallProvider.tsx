"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
}

interface PWAInstallContextType {
  canInstall: boolean;
  isInstalled: boolean;
  isIOS: boolean;
  installApp: () => Promise<void>;
}

const PWAInstallContext = createContext<PWAInstallContextType | undefined>(
  undefined
);

export function PWAInstallProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if the app is already running as an installed PWA
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone ===
        true;

    setIsInstalled(standalone);

    // Detect iOS devices
    const userAgent = window.navigator.userAgent.toLowerCase();

    const isiOS =
      /iphone|ipad|ipod/.test(userAgent) ||
      (navigator.platform === "MacIntel" &&
        navigator.maxTouchPoints > 1);

    setIsIOS(isiOS);

    // Capture the browser install event
    const handleBeforeInstallPrompt = (
      event: BeforeInstallPromptEvent
    ) => {
      event.preventDefault();

      setDeferredPrompt(event);
    };

    // Detect successful installation
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener(
      "beforeinstallprompt",
      handleBeforeInstallPrompt as EventListener
    );

    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt as EventListener
      );

      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const installApp = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();

      const choice = await deferredPrompt.userChoice;

      if (choice.outcome === "accepted") {
        console.log("PWA installation accepted");
      } else {
        console.log("PWA installation dismissed");
      }

      setDeferredPrompt(null);
    } catch (error) {
      console.error("PWA installation failed:", error);
    }
  };

  return (
    <PWAInstallContext.Provider
      value={{
        canInstall: !!deferredPrompt,
        isInstalled,
        isIOS,
        installApp,
      }}
    >
      {children}
    </PWAInstallContext.Provider>
  );
}

export function usePWAInstall() {
  const context = useContext(PWAInstallContext);

  if (!context) {
    throw new Error(
      "usePWAInstall must be used inside PWAInstallProvider"
    );
  }

  return context;
}