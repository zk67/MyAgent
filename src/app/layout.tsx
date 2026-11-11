import type { Metadata } from 'next';
import { Instrument_Sans, Instrument_Serif } from 'next/font/google';
import '@/styles/base.css';

export const metadata: Metadata = {
  title: 'MyAgent',
  description: 'Your semester in order: an AI assistant for your Google Calendar.',
};

// Titles use the serif, everything else the sans.
const serif = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--font-serif',
});

const sans = Instrument_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
});

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
    <html lang="fr" className={`${serif.variable} ${sans.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
