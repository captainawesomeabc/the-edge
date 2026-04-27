import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Prova — Synthetic Audience Intelligence',
  description: 'Simulate how real people react to your product before you launch. 7 AI personas. Honest feedback. Go-to-market strategy. In under a minute.',
  openGraph: {
    title: 'Prova — Synthetic Audience Intelligence',
    description: 'Simulate how real people react to your product before you launch.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[#0a0a0f] text-gray-100 antialiased">{children}</body>
    </html>
  );
}
