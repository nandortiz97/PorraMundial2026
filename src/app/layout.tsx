import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Porra Mundial 2026",
  description: "La porra oficial del Mundial de Fútbol 2026. ¡Haz tus pronósticos y compite!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${inter.variable}`} suppressHydrationWarning>
      <body className="bg-background text-foreground antialiased selection:bg-brand-emerald600 selection:text-white" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
