"use client";

import { Download } from "lucide-react";
import { usePWAInstall } from "@/components/pwa/PWAInstallProvider";

interface InstallAppButtonProps {
  className?: string;
}

export function InstallAppButton({
  className,
}: InstallAppButtonProps) {
  const {
    canInstall,
    isInstalled,
    isIOS,
    installApp,
  } = usePWAInstall();

  // Already installed → don't show anything
  if (isInstalled) {
    return null;
  }

  // iOS doesn't support beforeinstallprompt.
  // We'll handle the iOS instructions in a separate component.
  if (isIOS) {
    return null;
  }

  // Browser hasn't provided the install prompt yet
  if (!canInstall) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={installApp}
      className={[
        "flex items-center gap-2 rounded-lg",
        "bg-[#5048E5] px-4 py-2.5",
        "text-sm font-medium text-white",
        "transition-all hover:bg-[#4338ca]",
        "active:scale-[0.98]",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <Download className="h-4 w-4" />

      <span>Install App</span>
    </button>
  );
}