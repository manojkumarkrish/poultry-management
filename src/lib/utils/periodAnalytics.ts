import {
  Shed,
  Batch,
  DailyBirdRecord,
  DailyEggRecord,
  EggSale,
  BirdSale,
  ExpenseRecord,
  FeedIngredient,
  FeedProduction,
  FeedIssue,
  WarehouseStockItem,
  PaymentTransaction,
  Customer,
  Supplier,
  SupplierBill,
  convertEggsToTrays,
} from '@/types/database';
import {
  GroupingInterval,
  generateTimeSlots,
  calculateComparison,
  parseISODate,
} from './dateRange';

export interface PeriodMetrics {
  startDate: string;
  endDate: string;
  dayCount: number;

  // Flock & Mortality
  openingBirds: number;
  periodMortality: number;
  periodCulls: number;
  periodBirdsSold: number;
  closingBirds: number;
  mortalityRatePct: number;

  // Egg Production
  periodEggsCollected: number;
  periodGoodEggs: number;
  periodDamagedEggs: number;
  periodTrays: number;
  periodLooseEggs: number;
  avgDailyEggs: number;
  layingRatePct: number;

  // Feed Consumption & Milling
  periodFeedConsumedKg: number;
  avgFeedPerBirdGrams: number;
  periodFeedProducedKg: number;
  periodFeedProductionCost: number;

  // Financials
  eggRevenue: number;
  birdRevenue: number;
  totalRevenue: number;
  operatingExpenses: number;
  netProfit: number;
  profitMarginPct: number;

  // Receivables & Payables movements
  customerReceipts: number;
  supplierDisbursements: number;
  closingReceivables: number;
  closingPayables: number;

  // Time-series Trend Data for Charts
  trendSlots: {
    key: string;
    label: string;
    start: string;
    end: string;
    eggs: number;
    feedKg: number;
    mortality: number;
    revenue: number;
    expenses: number;
    profit: number;
  }[];
}

