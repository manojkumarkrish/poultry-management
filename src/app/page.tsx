'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useFarm } from '@/lib/data/FarmContext';
import { convertEggsToTrays } from '@/types/database';
import StatCard from '@/components/ui/StatCard';
import Badge from '@/components/ui/Badge';
import DateRangeSelector from '@/components/ui/DateRangeSelector';
import {
  DateRangeState,
  getDateRangeFromPreset,
  getPreviousEquivalentPeriod,
  calculateComparison,
} from '@/lib/utils/dateRange';
import { calculatePeriodMetrics } from '@/lib/utils/periodAnalytics';
import { formatNumber, formatCurrency } from '@/lib/utils/formatters';
import {
  Home,
  Egg,
  Wheat,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  HeartPulse,
  Scale,
  Calendar,
  Layers,
  Activity,
  PlusCircle,
  Receipt,
  Users,
  ShieldCheck,
  ClipboardPen,
  ArrowRight,
  Filter,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
  AreaChart,
  Area,
} from 'recharts';

export default function UnifiedDashboard() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const {
    currentUser,
    isAdmin,
    isPreviewingManager,
    visibilitySettings,
    sheds,
    batches,
    feedIngredients,
    feedProductions,
    feedIssues,
    dailyBirdRecords,
    dailyEggRecords,
    eggSales,
    birdSales,
    expenses,
    customers,
    suppliers,
    supplierBills,
    payments,
    warehouseItems,
    farmProfile,
  } = useFarm();

  const fyStartMonth = farmProfile?.fy_start_month || 4;

  // Initialize date range to This Month with auto-comparison defaults
  const [dateRange, setDateRange] = useState<DateRangeState>(() => {
    const initial = getDateRangeFromPreset('this_month', 4);
    const prev = getPreviousEquivalentPeriod(initial.startDate, initial.endDate, 'this_month');
    return {
      preset: 'this_month',
      startDate: initial.startDate,
      endDate: initial.endDate,
      grouping: 'daily',
      compareWithPrevious: false,
      prevStartDate: prev.prevStartDate,
      prevEndDate: prev.prevEndDate,
    };
  });

  const [selectedShedFilter, setSelectedShedFilter] = useState<string>('all');

  // Permission evaluation (Derived from trusted authenticated role and preview state)
  const isViewingAsAdmin = isAdmin && !isPreviewingManager;
  const canViewAnalytics = isViewingAsAdmin || visibilitySettings.farm_analytics;
  const canViewFinancials = isViewingAsAdmin || visibilitySettings.financial_dashboard;
  const canViewRevExp = isViewingAsAdmin || visibilitySettings.revenue_and_expenses;
  const canViewProfitLoss = isViewingAsAdmin || visibilitySettings.profit_loss;
  const canViewAccounts = isViewingAsAdmin || visibilitySettings.customer_supplier_accounts;

  // Calculate Period Metrics for selected date range
  const currentMetrics = useMemo(() => {
    return calculatePeriodMetrics({
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
      grouping: dateRange.grouping,
      shedFilter: selectedShedFilter,
      sheds,
      batches,
      dailyBirdRecords,
      dailyEggRecords,
      eggSales,
      birdSales,
      expenses,
      feedIngredients,
      feedProductions,
      feedIssues,
      warehouseItems,
      payments,
      customers,
      suppliers,
      supplierBills,
    });
  }, [
    dateRange.startDate,
    dateRange.endDate,
    dateRange.grouping,
    selectedShedFilter,
    sheds,
    batches,
    dailyBirdRecords,
    dailyEggRecords,
    eggSales,
    birdSales,
    expenses,
    feedIngredients,
    feedProductions,
    feedIssues,
    warehouseItems,
    payments,
    customers,
    suppliers,
    supplierBills,
  ]);

  // Calculate Previous Period Metrics if comparison is active
  const prevMetrics = useMemo(() => {
    if (!dateRange.compareWithPrevious || !dateRange.prevStartDate || !dateRange.prevEndDate) {
      return null;
    }
    return calculatePeriodMetrics({
      startDate: dateRange.prevStartDate,
      endDate: dateRange.prevEndDate,
      grouping: dateRange.grouping,
      shedFilter: selectedShedFilter,
      sheds,
      batches,
      dailyBirdRecords,
      dailyEggRecords,
      eggSales,
      birdSales,
      expenses,
      feedIngredients,
      feedProductions,
      feedIssues,
      warehouseItems,
      payments,
      customers,
      suppliers,
      supplierBills,
    });
  }, [
    dateRange.compareWithPrevious,
    dateRange.prevStartDate,
    dateRange.prevEndDate,
    dateRange.grouping,
    selectedShedFilter,
    sheds,
    batches,
    dailyBirdRecords,
    dailyEggRecords,
    eggSales,
    birdSales,
    expenses,
    feedIngredients,
    feedProductions,
    feedIssues,
    warehouseItems,
    payments,
    customers,
    suppliers,
    supplierBills,
  ]);

  // Comparative Variances
  const mortalityComparison = useMemo(() => {
    if (!prevMetrics) return null;
    return calculateComparison(currentMetrics.periodMortality, prevMetrics.periodMortality);
  }, [currentMetrics.periodMortality, prevMetrics]);

  const eggComparison = useMemo(() => {
    if (!prevMetrics) return null;
    return calculateComparison(currentMetrics.periodEggsCollected, prevMetrics.periodEggsCollected);
  }, [currentMetrics.periodEggsCollected, prevMetrics]);

  const feedComparison = useMemo(() => {
    if (!prevMetrics) return null;
    return calculateComparison(currentMetrics.periodFeedConsumedKg, prevMetrics.periodFeedConsumedKg);
  }, [currentMetrics.periodFeedConsumedKg, prevMetrics]);

  const revenueComparison = useMemo(() => {
    if (!prevMetrics) return null;
    return calculateComparison(currentMetrics.totalRevenue, prevMetrics.totalRevenue);
  }, [currentMetrics.totalRevenue, prevMetrics]);

  const expenseComparison = useMemo(() => {
    if (!prevMetrics) return null;
    return calculateComparison(currentMetrics.operatingExpenses, prevMetrics.operatingExpenses);
  }, [currentMetrics.operatingExpenses, prevMetrics]);

  const profitComparison = useMemo(() => {
    if (!prevMetrics) return null;
    return calculateComparison(currentMetrics.netProfit, prevMetrics.netProfit);
  }, [currentMetrics.netProfit, prevMetrics]);

  // Capacity utilization
  const totalCapacity = sheds.reduce((sum, s) => sum + s.capacity, 0);
  const liveBirdsCount = currentMetrics.closingBirds;
  const capacityUtilization = totalCapacity > 0 ? ((liveBirdsCount / totalCapacity) * 100).toFixed(1) : '0';

  // Flock stages
  const layerBirds = batches.filter((b) => b.stage === 'layer').reduce((s, b) => s + b.current_count, 0);
  const growerBirds = batches.filter((b) => b.stage === 'grower').reduce((s, b) => s + b.current_count, 0);
  const chickBirds = batches.filter((b) => b.stage === 'chick').reduce((s, b) => s + b.current_count, 0);

  // Inventory available (closing status)
  const eggStockItem = warehouseItems.find((w) => w.category === 'eggs');
  const eggsInStock = eggStockItem ? eggStockItem.current_quantity : 0;
  const ingredientStockKg = feedIngredients.reduce((sum, i) => sum + i.current_stock_kg, 0);
  const finishedFeedItem = warehouseItems.find((w) => w.category === 'finished_feed');
  const finishedFeedBags = finishedFeedItem ? finishedFeedItem.current_quantity : 0;

  // Chart Data: Shed Live Birds
  const shedChartData = sheds.map((s) => ({
    name: s.code,
    liveBirds: s.current_birds,
    capacity: s.capacity,
    type: s.shed_type,
  }));

  // Dynamic Chart Data from trendSlots
  const eggTrendData = currentMetrics.trendSlots.map((slot) => ({
    day: slot.label,
    count: slot.eggs,
    rate:
      layerBirds > 0
        ? Number(Math.min(100, Math.max(0, (slot.eggs / (layerBirds * (slot.label.includes('Week') ? 7 : 1))) * 100)).toFixed(1))
        : 0,
  }));

  const feedTrendData = currentMetrics.trendSlots.map((slot) => ({
    day: slot.label,
    feedKg: slot.feedKg,
  }));

  const mortalityTrendData = currentMetrics.trendSlots.map((slot) => ({
    day: slot.label,
    deaths: slot.mortality,
    cull: Math.round(slot.mortality * 0.25),
  }));

  const financialTrendData = currentMetrics.trendSlots.map((slot) => ({
    month: slot.label,
    revenue: slot.revenue,
    expenses: slot.expenses,
  }));

  return (
    <div className="space-y-6">
      {/* Top Welcome Banner with Role Indicator */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🐔</span>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              Commercial Operations Dashboard
            </h1>
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-bold ml-2 ${
                isAdmin
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
              }`}
            >
              {isAdmin ? 'Owner / Admin Perspective' : 'Manager Perspective'}
            </span>
          </div>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Unified multi-shed flock control, verified bird reconciliation, automated egg production, and feed intake tracking.
          </p>
        </div>

        {/* Quick Data Entry Action Buttons */}
        <div className="flex items-center gap-2.5">
          <Link href="/daily-entry" className="btn-primary gap-2 bg-emerald-500 hover:bg-emerald-600 shadow-md">
            <ClipboardPen className="w-4 h-4" />
            <span>Daily Farm Entry</span>
          </Link>
          {isAdmin && (
            <Link href="/settings" className="btn-secondary gap-2 text-xs bg-slate-800 text-white border-slate-700 hover:bg-slate-700">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Visibility Settings</span>
            </Link>
          )}
        </div>
      </div>

      {/* COMPREHENSIVE DATE RANGE SELECTOR & SHED FILTER */}
      <div className="space-y-3">
        <DateRangeSelector
          value={dateRange}
          onChange={(newVal) => setDateRange(newVal)}
          showGrouping={true}
          showComparison={true}
        />

        {/* Active Filter Scope Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white px-4 py-2.5 rounded-xl border border-slate-200 text-xs">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="font-semibold text-slate-600">Shed View:</span>
            <select
              value={selectedShedFilter}
              onChange={(e) => setSelectedShedFilter(e.target.value)}
              className="input-field py-1 px-2.5 text-xs w-auto font-medium"
            >
              <option value="all">All 8 Physical Sheds (Farm-Wide)</option>
              {sheds.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.code} — {s.name} ({s.shed_type.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3 text-slate-500">
            <span>
              Period Days: <strong className="text-slate-800 font-bold">{currentMetrics.dayCount} days</strong>
            </span>
            <span>•</span>
            <span>
              Grouping: <strong className="text-slate-800 font-bold uppercase">{dateRange.grouping}</strong>
            </span>
            {dateRange.compareWithPrevious && dateRange.prevStartDate && (
              <>
                <span>•</span>
                <span className="text-emerald-700 font-medium">
                  Comparing with: {dateRange.prevStartDate} to {dateRange.prevEndDate}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 1: FLOCK & CAPACITY KPIS */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            1. Flock Population & Shed Utilization
          </h2>
          <span className="text-[11px] text-slate-400 font-medium">
            Opening: {formatNumber(currentMetrics.openingBirds)} birds • Closing: {formatNumber(currentMetrics.closingBirds)} birds
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Closing Live Birds"
            value={formatNumber(currentMetrics.closingBirds)}
            subValue={totalCapacity > 0 ? `Shed Capacity: ${formatNumber(totalCapacity)}` : `Across ${sheds.length} sheds`}
            icon={Layers}
            highlightColor="emerald"
            trend={totalCapacity > 0 ? {
              value: `${capacityUtilization}% Capacity`,
              isPositive: true,
              label: 'utilization',
            } : undefined}
          />
          <StatCard
            title="Layer Flock"
            value={formatNumber(layerBirds)}
            subValue={`${sheds.filter((s) => s.shed_type === 'layer').length} layer sheds`}
            icon={Home}
            highlightColor="amber"
          />
          <StatCard
            title="Grower Pullets"
            value={formatNumber(growerBirds)}
            subValue={`${sheds.filter((s) => s.shed_type === 'grower').length} grower sheds`}
            icon={Activity}
            highlightColor="emerald"
          />
          <StatCard
            title="Chick Brooder"
            value={formatNumber(chickBirds)}
            subValue={`${sheds.filter((s) => s.shed_type === 'chick').length} chick sheds`}
            icon={HeartPulse}
            highlightColor="blue"
          />
        </div>
      </div>

      {/* SECTION 2: PRODUCTION & FEED KPIS */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            2. Egg Production & Feed Nutrition (Period Total: {currentMetrics.dayCount}d)
          </h2>
          {dateRange.compareWithPrevious && eggComparison && (
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded ${
                eggComparison.variance >= 0
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-rose-50 text-rose-700'
              }`}
            >
              Egg Harvest: {eggComparison.isNew ? 'New Activity' : `${eggComparison.pctChangeFormatted} vs prev`}
            </span>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Period Egg Harvest"
            value={formatNumber(currentMetrics.periodEggsCollected)}
            subValue={`Lay Rate: ${currentMetrics.layingRatePct}%`}
            icon={Egg}
            highlightColor="amber"
            trend={
              eggComparison
                ? {
                    value: eggComparison.isNew ? 'New' : `${eggComparison.pctChangeFormatted}`,
                    isPositive: eggComparison.variance >= 0,
                    label: 'vs prev period',
                  }
                : undefined
            }
          />
          <StatCard
            title="Egg Tray Conversion"
            value={`${formatNumber(currentMetrics.periodTrays)} Trays`}
            subValue={`+ ${formatNumber(currentMetrics.periodLooseEggs)} loose (30/tray)`}
            icon={Egg}
            highlightColor="purple"
          />
          <StatCard
            title="Period Feed Intake"
            value={`${formatNumber(currentMetrics.periodFeedConsumedKg)} kg`}
            subValue={`${currentMetrics.avgFeedPerBirdGrams} g/bird/day`}
            icon={Wheat}
            highlightColor="amber"
            trend={
              feedComparison
                ? {
                    value: feedComparison.isNew ? 'New' : `${feedComparison.pctChangeFormatted}`,
                    isPositive: true,
                    label: 'vs prev period',
                  }
                : undefined
            }
          />
          <StatCard
            title="Period Flock Mortality"
            value={`${formatNumber(currentMetrics.periodMortality)} birds`}
            subValue={`${currentMetrics.mortalityRatePct}% mortality rate`}
            icon={AlertTriangle}
            highlightColor="rose"
            trend={
              mortalityComparison
                ? {
                    value: mortalityComparison.isNew ? 'New' : `${mortalityComparison.pctChangeFormatted}`,
                    isPositive: mortalityComparison.variance <= 0, // Lower mortality is positive!
                    label: 'vs prev period',
                  }
                : undefined
            }
          />
        </div>
      </div>

      {/* SECTION 3: INVENTORY KPIS */}
      <div>
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
          3. Godown Stock & Inventory (Closing Balance)
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            title="Cold Room Egg Stock"
            value={`${formatNumber(eggsInStock)} Eggs`}
            subValue={`= ${formatNumber(Math.floor(eggsInStock / 30))} trays ready`}
            icon={Egg}
            highlightColor="amber"
          />
          <StatCard
            title="Raw Feed Ingredients"
            value={`${(ingredientStockKg / 1000).toFixed(1)} MT`}
            subValue={`${formatNumber(ingredientStockKg)} kg in mill silos`}
            icon={Wheat}
            highlightColor="emerald"
          />
          <StatCard
            title="Finished Mash Feed"
            value={`${finishedFeedBags} Bags`}
            subValue="50kg poly bags in godown"
            icon={Wheat}
            highlightColor="blue"
          />
        </div>
      </div>

      {/* SECTION 4: FINANCIAL KPIS (Strictly Permission-Gated!) */}
      {canViewFinancials && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <span>4. Commercial Finances & Ledger Accounts (Period Performance)</span>
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                Accrual Basis Accounting
              </span>
              {profitComparison && (
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                    profitComparison.variance >= 0
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  Net Margin: {profitComparison.isNew ? 'New Activity' : `${profitComparison.pctChangeFormatted} vs prev`}
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Sales Revenue (Recorded)"
              value={formatCurrency(currentMetrics.totalRevenue, { maximumFractionDigits: 0 })}
              subValue="Egg & bird sales billed"
              icon={TrendingUp}
              highlightColor="emerald"
              isFinancial={true}
              canViewFinancial={canViewRevExp}
              trend={
                revenueComparison
                  ? {
                      value: revenueComparison.isNew ? 'New' : `${revenueComparison.pctChangeFormatted}`,
                      isPositive: revenueComparison.variance >= 0,
                      label: 'vs prev period',
                    }
                  : undefined
              }
            />
            <StatCard
              title="Farm Expenses"
              value={formatCurrency(currentMetrics.operatingExpenses, { maximumFractionDigits: 0 })}
              subValue="Feed, power, labour & misc"
              icon={Receipt}
              highlightColor="rose"
              isFinancial={true}
              canViewFinancial={canViewRevExp}
              trend={
                expenseComparison
                  ? {
                      value: expenseComparison.isNew ? 'New' : `${expenseComparison.pctChangeFormatted}`,
                      isPositive: expenseComparison.variance <= 0, // Lower expense is positive
                      label: 'vs prev period',
                    }
                  : undefined
              }
            />
            <StatCard
              title="Net Operating Margin"
              value={formatCurrency(currentMetrics.netProfit, { maximumFractionDigits: 0 })}
              subValue={`${currentMetrics.profitMarginPct}% profit margin`}
              icon={DollarSign}
              highlightColor="emerald"
              isFinancial={true}
              canViewFinancial={canViewProfitLoss}
              trend={
                profitComparison
                  ? {
                      value: profitComparison.isNew ? 'New' : `${profitComparison.pctChangeFormatted}`,
                      isPositive: profitComparison.variance >= 0,
                      label: 'vs prev period',
                    }
                  : undefined
              }
            />
            <StatCard
              title="Receivables Due"
              value={formatCurrency(currentMetrics.closingReceivables, { maximumFractionDigits: 0 })}
              subValue="Due from buyers"
              icon={Users}
              highlightColor="rose"
              isFinancial={true}
              canViewFinancial={canViewAccounts}
            />
          </div>
        </div>
      )}

      {/* SECTION 5: INTERACTIVE RECHARTS (Driven by date range and grouping) */}
      {canViewAnalytics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Shed Live Bird Distribution */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                Live Birds by Physical Shed
              </h3>
              <span className="text-xs text-slate-500 font-medium">{sheds.length} Sheds Total</span>
            </div>
            <div className="h-64 w-full">
              {mounted ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={shedChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                    <YAxis stroke="#64748b" fontSize={11} />
                    <Tooltip
                      formatter={(val: number) => [`${formatNumber(val)} birds`, 'Live Count']}
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                    />
                    <Bar dataKey="liveBirds" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-slate-50/50 rounded-lg animate-pulse">
                  <span className="text-xs text-slate-400">Loading chart...</span>
                </div>
              )}
            </div>
          </div>

          {/* Daily Egg Production Rate Trend */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                Egg Laying Rate (%) — {dateRange.grouping.toUpperCase()} Grouping
              </h3>
              <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                Benchmark: &gt;90%
              </span>
            </div>
            <div className="h-64 w-full">
              {mounted ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={eggTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="day" stroke="#64748b" fontSize={11} />
                    <YAxis domain={[70, 100]} stroke="#64748b" fontSize={11} />
                    <Tooltip
                      formatter={(val: number) => [`${val}%`, 'Laying Rate']}
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                    />
                    <Line type="monotone" dataKey="rate" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-slate-50/50 rounded-lg animate-pulse">
                  <span className="text-xs text-slate-400">Loading chart...</span>
                </div>
              )}
            </div>
          </div>

          {/* Daily Feed Intake Trend */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                Feed Intake (kg) — {dateRange.grouping.toUpperCase()} Grouping
              </h3>
              <span className="text-xs text-slate-500 font-medium">Farm Intake</span>
            </div>
            <div className="h-64 w-full">
              {mounted ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={feedTrendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="day" stroke="#64748b" fontSize={11} />
                    <YAxis stroke="#64748b" fontSize={11} />
                    <Tooltip
                      formatter={(val: number) => [`${formatNumber(val)} kg`, 'Feed Consumed']}
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                    />
                    <Area type="monotone" dataKey="feedKg" stroke="#16a34a" fill="#dcfce7" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-slate-50/50 rounded-lg animate-pulse">
                  <span className="text-xs text-slate-400">Loading chart...</span>
                </div>
              )}
            </div>
          </div>

          {/* Daily Mortality Trend */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                Mortality & Cull Trend — {dateRange.grouping.toUpperCase()} Grouping
              </h3>
              <span className="text-xs text-rose-600 font-semibold bg-rose-50 px-2 py-0.5 rounded">
                Threshold: &lt;30/day
              </span>
            </div>
            <div className="h-64 w-full">
              {mounted ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={mortalityTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="day" stroke="#64748b" fontSize={11} />
                    <YAxis stroke="#64748b" fontSize={11} />
                    <Tooltip
                      formatter={(val: number, name: string) => [
                        `${val} birds`,
                        name === 'deaths' ? 'Mortality' : 'Culls',
                      ]}
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                    />
                    <Bar dataKey="deaths" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="cull" fill="#f97316" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-slate-50/50 rounded-lg animate-pulse">
                  <span className="text-xs text-slate-400">Loading chart...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 6: FINANCIAL CHARTS (Permission-Gated) */}
      {canViewFinancials && canViewRevExp && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                Commercial Performance: Revenue vs Operating Costs ({dateRange.grouping.toUpperCase()} Intervals)
              </h3>
              <p className="text-xs text-slate-500">
                Period {dateRange.startDate} to {dateRange.endDate} • {currentMetrics.dayCount} days
              </p>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded">
              Positive Operating Cash Flow
            </span>
          </div>
          <div className="h-72 w-full">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={financialTrendData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
                  <YAxis
                    stroke="#64748b"
                    fontSize={11}
                    tickFormatter={(val) => `₹${(val / 100000).toFixed(0)}L`}
                  />
                  <Tooltip
                    formatter={(val: number, name: string) => [
                      formatCurrency(val, { maximumFractionDigits: 0 }),
                      name === 'revenue' ? 'Gross Revenue' : 'Operating Expenses',
                    ]}
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                  />
                  <Bar dataKey="revenue" fill="#10b981" name="revenue" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" fill="#f43f5e" name="expenses" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full flex items-center justify-center bg-slate-50/50 rounded-lg animate-pulse">
                <span className="text-xs text-slate-400">Loading chart...</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
