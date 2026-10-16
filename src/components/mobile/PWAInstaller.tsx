'use client';

import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Share } from 'lucide-react';

export default function PWAInstaller() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Register Service Worker
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('Poultry PWA Service Worker registered:', reg.scope);
        })
        .catch((err) => {
          console.warn('SW registration failed:', err);
        });
    }

    // Check if already in standalone app mode
    if (typeof window !== 'undefined') {
      const isStandaloneMode =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true;
      setIsStandalone(isStandaloneMode);

      // Detect iOS
      const userAgent = window.navigator.userAgent.toLowerCase();
      const isApple = /iphone|ipad|ipod/.test(userAgent);
      setIsIOS(isApple);

      // Listen for Android install prompt
      const handleBeforeInstall = (e: any) => {
        e.preventDefault();
        setDeferredPrompt(e);
        // Only show if not dismissed before
        if (!localStorage.getItem('pwa_banner_dismissed')) {
          setShowInstallBanner(true);
        }
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstall);

      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      };
    }
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowInstallBanner(false);
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowInstallBanner(false);
    localStorage.setItem('pwa_banner_dismissed', 'true');
  };

  // If already installed in standalone mode, do not show prompt
  if (isStandalone) return null;

  return (
    <>
      {/* Android / Desktop Chrome Install Banner */}
      {showInstallBanner && deferredPrompt && (
        <div className="fixed bottom-20 left-4 right-4 sm:bottom-6 sm:right-6 sm:left-auto sm:w-96 z-50 bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-emerald-500/30 flex items-center justify-between gap-3 animate-slide-up">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-xl flex-shrink-0 shadow-md">
              🐔
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>Install Mobile App</span>
                <span className="text-[9px] bg-emerald-500/30 text-emerald-300 px-1.5 py-0.2 rounded font-mono">
                  100K System
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Install on your phone home screen for fast 1-tap shed entries.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleInstallClick}
              className="px-3 py-1.5 text-xs font-bold text-slate-900 bg-emerald-400 hover:bg-emerald-300 rounded-lg shadow-sm transition-colors"
            >
              Install
            </button>
            <button
              onClick={handleDismiss}
              className="p-1.5 text-slate-400 hover:text-white rounded-md"
              aria-label="Dismiss banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* iOS Instructions Pill (Visible on mobile Safari when not standalone) */}
      {isIOS && !isStandalone && !showInstallBanner && (
        <div className="lg:hidden fixed top-2 left-4 right-4 z-40 bg-slate-900/90 backdrop-blur-md text-white px-3 py-2 rounded-xl text-[11px] flex items-center justify-between border border-slate-700 shadow-lg">
          <div className="flex items-center gap-2">
            <Share className="w-3.5 h-3.5 text-blue-400" />
            <span>Install on iPhone: Tap <strong>Share</strong> then <strong>"Add to Home Screen"</strong></span>
          </div>
        </div>
      )}
    </>
  );
}
