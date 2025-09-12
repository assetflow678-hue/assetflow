import type { Metadata, Viewport } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/toaster';

const fontInter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const fontSpaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-space-grotesk',
});

export const metadata: Metadata = {
  title: 'AssetFlow',
  description: 'A simple PWA for asset management.',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  themeColor: '#F5F2EE',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          'min-h-screen bg-background font-body antialiased',
          fontInter.variable,
          fontSpaceGrotesk.variable
        )}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
