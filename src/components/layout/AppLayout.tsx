'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useFarm } from '@/lib/data/FarmContext';
import {
  LayoutDashboard,
  Home,
  Layers,
  ClipboardPen,
  Wheat,
  Warehouse,
  Egg,
  ShoppingCart,
  DollarSign,
  HeartPulse,
  Scale,
  Truck,
  Users,
  Receipt,
  Zap,
  CreditCard,
  FileSpreadsheet,
  Bell,
  UserCog,
  ShieldCheck,
  History,
  Menu,
  X,
  ChevronDown,
  RotateCcw,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import MobileBottomNav from '@/components/mobile/MobileBottomNav';
import PWAInstaller from '@/components/mobile/PWAInstaller';

interface NavItem {
  name: string;
  href: string;
  icon: any;
  category: 'Overview' | 'Flock & Sheds' | 'Feeds & Milling' | 'Eggs & Sales' | 'Flock Health' | 'Finance' | 'Intelligence' | 'Administration';
  adminOnly?: boolean;
  requiresFinancial?: boolean;
  requiresCustomerSupplier?: boolean;
  requiresPurchasePayment?: boolean;
  requiresReports?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard, category: 'Overview' },
  { name: 'Shed Management', href: '/sheds', icon: Home, category: 'Flock & Sheds' },
  { name: 'Bird & Batches', href: '/batches', icon: Layers, category: 'Flock & Sheds' },
  { name: 'Daily Farm Entry', href: '/daily-entry', icon: ClipboardPen, category: 'Flock & Sheds' },
  { name: 'Feed Management', href: '/feed-management', icon: Wheat, category: 'Feeds & Milling' },
  { name: 'Godown & Inventory', href: '/inventory', icon: Warehouse, category: 'Feeds & Milling' },
  { name: 'Egg Production', href: '/egg-production', icon: Egg, category: 'Eggs & Sales' },
  { name: 'Egg Stock & Sales', href: '/egg-sales', icon: ShoppingCart, category: 'Eggs & Sales' },
  { name: 'Bird Sales', href: '/bird-sales', icon: DollarSign, category: 'Eggs & Sales' },
  { name: 'Health & Vaccination', href: '/health-vaccination', icon: HeartPulse, category: 'Flock Health' },
  { name: 'Weight Monitoring', href: '/weight-monitoring', icon: Scale, category: 'Flock Health' },
  { name: 'Suppliers & Purchases', href: '/suppliers', icon: Truck, category: 'Finance', requiresCustomerSupplier: true },
  { name: 'Customers & Accounts', href: '/customers', icon: Users, category: 'Finance', requiresCustomerSupplier: true },
  { name: 'Expenses & Income', href: '/expenses', icon: Receipt, category: 'Finance', requiresFinancial: true },
  { name: 'Electricity & Labour', href: '/electricity-labour', icon: Zap, category: 'Finance', requiresFinancial: true },
  { name: 'Payments & Balances', href: '/payments', icon: CreditCard, category: 'Finance', requiresPurchasePayment: true },
  { name: 'Reports & Analytics', href: '/reports', icon: FileSpreadsheet, category: 'Intelligence', requiresReports: true },
  { name: 'Alerts & Notifications', href: '/notifications', icon: Bell, category: 'Intelligence' },
  { name: 'User Management', href: '/users', icon: UserCog, category: 'Administration', adminOnly: true },
  { name: 'Permissions & Settings', href: '/settings', icon: ShieldCheck, category: 'Administration', adminOnly: true },
  { name: 'Audit Logs', href: '/audit-logs', icon: History, category: 'Administration', adminOnly: true },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const {
    currentUser,
    switchRole,
    visibilitySettings,
    sheds,
    notifications,
    markNotificationRead,
    resetAllData,
  } = useFarm();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);

  // Calculate live birds and capacity
  const totalLiveBirds = sheds.reduce((sum, s) => sum + s.current_birds, 0);
  const totalCapacity = sheds.reduce((sum, s) => sum + s.capacity, 0);
  const occupancyPct = totalCapacity > 0 ? ((totalLiveBirds / totalCapacity) * 100).toFixed(1) : '0';
  const unreadNotifs = notifications.filter((n) => !n.is_read).length;

  const isItemVisible = (item: NavItem) => {
    if (currentUser.role === 'owner_admin') return true;

    // Manager Visibility Checks
    if (item.adminOnly) return false;
    if (item.requiresFinancial && !visibilitySettings.financial_dashboard && !visibilitySettings.revenue_and_expenses) {
      return false;
    }
    if (item.requiresCustomerSupplier && !visibilitySettings.customer_supplier_accounts) {
      return false;
    }
    if (item.requiresPurchasePayment && !visibilitySettings.purchase_and_payments) {
      return false;
    }
    if (item.requiresReports && !visibilitySettings.detailed_reports_export) {
      return false;
    }
    return true;
  };

  // Group visible items by category
  const categories = Array.from(new Set(NAV_ITEMS.map((item) => item.category)));

  return (
    <div className="min-h-screen flex bg-slate-50 font-sans text-slate-900">
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-72 bg-slate-900 border-r border-slate-800 text-slate-300 select-none flex-shrink-0">
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-emerald-900/30">
              🐔
            </div>
            <div>
              <h1 className="text-sm font-bold text-white tracking-wide uppercase">Balaji Poultry</h1>
              <p className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                100,000 Bird System
              </p>
            </div>
          </div>
        </div>

        {/* Live Farm Birds Badge in Sidebar */}
        <div className="mx-4 my-3 p-3 bg-slate-800/80 rounded-xl border border-slate-700/60">
          <div className="flex justify-between items-center text-xs mb-1.5">
            <span className="text-slate-400 font-medium">Live Bird Occupancy</span>
            <span className="text-emerald-400 font-semibold">{occupancyPct}%</span>
          </div>
          <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Number(occupancyPct))}%` }}
            ></div>
          </div>
          <div className="flex justify-between items-center text-[11px] text-slate-400 mt-2">
            <span>Live: <strong className="text-white">{totalLiveBirds.toLocaleString()}</strong></span>
            <span>Target: <strong className="text-white">{totalCapacity.toLocaleString()}</strong></span>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-6">
          {categories.map((cat) => {
            const items = NAV_ITEMS.filter((i) => i.category === cat && isItemVisible(i));
            if (items.length === 0) return null;
            return (
              <div key={cat} className="space-y-1">
                <div className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {cat}
                </div>
                {items.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-emerald-600 text-white font-semibold shadow-sm shadow-emerald-900/40'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                      <span className="flex-1 truncate">{item.name}</span>
                      {item.adminOnly && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono">
                          Admin
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* User Card & Role Switcher in Sidebar Footer */}
        <div className="p-3 bg-slate-950/60 border-t border-slate-800/80">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-semibold uppercase text-slate-400">Current Role</span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                currentUser.role === 'owner_admin'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
              }`}
            >
              {currentUser.role === 'owner_admin' ? 'Owner / Admin' : 'Manager'}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => switchRole('owner_admin')}
              className={`flex-1 py-1.5 px-2 text-[11px] font-medium rounded-md transition-all ${
                currentUser.role === 'owner_admin'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              Owner View
            </button>
            <button
              onClick={() => switchRole('manager')}
              className={`flex-1 py-1.5 px-2 text-[11px] font-medium rounded-md transition-all ${
                currentUser.role === 'manager'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              Manager View
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header Bar */}
        <header className="h-16 bg-white border-b border-slate-200/90 px-4 sm:px-6 flex items-center justify-between z-20 sticky top-0 shadow-xs">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 focus:outline-none"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:block">
              <h2 className="text-sm font-semibold text-slate-800">
                100,000 Birds Multi-Shed Management Portal
              </h2>
              <p className="text-[11px] text-slate-500">
                L1–L5 (Layers), G1–G2 (Growers), C1 (Chick) • 8 Sheds Active
              </p>
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            {/* Quick Demo Reset Button */}
            <button
              onClick={() => {
                if (window.confirm('Reset all demo farm records to initial factory state?')) {
                  resetAllData();
                }
              }}
              title="Reset farm test records"
              className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Reset Data</span>
            </button>

            {/* Notification Bell with Dropdown */}
            <div className="relative">
              <button
                onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <Bell className="w-5 h-5" />
                {unreadNotifs > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-bounce">
                    {unreadNotifs}
                  </span>
                )}
              </button>

              {/* Notification Popover */}
              {notifDropdownOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50">
                  <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                      Farm Alerts ({notifications.length})
                    </span>
                    <span className="text-[11px] text-emerald-600 font-medium">Real-time alerts</span>
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                    {notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => markNotificationRead(n.id)}
                        className={`p-3 text-xs hover:bg-slate-50 cursor-pointer transition-colors ${
                          n.is_read ? 'opacity-60' : 'bg-emerald-50/40'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <span className="font-semibold text-slate-900">{n.title}</span>
                          {!n.is_read && (
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                          )}
                        </div>
                        <p className="text-slate-600 mt-1 text-[11px] leading-relaxed">{n.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Pill with Role indicator */}
            <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white ${
                  currentUser.role === 'owner_admin' ? 'bg-emerald-600' : 'bg-blue-600'
                }`}
              >
                {currentUser.role === 'owner_admin' ? 'OA' : 'M'}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-xs font-semibold text-slate-800">{currentUser.full_name}</div>
                <div className="text-[10px] text-slate-500 capitalize">
                  {currentUser.role === 'owner_admin' ? 'Full Administrator' : 'Shed Manager'}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (Phone viewport) */}
      <MobileBottomNav onOpenMenu={() => setMobileMenuOpen(true)} />

      {/* PWA Home Screen Installation Prompt */}
      <PWAInstaller />

      {/* Mobile Drawer Navigation Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          ></div>
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-slate-900 text-slate-300 shadow-xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <span className="font-bold text-white text-sm">Balaji Poultry Navigation</span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {categories.map((cat) => {
                const items = NAV_ITEMS.filter((i) => i.category === cat && isItemVisible(i));
                if (items.length === 0) return null;
                return (
                  <div key={cat} className="space-y-1">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {cat}
                    </div>
                    {items.map((item) => {
                      const isActive = pathname === item.href;
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-medium ${
                            isActive
                              ? 'bg-emerald-600 text-white'
                              : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span>{item.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                );
              })}
            </div>

            {/* Mobile Role Switcher */}
            <div className="p-4 bg-slate-950 border-t border-slate-800">
              <div className="text-xs font-semibold text-slate-400 mb-2">Switch Active Role:</div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => switchRole('owner_admin')}
                  className={`py-2 text-xs rounded-md font-medium ${
                    currentUser.role === 'owner_admin'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  Owner
                </button>
                <button
                  onClick={() => switchRole('manager')}
                  className={`py-2 text-xs rounded-md font-medium ${
                    currentUser.role === 'manager'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  Manager
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
