import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Afterglow — uma noite em quatro atos",
  description: "Um jogo rápido para ouvir, descobrir e compartilhar uma noite Candlelight entre amigos.",
  applicationName: "Afterglow",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Afterglow",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#08070a",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" style={{ backgroundColor: "#08070a", colorScheme: "dark" }}>
      <body style={{ backgroundColor: "#08070a" }}>{children}</body>
    </html>
  );
}
