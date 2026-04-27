import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Synthetic Audience Agent',
  description: 'AI-powered market research. Drop in a product description and simulate real audience reactions.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
