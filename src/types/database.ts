export type UserRole = 'owner_admin' | 'manager';

export type BirdStage = 'chick' | 'grower' | 'layer' | 'completed';
export type ShedType = 'layer' | 'grower' | 'chick';
export type ShedStatus = 'active' | 'cleaning' | 'maintenance' | 'inactive';
export type PaymentStatus = 'unpaid' | 'partial' | 'paid';
export type VaccinationStatus = 'scheduled' | 'completed' | 'postponed' | 'missed';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  phone?: string;
  is_active: boolean;
  assigned_shed_ids?: string[]; // If restricted to specific sheds
  created_at: string;
}

export interface ManagerVisibilitySettings {
  farm_analytics: boolean;
  financial_dashboard: boolean;
  revenue_and_expenses: boolean;
  profit_loss: boolean;
  customer_supplier_accounts: boolean;
  purchase_and_payments: boolean;
  detailed_reports_export: boolean;
  historical_data_access: boolean;
  shed_level_restrictions_enabled: boolean;
  approval_required_for_sensitive: boolean;
  // Admin-controlled editing & deletion permissions
  allow_editing_records: boolean;
  allow_deleting_eligible_records: boolean;
  allow_editing_historical_records: boolean;
  require_approval_for_historical_edits: boolean;
  require_approval_for_sensitive_deletions: boolean;
}

export interface FarmProfile {
  farm_name: string; // "KASTHURI POULTRY FARM"
  tagline?: string;
  address: string;
  phone: string;
  email: string;
  gstin: string;
  pan_number?: string;
  state_code?: string;
  bank_name?: string;
  bank_account_no?: string;
  bank_ifsc?: string;
  bank_branch?: string;
  fy_start_month?: number; // 1 to 12 (default 4 for April in India)
  timezone?: string; // e.g. "Asia/Kolkata"
}

export interface Shed {
  id: string;
  code: string; // e.g. L1, L2, L3, L4, L5, G1, G2, C1
  name: string;
  shed_type: ShedType;
  capacity: number;
  current_birds: number;
  status: ShedStatus;
  group_name?: string;
  assigned_manager_id?: string;
  assigned_manager_name?: string;
  location?: string;
  notes?: string;
  updated_at: string;
}

export interface Batch {
  id: string;
  batch_code: string;
  name: string;
  bird_type: string; // e.g. BV300, Cobb 500, Lohmann Brown
  stage: BirdStage;
  current_shed_id: string;
  current_shed_code: string;
  purchase_date: string;
  initial_count: number;
  current_count: number;
  age_days: number;
  cost_per_bird: number;
  purchase_cost: number;
  supplier_hatchery: string;
  status: 'active' | 'transferred' | 'culled' | 'completed';
  notes?: string;
}

export interface BatchMovement {
  id: string;
  batch_id: string;
  batch_code: string;
  from_shed_id: string;
  from_shed_code: string;
  to_shed_id: string;
  to_shed_code: string;
  quantity: number;
  movement_date: string;
  reason: string;
  authorized_by: string;
  movement_status?: 'active' | 'reversed';
  created_at: string;
}

export interface DailyBirdRecord {
  id: string;
  record_date: string;
  shed_id: string;
  shed_code: string;
  batch_id: string;
  batch_code: string;
  opening_birds: number;
  birds_received: number;
  transfers_in: number;
  transfers_out: number;
  mortality: number;
  culls: number;
  bird_sales: number;
  other_removals: number;
  closing_birds: number; // Opening + Received + TransIn - TransOut - Mortality - Culls - Sales - Removals
  feed_consumed_kg: number;
  water_consumed_litres?: number;
  egg_count?: number; // Layer batches only
  damaged_eggs?: number;
  broken_eggs?: number;
  temperature_c?: number;
  humidity_pct?: number;
  health_observations?: string;
  notes?: string;
  entered_by: string;
  entered_by_name: string;
  submitted_at: string;
  updated_at?: string;
  last_modified_by?: string;
  is_draft: boolean;
  status: 'draft' | 'submitted' | 'approved';
}

export interface FeedIngredient {
  id: string;
  code: string;
  name: string;
  unit: string; // kg, quintal, bag
  opening_stock_kg: number;
  current_stock_kg: number;
  unit_price_per_kg: number;
  reorder_level_kg: number;
  supplier_name?: string;
  notes?: string;
  updated_at: string;
}

export interface FeedRecipeItem {
  ingredient_id: string;
  ingredient_name: string;
  percentage: number; // e.g. 55% maize, 25% soya doc, etc. (must sum to 100%)
  kg_per_ton: number;
}

export interface FeedRecipe {
  id: string;
  name: string; // e.g. Chick Starter, Grower Mash, Layer Phase-1
  bird_stage: BirdStage;
  version: number;
  effective_date: string;
  batch_size_kg: number;
  items: FeedRecipeItem[];
  notes?: string;
  is_active: boolean;
}

