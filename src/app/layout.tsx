import type { Metadata } from 'next';
import './globals.css';
import { FarmProvider } from '@/lib/data/FarmContext';
import AppLayout from '@/components/layout/AppLayout';

export const metadata: Metadata = {
  title: 'Poultry Farm Management System — 100,000 Birds',
  description: 'Enterprise multi-shed commercial poultry farm operations, flock lifecycle, and financial management.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <FarmProvider>
          <AppLayout>{children}</AppLayout>
        </FarmProvider>
      </body>
    </html>
  );
}
