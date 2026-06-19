import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import SupportWidget from "@/components/SupportWidget";

export const metadata: Metadata = {
  title: "FotoDesk — Galeries privées",
  description: "Galeries photo privées et sélection pour photographes africains.",
  icons: {
    icon: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <ThemeProvider>
          {children}
          <SupportWidget />
        </ThemeProvider>
      </body>
    </html>
  );
}

