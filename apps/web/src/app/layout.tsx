import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { Providers } from "@/frontend/components/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "JB Barber Studio",
  description: "Reserva tu turno en JB Barber Studio — barbería premium",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
  openGraph: {
    title: "JB Barber Studio",
    description: "Reserva tu turno en JB Barber Studio — barbería premium",
    images: [{ url: "/logo.png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#050505",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="bg-[#050505] text-foreground antialiased">
        <Providers>{children}</Providers>
        <Analytics />
      </body>
    </html>
  );
}