export interface FeedProduction {
  id: string;
  batch_number: string;
  recipe_id: string;
  recipe_name: string;
  production_date: string;
  produced_quantity_kg: number;
  production_loss_kg: number;
  total_ingredient_cost: number;
  cost_per_kg: number;
  ingredients_used: {
    ingredient_id: string;
    ingredient_name: string;
    quantity_used_kg: number;
    unit_price: number;
    cost: number;
  }[];
  recorded_by: string;
  production_status?: 'active' | 'cancelled';
  status?: 'active' | 'cancelled';
  updated_at?: string;
  last_modified_by?: string;
  created_at: string;
}

export interface FeedIssue {
  id: string;
  issue_date: string;
  shed_id: string;
  shed_code: string;
  batch_id: string;
  batch_code: string;
  feed_type: string;
  quantity_issued_kg: number;
  quantity_returned_kg: number;
  net_consumed_kg: number;
  authorized_by: string;
  notes?: string;
  updated_at?: string;
  last_modified_by?: string;
}

export interface WarehouseStockItem {
  id: string;
  warehouse_name: string;
  category: 'raw_ingredients' | 'finished_feed' | 'eggs' | 'medicines' | 'supplies' | 'equipment';
  item_name: string;
  current_quantity: number;
  unit: string;
  unit_cost: number;
  reorder_level: number;
  location_rack?: string;
  updated_at: string;
}

export interface DailyEggRecord {
  id: string;
  collection_date: string;
  shed_id: string;
  shed_code: string;
  batch_id: string;
  batch_code: string;
  opening_layer_birds: number;
  total_eggs_collected: number;
  good_eggs: number;
  damaged_eggs: number;
  broken_eggs: number;
  rejected_eggs: number;
  trays_count: number; // Floor(good_eggs / 30)
  loose_eggs_count: number; // good_eggs % 30
  production_percentage: number; // (total_eggs_collected / opening_layer_birds) * 100
  notes?: string;
  entered_by: string;
  updated_at?: string;
  last_modified_by?: string;
  created_at: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  customer_type: 'egg_buyer' | 'bird_buyer' | 'both';
  opening_balance: number;
  current_balance: number; // Positive = customer owes farm
  credit_limit: number;
  address?: string;
  updated_at?: string;
}

export interface EggSale {
  id: string;
  invoice_no: string;
  customer_id: string;
  customer_name: string;
  sale_date: string;
  egg_category: 'good' | 'damaged' | 'mixed';
  total_eggs: number;
  trays_count: number;
  loose_eggs_count: number;
  price_per_egg: number;
  price_per_tray: number;
  gross_amount: number;
  discount_amount: number;
  net_amount: number;
  paid_amount: number;
  outstanding_amount: number;
  payment_status: PaymentStatus;
  payment_mode?: 'cash' | 'bank_transfer' | 'upi' | 'cheque' | 'credit';
  notes?: string;
  sale_status?: 'active' | 'cancelled';
  status?: 'active' | 'cancelled';
  updated_at?: string;
  last_modified_by?: string;
  created_at: string;
}

export interface BirdSale {
  id: string;
  invoice_no: string;
  customer_id: string;
  customer_name: string;
  shed_id: string;
  shed_code: string;
  batch_id: string;
  batch_code: string;
  sale_date: string;
  bird_quantity: number;
  average_weight_kg: number;
  total_weight_kg: number;
  price_per_bird_or_kg: number;
  pricing_basis: 'per_bird' | 'per_kg';
  gross_amount: number;
  transport_charges: number;
  net_amount: number;
  paid_amount: number;
  outstanding_amount: number;
  payment_status: PaymentStatus;
  notes?: string;
  sale_status?: 'active' | 'cancelled';
  status?: 'active' | 'cancelled';
  updated_at?: string;
  last_modified_by?: string;
  created_at: string;
}

export interface Supplier {
  id: string;
  code: string;
  name: string;
  phone: string;
  email?: string;
  category: 'feed_ingredients' | 'medicines' | 'chicks' | 'equipment' | 'general';
  opening_balance: number;
  current_balance: number; // Positive = farm owes supplier
  address?: string;
  updated_at?: string;
}

export interface SupplierBill {
  id: string;
  bill_no: string;
  supplier_id: string;
  supplier_name: string;
  bill_date: string;
  due_date: string;
  items_summary: string;
  total_amount: number;
  paid_amount: number;
  outstanding_amount: number;
  payment_status: PaymentStatus;
  bill_status?: 'active' | 'cancelled';
  notes?: string;
  updated_at?: string;
  last_modified_by?: string;
  created_at: string;
}

export interface PaymentTransaction {
  id: string;
  receipt_no: string;
  type: 'customer_receipt' | 'supplier_payment' | 'expense_payment';
  party_type: 'customer' | 'supplier' | 'employee' | 'vendor';
  party_id: string;
  party_name: string;
  amount: number;
  payment_date: string;
  payment_mode: 'cash' | 'bank_transfer' | 'upi' | 'cheque';
  reference_no?: string;
  allocated_invoice_or_bill_id?: string;
  payment_status_flag?: 'active' | 'cancelled';
  notes?: string;
  recorded_by: string;
  updated_at?: string;
  last_modified_by?: string;
  created_at: string;
}

