'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  UserProfile,
  UserRole,
  ManagerVisibilitySettings,
  Shed,
  Batch,
  BatchMovement,
  DailyBirdRecord,
  FeedIngredient,
  FeedRecipe,
  FeedProduction,
  FeedIssue,
  DailyEggRecord,
  Customer,
  EggSale,
  BirdSale,
  Supplier,
  SupplierBill,
  PaymentTransaction,
  ExpenseRecord,
  ElectricityBill,
  EmployeeSalary,
  VaccinationSchedule,
  VaccinationRecord,
  HealthEvent,
  WeightRecord,
  ApprovalRequest,
  AuditLog,
  AppNotification,
  WarehouseStockItem,
  calculateClosingBirds,
  convertEggsToTrays,
  calculateEggProductionPct,
} from '@/types/database';
import {
  INITIAL_VISIBILITY_SETTINGS,
  INITIAL_SHEDS,
  INITIAL_BATCHES,
  INITIAL_FEED_INGREDIENTS,
  INITIAL_RECIPES,
  INITIAL_CUSTOMERS,
  INITIAL_SUPPLIERS,
  INITIAL_NOTIFICATIONS,
  INITIAL_WAREHOUSE_ITEMS,
} from './initialData';

interface FarmContextType {
  currentUser: UserProfile;
  switchRole: (role: UserRole) => void;
  visibilitySettings: ManagerVisibilitySettings;
  updateVisibilitySettings: (newSettings: Partial<ManagerVisibilitySettings>) => void;
  
  // Sheds & Batches
  sheds: Shed[];
  batches: Batch[];
  batchMovements: BatchMovement[];
  addShed: (shed: Omit<Shed, 'id' | 'updated_at'>) => void;
  updateShed: (id: string, updates: Partial<Shed>) => void;
  addBatch: (batch: Omit<Batch, 'id'>) => void;
  transferBirds: (params: {
    batchId: string;
    fromShedId: string;
    toShedId: string;
    quantity: number;
    reason: string;
  }) => { success: boolean; error?: string };

  // Daily Records
  dailyBirdRecords: DailyBirdRecord[];
  addDailyBirdRecord: (record: Omit<DailyBirdRecord, 'id' | 'submitted_at'>) => { success: boolean; error?: string };
  dailyEggRecords: DailyEggRecord[];
  addDailyEggRecord: (record: Omit<DailyEggRecord, 'id' | 'created_at'>) => { success: boolean; error?: string };

  // Feed
  feedIngredients: FeedIngredient[];
  recipes: FeedRecipe[];
  feedProductions: FeedProduction[];
  feedIssues: FeedIssue[];
  addFeedIngredient: (ing: Omit<FeedIngredient, 'id' | 'updated_at'>) => void;
  updateFeedIngredient: (id: string, updates: Partial<FeedIngredient>) => void;
  addRecipe: (recipe: Omit<FeedRecipe, 'id'>) => void;
  produceFeed: (params: {
    recipeId: string;
    producedQuantityKg: number;
    productionLossKg: number;
    batchNumber: string;
  }) => { success: boolean; error?: string };
  issueFeedToShed: (issue: Omit<FeedIssue, 'id' | 'created_at'>) => { success: boolean; error?: string };

  // Inventory & Warehouse
  warehouseItems: WarehouseStockItem[];
  updateWarehouseItem: (id: string, updates: Partial<WarehouseStockItem>) => void;

  // Sales & Accounts
  customers: Customer[];
  eggSales: EggSale[];
  birdSales: BirdSale[];
  suppliers: Supplier[];
  supplierBills: SupplierBill[];
  payments: PaymentTransaction[];
  addCustomer: (cust: Omit<Customer, 'id'>) => void;
  addSupplier: (supp: Omit<Supplier, 'id'>) => void;
  createEggSale: (sale: Omit<EggSale, 'id' | 'created_at'>) => { success: boolean; error?: string };
  createBirdSale: (sale: Omit<BirdSale, 'id' | 'created_at'>) => { success: boolean; error?: string };
  createSupplierBill: (bill: Omit<SupplierBill, 'id' | 'created_at'>) => void;
  recordPayment: (payment: Omit<PaymentTransaction, 'id' | 'created_at'>) => void;

  // Health, Vaccination & Weight
  vaccinationSchedules: VaccinationSchedule[];
  vaccinationRecords: VaccinationRecord[];
  healthEvents: HealthEvent[];
  weightRecords: WeightRecord[];
  addVaccinationRecord: (rec: Omit<VaccinationRecord, 'id' | 'created_at'>) => void;
  updateVaccinationStatus: (id: string, status: VaccinationRecord['status'], cost?: number) => void;
  addHealthEvent: (ev: Omit<HealthEvent, 'id' | 'created_at'>) => void;
  addWeightRecord: (rec: Omit<WeightRecord, 'id' | 'created_at'>) => void;

  // Financials
  expenses: ExpenseRecord[];
  electricityBills: ElectricityBill[];
  salaries: EmployeeSalary[];
  addExpense: (exp: Omit<ExpenseRecord, 'id' | 'created_at'>) => void;
  addElectricityBill: (bill: Omit<ElectricityBill, 'id'>) => void;
  addSalaryRecord: (salary: Omit<EmployeeSalary, 'id'>) => void;

