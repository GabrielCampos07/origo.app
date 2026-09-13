import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Origo — Autenticação",
  description: "Login e redefinição de senha Origo",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased text-slate-900">{children}</body>
    </html>
  );
}
