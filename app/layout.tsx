import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://tudesign.tr"),
  title: {
    default: "tuDesign AI",
    template: "%s | tuDesign",
  },
  description: "Mekanını yapay zeka ile yeniden tasarla.",
  applicationName: "tuDesign AI",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: ["/icon.svg"],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "tuDesign AI",
    startupImage: [],
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: "tuDesign AI",
    description: "Mekanını yapay zeka ile yeniden tasarla.",
    url: "https://tudesign.tr",
    siteName: "tuDesign AI",
    locale: "tr_TR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "tuDesign AI",
    description: "Mekanını yapay zeka ile yeniden tasarla.",
  },
};

export const viewport: Viewport = {
  themeColor: "#09090b",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}