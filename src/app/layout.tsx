import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Pwa } from "@/components/pwa";
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#1763da",
};
export const metadata: Metadata = {
  title: { default: "MTC Inventory", template: "%s | MTC Inventory" },
  description:
    "Inventory dan pengelolaan aset internal PT Media Teknologi Celebes",
  robots: { index: false, follow: false },
  appleWebApp: {
    capable: true,
    title: "MTC Inventory",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/icons/apple-touch-icon.png",
  },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body>
        <Pwa />
        <a className="skip-link" href="#main">
          Lewati ke konten utama
        </a>
        {children}
      </body>
    </html>
  );
}
