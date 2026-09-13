import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "beOrigo — Continuidade entre consultas",
  description: "Prescrição clara. Adesão visível. Continuidade entre consultas. HEP 1:1 para fisioterapeutas e personal trainers.",
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
