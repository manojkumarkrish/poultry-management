'use client';

import React, { useState } from 'react';
import { useFarm } from '@/lib/data/FarmContext';
import { ManagerVisibilitySettings } from '@/types/database';
import {
  ShieldCheck,
  CheckCircle2,
  Lock,
  Eye,
  EyeOff,
  Sliders,
  DollarSign,
  FileSpreadsheet,
  Users,
  History,
  AlertTriangle,
} from 'lucide-react';

export default function PermissionsAndSettingsPage() {
  const { visibilitySettings, updateVisibilitySettings, currentUser } = useFarm();
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const isAdmin = currentUser.role === 'owner_admin';

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
      key: 'approval_required_for_sensitive' as const,
      label: 'Require Admin Approval for Count Corrections & Deletions',
      description: 'Force any retrospective adjustment of bird count, feed, or sales through an approval queue.',
      category: 'Access Enforcement',
    },
  ];

  if (!isAdmin) {
    return (
      <div className="max-w-2xl mx-auto p-8 bg-white rounded-xl border border-rose-200 text-center">
        <Lock className="w-10 h-10 text-rose-500 mx-auto mb-2" />
        <h2 className="text-base font-bold text-slate-900">Access Restricted</h2>
        <p className="text-xs text-slate-500 mt-1">
          Only the Owner / Administrator has authorization to alter manager visibility switches and system permissions.
          Switch role to "Owner View" using the role switch in the sidebar to test this page.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-emerald-600" />
          <span>Admin Permissions & Manager Visibility Switches</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Independent controls to dynamically configure what Managers can view and execute on the shared unified dashboard
        </p>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-semibold text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

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
    </div>
  );
}
