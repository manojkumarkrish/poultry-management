'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  UserProfile,
  UserRole,
  ManagerVisibilitySettings,
  FarmProfile,
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
import { formatNumber, formatCurrency } from '@/lib/utils/formatters';
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
  INITIAL_FARM_PROFILE,
  INITIAL_EGG_SALES,
  INITIAL_BIRD_SALES,
  INITIAL_SUPPLIER_BILLS,
  INITIAL_PAYMENTS,
  INITIAL_USERS,
} from './initialData';
import {
  getStoredSession,
  saveStoredSession,
  clearStoredSession,
  createSession,
  verifyUserCredentials,
  saveUserCredential,
  getCredentialStore,
  parseAndVerifyToken,
} from '@/lib/auth/authUtils';
import { createClient } from '@/lib/supabase/client';

interface FarmContextType {
  currentUser: UserProfile;
  authenticatedUser: UserProfile;
  isAdmin: boolean;
  isPreviewingManager: boolean;
  users: UserProfile[];
  isAuthenticated: boolean;
  authLoading: boolean;
  login: (emailOrUsername: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  setUserPassword: (userId: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  switchRole: (role: UserRole, userId?: string) => { success: boolean; error?: string };
  updateCurrentUser: (updates: Partial<UserProfile>) => { success: boolean; error?: string };
  addUser: (user: Omit<UserProfile, 'id' | 'created_at'>, initialPassword?: string) => Promise<{ success: boolean; error?: string; user?: UserProfile }>;
  updateUser: (id: string, updates: Partial<UserProfile>) => { success: boolean; error?: string };
  deleteUser: (id: string) => { success: boolean; error?: string };
  visibilitySettings: ManagerVisibilitySettings;
  updateVisibilitySettings: (newSettings: Partial<ManagerVisibilitySettings>) => { success: boolean; error?: string };
  getActiveAdminCount: (excludeUserId?: string) => number;

  // Farm Profile & Invoicing
  farmProfile: FarmProfile;
  updateFarmProfile: (updates: Partial<FarmProfile>) => { success: boolean; error?: string };

  // Permission Checks
  canEdit: (recordDate?: string) => boolean;
  canDelete: (isSensitive?: boolean) => boolean;
  
  // Sheds & Batches
  sheds: Shed[];
  batches: Batch[];
  batchMovements: BatchMovement[];
  addShed: (shed: Omit<Shed, 'id' | 'updated_at'>) => void;
  updateShed: (id: string, updates: Partial<Shed>) => void;
  deleteShed: (id: string) => { success: boolean; error?: string };
  addBatch: (batch: Omit<Batch, 'id'>) => void;
  updateBatch: (id: string, updates: Partial<Batch>) => { success: boolean; error?: string };
  deleteBatch: (id: string) => { success: boolean; error?: string };
  transferBirds: (params: {
    batchId: string;
    fromShedId: string;
    toShedId: string;
    quantity: number;
    reason: string;
  }) => { success: boolean; error?: string };
  reverseBatchMovement: (id: string) => { success: boolean; error?: string };

  // Daily Records
  dailyBirdRecords: DailyBirdRecord[];
  addDailyBirdRecord: (record: Omit<DailyBirdRecord, 'id' | 'submitted_at'>) => { success: boolean; error?: string };
  updateDailyBirdRecord: (id: string, updates: Partial<DailyBirdRecord>) => { success: boolean; error?: string };
  deleteDailyBirdRecord: (id: string) => { success: boolean; error?: string };
  dailyEggRecords: DailyEggRecord[];
  addDailyEggRecord: (record: Omit<DailyEggRecord, 'id' | 'created_at'>) => { success: boolean; error?: string };
  updateDailyEggRecord: (id: string, updates: Partial<DailyEggRecord>) => { success: boolean; error?: string };
  deleteDailyEggRecord: (id: string) => { success: boolean; error?: string };

  // Feed
  feedIngredients: FeedIngredient[];
  recipes: FeedRecipe[];
  feedProductions: FeedProduction[];
  feedIssues: FeedIssue[];
  addFeedIngredient: (ing: Omit<FeedIngredient, 'id' | 'updated_at'>) => void;
  updateFeedIngredient: (id: string, updates: Partial<FeedIngredient>) => void;
  deleteFeedIngredient: (id: string) => { success: boolean; error?: string };
  addRecipe: (recipe: Omit<FeedRecipe, 'id'>) => void;
  updateRecipe: (id: string, updates: Partial<FeedRecipe>) => { success: boolean; error?: string };
  deleteRecipe: (id: string) => { success: boolean; error?: string };
  produceFeed: (params: {
    recipeId: string;
    producedQuantityKg: number;
    productionLossKg: number;
    batchNumber: string;
  }) => { success: boolean; error?: string };
  cancelFeedProduction: (id: string) => { success: boolean; error?: string };
  issueFeedToShed: (issue: Omit<FeedIssue, 'id' | 'created_at'>) => { success: boolean; error?: string };
  updateFeedIssue: (id: string, updates: Partial<FeedIssue>) => { success: boolean; error?: string };
  deleteFeedIssue: (id: string) => { success: boolean; error?: string };

  // Inventory & Warehouse
  warehouseItems: WarehouseStockItem[];
  addWarehouseItem: (item: Omit<WarehouseStockItem, 'id' | 'updated_at'>) => void;
  updateWarehouseItem: (id: string, updates: Partial<WarehouseStockItem>) => void;
  deleteWarehouseItem: (id: string) => { success: boolean; error?: string };

  // Sales & Accounts
  customers: Customer[];
  eggSales: EggSale[];
  birdSales: BirdSale[];
  suppliers: Supplier[];
  supplierBills: SupplierBill[];
  payments: PaymentTransaction[];
  addCustomer: (cust: Omit<Customer, 'id'>) => void;
  updateCustomer: (id: string, updates: Partial<Customer>) => { success: boolean; error?: string };
  deleteCustomer: (id: string) => { success: boolean; error?: string };
  addSupplier: (supp: Omit<Supplier, 'id'>) => void;
  updateSupplier: (id: string, updates: Partial<Supplier>) => { success: boolean; error?: string };
  deleteSupplier: (id: string) => { success: boolean; error?: string };
  createEggSale: (sale: Omit<EggSale, 'id' | 'created_at'>) => { success: boolean; error?: string };
  updateEggSale: (id: string, updates: Partial<EggSale>) => { success: boolean; error?: string };
  cancelEggSale: (id: string) => { success: boolean; error?: string };
  createBirdSale: (sale: Omit<BirdSale, 'id' | 'created_at'>) => { success: boolean; error?: string };
  updateBirdSale: (id: string, updates: Partial<BirdSale>) => { success: boolean; error?: string };
  cancelBirdSale: (id: string) => { success: boolean; error?: string };
  createSupplierBill: (bill: Omit<SupplierBill, 'id' | 'created_at'>) => void;
  updateSupplierBill: (id: string, updates: Partial<SupplierBill>) => { success: boolean; error?: string };
  deleteSupplierBill: (id: string) => { success: boolean; error?: string };
  recordPayment: (payment: Omit<PaymentTransaction, 'id' | 'created_at'>) => void;
  updatePayment: (id: string, updates: Partial<PaymentTransaction>) => { success: boolean; error?: string };
  deletePayment: (id: string) => { success: boolean; error?: string };

  // Health, Vaccination & Weight
  vaccinationSchedules: VaccinationSchedule[];
  vaccinationRecords: VaccinationRecord[];
  healthEvents: HealthEvent[];
  weightRecords: WeightRecord[];
  addVaccinationRecord: (rec: Omit<VaccinationRecord, 'id' | 'created_at'>) => void;
  updateVaccinationRecord: (id: string, updates: Partial<VaccinationRecord>) => { success: boolean; error?: string };
  deleteVaccinationRecord: (id: string) => { success: boolean; error?: string };
  updateVaccinationStatus: (id: string, status: VaccinationRecord['status'], cost?: number) => void;
  addHealthEvent: (ev: Omit<HealthEvent, 'id' | 'created_at'>) => void;
  updateHealthEvent: (id: string, updates: Partial<HealthEvent>) => { success: boolean; error?: string };
  deleteHealthEvent: (id: string) => { success: boolean; error?: string };
  addWeightRecord: (rec: Omit<WeightRecord, 'id' | 'created_at'>) => void;
  updateWeightRecord: (id: string, updates: Partial<WeightRecord>) => { success: boolean; error?: string };
  deleteWeightRecord: (id: string) => { success: boolean; error?: string };

  // Financials
  expenses: ExpenseRecord[];
  electricityBills: ElectricityBill[];
  salaries: EmployeeSalary[];
  addExpense: (exp: Omit<ExpenseRecord, 'id' | 'created_at'>) => void;
  updateExpense: (id: string, updates: Partial<ExpenseRecord>) => { success: boolean; error?: string };
  deleteExpense: (id: string) => { success: boolean; error?: string };
  addElectricityBill: (bill: Omit<ElectricityBill, 'id'>) => void;
  updateElectricityBill: (id: string, updates: Partial<ElectricityBill>) => { success: boolean; error?: string };
  deleteElectricityBill: (id: string) => { success: boolean; error?: string };
  addSalaryRecord: (salary: Omit<EmployeeSalary, 'id'>) => void;
  updateSalaryRecord: (id: string, updates: Partial<EmployeeSalary>) => { success: boolean; error?: string };
  deleteSalaryRecord: (id: string) => { success: boolean; error?: string };

  // Approvals & Audits
  approvalRequests: ApprovalRequest[];
  createApprovalRequest: (req: Omit<ApprovalRequest, 'id' | 'status' | 'created_at' | 'updated_at'>) => void;
  reviewApprovalRequest: (id: string, status: 'approved' | 'rejected', reviewNotes?: string) => void;
  auditLogs: AuditLog[];
  logAudit: (action: string, entityType: string, entityId: string, oldVal?: any, newVal?: any) => void;

  // Notifications
  notifications: AppNotification[];
  markNotificationRead: (id: string) => void;

  // Reset operational data (Admin only, two-step confirmation)
  resetOperationalData: (
    confirmationPhrase: string,
    adminPassword: string
  ) => Promise<{ success: boolean; error?: string; message?: string }>;
  resetAllData: () => void;
}

const FarmContext = createContext<FarmContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'kasthuri_poultry_farm_state_v2';

const UNAUTHENTICATED_USER: UserProfile = {
  id: '',
  email: '',
  full_name: 'Guest User',
  role: 'manager',
  is_active: false,
  created_at: '',
};

export function FarmProvider({
  children,
  initialRole,
  initialUserId,
}: {
  children: React.ReactNode;
  initialRole?: UserRole;
  initialUserId?: string;
}) {
  const initialUser: UserProfile = initialRole
    ? INITIAL_USERS.find((u) => u.id === initialUserId || u.role === initialRole) || {
        ...UNAUTHENTICATED_USER,
        role: initialRole,
        is_active: true,
      }
    : UNAUTHENTICATED_USER;

  // Farm users and active session representation
  const [users, setUsers] = useState<UserProfile[]>(INITIAL_USERS);
  const [authenticatedUser, setAuthenticatedUser] = useState<UserProfile>(initialUser);
  const [previewRole, setPreviewRole] = useState<UserRole | null>(null);
  const [currentUser, setCurrentUser] = useState<UserProfile>(initialUser);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!initialRole);
  const [authLoading, setAuthLoading] = useState<boolean>(!initialRole);
  const sessionEstablishedRef = useRef<boolean>(!!initialRole);
  const isLoadedRef = useRef<boolean>(false);

  const [farmProfile, setFarmProfile] = useState<FarmProfile>(INITIAL_FARM_PROFILE);
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
  const [eggSales, setEggSales] = useState<EggSale[]>(INITIAL_EGG_SALES);
  const [birdSales, setBirdSales] = useState<BirdSale[]>(INITIAL_BIRD_SALES);
  const [suppliers, setSuppliers] = useState<Supplier[]>(INITIAL_SUPPLIERS);
  const [supplierBills, setSupplierBills] = useState<SupplierBill[]>(INITIAL_SUPPLIER_BILLS);
  const [payments, setPayments] = useState<PaymentTransaction[]>(INITIAL_PAYMENTS);
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
      vaccine_name: 'Newcastle Disease (Lasota Booster)',
      scheduled_date: new Date().toISOString().split('T')[0],
      status: 'completed',
      actual_date: new Date().toISOString().split('T')[0],
      cost: 2800,
      administered_by: 'Dr. Venkatesh (Vet)',
    },
  ]);
  const [healthEvents, setHealthEvents] = useState<HealthEvent[]>([
    {
      id: 'he-1',
      event_date: new Date(Date.now() - 86400000 * 3).toISOString().split('T')[0],
      batch_id: 'b-L1',
      batch_code: 'BATCH-L1-2025',
      shed_id: 's-L1',
      shed_code: 'L1',
      symptoms: 'Mild watery droppings observed in row 3 lower cages',
      diagnosis: 'Dietary stress / early enteritis',
      veterinary_advice: 'Administer probiotic in drinking water for 3 days',
      treatment_medicine: 'GutPro WS probiotic 500g',
      dosage: '1g per 5L water',
      cost: 1650,
      associated_mortality: 2,
      responsible_person: 'Suresh Kumar',
    },
  ]);
  const [weightRecords, setWeightRecords] = useState<WeightRecord[]>([
    {
      id: 'wr-1',
      sample_date: new Date().toISOString().split('T')[0],
      batch_id: 'b-C1',
      batch_code: 'BATCH-C1-2026',
      shed_id: 's-C1',
      shed_code: 'C1',
      birds_sampled: 100,
      average_weight_grams: 184,
      target_weight_grams: 180,
      difference_grams: 4,
      age_days: 14,
      notes: 'Sampled randomly across 4 brooding quadrants. Good uniformity (88%).',
    },
    {
      id: 'wr-2',
      sample_date: new Date(Date.now() - 86400000 * 4).toISOString().split('T')[0],
      batch_id: 'b-G1',
      batch_code: 'BATCH-G1-2025',
      shed_id: 's-G1',
      shed_code: 'G1',
      birds_sampled: 120,
      average_weight_grams: 955,
      target_weight_grams: 940,
      difference_grams: 15,
      age_days: 70,
      notes: 'Weekly standard body weight check. Feed intake standard.',
    },
  ]);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([
    {
      id: 'exp-1',
      category: 'electricity',
      expense_date: new Date().toISOString().split('T')[0],
      amount: 45000,
      payment_method: 'bank_transfer',
      payee: 'State Electricity Board',
      reference_no: 'EB-SEP-2026-9812',
      notes: 'Farm main transformer power bill for Sep 2026',
      is_accrual: false,
      created_at: new Date().toISOString(),
    },
    {
      id: 'exp-2',
      category: 'packaging_trays',
      expense_date: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0],
      amount: 18500,
      payment_method: 'upi',
      payee: 'Sri Balaji Packaging Corp',
      reference_no: 'UPI-9812039120',
      notes: '5,000 paper pulp egg trays (30-egg format)',
      is_accrual: false,
      created_at: new Date().toISOString(),
    },
  ]);
  const [electricityBills, setElectricityBills] = useState<ElectricityBill[]>([
    {
      id: 'eb-1',
      billing_month: '2026-09',
      meter_number: 'HT-EB-77891',
      previous_reading: 142500,
      current_reading: 148900,
      units_consumed: 6400,
      rate_per_unit: 7.2,
      total_amount: 46080,
      due_date: '2026-10-25',
      status: 'paid',
      paid_date: '2026-10-14',
      notes: 'Main agricultural tariff HT supply',
    },
  ]);
  const [salaries, setSalaries] = useState<EmployeeSalary[]>([
    {
      id: 'sal-1',
      employee_name: 'Suresh Kumar',
      role_designation: 'Senior Farm Supervisor (L1-L2, C1)',
      assigned_shed_code: 'L1',
      month: '2026-09',
      basic_salary: 28000,
      allowances: 3000,
      deductions_or_advance: 0,
      net_salary: 31000,
      payment_status: 'paid',
      payment_date: '2026-10-05',
    },
    {
      id: 'sal-2',
      employee_name: 'Ramesh Patel',
      role_designation: 'Shed Manager (L3-L5)',
      assigned_shed_code: 'L3',
      month: '2026-09',
      basic_salary: 26000,
      allowances: 2500,
      deductions_or_advance: 1000,
      net_salary: 27500,
      payment_status: 'paid',
      payment_date: '2026-10-05',
    },
  ]);
  const [approvalRequests, setApprovalRequests] = useState<ApprovalRequest[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([
    {
      id: 'aud-seed-1',
      actor_id: 'u-owner-1',
      actor_name: 'Rajesh Kasthuri (Owner/Admin)',
      actor_role: 'owner_admin',
      action: 'SYSTEM_INITIALIZATION',
      entity_type: 'FARM',
      entity_id: 'KPF-100K',
      timestamp: new Date().toISOString(),
    },
  ]);
  const [notifications, setNotifications] = useState<AppNotification[]>(INITIAL_NOTIFICATIONS);

  // Load from local storage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed.sheds)) setSheds(parsed.sheds);
        if (Array.isArray(parsed.batches)) setBatches(parsed.batches);
        if (Array.isArray(parsed.batchMovements)) setBatchMovements(parsed.batchMovements);
        if (Array.isArray(parsed.dailyBirdRecords)) setDailyBirdRecords(parsed.dailyBirdRecords);
        if (Array.isArray(parsed.dailyEggRecords)) setDailyEggRecords(parsed.dailyEggRecords);
        if (Array.isArray(parsed.feedIngredients)) setFeedIngredients(parsed.feedIngredients);
        if (Array.isArray(parsed.recipes)) setRecipes(parsed.recipes);
        if (Array.isArray(parsed.feedProductions)) setFeedProductions(parsed.feedProductions);
        if (Array.isArray(parsed.feedIssues)) setFeedIssues(parsed.feedIssues);
        if (Array.isArray(parsed.warehouseItems)) setWarehouseItems(parsed.warehouseItems);
        if (Array.isArray(parsed.customers)) setCustomers(parsed.customers);
        if (Array.isArray(parsed.eggSales)) setEggSales(parsed.eggSales);
        if (Array.isArray(parsed.birdSales)) setBirdSales(parsed.birdSales);
        if (Array.isArray(parsed.suppliers)) setSuppliers(parsed.suppliers);
        if (Array.isArray(parsed.supplierBills)) setSupplierBills(parsed.supplierBills);
        if (Array.isArray(parsed.payments)) setPayments(parsed.payments);
        if (Array.isArray(parsed.expenses)) setExpenses(parsed.expenses);
        if (Array.isArray(parsed.electricityBills)) setElectricityBills(parsed.electricityBills);
        if (Array.isArray(parsed.salaries)) setSalaries(parsed.salaries);
        if (Array.isArray(parsed.vaccinationRecords)) setVaccinationRecords(parsed.vaccinationRecords);
        if (Array.isArray(parsed.healthEvents)) setHealthEvents(parsed.healthEvents);
        if (Array.isArray(parsed.weightRecords)) setWeightRecords(parsed.weightRecords);
        if (Array.isArray(parsed.approvalRequests)) setApprovalRequests(parsed.approvalRequests);
        if (Array.isArray(parsed.auditLogs)) setAuditLogs(parsed.auditLogs);
        if (parsed.visibilitySettings) setVisibilitySettings(parsed.visibilitySettings);
        if (parsed.farmProfile) setFarmProfile(parsed.farmProfile);
        if (Array.isArray(parsed.users)) setUsers(parsed.users);
      }
    } catch (e) {
      console.error('Failed to load farm state from localStorage', e);
    } finally {
      isLoadedRef.current = true;
    }

    // Initialize credentials repository
    getCredentialStore();

    // If server SSR already authoritatively verified the session, keep it without redundant clear
    if (initialRole) {
      sessionEstablishedRef.current = true;
      setAuthLoading(false);
      return;
    }

    let isCancelled = false;

    // Check active authenticated session with cryptographic token verification
    (async () => {
      try {
        const session = getStoredSession();
        if (session && session.userId && session.token) {
          const verified = await parseAndVerifyToken(session.token);
          if (verified.valid) {
            if (isCancelled || sessionEstablishedRef.current) return;
            // Authoritative user resolution from verified database / directory
            let directory = INITIAL_USERS;
            try {
              const rawStored = localStorage.getItem(LOCAL_STORAGE_KEY);
              if (rawStored) {
                const p = JSON.parse(rawStored);
                if (p.users && Array.isArray(p.users)) directory = p.users;
              }
            } catch {}

            const matched = directory.find(
              (u) =>
                u.id === session.userId ||
                u.email.toLowerCase() === session.email.toLowerCase()
            );

            if (matched && matched.is_active !== false) {
              const isGenuineAdmin =
                (matched.id === 'u-owner-1' || matched.email.toLowerCase() === 'owner@kasthuripoultry.com') &&
                matched.role === 'owner_admin' &&
                verified.role === 'owner_admin';

              const authoritativeRole: UserRole = isGenuineAdmin ? 'owner_admin' : 'manager';
              const verifiedUser: UserProfile = { ...matched, role: authoritativeRole };

              sessionEstablishedRef.current = true;
              setAuthenticatedUser(verifiedUser);
              setCurrentUser(verifiedUser);
              setIsAuthenticated(true);
              setAuthLoading(false);
              return;
            }
          }
        }

        // If localStorage session was absent or expired, verify against server HTTP cookies
        try {
          const serverSessionRes = await fetch('/api/auth/session');
          if (serverSessionRes.ok) {
            const sessData = await serverSessionRes.json();
            if (isCancelled || sessionEstablishedRef.current) return;
            if (sessData.authenticated && sessData.role && sessData.userId) {
              let directory = INITIAL_USERS;
              try {
                const rawStored = localStorage.getItem(LOCAL_STORAGE_KEY);
                if (rawStored) {
                  const p = JSON.parse(rawStored);
                  if (p.users && Array.isArray(p.users)) directory = p.users;
                }
              } catch {}

              const matched = directory.find(
                (u) => u.id === sessData.userId || (sessData.role === 'owner_admin' && u.role === 'owner_admin')
              ) || {
                ...UNAUTHENTICATED_USER,
                id: sessData.userId,
                role: sessData.role,
                full_name: sessData.role === 'owner_admin' ? 'Farm Owner / Admin' : 'Farm Manager',
                is_active: true,
              };

              const restoredUser: UserProfile = { ...matched, role: sessData.role };
              sessionEstablishedRef.current = true;
              setAuthenticatedUser(restoredUser);
              setCurrentUser(restoredUser);
              setIsAuthenticated(true);

              if (sessData.token) {
                const newSess = createSession(
                  restoredUser.id,
                  restoredUser.email || 'owner@kasthuripoultry.com',
                  sessData.role,
                  restoredUser.full_name,
                  sessData.token
                );
                saveStoredSession(newSess);
              }
              setAuthLoading(false);
              return;
            }
          }
        } catch (serverErr) {
          console.warn('Server session check warning:', serverErr);
        }

        // If session was established by login() while check was in flight, do NOT clear!
        if (isCancelled || sessionEstablishedRef.current) {
          setAuthLoading(false);
          return;
        }

        // Only clear if neither localStorage nor server cookies held a valid session
        clearStoredSession();
        setAuthenticatedUser(UNAUTHENTICATED_USER);
        setCurrentUser(UNAUTHENTICATED_USER);
        setIsAuthenticated(false);
      } catch (err) {
        console.error('Session check failed', err);
        if (!isCancelled && !sessionEstablishedRef.current) {
          clearStoredSession();
          setAuthenticatedUser(UNAUTHENTICATED_USER);
          setCurrentUser(UNAUTHENTICATED_USER);
          setIsAuthenticated(false);
        }
      } finally {
        if (!isCancelled) {
          setAuthLoading(false);
        }
      }
    })();

    return () => {
      isCancelled = true;
    };
  }, [initialRole]);

  // Save to local storage on state change
  useEffect(() => {
    if (!isLoadedRef.current) return;
    try {
      const payload = {
        farmProfile,
        sheds,
        batches,
        batchMovements,
        dailyBirdRecords,
        dailyEggRecords,
        feedIngredients,
        recipes,
        feedProductions,
        feedIssues,
        warehouseItems,
        customers,
        eggSales,
        birdSales,
        suppliers,
        supplierBills,
        payments,
        expenses,
        electricityBills,
        salaries,
        vaccinationRecords,
        healthEvents,
        weightRecords,
        approvalRequests,
        auditLogs,
        visibilitySettings,
        users,
        currentUser,
      };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
      console.error('Failed to save farm state to localStorage', e);
    }
  }, [
    farmProfile,
    sheds,
    batches,
    batchMovements,
    dailyBirdRecords,
    dailyEggRecords,
    feedIngredients,
    recipes,
    feedProductions,
    feedIssues,
    warehouseItems,
    customers,
    eggSales,
    birdSales,
    suppliers,
    supplierBills,
    payments,
    expenses,
    electricityBills,
    salaries,
    vaccinationRecords,
    healthEvents,
    weightRecords,
    approvalRequests,
    auditLogs,
    visibilitySettings,
    users,
    currentUser,
  ]);

  // Audit logger
  const logAudit = (action: string, entityType: string, entityId: string, oldVal?: any, newVal?: any) => {
    const entry: AuditLog = {
      id: 'aud-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
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

  // Authentication & Session Management
  const login = async (
    emailOrUsername: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      // 1. Authenticate with server API route to verify credentials and issue cryptographically signed session cookies
      const serverRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailOrUsername, password }),
      });

      const serverData = await serverRes.json().catch(() => ({}));

      if (!serverRes.ok || !serverData.success) {
        return {
          success: false,
          error: serverData.error || 'Invalid credentials. Please verify your email and password.',
        };
      }

      // Mark session as actively established immediately to prevent background checks from wiping it
      sessionEstablishedRef.current = true;

      // 2. Identify the authoritative user profile in the local directory
      const verifiedUserId = serverData.userId;
      const verifiedRole: UserRole = serverData.role === 'owner_admin' ? 'owner_admin' : 'manager';

      let matchedUser = users.find(
        (u) =>
          u.id === verifiedUserId ||
          u.email.toLowerCase() === emailOrUsername.toLowerCase().trim() ||
          u.email.split('@')[0].toLowerCase() === emailOrUsername.toLowerCase().trim()
      );

      if (!matchedUser) {
        matchedUser = {
          id: verifiedUserId || 'u-' + Date.now(),
          email: emailOrUsername.includes('@') ? emailOrUsername : `${emailOrUsername}@kasthuripoultry.com`,
          full_name: verifiedRole === 'owner_admin' ? 'Farm Owner / Admin' : 'Farm Manager',
          role: verifiedRole,
          is_active: true,
          created_at: new Date().toISOString(),
        };
        setUsers((prev) => [...prev, matchedUser!]);
      } else {
        matchedUser = { ...matchedUser, role: verifiedRole };
      }

      if (matchedUser.is_active === false) {
        return {
          success: false,
          error: 'This user account is deactivated. Contact the administrator.',
        };
      }

      // 3. Update client state and save session with the authentic signed token
      setCurrentUser(matchedUser);
      setAuthenticatedUser(matchedUser);
      setPreviewRole(null);
      setIsAuthenticated(true);
      setAuthLoading(false);

      const sess = createSession(
        matchedUser.id,
        matchedUser.email,
        matchedUser.role,
        matchedUser.full_name,
        serverData.token
      );
      saveStoredSession(sess);

      logAudit('USER_LOGIN', 'AUTH_SESSION', matchedUser.id, null, {
        email: matchedUser.email,
        role: matchedUser.role,
      });

      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || 'Login failed. Please try again.' };
    }
  };

  const logout = async (): Promise<void> => {
    try {
      const supabase = createClient();
      if (supabase) {
        await supabase.auth.signOut();
      }
      try {
        await fetch('/api/auth/logout', { method: 'POST' });
      } catch {}
    } catch (e) {
      console.error('Logout error', e);
    } finally {
      clearStoredSession();
      setIsAuthenticated(false);
      logAudit('USER_LOGOUT', 'AUTH_SESSION', currentUser.id, { email: currentUser.email }, null);
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
  };

  const resetPassword = async (
    email: string
  ): Promise<{ success: boolean; error?: string; message?: string }> => {
    try {
      const normalized = email.toLowerCase().trim();
      const user = users.find((u) => u.email.toLowerCase() === normalized);
      if (!user) {
        return { success: false, error: 'No user account found with this email address.' };
      }

      const supabase = createClient();
      if (supabase) {
        await supabase.auth.resetPasswordForEmail(normalized);
      }

      try {
        await fetch('/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: normalized }),
        });
      } catch {}

      logAudit('PASSWORD_RESET_REQUEST', 'AUTH_SESSION', user.id, null, { email: normalized });
      return {
        success: true,
        message: 'Password reset request recorded. Contact the Farm Owner (Rajesh Kasthuri) to authorize a new password credential.',
      };
    } catch (e: any) {
      return { success: false, error: e.message || 'Failed to process password reset.' };
    }
  };

  const setUserPassword = async (
    userId: string,
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> => {
    const user = users.find((u) => u.id === userId);
    if (!user) return { success: false, error: 'User not found in system directory' };
    await saveUserCredential(userId, user.email, newPassword);
    logAudit('PASSWORD_UPDATE', 'USER_CREDENTIAL', userId, null, { email: user.email });
    return { success: true };
  };

  // Helper to count active admins
  const getActiveAdminCount = (excludeUserId?: string): number => {
    return users.filter(
      (u) => u.role === 'owner_admin' && u.is_active !== false && (!excludeUserId || u.id !== excludeUserId)
    ).length;
  };

  // Switch Role / User Session
  const switchRole = (role: UserRole, userId?: string): { success: boolean; error?: string } => {
    // 1. Strict Restriction: Only an authenticated Owner/Admin can change view or role
    if (authenticatedUser.role !== 'owner_admin') {
      logAudit(
        'UNAUTHORIZED_ROLE_SWITCH_ATTEMPT',
        'SECURITY_RESTRICTION',
        authenticatedUser.id,
        { currentRole: authenticatedUser.role },
        { attemptedRole: role, attemptedUserId: userId }
      );
      return {
        success: false,
        error: 'Forbidden: Managers cannot switch to or assume the Owner/Admin role.',
      };
    }

    // 2. Authenticated Admin Preview Manager mode
    if (role === 'manager') {
      setPreviewRole('manager');
      const targetMgr = userId
        ? users.find((u) => u.id === userId && u.role === 'manager')
        : users.find((u) => u.role === 'manager');
      const mgrPreviewUser: UserProfile = targetMgr || {
        ...authenticatedUser,
        role: 'manager',
        full_name: `${authenticatedUser.full_name} (Manager Preview)`,
      };
      setCurrentUser(mgrPreviewUser);
      logAudit('ADMIN_PREVIEW_MANAGER_ENABLED', 'USER_SESSION', authenticatedUser.id, null, {
        previewRole: 'manager',
        previewUserId: mgrPreviewUser.id,
      });
      return { success: true };
    } else {
      // 3. Admin returns to Owner View
      setPreviewRole(null);
      setCurrentUser(authenticatedUser);
      logAudit('ADMIN_PREVIEW_MANAGER_DISABLED', 'USER_SESSION', authenticatedUser.id, null, {
        previewRole: 'owner_admin',
      });
      return { success: true };
    }
  };

  // Update Logged-in User Profile & Name
  const updateCurrentUser = (updates: Partial<UserProfile>): { success: boolean; error?: string } => {
    const safeUpdates = { ...updates };

    // Prevent non-admin self-elevation to owner_admin
    if (safeUpdates.role && safeUpdates.role !== authenticatedUser.role) {
      if (authenticatedUser.role !== 'owner_admin') {
        logAudit(
          'UNAUTHORIZED_ROLE_SELF_ELEVATION',
          'SECURITY',
          authenticatedUser.id,
          { currentRole: authenticatedUser.role },
          { requestedRole: safeUpdates.role }
        );
        delete safeUpdates.role;
      } else {
        // Single-Admin Safeguard check if admin tries to demote themselves
        if (getActiveAdminCount(authenticatedUser.id) === 0) {
          return {
            success: false,
            error: 'Single-Admin Safeguard: Cannot demote the last active Owner/Admin. At least one active Owner/Admin must exist.',
          };
        }
      }
    }

    setAuthenticatedUser((prev) => {
      const updated = { ...prev, ...safeUpdates };
      setUsers((prevUsers) =>
        prevUsers.map((u) => (u.id === prev.id ? { ...u, ...safeUpdates } : u))
      );
      logAudit('UPDATE_CURRENT_USER', 'USER_PROFILE', prev.id, prev, updated);
      return updated;
    });

    setCurrentUser((prev) => ({ ...prev, ...safeUpdates }));
    return { success: true };
  };

  // Add New User to System
  const addUser = async (
    userData: Omit<UserProfile, 'id' | 'created_at'>,
    initialPassword?: string
  ): Promise<{ success: boolean; error?: string; user?: UserProfile }> => {
    if (authenticatedUser.role !== 'owner_admin') {
      logAudit('UNAUTHORIZED_USER_CREATE_ATTEMPT', 'SECURITY', 'NEW_USER', null, userData);
      return {
        success: false,
        error: 'Forbidden: Only an authenticated Owner/Admin can provision user accounts.',
      };
    }

    if (!initialPassword || initialPassword.trim().length < 8) {
      return {
        success: false,
        error: 'A secure initial password (minimum 8 characters) is required when creating a new user account.',
      };
    }

    const newUser: UserProfile = {
      ...userData,
      id: 'u-' + Date.now(),
      created_at: new Date().toISOString().split('T')[0],
      is_active: userData.is_active !== undefined ? userData.is_active : true,
    };
    setUsers((prev) => [...prev, newUser]);
    const pwdToSave = initialPassword.trim();
    await saveUserCredential(newUser.id, newUser.email, pwdToSave);
    logAudit('CREATE_USER', 'USER_PROFILE', newUser.id, null, newUser);
    return { success: true, user: newUser };
  };

  // Update Any User Record
  const updateUser = (id: string, updates: Partial<UserProfile>): { success: boolean; error?: string } => {
    if (authenticatedUser.role !== 'owner_admin') {
      logAudit('UNAUTHORIZED_USER_UPDATE_ATTEMPT', 'SECURITY', id, null, updates);
      return {
        success: false,
        error: 'Forbidden: Only an authenticated Owner/Admin can modify user accounts or roles.',
      };
    }

    const target = users.find((u) => u.id === id);
    if (!target) {
      return { success: false, error: 'User record not found.' };
    }

    // Single-Admin Safeguard:
    // If target is currently an active Owner/Admin, check if remaining active admins would be 0
    if (target.role === 'owner_admin' && target.is_active !== false) {
      const remainingAdmins = getActiveAdminCount(id);
      if (remainingAdmins === 0) {
        if (updates.role && updates.role !== 'owner_admin') {
          return {
            success: false,
            error: 'Single-Admin Safeguard: Cannot change the last active Owner/Admin role to Manager. At least one active Owner/Admin must exist at all times.',
          };
        }
        if (updates.is_active === false) {
          return {
            success: false,
            error: 'Single-Admin Safeguard: Cannot deactivate the last active Owner/Admin. At least one active Owner/Admin must exist at all times.',
          };
        }
      }
    }

    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === id) {
          const updated = { ...u, ...updates };
          logAudit('UPDATE_USER', 'USER_PROFILE', id, u, updated);
          return updated;
        }
        return u;
      })
    );

    // Keep authenticatedUser and currentUser in sync if modifying self
    if (authenticatedUser.id === id) {
      setAuthenticatedUser((prev) => ({ ...prev, ...updates }));
      if (!previewRole) {
        setCurrentUser((prev) => ({ ...prev, ...updates }));
      }
    } else if (currentUser.id === id) {
      setCurrentUser((prev) => ({ ...prev, ...updates }));
    }

    return { success: true };
  };

  // Delete User Record
  const deleteUser = (id: string): { success: boolean; error?: string } => {
    if (authenticatedUser.role !== 'owner_admin') {
      logAudit('UNAUTHORIZED_USER_DELETE_ATTEMPT', 'SECURITY', id, null, null);
      return {
        success: false,
        error: 'Forbidden: Only an authenticated Owner/Admin can delete user accounts.',
      };
    }

    if (id === authenticatedUser.id) {
      return { success: false, error: 'Cannot delete the currently logged in user session account.' };
    }

    const target = users.find((u) => u.id === id);
    if (!target) {
      return { success: false, error: 'User not found in system directory.' };
    }

    // Single-Admin Safeguard:
    if (target.role === 'owner_admin') {
      const remainingAdmins = getActiveAdminCount(id);
      if (remainingAdmins === 0) {
        return {
          success: false,
          error: 'Single-Admin Safeguard: Cannot delete the last active Owner/Admin account. At least one active Owner/Admin must exist at all times.',
        };
      }
    }

    setUsers((prev) => prev.filter((u) => u.id !== id));
    logAudit('DELETE_USER', 'USER_PROFILE', id, target, null);
    return { success: true };
  };

  const updateVisibilitySettings = (newSettings: Partial<ManagerVisibilitySettings>): { success: boolean; error?: string } => {
    if (authenticatedUser.role !== 'owner_admin') {
      logAudit('UNAUTHORIZED_SETTINGS_UPDATE_ATTEMPT', 'SECURITY', 'SETTINGS', null, newSettings);
      return {
        success: false,
        error: 'Forbidden: Only an authenticated Owner/Admin can configure manager permissions and visibility switches.',
      };
    }
    setVisibilitySettings((prev) => {
      const updated = { ...prev, ...newSettings };
      logAudit('UPDATE_VISIBILITY_SETTINGS', 'SETTINGS', 'MANAGER_PERMISSIONS', prev, updated);
      return updated;
    });
    return { success: true };
  };

  const updateFarmProfile = (updates: Partial<FarmProfile>): { success: boolean; error?: string } => {
    if (authenticatedUser.role !== 'owner_admin') {
      logAudit('UNAUTHORIZED_FARM_PROFILE_UPDATE_ATTEMPT', 'SECURITY', 'FARM_PROFILE', null, updates);
      return {
        success: false,
        error: 'Forbidden: Only an authenticated Owner/Admin can update farm configuration and bill headings.',
      };
    }
    setFarmProfile((prev) => {
      const updated = { ...prev, ...updates };
      logAudit('UPDATE_FARM_PROFILE', 'SETTINGS', 'FARM_PROFILE', prev, updated);
      return updated;
    });
    return { success: true };
  };

  // Permission Evaluation Helpers
  const canEdit = (recordDate?: string): boolean => {
    if (!isAuthenticated) return false;
    if (currentUser.role === 'owner_admin') return true;
    if (!visibilitySettings.allow_editing_records) return false;
    if (recordDate) {
      const today = new Date().toISOString().split('T')[0];
      if (recordDate < today) {
        return Boolean(visibilitySettings.allow_editing_historical_records);
      }
    }
    return true;
  };

  const canDelete = (isSensitive?: boolean): boolean => {
    if (!isAuthenticated) return false;
    if (currentUser.role === 'owner_admin') return true;
    if (!visibilitySettings.allow_deleting_eligible_records) return false;
    if (isSensitive && visibilitySettings.require_approval_for_sensitive_deletions) {
      return false; // Sensitive deletions require admin approval queue
    }
    return true;
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

  const deleteShed = (id: string) => {
    const shed = sheds.find((s) => s.id === id);
    if (!shed) return { success: false, error: 'Shed not found' };
    if (shed.current_birds > 0) {
      return {
        success: false,
        error: `Cannot delete shed ${shed.code} because it currently holds ${formatNumber(shed.current_birds)} live birds. Transfer birds or change shed status to 'Inactive'.`,
      };
    }
    setSheds((prev) => prev.filter((s) => s.id !== id));
    logAudit('DELETE_SHED', 'SHED', shed.code, shed, null);
    return { success: true };
  };

  // Batch Operations
  const addBatch = (batchData: Omit<Batch, 'id'>) => {
    const newBatch: Batch = {
      ...batchData,
      id: 'b-' + Date.now(),
    };
    setBatches((prev) => [...prev, newBatch]);
    setSheds((prev) =>
      prev.map((s) =>
        s.id === newBatch.current_shed_id
          ? { ...s, current_birds: s.current_birds + newBatch.current_count, updated_at: new Date().toISOString() }
          : s
      )
    );
    logAudit('CREATE_BATCH', 'BATCH', newBatch.batch_code, null, newBatch);
  };

  const updateBatch = (id: string, updates: Partial<Batch>) => {
    const existing = batches.find((b) => b.id === id);
    if (!existing) return { success: false, error: 'Batch not found' };
    const updated = { ...existing, ...updates };
    setBatches((prev) => prev.map((b) => (b.id === id ? updated : b)));
    logAudit('UPDATE_BATCH', 'BATCH', existing.batch_code, existing, updated);
    return { success: true };
  };

  const deleteBatch = (id: string) => {
    const batch = batches.find((b) => b.id === id);
    if (!batch) return { success: false, error: 'Batch not found' };
    if (batch.current_count > 0) {
      return {
        success: false,
        error: `Cannot delete batch ${batch.batch_code} because it holds ${formatNumber(batch.current_count)} live birds. Transfer birds or mark flock status as 'completed' or 'culled'.`,
      };
    }
    setBatches((prev) => prev.filter((b) => b.id !== id));
    logAudit('DELETE_BATCH', 'BATCH', batch.batch_code, batch, null);
    return { success: true };
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

    if (toShed.current_birds + quantity > toShed.capacity) {
      return {
        success: false,
        error: `Destination shed ${toShed.code} would exceed capacity (Max: ${toShed.capacity}, Current: ${toShed.current_birds}, Adding: ${quantity})`,
      };
    }

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
      movement_status: 'active',
      created_at: new Date().toISOString(),
    };

    setBatchMovements((prev) => [movement, ...prev]);

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

    setBatches((prev) =>
      prev.map((b) => {
        if (b.id === batchId) {
          return {
            ...b,
            current_shed_id: toShedId,
            current_shed_code: toShed.code,
          };
        }
        return b;
      })
    );

    logAudit('TRANSFER_BIRDS', 'BATCH_MOVEMENT', movement.id, null, movement);
    return { success: true };
  };

  const reverseBatchMovement = (id: string) => {
    const mov = batchMovements.find((m) => m.id === id);
    if (!mov) return { success: false, error: 'Movement record not found' };
    if (mov.movement_status === 'reversed') {
      return { success: false, error: 'This movement has already been reversed.' };
    }
    const toShed = sheds.find((s) => s.id === mov.to_shed_id);
    if (toShed && toShed.current_birds < mov.quantity) {
      return {
        success: false,
        error: `Cannot reverse transfer: destination shed ${mov.to_shed_code} currently only holds ${toShed.current_birds} birds (requires ${mov.quantity}).`,
      };
    }

    setSheds((prev) =>
      prev.map((s) => {
        if (s.id === mov.from_shed_id) {
          return { ...s, current_birds: s.current_birds + mov.quantity, updated_at: new Date().toISOString() };
        }
        if (s.id === mov.to_shed_id) {
          return { ...s, current_birds: Math.max(0, s.current_birds - mov.quantity), updated_at: new Date().toISOString() };
        }
        return s;
      })
    );

    setBatches((prev) =>
      prev.map((b) =>
        b.id === mov.batch_id
          ? { ...b, current_shed_id: mov.from_shed_id, current_shed_code: mov.from_shed_code }
          : b
      )
    );

    setBatchMovements((prev) =>
      prev.map((m) => (m.id === id ? { ...m, movement_status: 'reversed' } : m))
    );

    logAudit('REVERSE_TRANSFER', 'BATCH_MOVEMENT', mov.batch_code, mov, { movement_status: 'reversed' });
    return { success: true };
  };

  // Daily Bird Entry
  const addDailyBirdRecord = (recordData: Omit<DailyBirdRecord, 'id' | 'submitted_at'>) => {
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

    setSheds((prev) =>
      prev.map((s) => (s.id === recordData.shed_id ? { ...s, current_birds: calculatedClosing, updated_at: new Date().toISOString() } : s))
    );
    setBatches((prev) =>
      prev.map((b) => (b.id === recordData.batch_id ? { ...b, current_count: calculatedClosing } : b))
    );

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

      setWarehouseItems((prev) =>
        prev.map((item) =>
          item.category === 'eggs' ? { ...item, current_quantity: item.current_quantity + goodEggs, updated_at: new Date().toISOString() } : item
        )
      );
    }

    logAudit('CREATE_DAILY_ENTRY', 'DAILY_BIRD_RECORD', newRecord.id, null, newRecord);
    return { success: true };
  };

  const updateDailyBirdRecord = (id: string, updates: Partial<DailyBirdRecord>) => {
    const existing = dailyBirdRecords.find((r) => r.id === id);
    if (!existing) return { success: false, error: 'Daily record not found' };

    const opening = updates.opening_birds !== undefined ? Number(updates.opening_birds) : existing.opening_birds;
    const received = updates.birds_received !== undefined ? Number(updates.birds_received) : existing.birds_received;
    const transIn = updates.transfers_in !== undefined ? Number(updates.transfers_in) : existing.transfers_in;
    const transOut = updates.transfers_out !== undefined ? Number(updates.transfers_out) : existing.transfers_out;
    const mort = updates.mortality !== undefined ? Number(updates.mortality) : existing.mortality;
    const culls = updates.culls !== undefined ? Number(updates.culls) : existing.culls;
    const sales = updates.bird_sales !== undefined ? Number(updates.bird_sales) : existing.bird_sales;
    const removals = updates.other_removals !== undefined ? Number(updates.other_removals) : existing.other_removals;

    const newClosing = calculateClosingBirds(opening, received, transIn, transOut, mort, culls, sales, removals);
    if (newClosing < 0) {
      return { success: false, error: 'Recalculated closing bird count cannot be negative' };
    }

    const deltaClosing = newClosing - existing.closing_birds;

    // Egg count delta
    const newEggCount = updates.egg_count !== undefined ? Number(updates.egg_count) : (existing.egg_count || 0);
    const newDamaged = updates.damaged_eggs !== undefined ? Number(updates.damaged_eggs) : (existing.damaged_eggs || 0);
    const newBroken = updates.broken_eggs !== undefined ? Number(updates.broken_eggs) : (existing.broken_eggs || 0);
    const newGood = Math.max(0, newEggCount - newDamaged - newBroken);

    const oldGood = Math.max(0, (existing.egg_count || 0) - (existing.damaged_eggs || 0) - (existing.broken_eggs || 0));
    const eggDelta = newGood - oldGood;

    const updatedRecord: DailyBirdRecord = {
      ...existing,
      ...updates,
      opening_birds: opening,
      birds_received: received,
      transfers_in: transIn,
      transfers_out: transOut,
      mortality: mort,
      culls,
      bird_sales: sales,
      other_removals: removals,
      closing_birds: newClosing,
      feed_consumed_kg: updates.feed_consumed_kg !== undefined ? Number(updates.feed_consumed_kg) : existing.feed_consumed_kg,
      egg_count: newEggCount > 0 ? newEggCount : undefined,
      damaged_eggs: newDamaged,
      broken_eggs: newBroken,
      updated_at: new Date().toISOString(),
      last_modified_by: currentUser.id,
    };

    setDailyBirdRecords((prev) => prev.map((r) => (r.id === id ? updatedRecord : r)));

    if (deltaClosing !== 0) {
      setSheds((prev) =>
        prev.map((s) =>
          s.id === existing.shed_id
            ? { ...s, current_birds: Math.max(0, s.current_birds + deltaClosing), updated_at: new Date().toISOString() }
            : s
        )
      );
      setBatches((prev) =>
        prev.map((b) =>
          b.id === existing.batch_id
            ? { ...b, current_count: Math.max(0, b.current_count + deltaClosing) }
            : b
        )
      );
    }

    if (eggDelta !== 0) {
      setWarehouseItems((prev) =>
        prev.map((w) =>
          w.category === 'eggs'
            ? { ...w, current_quantity: Math.max(0, w.current_quantity + eggDelta), updated_at: new Date().toISOString() }
            : w
        )
      );
    }

    logAudit('UPDATE_DAILY_ENTRY', 'DAILY_BIRD_RECORD', id, existing, updatedRecord);
    return { success: true };
  };

  const deleteDailyBirdRecord = (id: string) => {
    const existing = dailyBirdRecords.find((r) => r.id === id);
    if (!existing) return { success: false, error: 'Daily record not found' };

    const deltaToRevert = existing.closing_birds - existing.opening_birds;
    setSheds((prev) =>
      prev.map((s) =>
        s.id === existing.shed_id
          ? { ...s, current_birds: Math.max(0, s.current_birds - deltaToRevert), updated_at: new Date().toISOString() }
          : s
      )
    );
    setBatches((prev) =>
      prev.map((b) =>
        b.id === existing.batch_id
          ? { ...b, current_count: Math.max(0, b.current_count - deltaToRevert) }
          : b
      )
    );

    const oldGood = Math.max(0, (existing.egg_count || 0) - (existing.damaged_eggs || 0) - (existing.broken_eggs || 0));
    if (oldGood > 0) {
      setWarehouseItems((prev) =>
        prev.map((w) =>
          w.category === 'eggs'
            ? { ...w, current_quantity: Math.max(0, w.current_quantity - oldGood), updated_at: new Date().toISOString() }
            : w
        )
      );
    }

    setDailyBirdRecords((prev) => prev.filter((r) => r.id !== id));
    logAudit('DELETE_DAILY_ENTRY', 'DAILY_BIRD_RECORD', id, existing, null);
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

    setWarehouseItems((prev) =>
      prev.map((item) =>
        item.category === 'eggs' ? { ...item, current_quantity: item.current_quantity + recordData.good_eggs, updated_at: new Date().toISOString() } : item
      )
    );

    logAudit('CREATE_EGG_RECORD', 'DAILY_EGG_RECORD', newRecord.id, null, newRecord);
    return { success: true };
  };

  const updateDailyEggRecord = (id: string, updates: Partial<DailyEggRecord>) => {
    const existing = dailyEggRecords.find((r) => r.id === id);
    if (!existing) return { success: false, error: 'Egg record not found' };

    const totalCollected = updates.total_eggs_collected !== undefined ? Number(updates.total_eggs_collected) : existing.total_eggs_collected;
    const damaged = updates.damaged_eggs !== undefined ? Number(updates.damaged_eggs) : existing.damaged_eggs;
    const broken = updates.broken_eggs !== undefined ? Number(updates.broken_eggs) : existing.broken_eggs;
    const rejected = updates.rejected_eggs !== undefined ? Number(updates.rejected_eggs) : existing.rejected_eggs;
    const good = Math.max(0, totalCollected - damaged - broken - rejected);

    const trayInfo = convertEggsToTrays(good);
    const opening = updates.opening_layer_birds !== undefined ? Number(updates.opening_layer_birds) : existing.opening_layer_birds;
    const layPct = calculateEggProductionPct(totalCollected, opening);

    const eggDelta = good - existing.good_eggs;

    const updated: DailyEggRecord = {
      ...existing,
      ...updates,
      total_eggs_collected: totalCollected,
      good_eggs: good,
      damaged_eggs: damaged,
      broken_eggs: broken,
      rejected_eggs: rejected,
      trays_count: trayInfo.trays,
      loose_eggs_count: trayInfo.loose,
      opening_layer_birds: opening,
      production_percentage: layPct,
      updated_at: new Date().toISOString(),
      last_modified_by: currentUser.id,
    };

    setDailyEggRecords((prev) => prev.map((r) => (r.id === id ? updated : r)));

    if (eggDelta !== 0) {
      setWarehouseItems((prev) =>
        prev.map((w) =>
          w.category === 'eggs'
            ? { ...w, current_quantity: Math.max(0, w.current_quantity + eggDelta), updated_at: new Date().toISOString() }
            : w
        )
      );
    }

    logAudit('UPDATE_EGG_RECORD', 'DAILY_EGG_RECORD', id, existing, updated);
    return { success: true };
  };

  const deleteDailyEggRecord = (id: string) => {
    const existing = dailyEggRecords.find((r) => r.id === id);
    if (!existing) return { success: false, error: 'Egg record not found' };

    setWarehouseItems((prev) =>
      prev.map((w) =>
        w.category === 'eggs'
          ? { ...w, current_quantity: Math.max(0, w.current_quantity - existing.good_eggs), updated_at: new Date().toISOString() }
          : w
      )
    );

    setDailyEggRecords((prev) => prev.filter((r) => r.id !== id));
    logAudit('DELETE_EGG_RECORD', 'DAILY_EGG_RECORD', id, existing, null);
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
      prev.map((ing) => {
        if (ing.id === id) {
          const updated = { ...ing, ...updates, updated_at: new Date().toISOString() };
          logAudit('UPDATE_INGREDIENT', 'FEED_INGREDIENT', ing.code, ing, updated);
          return updated;
        }
        return ing;
      })
    );
  };

  const deleteFeedIngredient = (id: string) => {
    const ing = feedIngredients.find((i) => i.id === id);
    if (!ing) return { success: false, error: 'Ingredient not found' };
    const usedInRecipes = recipes.filter((r) => r.is_active && r.items.some((item) => item.ingredient_id === id));
    if (usedInRecipes.length > 0) {
      return {
        success: false,
        error: `Cannot delete "${ing.name}" because it is required in active recipe(s): ${usedInRecipes.map((r) => r.name).join(', ')}. Please update recipe formulations first.`,
      };
    }
    setFeedIngredients((prev) => prev.filter((i) => i.id !== id));
    logAudit('DELETE_INGREDIENT', 'FEED_INGREDIENT', ing.code, ing, null);
    return { success: true };
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

  const updateRecipe = (id: string, updates: Partial<FeedRecipe>) => {
    const existing = recipes.find((r) => r.id === id);
    if (!existing) return { success: false, error: 'Recipe not found' };
    if (updates.items) {
      const sum = updates.items.reduce((s, it) => s + it.percentage, 0);
      if (Math.abs(sum - 100) > 0.01) {
        return { success: false, error: `Recipe percentages must equal exactly 100% (Current: ${sum.toFixed(2)}%)` };
      }
    }
    const updated = { ...existing, ...updates };
    setRecipes((prev) => prev.map((r) => (r.id === id ? updated : r)));
    logAudit('UPDATE_RECIPE', 'FEED_RECIPE', existing.name, existing, updated);
    return { success: true };
  };

  const deleteRecipe = (id: string) => {
    const existing = recipes.find((r) => r.id === id);
    if (!existing) return { success: false, error: 'Recipe not found' };
    const hasProduction = feedProductions.some((p) => p.recipe_id === id);
    if (hasProduction) {
      setRecipes((prev) => prev.map((r) => (r.id === id ? { ...r, is_active: false } : r)));
      logAudit('ARCHIVE_RECIPE', 'FEED_RECIPE', existing.name, existing, { is_active: false });
      return { success: true };
    }
    setRecipes((prev) => prev.filter((r) => r.id !== id));
    logAudit('DELETE_RECIPE', 'FEED_RECIPE', existing.name, existing, null);
    return { success: true };
  };

  // Feed Production
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
      production_status: 'active',
      created_at: new Date().toISOString(),
    };

    setFeedProductions((prev) => [production, ...prev]);

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

  const cancelFeedProduction = (id: string) => {
    const prod = feedProductions.find((p) => p.id === id);
    if (!prod) return { success: false, error: 'Production record not found' };
    if (prod.production_status === 'cancelled') {
      return { success: false, error: 'Production batch is already cancelled.' };
    }

    setFeedIngredients((prev) =>
      prev.map((ing) => {
        const used = prod.ingredients_used.find((u) => u.ingredient_id === ing.id);
        if (used) {
          return {
            ...ing,
            current_stock_kg: ing.current_stock_kg + used.quantity_used_kg,
            updated_at: new Date().toISOString(),
          };
        }
        return ing;
      })
    );

    const bagsProduced = Math.floor(prod.produced_quantity_kg / 50);
    setWarehouseItems((prev) =>
      prev.map((item) =>
        item.category === 'finished_feed'
          ? { ...item, current_quantity: Math.max(0, item.current_quantity - bagsProduced), updated_at: new Date().toISOString() }
          : item
      )
    );

    setFeedProductions((prev) =>
      prev.map((p) => (p.id === id ? { ...p, production_status: 'cancelled', updated_at: new Date().toISOString() } : p))
    );

    logAudit('CANCEL_FEED_PRODUCTION', 'FEED_PRODUCTION', prod.batch_number, prod, { production_status: 'cancelled' });
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

  const updateFeedIssue = (id: string, updates: Partial<FeedIssue>) => {
    const existing = feedIssues.find((f) => f.id === id);
    if (!existing) return { success: false, error: 'Feed issue not found' };
    const issued = updates.quantity_issued_kg !== undefined ? Number(updates.quantity_issued_kg) : existing.quantity_issued_kg;
    const returned = updates.quantity_returned_kg !== undefined ? Number(updates.quantity_returned_kg) : (existing.quantity_returned_kg || 0);
    const updated: FeedIssue = {
      ...existing,
      ...updates,
      quantity_issued_kg: issued,
      quantity_returned_kg: returned,
      net_consumed_kg: Math.max(0, issued - returned),
      updated_at: new Date().toISOString(),
      last_modified_by: currentUser.id,
    };
    setFeedIssues((prev) => prev.map((f) => (f.id === id ? updated : f)));
    logAudit('UPDATE_FEED_ISSUE', 'FEED_ISSUE', id, existing, updated);
    return { success: true };
  };

  const deleteFeedIssue = (id: string) => {
    const existing = feedIssues.find((f) => f.id === id);
    if (!existing) return { success: false, error: 'Feed issue not found' };
    setFeedIssues((prev) => prev.filter((f) => f.id !== id));
    logAudit('DELETE_FEED_ISSUE', 'FEED_ISSUE', id, existing, null);
    return { success: true };
  };

  // Warehouse Items
  const addWarehouseItem = (itemData: Omit<WarehouseStockItem, 'id' | 'updated_at'>) => {
    const newItem: WarehouseStockItem = {
      ...itemData,
      id: 'wh-' + Date.now(),
      updated_at: new Date().toISOString(),
    };
    setWarehouseItems((prev) => [newItem, ...prev]);
    logAudit('CREATE_STOCK_ITEM', 'WAREHOUSE_ITEM', newItem.item_name, null, newItem);
  };

  const updateWarehouseItem = (id: string, updates: Partial<WarehouseStockItem>) => {
    setWarehouseItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updated = { ...item, ...updates, updated_at: new Date().toISOString() };
          logAudit('UPDATE_STOCK_ITEM', 'WAREHOUSE_ITEM', item.item_name, item, updated);
          return updated;
        }
        return item;
      })
    );
  };

  const deleteWarehouseItem = (id: string) => {
    const item = warehouseItems.find((w) => w.id === id);
    if (!item) return { success: false, error: 'Inventory item not found' };
    setWarehouseItems((prev) => prev.filter((w) => w.id !== id));
    logAudit('DELETE_WAREHOUSE_ITEM', 'WAREHOUSE_ITEM', item.item_name, item, null);
    return { success: true };
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

  const updateCustomer = (id: string, updates: Partial<Customer>) => {
    const existing = customers.find((c) => c.id === id);
    if (!existing) return { success: false, error: 'Customer not found' };
    const updated = { ...existing, ...updates, updated_at: new Date().toISOString() };
    setCustomers((prev) => prev.map((c) => (c.id === id ? updated : c)));
    logAudit('UPDATE_CUSTOMER', 'CUSTOMER', existing.name, existing, updated);
    return { success: true };
  };

  const deleteCustomer = (id: string) => {
    const existing = customers.find((c) => c.id === id);
    if (!existing) return { success: false, error: 'Customer not found' };
    if (existing.current_balance !== 0) {
      return {
        success: false,
        error: `Cannot delete customer "${existing.name}" because they have an active outstanding balance of ${formatCurrency(existing.current_balance)}. Reconcile or settle balance first.`,
      };
    }
    const hasSales = eggSales.some((s) => s.customer_id === id) || birdSales.some((s) => s.customer_id === id);
    if (hasSales) {
      return {
        success: false,
        error: `Cannot permanently delete customer "${existing.name}" due to existing historical invoices and billing records.`,
      };
    }
    setCustomers((prev) => prev.filter((c) => c.id !== id));
    logAudit('DELETE_CUSTOMER', 'CUSTOMER', existing.name, existing, null);
    return { success: true };
  };

  const addSupplier = (suppData: Omit<Supplier, 'id'>) => {
    const newSupp: Supplier = {
      ...suppData,
      id: 'supp-' + Date.now(),
    };
    setSuppliers((prev) => [...prev, newSupp]);
    logAudit('CREATE_SUPPLIER', 'SUPPLIER', newSupp.name, null, newSupp);
  };

  const updateSupplier = (id: string, updates: Partial<Supplier>) => {
    const existing = suppliers.find((s) => s.id === id);
    if (!existing) return { success: false, error: 'Supplier not found' };
    const updated = { ...existing, ...updates, updated_at: new Date().toISOString() };
    setSuppliers((prev) => prev.map((s) => (s.id === id ? updated : s)));
    logAudit('UPDATE_SUPPLIER', 'SUPPLIER', existing.name, existing, updated);
    return { success: true };
  };

  const deleteSupplier = (id: string) => {
    const existing = suppliers.find((s) => s.id === id);
    if (!existing) return { success: false, error: 'Supplier not found' };
    if (existing.current_balance !== 0) {
      return {
        success: false,
        error: `Cannot delete vendor "${existing.name}" because the farm has an active payable balance of ${formatCurrency(existing.current_balance)}. Reconcile or settle balance first.`,
      };
    }
    const hasBills = supplierBills.some((b) => b.supplier_id === id);
    if (hasBills) {
      return {
        success: false,
        error: `Cannot permanently delete supplier "${existing.name}" with existing purchase bills.`,
      };
    }
    setSuppliers((prev) => prev.filter((s) => s.id !== id));
    logAudit('DELETE_SUPPLIER', 'SUPPLIER', existing.name, existing, null);
    return { success: true };
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
      sale_status: 'active',
      created_at: new Date().toISOString(),
    };

    setEggSales((prev) => [newSale, ...prev]);

    if (eggStockItem) {
      setWarehouseItems((prev) =>
        prev.map((w) =>
          w.id === eggStockItem.id
            ? { ...w, current_quantity: Math.max(0, w.current_quantity - saleData.total_eggs), updated_at: new Date().toISOString() }
            : w
        )
      );
    }

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

  const updateEggSale = (id: string, updates: Partial<EggSale>) => {
    const existing = eggSales.find((s) => s.id === id);
    if (!existing) return { success: false, error: 'Egg sale invoice not found' };

    const oldEggs = existing.total_eggs;
    const newEggs = updates.total_eggs !== undefined ? Number(updates.total_eggs) : existing.total_eggs;
    const eggStockDelta = oldEggs - newEggs;

    const oldOutstanding = existing.outstanding_amount;
    const newOutstanding = updates.outstanding_amount !== undefined ? Number(updates.outstanding_amount) : existing.outstanding_amount;
    const balanceDelta = newOutstanding - oldOutstanding;

    const updated: EggSale = {
      ...existing,
      ...updates,
      total_eggs: newEggs,
      outstanding_amount: newOutstanding,
      updated_at: new Date().toISOString(),
      last_modified_by: currentUser.id,
    };

    setEggSales((prev) => prev.map((s) => (s.id === id ? updated : s)));

    if (eggStockDelta !== 0) {
      setWarehouseItems((prev) =>
        prev.map((w) =>
          w.category === 'eggs'
            ? { ...w, current_quantity: Math.max(0, w.current_quantity + eggStockDelta), updated_at: new Date().toISOString() }
            : w
        )
      );
    }

    if (balanceDelta !== 0) {
      setCustomers((prev) =>
        prev.map((c) =>
          c.id === existing.customer_id
            ? { ...c, current_balance: c.current_balance + balanceDelta }
            : c
        )
      );
    }

    logAudit('UPDATE_EGG_SALE', 'EGG_SALE', existing.invoice_no, existing, updated);
    return { success: true };
  };

  const cancelEggSale = (id: string) => {
    const sale = eggSales.find((s) => s.id === id);
    if (!sale) return { success: false, error: 'Egg sale not found' };
    if (sale.sale_status === 'cancelled') {
      return { success: false, error: 'Sale invoice is already cancelled.' };
    }

    setWarehouseItems((prev) =>
      prev.map((w) =>
        w.category === 'eggs'
          ? { ...w, current_quantity: w.current_quantity + sale.total_eggs, updated_at: new Date().toISOString() }
          : w
      )
    );

    if (sale.outstanding_amount > 0) {
      setCustomers((prev) =>
        prev.map((c) =>
          c.id === sale.customer_id
            ? { ...c, current_balance: Math.max(0, c.current_balance - sale.outstanding_amount) }
            : c
        )
      );
    }

    setEggSales((prev) =>
      prev.map((s) => (s.id === id ? { ...s, sale_status: 'cancelled', updated_at: new Date().toISOString() } : s))
    );

    logAudit('CANCEL_EGG_SALE', 'EGG_SALE', sale.invoice_no, sale, { sale_status: 'cancelled' });
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
      sale_status: 'active',
      created_at: new Date().toISOString(),
    };

    setBirdSales((prev) => [newSale, ...prev]);

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

  const updateBirdSale = (id: string, updates: Partial<BirdSale>) => {
    const existing = birdSales.find((s) => s.id === id);
    if (!existing) return { success: false, error: 'Bird sale record not found' };

    const oldBirds = existing.bird_quantity;
    const newBirds = updates.bird_quantity !== undefined ? Number(updates.bird_quantity) : existing.bird_quantity;
    const birdDelta = oldBirds - newBirds;

    const oldOutstanding = existing.outstanding_amount;
    const newOutstanding = updates.outstanding_amount !== undefined ? Number(updates.outstanding_amount) : existing.outstanding_amount;
    const balanceDelta = newOutstanding - oldOutstanding;

    const updated: BirdSale = {
      ...existing,
      ...updates,
      bird_quantity: newBirds,
      outstanding_amount: newOutstanding,
      updated_at: new Date().toISOString(),
      last_modified_by: currentUser.id,
    };

    setBirdSales((prev) => prev.map((s) => (s.id === id ? updated : s)));

    if (birdDelta !== 0) {
      setBatches((prev) =>
        prev.map((b) => (b.id === existing.batch_id ? { ...b, current_count: Math.max(0, b.current_count + birdDelta) } : b))
      );
      setSheds((prev) =>
        prev.map((s) => (s.id === existing.shed_id ? { ...s, current_birds: Math.max(0, s.current_birds + birdDelta), updated_at: new Date().toISOString() } : s))
      );
    }

    if (balanceDelta !== 0) {
      setCustomers((prev) =>
        prev.map((c) =>
          c.id === existing.customer_id
            ? { ...c, current_balance: c.current_balance + balanceDelta }
            : c
        )
      );
    }

    logAudit('UPDATE_BIRD_SALE', 'BIRD_SALE', existing.invoice_no, existing, updated);
    return { success: true };
  };

  const cancelBirdSale = (id: string) => {
    const sale = birdSales.find((s) => s.id === id);
    if (!sale) return { success: false, error: 'Bird sale not found' };
    if (sale.sale_status === 'cancelled') {
      return { success: false, error: 'Sale record is already cancelled.' };
    }

    setBatches((prev) =>
      prev.map((b) => (b.id === sale.batch_id ? { ...b, current_count: b.current_count + sale.bird_quantity } : b))
    );
    setSheds((prev) =>
      prev.map((s) => (s.id === sale.shed_id ? { ...s, current_birds: s.current_birds + sale.bird_quantity, updated_at: new Date().toISOString() } : s))
    );

    if (sale.outstanding_amount > 0) {
      setCustomers((prev) =>
        prev.map((c) =>
          c.id === sale.customer_id
            ? { ...c, current_balance: Math.max(0, c.current_balance - sale.outstanding_amount) }
            : c
        )
      );
    }

    setBirdSales((prev) =>
      prev.map((s) => (s.id === id ? { ...s, sale_status: 'cancelled', updated_at: new Date().toISOString() } : s))
    );

    logAudit('CANCEL_BIRD_SALE', 'BIRD_SALE', sale.invoice_no, sale, { sale_status: 'cancelled' });
    return { success: true };
  };

  // Supplier Bill
  const createSupplierBill = (billData: Omit<SupplierBill, 'id' | 'created_at'>) => {
    const newBill: SupplierBill = {
      ...billData,
      id: 'sbill-' + Date.now(),
      bill_status: 'active',
      created_at: new Date().toISOString(),
    };
    setSupplierBills((prev) => [newBill, ...prev]);

    setSuppliers((prev) =>
      prev.map((s) =>
        s.id === billData.supplier_id
          ? { ...s, current_balance: s.current_balance + billData.outstanding_amount }
          : s
      )
    );

    logAudit('CREATE_SUPPLIER_BILL', 'SUPPLIER_BILL', newBill.bill_no, null, newBill);
  };

  const updateSupplierBill = (id: string, updates: Partial<SupplierBill>) => {
    const existing = supplierBills.find((b) => b.id === id);
    if (!existing) return { success: false, error: 'Bill not found' };

    const oldOutstanding = existing.outstanding_amount;
    const newOutstanding = updates.outstanding_amount !== undefined ? Number(updates.outstanding_amount) : existing.outstanding_amount;
    const balanceDelta = newOutstanding - oldOutstanding;

    const updated: SupplierBill = {
      ...existing,
      ...updates,
      outstanding_amount: newOutstanding,
      updated_at: new Date().toISOString(),
      last_modified_by: currentUser.id,
    };

    setSupplierBills((prev) => prev.map((b) => (b.id === id ? updated : b)));

    if (balanceDelta !== 0) {
      setSuppliers((prev) =>
        prev.map((s) =>
          s.id === existing.supplier_id
            ? { ...s, current_balance: s.current_balance + balanceDelta }
            : s
        )
      );
    }

    logAudit('UPDATE_SUPPLIER_BILL', 'SUPPLIER_BILL', existing.bill_no, existing, updated);
    return { success: true };
  };

  const deleteSupplierBill = (id: string) => {
    const bill = supplierBills.find((b) => b.id === id);
    if (!bill) return { success: false, error: 'Bill not found' };

    if (bill.outstanding_amount > 0) {
      setSuppliers((prev) =>
        prev.map((s) =>
          s.id === bill.supplier_id
            ? { ...s, current_balance: Math.max(0, s.current_balance - bill.outstanding_amount) }
            : s
        )
      );
    }

    setSupplierBills((prev) => prev.filter((b) => b.id !== id));
    logAudit('DELETE_SUPPLIER_BILL', 'SUPPLIER_BILL', bill.bill_no, bill, null);
    return { success: true };
  };

  // Payments
  const recordPayment = (paymentData: Omit<PaymentTransaction, 'id' | 'created_at'>) => {
    const newPayment: PaymentTransaction = {
      ...paymentData,
      id: 'pay-' + Date.now(),
      payment_status_flag: 'active',
      created_at: new Date().toISOString(),
    };
    setPayments((prev) => [newPayment, ...prev]);

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

  const updatePayment = (id: string, updates: Partial<PaymentTransaction>) => {
    const existing = payments.find((p) => p.id === id);
    if (!existing) return { success: false, error: 'Payment record not found' };

    const oldAmount = existing.amount;
    const newAmount = updates.amount !== undefined ? Number(updates.amount) : existing.amount;
    const amountDelta = oldAmount - newAmount;

    const updated: PaymentTransaction = {
      ...existing,
      ...updates,
      amount: newAmount,
      updated_at: new Date().toISOString(),
      last_modified_by: currentUser.id,
    };

    setPayments((prev) => prev.map((p) => (p.id === id ? updated : p)));

    if (amountDelta !== 0) {
      if (existing.party_type === 'customer') {
        setCustomers((prev) =>
          prev.map((c) => (c.id === existing.party_id ? { ...c, current_balance: c.current_balance + amountDelta } : c))
        );
      } else if (existing.party_type === 'supplier') {
        setSuppliers((prev) =>
          prev.map((s) => (s.id === existing.party_id ? { ...s, current_balance: s.current_balance + amountDelta } : s))
        );
      }
    }

    logAudit('UPDATE_PAYMENT', 'PAYMENT', existing.receipt_no, existing, updated);
    return { success: true };
  };

  const deletePayment = (id: string) => {
    const payment = payments.find((p) => p.id === id);
    if (!payment) return { success: false, error: 'Payment not found' };

    if (payment.party_type === 'customer') {
      setCustomers((prev) =>
        prev.map((c) => (c.id === payment.party_id ? { ...c, current_balance: c.current_balance + payment.amount } : c))
      );
    } else if (payment.party_type === 'supplier') {
      setSuppliers((prev) =>
        prev.map((s) => (s.id === payment.party_id ? { ...s, current_balance: s.current_balance + payment.amount } : s))
      );
    }

    setPayments((prev) => prev.filter((p) => p.id !== id));
    logAudit('DELETE_PAYMENT', 'PAYMENT', payment.receipt_no, payment, null);
    return { success: true };
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

  const updateVaccinationRecord = (id: string, updates: Partial<VaccinationRecord>) => {
    const existing = vaccinationRecords.find((v) => v.id === id);
    if (!existing) return { success: false, error: 'Vaccination record not found' };
    const updated = { ...existing, ...updates, updated_at: new Date().toISOString(), last_modified_by: currentUser.id };
    setVaccinationRecords((prev) => prev.map((v) => (v.id === id ? updated : v)));
    logAudit('UPDATE_VACCINATION', 'VACCINATION', id, existing, updated);
    return { success: true };
  };

  const deleteVaccinationRecord = (id: string) => {
    const existing = vaccinationRecords.find((v) => v.id === id);
    if (!existing) return { success: false, error: 'Vaccination record not found' };
    setVaccinationRecords((prev) => prev.filter((v) => v.id !== id));
    logAudit('DELETE_VACCINATION', 'VACCINATION', id, existing, null);
    return { success: true };
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
              updated_at: new Date().toISOString(),
              last_modified_by: currentUser.id,
            }
          : v
      )
    );
  };

  const addHealthEvent = (ev: Omit<HealthEvent, 'id' | 'created_at'>) => {
    const newEv: HealthEvent = {
      ...ev,
      id: 'he-' + Date.now(),
      created_at: new Date().toISOString(),
    };
    setHealthEvents((prev) => [newEv, ...prev]);
    logAudit('RECORD_HEALTH_EVENT', 'HEALTH_EVENT', newEv.diagnosis, null, newEv);
  };

  const updateHealthEvent = (id: string, updates: Partial<HealthEvent>) => {
    const existing = healthEvents.find((h) => h.id === id);
    if (!existing) return { success: false, error: 'Health event not found' };
    const updated = { ...existing, ...updates, updated_at: new Date().toISOString(), last_modified_by: currentUser.id };
    setHealthEvents((prev) => prev.map((h) => (h.id === id ? updated : h)));
    logAudit('UPDATE_HEALTH_EVENT', 'HEALTH_EVENT', id, existing, updated);
    return { success: true };
  };

  const deleteHealthEvent = (id: string) => {
    const existing = healthEvents.find((h) => h.id === id);
    if (!existing) return { success: false, error: 'Health event not found' };
    setHealthEvents((prev) => prev.filter((h) => h.id !== id));
    logAudit('DELETE_HEALTH_EVENT', 'HEALTH_EVENT', id, existing, null);
    return { success: true };
  };

  const addWeightRecord = (rec: Omit<WeightRecord, 'id' | 'created_at'>) => {
    const newRec: WeightRecord = {
      ...rec,
      id: 'wr-' + Date.now(),
      created_at: new Date().toISOString(),
    };
    setWeightRecords((prev) => [newRec, ...prev]);
    logAudit('RECORD_WEIGHT', 'WEIGHT_MONITORING', newRec.id, null, newRec);
  };

  const updateWeightRecord = (id: string, updates: Partial<WeightRecord>) => {
    const existing = weightRecords.find((w) => w.id === id);
    if (!existing) return { success: false, error: 'Weight record not found' };
    const avg = updates.average_weight_grams !== undefined ? Number(updates.average_weight_grams) : existing.average_weight_grams;
    const target = updates.target_weight_grams !== undefined ? Number(updates.target_weight_grams) : existing.target_weight_grams;
    const updated = {
      ...existing,
      ...updates,
      average_weight_grams: avg,
      target_weight_grams: target,
      difference_grams: avg - target,
      updated_at: new Date().toISOString(),
      last_modified_by: currentUser.id,
    };
    setWeightRecords((prev) => prev.map((w) => (w.id === id ? updated : w)));
    logAudit('UPDATE_WEIGHT_RECORD', 'WEIGHT_MONITORING', id, existing, updated);
    return { success: true };
  };

  const deleteWeightRecord = (id: string) => {
    const existing = weightRecords.find((w) => w.id === id);
    if (!existing) return { success: false, error: 'Weight record not found' };
    setWeightRecords((prev) => prev.filter((w) => w.id !== id));
    logAudit('DELETE_WEIGHT_RECORD', 'WEIGHT_MONITORING', id, existing, null);
    return { success: true };
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

  const updateExpense = (id: string, updates: Partial<ExpenseRecord>) => {
    const existing = expenses.find((e) => e.id === id);
    if (!existing) return { success: false, error: 'Expense not found' };
    const updated = { ...existing, ...updates, updated_at: new Date().toISOString(), last_modified_by: currentUser.id };
    setExpenses((prev) => prev.map((e) => (e.id === id ? updated : e)));
    logAudit('UPDATE_EXPENSE', 'EXPENSE', id, existing, updated);
    return { success: true };
  };

  const deleteExpense = (id: string) => {
    const existing = expenses.find((e) => e.id === id);
    if (!existing) return { success: false, error: 'Expense not found' };
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    logAudit('DELETE_EXPENSE', 'EXPENSE', id, existing, null);
    return { success: true };
  };

  const addElectricityBill = (bill: Omit<ElectricityBill, 'id'>) => {
    const newBill: ElectricityBill = {
      ...bill,
      id: 'eb-' + Date.now(),
    };
    setElectricityBills((prev) => [newBill, ...prev]);
  };

  const updateElectricityBill = (id: string, updates: Partial<ElectricityBill>) => {
    const existing = electricityBills.find((b) => b.id === id);
    if (!existing) return { success: false, error: 'Electricity bill not found' };
    const updated = { ...existing, ...updates, updated_at: new Date().toISOString(), last_modified_by: currentUser.id };
    setElectricityBills((prev) => prev.map((b) => (b.id === id ? updated : b)));
    logAudit('UPDATE_ELECTRICITY_BILL', 'ELECTRICITY', id, existing, updated);
    return { success: true };
  };

  const deleteElectricityBill = (id: string) => {
    const existing = electricityBills.find((b) => b.id === id);
    if (!existing) return { success: false, error: 'Electricity bill not found' };
    setElectricityBills((prev) => prev.filter((b) => b.id !== id));
    logAudit('DELETE_ELECTRICITY_BILL', 'ELECTRICITY', id, existing, null);
    return { success: true };
  };

  const addSalaryRecord = (sal: Omit<EmployeeSalary, 'id'>) => {
    const newSal: EmployeeSalary = {
      ...sal,
      id: 'sal-' + Date.now(),
    };
    setSalaries((prev) => [...prev, newSal]);
  };

  const updateSalaryRecord = (id: string, updates: Partial<EmployeeSalary>) => {
    const existing = salaries.find((s) => s.id === id);
    if (!existing) return { success: false, error: 'Salary record not found' };
    const updated = { ...existing, ...updates, updated_at: new Date().toISOString(), last_modified_by: currentUser.id };
    setSalaries((prev) => prev.map((s) => (s.id === id ? updated : s)));
    logAudit('UPDATE_SALARY', 'SALARY', id, existing, updated);
    return { success: true };
  };

  const deleteSalaryRecord = (id: string) => {
    const existing = salaries.find((s) => s.id === id);
    if (!existing) return { success: false, error: 'Salary record not found' };
    setSalaries((prev) => prev.filter((s) => s.id !== id));
    logAudit('DELETE_SALARY', 'SALARY', id, existing, null);
    return { success: true };
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

  // Reset Operational Records (Admin Only, Two-Step Confirmed)
  const resetOperationalData = async (
    confirmationPhrase: string,
    adminPassword: string
  ): Promise<{ success: boolean; error?: string; message?: string }> => {
    if (authenticatedUser.role !== 'owner_admin') {
      logAudit('UNAUTHORIZED_DATA_RESET_ATTEMPT', 'SECURITY', 'ALL_TABLES', null, {
        actor: authenticatedUser.email,
        reason: 'Non-admin role blocked from operational data reset',
      });
      return {
        success: false,
        error: 'Forbidden: Only an authenticated Farm Owner/Admin can perform data reset operations.',
      };
    }

    if (!confirmationPhrase || confirmationPhrase.trim().toUpperCase() !== 'RESET KPF DATA') {
      return {
        success: false,
        error: 'Confirmation phrase mismatch. You must enter "RESET KPF DATA" to confirm.',
      };
    }

    if (!adminPassword || adminPassword.trim().length === 0) {
      return {
        success: false,
        error: 'Farm Owner/Admin account password is required for two-step authorization.',
      };
    }

    try {
      // 1. Call server API /api/admin/reset-data
      const storedSession = getStoredSession();
      const res = await fetch('/api/admin/reset-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          confirmationPhrase: confirmationPhrase.trim(),
          adminPassword: adminPassword.trim(),
          sessionToken: storedSession?.token,
          userId: authenticatedUser.id,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        return {
          success: false,
          error: data.error || 'Server rejected the operational reset request.',
        };
      }

      // 2. Clear All Operational Records down to clean empty / zero state
      setDailyBirdRecords([]);
      setDailyEggRecords([]);
      setEggSales([]);
      setBirdSales([]);
      setSupplierBills([]);
      setPayments([]);
      setExpenses([]);
      setFeedIssues([]);
      setFeedProductions([]);
      setVaccinationRecords([]);
      setHealthEvents([]);
      setWeightRecords([]);
      setApprovalRequests([]);
      setBatchMovements([]);
      setElectricityBills([]);
      setSalaries([]);
      setBatches([]);
      setWarehouseItems([]);
      setCustomers([]);
      setSuppliers([]);

      // Reset stock of feed ingredients to 0 kg while preserving ingredient definitions
      setFeedIngredients((prev) =>
        prev.map((fi) => ({
          ...fi,
          current_stock_kg: 0,
          updated_at: new Date().toISOString(),
        }))
      );

      // Reset live birds in all 8 sheds to 0 (preserving shed structure and capacities)
      const zeroedSheds: Shed[] = sheds.map((s) => ({
        ...s,
        current_birds: 0,
        updated_at: new Date().toISOString(),
      }));
      setSheds(zeroedSheds);

      // STRICTLY PRESERVED:
      // - users (all user profiles & accounts preserved)
      // - authenticatedUser & currentUser (active session preserved)
      // - user credentials in localStorage (kpf_user_credentials)
      // - session cookies (kpf_session)
      // - farmProfile (legal name, address, GSTIN, FY, timezone)
      // - visibilitySettings (manager switches)
      // - recipes (feed formulations)

      // 3. Append Audit Log Entry
      const auditEntry: AuditLog = {
        id: data.auditId || 'aud-reset-' + Date.now(),
        actor_id: authenticatedUser.id,
        actor_name: authenticatedUser.full_name,
        actor_role: authenticatedUser.role,
        action: 'RESET_OPERATIONAL_DATA',
        entity_type: 'SYSTEM',
        entity_id: 'ALL_OPERATIONAL_TABLES',
        timestamp: new Date().toISOString(),
        new_values: JSON.stringify({
          scope: 'all_operational_data_cleared',
          preserved: ['users', 'user_credentials', 'farmProfile', 'sheds_infrastructure', 'visibilitySettings', 'recipes'],
          status: 'SUCCESS',
        }),
      };
      setAuditLogs((prev) => [auditEntry, ...prev]);

      // 4. Update localStorage safely
      if (typeof window !== 'undefined') {
        try {
          const preservedState = {
            farmProfile,
            visibilitySettings,
            users,
            currentUser,
            authenticatedUser,
            sheds: zeroedSheds,
            batches: [],
            feedIngredients: feedIngredients.map((fi) => ({ ...fi, current_stock_kg: 0 })),
            recipes,
            customers: [],
            suppliers: [],
            dailyBirdRecords: [],
            dailyEggRecords: [],
            eggSales: [],
            birdSales: [],
            supplierBills: [],
            payments: [],
            expenses: [],
            electricityBills: [],
            salaries: [],
            feedProductions: [],
            feedIssues: [],
            vaccinationRecords: [],
            healthEvents: [],
            weightRecords: [],
            warehouseItems: [],
            auditLogs: [auditEntry, ...auditLogs],
            approvalRequests: [],
            notifications: [
              {
                id: 'notif-' + Date.now(),
                title: 'Operational Data Reset',
                message: 'All farm operational records, sales, batches, and bird counts have been successfully cleared.',
                type: 'warning',
                read: false,
                created_at: new Date().toISOString(),
              },
            ],
          };
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(preservedState));
        } catch (e) {
          console.error('Failed to sync state after reset', e);
        }
      }

      return {
        success: true,
        message: data.message || 'All farm operational records, sales, batches, and bird counts have been permanently reset to zero. User accounts and login credentials were preserved.',
      };
    } catch (e: any) {
      return {
        success: false,
        error: e.message || 'Network error executing data reset.',
      };
    }
  };

  const resetAllData = () => {
    console.warn('Direct resetAllData is deprecated. Use resetOperationalData with two-step confirmation.');
  };

  return (
    <FarmContext.Provider
      value={{
        currentUser,
        authenticatedUser,
        isAdmin: isAuthenticated && authenticatedUser.role === 'owner_admin',
        isPreviewingManager: isAuthenticated && authenticatedUser.role === 'owner_admin' && previewRole === 'manager',
        getActiveAdminCount,
        users,
        isAuthenticated,
        authLoading,
        login,
        logout,
        resetPassword,
        setUserPassword,
        switchRole,
        updateCurrentUser,
        addUser,
        updateUser,
        deleteUser,
        visibilitySettings,
        updateVisibilitySettings,
        farmProfile,
        updateFarmProfile,
        canEdit,
        canDelete,
        sheds,
        batches,
        batchMovements,
        addShed,
        updateShed,
        deleteShed,
        addBatch,
        updateBatch,
        deleteBatch,
        transferBirds,
        reverseBatchMovement,
        dailyBirdRecords,
        addDailyBirdRecord,
        updateDailyBirdRecord,
        deleteDailyBirdRecord,
        dailyEggRecords,
        addDailyEggRecord,
        updateDailyEggRecord,
        deleteDailyEggRecord,
        feedIngredients,
        recipes,
        feedProductions,
        feedIssues,
        addFeedIngredient,
        updateFeedIngredient,
        deleteFeedIngredient,
        addRecipe,
        updateRecipe,
        deleteRecipe,
        produceFeed,
        cancelFeedProduction,
        issueFeedToShed,
        updateFeedIssue,
        deleteFeedIssue,
        warehouseItems,
        addWarehouseItem,
        updateWarehouseItem,
        deleteWarehouseItem,
        customers,
        eggSales,
        birdSales,
        suppliers,
        supplierBills,
        payments,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        addSupplier,
        updateSupplier,
        deleteSupplier,
        createEggSale,
        updateEggSale,
        cancelEggSale,
        createBirdSale,
        updateBirdSale,
        cancelBirdSale,
        createSupplierBill,
        updateSupplierBill,
        deleteSupplierBill,
        recordPayment,
        updatePayment,
        deletePayment,
        vaccinationSchedules,
        vaccinationRecords,
        healthEvents,
        weightRecords,
        addVaccinationRecord,
        updateVaccinationRecord,
        deleteVaccinationRecord,
        updateVaccinationStatus,
        addHealthEvent,
        updateHealthEvent,
        deleteHealthEvent,
        addWeightRecord,
        updateWeightRecord,
        deleteWeightRecord,
        expenses,
        electricityBills,
        salaries,
        addExpense,
        updateExpense,
        deleteExpense,
        addElectricityBill,
        updateElectricityBill,
        deleteElectricityBill,
        addSalaryRecord,
        updateSalaryRecord,
        deleteSalaryRecord,
        approvalRequests,
        createApprovalRequest,
        reviewApprovalRequest,
        auditLogs,
        logAudit,
        notifications,
        markNotificationRead,
        resetOperationalData,
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
