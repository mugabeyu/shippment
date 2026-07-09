import type { Metadata } from 'next';
import { Inter, Rajdhani } from 'next/font/google';
import './globals.css';
import CursorGlow from '@/components/CursorGlow';
import SWRConfigProvider from '@/components/SWRConfigProvider';

// Self-hosted via next/font instead of a render-blocking CSS @import — fonts are
// fetched at build time, served from our own origin, and preloaded automatically.
const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
});

const rajdhani = Rajdhani({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-rajdhani',
  display: 'swap',
});

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
    <html lang="en" className={`${inter.variable} ${rajdhani.variable}`}>
      <body>
        <SWRConfigProvider>{children}</SWRConfigProvider>
        <CursorGlow />
      </body>
    </html>
  );
}

