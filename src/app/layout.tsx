import type { Metadata } from 'next';
import '@/styles/base.css'

export const metadata: Metadata = {
  title: 'LIL-IA Calendar Assistant',
  description: 'AI-powered Google Calendar assistant',
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