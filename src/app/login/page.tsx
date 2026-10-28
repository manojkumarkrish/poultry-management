'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFarm } from '@/lib/data/FarmContext';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  LogIn,
  AlertCircle,
  CheckCircle2,
  Shield,
  HelpCircle,
  X,
  Loader2,
} from 'lucide-react';

function getTargetUrl(): string {
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const fromParam = params.get('from');
    if (fromParam && fromParam !== '/login' && fromParam.startsWith('/')) {
      return fromParam;
    }
  }
  return '/';
}

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, authLoading, resetPassword } = useFarm();

  const [from, setFrom] = useState('/');
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<{ email?: string; password?: string }>({});

  // Forgot password modal
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetStatus, setResetStatus] = useState<{ loading: boolean; success?: string; error?: string }>({
    loading: false,
  });

  useEffect(() => {
    setFrom(getTargetUrl());
  }, []);

  // If already authenticated, redirect immediately to target
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      const destination = getTargetUrl();
      window.location.href = destination;
    }
  }, [isAuthenticated, authLoading]);

  const validate = () => {
    const errors: { email?: string; password?: string } = {};
    if (!emailOrUsername.trim()) {
      errors.email = 'Please enter your username or registered email address.';
    }
    if (!password) {
      errors.password = 'Please enter your account password.';
    } else if (password.length < 4) {
      errors.password = 'Password must be at least 4 characters.';
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!validate()) return;

    setLoading(true);
    try {
      const res = await login(emailOrUsername.trim(), password);
      if (res.success) {
        const destination = getTargetUrl();
        window.location.href = destination;
      } else {
        const msg = res.error === 'fetch failed'
          ? 'Unable to reach the authentication service. Please check your network connection.'
          : (res.error || 'Invalid credentials. Please verify your email and password.');
        setErrorMessage(msg);
      }
    } catch (err: any) {
      const msg = err?.message === 'fetch failed'
        ? 'Unable to reach the authentication service. Please check your network connection.'
        : (err?.message || 'An unexpected error occurred during login. Please try again.');
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) return;

    setResetStatus({ loading: true });
    try {
      const res = await resetPassword(resetEmail.trim());
      if (res.success) {
        setResetStatus({
          loading: false,
          success: res.message || 'Password reset request recorded successfully.',
        });
      } else {
        setResetStatus({
          loading: false,
          error: res.error || 'Failed to submit reset request.',
        });
      }
    } catch (e: any) {
      setResetStatus({ loading: false, error: e.message || 'Error processing request.' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 flex flex-col justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8 text-slate-100 font-sans selection:bg-emerald-500 selection:text-white">
      {/* Background Decorative Rings */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-25">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-emerald-500/20 blur-3xl"></div>
        <div className="absolute top-1/2 -right-32 w-96 h-96 rounded-full bg-teal-500/20 blur-3xl"></div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        {/* Farm Emblem & Brand Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-white font-extrabold text-2xl shadow-xl shadow-emerald-950/60 ring-4 ring-emerald-500/20 mb-3">
            KPF
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight uppercase">
            Kasthuri Poultry Farm
          </h1>
          <p className="text-xs sm:text-sm font-medium text-emerald-400 mt-1 flex items-center justify-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Commercial Operations Portal</span>
          </p>
        </div>

        {/* Card Form */}
        <div className="mt-6 bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/60 relative overflow-hidden">
          {/* Subtle Top Accent */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600"></div>

          <div className="mb-5 text-center">
            <h2 className="text-base font-bold text-white">Staff Credential Login</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Sign in with your authorized farm account to access dashboard and shed entry forms
            </p>
          </div>

          {/* Error Alert Banner */}
          {errorMessage && (
            <div className="mb-5 p-3.5 bg-rose-950/70 border border-rose-500/40 rounded-xl text-rose-200 text-xs flex items-start gap-2.5 animate-shake">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">{errorMessage}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email / Username Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Username or Registered Email
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  autoComplete="username"
                  autoCapitalize="none"
                  value={emailOrUsername}
                  onChange={(e) => {
                    setEmailOrUsername(e.target.value);
                    if (validationErrors.email) setValidationErrors({ ...validationErrors, email: undefined });
                  }}
                  placeholder="Enter username or registered email"
                  className={`w-full pl-10 pr-3.5 py-2.5 bg-slate-950/80 border rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all ${
                    validationErrors.email ? 'border-rose-500/80 focus:border-rose-500' : 'border-slate-800 focus:border-emerald-500'
                  }`}
                />
              </div>
              {validationErrors.email && (
                <p className="text-[11px] text-rose-400 mt-1 pl-1">{validationErrors.email}</p>
              )}
            </div>

            {/* Password Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Account Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setForgotModalOpen(true);
                    setResetStatus({ loading: false });
                  }}
                  className="text-[11px] text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (validationErrors.password) setValidationErrors({ ...validationErrors, password: undefined });
                  }}
                  placeholder="••••••••••••"
                  className={`w-full pl-10 pr-10 py-2.5 bg-slate-950/80 border rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all ${
                    validationErrors.password ? 'border-rose-500/80 focus:border-rose-500' : 'border-slate-800 focus:border-emerald-500'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {validationErrors.password && (
                <p className="text-[11px] text-rose-400 mt-1 pl-1">{validationErrors.password}</p>
              )}
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-emerald-600 focus:ring-emerald-500 focus:ring-offset-slate-900"
                />
                <span className="text-xs text-slate-400">Keep me logged in on this device</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Sign In to Kasthuri Farm</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Security & PWA Footer Notice */}
        <div className="mt-6 text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 text-[11px] text-slate-400 bg-slate-900/60 px-3 py-1.5 rounded-full border border-slate-800">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>Installable Android PWA • Standalone Window • Offline Capable</span>
          </div>
          <p className="text-[10px] text-slate-400">
            Kasthuri Poultry Farm Management System v2.0 • Role-based access control & Postgres RLS secured
          </p>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {forgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-2xl p-5 shadow-2xl relative">
            <button
              onClick={() => setForgotModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-md"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <HelpCircle className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-white">Reset Farm Account Password</h3>
            </div>

            {resetStatus.success ? (
              <div className="space-y-3">
                <div className="p-3 bg-emerald-950/60 border border-emerald-500/30 rounded-xl text-emerald-200 text-xs flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>{resetStatus.success}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setForgotModalOpen(false)}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold"
                >
                  Back to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handleResetSubmit} className="space-y-3">
                <p className="text-xs text-slate-400 leading-relaxed">
                  Enter your registered farm email address. The Farm Owner/Administrator will authorize and issue an updated credential.
                </p>

                {resetStatus.error && (
                  <div className="p-2.5 bg-rose-950/70 border border-rose-500/40 rounded-lg text-rose-300 text-[11px]">
                    {resetStatus.error}
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Registered Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="user@kasthuripoultry.com"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setForgotModalOpen(false)}
                    className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={resetStatus.loading}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg shadow-sm flex items-center gap-1.5"
                  >
                    {resetStatus.loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                    <span>Request Reset</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