  // Approvals & Audits
  approvalRequests: ApprovalRequest[];
  createApprovalRequest: (req: Omit<ApprovalRequest, 'id' | 'status' | 'created_at' | 'updated_at'>) => void;
  reviewApprovalRequest: (id: string, status: 'approved' | 'rejected', reviewNotes?: string) => void;
  auditLogs: AuditLog[];
  logAudit: (action: string, entityType: string, entityId: string, oldVal?: any, newVal?: any) => void;

  // Notifications
  notifications: AppNotification[];
  markNotificationRead: (id: string) => void;

  // Reset demo data
  resetAllData: () => void;
}

const FarmContext = createContext<FarmContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'poultry_farm_manager_state_v1';

export function FarmProvider({ children }: { children: React.ReactNode }) {
  // Current user representation (Owner or Manager)
  const [currentUser, setCurrentUser] = useState<UserProfile>({
    id: 'u-owner-1',
    email: 'owner@balajipoultry.com',
    full_name: 'Rajesh Balaji (Owner/Admin)',
    role: 'owner_admin',
    phone: '+91 98450 11223',
    is_active: true,
    created_at: new Date().toISOString(),
  });

  const [visibilitySettings, setVisibilitySettings] = useState<ManagerVisibilitySettings>(INITIAL_VISIBILITY_SETTINGS);
  const [sheds, setSheds] = useState<Shed[]>(INITIAL_SHEDS);
  const [batches, setBatches] = useState<Batch[]>(INITIAL_BATCHES);
  const [batchMovements, setBatchMovements] = useState<BatchMovement[]>([]);
  const [dailyBirdRecords, setDailyBirdRecords] = useState<DailyBirdRecord[]>([]);
  const [dailyEggRecords, setDailyEggRecords] = useState<DailyEggRecord[]>([]);
  const [feedIngredients, setFeedIngredients] = useState<FeedIngredient[]>(INITIAL_FEED_INGREDIENTS);
  const [recipes, setRecipes] = useState<FeedRecipe[]>(INITIAL_RECIPES);
  const [feedProductions, setFeedProductions] = useState<FeedProduction[]>([]);
  const [feedIssues, setFeedIssues] = useState<FeedIssue[]>([]);
  const [warehouseItems, setWarehouseItems] = useState<WarehouseStockItem[]>(INITIAL_WAREHOUSE_ITEMS);
  const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS);
  const [eggSales, setEggSales] = useState<EggSale[]>([]);
  const [birdSales, setBirdSales] = useState<BirdSale[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>(INITIAL_SUPPLIERS);
  const [supplierBills, setSupplierBills] = useState<SupplierBill[]>([]);
  const [payments, setPayments] = useState<PaymentTransaction[]>([]);
  const [vaccinationSchedules] = useState<VaccinationSchedule[]>([
    { id: 'vs-1', bird_stage: 'chick', target_age_days: 1, vaccine_name: "Marek's Disease (HVT)", route_of_administration: 'subcutaneous', disease_targeted: "Marek's Disease" },
    { id: 'vs-2', bird_stage: 'chick', target_age_days: 7, vaccine_name: 'Ranikhet / Newcastle (RD F1 / Lasota)', route_of_administration: 'eye_drop', disease_targeted: 'Newcastle Disease' },
    { id: 'vs-3', bird_stage: 'chick', target_age_days: 14, vaccine_name: 'Infectious Bursal Disease (IBD Gumboro)', route_of_administration: 'drinking_water', disease_targeted: 'Gumboro Disease' },
    { id: 'vs-4', bird_stage: 'grower', target_age_days: 28, vaccine_name: 'Newcastle Disease (Lasota Booster)', route_of_administration: 'drinking_water', disease_targeted: 'Newcastle Disease' },
    { id: 'vs-5', bird_stage: 'grower', target_age_days: 56, vaccine_name: 'Infectious Coryza (Bivalent)', route_of_administration: 'subcutaneous', disease_targeted: 'Coryza' },
    { id: 'vs-6', bird_stage: 'layer', target_age_days: 112, vaccine_name: 'ND + Egg Drop Syndrome (EDS Booster)', route_of_administration: 'subcutaneous', disease_targeted: 'ND & EDS' },
  ]);
  const [vaccinationRecords, setVaccinationRecords] = useState<VaccinationRecord[]>([
    {
      id: 'vr-1',
      batch_id: 'b-G2',
      batch_code: 'BATCH-G2-2026',
      shed_id: 's-G2',
      shed_code: 'G2',
      vaccine_name: 'Infectious Coryza (Bivalent)',
      scheduled_date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
      status: 'scheduled',
      cost: 4200,
      administered_by: 'Pending Team A',
    },
    {
      id: 'vr-2',
      batch_id: 'b-C1',
      batch_code: 'BATCH-C1-2026',
      shed_id: 's-C1',
      shed_code: 'C1',
      vaccine_name: 'Ranikhet / Newcastle (RD F1)',
      scheduled_date: new Date(Date.now() - 86400000 * 5).toISOString().split('T')[0],
      actual_date: new Date(Date.now() - 86400000 * 5).toISOString().split('T')[0],
      status: 'completed',
      cost: 1500,
      administered_by: 'Dr. Srinivasan (Vet)',
    },
  ]);
  const [healthEvents, setHealthEvents] = useState<HealthEvent[]>([
    {
      id: 'he-1',
      event_date: new Date(Date.now() - 86400000 * 3).toISOString().split('T')[0],
      batch_id: 'b-L1',
      batch_code: 'BATCH-L1-2026',
      shed_id: 's-L1',
      shed_code: 'L1',
      symptoms: 'Mild sneezing and watery eyes in North corner cages',
      diagnosis: 'Early chronic respiratory symptoms due to night cold draft',
      veterinary_advice: 'Administer Enrofloxacin 10% in drinking water for 3 days and close North curtains at 9 PM',
      treatment_medicine: 'Enrocin 10% Oral Solution',
      dosage: '10ml per 100 birds',
      cost: 2800,
      associated_mortality: 4,
      follow_up_date: new Date(Date.now() + 86400000 * 4).toISOString().split('T')[0],
      responsible_person: 'Dr. Srinivasan',
    },
  ]);
  const [weightRecords, setWeightRecords] = useState<WeightRecord[]>([
    {
      id: 'wr-1',
      sample_date: new Date(Date.now() - 86400000 * 4).toISOString().split('T')[0],
      batch_id: 'b-G1',
      batch_code: 'BATCH-G1-2026',
      shed_id: 's-G1',
      shed_code: 'G1',
      birds_sampled: 100,
      average_weight_grams: 820,
      min_weight_grams: 770,
      max_weight_grams: 870,
      target_weight_grams: 810,
      difference_grams: 10,
      age_days: 75,
      notes: 'Uniform flock development, feed conversion ratio is 2.1',
    },
  ]);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([
    {
      id: 'exp-1',
      category: 'electricity',
      expense_date: new Date(Date.now() - 86400000 * 6).toISOString().split('T')[0],
      amount: 48500,
      payment_method: 'bank_transfer',
      payee: 'State Electricity Board',
      reference_no: 'EB-BILL-AUG26-9921',
      notes: 'Main farm 3-phase grid power for cooling fans and egg conveyors',
      is_accrual: false,
      created_at: new Date().toISOString(),
    },
    {
      id: 'exp-2',
      category: 'packaging_trays',
      expense_date: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0],
      amount: 15400,
      payment_method: 'upi',
      payee: 'Paper Pulp Packaging Mills',
      reference_no: 'UPI-TXN-884920',
      notes: '4,500 paper egg trays (30-egg spec)',
      is_accrual: false,
      created_at: new Date().toISOString(),
    },
  ]);
  const [electricityBills, setElectricityBills] = useState<ElectricityBill[]>([
    {
      id: 'eb-1',
      billing_month: '2026-09',
      meter_number: 'EB-MTR-98214',
      previous_reading: 42100,
      current_reading: 48250,
      units_consumed: 6150,
      rate_per_unit: 7.8,
      total_amount: 47970,
      due_date: new Date(Date.now() + 86400000 * 10).toISOString().split('T')[0],
      paid_date: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0],
      status: 'paid',
      notes: 'Transformer 1 powering Layer Sheds L1-L5',
    },
  ]);
  const [salaries, setSalaries] = useState<EmployeeSalary[]>([
    {
      id: 'sal-1',
      employee_name: 'Suresh Kumar',
      role_designation: 'Shed Manager (L1, L2, L5)',
      assigned_shed_code: 'L1',
      month: '2026-09',
      basic_salary: 28000,
      allowances: 3000,
      deductions_or_advance: 0,
      net_salary: 31000,
      payment_status: 'paid',
      payment_date: '2026-10-01',
    },
    {
      id: 'sal-2',
      employee_name: 'Amit Sharma',
      role_designation: 'Rearing & Chick Specialist',
      assigned_shed_code: 'G1',
      month: '2026-09',
      basic_salary: 25000,
      allowances: 2500,
      deductions_or_advance: 1000,
      net_salary: 26500,
      payment_status: 'paid',
      payment_date: '2026-10-01',
    },
  ]);
  const [approvalRequests, setApprovalRequests] = useState<ApprovalRequest[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([
    {
      id: 'aud-1',
      actor_id: 'u-owner-1',
      actor_name: 'Rajesh Balaji',
      actor_role: 'owner_admin',
      action: 'SYSTEM_INITIALIZATION',
      entity_type: 'SYSTEM',
      entity_id: 'FARM-100K',
      timestamp: new Date().toISOString(),
      ip_address: '127.0.0.1',
    },
  ]);
  const [notifications, setNotifications] = useState<AppNotification[]>(INITIAL_NOTIFICATIONS);

  // Load from localStorage if available
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.sheds) setSheds(parsed.sheds);
          if (parsed.batches) setBatches(parsed.batches);
          if (parsed.visibilitySettings) setVisibilitySettings(parsed.visibilitySettings);
          if (parsed.feedIngredients) setFeedIngredients(parsed.feedIngredients);
          if (parsed.dailyBirdRecords) setDailyBirdRecords(parsed.dailyBirdRecords);
          if (parsed.dailyEggRecords) setDailyEggRecords(parsed.dailyEggRecords);
          if (parsed.customers) setCustomers(parsed.customers);
          if (parsed.suppliers) setSuppliers(parsed.suppliers);
          if (parsed.eggSales) setEggSales(parsed.eggSales);
          if (parsed.birdSales) setBirdSales(parsed.birdSales);
          if (parsed.expenses) setExpenses(parsed.expenses);
          if (parsed.auditLogs) setAuditLogs(parsed.auditLogs);
          if (parsed.approvalRequests) setApprovalRequests(parsed.approvalRequests);
        }
      } catch (err) {
        console.error('Failed to load local storage state:', err);
      }
    }
  }, []);

  // Save to localStorage on state changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const payload = {
          sheds,
          batches,
          visibilitySettings,
          feedIngredients,
          dailyBirdRecords,
          dailyEggRecords,
          customers,
          suppliers,
          eggSales,
          birdSales,
          expenses,
          auditLogs,
          approvalRequests,
        };
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(payload));
      } catch (err) {
        console.error('Failed to persist state:', err);
      }
    }
  }, [
    sheds,
    batches,
    visibilitySettings,
    feedIngredients,
    dailyBirdRecords,
    dailyEggRecords,
    customers,
    suppliers,
    eggSales,
    birdSales,
    expenses,
    auditLogs,
    approvalRequests,
  ]);

  // Helper to append audit logs
  const logAudit = (action: string, entityType: string, entityId: string, oldVal?: any, newVal?: any) => {
    const entry: AuditLog = {
      id: 'aud-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      actor_id: currentUser.id,
      actor_name: currentUser.full_name,
      actor_role: currentUser.role,
      action,
      entity_type: entityType,
      entity_id: entityId,
      old_values: oldVal ? JSON.stringify(oldVal) : undefined,
      new_values: newVal ? JSON.stringify(newVal) : undefined,
      timestamp: new Date().toISOString(),
    };
    setAuditLogs((prev) => [entry, ...prev]);
  };

  // Switch Role
  const switchRole = (role: UserRole) => {
    if (role === 'owner_admin') {
      setCurrentUser({
        id: 'u-owner-1',
        email: 'owner@balajipoultry.com',
        full_name: 'Rajesh Balaji (Owner/Admin)',
        role: 'owner_admin',
        phone: '+91 98450 11223',
        is_active: true,
        created_at: new Date().toISOString(),
      });
    } else {
      setCurrentUser({
        id: 'u-mgr-1',
        email: 'manager@balajipoultry.com',
        full_name: 'Suresh Kumar (Operations Manager)',
        role: 'manager',
        phone: '+91 98450 44556',
        is_active: true,
        created_at: new Date().toISOString(),
      });
    }
    logAudit('ROLE_SWITCH', 'USER_SESSION', role, null, { role });
  };

  const updateVisibilitySettings = (newSettings: Partial<ManagerVisibilitySettings>) => {
    setVisibilitySettings((prev) => {
      const updated = { ...prev, ...newSettings };
      logAudit('UPDATE_VISIBILITY_SETTINGS', 'SETTINGS', 'manager_visibility', prev, updated);
      return updated;
    });
  };

  // Shed Operations
  const addShed = (shedData: Omit<Shed, 'id' | 'updated_at'>) => {
    const newShed: Shed = {
      ...shedData,
      id: 's-' + Date.now(),
      updated_at: new Date().toISOString(),
    };
    setSheds((prev) => [...prev, newShed]);
    logAudit('CREATE_SHED', 'SHED', newShed.code, null, newShed);
  };

  const updateShed = (id: string, updates: Partial<Shed>) => {
    setSheds((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          const updated = { ...s, ...updates, updated_at: new Date().toISOString() };
          logAudit('UPDATE_SHED', 'SHED', s.code, s, updated);
          return updated;
        }
        return s;
      })
    );
  };

  // Batch Operations
  const addBatch = (batchData: Omit<Batch, 'id'>) => {
    const newBatch: Batch = {
      ...batchData,
      id: 'b-' + Date.now(),
    };
    setBatches((prev) => [...prev, newBatch]);
    // update shed bird count
    setSheds((prev) =>
      prev.map((s) =>
        s.id === newBatch.current_shed_id
          ? { ...s, current_birds: s.current_birds + newBatch.current_count, updated_at: new Date().toISOString() }
          : s
      )
    );
    logAudit('CREATE_BATCH', 'BATCH', newBatch.batch_code, null, newBatch);
  };

  // Bird Transfer with atomic reconciliation
  const transferBirds = ({
    batchId,
    fromShedId,
    toShedId,
    quantity,
    reason,
  }: {
    batchId: string;
    fromShedId: string;
    toShedId: string;
    quantity: number;
    reason: string;
  }) => {
    const targetBatch = batches.find((b) => b.id === batchId);
    if (!targetBatch) return { success: false, error: 'Batch not found' };
    if (quantity <= 0) return { success: false, error: 'Transfer quantity must be greater than zero' };
    if (targetBatch.current_count < quantity) {
      return { success: false, error: `Transfer quantity (${quantity}) exceeds available birds (${targetBatch.current_count})` };
    }
    const fromShed = sheds.find((s) => s.id === fromShedId);
    const toShed = sheds.find((s) => s.id === toShedId);
    if (!fromShed || !toShed) return { success: false, error: 'Invalid source or destination shed' };

    // Check capacity in destination
    if (toShed.current_birds + quantity > toShed.capacity) {
      return {
        success: false,
        error: `Destination shed ${toShed.code} would exceed capacity (Max: ${toShed.capacity}, Current: ${toShed.current_birds}, Adding: ${quantity})`,
      };
    }

    // Atomic update
    const movement: BatchMovement = {
      id: 'mov-' + Date.now(),
      batch_id: batchId,
      batch_code: targetBatch.batch_code,
      from_shed_id: fromShedId,
      from_shed_code: fromShed.code,
      to_shed_id: toShedId,
      to_shed_code: toShed.code,
      quantity,
      movement_date: new Date().toISOString().split('T')[0],
      reason,
      authorized_by: currentUser.id,
      created_at: new Date().toISOString(),
    };

    setBatchMovements((prev) => [movement, ...prev]);

    // Update sheds
    setSheds((prev) =>
      prev.map((s) => {
        if (s.id === fromShedId) {
          return { ...s, current_birds: Math.max(0, s.current_birds - quantity), updated_at: new Date().toISOString() };
        }
        if (s.id === toShedId) {
          return { ...s, current_birds: s.current_birds + quantity, updated_at: new Date().toISOString() };
        }
        return s;
      })
    );

    // Update batch
    setBatches((prev) =>
      prev.map((b) => {
        if (b.id === batchId) {
          return {
            ...b,
            current_shed_id: toShedId,
            current_shed_code: toShed.code,
            // If full transfer, shed moves; if split transfer, we can adjust count
          };
        }
        return b;
      })
    );

    logAudit('TRANSFER_BIRDS', 'BATCH_MOVEMENT', movement.id, null, movement);
    return { success: true };
  };

  // Daily Bird Entry
  const addDailyBirdRecord = (recordData: Omit<DailyBirdRecord, 'id' | 'submitted_at'>) => {
    // Check for duplicate on same date and shed
    const exists = dailyBirdRecords.some(
      (r) => r.record_date === recordData.record_date && r.shed_id === recordData.shed_id
    );
    if (exists) {
      return { success: false, error: `Daily record already exists for ${recordData.shed_code} on ${recordData.record_date}` };
    }

    const calculatedClosing = calculateClosingBirds(
      recordData.opening_birds,
      recordData.birds_received,
      recordData.transfers_in,
      recordData.transfers_out,
      recordData.mortality,
      recordData.culls,
      recordData.bird_sales,
      recordData.other_removals
    );

    if (calculatedClosing < 0) {
      return { success: false, error: 'Calculated closing count cannot be negative' };
    }

    const newRecord: DailyBirdRecord = {
      ...recordData,
      closing_birds: calculatedClosing,
      id: 'dbr-' + Date.now(),
      submitted_at: new Date().toISOString(),
    };

    setDailyBirdRecords((prev) => [newRecord, ...prev]);

    // Update Shed & Batch live counts
    setSheds((prev) =>
      prev.map((s) => (s.id === recordData.shed_id ? { ...s, current_birds: calculatedClosing, updated_at: new Date().toISOString() } : s))
    );
    setBatches((prev) =>
      prev.map((b) => (b.id === recordData.batch_id ? { ...b, current_count: calculatedClosing } : b))
    );

    // If egg count entered for layer, update egg warehouse inventory
    if (recordData.egg_count && recordData.egg_count > 0) {
      const goodEggs = Math.max(0, recordData.egg_count - (recordData.damaged_eggs || 0) - (recordData.broken_eggs || 0));
      const trayInfo = convertEggsToTrays(goodEggs);
      const eggRec: DailyEggRecord = {
        id: 'egg-rec-' + Date.now(),
        collection_date: recordData.record_date,
        shed_id: recordData.shed_id,
        shed_code: recordData.shed_code,
        batch_id: recordData.batch_id,
        batch_code: recordData.batch_code,
        opening_layer_birds: recordData.opening_birds,
        total_eggs_collected: recordData.egg_count,
        good_eggs: goodEggs,
        damaged_eggs: recordData.damaged_eggs || 0,
        broken_eggs: recordData.broken_eggs || 0,
        rejected_eggs: 0,
        trays_count: trayInfo.trays,
        loose_eggs_count: trayInfo.loose,
        production_percentage: calculateEggProductionPct(recordData.egg_count, recordData.opening_birds),
        entered_by: currentUser.id,
        created_at: new Date().toISOString(),
      };
      setDailyEggRecords((prev) => [eggRec, ...prev]);

      // Add to egg warehouse stock
      setWarehouseItems((prev) =>
        prev.map((item) =>
          item.category === 'eggs' ? { ...item, current_quantity: item.current_quantity + goodEggs } : item
        )
      );
    }

    logAudit('CREATE_DAILY_ENTRY', 'DAILY_BIRD_RECORD', newRecord.id, null, newRecord);
    return { success: true };
  };

  // Add Daily Egg Record standalone
  const addDailyEggRecord = (recordData: Omit<DailyEggRecord, 'id' | 'created_at'>) => {
    const newRecord: DailyEggRecord = {
      ...recordData,
      id: 'der-' + Date.now(),
      created_at: new Date().toISOString(),
    };
    setDailyEggRecords((prev) => [newRecord, ...prev]);

    // Update egg stock
    setWarehouseItems((prev) =>
      prev.map((item) =>
        item.category === 'eggs' ? { ...item, current_quantity: item.current_quantity + recordData.good_eggs } : item
      )
    );

    logAudit('CREATE_EGG_RECORD', 'DAILY_EGG_RECORD', newRecord.id, null, newRecord);
    return { success: true };
  };

  // Feed Ingredients
  const addFeedIngredient = (ing: Omit<FeedIngredient, 'id' | 'updated_at'>) => {
    const newIng: FeedIngredient = {
      ...ing,
      id: 'ing-' + Date.now(),
      updated_at: new Date().toISOString(),
    };
    setFeedIngredients((prev) => [...prev, newIng]);
    logAudit('CREATE_INGREDIENT', 'FEED_INGREDIENT', newIng.code, null, newIng);
  };

  const updateFeedIngredient = (id: string, updates: Partial<FeedIngredient>) => {
    setFeedIngredients((prev) =>
      prev.map((ing) => (ing.id === id ? { ...ing, ...updates, updated_at: new Date().toISOString() } : ing))
    );
  };

  // Recipes
  const addRecipe = (recipeData: Omit<FeedRecipe, 'id'>) => {
    const totalPct = recipeData.items.reduce((sum, item) => sum + item.percentage, 0);
    if (Math.abs(totalPct - 100) > 0.01) {
      throw new Error(`Recipe percentages must sum to exactly 100% (Current sum: ${totalPct.toFixed(2)}%)`);
    }
    const newRecipe: FeedRecipe = {
      ...recipeData,
      id: 'rec-' + Date.now(),
    };
    setRecipes((prev) => [...prev, newRecipe]);
    logAudit('CREATE_RECIPE', 'FEED_RECIPE', newRecipe.name, null, newRecipe);
  };

  // Feed Production (Atomic deduction of ingredients and addition to finished feed)
  const produceFeed = ({
    recipeId,
    producedQuantityKg,
    productionLossKg,
    batchNumber,
  }: {
    recipeId: string;
    producedQuantityKg: number;
    productionLossKg: number;
    batchNumber: string;
  }) => {
    const recipe = recipes.find((r) => r.id === recipeId);
    if (!recipe) return { success: false, error: 'Recipe not found' };

    const totalRawNeeded = producedQuantityKg + productionLossKg;
    const ingredientsUsed: FeedProduction['ingredients_used'] = [];
    let totalCost = 0;

    // Check availability of each ingredient
    for (const item of recipe.items) {
      const ing = feedIngredients.find((i) => i.id === item.ingredient_id);
      if (!ing) return { success: false, error: `Ingredient ${item.ingredient_name} not found` };
      const neededKg = (item.percentage / 100) * totalRawNeeded;
      if (ing.current_stock_kg < neededKg) {
        return {
          success: false,
          error: `Insufficient stock for ${ing.name}. Required: ${neededKg.toFixed(1)}kg, Available: ${ing.current_stock_kg.toFixed(1)}kg`,
        };
      }
      const itemCost = neededKg * ing.unit_price_per_kg;
      totalCost += itemCost;
      ingredientsUsed.push({
        ingredient_id: ing.id,
        ingredient_name: ing.name,
        quantity_used_kg: Number(neededKg.toFixed(2)),
        unit_price: ing.unit_price_per_kg,
        cost: Number(itemCost.toFixed(2)),
      });
    }

    // Atomic deductions
    setFeedIngredients((prev) =>
      prev.map((ing) => {
        const used = ingredientsUsed.find((u) => u.ingredient_id === ing.id);
        if (used) {
          return {
            ...ing,
            current_stock_kg: Math.max(0, ing.current_stock_kg - used.quantity_used_kg),
            updated_at: new Date().toISOString(),
          };
        }
        return ing;
      })
    );

    // Add finished feed record
    const costPerKg = producedQuantityKg > 0 ? totalCost / producedQuantityKg : 0;
    const production: FeedProduction = {
      id: 'prod-' + Date.now(),
      batch_number: batchNumber,
      recipe_id: recipeId,
      recipe_name: recipe.name,
      production_date: new Date().toISOString().split('T')[0],
      produced_quantity_kg: producedQuantityKg,
      production_loss_kg: productionLossKg,
      total_ingredient_cost: totalCost,
      cost_per_kg: Number(costPerKg.toFixed(2)),
      ingredients_used: ingredientsUsed,
      recorded_by: currentUser.id,
      created_at: new Date().toISOString(),
    };

    setFeedProductions((prev) => [production, ...prev]);

    // Update warehouse stock of finished feed (convert kg to 50kg bags)
    const bagsProduced = Math.floor(producedQuantityKg / 50);
    setWarehouseItems((prev) =>
      prev.map((item) =>
        item.category === 'finished_feed'
          ? { ...item, current_quantity: item.current_quantity + bagsProduced, updated_at: new Date().toISOString() }
          : item
      )
    );

    logAudit('PRODUCE_FEED', 'FEED_PRODUCTION', batchNumber, null, production);
    return { success: true };
  };

  // Issue Feed to Shed
  const issueFeedToShed = (issueData: Omit<FeedIssue, 'id' | 'created_at'>) => {
    const net = issueData.quantity_issued_kg - (issueData.quantity_returned_kg || 0);
    const newIssue: FeedIssue = {
      ...issueData,
      net_consumed_kg: Math.max(0, net),
      id: 'issue-' + Date.now(),
    };
    setFeedIssues((prev) => [newIssue, ...prev]);
    logAudit('ISSUE_FEED', 'FEED_ISSUE', newIssue.id, null, newIssue);
    return { success: true };
  };

  // Warehouse Items
  const updateWarehouseItem = (id: string, updates: Partial<WarehouseStockItem>) => {
    setWarehouseItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates, updated_at: new Date().toISOString() } : item))
    );
  };

  // Customers & Suppliers
  const addCustomer = (custData: Omit<Customer, 'id'>) => {
    const newCust: Customer = {
      ...custData,
      id: 'cust-' + Date.now(),
    };
    setCustomers((prev) => [...prev, newCust]);
    logAudit('CREATE_CUSTOMER', 'CUSTOMER', newCust.name, null, newCust);
  };

  const addSupplier = (suppData: Omit<Supplier, 'id'>) => {
    const newSupp: Supplier = {
      ...suppData,
      id: 'supp-' + Date.now(),
    };
    setSuppliers((prev) => [...prev, newSupp]);
    logAudit('CREATE_SUPPLIER', 'SUPPLIER', newSupp.name, null, newSupp);
  };

  // Egg Sales
  const createEggSale = (saleData: Omit<EggSale, 'id' | 'created_at'>) => {
    const eggStockItem = warehouseItems.find((w) => w.category === 'eggs');
    if (eggStockItem && eggStockItem.current_quantity < saleData.total_eggs) {
      return {
        success: false,
        error: `Insufficient egg inventory in stock! Required: ${saleData.total_eggs}, Available: ${eggStockItem.current_quantity}`,
      };
    }

    const newSale: EggSale = {
      ...saleData,
      id: 'esale-' + Date.now(),
      created_at: new Date().toISOString(),
    };

    setEggSales((prev) => [newSale, ...prev]);

    // Deduct eggs from warehouse stock
    if (eggStockItem) {
      setWarehouseItems((prev) =>
        prev.map((w) =>
          w.id === eggStockItem.id
            ? { ...w, current_quantity: Math.max(0, w.current_quantity - saleData.total_eggs), updated_at: new Date().toISOString() }
            : w
        )
      );
    }

    // Update customer receivable balance (Add outstanding amount)
    if (saleData.outstanding_amount > 0) {
      setCustomers((prev) =>
        prev.map((c) =>
          c.id === saleData.customer_id
            ? { ...c, current_balance: c.current_balance + saleData.outstanding_amount }
            : c
        )
      );
    }

    logAudit('CREATE_EGG_SALE', 'EGG_SALE', newSale.invoice_no, null, newSale);
    return { success: true };
  };

  // Bird Sales
  const createBirdSale = (saleData: Omit<BirdSale, 'id' | 'created_at'>) => {
    const shed = sheds.find((s) => s.id === saleData.shed_id);
    const batch = batches.find((b) => b.id === saleData.batch_id);
    if (!shed || !batch) return { success: false, error: 'Invalid shed or batch selected' };

    if (batch.current_count < saleData.bird_quantity) {
      return {
        success: false,
        error: `Sale quantity (${saleData.bird_quantity}) exceeds available flock in batch (${batch.current_count})`,
      };
    }

    const newSale: BirdSale = {
      ...saleData,
      id: 'bsale-' + Date.now(),
      created_at: new Date().toISOString(),
    };

    setBirdSales((prev) => [newSale, ...prev]);

    // Deduct live birds from batch and shed atomically
    setBatches((prev) =>
      prev.map((b) =>
        b.id === saleData.batch_id
          ? { ...b, current_count: Math.max(0, b.current_count - saleData.bird_quantity) }
          : b
      )
    );
    setSheds((prev) =>
      prev.map((s) =>
        s.id === saleData.shed_id
          ? { ...s, current_birds: Math.max(0, s.current_birds - saleData.bird_quantity), updated_at: new Date().toISOString() }
          : s
      )
    );

    // Update customer outstanding receivable balance
    if (saleData.outstanding_amount > 0) {
      setCustomers((prev) =>
        prev.map((c) =>
          c.id === saleData.customer_id
            ? { ...c, current_balance: c.current_balance + saleData.outstanding_amount }
            : c
        )
      );
    }

    logAudit('CREATE_BIRD_SALE', 'BIRD_SALE', newSale.invoice_no, null, newSale);
    return { success: true };
  };

  // Supplier Bill
  const createSupplierBill = (billData: Omit<SupplierBill, 'id' | 'created_at'>) => {
    const newBill: SupplierBill = {
      ...billData,
      id: 'sbill-' + Date.now(),
      created_at: new Date().toISOString(),
    };
    setSupplierBills((prev) => [newBill, ...prev]);

    // Update supplier payable balance
    setSuppliers((prev) =>
      prev.map((s) =>
        s.id === billData.supplier_id
          ? { ...s, current_balance: s.current_balance + billData.outstanding_amount }
          : s
      )
    );

    logAudit('CREATE_SUPPLIER_BILL', 'SUPPLIER_BILL', newBill.bill_no, null, newBill);
  };

  // Payments
  const recordPayment = (paymentData: Omit<PaymentTransaction, 'id' | 'created_at'>) => {
    const newPayment: PaymentTransaction = {
      ...paymentData,
      id: 'pay-' + Date.now(),
      created_at: new Date().toISOString(),
    };
    setPayments((prev) => [newPayment, ...prev]);

    // Adjust balance according to party
    if (paymentData.party_type === 'customer') {
      setCustomers((prev) =>
        prev.map((c) =>
          c.id === paymentData.party_id
            ? { ...c, current_balance: Math.max(0, c.current_balance - paymentData.amount) }
            : c
        )
      );
    } else if (paymentData.party_type === 'supplier') {
      setSuppliers((prev) =>
        prev.map((s) =>
          s.id === paymentData.party_id
            ? { ...s, current_balance: Math.max(0, s.current_balance - paymentData.amount) }
            : s
        )
      );
    }

    logAudit('RECORD_PAYMENT', 'PAYMENT', newPayment.receipt_no, null, newPayment);
  };

  // Health, Vaccination & Weight
  const addVaccinationRecord = (rec: Omit<VaccinationRecord, 'id' | 'created_at'>) => {
    const newRec: VaccinationRecord = {
      ...rec,
      id: 'vr-' + Date.now(),
    };
    setVaccinationRecords((prev) => [newRec, ...prev]);
    logAudit('SCHEDULE_VACCINE', 'VACCINATION', newRec.vaccine_name, null, newRec);
  };

  const updateVaccinationStatus = (id: string, status: VaccinationRecord['status'], cost?: number) => {
    setVaccinationRecords((prev) =>
      prev.map((v) =>
        v.id === id
          ? {
              ...v,
              status,
              actual_date: status === 'completed' ? new Date().toISOString().split('T')[0] : v.actual_date,
              cost: cost !== undefined ? cost : v.cost,
            }
          : v
      )
    );
  };

  const addHealthEvent = (ev: Omit<HealthEvent, 'id' | 'created_at'>) => {
    const newEv: HealthEvent = {
      ...ev,
      id: 'he-' + Date.now(),
    };
    setHealthEvents((prev) => [newEv, ...prev]);
    logAudit('RECORD_HEALTH_EVENT', 'HEALTH_EVENT', newEv.diagnosis, null, newEv);
  };

  const addWeightRecord = (rec: Omit<WeightRecord, 'id' | 'created_at'>) => {
    const newRec: WeightRecord = {
      ...rec,
      id: 'wr-' + Date.now(),
    };
    setWeightRecords((prev) => [newRec, ...prev]);
    logAudit('RECORD_WEIGHT', 'WEIGHT_MONITORING', newRec.id, null, newRec);
  };

  // Expenses & Financials
  const addExpense = (expData: Omit<ExpenseRecord, 'id' | 'created_at'>) => {
    const newExp: ExpenseRecord = {
      ...expData,
      id: 'exp-' + Date.now(),
      created_at: new Date().toISOString(),
    };
    setExpenses((prev) => [newExp, ...prev]);
    logAudit('RECORD_EXPENSE', 'EXPENSE', newExp.id, null, newExp);
  };

  const addElectricityBill = (bill: Omit<ElectricityBill, 'id'>) => {
    const newBill: ElectricityBill = {
      ...bill,
      id: 'eb-' + Date.now(),
    };
    setElectricityBills((prev) => [newBill, ...prev]);
  };

  const addSalaryRecord = (sal: Omit<EmployeeSalary, 'id'>) => {
    const newSal: EmployeeSalary = {
      ...sal,
      id: 'sal-' + Date.now(),
    };
    setSalaries((prev) => [newSal, ...prev]);
  };

  // Approvals
  const createApprovalRequest = (req: Omit<ApprovalRequest, 'id' | 'status' | 'created_at' | 'updated_at'>) => {
    const newReq: ApprovalRequest = {
      ...req,
      id: 'appr-' + Date.now(),
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setApprovalRequests((prev) => [newReq, ...prev]);
    logAudit('SUBMIT_APPROVAL_REQUEST', 'APPROVAL', newReq.id, null, newReq);
  };

  const reviewApprovalRequest = (id: string, status: 'approved' | 'rejected', reviewNotes?: string) => {
    setApprovalRequests((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status,
              reviewed_by: currentUser.id,
              review_notes: reviewNotes,
              updated_at: new Date().toISOString(),
            }
          : r
      )
    );
    logAudit('REVIEW_APPROVAL', 'APPROVAL', id, null, { status, reviewNotes });
  };

  // Notifications
  const markNotificationRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  };

  // Reset Data to initial
  const resetAllData = () => {
    setSheds(INITIAL_SHEDS);
    setBatches(INITIAL_BATCHES);
    setFeedIngredients(INITIAL_FEED_INGREDIENTS);
    setRecipes(INITIAL_RECIPES);
    setCustomers(INITIAL_CUSTOMERS);
    setSuppliers(INITIAL_SUPPLIERS);
    setWarehouseItems(INITIAL_WAREHOUSE_ITEMS);
    setDailyBirdRecords([]);
    setDailyEggRecords([]);
    setEggSales([]);
    setBirdSales([]);
    setExpenses([]);
    setAuditLogs([
      {
        id: 'aud-reset',
        actor_id: currentUser.id,
        actor_name: currentUser.full_name,
        actor_role: currentUser.role,
        action: 'RESET_TO_INITIAL_SEED',
        entity_type: 'SYSTEM',
        entity_id: 'ALL',
        timestamp: new Date().toISOString(),
      },
    ]);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  };

  return (
    <FarmContext.Provider
      value={{
        currentUser,
        switchRole,
        visibilitySettings,
        updateVisibilitySettings,
        sheds,
        batches,
        batchMovements,
        addShed,
        updateShed,
        addBatch,
        transferBirds,
        dailyBirdRecords,
        addDailyBirdRecord,
        dailyEggRecords,
        addDailyEggRecord,
        feedIngredients,
        recipes,
        feedProductions,
        feedIssues,
        addFeedIngredient,
        updateFeedIngredient,
        addRecipe,
        produceFeed,
        issueFeedToShed,
        warehouseItems,
        updateWarehouseItem,
        customers,
        eggSales,
        birdSales,
        suppliers,
        supplierBills,
        payments,
        addCustomer,
        addSupplier,
        createEggSale,
        createBirdSale,
        createSupplierBill,
        recordPayment,
        vaccinationSchedules,
        vaccinationRecords,
        healthEvents,
        weightRecords,
        addVaccinationRecord,
        updateVaccinationStatus,
        addHealthEvent,
        addWeightRecord,
        expenses,
        electricityBills,
        salaries,
        addExpense,
        addElectricityBill,
        addSalaryRecord,
        approvalRequests,
        createApprovalRequest,
        reviewApprovalRequest,
        auditLogs,
        logAudit,
        notifications,
        markNotificationRead,
        resetAllData,
      }}
    >
      {children}
    </FarmContext.Provider>
  );
}

export function useFarm() {
  const context = useContext(FarmContext);
  if (!context) {
    throw new Error('useFarm must be used within a FarmProvider');
  }
  return context;
}
