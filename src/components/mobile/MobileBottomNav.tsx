'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Home,
  ClipboardPen,
  Egg,
  Menu,
} from 'lucide-react';

interface MobileBottomNavProps {
  onOpenMenu: () => void;
}

export default function MobileBottomNav({ onOpenMenu }: MobileBottomNavProps) {
  const pathname = usePathname();

  const navItems = [
    { label: 'Overview', href: '/', icon: LayoutDashboard },
    { label: 'Sheds', href: '/sheds', icon: Home },
    { label: 'Daily Log', href: '/daily-entry', icon: ClipboardPen, isFab: true },
    { label: 'Eggs', href: '/egg-production', icon: Egg },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-lg px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-1.5 flex items-center justify-around">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;

        if (item.isFab) {
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center relative -top-3.5 group focus:outline-none"
            >
              <div className="w-13 h-13 rounded-full bg-emerald-600 group-hover:bg-emerald-700 text-white flex items-center justify-center shadow-lg shadow-emerald-600/40 border-4 border-slate-50 transition-transform active:scale-95">
                <Icon className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold text-slate-800 mt-0.5 tracking-tight">
                {item.label}
              </span>
            </Link>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center w-14 py-1 rounded-lg transition-colors ${
              isActive ? 'text-emerald-600 font-bold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-600' : 'text-slate-500'}`} />
            <span className="text-[10px] mt-0.5">{item.label}</span>
          </Link>
        );
      })}

      {/* Menu / Drawer Toggle */}
      <button
        onClick={onOpenMenu}
        className="flex flex-col items-center justify-center w-14 py-1 rounded-lg text-slate-500 hover:text-slate-800 transition-colors focus:outline-none"
      >
        <Menu className="w-5 h-5 text-slate-500" />
        <span className="text-[10px] mt-0.5">More</span>
      </button>
    </nav>
  );
}
