import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dekkal Quiz — Teste tes connaissances",
  description: "Quiz interactif généré par IA sur 8 thèmes différents. Joue, apprends et monte dans le classement !",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>⚡</text></svg>",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
