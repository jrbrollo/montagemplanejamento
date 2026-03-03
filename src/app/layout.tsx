import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Planejamento Financeiro",
  description: "Sistema de Montagem de Planejamento Financeiro Pessoal",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
