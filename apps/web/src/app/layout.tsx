import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { Providers } from "@/frontend/components/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Barbería Jeranbuq",
  description: "Reserva tu turno en Barbería Jeranbuq",
  manifest: "/manifest.webmanifest",
  themeColor: "#1a1a1a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>
        <Providers>{children}</Providers>
        <Analytics />
      </body>
    </html>
  );
}