export interface ExpenseRecord {
  id: string;
  category:
    | 'feed_raw_materials'
    | 'medicines_vaccines'
    | 'labour_wages'
    | 'salaries'
    | 'electricity'
    | 'water'
    | 'transport'
    | 'maintenance_repairs'
    | 'packaging_trays'
    | 'administrative'
    | 'miscellaneous';
  expense_date: string;
  amount: number;
  payment_method: 'cash' | 'bank_transfer' | 'upi' | 'cheque' | 'credit';
  payee: string;
  reference_no?: string;
  shed_id?: string;
  shed_code?: string;
  batch_id?: string;
  batch_code?: string;
  notes?: string;
  is_accrual: boolean; // false = cash, true = accrued
  updated_at?: string;
  last_modified_by?: string;
  created_at: string;
}

export interface ElectricityBill {
  id: string;
  billing_month: string; // e.g. "2026-09"
  shed_id?: string;
  shed_code?: string;
  meter_number: string;
  previous_reading: number;
  current_reading: number;
  units_consumed: number;
  rate_per_unit: number;
  total_amount: number;
  due_date: string;
  paid_date?: string;
  status: PaymentStatus;
  notes?: string;
  updated_at?: string;
  last_modified_by?: string;
}

export interface EmployeeSalary {
  id: string;
  employee_name: string;
  role_designation: string;
  assigned_shed_code?: string;
  month: string;
  basic_salary: number;
  allowances: number;
  deductions_or_advance: number;
  net_salary: number;
  payment_status: PaymentStatus;
  payment_date?: string;
  updated_at?: string;
  last_modified_by?: string;
}

export interface VaccinationSchedule {
  id: string;
  bird_stage: BirdStage;
  target_age_days: number;
  vaccine_name: string;
  route_of_administration: 'drinking_water' | 'eye_drop' | 'subcutaneous' | 'wing_web' | 'spray';
  disease_targeted: string;
  notes?: string;
}

export interface VaccinationRecord {
  id: string;
  schedule_id?: string;
  batch_id: string;
  batch_code: string;
  shed_id: string;
  shed_code: string;
  vaccine_name: string;
  scheduled_date: string;
  actual_date?: string;
  status: VaccinationStatus;
  cost: number;
  administered_by: string;
  notes?: string;
  updated_at?: string;
  last_modified_by?: string;
  created_at?: string;
}

export interface HealthEvent {
  id: string;
  event_date: string;
  batch_id: string;
  batch_code: string;
  shed_id: string;
  shed_code: string;
  symptoms: string;
  diagnosis: string;
  veterinary_advice?: string;
  treatment_medicine: string;
  dosage: string;
  cost: number;
  associated_mortality: number;
  follow_up_date?: string;
  responsible_person: string;
  notes?: string;
  updated_at?: string;
  last_modified_by?: string;
  created_at?: string;
}

export interface WeightRecord {
  id: string;
  sample_date: string;
  batch_id: string;
  batch_code: string;
  shed_id: string;
  shed_code: string;
  birds_sampled: number;
  average_weight_grams: number;
  min_weight_grams?: number;
  max_weight_grams?: number;
  target_weight_grams: number;
  difference_grams: number; // avg - target
  age_days: number;
  notes?: string;
  updated_at?: string;
  last_modified_by?: string;
  created_at?: string;
}

export interface ApprovalRequest {
  id: string;
  action_type: 'record_correction' | 'bird_count_adjustment' | 'inventory_adjustment' | 'sale_cancellation' | 'credit_return';
  entity_type: string;
  entity_id: string;
  requested_by: string;
  requested_by_name: string;
  request_payload: string; // JSON string
  reason: string;
  status: ApprovalStatus;
  reviewed_by?: string;
  review_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  actor_id: string;
  actor_name: string;
  actor_role: UserRole;
  action: string;
  entity_type: string;
  entity_id: string;
  old_values?: string; // JSON string
  new_values?: string; // JSON string
  timestamp: string;
  ip_address?: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'stock_low' | 'vaccination_due' | 'mortality_alert' | 'capacity_warning' | 'approval_pending' | 'payment_overdue' | 'info';
  is_read: boolean;
  target_role: 'all' | 'owner_admin' | 'manager';
  created_at: string;
  link?: string;
}

// Egg tray conversion helper constants & functions
export const EGGS_PER_TRAY = 30;

export function convertEggsToTrays(eggs: number) {
  const safeEggs = Math.max(0, eggs);
  const trays = Math.floor(safeEggs / EGGS_PER_TRAY);
  const loose = safeEggs % EGGS_PER_TRAY;
  return { trays, loose, total: safeEggs };
}

export function calculateClosingBirds(
  opening: number,
  received: number,
  transfersIn: number,
  transfersOut: number,
  deaths: number,
  culls: number,
  sales: number,
  otherRemovals: number
): number {
  return opening + received + transfersIn - transfersOut - deaths - culls - sales - otherRemovals;
}

export function calculateEggProductionPct(totalEggs: number, openingLayerBirds: number): number {
  if (openingLayerBirds <= 0) return 0;
  return Number(((totalEggs / openingLayerBirds) * 100).toFixed(2));
}
