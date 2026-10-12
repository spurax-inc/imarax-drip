import type { Metadata, Viewport } from "next";
import PwaRegister from "@/components/PwaRegister";
import CookieConsent from "@/components/CookieConsent";
import "@fontsource/poppins/300.css";
import "@fontsource/poppins/400.css";
import "@fontsource/poppins/500.css";
import "@fontsource/poppins/600.css";
import "@fontsource/poppins/700.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Imarax Drip | Imagine it, wear it",
  description:
    "Imarax Drip is a clothing brand for everyone. Imagine it, wear it.",
  icons: {
    icon: "/imarax-icon.svg",
    apple: "/pwa-icon/192",
  },
  appleWebApp: {
    capable: true,
    title: "Imarax Drip",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#111111",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      style={{ "--font-poppins": "'Poppins', sans-serif" } as React.CSSProperties}
    >
      <body className="antialiased">
        {children}
        <PwaRegister />
        <CookieConsent />
      </body>
    </html>
  );
}