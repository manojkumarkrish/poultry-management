'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useFarm } from '@/lib/data/FarmContext';
import { formatNumber } from '@/lib/utils/formatters';
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
  Sparkles,
  ExternalLink,
  Edit3,
  User,
  CheckCircle2,
  LogOut,
  Eye,
} from 'lucide-react';
import Modal from '@/components/ui/Modal';
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
  { name: 'Permissions & Settings', href: '/settings', icon: ShieldCheck, category: 'Administration' },
  { name: 'Audit Logs', href: '/audit-logs', icon: History, category: 'Administration', adminOnly: true },
];

export default function AppLayout({
  children,
  serverPathname,
}: {
  children: React.ReactNode;
  serverPathname?: string;
}) {
  const clientPathname = usePathname();
  const currentPath = clientPathname || serverPathname || '';
  const isAuthPage = currentPath === '/login' || currentPath.startsWith('/login');
  const router = useRouter();
  const {
    currentUser,
    authenticatedUser,
    farmProfile,
    isAdmin,
    isPreviewingManager,
    updateCurrentUser,
    switchRole,
    visibilitySettings,
    sheds,
    notifications,
    markNotificationRead,
    isAuthenticated,
    authLoading,
    logout,
  } = useFarm();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [profileName, setProfileName] = useState(currentUser.full_name);
  const [profilePhone, setProfilePhone] = useState(currentUser.phone || '');
  const [profileEmail, setProfileEmail] = useState(currentUser.email);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);

  // Client-side authentication guard
  useEffect(() => {
    if (!authLoading && !isAuthenticated && !isAuthPage) {
      router.replace('/login');
    }
  }, [authLoading, isAuthenticated, isAuthPage, router]);

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to log out of Kasthuri Poultry Farm?')) {
      await logout();
    }
  };

  const handleOpenProfileModal = () => {
    setProfileName(currentUser.full_name);
    setProfilePhone(currentUser.phone || '');
    setProfileEmail(currentUser.email);
    setProfileSuccess(null);
    setProfileModalOpen(true);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName.trim()) {
      alert('Please enter a valid user name.');
      return;
    }
    updateCurrentUser({
      full_name: profileName.trim(),
      phone: profilePhone.trim(),
      email: profileEmail.trim(),
    });
    setProfileSuccess('Profile & user name updated successfully!');
    setTimeout(() => {
      setProfileModalOpen(false);
      setProfileSuccess(null);
    }, 1200);
  };

  // If on login page, render clean without farm dashboard shell
  if (isAuthPage) {
    return <>{children}</>;
  }

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
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white font-extrabold text-sm shadow-lg shadow-emerald-900/30 tracking-tight">
              KPF
            </div>
            <div>
              <h1 className="text-sm font-bold text-white tracking-wide uppercase">{farmProfile?.farm_name || 'Kasthuri Poultry Farm'}</h1>
              <p className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Poultry Management System
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
            <span>Live: <strong className="text-white">{formatNumber(totalLiveBirds)}</strong></span>
            <span>Capacity: <strong className="text-white">{formatNumber(totalCapacity)}</strong></span>
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
                  const isActive = currentPath === item.href;
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
          <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-slate-800/80">
            <div className="truncate pr-1">
              <div className="text-xs font-semibold text-white truncate flex items-center gap-1.5">
                <span>{currentUser.full_name}</span>
              </div>
              <div className="text-[10px] text-slate-400 truncate">{currentUser.email}</div>
            </div>
            <button
              onClick={handleOpenProfileModal}
              title="Change User Name / Edit Profile"
              className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition-colors flex-shrink-0 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          </div>

          {isAdmin ? (
            <>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-semibold uppercase text-slate-400">Admin View Mode</span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    !isPreviewingManager
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  }`}
                >
                  {!isPreviewingManager ? 'Owner / Admin' : 'Manager Preview'}
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => switchRole('owner_admin')}
                  className={`flex-1 py-1.5 px-2 text-[11px] font-medium rounded-md transition-all cursor-pointer ${
                    !isPreviewingManager
                      ? 'bg-emerald-600 text-white shadow-sm font-semibold'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  Owner View
                </button>
                <button
                  type="button"
                  onClick={() => switchRole('manager')}
                  className={`flex-1 py-1.5 px-2 text-[11px] font-medium rounded-md transition-all cursor-pointer ${
                    isPreviewingManager
                      ? 'bg-amber-600 text-white shadow-sm font-semibold'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  Preview Mgr
                </button>
              </div>
            </>
          ) : (
            <div className="space-y-1.5 mb-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase text-slate-400">Assigned Role</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  Shed Manager
                </span>
              </div>
              {authenticatedUser.assigned_shed_ids && authenticatedUser.assigned_shed_ids.length > 0 && (
                <div className="text-[10px] text-slate-400 truncate">
                  Sheds: {authenticatedUser.assigned_shed_ids.map((id) => id.replace('s-', '')).join(', ')}
                </div>
              )}
            </div>
          )}

          {/* Desktop Sidebar Logout Button */}
          <button
            onClick={handleLogout}
            className="w-full mt-2.5 py-1.5 px-3 bg-slate-900 hover:bg-rose-950/40 text-slate-400 hover:text-rose-300 border border-slate-800 hover:border-rose-800/40 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out / Log Out</span>
          </button>
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
                {farmProfile?.farm_name || 'Kasthuri Poultry Farm'}
              </h2>
              <p className="text-[11px] text-slate-500">
                {sheds.length > 0 ? `${sheds.length} Sheds Configured • ${formatNumber(totalLiveBirds)} Live Birds` : 'Multi-Shed Commercial Operations'}
              </p>
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center space-x-3 sm:space-x-4">
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

            {/* User Profile Pill with Role indicator (Click to Edit Profile & Name) */}
            <button
              onClick={handleOpenProfileModal}
              title="Click to change your user name & profile"
              className="flex items-center space-x-2 pl-2 border-l border-slate-200 hover:bg-slate-50 py-1 px-2 rounded-lg transition-colors group cursor-pointer text-left focus:outline-none"
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white shadow-xs group-hover:ring-2 group-hover:ring-offset-1 group-hover:ring-emerald-500 transition-all ${
                  currentUser.role === 'owner_admin' ? 'bg-emerald-600' : 'bg-blue-600'
                }`}
              >
                {currentUser.role === 'owner_admin' ? 'OA' : 'M'}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-xs font-semibold text-slate-800 flex items-center gap-1.5 group-hover:text-emerald-700">
                  <span>{currentUser.full_name}</span>
                  <Edit3 className="w-3 h-3 text-slate-400 group-hover:text-emerald-600" />
                </div>
                <div className="text-[10px] text-slate-500 capitalize">
                  {currentUser.role === 'owner_admin' ? 'Full Administrator' : 'Shed Manager'}
                </div>
              </div>
            </button>

            {/* Quick Header Logout Button */}
            <button
              onClick={handleLogout}
              title="Sign Out of Farm Session"
              className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
              aria-label="Log Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Admin Preview Mode Alert Banner */}
        {isPreviewingManager && (
          <div className="bg-amber-500/10 border-b border-amber-500/30 px-4 py-2.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-amber-200">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span>
                <strong>Admin Preview Active:</strong> You are viewing Kasthuri Farm as a Shed Manager. Admin settings are simulated as restricted.
              </span>
            </div>
            <button
              type="button"
              onClick={() => switchRole('owner_admin')}
              className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition-colors flex-shrink-0 cursor-pointer self-start sm:self-auto"
            >
              Exit Preview & Return to Owner View
            </button>
          </div>
        )}

        {/* Page Content Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8">
          {authLoading ? (
            <div className="min-h-[50vh] flex flex-col items-center justify-center text-slate-600">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white font-extrabold text-xl shadow-lg shadow-emerald-950/40 animate-pulse mb-3">
                KPF
              </div>
              <h2 className="text-sm font-bold text-slate-800 tracking-wide uppercase">Kasthuri Poultry Farm</h2>
              <p className="text-xs text-emerald-600 font-medium mt-1">Verifying secure staff session...</p>
            </div>
          ) : !isAuthenticated ? (
            <div className="min-h-[50vh] flex flex-col items-center justify-center text-slate-600">
              <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold text-lg mb-2">
                KPF
              </div>
              <p className="text-xs text-slate-500 font-medium">Redirecting to Staff Login...</p>
            </div>
          ) : (
            children
          )}
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
              <span className="font-bold text-white text-sm">Kasthuri Poultry Farm (KPF)</span>
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
                      const isActive = currentPath === item.href;
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

            {/* Mobile Role Display & Switcher */}
            <div className="p-4 bg-slate-950 border-t border-slate-800">
              {isAdmin ? (
                <>
                  <div className="text-xs font-semibold text-slate-400 mb-2 flex items-center justify-between">
                    <span>Admin View Mode:</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        !isPreviewingManager
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {!isPreviewingManager ? 'Owner / Admin' : 'Manager Preview'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => switchRole('owner_admin')}
                      className={`py-2 text-xs rounded-md font-medium cursor-pointer ${
                        !isPreviewingManager
                          ? 'bg-emerald-600 text-white font-bold'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      Owner View
                    </button>
                    <button
                      type="button"
                      onClick={() => switchRole('manager')}
                      className={`py-2 text-xs rounded-md font-medium cursor-pointer ${
                        isPreviewingManager
                          ? 'bg-amber-600 text-white font-bold'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      Preview Mgr
                    </button>
                  </div>
                </>
              ) : (
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-slate-400">Assigned Role:</div>
                  <div className="inline-block text-xs font-bold px-2.5 py-1 rounded-md bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    Shed Manager
                  </div>
                </div>
              )}
            </div>
            {/* Mobile Drawer Logout */}
            <div className="p-4 bg-slate-950 border-t border-slate-800">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full py-2.5 px-4 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/40 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out of Session</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile / User Name Modal */}
      <Modal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        title="Edit User Profile & Display Name"
        subtitle="Changes to your user name are immediately saved across the farm system"
      >
        <form onSubmit={handleSaveProfile} className="space-y-4">
          {profileSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{profileSuccess}</span>
            </div>
          )}

          <div>
            <label className="input-label">Your Full Name (Display Name)</label>
            <input
              type="text"
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              placeholder="e.g. Rajesh Kasthuri"
              required
              className="input-field font-semibold text-slate-900"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              Displayed in the navigation header, audit trails, and printed documents
            </span>
          </div>

          <div>
            <label className="input-label">Email Address</label>
            <input
              type="email"
              value={profileEmail}
              onChange={(e) => setProfileEmail(e.target.value)}
              placeholder="user@kasthuripoultry.com"
              required
              className="input-field text-xs font-mono"
            />
          </div>

          <div>
            <label className="input-label">Phone Number</label>
            <input
              type="text"
              value={profilePhone}
              onChange={(e) => setProfilePhone(e.target.value)}
              placeholder="+91 98450 11223"
              className="input-field text-xs font-mono"
            />
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => {
                setProfileModalOpen(false);
                handleLogout();
              }}
              className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2.5 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setProfileModalOpen(false)}
                className="btn-secondary text-xs"
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary text-xs">
                Save Changes
              </button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
