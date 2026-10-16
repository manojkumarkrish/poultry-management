import type { Metadata, Viewport } from 'next';
import './globals.css';
import { FarmProvider } from '@/lib/data/FarmContext';
import AppLayout from '@/components/layout/AppLayout';

export const metadata: Metadata = {
  title: 'Poultry Farm Management System — 100,000 Birds',
  description: 'Enterprise multi-shed commercial poultry farm operations, flock lifecycle, and financial management.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'PoultryFarm',
  },
  icons: {
    icon: '/icons/icon-192x192.png',
    apple: '/icons/icon-192x192.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#059669',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-touch-fullscreen" content="yes" />
      </head>
      <body className="antialiased select-none-touch">
        <FarmProvider>
          <AppLayout>{children}</AppLayout>
        </FarmProvider>
      </body>
    </html>
  );
}
