'use client';

import React, { useState, useMemo } from 'react';
import { useFarm } from '@/lib/data/FarmContext';
import Badge from '@/components/ui/Badge';
import DateRangeSelector from '@/components/ui/DateRangeSelector';
import {
  DateRangePreset,
  GroupingInterval,
  DateRangeState,
  getDateRangeFromPreset,
  getPreviousEquivalentPeriod,
  calculateComparison,
  parseISODate,
} from '@/lib/utils/dateRange';
import { convertEggsToTrays } from '@/types/database';
import { formatNumber, formatCurrency, formatDateTime } from '@/lib/utils/formatters';
import {
  FileSpreadsheet,
  Calendar,
  Filter,
  Search,
  Printer,
  Download,
  DollarSign,
  Layers,
  Egg,
  Wheat,
  Activity,
  AlertTriangle,
  HeartPulse,
  Scale,
  Receipt,
  Users,
  ShieldAlert,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Building2,
} from 'lucide-react';

export default function ReportsAndAnalyticsPage() {
  const {
    sheds,
    batches,
    dailyBirdRecords,
    dailyEggRecords,
    feedIngredients,
    feedProductions,
    feedIssues,
    warehouseItems,
    eggSales,
    birdSales,
    suppliers,
    supplierBills,
    payments,
    customers,
    expenses,
    electricityBills,
    salaries,
    vaccinationRecords,
    healthEvents,
    weightRecords,
    auditLogs,
    currentUser,
    isAdmin,
    isPreviewingManager,
    visibilitySettings,
    farmProfile,
  } = useFarm();

  const fyStartMonth = farmProfile?.fy_start_month || 4;

  const [selectedReportId, setSelectedReportId] = useState<string>('daily_farm_report');
  const [selectedShed, setSelectedShed] = useState<string>('all');
  const [selectedBatch, setSelectedBatch] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Date range filter state with 14 presets and comparison options
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

  // Role permissions (Server-authoritative check)
  const isViewingAsAdmin = isAdmin && !isPreviewingManager;
  const canViewFinancials = isViewingAsAdmin || visibilitySettings.financial_dashboard;
  const canViewRevExp = isViewingAsAdmin || visibilitySettings.revenue_and_expenses;
  const canViewProfitLoss = isViewingAsAdmin || visibilitySettings.profit_loss;
  const canViewAccounts = isViewingAsAdmin || visibilitySettings.customer_supplier_accounts;

  const reportsList = [
    { id: 'daily_farm_report', name: '1. Daily Farm Report', category: 'Operations' },
    { id: 'shed_bird_report', name: '2. Shed-Wise Bird Report', category: 'Flock' },
    { id: 'batch_lifecycle', name: '3. Batch Lifecycle Report', category: 'Flock' },
    { id: 'daily_mortality', name: '4. Daily Mortality Report', category: 'Flock' },
    { id: 'feed_consumption', name: '5. Feed Consumption Report', category: 'Feeds' },
    { id: 'feed_production_cost', name: '6. Feed Production & Cost Report', category: 'Feeds' },
    { id: 'ingredient_stock', name: '7. Ingredient Stock Report', category: 'Feeds' },
    { id: 'godown_movements', name: '8. Godown Stock Movement Report', category: 'Inventory' },
    { id: 'daily_egg_production', name: '9. Daily Egg Production Report', category: 'Eggs' },
    { id: 'egg_stock_sales', name: '10. Egg Stock & Sales Report', category: 'Eggs' },
    { id: 'bird_sales_report', name: '11. Bird Sales Report', category: 'Sales' },
    { id: 'vaccination_report', name: '12. Vaccination Due & Completed Report', category: 'Health' },
    { id: 'health_treatment', name: '13. Health & Treatment Report', category: 'Health' },
    { id: 'weight_monitoring', name: '14. Weight Monitoring Report', category: 'Health' },
    { id: 'supplier_payables', name: '15. Supplier Payable Report', category: 'Finance', financial: true },
    { id: 'customer_receivables', name: '16. Customer Receivable Report', category: 'Finance', financial: true },
    { id: 'expense_report', name: '17. Expense Report', category: 'Finance', financial: true },
    { id: 'electricity_report', name: '18. Electricity Report', category: 'Finance', financial: true },
    { id: 'labour_salary_report', name: '19. Labour and Salary Report', category: 'Finance', financial: true },
    { id: 'batch_cost_report', name: '20. Batch-Wise Cost Report', category: 'Finance', financial: true },
    { id: 'shed_profitability', name: '21. Shed-Wise Profitability Report', category: 'Finance', financial: true },
    { id: 'monthly_financial', name: '22. Monthly & Yearly Financial Report', category: 'Finance', financial: true },
    { id: 'audit_correction_report', name: '23. Audit & Correction Report', category: 'Admin' },
  ];

  const activeReportMeta = reportsList.find((r) => r.id === selectedReportId) || reportsList[0];

  // Helper date checker
  const inRange = (d?: string) => {
    if (!d) return false;
    return d >= dateRange.startDate && d <= dateRange.endDate;
  };

  const inPrevRange = (d?: string) => {
    if (!d || !dateRange.prevStartDate || !dateRange.prevEndDate) return false;
    return d >= dateRange.prevStartDate && d <= dateRange.prevEndDate;
  };

  // Month-level date checker for billing_month / salary month (YYYY-MM)
  const inMonthRange = (m?: string) => {
    if (!m) return false;
    const startM = dateRange.startDate.slice(0, 7);
    const endM = dateRange.endDate.slice(0, 7);
    return m >= startM && m <= endM;
  };

  // Helper shed checker
  const matchesShed = (shedId?: string) => {
    if (selectedShed === 'all') return true;
    return shedId === selectedShed;
  };

  // Filtered Datasets across all 23 reports
  const filteredDailyBirds = useMemo(() => {
    return dailyBirdRecords.filter((r) => inRange(r.record_date) && matchesShed(r.shed_id));
  }, [dailyBirdRecords, dateRange.startDate, dateRange.endDate, selectedShed]);

  const prevDailyBirds = useMemo(() => {
    if (!dateRange.compareWithPrevious) return [];
    return dailyBirdRecords.filter((r) => inPrevRange(r.record_date) && matchesShed(r.shed_id));
  }, [dailyBirdRecords, dateRange.compareWithPrevious, dateRange.prevStartDate, dateRange.prevEndDate, selectedShed]);

  const filteredDailyEggs = useMemo(() => {
    return dailyEggRecords.filter((r) => inRange(r.collection_date) && matchesShed(r.shed_id));
  }, [dailyEggRecords, dateRange.startDate, dateRange.endDate, selectedShed]);

  const prevDailyEggs = useMemo(() => {
    if (!dateRange.compareWithPrevious) return [];
    return dailyEggRecords.filter((r) => inPrevRange(r.collection_date) && matchesShed(r.shed_id));
  }, [dailyEggRecords, dateRange.compareWithPrevious, dateRange.prevStartDate, dateRange.prevEndDate, selectedShed]);

  const filteredFeedProductions = useMemo(() => {
    return feedProductions.filter((p) => inRange(p.production_date));
  }, [feedProductions, dateRange.startDate, dateRange.endDate]);

  const filteredFeedIssues = useMemo(() => {
    return feedIssues.filter((i) => inRange(i.issue_date) && matchesShed(i.shed_id));
  }, [feedIssues, dateRange.startDate, dateRange.endDate, selectedShed]);

  const filteredEggSales = useMemo(() => {
    return eggSales.filter((s) => inRange(s.sale_date));
  }, [eggSales, dateRange.startDate, dateRange.endDate]);

  const filteredBirdSales = useMemo(() => {
    return birdSales.filter((s) => inRange(s.sale_date));
  }, [birdSales, dateRange.startDate, dateRange.endDate]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => inRange(e.expense_date) && (selectedShed === 'all' || e.shed_id === selectedShed));
  }, [expenses, dateRange.startDate, dateRange.endDate, selectedShed]);

  const filteredElectricity = useMemo(() => {
    return electricityBills.filter((b) => inMonthRange(b.billing_month) || inRange(b.due_date));
  }, [electricityBills, dateRange.startDate, dateRange.endDate]);

  const filteredSalaries = useMemo(() => {
    return salaries.filter((s) => inMonthRange(s.month) || inRange(s.payment_date));
  }, [salaries, dateRange.startDate, dateRange.endDate]);

  const filteredSupplierBills = useMemo(() => {
    return supplierBills.filter((b) => inRange(b.bill_date));
  }, [supplierBills, dateRange.startDate, dateRange.endDate]);

  const filteredPayments = useMemo(() => {
    return payments.filter((p) => inRange(p.payment_date));
  }, [payments, dateRange.startDate, dateRange.endDate]);

  const filteredVaccinations = useMemo(() => {
    return vaccinationRecords.filter((v) => inRange(v.scheduled_date) || inRange(v.actual_date));
  }, [vaccinationRecords, dateRange.startDate, dateRange.endDate]);

  const filteredHealthEvents = useMemo(() => {
    return healthEvents.filter((h) => inRange(h.event_date) && matchesShed(h.shed_id));
  }, [healthEvents, dateRange.startDate, dateRange.endDate, selectedShed]);

  const filteredWeightRecords = useMemo(() => {
    return weightRecords.filter((w) => inRange(w.sample_date) && matchesShed(w.shed_id));
  }, [weightRecords, dateRange.startDate, dateRange.endDate, selectedShed]);

  const filteredAuditLogs = useMemo(() => {
    return auditLogs.filter((a) => {
      const logDate = a.timestamp.split('T')[0];
      return inRange(logDate);
    });
  }, [auditLogs, dateRange.startDate, dateRange.endDate]);

  // Execute CSV Download tailored to currently selected report
  const handleExportCSV = () => {
    let rows: any[] = [];
    let headers: string[] = [];

    switch (selectedReportId) {
      case 'daily_farm_report':
      case 'daily_mortality':
        headers = ['Date', 'Shed', 'Opening Birds', 'Mortality', 'Culls', 'Closing Birds', 'Feed (kg)', 'Eggs Collected'];
        rows = filteredDailyBirds.map((r) => [
          r.record_date,
          r.shed_code,
          r.opening_birds,
          r.mortality,
          r.culls || 0,
          r.closing_birds,
          r.feed_consumed_kg,
          r.egg_count || 0,
        ]);
        break;

      case 'shed_bird_report':
        headers = ['Shed Code', 'Name', 'Type', 'Capacity', 'Live Birds', 'Utilization %', 'Status'];
        rows = sheds.map((s) => [
          s.code,
          s.name,
          s.shed_type,
          s.capacity,
          s.current_birds,
          `${((s.current_birds / s.capacity) * 100).toFixed(1)}%`,
          s.status,
        ]);
        break;

      case 'batch_lifecycle':
        headers = ['Batch Code', 'Bird Type', 'Stage', 'Current Shed', 'Initial Count', 'Current Live', 'Mortality Loss', 'Age (Days)'];
        rows = batches.map((b) => [
          b.batch_code,
          b.bird_type,
          b.stage,
          b.current_shed_code,
          b.initial_count,
          b.current_count,
          b.initial_count - b.current_count,
          b.age_days,
        ]);
        break;

      case 'feed_consumption':
        headers = ['Date', 'Shed', 'Feed Consumed (kg)', 'Feed Bags (50kg)', 'Mortality Recorded'];
        rows = filteredDailyBirds.map((r) => [
          r.record_date,
          r.shed_code,
          r.feed_consumed_kg,
          (r.feed_consumed_kg / 50).toFixed(1),
          r.mortality,
        ]);
        break;

      case 'feed_production_cost':
        headers = ['Production Date', 'Recipe Name', 'Quantity Produced (kg)', 'Bags (50kg)', 'Total Ingredient Cost (INR)', 'Cost/kg (INR)'];
        rows = filteredFeedProductions.map((p) => [
          p.production_date,
          p.recipe_name,
          p.produced_quantity_kg,
          Math.round(p.produced_quantity_kg / 50),
          p.total_ingredient_cost,
          p.cost_per_kg,
        ]);
        break;

      case 'ingredient_stock':
        headers = ['Ingredient Name', 'Code', 'Current Stock (kg)', 'Unit Price/kg (INR)', 'Stock Value (INR)', 'Reorder Level (kg)'];
        rows = feedIngredients.map((i) => [
          i.name,
          i.code,
          i.current_stock_kg,
          i.unit_price_per_kg,
          i.current_stock_kg * i.unit_price_per_kg,
          i.reorder_level_kg,
        ]);
        break;

      case 'godown_movements':
        headers = ['Item Name', 'Category', 'Current Quantity', 'Unit', 'Reorder Level'];
        rows = warehouseItems.map((w) => [
          w.item_name,
          w.category,
          w.current_quantity,
          w.unit,
          w.reorder_level,
        ]);
        break;

      case 'daily_egg_production':
        headers = ['Collection Date', 'Shed', 'Total Harvested', 'Good Eggs', 'Damaged Eggs', 'Trays (30s)', 'Loose Eggs', 'Lay %'];
        rows = filteredDailyEggs.map((e) => [
          e.collection_date,
          e.shed_code,
          e.total_eggs_collected,
          e.good_eggs,
          e.damaged_eggs,
          e.trays_count,
          e.loose_eggs_count,
          `${e.production_percentage}%`,
        ]);
        break;

      case 'egg_stock_sales':
        headers = ['Invoice #', 'Sale Date', 'Customer', 'Eggs Sold', 'Trays', 'Loose', 'Rate/Tray', 'Net Amount (INR)', 'Payment Status'];
        rows = filteredEggSales.map((s) => [
          s.invoice_no,
          s.sale_date,
          s.customer_name,
          s.total_eggs,
          s.trays_count,
          s.loose_eggs_count,
          s.price_per_tray,
          s.net_amount,
          s.payment_status,
        ]);
        break;

      case 'bird_sales_report':
        headers = ['Invoice #', 'Sale Date', 'Customer', 'Bird Quantity', 'Weight (kg)', 'Pricing Basis', 'Net Amount (INR)', 'Payment Status'];
        rows = filteredBirdSales.map((s) => [
          s.invoice_no,
          s.sale_date,
          s.customer_name,
          s.bird_quantity,
          s.total_weight_kg || 'N/A',
          s.pricing_basis,
          s.net_amount,
          s.payment_status,
        ]);
        break;

      case 'supplier_payables':
        headers = ['Bill #', 'Date', 'Supplier Name', 'Summary', 'Bill Amount (INR)', 'Paid (INR)', 'Outstanding (INR)', 'Status'];
        rows = filteredSupplierBills.map((b) => [
          b.bill_no,
          b.bill_date,
          b.supplier_name,
          b.items_summary,
          b.total_amount,
          b.paid_amount,
          b.outstanding_amount,
          b.payment_status,
        ]);
        break;

      case 'customer_receivables':
        headers = ['Customer Name', 'Phone', 'Current Balance (INR)'];
        rows = customers.map((c) => [c.name, c.phone, c.current_balance]);
        break;

      case 'expense_report':
        headers = ['Date', 'Category', 'Notes', 'Payee', 'Method', 'Amount (INR)'];
        rows = filteredExpenses.map((e) => [
          e.expense_date,
          e.category,
          e.notes || '—',
          e.payee,
          e.payment_method,
          e.amount,
        ]);
        break;

      case 'electricity_report':
        headers = ['Billing Month', 'Meter #', 'Units Consumed', 'Total Amount (INR)', 'Due Date', 'Status'];
        rows = filteredElectricity.map((b) => [
          b.billing_month,
          b.meter_number,
          b.units_consumed,
          b.total_amount,
          b.due_date,
          b.status,
        ]);
        break;

      case 'labour_salary_report':
        headers = ['Employee Name', 'Role', 'Month', 'Basic Salary', 'Net Salary (INR)', 'Payment Date', 'Status'];
        rows = filteredSalaries.map((s) => [
          s.employee_name,
          s.role_designation,
          s.month,
          s.basic_salary,
          s.net_salary,
          s.payment_date || 'Pending',
          s.payment_status,
        ]);
        break;

      case 'vaccination_report':
        headers = ['Batch', 'Shed', 'Vaccine Name', 'Scheduled Date', 'Actual Date', 'Status', 'Administered By', 'Cost (INR)'];
        rows = filteredVaccinations.map((v) => [
          v.batch_code,
          v.shed_code,
          v.vaccine_name,
          v.scheduled_date,
          v.actual_date || 'Pending',
          v.status,
          v.administered_by,
          v.cost || 0,
        ]);
        break;

      case 'health_treatment':
        headers = ['Date', 'Shed', 'Batch', 'Symptoms', 'Diagnosis', 'Medicine', 'Mortality', 'Responsible'];
        rows = filteredHealthEvents.map((h) => [
          h.event_date,
          h.shed_code,
          h.batch_code,
          h.symptoms,
          h.diagnosis,
          h.treatment_medicine,
          h.associated_mortality,
          h.responsible_person,
        ]);
        break;

      case 'weight_monitoring':
        headers = ['Sample Date', 'Batch', 'Age (Days)', 'Birds Sampled', 'Average Weight (g)', 'Target (g)', 'Diff (g)'];
        rows = filteredWeightRecords.map((w) => [
          w.sample_date,
          w.batch_code,
          w.age_days,
          w.birds_sampled,
          w.average_weight_grams,
          w.target_weight_grams,
          w.difference_grams,
        ]);
        break;

      case 'audit_correction_report':
        headers = ['Timestamp', 'Actor Name', 'Role', 'Action', 'Entity Type', 'Entity ID', 'Old Values', 'New Values'];
        rows = filteredAuditLogs.map((a) => [
          a.timestamp,
          a.actor_name,
          a.actor_role,
          a.action,
          a.entity_type,
          a.entity_id,
          a.old_values || '—',
          a.new_values || '—',
        ]);
        break;

      default:
        headers = ['Item', 'Recorded Value'];
        rows = [
          ['Report', activeReportMeta.name],
          ['Period Start', dateRange.startDate],
          ['Period End', dateRange.endDate],
        ];
        break;
    }

    // Build standard CSV
    const csvContent = [
      `# KASTHURI POULTRY FARM (KPF) - OFFICIAL FARM RECORD`,
      `# Report: ${activeReportMeta.name}`,
      `# Period: ${dateRange.startDate} to ${dateRange.endDate} (${dateRange.grouping.toUpperCase()} Grouping)`,
      `# Generated: ${new Date().toISOString()}`,
      headers.join(','),
      ...rows.map((row) =>
        row
          .map((v: any) => {
            const str = String(v ?? '');
            return `"${str.replace(/"/g, '""')}"`;
          })
          .join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `kpf-${selectedReportId}-${dateRange.startDate}-to-${dateRange.endDate}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  // Reconciled summary computations
  const periodTotalMortality = filteredDailyBirds.reduce((s, r) => s + r.mortality, 0);
  const periodTotalFeedKg = filteredDailyBirds.reduce((s, r) => s + r.feed_consumed_kg, 0);
  const periodTotalEggs = filteredDailyEggs.reduce((s, r) => s + r.total_eggs_collected, 0);
  const periodGoodEggs = filteredDailyEggs.reduce((s, r) => s + r.good_eggs, 0);
  const periodEggRevenue = filteredEggSales.reduce((s, r) => s + r.net_amount, 0);
  const periodBirdRevenue = filteredBirdSales.reduce((s, r) => s + r.net_amount, 0);
  const periodTotalRevenue = periodEggRevenue + periodBirdRevenue;
  const periodTotalExpenses = filteredExpenses.reduce((s, r) => s + r.amount, 0);
  const periodNetProfit = periodTotalRevenue - periodTotalExpenses;

  // Render individual report implementations
  const renderActiveReport = () => {
    // Permission check for financial reports
    if (activeReportMeta.financial && !canViewFinancials) {
      return (
        <div className="p-8 text-center bg-rose-50 border border-rose-200 rounded-xl">
          <ShieldAlert className="w-10 h-10 text-rose-600 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-rose-900">Access Restricted by Farm Policy</h3>
          <p className="text-xs text-rose-700 mt-1 max-w-md mx-auto">
            This financial report is restricted for your role. Contact the Owner/Admin in Settings to grant financial dashboard visibility.
          </p>
        </div>
      );
    }

    switch (selectedReportId) {
      // 1. Daily Farm Report
      case 'daily_farm_report': {
        const sortedRecords = [...filteredDailyBirds].sort((a, b) => b.record_date.localeCompare(a.record_date));
        const openingBirds = sortedRecords[sortedRecords.length - 1]?.opening_birds || 0;
        const closingBirds = sortedRecords[0]?.closing_birds || 0;

        return (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
              <span className="font-semibold text-slate-700">Period Activity Summary:</span>
              <div className="flex items-center gap-4 text-slate-600">
                <span>Opening Live Birds: <strong className="text-slate-900">{formatNumber(openingBirds)}</strong></span>
                <span>•</span>
                <span>Period Mortality: <strong className="text-rose-600">{formatNumber(periodTotalMortality)}</strong></span>
                <span>•</span>
                <span>Closing Live Birds: <strong className="text-emerald-700">{formatNumber(closingBirds)}</strong></span>
                <span>•</span>
                <span>Period Feed: <strong className="text-amber-700">{formatNumber(periodTotalFeedKg)} kg</strong></span>
              </div>
            </div>

            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold uppercase text-[11px]">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Shed</th>
                  <th className="py-2.5 px-3 text-right">Opening Birds</th>
                  <th className="py-2.5 px-3 text-right text-rose-600">Deaths</th>
                  <th className="py-2.5 px-3 text-right">Culls</th>
                  <th className="py-2.5 px-3 text-right text-emerald-700">Closing Birds</th>
                  <th className="py-2.5 px-3 text-right">Feed Intake</th>
                  <th className="py-2.5 px-3 text-right">Eggs Harvested</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {sortedRecords.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-6 text-center text-slate-400 italic">
                      No farm daily records logged between {dateRange.startDate} and {dateRange.endDate}.
                    </td>
                  </tr>
                ) : (
                  sortedRecords.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-semibold text-slate-900">{r.record_date}</td>
                      <td className="py-2 px-3 font-bold text-slate-800">{r.shed_code}</td>
                      <td className="py-2 px-3 text-right">{formatNumber(r.opening_birds)}</td>
                      <td className="py-2 px-3 text-right font-bold text-rose-600">{r.mortality}</td>
                      <td className="py-2 px-3 text-right text-slate-500">{r.culls || 0}</td>
                      <td className="py-2 px-3 text-right font-bold text-emerald-700">{formatNumber(r.closing_birds)}</td>
                      <td className="py-2 px-3 text-right">{formatNumber(r.feed_consumed_kg)} kg</td>
                      <td className="py-2 px-3 text-right font-bold text-amber-700">{r.egg_count || 'N/A'}</td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot className="border-t-2 border-slate-300 bg-slate-50 font-bold">
                <tr>
                  <td colSpan={2} className="py-2.5 px-3 uppercase text-slate-800">
                    Period Reconciled Totals
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-800">{formatNumber(openingBirds)}</td>
                  <td className="py-2.5 px-3 text-right text-rose-600">{formatNumber(periodTotalMortality)}</td>
                  <td className="py-2.5 px-3 text-right text-slate-600">{filteredDailyBirds.reduce((s, r) => s + (r.culls || 0), 0)}</td>
                  <td className="py-2.5 px-3 text-right text-emerald-700">{formatNumber(closingBirds)}</td>
                  <td className="py-2.5 px-3 text-right text-amber-700">{formatNumber(periodTotalFeedKg)} kg</td>
                  <td className="py-2.5 px-3 text-right text-amber-700">
                    {formatNumber(filteredDailyBirds.reduce((s, r) => s + (r.egg_count || 0), 0))}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        );
      }

      // 2. Shed-Wise Bird Report
      case 'shed_bird_report': {
        const totalCapacity = sheds.reduce((s, sh) => s + sh.capacity, 0);
        const totalLive = sheds.reduce((s, sh) => s + sh.current_birds, 0);

        return (
          <div className="space-y-4">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold uppercase text-[11px]">
                  <th className="py-2.5 px-3">Shed Code</th>
                  <th className="py-2.5 px-3">Name</th>
                  <th className="py-2.5 px-3">Stage</th>
                  <th className="py-2.5 px-3 text-right">Capacity</th>
                  <th className="py-2.5 px-3 text-right">Current Live</th>
                  <th className="py-2.5 px-3 text-right">Period Mortality</th>
                  <th className="py-2.5 px-3 text-right">Capacity %</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {sheds
                  .filter((s) => selectedShed === 'all' || s.id === selectedShed)
                  .map((s) => {
                    const shedMort = filteredDailyBirds.filter((b) => b.shed_id === s.id).reduce((sum, b) => sum + b.mortality, 0);
                    return (
                      <tr key={s.id} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-black text-slate-900">{s.code}</td>
                        <td className="py-2 px-3 font-semibold text-slate-800">{s.name}</td>
                        <td className="py-2 px-3 capitalize">
                          <Badge stage={s.shed_type}>{s.shed_type.toUpperCase()}</Badge>
                        </td>
                        <td className="py-2 px-3 text-right font-medium">{formatNumber(s.capacity)}</td>
                        <td className="py-2 px-3 text-right font-bold text-emerald-700">{formatNumber(s.current_birds)}</td>
                        <td className="py-2 px-3 text-right font-bold text-rose-600">{formatNumber(shedMort)}</td>
                        <td className="py-2 px-3 text-right font-black">
                          {((s.current_birds / s.capacity) * 100).toFixed(1)}%
                        </td>
                        <td className="py-2 px-3 capitalize font-semibold text-slate-600">{s.status}</td>
                      </tr>
                    );
                  })}
              </tbody>
              <tfoot className="border-t-2 border-slate-300 bg-slate-50 font-bold">
                <tr>
                  <td colSpan={3} className="py-2.5 px-3 uppercase text-slate-800">Total Farm Capacity & Population</td>
                  <td className="py-2.5 px-3 text-right text-slate-800">{formatNumber(totalCapacity)}</td>
                  <td className="py-2.5 px-3 text-right text-emerald-700">{formatNumber(totalLive)}</td>
                  <td className="py-2.5 px-3 text-right text-rose-600">{formatNumber(periodTotalMortality)}</td>
                  <td className="py-2.5 px-3 text-right font-black">{((totalLive / totalCapacity) * 100).toFixed(1)}%</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        );
      }

      // 3. Batch Lifecycle Report
      case 'batch_lifecycle': {
        return (
          <div className="space-y-4">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold uppercase text-[11px]">
                  <th className="py-2.5 px-3">Batch Code</th>
                  <th className="py-2.5 px-3">Breed</th>
                  <th className="py-2.5 px-3">Stage</th>
                  <th className="py-2.5 px-3">Shed</th>
                  <th className="py-2.5 px-3 text-right">Age (Days)</th>
                  <th className="py-2.5 px-3 text-right">Placed Count</th>
                  <th className="py-2.5 px-3 text-right">Current Live</th>
                  <th className="py-2.5 px-3 text-right text-rose-600">Total Depletion</th>
                  <th className="py-2.5 px-3 text-right">Survival %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {batches.map((b) => {
                  const depletion = b.initial_count - b.current_count;
                  const survival = ((b.current_count / b.initial_count) * 100).toFixed(1);
                  return (
                    <tr key={b.id} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-bold text-slate-900">{b.batch_code}</td>
                      <td className="py-2 px-3 text-slate-700">{b.bird_type}</td>
                      <td className="py-2 px-3">
                        <Badge stage={b.stage}>{b.stage.toUpperCase()}</Badge>
                      </td>
                      <td className="py-2 px-3 font-bold">{b.current_shed_code}</td>
                      <td className="py-2 px-3 text-right">{b.age_days}d</td>
                      <td className="py-2 px-3 text-right font-medium">{formatNumber(b.initial_count)}</td>
                      <td className="py-2 px-3 text-right font-bold text-emerald-700">{formatNumber(b.current_count)}</td>
                      <td className="py-2 px-3 text-right font-semibold text-rose-600">{formatNumber(depletion)}</td>
                      <td className="py-2 px-3 text-right font-bold text-slate-800">{survival}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
      }

      // 4. Daily Mortality Report
      case 'daily_mortality': {
        const sortedMortality = [...filteredDailyBirds].filter((r) => r.mortality > 0 || (r.culls || 0) > 0);
        return (
          <div className="space-y-4">
            <div className="bg-rose-50 border border-rose-200 p-3 rounded-lg flex items-center justify-between text-xs">
              <span className="font-bold text-rose-900">Period Mortality Summary:</span>
              <div className="flex gap-4 text-rose-800 font-semibold">
                <span>Total Dead: <strong>{periodTotalMortality} birds</strong></span>
                <span>•</span>
                <span>Total Culls: <strong>{filteredDailyBirds.reduce((s, r) => s + (r.culls || 0), 0)} birds</strong></span>
              </div>
            </div>
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold uppercase text-[11px]">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Shed</th>
                  <th className="py-2.5 px-3 text-right">Flock Size</th>
                  <th className="py-2.5 px-3 text-right text-rose-600">Mortality</th>
                  <th className="py-2.5 px-3 text-right text-amber-600">Cull</th>
                  <th className="py-2.5 px-3 text-right text-rose-800">Total Loss</th>
                  <th className="py-2.5 px-3 text-right">Mortality %</th>
                  <th className="py-2.5 px-3">Observations / Cause</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {sortedMortality.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-6 text-center text-slate-400 italic">
                      Zero mortality recorded in the selected period.
                    </td>
                  </tr>
                ) : (
                  sortedMortality.map((r) => {
                    const totalLoss = r.mortality + (r.culls || 0);
                    const mortPct = r.opening_birds > 0 ? ((r.mortality / r.opening_birds) * 100).toFixed(3) : '0';
                    return (
                      <tr key={r.id} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-semibold">{r.record_date}</td>
                        <td className="py-2 px-3 font-bold">{r.shed_code}</td>
                        <td className="py-2 px-3 text-right">{formatNumber(r.opening_birds)}</td>
                        <td className="py-2 px-3 text-right font-bold text-rose-600">{formatNumber(r.mortality)}</td>
                        <td className="py-2 px-3 text-right font-medium text-amber-600">{formatNumber(r.culls || 0)}</td>
                        <td className="py-2 px-3 text-right font-black text-rose-800">{formatNumber(totalLoss)}</td>
                        <td className="py-2 px-3 text-right font-mono">{mortPct}%</td>
                        <td className="py-2 px-3 text-slate-500 italic">{r.notes || 'Normal routine culling'}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        );
      }

      // 5. Feed Consumption Report
      case 'feed_consumption': {
        return (
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg flex items-center justify-between text-xs">
              <span className="font-bold text-amber-900">Period Feed Intake Summary:</span>
              <div className="flex gap-4 text-amber-800 font-semibold">
                <span>Total Consumed: <strong>{formatNumber(periodTotalFeedKg)} kg</strong></span>
                <span>•</span>
                <span>Equivalent 50kg Bags: <strong>{(periodTotalFeedKg / 50).toFixed(0)} Bags</strong></span>
              </div>
            </div>
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold uppercase text-[11px]">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Shed</th>
                  <th className="py-2.5 px-3 text-right">Live Birds</th>
                  <th className="py-2.5 px-3 text-right">Feed (kg)</th>
                  <th className="py-2.5 px-3 text-right">Bags (50kg)</th>
                  <th className="py-2.5 px-3 text-right">Grams / Bird / Day</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredDailyBirds.map((r) => {
                  const gPerBird = r.closing_birds > 0 ? ((r.feed_consumed_kg * 1000) / r.closing_birds).toFixed(1) : '0';
                  return (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-semibold">{r.record_date}</td>
                      <td className="py-2 px-3 font-bold">{r.shed_code}</td>
                      <td className="py-2 px-3 text-right">{formatNumber(r.closing_birds)}</td>
                      <td className="py-2 px-3 text-right font-bold text-amber-800">{formatNumber(r.feed_consumed_kg)} kg</td>
                      <td className="py-2 px-3 text-right text-slate-600">{(r.feed_consumed_kg / 50).toFixed(1)}</td>
                      <td className="py-2 px-3 text-right font-mono font-semibold text-slate-900">{gPerBird} g</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
      }

      // 6. Feed Production & Cost Report
      case 'feed_production_cost': {
        const totalKgProduced = filteredFeedProductions.reduce((s, p) => s + p.produced_quantity_kg, 0);
        const totalProductionCost = filteredFeedProductions.reduce((s, p) => s + p.total_ingredient_cost, 0);
        const avgCostPerKg = totalKgProduced > 0 ? (totalProductionCost / totalKgProduced).toFixed(2) : '0.00';

        return (
          <div className="space-y-4">
            <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-lg flex items-center justify-between text-xs">
              <span className="font-bold text-emerald-900">Period Milling Production:</span>
              <div className="flex gap-4 text-emerald-800 font-semibold">
                <span>Total Milled: <strong>{formatNumber(totalKgProduced)} kg</strong></span>
                <span>•</span>
                <span>Total Batch Cost: <strong>{formatCurrency(totalProductionCost)}</strong></span>
                <span>•</span>
                <span>Weighted Avg Cost: <strong>₹{avgCostPerKg}/kg</strong></span>
              </div>
            </div>
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold uppercase text-[11px]">
                  <th className="py-2.5 px-3">Production Date</th>
                  <th className="py-2.5 px-3">Recipe Name</th>
                  <th className="py-2.5 px-3 text-right">Produced Qty (kg)</th>
                  <th className="py-2.5 px-3 text-right">Bags (50kg)</th>
                  <th className="py-2.5 px-3 text-right">Total Cost</th>
                  <th className="py-2.5 px-3 text-right">Cost / kg</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredFeedProductions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-400 italic">
                      No feed milling batches logged in the selected period.
                    </td>
                  </tr>
                ) : (
                  filteredFeedProductions.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-semibold">{p.production_date}</td>
                      <td className="py-2 px-3 font-bold text-slate-800">{p.recipe_name}</td>
                      <td className="py-2 px-3 text-right font-medium">{formatNumber(p.produced_quantity_kg)} kg</td>
                      <td className="py-2 px-3 text-right">{Math.round(p.produced_quantity_kg / 50)}</td>
                      <td className="py-2 px-3 text-right font-bold text-emerald-700">{formatCurrency(p.total_ingredient_cost)}</td>
                      <td className="py-2 px-3 text-right font-mono font-semibold">₹{p.cost_per_kg.toFixed(2)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        );
      }

      // 7. Ingredient Stock Report
      case 'ingredient_stock': {
        const totalIngredientKg = feedIngredients.reduce((s, i) => s + i.current_stock_kg, 0);
        const totalValuation = feedIngredients.reduce((s, i) => s + i.current_stock_kg * i.unit_price_per_kg, 0);

        return (
          <div className="space-y-4">
            <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg flex items-center justify-between text-xs">
              <span className="font-bold text-slate-900">Silo Stock Balance & Valuation:</span>
              <div className="flex gap-4 text-slate-700 font-semibold">
                <span>Total Raw Material: <strong>{(totalIngredientKg / 1000).toFixed(1)} MT</strong></span>
                <span>•</span>
                <span>Inventory Valuation: <strong>{formatCurrency(totalValuation)}</strong></span>
              </div>
            </div>
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold uppercase text-[11px]">
                  <th className="py-2.5 px-3">Item Name</th>
                  <th className="py-2.5 px-3">Code</th>
                  <th className="py-2.5 px-3 text-right">Current Stock (kg)</th>
                  <th className="py-2.5 px-3 text-right">Unit Rate (₹/kg)</th>
                  <th className="py-2.5 px-3 text-right">Total Valuation</th>
                  <th className="py-2.5 px-3 text-right">Reorder Threshold</th>
                  <th className="py-2.5 px-3">Stock Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {feedIngredients.map((i) => {
                  const isLow = i.current_stock_kg <= i.reorder_level_kg;
                  return (
                    <tr key={i.id} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-bold text-slate-900">{i.name}</td>
                      <td className="py-2 px-3 font-mono text-slate-600">{i.code}</td>
                      <td className="py-2 px-3 text-right font-bold">{formatNumber(i.current_stock_kg)} kg</td>
                      <td className="py-2 px-3 text-right font-mono">₹{i.unit_price_per_kg.toFixed(2)}</td>
                      <td className="py-2 px-3 text-right font-bold text-emerald-700">
                        {formatCurrency(i.current_stock_kg * i.unit_price_per_kg)}
                      </td>
                      <td className="py-2 px-3 text-right text-slate-500">{formatNumber(i.reorder_level_kg)} kg</td>
                      <td className="py-2 px-3">
                        {isLow ? (
                          <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-700 font-bold text-[10px]">
                            REORDER REQUIRED
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 font-bold text-[10px]">
                            SUFFICIENT
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
      }

      // 8. Godown Movements Report
      case 'godown_movements': {
        return (
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-600 uppercase">Warehouse Stock Categories (Reconciled Balance)</h4>
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold uppercase text-[11px]">
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Item Description</th>
                  <th className="py-2.5 px-3 text-right">Available Stock</th>
                  <th className="py-2.5 px-3">Unit</th>
                  <th className="py-2.5 px-3 text-right">Reorder Level</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {warehouseItems.map((w) => (
                  <tr key={w.id} className="hover:bg-slate-50">
                    <td className="py-2 px-3 font-bold capitalize text-slate-800">{w.category.replace('_', ' ')}</td>
                    <td className="py-2 px-3 font-semibold text-slate-900">{w.item_name}</td>
                    <td className="py-2 px-3 text-right font-black text-emerald-800">{formatNumber(w.current_quantity)}</td>
                    <td className="py-2 px-3 font-mono text-slate-500">{w.unit}</td>
                    <td className="py-2 px-3 text-right">{formatNumber(w.reorder_level)}</td>
                    <td className="py-2 px-3">
                      {w.current_quantity <= w.reorder_level ? (
                        <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded">
                          Near Threshold
                        </span>
                      ) : (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                          In Stock
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }

      // 9. Daily Egg Production Report
      case 'daily_egg_production': {
        const sortedEggs = [...filteredDailyEggs].sort((a, b) => b.collection_date.localeCompare(a.collection_date));
        const totalTraysCalc = convertEggsToTrays(periodGoodEggs);

        return (
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg flex items-center justify-between text-xs">
              <span className="font-bold text-amber-900">Period Egg Collection Summary:</span>
              <div className="flex gap-4 text-amber-800 font-semibold">
                <span>Total Harvest: <strong>{formatNumber(periodTotalEggs)} Eggs</strong></span>
                <span>•</span>
                <span>Good Eggs: <strong>{formatNumber(periodGoodEggs)}</strong></span>
                <span>•</span>
                <span>Trays Converted: <strong>{formatNumber(totalTraysCalc.trays)} Trays (+{totalTraysCalc.loose} loose)</strong></span>
              </div>
            </div>
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold uppercase text-[11px]">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Shed</th>
                  <th className="py-2.5 px-3 text-right">Total Harvest</th>
                  <th className="py-2.5 px-3 text-right text-emerald-700">Good Eggs</th>
                  <th className="py-2.5 px-3 text-right text-rose-600">Damaged</th>
                  <th className="py-2.5 px-3 text-right">Trays (30s)</th>
                  <th className="py-2.5 px-3 text-right">Loose</th>
                  <th className="py-2.5 px-3 text-right">Lay Rate %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {sortedEggs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-6 text-center text-slate-400 italic">
                      No egg collections recorded in the selected period.
                    </td>
                  </tr>
                ) : (
                  sortedEggs.map((e) => (
                    <tr key={e.id} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-semibold">{e.collection_date}</td>
                      <td className="py-2 px-3 font-bold">{e.shed_code}</td>
                      <td className="py-2 px-3 text-right font-bold text-slate-900">{formatNumber(e.total_eggs_collected)}</td>
                      <td className="py-2 px-3 text-right font-bold text-emerald-700">{formatNumber(e.good_eggs)}</td>
                      <td className="py-2 px-3 text-right text-rose-600">{e.damaged_eggs}</td>
                      <td className="py-2 px-3 text-right font-medium">{formatNumber(e.trays_count)}</td>
                      <td className="py-2 px-3 text-right text-slate-500">{e.loose_eggs_count}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-amber-700">{e.production_percentage}%</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        );
      }

      // 10. Egg Stock & Sales Report
      case 'egg_stock_sales': {
        const totalEggsSold = filteredEggSales.reduce((s, r) => s + r.total_eggs, 0);
        const totalEggRevenue = filteredEggSales.reduce((s, r) => s + r.net_amount, 0);

        return (
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg flex items-center justify-between text-xs">
              <span className="font-bold text-amber-900">Period Egg Dispatches & Sales:</span>
              <div className="flex gap-4 text-amber-800 font-semibold">
                <span>Total Eggs Sold: <strong>{formatNumber(totalEggsSold)}</strong></span>
                <span>•</span>
                <span>Trays Dispatched: <strong>{formatNumber(Math.floor(totalEggsSold / 30))} Trays</strong></span>
                <span>•</span>
                <span>Egg Revenue: <strong>{formatCurrency(totalEggRevenue)}</strong></span>
              </div>
            </div>
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold uppercase text-[11px]">
                  <th className="py-2.5 px-3">Invoice #</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3 text-right">Eggs Sold</th>
                  <th className="py-2.5 px-3 text-right">Trays</th>
                  <th className="py-2.5 px-3 text-right">Rate / Tray</th>
                  <th className="py-2.5 px-3 text-right">Net Amount</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredEggSales.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-6 text-center text-slate-400 italic">
                      No egg sales recorded in this period.
                    </td>
                  </tr>
                ) : (
                  filteredEggSales.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-mono font-bold text-emerald-800">{s.invoice_no}</td>
                      <td className="py-2 px-3">{s.sale_date}</td>
                      <td className="py-2 px-3 font-semibold text-slate-900">{s.customer_name}</td>
                      <td className="py-2 px-3 text-right font-medium">{formatNumber(s.total_eggs)}</td>
                      <td className="py-2 px-3 text-right">{formatNumber(s.trays_count)}</td>
                      <td className="py-2 px-3 text-right font-mono">₹{s.price_per_tray}</td>
                      <td className="py-2 px-3 text-right font-bold text-emerald-700">{formatCurrency(s.net_amount)}</td>
                      <td className="py-2 px-3 capitalize">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${s.payment_status === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                          {s.payment_status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        );
      }

      // 11. Bird Sales Report
      case 'bird_sales_report': {
        const totalBirdsSold = filteredBirdSales.reduce((s, r) => s + r.bird_quantity, 0);
        const totalBirdAmount = filteredBirdSales.reduce((s, r) => s + r.net_amount, 0);

        return (
          <div className="space-y-4">
            <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-lg flex items-center justify-between text-xs">
              <span className="font-bold text-emerald-900">Period Bird Dispatches & Sales:</span>
              <div className="flex gap-4 text-emerald-800 font-semibold">
                <span>Total Birds Sold: <strong>{formatNumber(totalBirdsSold)} birds</strong></span>
                <span>•</span>
                <span>Bird Revenue: <strong>{formatCurrency(totalBirdAmount)}</strong></span>
              </div>
            </div>
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold uppercase text-[11px]">
                  <th className="py-2.5 px-3">Invoice #</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3">Shed</th>
                  <th className="py-2.5 px-3 text-right">Birds Count</th>
                  <th className="py-2.5 px-3 text-right">Total Wt (kg)</th>
                  <th className="py-2.5 px-3 text-right">Net Amount</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredBirdSales.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-6 text-center text-slate-400 italic">
                      No bird sales recorded in this period.
                    </td>
                  </tr>
                ) : (
                  filteredBirdSales.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-mono font-bold text-emerald-800">{s.invoice_no}</td>
                      <td className="py-2 px-3">{s.sale_date}</td>
                      <td className="py-2 px-3 font-semibold text-slate-900">{s.customer_name}</td>
                      <td className="py-2 px-3 font-bold">{s.shed_code}</td>
                      <td className="py-2 px-3 text-right font-bold">{formatNumber(s.bird_quantity)}</td>
                      <td className="py-2 px-3 text-right">{s.total_weight_kg ? `${formatNumber(s.total_weight_kg)} kg` : 'N/A'}</td>
                      <td className="py-2 px-3 text-right font-bold text-emerald-700">{formatCurrency(s.net_amount)}</td>
                      <td className="py-2 px-3 capitalize">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${s.payment_status === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                          {s.payment_status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        );
      }

      // 12. Vaccination Due & Completed Report
      case 'vaccination_report': {
        return (
          <div className="space-y-4">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold uppercase text-[11px]">
                  <th className="py-2.5 px-3">Batch</th>
                  <th className="py-2.5 px-3">Shed</th>
                  <th className="py-2.5 px-3">Vaccine Name</th>
                  <th className="py-2.5 px-3">Scheduled Date</th>
                  <th className="py-2.5 px-3">Actual Date</th>
                  <th className="py-2.5 px-3">Administered By</th>
                  <th className="py-2.5 px-3 text-right">Cost</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredVaccinations.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-6 text-center text-slate-400 italic">
                      No vaccinations recorded or scheduled in this period.
                    </td>
                  </tr>
                ) : (
                  filteredVaccinations.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-bold">{v.batch_code}</td>
                      <td className="py-2 px-3 font-bold">{v.shed_code}</td>
                      <td className="py-2 px-3 font-semibold text-slate-900">{v.vaccine_name}</td>
                      <td className="py-2 px-3 font-mono">{v.scheduled_date}</td>
                      <td className="py-2 px-3 font-mono">{v.actual_date || '—'}</td>
                      <td className="py-2 px-3 text-slate-700">{v.administered_by}</td>
                      <td className="py-2 px-3 text-right font-mono">₹{v.cost || 0}</td>
                      <td className="py-2 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${v.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                          {v.status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        );
      }

      // 13. Health & Treatment Report
      case 'health_treatment': {
        return (
          <div className="space-y-4">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold uppercase text-[11px]">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Shed</th>
                  <th className="py-2.5 px-3">Batch</th>
                  <th className="py-2.5 px-3">Symptoms</th>
                  <th className="py-2.5 px-3">Diagnosis</th>
                  <th className="py-2.5 px-3">Treatment / Medicine</th>
                  <th className="py-2.5 px-3 text-right">Mortality</th>
                  <th className="py-2.5 px-3">Responsible</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredHealthEvents.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-6 text-center text-slate-400 italic">
                      No health incidents or veterinary visits logged in this period.
                    </td>
                  </tr>
                ) : (
                  filteredHealthEvents.map((h) => (
                    <tr key={h.id} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-semibold">{h.event_date}</td>
                      <td className="py-2 px-3 font-bold">{h.shed_code}</td>
                      <td className="py-2 px-3 font-medium">{h.batch_code}</td>
                      <td className="py-2 px-3 text-slate-700">{h.symptoms}</td>
                      <td className="py-2 px-3 font-bold text-slate-900">{h.diagnosis}</td>
                      <td className="py-2 px-3 text-emerald-800 font-medium">{h.treatment_medicine}</td>
                      <td className="py-2 px-3 text-right font-bold text-rose-600">{h.associated_mortality}</td>
                      <td className="py-2 px-3 text-slate-600 font-medium">{h.responsible_person}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        );
      }

      // 14. Weight Monitoring Report
      case 'weight_monitoring': {
        return (
          <div className="space-y-4">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold uppercase text-[11px]">
                  <th className="py-2.5 px-3">Sample Date</th>
                  <th className="py-2.5 px-3">Batch</th>
                  <th className="py-2.5 px-3 text-right">Age (Days)</th>
                  <th className="py-2.5 px-3 text-right">Sample Birds</th>
                  <th className="py-2.5 px-3 text-right">Actual Avg Weight</th>
                  <th className="py-2.5 px-3 text-right">Target Weight</th>
                  <th className="py-2.5 px-3 text-right">Variance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredWeightRecords.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-slate-400 italic">
                      No flock weight records logged in this period.
                    </td>
                  </tr>
                ) : (
                  filteredWeightRecords.map((w) => {
                    const diff = w.difference_grams;
                    return (
                      <tr key={w.id} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-semibold">{w.sample_date}</td>
                        <td className="py-2 px-3 font-bold">{w.batch_code}</td>
                        <td className="py-2 px-3 text-right">{w.age_days}d</td>
                        <td className="py-2 px-3 text-right">{w.birds_sampled}</td>
                        <td className="py-2 px-3 text-right font-bold text-slate-900">{w.average_weight_grams} g</td>
                        <td className="py-2 px-3 text-right text-slate-500">{w.target_weight_grams} g</td>
                        <td className={`py-2 px-3 text-right font-semibold ${diff >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {diff >= 0 ? `+${diff}` : diff} g
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        );
      }

      // 15. Supplier Payables Report (Financial)
      case 'supplier_payables': {
        const totalBilled = filteredSupplierBills.reduce((s, b) => s + b.total_amount, 0);
        const totalPaid = filteredSupplierBills.reduce((s, b) => s + b.paid_amount, 0);
        const totalDue = filteredSupplierBills.reduce((s, b) => s + b.outstanding_amount, 0);

        return (
          <div className="space-y-4">
            <div className="bg-rose-50 border border-rose-200 p-3 rounded-lg flex items-center justify-between text-xs">
              <span className="font-bold text-rose-900">Period Supplier Payables & Billing:</span>
              <div className="flex gap-4 text-rose-800 font-semibold">
                <span>Period Purchases: <strong>{formatCurrency(totalBilled)}</strong></span>
                <span>•</span>
                <span>Paid: <strong>{formatCurrency(totalPaid)}</strong></span>
                <span>•</span>
                <span>Outstanding Payable: <strong>{formatCurrency(totalDue)}</strong></span>
              </div>
            </div>
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold uppercase text-[11px]">
                  <th className="py-2.5 px-3">Bill #</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Supplier Name</th>
                  <th className="py-2.5 px-3">Summary</th>
                  <th className="py-2.5 px-3 text-right">Bill Amount</th>
                  <th className="py-2.5 px-3 text-right">Paid Amount</th>
                  <th className="py-2.5 px-3 text-right">Balance Due</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredSupplierBills.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-6 text-center text-slate-400 italic">
                      No supplier purchase bills recorded in this period.
                    </td>
                  </tr>
                ) : (
                  filteredSupplierBills.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-mono font-bold text-slate-900">{b.bill_no}</td>
                      <td className="py-2 px-3">{b.bill_date}</td>
                      <td className="py-2 px-3 font-semibold text-slate-900">{b.supplier_name}</td>
                      <td className="py-2 px-3 capitalize">{b.items_summary}</td>
                      <td className="py-2 px-3 text-right font-medium">{formatCurrency(b.total_amount)}</td>
                      <td className="py-2 px-3 text-right text-emerald-700">{formatCurrency(b.paid_amount)}</td>
                      <td className="py-2 px-3 text-right font-bold text-rose-700">{formatCurrency(b.outstanding_amount)}</td>
                      <td className="py-2 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${b.payment_status === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                          {b.payment_status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        );
      }

      // 16. Customer Receivables Report (Financial)
      case 'customer_receivables': {
        const totalReceivables = customers.reduce((s, c) => s + c.current_balance, 0);

        return (
          <div className="space-y-4">
            <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-lg flex items-center justify-between text-xs">
              <span className="font-bold text-emerald-900">Buyer Accounts Receivable:</span>
              <div className="text-emerald-800 font-semibold">
                <span>Total Outstanding Balance Due to Farm: <strong>{formatCurrency(totalReceivables)}</strong></span>
              </div>
            </div>
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold uppercase text-[11px]">
                  <th className="py-2.5 px-3">Customer Name</th>
                  <th className="py-2.5 px-3">Phone</th>
                  <th className="py-2.5 px-3 text-right">Current Ledger Balance</th>
                  <th className="py-2.5 px-3">Credit Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="py-2 px-3 font-bold text-slate-900">{c.name}</td>
                    <td className="py-2 px-3 font-mono text-slate-600">{c.phone}</td>
                    <td className="py-2 px-3 text-right font-bold text-rose-700">{formatCurrency(c.current_balance)}</td>
                    <td className="py-2 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${c.current_balance > 0 ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'}`}>
                        {c.current_balance > 0 ? 'PAYMENT DUE' : 'CLEAR'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }

      // 17. Expense Report (Financial)
      case 'expense_report': {
        return (
          <div className="space-y-4">
            <div className="bg-rose-50 border border-rose-200 p-3 rounded-lg flex items-center justify-between text-xs">
              <span className="font-bold text-rose-900">Period Farm Operating Expenses:</span>
              <div className="text-rose-800 font-semibold">
                <span>Total Disbursed: <strong>{formatCurrency(periodTotalExpenses)}</strong></span>
              </div>
            </div>
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold uppercase text-[11px]">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Notes</th>
                  <th className="py-2.5 px-3">Payee</th>
                  <th className="py-2.5 px-3">Method</th>
                  <th className="py-2.5 px-3 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-400 italic">
                      No expense records logged in this period.
                    </td>
                  </tr>
                ) : (
                  filteredExpenses.map((e) => (
                    <tr key={e.id} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-semibold">{e.expense_date}</td>
                      <td className="py-2 px-3 capitalize font-bold text-slate-800">{e.category.replace('_', ' ')}</td>
                      <td className="py-2 px-3 text-slate-700">{e.notes || '—'}</td>
                      <td className="py-2 px-3 font-medium text-slate-900">{e.payee}</td>
                      <td className="py-2 px-3 capitalize font-mono text-[11px]">{e.payment_method}</td>
                      <td className="py-2 px-3 text-right font-bold text-rose-700">{formatCurrency(e.amount)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        );
      }

      // 18. Electricity Report (Financial)
      case 'electricity_report': {
        const totalUnits = filteredElectricity.reduce((s, b) => s + b.units_consumed, 0);
        const totalPowerCost = filteredElectricity.reduce((s, b) => s + b.total_amount, 0);

        return (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg flex items-center justify-between text-xs">
              <span className="font-bold text-blue-900">Period Electricity Consumption & Tariff:</span>
              <div className="flex gap-4 text-blue-800 font-semibold">
                <span>Power Consumed: <strong>{formatNumber(totalUnits)} kWh Units</strong></span>
                <span>•</span>
                <span>Total Bill Amount: <strong>{formatCurrency(totalPowerCost)}</strong></span>
              </div>
            </div>
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold uppercase text-[11px]">
                  <th className="py-2.5 px-3">Billing Month</th>
                  <th className="py-2.5 px-3">Meter #</th>
                  <th className="py-2.5 px-3 text-right">Units (kWh)</th>
                  <th className="py-2.5 px-3 text-right">Amount</th>
                  <th className="py-2.5 px-3">Due Date</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredElectricity.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-400 italic">
                      No electricity bills logged in this period.
                    </td>
                  </tr>
                ) : (
                  filteredElectricity.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-semibold font-mono">{b.billing_month}</td>
                      <td className="py-2 px-3 font-mono">{b.meter_number}</td>
                      <td className="py-2 px-3 text-right font-bold text-slate-900">{formatNumber(b.units_consumed)}</td>
                      <td className="py-2 px-3 text-right font-bold text-rose-700">{formatCurrency(b.total_amount)}</td>
                      <td className="py-2 px-3 font-mono">{b.due_date}</td>
                      <td className="py-2 px-3 capitalize">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${b.status === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        );
      }

      // 19. Labour and Salary Report (Financial)
      case 'labour_salary_report': {
        const totalPayroll = filteredSalaries.reduce((s, r) => s + r.net_salary, 0);

        return (
          <div className="space-y-4">
            <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg flex items-center justify-between text-xs">
              <span className="font-bold text-slate-900">Period Labour & Payroll Disbursement:</span>
              <div className="text-slate-800 font-semibold">
                <span>Total Wages Paid: <strong>{formatCurrency(totalPayroll)}</strong></span>
              </div>
            </div>
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold uppercase text-[11px]">
                  <th className="py-2.5 px-3">Employee Name</th>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3">Month</th>
                  <th className="py-2.5 px-3 text-right">Basic Salary</th>
                  <th className="py-2.5 px-3 text-right">Allowances</th>
                  <th className="py-2.5 px-3 text-right">Deductions</th>
                  <th className="py-2.5 px-3 text-right">Net Payable</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredSalaries.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-6 text-center text-slate-400 italic">
                      No salary records recorded in this period.
                    </td>
                  </tr>
                ) : (
                  filteredSalaries.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-bold text-slate-900">{s.employee_name}</td>
                      <td className="py-2 px-3 capitalize">{s.role_designation}</td>
                      <td className="py-2 px-3 font-mono">{s.month}</td>
                      <td className="py-2 px-3 text-right">{formatCurrency(s.basic_salary)}</td>
                      <td className="py-2 px-3 text-right text-emerald-700">₹{s.allowances}</td>
                      <td className="py-2 px-3 text-right text-rose-600">₹{s.deductions_or_advance}</td>
                      <td className="py-2 px-3 text-right font-bold text-slate-900">{formatCurrency(s.net_salary)}</td>
                      <td className="py-2 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${s.payment_status === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                          {s.payment_status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        );
      }

      // 20. Batch-Wise Cost Report (Financial)
      case 'batch_cost_report': {
        return (
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-600 uppercase">Flock Unit Economics & Batch Cost Accumulation</h4>
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold uppercase text-[11px]">
                  <th className="py-2.5 px-3">Batch Code</th>
                  <th className="py-2.5 px-3">Breed</th>
                  <th className="py-2.5 px-3">Shed</th>
                  <th className="py-2.5 px-3 text-right">Live Birds</th>
                  <th className="py-2.5 px-3 text-right">Feed Consumed</th>
                  <th className="py-2.5 px-3 text-right">Feed Cost (₹34/kg)</th>
                  <th className="py-2.5 px-3 text-right">Est. Unit Cost / Bird</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {batches.map((b) => {
                  const bRecords = filteredDailyBirds.filter((r) => r.shed_id === b.current_shed_id);
                  const bFeed = bRecords.reduce((s, r) => s + r.feed_consumed_kg, 0);
                  const feedCost = bFeed * 34; // standard layer/grower cost
                  const unitCost = b.current_count > 0 ? (feedCost / b.current_count).toFixed(1) : '0';
                  return (
                    <tr key={b.id} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-bold text-slate-900">{b.batch_code}</td>
                      <td className="py-2 px-3">{b.bird_type}</td>
                      <td className="py-2 px-3 font-bold">{b.current_shed_code}</td>
                      <td className="py-2 px-3 text-right font-medium">{formatNumber(b.current_count)}</td>
                      <td className="py-2 px-3 text-right font-bold text-amber-800">{formatNumber(bFeed)} kg</td>
                      <td className="py-2 px-3 text-right font-bold text-slate-800">{formatCurrency(feedCost)}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-emerald-700">₹{unitCost} / bird</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
      }

      // 21. Shed-Wise Profitability Report (Financial)
      case 'shed_profitability': {
        return (
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-600 uppercase">Shed Revenue Contribution & Operational Margin</h4>
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold uppercase text-[11px]">
                  <th className="py-2.5 px-3">Shed</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3 text-right">Eggs Collected</th>
                  <th className="py-2.5 px-3 text-right">Est. Egg Revenue</th>
                  <th className="py-2.5 px-3 text-right">Feed Consumed</th>
                  <th className="py-2.5 px-3 text-right">Feed Cost</th>
                  <th className="py-2.5 px-3 text-right">Gross Shed Contribution</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {sheds.map((s) => {
                  const sEggs = filteredDailyEggs.filter((e) => e.shed_id === s.id).reduce((sum, e) => sum + e.total_eggs_collected, 0);
                  const sFeed = filteredDailyBirds.filter((b) => b.shed_id === s.id).reduce((sum, b) => sum + b.feed_consumed_kg, 0);
                  const estEggRev = (sEggs / 30) * 165; // ~₹5.5/egg
                  const estFeedCost = sFeed * 34; // ₹34/kg
                  const contribution = estEggRev - estFeedCost;
                  return (
                    <tr key={s.id} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-bold text-slate-900">{s.code}</td>
                      <td className="py-2 px-3 capitalize"><Badge stage={s.shed_type}>{s.shed_type}</Badge></td>
                      <td className="py-2 px-3 text-right font-medium">{formatNumber(sEggs)}</td>
                      <td className="py-2 px-3 text-right font-bold text-emerald-700">{formatCurrency(estEggRev)}</td>
                      <td className="py-2 px-3 text-right text-amber-800">{formatNumber(sFeed)} kg</td>
                      <td className="py-2 px-3 text-right font-medium text-rose-700">{formatCurrency(estFeedCost)}</td>
                      <td className={`py-2 px-3 text-right font-black ${contribution >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {formatCurrency(contribution)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
      }

      // 22. Monthly & Yearly Financial Report (Financial)
      case 'monthly_financial': {
        return (
          <div className="space-y-6">
            <div className="bg-slate-900 text-white rounded-xl p-5 shadow-sm">
              <div className="flex justify-between items-center border-b border-slate-700 pb-3 mb-4">
                <div>
                  <h3 className="text-base font-extrabold uppercase tracking-wide">
                    Commercial Profit & Loss Statement (Accrual Basis)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Period: {dateRange.startDate} to {dateRange.endDate} • Kasthuri Poultry Farm
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded font-bold">
                    Official Audit Format
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="bg-slate-800/80 p-3.5 rounded-lg border border-slate-700">
                  <span className="text-slate-400 uppercase text-[10px] font-bold">Gross Sales Revenue</span>
                  <div className="text-xl font-bold text-emerald-400 mt-1">{formatCurrency(periodTotalRevenue)}</div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Egg: {formatCurrency(periodEggRevenue)} • Birds: {formatCurrency(periodBirdRevenue)}
                  </div>
                </div>

                <div className="bg-slate-800/80 p-3.5 rounded-lg border border-slate-700">
                  <span className="text-slate-400 uppercase text-[10px] font-bold">Total Operating Expenses</span>
                  <div className="text-xl font-bold text-rose-400 mt-1">{formatCurrency(periodTotalExpenses)}</div>
                  <div className="text-[11px] text-slate-400 mt-1">Feed, utilities, salaries, health & misc</div>
                </div>

                <div className="bg-slate-800/80 p-3.5 rounded-lg border border-slate-700">
                  <span className="text-slate-400 uppercase text-[10px] font-bold">Net Operating Profit</span>
                  <div className="text-xl font-black text-emerald-400 mt-1">{formatCurrency(periodNetProfit)}</div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    {periodTotalRevenue > 0 ? `${((periodNetProfit / periodTotalRevenue) * 100).toFixed(1)}% operating margin` : '0% margin'}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-3">
              <div className="flex justify-between font-bold text-slate-900 border-b pb-2">
                <span>Revenue & Expense Ledger Heads</span>
                <span>Amount (₹)</span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span>1. Commercial Egg Sales Revenue:</span>
                <span className="font-semibold text-emerald-700">{formatCurrency(periodEggRevenue)}</span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span>2. Spent Hen & Live Bird Sales Revenue:</span>
                <span className="font-semibold text-emerald-700">{formatCurrency(periodBirdRevenue)}</span>
              </div>
              <div className="flex justify-between font-bold border-t pt-2 text-slate-900">
                <span>Total Operating Revenue:</span>
                <span className="text-emerald-800">{formatCurrency(periodTotalRevenue)}</span>
              </div>
              <div className="flex justify-between text-slate-700 pt-2 border-t">
                <span>3. Farm Operating Expenses Logged:</span>
                <span className="font-semibold text-rose-600">-{formatCurrency(periodTotalExpenses)}</span>
              </div>
              <div className="flex justify-between font-black text-sm text-emerald-900 border-t-2 border-emerald-600 pt-2 bg-emerald-50 p-2.5 rounded">
                <span>Net Commercial Operating Profit:</span>
                <span>{formatCurrency(periodNetProfit)}</span>
              </div>
            </div>
          </div>
        );
      }

      // 23. Audit & Correction Report
      case 'audit_correction_report': {
        return (
          <div className="space-y-4">
            <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg flex items-center justify-between text-xs">
              <span className="font-bold text-slate-900">System Mutation Logs & Security Audits:</span>
              <span className="text-slate-600">{filteredAuditLogs.length} events recorded in selected period</span>
            </div>
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold uppercase text-[11px]">
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Actor & Role</th>
                  <th className="py-2.5 px-3">Action</th>
                  <th className="py-2.5 px-3">Entity Type & ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredAuditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-400 italic">
                      No system mutations or edit events recorded in this period.
                    </td>
                  </tr>
                ) : (
                  filteredAuditLogs.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50">
                      <td className="py-2 px-3 text-slate-500 font-mono text-[11px]">{formatDateTime(a.timestamp)}</td>
                      <td className="py-2 px-3 font-semibold text-slate-900">
                        {a.actor_name} ({a.actor_role})
                      </td>
                      <td className="py-2 px-3 font-mono font-bold text-emerald-800">{a.action}</td>
                      <td className="py-2 px-3 font-mono text-slate-600">
                        {a.entity_type}: {a.entity_id}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        );
      }

      default:
        return (
          <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-xs text-slate-500">
            <FileSpreadsheet className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <span className="font-semibold text-slate-700">Displaying {activeReportMeta.name}</span>
            <p className="mt-1">All data populated directly from active farm records.</p>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 no-print">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-emerald-600" />
            <span>Kasthuri Poultry Farm — Reports & Intelligence</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            23 Comprehensive Commercial Reports • Period Date Range Filtering • Printable A4 Layouts & CSV Export
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="btn-secondary gap-2 text-xs py-2 px-3.5 bg-white hover:bg-slate-50 border-slate-300 text-slate-700 shadow-xs"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handlePrint}
            className="btn-primary gap-2 text-xs py-2 px-3.5 bg-slate-900 hover:bg-slate-800 text-white shadow-xs"
          >
            <Printer className="w-4 h-4 text-white" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* COMPREHENSIVE DATE RANGE SELECTOR */}
      <div className="no-print">
        <DateRangeSelector
          value={dateRange}
          onChange={(newVal) => setDateRange(newVal)}
          showGrouping={true}
          showComparison={true}
        />
      </div>

      {/* FILTER AND REPORT SELECTOR BAR */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-4 no-print shadow-xs">
        <div>
          <label className="input-label font-bold text-slate-700">1. Select Report Specification (1–23)</label>
          <select
            value={selectedReportId}
            onChange={(e) => setSelectedReportId(e.target.value)}
            className="input-field font-semibold text-xs py-2 bg-white"
          >
            {reportsList.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} ({r.category})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="input-label font-bold text-slate-700">2. Filter by Physical Shed</label>
          <select
            value={selectedShed}
            onChange={(e) => setSelectedShed(e.target.value)}
            className="input-field text-xs py-2 bg-white font-medium"
          >
            <option value="all">All 8 Sheds (Farm-Wide Scope)</option>
            {sheds.map((s) => (
              <option key={s.id} value={s.id}>
                {s.code} — {s.name} ({s.shed_type.toUpperCase()})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="input-label font-bold text-slate-700">3. Filter by Flock Batch</label>
          <select
            value={selectedBatch}
            onChange={(e) => setSelectedBatch(e.target.value)}
            className="input-field text-xs py-2 bg-white font-medium"
          >
            <option value="all">All Active Batches</option>
            {batches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.batch_code} ({b.stage.toUpperCase()} • {b.current_shed_code})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* COMPARATIVE EXECUTIVE CARD (When Comparison is Enabled) */}
      {dateRange.compareWithPrevious && dateRange.prevStartDate && dateRange.prevEndDate && (
        <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-4 no-print">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-emerald-900 uppercase tracking-wide flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-700" />
              <span>Comparative Performance: Current Period vs Previous Period</span>
            </span>
            <span className="text-[11px] font-semibold text-emerald-700">
              {dateRange.prevStartDate} to {dateRange.prevEndDate}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            {/* Eggs */}
            <div className="bg-white p-2.5 rounded-lg border border-emerald-100">
              <span className="text-slate-500 text-[10px] uppercase font-bold">Eggs Harvested</span>
              {(() => {
                const prevEggs = prevDailyEggs.reduce((s, r) => s + r.total_eggs_collected, 0);
                const comp = calculateComparison(periodTotalEggs, prevEggs);
                return (
                  <div>
                    <div className="font-bold text-slate-900 mt-0.5">{formatNumber(periodTotalEggs)}</div>
                    <div className={`text-[11px] font-semibold ${comp.variance >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {comp.isNew ? 'New Activity' : `${comp.pctChangeFormatted} vs prev`}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Mortality */}
            <div className="bg-white p-2.5 rounded-lg border border-emerald-100">
              <span className="text-slate-500 text-[10px] uppercase font-bold">Mortality</span>
              {(() => {
                const prevMort = prevDailyBirds.reduce((s, r) => s + r.mortality, 0);
                const comp = calculateComparison(periodTotalMortality, prevMort);
                return (
                  <div>
                    <div className="font-bold text-slate-900 mt-0.5">{formatNumber(periodTotalMortality)} birds</div>
                    <div className={`text-[11px] font-semibold ${comp.variance <= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {comp.isNew ? 'New Activity' : `${comp.pctChangeFormatted} vs prev`}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Feed */}
            <div className="bg-white p-2.5 rounded-lg border border-emerald-100">
              <span className="text-slate-500 text-[10px] uppercase font-bold">Feed Intake</span>
              {(() => {
                const prevFeed = prevDailyBirds.reduce((s, r) => s + r.feed_consumed_kg, 0);
                const comp = calculateComparison(periodTotalFeedKg, prevFeed);
                return (
                  <div>
                    <div className="font-bold text-slate-900 mt-0.5">{formatNumber(periodTotalFeedKg)} kg</div>
                    <div className="text-[11px] font-semibold text-slate-600">
                      {comp.isNew ? 'New Activity' : `${comp.pctChangeFormatted} vs prev`}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Revenue */}
            <div className="bg-white p-2.5 rounded-lg border border-emerald-100">
              <span className="text-slate-500 text-[10px] uppercase font-bold">Sales Revenue</span>
              {(() => {
                const prevRev =
                  eggSales.filter((s) => inPrevRange(s.sale_date)).reduce((sum, s) => sum + s.net_amount, 0) +
                  birdSales.filter((s) => inPrevRange(s.sale_date)).reduce((sum, s) => sum + s.net_amount, 0);
                const comp = calculateComparison(periodTotalRevenue, prevRev);
                return (
                  <div>
                    <div className="font-bold text-slate-900 mt-0.5">{formatCurrency(periodTotalRevenue)}</div>
                    <div className={`text-[11px] font-semibold ${comp.variance >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {comp.isNew ? 'New Activity' : `${comp.pctChangeFormatted} vs prev`}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* OFFICIAL REPORT DISPLAY & PRINT CONTAINER */}
      <div id="printable-report-area" className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-xs min-h-[450px]">
        {/* Printable Official Farm Header */}
        <div className="border-b-2 border-slate-900 pb-4 mb-5 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">
              KASTHURI POULTRY FARM
            </h2>
            <p className="text-xs font-semibold text-slate-700 mt-0.5">
              {farmProfile.address || 'Commercial Poultry Operations'}
            </p>
            <p className="text-[11px] text-slate-500">
              Phone: {farmProfile.phone || '+91 98765 43210'} • Email: {farmProfile.email || 'accounts@kasthuripoultry.com'}
            </p>
          </div>

          <div className="text-left sm:text-right text-xs">
            <div className="font-black text-slate-900 text-sm">{activeReportMeta.name}</div>
            <div className="text-slate-600 font-semibold mt-0.5">
              Period: {dateRange.startDate} to {dateRange.endDate}
            </div>
            <div className="text-slate-500 text-[11px]">
              Interval: {dateRange.grouping.toUpperCase()} • Scope: {selectedShed === 'all' ? 'All Farm Sheds' : selectedShed}
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              Generated: {formatDateTime(new Date())}
            </div>
          </div>
        </div>

        {/* Dynamic Report Content */}
        {renderActiveReport()}
      </div>
    </div>
  );
}
