'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useFarm } from '@/lib/data/FarmContext';
import { ManagerVisibilitySettings } from '@/types/database';
import {
  ShieldCheck,
  CheckCircle2,
  Lock,
  Sliders,
  Printer,
  Landmark,
  Receipt,
  Calendar,
  User,
  Save,
  Database,
  ShieldAlert,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import DataResetModal from '@/components/settings/DataResetModal';

type SettingsTab = 'billing' | 'permissions' | 'data_management';

function resolveTab(val: string | null): SettingsTab {
  if (val === 'data_management' || val === 'data-management' || val === 'reset') {
    return 'data_management';
  }
  if (val === 'permissions' || val === 'manage_permissions') {
    return 'permissions';
  }
  return 'billing';
}

function SettingsContent() {
  const {
    visibilitySettings,
    updateVisibilitySettings,
    currentUser,
    updateCurrentUser,
    farmProfile,
    updateFarmProfile,
    isAdmin,
    authLoading,
  } = useFarm();

  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<SettingsTab>(() =>
    resolveTab(searchParams.get('section') || searchParams.get('tab'))
  );

  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [profileForm, setProfileForm] = useState(farmProfile);
  const [userProfileForm, setUserProfileForm] = useState({
    full_name: currentUser.full_name,
    email: currentUser.email,
    phone: currentUser.phone || '',
  });

  const isPermissionsLoaded = !authLoading;
  const canAccessAdmin = isPermissionsLoaded && isAdmin;

  // Sync tab with searchParams on browser back/forward navigation
  useEffect(() => {
    const nextTab = resolveTab(searchParams.get('section') || searchParams.get('tab'));
    setActiveTab(nextTab);
  }, [searchParams]);

  useEffect(() => {
    setProfileForm(farmProfile);
  }, [farmProfile]);

  useEffect(() => {
    setUserProfileForm({
      full_name: currentUser.full_name,
      email: currentUser.email,
      phone: currentUser.phone || '',
    });
  }, [currentUser]);

  const handleTabChange = (tab: SettingsTab) => {
    setActiveTab(tab);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('section', tab);
      url.searchParams.delete('tab');
      window.history.replaceState(null, '', url.pathname + url.search);
    }
  };

  const handleSaveUserProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfileForm.full_name.trim()) {
      alert('Please enter a valid user name.');
      return;
    }
    const res = updateCurrentUser({
      full_name: userProfileForm.full_name.trim(),
      email: userProfileForm.email.trim(),
      phone: userProfileForm.phone.trim(),
    });
    if (res.success) {
      setSuccessMsg(`User profile updated. Active name changed to "${userProfileForm.full_name.trim()}".`);
      setTimeout(() => setSuccessMsg(null), 3500);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateFarmProfile(profileForm);
    setSuccessMsg('Farm profile and bill header configuration saved successfully.');
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const toggle = (key: keyof ManagerVisibilitySettings) => {
    updateVisibilitySettings({ [key]: !visibilitySettings[key] });
    setSuccessMsg(`Setting "${key}" updated.`);
    setTimeout(() => setSuccessMsg(null), 2500);
  };

  const switchOptions = [
    {
      key: 'farm_analytics' as const,
      label: 'Farm-Wide Analytics & Charts Visibility',
      description: 'Allow managers to view live bird charts, mortality trends, and capacity graphs.',
      category: 'Analytics & Trends',
    },
    {
      key: 'financial_dashboard' as const,
      label: 'Financial Dashboard & Commercial Section',
      description: 'Display commercial cards and monthly revenue vs expense figures to managers.',
      category: 'Financial Control',
    },
    {
      key: 'revenue_and_expenses' as const,
      label: 'Revenue & Operating Expenses Ledger',
      description: 'Permit managers to view wholesale egg revenue, bird sales totals, and overhead costs.',
      category: 'Financial Control',
    },
    {
      key: 'profit_loss' as const,
      label: 'Net Profit / Loss Calculations',
      description: 'Allow managers to see the farm net commercial profit margin figures.',
      category: 'Financial Control',
    },
    {
      key: 'customer_supplier_accounts' as const,
      label: 'Customer & Supplier Accounts Ledger',
      description: 'Permit managers to view customer credit limits, outstanding debts, and vendor balances.',
      category: 'Ledger Accounts',
    },
    {
      key: 'purchase_and_payments' as const,
      label: 'Payment Receipts & Supplier Disbursements',
      description: 'Allow managers to access cash, bank, and UPI disbursement histories.',
      category: 'Ledger Accounts',
    },
    {
      key: 'detailed_reports_export' as const,
      label: 'Detailed Reports & CSV Export Access',
      description: 'Permit managers to access all 23 reports and download CSV files.',
      category: 'Reports & Exports',
    },
    {
      key: 'historical_data_access' as const,
      label: 'Historical Archive & Past Flock Records',
      description: 'Allow managers to browse past year flock data and historical batches.',
      category: 'Data Access',
    },
    {
      key: 'shed_level_restrictions_enabled' as const,
      label: 'Shed-Level Access Restriction Enforcement',
      description: 'Restrict managers strictly to their assigned physical sheds (e.g. L1 vs G1).',
      category: 'Access Enforcement',
    },
    {
      key: 'allow_editing_records' as const,
      label: 'Allow Managers to Edit Records',
      description: 'Enable managers to edit daily bird counts, egg collections, feed issues, and operational logs.',
      category: 'Record Editing & Deletion',
    },
    {
      key: 'allow_deleting_eligible_records' as const,
      label: 'Allow Managers to Delete Eligible Records',
      description: 'Enable managers to delete draft records and unposted operational entries.',
      category: 'Record Editing & Deletion',
    },
    {
      key: 'allow_editing_historical_records' as const,
      label: 'Allow Editing Historical Records',
      description: 'Permit managers to modify records from previous days rather than only today.',
      category: 'Record Editing & Deletion',
    },
    {
      key: 'require_approval_for_historical_edits' as const,
      label: 'Require Approval for Historical Edits',
      description: 'Edits to historical data require review and approval by Owner/Admin before taking effect.',
      category: 'Record Editing & Deletion',
    },
    {
      key: 'require_approval_for_sensitive_deletions' as const,
      label: 'Require Approval for Sensitive Deletions',
      description: 'Deletions or cancellations of sales, bird counts, or ledger items require Owner approval.',
      category: 'Record Editing & Deletion',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 1. Shared Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-emerald-600" />
          <span>Kasthuri Poultry Farm — Account & System Settings</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Manage your farm billing header, legal entity details, operational permissions, and administrative data controls.
        </p>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-semibold text-emerald-800 flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* 2. Shared Settings Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => handleTabChange('billing')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'billing'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Billing & Farm Header</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('permissions')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'permissions'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Manage Permissions</span>
        </button>

        {/* Admin-only tab: never shown before permissions are loaded */}
        {canAccessAdmin && (
          <button
            type="button"
            onClick={() => handleTabChange('data_management')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'data_management'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-rose-700 hover:text-rose-900 hover:bg-rose-50'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Data Management</span>
          </button>
        )}
      </div>

      {/* 3. Section 1: Billing & Farm Header */}
      {activeTab === 'billing' && (
        <div className="space-y-6">
          {/* Farm Profile & Bill Printing Configuration Card */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs p-6 space-y-5">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Printer className="w-5 h-5 text-emerald-600" />
                  <h2 className="text-base font-bold text-slate-900">Farm Legal Entity & Bill Printing Configuration</h2>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Configure the official legal entity name, address, GSTIN, and bank remittance account printed on every bill and invoice.
                </p>
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
                Header: {profileForm.farm_name || 'KASTHURI POULTRY FARM'}
              </span>
            </div>

            {!canAccessAdmin ? (
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-3 text-xs text-slate-600">
                  <Lock className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-800">Admin Authorization Required for Edits:</strong> You are viewing the farm legal billing configuration in read-only mode. Only the authenticated Farm Owner/Admin can modify official bill headings and bank details.
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="font-semibold text-slate-500 block text-[11px]">Printed Farm Legal Name:</span>
                    <span className="font-bold text-slate-800 text-sm mt-0.5 block">{farmProfile.farm_name}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="font-semibold text-slate-500 block text-[11px]">Official Tagline:</span>
                    <span className="font-medium text-slate-700 text-xs mt-0.5 block">{farmProfile.tagline || 'Commercial Poultry Producers'}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 md:col-span-2">
                    <span className="font-semibold text-slate-500 block text-[11px]">Farm Registered Address:</span>
                    <span className="font-medium text-slate-700 text-xs mt-0.5 block">{farmProfile.address}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="font-semibold text-slate-500 block text-[11px]">Contact Phone / Mobile:</span>
                    <span className="font-mono text-slate-800 text-xs mt-0.5 block">{farmProfile.phone}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="font-semibold text-slate-500 block text-[11px]">Accounts / Billing Email:</span>
                    <span className="font-mono text-slate-800 text-xs mt-0.5 block">{farmProfile.email}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="font-semibold text-slate-500 block text-[11px]">GSTIN:</span>
                    <span className="font-mono font-bold text-slate-800 text-xs mt-0.5 block">{farmProfile.gstin || '33AAAAK1234A1Z5'}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="font-semibold text-slate-500 block text-[11px]">Bank Remittance Account:</span>
                    <span className="font-mono text-slate-800 text-xs mt-0.5 block">
                      {farmProfile.bank_name} — A/C: {farmProfile.bank_account_no} (IFSC: {farmProfile.bank_ifsc})
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="input-label">Farm Legal Name (Printed Heading)</label>
                    <input
                      type="text"
                      value={profileForm.farm_name}
                      onChange={(e) => setProfileForm({ ...profileForm, farm_name: e.target.value })}
                      required
                      className="input-field font-bold uppercase text-slate-900"
                      placeholder="KASTHURI POULTRY FARM"
                    />
                    <span className="text-[11px] text-slate-400 mt-0.5 block">
                      Primary top title on Egg Bills, Bird Bills, and Purchase Invoices
                    </span>
                  </div>
                  <div>
                    <label className="input-label">Tagline / Business Description</label>
                    <input
                      type="text"
                      value={profileForm.tagline || ''}
                      onChange={(e) => setProfileForm({ ...profileForm, tagline: e.target.value })}
                      className="input-field"
                      placeholder="Wholesale Commercial Egg & Poultry Producers"
                    />
                    <span className="text-[11px] text-slate-400 mt-0.5 block">
                      Sub-heading printed beneath the farm name
                    </span>
                  </div>
                </div>

                <div>
                  <label className="input-label">Official Farm Physical / Correspondence Address</label>
                  <textarea
                    rows={2}
                    value={profileForm.address}
                    onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                    required
                    className="input-field resize-none text-xs"
                    placeholder="SF No. 248/2, Pollachi Main Road, Dharapuram, Tirupur Dist, Tamil Nadu - 638656"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="input-label">Contact Phone / Mobile</label>
                    <input
                      type="text"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      required
                      className="input-field text-xs font-mono"
                      placeholder="+91 98450 11223"
                    />
                  </div>
                  <div>
                    <label className="input-label">Accounts / Billing Email</label>
                    <input
                      type="email"
                      value={profileForm.email}
                      onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                      required
                      className="input-field text-xs font-mono"
                      placeholder="accounts@kasthuripoultry.com"
                    />
                  </div>
                  <div>
                    <label className="input-label">GSTIN (Goods & Services Tax #)</label>
                    <input
                      type="text"
                      value={profileForm.gstin}
                      onChange={(e) => setProfileForm({ ...profileForm, gstin: e.target.value })}
                      className="input-field text-xs font-mono uppercase"
                      placeholder="33AAAAK1234A1Z5"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-1.5 mb-2.5">
                    <Landmark className="w-4 h-4 text-slate-500" />
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Bank Remittance Account (Printed for Customer Direct RTGS / NEFT Payments)
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="input-label text-[11px]">Bank Name</label>
                      <input
                        type="text"
                        value={profileForm.bank_name || ''}
                        onChange={(e) => setProfileForm({ ...profileForm, bank_name: e.target.value })}
                        className="input-field text-xs"
                        placeholder="State Bank of India"
                      />
                    </div>
                    <div>
                      <label className="input-label text-[11px]">Account Number</label>
                      <input
                        type="text"
                        value={profileForm.bank_account_no || ''}
                        onChange={(e) => setProfileForm({ ...profileForm, bank_account_no: e.target.value })}
                        className="input-field text-xs font-mono"
                        placeholder="309811223344"
                      />
                    </div>
                    <div>
                      <label className="input-label text-[11px]">IFSC Code</label>
                      <input
                        type="text"
                        value={profileForm.bank_ifsc || ''}
                        onChange={(e) => setProfileForm({ ...profileForm, bank_ifsc: e.target.value })}
                        className="input-field text-xs font-mono uppercase"
                        placeholder="SBIN0001245"
                      />
                    </div>
                    <div>
                      <label className="input-label text-[11px]">Branch Name</label>
                      <input
                        type="text"
                        value={profileForm.bank_branch || ''}
                        onChange={(e) => setProfileForm({ ...profileForm, bank_branch: e.target.value })}
                        className="input-field text-xs"
                        placeholder="Dharapuram Main Branch"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-1.5 mb-2.5">
                    <Calendar className="w-4 h-4 text-slate-500" />
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Financial Year & Regional Timezone
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="input-label text-[11px]">Financial Year (FY) Start Month</label>
                      <select
                        value={profileForm.fy_start_month || 4}
                        onChange={(e) => setProfileForm({ ...profileForm, fy_start_month: Number(e.target.value) })}
                        className="input-field text-xs font-medium bg-white"
                      >
                        <option value={1}>January (Calendar Year FY: Jan 1 – Dec 31)</option>
                        <option value={4}>April (Indian Standard FY: Apr 1 – Mar 31)</option>
                        <option value={7}>July (Australian / Mid-Year FY: Jul 1 – Jun 30)</option>
                        <option value={10}>October (US Federal FY: Oct 1 – Sep 30)</option>
                      </select>
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        Determines the starting date when "Financial Year" is selected in analytics and reports
                      </span>
                    </div>
                    <div>
                      <label className="input-label text-[11px]">Operating Timezone</label>
                      <select
                        value={profileForm.timezone || 'Asia/Kolkata'}
                        onChange={(e) => setProfileForm({ ...profileForm, timezone: e.target.value })}
                        className="input-field text-xs font-medium bg-white"
                      >
                        <option value="Asia/Kolkata">Asia/Kolkata (IST UTC+05:30)</option>
                        <option value="UTC">UTC (Coordinated Universal Time)</option>
                        <option value="Asia/Dubai">Asia/Dubai (GST UTC+04:00)</option>
                        <option value="Asia/Singapore">Asia/Singapore (SGT UTC+08:00)</option>
                        <option value="Europe/London">Europe/London (GMT/BST)</option>
                        <option value="America/New_York">America/New_York (EST/EDT)</option>
                      </select>
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        Used for date partitioning, midnight roll-overs, and report headers
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-3">
                  <button type="submit" className="btn-primary gap-2 text-xs cursor-pointer">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Save Farm Details & Bill Header</span>
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* User Profile & Name Settings Card */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs p-6 space-y-5">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5 text-emerald-600" />
                  <h2 className="text-base font-bold text-slate-900">My Staff Profile & Account Identity</h2>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Update your display name, contact phone, and account credentials across the farm application.
                </p>
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
                {currentUser.role === 'owner_admin' ? 'Owner / Admin' : 'Manager'}
              </span>
            </div>

            <form onSubmit={handleSaveUserProfile} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="input-label">Your Full Name (Display Name)</label>
                  <input
                    type="text"
                    value={userProfileForm.full_name}
                    onChange={(e) => setUserProfileForm({ ...userProfileForm, full_name: e.target.value })}
                    required
                    className="input-field font-semibold text-slate-900"
                    placeholder="e.g. Rajesh Kasthuri"
                  />
                  <span className="text-[11px] text-slate-400 mt-0.5 block">
                    This name appears on the top navigation bar, bill headers, and audit trails
                  </span>
                </div>
                <div>
                  <label className="input-label">Email Address</label>
                  <input
                    type="email"
                    value={userProfileForm.email}
                    onChange={(e) => setUserProfileForm({ ...userProfileForm, email: e.target.value })}
                    required
                    className="input-field text-xs font-mono"
                    placeholder="user@kasthuripoultry.com"
                  />
                  <span className="text-[11px] text-slate-400 mt-0.5 block">
                    Primary login email and notification destination
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="input-label">Contact Phone / Mobile</label>
                  <input
                    type="text"
                    value={userProfileForm.phone}
                    onChange={(e) => setUserProfileForm({ ...userProfileForm, phone: e.target.value })}
                    className="input-field text-xs font-mono"
                    placeholder="+91 98450 11223"
                  />
                </div>
                <div>
                  <label className="input-label">System Role & Authorization</label>
                  <input
                    type="text"
                    disabled
                    value={currentUser.role === 'owner_admin' ? 'Owner / Full Administrator' : 'Shed Manager'}
                    className="input-field text-xs bg-slate-50 text-slate-600 cursor-not-allowed"
                  />
                  <span className="text-[11px] text-slate-400 mt-0.5 block">
                    Roles are managed under User Management by the Farm Owner
                  </span>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button type="submit" className="btn-primary gap-2 text-xs cursor-pointer">
                  <Save className="w-4 h-4" />
                  <span>Save Staff Name & Profile</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Section 2: Manage Permissions */}
      {activeTab === 'permissions' && (
        <div className="space-y-6">
          {!isPermissionsLoaded ? (
            <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center space-y-3">
              <Loader2 className="w-6 h-6 text-emerald-600 animate-spin mx-auto" />
              <p className="text-xs text-slate-500 font-medium">Verifying permission configuration...</p>
            </div>
          ) : !canAccessAdmin ? (
            <div className="p-8 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-3">
              <Lock className="w-10 h-10 text-slate-400 mx-auto" />
              <h3 className="text-base font-bold text-slate-900">Manager Permissions Configuration</h3>
              <p className="text-xs text-slate-500 max-w-lg mx-auto">
                Manager permissions, feature toggles, and approval workflows require authenticated Owner / Admin authorization. Your current account has Manager access.
              </p>
            </div>
          ) : (
            <>
              {/* Switches Grid */}
              <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden shadow-xs">
                {switchOptions.map((opt) => {
                  const isEnabled = visibilitySettings[opt.key];

                  return (
                    <div key={opt.key} className="p-5 flex items-start justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                      <div className="max-w-xl">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded uppercase">
                            {opt.category}
                          </span>
                          <h3 className="text-sm font-bold text-slate-900">{opt.label}</h3>
                        </div>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">{opt.description}</p>
                      </div>

                      {/* Toggle Switch */}
                      <button
                        type="button"
                        onClick={() => toggle(opt.key)}
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          isEnabled ? 'bg-emerald-600' : 'bg-slate-300'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                            isEnabled ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Security Note */}
              <div className="p-4 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-start gap-3">
                <Sliders className="w-5 h-5 text-slate-500 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-800">Server & Database Level Security:</strong> These visibility switches
                  are bound directly to backend authorization checks and Supabase Row Level Security (RLS) policies.
                  Managers attempting to manipulate API payloads or URLs directly will receive 403 Forbidden responses.
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* 5. Section 3: Data Management (Admin Only) */}
      {activeTab === 'data_management' && (
        <div className="space-y-6">
          {!isPermissionsLoaded ? (
            <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center space-y-3">
              <Loader2 className="w-6 h-6 text-emerald-600 animate-spin mx-auto" />
              <p className="text-xs text-slate-500 font-medium">Verifying administrator permissions...</p>
            </div>
          ) : !canAccessAdmin ? (
            <div className="p-8 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-3">
              <Lock className="w-10 h-10 text-slate-400 mx-auto" />
              <h3 className="text-base font-bold text-slate-900">Admin Access Required</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Operational data management and factory reset functions are strictly restricted to authenticated Farm Owner/Admin accounts. Managers cannot view or execute data resets.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs p-6 space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Database className="w-5 h-5 text-rose-600" />
                    <h2 className="text-base font-bold text-slate-900">Farm Operational Data Management</h2>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Manage transactional data retention, operational cleanup, and factory baseline resets.
                  </p>
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-full flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Admin Only Action</span>
                </span>
              </div>

              {/* Explanation of the reset feature */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  About the Operational Data Reset Feature
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  The operational data reset is designed for resetting production logs, flock transactions, wholesale invoices, feed issues, and operational ledgers back to default baseline (e.g. for testing, commissioning, or starting a clean new cycle).
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
                  <div className="p-3 bg-rose-50/60 border border-rose-200/70 rounded-xl space-y-1">
                    <span className="font-bold text-rose-900 text-[11px] uppercase tracking-wide">Data That Will Be Reset:</span>
                    <p className="text-[11px] text-slate-600 leading-normal">
                      Daily bird mortality, counts, egg collection logs, feed milling & issues, egg and bird sales invoices, supplier purchase bills, payment transactions, and expenses.
                    </p>
                  </div>
                  <div className="p-3 bg-emerald-50/60 border border-emerald-200/70 rounded-xl space-y-1">
                    <span className="font-bold text-emerald-900 text-[11px] uppercase tracking-wide">Data Strictly Preserved:</span>
                    <p className="text-[11px] text-slate-600 leading-normal">
                      All Owner and Manager user accounts, authentication passwords, farm legal profile, physical shed configurations, recipe formulations, and audit logs.
                    </p>
                  </div>
                </div>
              </div>

              {/* Visible warning that this feature is for Admin use only */}
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 space-y-2">
                <div className="flex items-center gap-2 font-bold text-rose-950">
                  <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  <span>Visible Safety Warning: Owner/Administrator Authorization Enforced</span>
                </div>
                <p className="text-[11px] leading-relaxed text-rose-900/90">
                  Only the authenticated Owner/Admin can view and trigger this operation. All data reset requests are validated server-side, cryptographically signed, and recorded in the immutable audit log. Two separate confirmation steps and administrator password re-authentication are required. A single click will never execute a reset.
                </p>
              </div>

              {/* Destructive Action Trigger */}
              <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <div className="text-xs font-bold text-slate-900">Reset Farm Operational Records</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Opens two-step confirmation dialog with typed verification phrase and password check
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setResetModalOpen(true)}
                  className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer flex-shrink-0"
                >
                  <AlertTriangle className="w-4 h-4" />
                  <span>Reset Operational Data...</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Two-Step Confirmation Modal */}
      <DataResetModal
        isOpen={resetModalOpen}
        onClose={() => setResetModalOpen(false)}
        onSuccess={(msg) => {
          setSuccessMsg(msg);
          setTimeout(() => setSuccessMsg(null), 5000);
        }}
      />
    </div>
  );
}

export default function PermissionsAndSettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-slate-500 text-xs">
          Loading Settings & Permissions...
        </div>
      }
    >
      <SettingsContent />
    </Suspense>
  );
}
