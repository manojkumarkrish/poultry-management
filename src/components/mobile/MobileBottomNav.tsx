'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useFarm } from '@/lib/data/FarmContext';
import {
  LayoutDashboard,
  Home,
  ClipboardPen,
  FileSpreadsheet,
  User,
  Layers,
  Wheat,
  Warehouse,
  Egg,
  HeartPulse,
  Scale,
  DollarSign,
  Truck,
  Users,
  Settings,
  LogOut,
  X,
  ChevronRight,
  Shield,
  Smartphone,
  Download,
} from 'lucide-react';

interface MobileBottomNavProps {
  onOpenMenu: () => void;
}

export default function MobileBottomNav({ onOpenMenu }: MobileBottomNavProps) {
  const pathname = usePathname();
  const { currentUser, logout, visibilitySettings } = useFarm();

  const [recordsSheetOpen, setRecordsSheetOpen] = useState(false);
  const [profileSheetOpen, setProfileSheetOpen] = useState(false);

  const isAdmin = currentUser.role === 'owner_admin';
  const canViewReports = isAdmin || visibilitySettings.detailed_reports_export;

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to log out of Kasthuri Poultry Farm?')) {
      setProfileSheetOpen(false);
      await logout();
    }
  };

  const recordsLinks = [
    { label: 'Shed Management', href: '/sheds', icon: Home, desc: 'All Farm Sheds' },
    { label: 'Batches & Flock', href: '/batches', icon: Layers, desc: 'Layer & Grower Batches' },
    { label: 'Feed & Milling', href: '/feed-management', icon: Wheat, desc: 'Formulas & Milling Logs' },
    { label: 'Godown Inventory', href: '/inventory', icon: Warehouse, desc: 'Raw Material Stock' },
    { label: 'Egg Production', href: '/egg-production', icon: Egg, desc: 'Daily Harvest & Trays' },
    { label: 'Health & Vaccine', href: '/health-vaccination', icon: HeartPulse, desc: 'Vaccination Schedules' },
    { label: 'Weight Monitoring', href: '/weight-monitoring', icon: Scale, desc: 'Sample Growth Uniformity' },
    { label: 'Bird Sales', href: '/bird-sales', icon: DollarSign, desc: 'Live Bird Wholesale' },
    { label: 'Suppliers', href: '/suppliers', icon: Truck, desc: 'Feed & Raw Materials', reqFin: true },
    { label: 'Customers', href: '/customers', icon: Users, desc: 'Egg Dealers & Wholesalers', reqFin: true },
  ].filter((item) => {
    if (isAdmin) return true;
    if (item.reqFin && !visibilitySettings.customer_supplier_accounts) return false;
    return true;
  });

  return (
    <>
      {/* Fixed Android Bottom Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 text-slate-300 shadow-2xl px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-1.5 flex items-center justify-around select-none">
        {/* 1. Home / Dashboard */}
        <Link
          href="/"
          onClick={() => {
            setRecordsSheetOpen(false);
            setProfileSheetOpen(false);
          }}
          className={`flex flex-col items-center justify-center min-w-[56px] min-h-[48px] py-1 rounded-xl transition-colors ${
            pathname === '/' && !recordsSheetOpen && !profileSheetOpen
              ? 'text-emerald-400 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Home</span>
        </Link>

        {/* 2. Records Sheet Trigger */}
        <button
          onClick={() => {
            setProfileSheetOpen(false);
            setRecordsSheetOpen(!recordsSheetOpen);
          }}
          className={`flex flex-col items-center justify-center min-w-[56px] min-h-[48px] py-1 rounded-xl transition-colors cursor-pointer ${
            recordsSheetOpen ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
          aria-label="Open farm records"
        >
          <Layers className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Records</span>
        </button>

        {/* 3. Daily Entry - Center Floating Action Button (Large Touch Target) */}
        <Link
          href="/daily-entry"
          onClick={() => {
            setRecordsSheetOpen(false);
            setProfileSheetOpen(false);
          }}
          className="flex flex-col items-center relative -top-3.5 group focus:outline-none"
        >
          <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 group-hover:from-emerald-500 group-hover:to-teal-400 text-white flex items-center justify-center shadow-lg shadow-emerald-950/80 border-4 border-slate-900 transition-transform active:scale-95">
            <ClipboardPen className="w-6 h-6" />
          </div>
          <span className="text-[10px] font-bold text-white mt-0.5 tracking-tight">
            Daily Entry
          </span>
        </Link>

        {/* 4. Reports (If Permitted) or Sheds */}
        <Link
          href={canViewReports ? '/reports' : '/sheds'}
          onClick={() => {
            setRecordsSheetOpen(false);
            setProfileSheetOpen(false);
          }}
          className={`flex flex-col items-center justify-center min-w-[56px] min-h-[48px] py-1 rounded-xl transition-colors ${
            (pathname === '/reports' || pathname === '/sheds') && !recordsSheetOpen && !profileSheetOpen
              ? 'text-emerald-400 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          {canViewReports ? <FileSpreadsheet className="w-5 h-5" /> : <Home className="w-5 h-5" />}
          <span className="text-[10px] mt-0.5">{canViewReports ? 'Reports' : 'Sheds'}</span>
        </Link>

        {/* 5. Profile & Session Sheet Trigger */}
        <button
          onClick={() => {
            setRecordsSheetOpen(false);
            setProfileSheetOpen(!profileSheetOpen);
          }}
          className={`flex flex-col items-center justify-center min-w-[56px] min-h-[48px] py-1 rounded-xl transition-colors cursor-pointer ${
            profileSheetOpen ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
          aria-label="Open profile and account menu"
        >
          <User className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Profile</span>
        </button>
      </nav>

      {/* Records Bottom Sheet */}
      {recordsSheetOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-xs animate-fade-in">
          <div
            className="flex-1"
            onClick={() => setRecordsSheetOpen(false)}
          ></div>
          <div className="bg-slate-900 border-t border-slate-800 rounded-t-3xl max-h-[80vh] overflow-y-auto p-5 text-slate-100 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Farm Records & Modules</h3>
              </div>
              <button
                onClick={() => setRecordsSheetOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pb-6">
              {recordsLinks.map((rec) => {
                const Icon = rec.icon;
                return (
                  <Link
                    key={rec.href}
                    href={rec.href}
                    onClick={() => setRecordsSheetOpen(false)}
                    className="p-3 bg-slate-950/70 hover:bg-slate-800/90 border border-slate-800/80 rounded-2xl flex flex-col justify-between transition-all active:scale-[0.98]"
                  >
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-2">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white leading-tight">{rec.label}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5 truncate">{rec.desc}</div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Profile & Account Bottom Sheet with Clearly Visible Logout Action */}
      {profileSheetOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-xs animate-fade-in">
          <div
            className="flex-1"
            onClick={() => setProfileSheetOpen(false)}
          ></div>
          <div className="bg-slate-900 border-t border-slate-800 rounded-t-3xl max-h-[85vh] overflow-y-auto p-5 text-slate-100 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Staff Profile & Session</h3>
              </div>
              <button
                onClick={() => setProfileSheetOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* User Identity Card */}
            <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl mb-4">
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-sm text-white shadow-md ${
                    currentUser.role === 'owner_admin' ? 'bg-emerald-600' : 'bg-blue-600'
                  }`}
                >
                  {currentUser.role === 'owner_admin' ? 'OA' : 'M'}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-white truncate">{currentUser.full_name}</h4>
                  <p className="text-xs text-slate-400 truncate">{currentUser.email}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        currentUser.role === 'owner_admin'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      }`}
                    >
                      {currentUser.role === 'owner_admin' ? 'Owner / Admin' : 'Shed Manager'}
                    </span>
                  </div>
                </div>
              </div>

              {currentUser.role === 'manager' && (
                <div className="mt-3 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400">
                  <span>Assigned Physical Sheds: </span>
                  <strong className="text-white">
                    {currentUser.assigned_shed_ids && currentUser.assigned_shed_ids.length > 0
                      ? currentUser.assigned_shed_ids.map((id) => id.replace('s-', '')).join(', ')
                      : 'All Active Farm Sheds'}
                  </strong>
                </div>
              )}
            </div>

            {/* Quick Actions List */}
            <div className="space-y-2 mb-5">
              <Link
                href="/settings"
                onClick={() => setProfileSheetOpen(false)}
                className="w-full p-3 bg-slate-950/60 hover:bg-slate-800 border border-slate-800/70 rounded-xl flex items-center justify-between transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Settings className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-semibold text-slate-200">Account & Profile Settings</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </Link>

              {isAdmin && (
                <Link
                  href="/users"
                  onClick={() => setProfileSheetOpen(false)}
                  className="w-full p-3 bg-slate-950/60 hover:bg-slate-800 border border-slate-800/70 rounded-xl flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <Users className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-semibold text-slate-200">Staff Account Administration</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </Link>
              )}
            </div>

            {/* Clearly Visible Logout Button */}
            <button
              onClick={handleLogout}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-rose-700 to-rose-600 hover:from-rose-600 hover:to-rose-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-rose-950/50 flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out of Kasthuri Farm Session</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
