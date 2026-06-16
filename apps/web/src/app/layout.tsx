import type { Metadata } from "next";
import { Providers } from "@/frontend/components/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Barbería Jeranbuq",
  description: "Reserva tu turno en Barbería Jeranbuq",
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
      </body>
    </html>
  );
}
