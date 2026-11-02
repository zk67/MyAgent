import type { Metadata } from 'next';
import '@/styles/base.css'

export const metadata: Metadata = {
  title: 'MyAgent',
  description: 'Assistant IA pour Google Calendar',
};

// This script runs before paint so the page never flashes in the wrong theme.
const themeScript = `
(function() {
  try {
    var saved = localStorage.getItem('theme');
    var dark = saved ? saved === 'dark' : matchMedia('(prefers-color-scheme:dark)').matches;
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  } catch(e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
