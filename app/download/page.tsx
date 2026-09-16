import type { Metadata } from "next";
import { ShieldCheck, Smartphone, Download, TriangleAlert } from "lucide-react";

export const metadata: Metadata = {
  title: "Download for Android | AFX Work Tracker",
  description: "Get the AFX Work Tracker Android app — installed directly, no Play Store needed.",
};

// Bump this (and the filename/checksum below) every time a new signed APK
// is built and dropped into /public/downloads. Keeping it here means the
// version, file size, and checksum shown on the page can never silently
// drift out of sync with the actual file being served.
const APK_INFO = {
  fileName: "afx-work-tracker.apk",
  version: "1.0.0",
  versionCode: 1,
  // Fill these in after running the build in ANDROID_APK_GUIDE.md —
  // `sha256sum public/downloads/afx-work-tracker.apk`.
  sha256: "REPLACE_WITH_SHA256_OF_BUILT_APK",
  approxSizeMb: "~4",
};

export default function DownloadPage() {
  const apkPath = `/downloads/${APK_INFO.fileName}`;

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-8 px-6 py-16">
      <div className="space-y-2 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
          <Smartphone className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-2xl font-semibold">AFX Work Tracker for Android</h1>
        <p className="text-sm text-muted-foreground">
          Installed straight from this page — no Google Play account or app store needed. It's a free, direct
          download of the same app you use in the browser, wrapped for your home screen.
        </p>
      </div>

      <a
        href={apkPath}
        download={APK_INFO.fileName}
        className="flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
      >
        <Download className="h-4 w-4" />
        Download APK · v{APK_INFO.version} · {APK_INFO.approxSizeMb} MB
      </a>

      <div className="rounded-xl border border-border bg-card p-4 text-xs text-muted-foreground">
        <p className="font-medium text-foreground">Verify before you install (optional, recommended)</p>
        <p className="mt-1">
          After downloading, check the file's SHA-256 checksum matches the one below — this confirms the file
          reached your phone unmodified.
        </p>
        <code className="mt-2 block break-all rounded-lg bg-secondary/60 p-2 font-mono">{APK_INFO.sha256}</code>
      </div>

      <div className="space-y-3 rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <TriangleAlert className="h-4 w-4 text-amber-500" />
          Before you install
        </div>
        <ol className="list-decimal space-y-2 pl-4 text-sm text-muted-foreground">
          <li>Download the APK above using your phone's browser (Chrome recommended).</li>
          <li>
            Open the downloaded file. Android will ask to allow installs from your browser — this is normal for any
            app installed outside the Play Store, tap <span className="font-medium text-foreground">Settings</span>{" "}
            → allow, then go back and install.
          </li>
          <li>Google Play Protect may scan the file automatically before install — that's expected and fine.</li>
          <li>Open the app and sign in with your usual AFX Work Tracker account.</li>
        </ol>
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 text-xs text-muted-foreground">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <p>
          This app only ever talks to AFX Work Tracker's own servers over HTTPS — the Android package is a thin,
          digitally-signed wrapper around this website (a "Trusted Web Activity"), not a separate codebase. It asks
          for no device permissions beyond internet access.
        </p>
      </div>
    </main>
  );
}
