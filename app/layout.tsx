import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'La Grande Marque - Shipping Admin',
  description: 'Internal shipping & logistics administration system.',
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

