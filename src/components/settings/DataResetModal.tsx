'use client';

import React, { useState } from 'react';
import {
  AlertTriangle,
  X,
  CheckCircle2,
  Lock,
  Eye,
  EyeOff,
  ShieldAlert,
  Loader2,
  ArrowRight,
  Database,
  Check,
} from 'lucide-react';
import { useFarm } from '@/lib/data/FarmContext';

interface DataResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export default function DataResetModal({
  isOpen,
  onClose,
  onSuccess,
}: DataResetModalProps) {
  const { resetOperationalData, authenticatedUser, isAdmin } = useFarm();

  const [step, setStep] = useState<1 | 2>(1);
  const [typedPhrase, setTypedPhrase] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleClose = () => {
    if (isProcessing) return; // Prevent closing while processing
    setStep(1);
    setTypedPhrase('');
    setAdminPassword('');
    setShowPassword(false);
    setErrorMessage(null);
    onClose();
  };

  const handleProceedToFinalStep = () => {
    setErrorMessage(null);
    setStep(2);
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isProcessing) return;

    if (typedPhrase.trim().toUpperCase() !== 'RESET KPF DATA') {
      setErrorMessage('You must type "RESET KPF DATA" to proceed.');
      return;
    }

    if (!adminPassword.trim()) {
      setErrorMessage('Please enter your Farm Owner / Admin account password.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const res = await resetOperationalData(typedPhrase.trim(), adminPassword.trim());
      if (res.success) {
        onSuccess(
          res.message ||
            'All farm operational records, sales, batches, and bird counts have been permanently reset to zero.'
        );
        handleClose();
      } else {
        setErrorMessage(res.error || 'Failed to complete operational reset.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred during data reset.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs transition-opacity"
          onClick={handleClose}
        />

        {/* Modal Dialog */}
        <div className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all sm:my-8 w-full max-w-xl border border-slate-200 z-10">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold ${
                  step === 1
                    ? 'bg-amber-100 text-amber-700 border border-amber-200'
                    : 'bg-rose-100 text-rose-700 border border-rose-200'
                }`}
              >
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  {step === 1
                    ? 'Reset Operational Data — Step 1 of 2'
                    : 'Final Authorization Required — Step 2 of 2'}
                </h3>
                <p className="text-[11px] text-slate-500">
                  {step === 1
                    ? 'Review data categories to be reset and preserved'
                    : 'Type verification phrase & re-authenticate password'}
                </p>
              </div>
            </div>

            <button
              onClick={handleClose}
              disabled={isProcessing}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/60 transition-colors disabled:opacity-40"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Error Message Alert */}
          {errorMessage && (
            <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-start gap-2.5 animate-shake">
              <ShieldAlert className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{errorMessage}</div>
            </div>
          )}

          {/* STEP 1: Explanatory Breakdown Modal */}
          {step === 1 && (
            <div className="p-6 space-y-5">
              <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl text-amber-900 text-xs space-y-1">
                <p className="font-bold flex items-center gap-1.5 text-amber-950">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>Administrative Warning: High-Impact Operation</span>
                </p>
                <p className="text-[11px] leading-relaxed text-amber-900/90">
                  This action permanently removes operational records across the farm system.
                  Please carefully review the affected categories below before continuing to the final confirmation.
                </p>
              </div>

              {/* Data Scope Comparison Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                {/* Affected Column */}
                <div className="p-3.5 rounded-xl bg-rose-50/50 border border-rose-200/80 space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-rose-800 text-[11px] uppercase tracking-wider">
                    <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                    <span>Will Be Reset / Cleared</span>
                  </div>
                  <ul className="space-y-1.5 text-[11px] text-slate-700 list-disc list-inside">
                    <li>All live bird counts (reset to 0 across all sheds)</li>
                    <li>All flock batches (reset to clean zero slate)</li>
                    <li>Daily egg collection, trays & damaged egg tallies</li>
                    <li>Wholesale egg sales & live bird sales invoices</li>
                    <li>Feed milling, issues & ingredient stock (0 kg)</li>
                    <li>Supplier purchase bills & payment receipts</li>
                    <li>Operational expense vouchers & electricity bills</li>
                    <li>Customer & supplier trading balances</li>
                  </ul>
                </div>

                {/* Preserved Column */}
                <div className="p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-200/80 space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-800 text-[11px] uppercase tracking-wider">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span>Strictly Preserved (Safe)</span>
                  </div>
                  <ul className="space-y-1.5 text-[11px] text-slate-700 list-disc list-inside">
                    <li>All Admin & Manager accounts</li>
                    <li>User passwords & authentication sessions</li>
                    <li>Farm profile (Name, GSTIN, Bank, Address)</li>
                    <li>Physical shed definitions & capacities</li>
                    <li>Feed ingredient catalog & recipes</li>
                    <li>Manager permissions & visibility rules</li>
                    <li>Full immutable system audit trail</li>
                  </ul>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel & Return
                </button>
                <button
                  type="button"
                  onClick={handleProceedToFinalStep}
                  className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Continue to Final Confirmation</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Typed Confirmation Phrase & Password Re-Authentication */}
          {step === 2 && (
            <form onSubmit={handleFinalSubmit} className="p-6 space-y-5">
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 text-xs space-y-1">
                <p className="font-bold flex items-center gap-1.5 text-rose-950">
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  <span>This action cannot be easily undone.</span>
                </p>
                <p className="text-[11px] leading-relaxed text-rose-900/90">
                  Operational records will be reset to factory baseline. To prevent accidental execution,
                  you must type the exact confirmation phrase and authorize with your Admin password.
                </p>
              </div>

              {/* Typed Phrase Box */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-800">
                    Type <span className="font-mono text-rose-700 font-extrabold bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">RESET KPF DATA</span> below to confirm:
                  </label>
                  <button
                    type="button"
                    onClick={() => setTypedPhrase('RESET KPF DATA')}
                    className="text-[11px] text-rose-600 hover:text-rose-800 underline font-semibold cursor-pointer"
                  >
                    Auto-fill
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    autoFocus
                    autoComplete="off"
                    value={typedPhrase}
                    onChange={(e) => {
                      setTypedPhrase(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    placeholder="RESET KPF DATA"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm font-mono tracking-wider transition-all focus:outline-none focus:ring-2 ${
                      typedPhrase.trim().toUpperCase() === 'RESET KPF DATA'
                        ? 'border-emerald-500 bg-emerald-50/20 text-emerald-900 focus:ring-emerald-500/30'
                        : 'border-slate-300 bg-white text-slate-900 focus:ring-rose-500/30 focus:border-rose-500'
                    }`}
                  />
                  {typedPhrase.trim().toUpperCase() === 'RESET KPF DATA' && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-emerald-600">
                      <Check className="w-4 h-4" />
                    </div>
                  )}
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Confirmation phrase is case-insensitive (spaces trimmed automatically)
                </span>
              </div>

              {/* Admin Password Re-Authentication */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Authorize with Farm Owner / Admin Password:
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={adminPassword}
                    onChange={(e) => {
                      setAdminPassword(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    placeholder="Enter your administrator password"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Session owner: {authenticatedUser.email || 'Farm Administrator'}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => setStep(1)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-40"
                >
                  ← Back to Step 1
                </button>
                <button
                  type="submit"
                  disabled={
                    typedPhrase.trim().toUpperCase() !== 'RESET KPF DATA' ||
                    adminPassword.trim().length === 0 ||
                    isProcessing
                  }
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Executing Transactional Reset...</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4" />
                      <span>Permanently Reset Operational Data</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
