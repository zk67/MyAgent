import type { Metadata } from 'next';
import '@/styles/base.css'

export const metadata: Metadata = {
  title: 'MyAgent',
  description: 'AI-powered Google Calendar assistant',
};

// Runs before the first paint: applies the saved theme (or the system one)
// so the page never flashes the wrong colors.
const THEME_SCRIPT = `
try {
  var saved = localStorage.getItem('theme');
  var dark = saved ? saved === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  document.documentElement.classList.toggle('dark', dark);
} catch (e) {}
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
