import type { Metadata, Viewport } from "next";
import "./globals.css";
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};
export const metadata: Metadata = {
  title: { default: "MTC Inventory", template: "%s | MTC Inventory" },
  description:
    "Inventory dan pengelolaan aset internal PT Media Teknologi Celebes",
  robots: { index: false, follow: false },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body>
        <a className="skip-link" href="#main">
          Lewati ke konten utama
        </a>
        {children}
      </body>
    </html>
  );
}
