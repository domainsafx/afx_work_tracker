import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { PWAInstallProvider } from "@/components/pwa/PWAInstallProvider";
import { ServiceWorkerRegister } from "@/components/pwa/ServiceWorkerRegister";

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: "AFX Digital | Work Tracker",
  description: "AFX Digital's employee task and work tracking system",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "AFX Tracker",
  },
  icons: {
    icon: [
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#5048E5",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body className="min-h-screen font-sans antialiased">
        <ServiceWorkerRegister />

        <PWAInstallProvider>
          <Providers>{children}</Providers>
        </PWAInstallProvider>
      </body>
    </html>
  );
}
