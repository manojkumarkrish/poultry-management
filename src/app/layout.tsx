import type { Metadata, Viewport } from 'next';
import { cookies, headers } from 'next/headers';
import './globals.css';
import { FarmProvider } from '@/lib/data/FarmContext';
import AppLayout from '@/components/layout/AppLayout';
import { parseAndVerifyToken } from '@/lib/auth/authUtils';

export const metadata: Metadata = {
  title: 'Kasthuri Poultry Farm (KPF) — Management System',
  description: 'Kasthuri Poultry Farm (KPF) multi-shed commercial poultry farm operations, flock lifecycle, and financial management.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'KPF Manager',
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = cookies();
  const headersList = headers();
  const serverPathname = headersList.get('x-pathname') || undefined;

  const sessionToken = cookieStore.get('kpf_session')?.value;
  const roleCookie = cookieStore.get('kpf_role')?.value;
  const userIdCookie = cookieStore.get('kpf_user_id')?.value;

  let initialRole: 'owner_admin' | 'manager' | undefined = undefined;
  let initialUserId: string | undefined = userIdCookie;

  if (sessionToken && sessionToken.trim().length > 0) {
    const verified = await parseAndVerifyToken(sessionToken);
    if (verified.valid) {
      if (verified.role === 'owner_admin' || verified.role === 'manager') {
        initialRole = verified.role;
      }
      if (verified.userId) {
        initialUserId = verified.userId;
      }
    }
  }

  if (!initialRole && (roleCookie === 'owner_admin' || roleCookie === 'manager')) {
    initialRole = roleCookie;
  }

  return (
    <html lang="en">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-touch-fullscreen" content="yes" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then(function(regs) {
                  for (var r of regs) { r.unregister(); }
                });
                if ('caches' in window) {
                  caches.keys().then(function(names) {
                    for (var n of names) { caches.delete(n); }
                  });
                }
              }
            `,
          }}
        />
      </head>
      <body className="antialiased select-none-touch">
        <FarmProvider initialRole={initialRole} initialUserId={initialUserId}>
          <AppLayout serverPathname={serverPathname}>{children}</AppLayout>
        </FarmProvider>
      </body>
    </html>
  );
}
