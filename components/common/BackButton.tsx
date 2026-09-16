"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type BackButtonProps = {
  fallbackHref?: string;
  label?: string;
  className?: string;
};

export function BackButton({
  fallbackHref = "/dashboard",
  label = "Back",
  className,
}: BackButtonProps) {
  const router = useRouter();

  const handleBack = () => {
    // If there is browser history, go back
    if (window.history.length > 1) {
      router.back();
      return;
    }

    // Important for PWAs opened directly on a page
    router.push(fallbackHref);
  };

  return (
    <Button
      type="button"
      variant="ghost"
      onClick={handleBack}
      className={cn(
        "gap-2",
        className
      )}
    >
      <ArrowLeft className="h-4 w-4" />
      {label}
    </Button>
  );
}