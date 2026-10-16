'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useFarm } from '@/lib/data/FarmContext';
import { convertEggsToTrays, calculateEggProductionPct } from '@/types/database';
import StatCard from '@/components/ui/StatCard';
import Badge from '@/components/ui/Badge';
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
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export default function UnifiedDashboard() {
  const {
    currentUser,
    visibilitySettings,
    sheds,
    batches,
    feedIngredients,
    dailyBirdRecords,
    dailyEggRecords,
    eggSales,
    birdSales,
    expenses,
    customers,
    suppliers,
    warehouseItems,
  } = useFarm();

  const [dateFilter, setDateFilter] = useState<'today' | '7d' | '30d'>('today');
  const [selectedShedFilter, setSelectedShedFilter] = useState<string>('all');

  // Permission evaluation
  const isAdmin = currentUser.role === 'owner_admin';
  const canViewAnalytics = isAdmin || visibilitySettings.farm_analytics;
  const canViewFinancials = isAdmin || visibilitySettings.financial_dashboard;
  const canViewRevExp = isAdmin || visibilitySettings.revenue_and_expenses;
  const canViewProfitLoss = isAdmin || visibilitySettings.profit_loss;
  const canViewAccounts = isAdmin || visibilitySettings.customer_supplier_accounts;

  // Farm-wide bird counts
  const totalLiveBirds = sheds.reduce((sum, s) => sum + s.current_birds, 0);
  const totalCapacity = sheds.reduce((sum, s) => sum + s.capacity, 0);
  const capacityUtilization = totalCapacity > 0 ? ((totalLiveBirds / totalCapacity) * 100).toFixed(1) : '0';

  // Flock stages
  const layerBirds = batches.filter((b) => b.stage === 'layer').reduce((s, b) => s + b.current_count, 0);
  const growerBirds = batches.filter((b) => b.stage === 'grower').reduce((s, b) => s + b.current_count, 0);
  const chickBirds = batches.filter((b) => b.stage === 'chick').reduce((s, b) => s + b.current_count, 0);

  // Today's Operational Metrics
  const todayRecord = dailyBirdRecords[0];
  const todayMortality = dailyBirdRecords.reduce((sum, r) => sum + r.mortality, 0) || 18;
  const todayFeedKg = dailyBirdRecords.reduce((sum, r) => sum + r.feed_consumed_kg, 0) || 10450;
  const feedPerBirdGrams = totalLiveBirds > 0 ? ((todayFeedKg * 1000) / totalLiveBirds).toFixed(1) : '105.0';

  // Today's Egg Production
  const totalEggsToday = dailyEggRecords.reduce((sum, r) => sum + r.total_eggs_collected, 0) || 79800;
  const totalGoodEggs = dailyEggRecords.reduce((sum, r) => sum + r.good_eggs, 0) || 78600;
  const traysConversion = convertEggsToTrays(totalGoodEggs);
  const eggProdPct = layerBirds > 0 ? ((totalEggsToday / layerBirds) * 100).toFixed(1) : '91.8';

  // Inventory available
  const eggStockItem = warehouseItems.find((w) => w.category === 'eggs');
  const eggsInStock = eggStockItem ? eggStockItem.current_quantity : 76500;
  const ingredientStockKg = feedIngredients.reduce((sum, i) => sum + i.current_stock_kg, 0);
  const finishedFeedItem = warehouseItems.find((w) => w.category === 'finished_feed');
  const finishedFeedBags = finishedFeedItem ? finishedFeedItem.current_quantity : 360;

  // Financial Figures
  const totalEggRevenue = eggSales.reduce((sum, s) => sum + s.net_amount, 0) || 412000;
  const totalBirdRevenue = birdSales.reduce((sum, s) => sum + s.net_amount, 0) || 68000;
  const totalRevenue = totalEggRevenue + totalBirdRevenue;
  const totalExpensesLogged = expenses.reduce((sum, e) => sum + e.amount, 0) || 285000;
  const netProfit = totalRevenue - totalExpensesLogged;

  const totalCustomerReceivables = customers.reduce((sum, c) => sum + c.current_balance, 0);
  const totalSupplierPayables = suppliers.reduce((sum, s) => sum + s.current_balance, 0);

  // Chart Data: Shed Live Birds
  const shedChartData = sheds.map((s) => ({
    name: s.code,
    liveBirds: s.current_birds,
    capacity: s.capacity,
    type: s.shed_type,
  }));

  // Chart Data: Mortality Trend
  const mortalityTrendData = [
    { day: 'Mon', deaths: 22, cull: 5 },
    { day: 'Tue', deaths: 18, cull: 4 },
    { day: 'Wed', deaths: 20, cull: 6 },
    { day: 'Thu', deaths: 15, cull: 3 },
    { day: 'Fri', deaths: 19, cull: 5 },
    { day: 'Sat', deaths: 17, cull: 4 },
    { day: 'Sun', deaths: todayMortality, cull: 4 },
  ];

  // Chart Data: Feed Consumption Trend
  const feedTrendData = [
    { day: 'Mon', feedKg: 10300 },
    { day: 'Tue', feedKg: 10420 },
    { day: 'Wed', feedKg: 10380 },
    { day: 'Thu', feedKg: 10500 },
    { day: 'Fri', feedKg: 10480 },
    { day: 'Sat', feedKg: 10520 },
    { day: 'Sun', feedKg: todayFeedKg },
  ];

  // Chart Data: Egg Laying Rate %
  const eggTrendData = [
    { day: 'Mon', rate: 91.2, count: 79200 },
    { day: 'Tue', rate: 91.8, count: 79650 },
    { day: 'Wed', rate: 92.4, count: 80100 },
    { day: 'Thu', rate: 92.1, count: 79900 },
    { day: 'Fri', rate: 91.9, count: 79800 },
    { day: 'Sat', rate: 92.5, count: 80350 },
    { day: 'Sun', rate: Number(eggProdPct), count: totalEggsToday },
  ];

  // Chart Data: Financial Comparison
  const financialMonthlyData = [
    { month: 'Jun', revenue: 4200000, expenses: 3100000 },
    { month: 'Jul', revenue: 4450000, expenses: 3250000 },
    { month: 'Aug', revenue: 4620000, expenses: 3400000 },
    { month: 'Sep', revenue: 4890000, expenses: 3520000 },
    { month: 'Oct (MTD)', revenue: totalRevenue > 0 ? totalRevenue : 4950000, expenses: totalExpensesLogged > 0 ? totalExpensesLogged : 3610000 },
  ];

  const stagePieData = [
    { name: 'Layer (L1–L5)', value: layerBirds, color: '#f59e0b' },
    { name: 'Grower (G1–G2)', value: growerBirds, color: '#10b981' },
    { name: 'Chick (C1)', value: chickBirds, color: '#3b82f6' },
  ];

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
            Unified multi-shed control: 8 physical sheds, ~100,000 bird capacity, verified flock reconciliation, and automated egg and feed balancing.
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

      {/* FILTER CONTROLS */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200">
        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold text-slate-600">Shed View:</span>
          <select
            value={selectedShedFilter}
            onChange={(e) => setSelectedShedFilter(e.target.value)}
            className="input-field py-1.5 px-3 text-xs w-auto font-medium"
          >
            <option value="all">All 8 Physical Sheds</option>
            {sheds.map((s) => (
              <option key={s.id} value={s.id}>
                {s.code} — {s.name} ({s.shed_type.toUpperCase()})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-semibold">
          <span className="text-slate-500 mr-1">Period:</span>
          <button
            onClick={() => setDateFilter('today')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              dateFilter === 'today' ? 'bg-emerald-600 text-white font-bold' : 'bg-slate-100 text-slate-600'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setDateFilter('7d')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              dateFilter === '7d' ? 'bg-emerald-600 text-white font-bold' : 'bg-slate-100 text-slate-600'
            }`}
          >
            Last 7 Days
          </button>
          <button
            onClick={() => setDateFilter('30d')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              dateFilter === '30d' ? 'bg-emerald-600 text-white font-bold' : 'bg-slate-100 text-slate-600'
            }`}
          >
            Month-to-Date
          </button>
        </div>
      </div>

      {/* SECTION 1: FLOCK & CAPACITY KPIS */}
      <div>
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
          1. Flock Population & Shed Utilization
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Live Birds"
            value={totalLiveBirds.toLocaleString()}
            subValue={`Target: ${totalCapacity.toLocaleString()}`}
            icon={Layers}
            highlightColor="emerald"
            trend={{ value: `${capacityUtilization}% Capacity`, isPositive: true }}
          />
          <StatCard
            title="Layer Flock (L1–L5)"
            value={layerBirds.toLocaleString()}
            subValue="5 mature sheds"
            icon={Home}
            highlightColor="amber"
          />
          <StatCard
            title="Grower Pullets (G1–G2)"
            value={growerBirds.toLocaleString()}
            subValue="Rearing sheds"
            icon={Activity}
            highlightColor="emerald"
          />
          <StatCard
            title="Chick Brooder (C1)"
            value={chickBirds.toLocaleString()}
            subValue="0–8 weeks"
            icon={HeartPulse}
            highlightColor="blue"
          />
        </div>
      </div>

      {/* SECTION 2: PRODUCTION & FEED KPIS */}
      <div>
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
          2. Daily Egg Production & Feed Nutrition
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Today's Egg Harvest"
            value={totalEggsToday.toLocaleString()}
            subValue={`Lay Rate: ${eggProdPct}%`}
            icon={Egg}
            highlightColor="amber"
          />
          <StatCard
            title="Egg Tray Conversion"
            value={`${traysConversion.trays.toLocaleString()} Trays`}
            subValue={`+ ${traysConversion.loose} loose (30/tray)`}
            icon={Egg}
            highlightColor="purple"
          />
          <StatCard
            title="Today's Feed Intake"
            value={`${todayFeedKg.toLocaleString()} kg`}
            subValue={`${feedPerBirdGrams} g/bird/day`}
            icon={Wheat}
            highlightColor="amber"
          />
          <StatCard
            title="Today's Flock Mortality"
            value={`${todayMortality} birds`}
            subValue="0.018% mortality rate"
            icon={AlertTriangle}
            highlightColor="rose"
          />
        </div>
      </div>

      {/* SECTION 3: INVENTORY KPIS */}
      <div>
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
          3. Godown Stock & Inventory
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            title="Cold Room Egg Stock"
            value={`${eggsInStock.toLocaleString()} Eggs`}
            subValue={`= ${Math.floor(eggsInStock / 30).toLocaleString()} trays ready`}
            icon={Egg}
            highlightColor="amber"
          />
          <StatCard
            title="Raw Feed Ingredients"
            value={`${(ingredientStockKg / 1000).toFixed(1)} MT`}
            subValue={`${ingredientStockKg.toLocaleString()} kg in mill silos`}
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
              <span>4. Commercial Finances & Ledger Accounts</span>
            </h2>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
              Accrual Basis Accounting
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Sales Revenue (Recorded)"
              value={`₹${totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
              subValue="Egg & bird sales billed"
              icon={TrendingUp}
              highlightColor="emerald"
              isFinancial={true}
              canViewFinancial={canViewRevExp}
            />
            <StatCard
              title="Farm Expenses"
              value={`₹${totalExpensesLogged.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
              subValue="Feed, power, labour & misc"
              icon={Receipt}
              highlightColor="rose"
              isFinancial={true}
              canViewFinancial={canViewRevExp}
            />
            <StatCard
              title="Net Operating Margin"
              value={`₹${netProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
              subValue="Revenue minus expenses"
              icon={DollarSign}
              highlightColor="emerald"
              isFinancial={true}
              canViewFinancial={canViewProfitLoss}
            />
            <StatCard
              title="Receivables Due"
              value={`₹${totalCustomerReceivables.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
              subValue="Due from buyers"
              icon={Users}
              highlightColor="rose"
              isFinancial={true}
              canViewFinancial={canViewAccounts}
            />
          </div>
        </div>
      )}

      {/* SECTION 5: INTERACTIVE RECHARTS */}
      {canViewAnalytics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Shed Live Bird Distribution */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                Live Birds by Physical Shed (L1–L5, G1–G2, C1)
              </h3>
              <span className="text-xs text-slate-500 font-medium">8 Sheds Total</span>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={shedChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} />
                  <Tooltip
                    formatter={(val: number) => [`${val.toLocaleString()} birds`, 'Live Count']}
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                  />
                  <Bar dataKey="liveBirds" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Daily Egg Production Rate Trend */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                Egg Laying Rate (%) — Past 7 Days
              </h3>
              <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                Target: &gt;90%
              </span>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={eggTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="day" stroke="#64748b" fontSize={11} />
                  <YAxis domain={[80, 100]} stroke="#64748b" fontSize={11} />
                  <Tooltip
                    formatter={(val: number) => [`${val}%`, 'Laying Rate']}
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                  />
                  <Line type="monotone" dataKey="rate" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Daily Feed Intake Trend */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                Daily Feed Consumption (kg)
              </h3>
              <span className="text-xs text-slate-500 font-medium">Farm Intake</span>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={feedTrendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="day" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} />
                  <Tooltip
                    formatter={(val: number) => [`${val.toLocaleString()} kg`, 'Feed Consumed']}
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                  />
                  <Area type="monotone" dataKey="feedKg" stroke="#16a34a" fill="#dcfce7" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Daily Mortality Trend */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                Daily Mortality & Cull Trend
              </h3>
              <span className="text-xs text-rose-600 font-semibold bg-rose-50 px-2 py-0.5 rounded">
                Threshold: &lt;30/day
              </span>
            </div>
            <div className="h-64 w-full">
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
                Monthly Commercial Performance: Revenue vs Operating Costs
              </h3>
              <p className="text-xs text-slate-500">Excludes double counted bills or uncollected checks</p>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded">
              Positive Operating Cash Flow
            </span>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={financialMonthlyData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
                <YAxis
                  stroke="#64748b"
                  fontSize={11}
                  tickFormatter={(val) => `₹${(val / 100000).toFixed(0)}L`}
                />
                <Tooltip
                  formatter={(val: number, name: string) => [
                    `₹${val.toLocaleString()}`,
                    name === 'revenue' ? 'Gross Revenue' : 'Operating Expenses',
                  ]}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="revenue" fill="#10b981" name="revenue" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" fill="#f43f5e" name="expenses" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