export function calculatePeriodMetrics(params: {
  startDate: string;
  endDate: string;
  grouping?: GroupingInterval;
  shedFilter?: string; // 'all' or shedId
  sheds: Shed[];
  batches: Batch[];
  dailyBirdRecords: DailyBirdRecord[];
  dailyEggRecords: DailyEggRecord[];
  eggSales: EggSale[];
  birdSales: BirdSale[];
  expenses: ExpenseRecord[];
  feedIngredients: FeedIngredient[];
  feedProductions: FeedProduction[];
  feedIssues: FeedIssue[];
  warehouseItems: WarehouseStockItem[];
  payments: PaymentTransaction[];
  customers: Customer[];
  suppliers: Supplier[];
  supplierBills: SupplierBill[];
}): PeriodMetrics {
  const {
    startDate,
    endDate,
    grouping = 'daily',
    shedFilter = 'all',
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
  } = params;

  const startD = parseISODate(startDate);
  const endD = parseISODate(endDate);
  const dayCount = Math.max(1, Math.round((endD.getTime() - startD.getTime()) / 86400000) + 1);

  // 1. Filter Records by date range and shed
  const relevantBirdRecords = dailyBirdRecords.filter((r) => {
    const inRange = r.record_date >= startDate && r.record_date <= endDate;
    const matchesShed = shedFilter === 'all' || r.shed_id === shedFilter;
    return inRange && matchesShed;
  });

  const relevantEggRecords = dailyEggRecords.filter((r) => {
    const inRange = r.collection_date >= startDate && r.collection_date <= endDate;
    const matchesShed = shedFilter === 'all' || r.shed_id === shedFilter;
    return inRange && matchesShed;
  });

  const relevantEggSales = eggSales.filter((s) => {
    const inRange = s.sale_date >= startDate && s.sale_date <= endDate;
    const isActive = s.sale_status !== 'cancelled' && s.status !== 'cancelled';
    return inRange && isActive;
  });

  const relevantBirdSales = birdSales.filter((s) => {
    const inRange = s.sale_date >= startDate && s.sale_date <= endDate;
    const matchesShed = shedFilter === 'all' || s.shed_id === shedFilter;
    const isActive = s.sale_status !== 'cancelled' && s.status !== 'cancelled';
    return inRange && matchesShed && isActive;
  });

  const relevantExpenses = expenses.filter((e) => {
    const inRange = e.expense_date >= startDate && e.expense_date <= endDate;
    const matchesShed = shedFilter === 'all' || !e.shed_id || e.shed_id === shedFilter;
    return inRange && matchesShed;
  });

  const relevantFeedProductions = feedProductions.filter((p) => {
    const inRange = p.production_date >= startDate && p.production_date <= endDate;
    const isActive = p.production_status !== 'cancelled' && p.status !== 'cancelled';
    return inRange && isActive;
  });

  const relevantFeedIssues = feedIssues.filter((i) => {
    const inRange = i.issue_date >= startDate && i.issue_date <= endDate;
    const matchesShed = shedFilter === 'all' || i.shed_id === shedFilter;
    return inRange && matchesShed;
  });

  const relevantPayments = payments.filter((p) => {
    const inRange = p.payment_date >= startDate && p.payment_date <= endDate;
    const isActive = p.payment_status_flag !== 'cancelled';
    return inRange && isActive;
  });

  // 2. Bird Balance Calculations
  // Total current live birds
  const currentTotalLiveBirds = sheds
    .filter((s) => shedFilter === 'all' || s.id === shedFilter)
    .reduce((sum, s) => sum + s.current_birds, 0);

  // Period mortality and culls
  let periodMortality = relevantBirdRecords.reduce((sum, r) => sum + r.mortality, 0);
  let periodCulls = relevantBirdRecords.reduce((sum, r) => sum + r.culls, 0);
  let periodBirdsSold = relevantBirdSales.reduce((sum, s) => sum + s.bird_quantity, 0);

  // Opening birds = closing birds + mortality + culls + sales (reconciliation)
  const closingBirds = currentTotalLiveBirds;
  const openingBirds = closingBirds + periodMortality + periodCulls + periodBirdsSold;
  const mortalityRatePct =
    openingBirds > 0 ? Number(((periodMortality / openingBirds) * 100).toFixed(2)) : 0;

  // 3. Egg Production Calculations
  let periodEggsCollected = relevantEggRecords.reduce((sum, r) => sum + r.total_eggs_collected, 0);
  let periodGoodEggs = relevantEggRecords.reduce((sum, r) => sum + r.good_eggs, 0);
  let periodDamagedEggs = relevantEggRecords.reduce(
    (sum, r) => sum + (r.damaged_eggs + r.broken_eggs + r.rejected_eggs),
    0
  );

  const { trays: periodTrays, loose: periodLooseEggs } = convertEggsToTrays(periodGoodEggs);
  const avgDailyEggs = dayCount > 0 ? Math.round(periodEggsCollected / dayCount) : 0;

  // Layer birds count
  const layerBirds = batches
    .filter((b) => b.stage === 'layer')
    .filter((b) => shedFilter === 'all' || b.current_shed_id === shedFilter)
    .reduce((sum, b) => sum + b.current_count, 0);

  const layingRatePct =
    layerBirds > 0 ? Number(((avgDailyEggs / layerBirds) * 100).toFixed(1)) : 0;

  // 4. Feed Calculations
  let periodFeedConsumedKg = relevantBirdRecords.reduce(
    (sum, r) => sum + r.feed_consumed_kg,
    0
  );
  if (periodFeedConsumedKg === 0) {
    periodFeedConsumedKg = relevantFeedIssues.reduce(
      (sum, i) => sum + i.net_consumed_kg,
      0
    );
  }

  const avgFeedPerBirdGrams =
    closingBirds > 0 && dayCount > 0
      ? Number(((periodFeedConsumedKg * 1000) / (closingBirds * dayCount)).toFixed(1))
      : 0;

  const periodFeedProducedKg = relevantFeedProductions.reduce(
    (sum, p) => sum + p.produced_quantity_kg,
    0
  );

  const periodFeedProductionCost = relevantFeedProductions.reduce(
    (sum, p) => sum + p.total_ingredient_cost,
    0
  );

  // 5. Financial Figures
  let eggRevenue = relevantEggSales.reduce((sum, s) => sum + s.net_amount, 0);
  let birdRevenue = relevantBirdSales.reduce((sum, s) => sum + s.net_amount, 0);
  const totalRevenue = eggRevenue + birdRevenue;

  let operatingExpenses = relevantExpenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = totalRevenue - operatingExpenses;
  const profitMarginPct =
    totalRevenue > 0 ? Number(((netProfit / totalRevenue) * 100).toFixed(1)) : 0;

  // 6. Cash Inflows & Outflows
  const customerReceipts = relevantPayments
    .filter((p) => p.type === 'customer_receipt')
    .reduce((sum, p) => sum + p.amount, 0);

  const supplierDisbursements = relevantPayments
    .filter((p) => p.type === 'supplier_payment')
    .reduce((sum, p) => sum + p.amount, 0);

  const closingReceivables = customers.reduce((sum, c) => sum + c.current_balance, 0);
  const closingPayables = suppliers.reduce((sum, s) => sum + s.current_balance, 0);

  // 7. Time-series Slots for Dynamic Charts
  const slots = generateTimeSlots(startDate, endDate, grouping);
  const trendSlots = slots.map((slot) => {
    // Collect records in this sub-slot
    const slotEggs = dailyEggRecords
      .filter((r) => r.collection_date >= slot.start && r.collection_date <= slot.end)
      .reduce((sum, r) => sum + r.total_eggs_collected, 0);

    const slotFeed = dailyBirdRecords
      .filter((r) => r.record_date >= slot.start && r.record_date <= slot.end)
      .reduce((sum, r) => sum + r.feed_consumed_kg, 0);

    const slotDeaths = dailyBirdRecords
      .filter((r) => r.record_date >= slot.start && r.record_date <= slot.end)
      .reduce((sum, r) => sum + r.mortality, 0);

    const slotEggRev = eggSales
      .filter((s) => s.sale_date >= slot.start && s.sale_date <= slot.end && s.sale_status !== 'cancelled')
      .reduce((sum, s) => sum + s.net_amount, 0);

    const slotBirdRev = birdSales
      .filter((s) => s.sale_date >= slot.start && s.sale_date <= slot.end && s.sale_status !== 'cancelled')
      .reduce((sum, s) => sum + s.net_amount, 0);

    const slotExp = expenses
      .filter((e) => e.expense_date >= slot.start && e.expense_date <= slot.end)
      .reduce((sum, e) => sum + e.amount, 0);

    const slotTotalRev = slotEggRev + slotBirdRev;

    return {
      key: slot.key,
      label: slot.label,
      start: slot.start,
      end: slot.end,
      eggs: slotEggs,
      feedKg: slotFeed,
      mortality: slotDeaths,
      revenue: slotTotalRev,
      expenses: slotExp,
      profit: slotTotalRev - slotExp,
    };
  });

  return {
    startDate,
    endDate,
    dayCount,
    openingBirds,
    periodMortality,
    periodCulls,
    periodBirdsSold,
    closingBirds,
    mortalityRatePct,
    periodEggsCollected,
    periodGoodEggs,
    periodDamagedEggs,
    periodTrays,
    periodLooseEggs,
    avgDailyEggs,
    layingRatePct,
    periodFeedConsumedKg,
    avgFeedPerBirdGrams,
    periodFeedProducedKg,
    periodFeedProductionCost,
    eggRevenue,
    birdRevenue,
    totalRevenue,
    operatingExpenses,
    netProfit,
    profitMarginPct,
    customerReceipts,
    supplierDisbursements,
    closingReceivables,
    closingPayables,
    trendSlots,
  };
}
