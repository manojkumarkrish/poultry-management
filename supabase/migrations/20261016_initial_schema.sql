-- =========================================================================
-- POULTRY FARM MANAGEMENT SYSTEM — 100,000 BIRDS MULTI-SHED ARCHITECTURE
-- PostgreSQL Schema & Row Level Security (RLS) Migrations
-- =========================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. FARMS & USER PROFILES
CREATE TABLE IF NOT EXISTS farms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL DEFAULT 'Balaji Poultry Farms Ltd (100,000 Birds)',
    capacity_target INTEGER NOT NULL DEFAULT 100000,
    address TEXT,
    currency VARCHAR(10) DEFAULT 'INR',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farm_id UUID REFERENCES farms(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('owner_admin', 'manager')),
    phone VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. MANAGER VISIBILITY & PERMISSIONS SWITCHES
CREATE TABLE IF NOT EXISTS manager_visibility_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farm_id UUID REFERENCES farms(id) ON DELETE CASCADE,
    farm_analytics BOOLEAN DEFAULT TRUE,
    financial_dashboard BOOLEAN DEFAULT FALSE,
    revenue_and_expenses BOOLEAN DEFAULT FALSE,
    profit_loss BOOLEAN DEFAULT FALSE,
    customer_supplier_accounts BOOLEAN DEFAULT FALSE,
    purchase_and_payments BOOLEAN DEFAULT FALSE,
    detailed_reports_export BOOLEAN DEFAULT FALSE,
    historical_data_access BOOLEAN DEFAULT FALSE,
    shed_level_restrictions_enabled BOOLEAN DEFAULT FALSE,
    approval_required_for_sensitive BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. USER SHED ACCESS (For granular shed-level access control)
CREATE TABLE IF NOT EXISTS user_shed_access (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    shed_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. SHED GROUPS & SHEDS (8 Physical Sheds: L1-L5, G1-G2, C1)
CREATE TABLE IF NOT EXISTS shed_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farm_id UUID REFERENCES farms(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sheds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farm_id UUID REFERENCES farms(id) ON DELETE CASCADE,
    group_id UUID REFERENCES shed_groups(id) ON DELETE SET NULL,
    code VARCHAR(20) UNIQUE NOT NULL, -- L1, L2, L3, L4, L5, G1, G2, C1
    name VARCHAR(100) NOT NULL,
    shed_type VARCHAR(20) NOT NULL CHECK (shed_type IN ('layer', 'grower', 'chick')),
    capacity INTEGER NOT NULL CHECK (capacity > 0),
    current_birds INTEGER NOT NULL DEFAULT 0 CHECK (current_birds >= 0),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'cleaning', 'maintenance', 'inactive')),
    location TEXT,
    notes TEXT,
    assigned_manager_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. BATCHES & BATCH MOVEMENTS (Chick -> Grower -> Layer lifecycle)
CREATE TABLE IF NOT EXISTS batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farm_id UUID REFERENCES farms(id) ON DELETE CASCADE,
    batch_code VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    bird_type VARCHAR(100) NOT NULL, -- e.g. BV300, Cobb 500, Hy-Line
    stage VARCHAR(50) NOT NULL CHECK (stage IN ('chick', 'grower', 'layer', 'completed')),
    current_shed_id UUID REFERENCES sheds(id) ON DELETE RESTRICT,
    purchase_date DATE NOT NULL,
    initial_count INTEGER NOT NULL CHECK (initial_count > 0),
    current_count INTEGER NOT NULL CHECK (current_count >= 0),
    age_days INTEGER NOT NULL DEFAULT 1 CHECK (age_days >= 0),
    cost_per_bird NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    purchase_cost NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    supplier_hatchery VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'transferred', 'culled', 'completed')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS batch_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id UUID REFERENCES batches(id) ON DELETE CASCADE,
    from_shed_id UUID REFERENCES sheds(id) ON DELETE RESTRICT,
    to_shed_id UUID REFERENCES sheds(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    movement_date DATE NOT NULL,
    reason TEXT NOT NULL,
    authorized_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. DAILY FARM ENTRY RECORDS
CREATE TABLE IF NOT EXISTS daily_bird_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    record_date DATE NOT NULL,
    shed_id UUID REFERENCES sheds(id) ON DELETE RESTRICT,
    batch_id UUID REFERENCES batches(id) ON DELETE RESTRICT,
    opening_birds INTEGER NOT NULL CHECK (opening_birds >= 0),
    birds_received INTEGER DEFAULT 0 CHECK (birds_received >= 0),
    transfers_in INTEGER DEFAULT 0 CHECK (transfers_in >= 0),
    transfers_out INTEGER DEFAULT 0 CHECK (transfers_out >= 0),
    mortality INTEGER DEFAULT 0 CHECK (mortality >= 0),
    culls INTEGER DEFAULT 0 CHECK (culls >= 0),
    bird_sales INTEGER DEFAULT 0 CHECK (bird_sales >= 0),
    other_removals INTEGER DEFAULT 0 CHECK (other_removals >= 0),
    closing_birds INTEGER NOT NULL CHECK (closing_birds >= 0),
    feed_consumed_kg NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (feed_consumed_kg >= 0),
    water_consumed_litres NUMERIC(10, 2) DEFAULT 0.00,
    egg_count INTEGER DEFAULT 0 CHECK (egg_count >= 0),
    damaged_eggs INTEGER DEFAULT 0 CHECK (damaged_eggs >= 0),
    broken_eggs INTEGER DEFAULT 0 CHECK (broken_eggs >= 0),
    temperature_c NUMERIC(5, 2),
    humidity_pct NUMERIC(5, 2),
    health_observations TEXT,
    notes TEXT,
    entered_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    is_draft BOOLEAN DEFAULT FALSE,
    status VARCHAR(50) DEFAULT 'submitted' CHECK (status IN ('draft', 'submitted', 'approved')),
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_daily_shed_record UNIQUE(record_date, shed_id, batch_id)
);

-- 7. FEED INGREDIENTS, RECIPES & PRODUCTION
CREATE TABLE IF NOT EXISTS feed_ingredients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    unit VARCHAR(20) DEFAULT 'kg',
    opening_stock_kg NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    current_stock_kg NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (current_stock_kg >= 0),
    unit_price_per_kg NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    reorder_level_kg NUMERIC(10, 2) NOT NULL DEFAULT 500.00,
    supplier_name VARCHAR(255),
    notes TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS feed_recipes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    bird_stage VARCHAR(50) NOT NULL CHECK (bird_stage IN ('chick', 'grower', 'layer')),
    version INTEGER NOT NULL DEFAULT 1,
    effective_date DATE NOT NULL,
    batch_size_kg NUMERIC(10, 2) NOT NULL DEFAULT 1000.00,
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS recipe_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipe_id UUID REFERENCES feed_recipes(id) ON DELETE CASCADE,
    ingredient_id UUID REFERENCES feed_ingredients(id) ON DELETE RESTRICT,
    percentage NUMERIC(5, 2) NOT NULL CHECK (percentage > 0 AND percentage <= 100),
    kg_per_ton NUMERIC(10, 2) NOT NULL
);

CREATE TABLE IF NOT EXISTS feed_production (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_number VARCHAR(100) UNIQUE NOT NULL,
    recipe_id UUID REFERENCES feed_recipes(id) ON DELETE RESTRICT,
    production_date DATE NOT NULL,
    produced_quantity_kg NUMERIC(10, 2) NOT NULL CHECK (produced_quantity_kg > 0),
    production_loss_kg NUMERIC(10, 2) DEFAULT 0.00,
    total_ingredient_cost NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    cost_per_kg NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    recorded_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS feed_issues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    issue_date DATE NOT NULL,
    shed_id UUID REFERENCES sheds(id) ON DELETE RESTRICT,
    batch_id UUID REFERENCES batches(id) ON DELETE RESTRICT,
    feed_type VARCHAR(100) NOT NULL,
    quantity_issued_kg NUMERIC(10, 2) NOT NULL CHECK (quantity_issued_kg > 0),
    quantity_returned_kg NUMERIC(10, 2) DEFAULT 0.00 CHECK (quantity_returned_kg >= 0),
    net_consumed_kg NUMERIC(10, 2) NOT NULL CHECK (net_consumed_kg >= 0),
    authorized_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. GODOWN & INVENTORY
CREATE TABLE IF NOT EXISTS warehouses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    location_details TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS warehouse_stock_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    warehouse_id UUID REFERENCES warehouses(id) ON DELETE CASCADE,
    item_name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL,
    current_quantity NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    unit VARCHAR(20) NOT NULL,
    unit_cost NUMERIC(10, 2) DEFAULT 0.00,
    reorder_level NUMERIC(10, 2) DEFAULT 10.00,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. EGG PRODUCTION & INVENTORY
CREATE TABLE IF NOT EXISTS daily_egg_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    collection_date DATE NOT NULL,
    shed_id UUID REFERENCES sheds(id) ON DELETE RESTRICT,
    batch_id UUID REFERENCES batches(id) ON DELETE RESTRICT,
    opening_layer_birds INTEGER NOT NULL CHECK (opening_layer_birds > 0),
    total_eggs_collected INTEGER NOT NULL CHECK (total_eggs_collected >= 0),
    good_eggs INTEGER NOT NULL CHECK (good_eggs >= 0),
    damaged_eggs INTEGER DEFAULT 0 CHECK (damaged_eggs >= 0),
    broken_eggs INTEGER DEFAULT 0 CHECK (broken_eggs >= 0),
    rejected_eggs INTEGER DEFAULT 0 CHECK (rejected_eggs >= 0),
    trays_count INTEGER NOT NULL, -- Calculated: good_eggs / 30
    loose_eggs_count INTEGER NOT NULL, -- Calculated: good_eggs % 30
    production_percentage NUMERIC(5, 2) NOT NULL, -- (total_eggs / opening_birds) * 100
    notes TEXT,
    entered_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_daily_egg_collection UNIQUE(collection_date, shed_id, batch_id)
);

-- 10. CUSTOMERS, SUPPLIERS, SALES & BILLS
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(255),
    customer_type VARCHAR(50) NOT NULL CHECK (customer_type IN ('egg_buyer', 'bird_buyer', 'both')),
    opening_balance NUMERIC(12, 2) DEFAULT 0.00,
    current_balance NUMERIC(12, 2) DEFAULT 0.00,
    credit_limit NUMERIC(12, 2) DEFAULT 500000.00,
    address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS egg_sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_no VARCHAR(100) UNIQUE NOT NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE RESTRICT,
    sale_date DATE NOT NULL,
    egg_category VARCHAR(50) DEFAULT 'good',
    total_eggs INTEGER NOT NULL CHECK (total_eggs > 0),
    trays_count INTEGER NOT NULL,
    loose_eggs_count INTEGER NOT NULL,
    price_per_egg NUMERIC(10, 2) NOT NULL,
    price_per_tray NUMERIC(10, 2) NOT NULL,
    gross_amount NUMERIC(12, 2) NOT NULL,
    discount_amount NUMERIC(10, 2) DEFAULT 0.00,
    net_amount NUMERIC(12, 2) NOT NULL,
    paid_amount NUMERIC(12, 2) DEFAULT 0.00,
    outstanding_amount NUMERIC(12, 2) NOT NULL,
    payment_status VARCHAR(50) DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'partial', 'paid')),
    payment_mode VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bird_sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_no VARCHAR(100) UNIQUE NOT NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE RESTRICT,
    shed_id UUID REFERENCES sheds(id) ON DELETE RESTRICT,
    batch_id UUID REFERENCES batches(id) ON DELETE RESTRICT,
    sale_date DATE NOT NULL,
    bird_quantity INTEGER NOT NULL CHECK (bird_quantity > 0),
    average_weight_kg NUMERIC(6, 3) NOT NULL,
    total_weight_kg NUMERIC(10, 2) NOT NULL,
    price_per_bird_or_kg NUMERIC(10, 2) NOT NULL,
    pricing_basis VARCHAR(50) DEFAULT 'per_kg' CHECK (pricing_basis IN ('per_bird', 'per_kg')),
    gross_amount NUMERIC(12, 2) NOT NULL,
    transport_charges NUMERIC(10, 2) DEFAULT 0.00,
    net_amount NUMERIC(12, 2) NOT NULL,
    paid_amount NUMERIC(12, 2) DEFAULT 0.00,
    outstanding_amount NUMERIC(12, 2) NOT NULL,
    payment_status VARCHAR(50) DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'partial', 'paid')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(255),
    category VARCHAR(50) NOT NULL,
    opening_balance NUMERIC(12, 2) DEFAULT 0.00,
    current_balance NUMERIC(12, 2) DEFAULT 0.00,
    address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS supplier_bills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bill_no VARCHAR(100) UNIQUE NOT NULL,
    supplier_id UUID REFERENCES suppliers(id) ON DELETE RESTRICT,
    bill_date DATE NOT NULL,
    due_date DATE NOT NULL,
    items_summary TEXT NOT NULL,
    total_amount NUMERIC(12, 2) NOT NULL,
    paid_amount NUMERIC(12, 2) DEFAULT 0.00,
    outstanding_amount NUMERIC(12, 2) NOT NULL,
    payment_status VARCHAR(50) DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'partial', 'paid')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    receipt_no VARCHAR(100) UNIQUE NOT NULL,
    payment_type VARCHAR(50) NOT NULL CHECK (payment_type IN ('customer_receipt', 'supplier_payment', 'expense_payment')),
    party_type VARCHAR(50) NOT NULL,
    party_id UUID NOT NULL,
    party_name VARCHAR(255) NOT NULL,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    payment_date DATE NOT NULL,
    payment_mode VARCHAR(50) NOT NULL,
    reference_no VARCHAR(100),
    allocated_invoice_or_bill_id UUID,
    notes TEXT,
    recorded_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. HEALTH, VACCINATION & WEIGHT
CREATE TABLE IF NOT EXISTS vaccination_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bird_stage VARCHAR(50) NOT NULL CHECK (bird_stage IN ('chick', 'grower', 'layer')),
    target_age_days INTEGER NOT NULL CHECK (target_age_days >= 0),
    vaccine_name VARCHAR(255) NOT NULL,
    route_of_administration VARCHAR(100) NOT NULL,
    disease_targeted VARCHAR(255) NOT NULL,
    notes TEXT
);

CREATE TABLE IF NOT EXISTS vaccination_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    schedule_id UUID REFERENCES vaccination_schedules(id) ON DELETE SET NULL,
    batch_id UUID REFERENCES batches(id) ON DELETE RESTRICT,
    shed_id UUID REFERENCES sheds(id) ON DELETE RESTRICT,
    vaccine_name VARCHAR(255) NOT NULL,
    scheduled_date DATE NOT NULL,
    actual_date DATE,
    status VARCHAR(50) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'postponed', 'missed')),
    cost NUMERIC(10, 2) DEFAULT 0.00,
    administered_by VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS health_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_date DATE NOT NULL,
    batch_id UUID REFERENCES batches(id) ON DELETE RESTRICT,
    shed_id UUID REFERENCES sheds(id) ON DELETE RESTRICT,
    symptoms TEXT NOT NULL,
    diagnosis TEXT NOT NULL,
    veterinary_advice TEXT,
    treatment_medicine VARCHAR(255) NOT NULL,
    dosage VARCHAR(100) NOT NULL,
    cost NUMERIC(10, 2) DEFAULT 0.00,
    associated_mortality INTEGER DEFAULT 0,
    follow_up_date DATE,
    responsible_person VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS weight_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sample_date DATE NOT NULL,
    batch_id UUID REFERENCES batches(id) ON DELETE RESTRICT,
    shed_id UUID REFERENCES sheds(id) ON DELETE RESTRICT,
    birds_sampled INTEGER NOT NULL CHECK (birds_sampled > 0),
    average_weight_grams NUMERIC(8, 2) NOT NULL,
    min_weight_grams NUMERIC(8, 2),
    max_weight_grams NUMERIC(8, 2),
    target_weight_grams NUMERIC(8, 2) NOT NULL,
    difference_grams NUMERIC(8, 2) NOT NULL,
    age_days INTEGER NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. EXPENSES, ELECTRICITY & LABOUR
CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category VARCHAR(100) NOT NULL,
    expense_date DATE NOT NULL,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    payment_method VARCHAR(50) NOT NULL,
    payee VARCHAR(255) NOT NULL,
    reference_no VARCHAR(100),
    shed_id UUID REFERENCES sheds(id) ON DELETE SET NULL,
    batch_id UUID REFERENCES batches(id) ON DELETE SET NULL,
    notes TEXT,
    is_accrual BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS electricity_bills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    billing_month VARCHAR(10) NOT NULL,
    shed_id UUID REFERENCES sheds(id) ON DELETE SET NULL,
    meter_number VARCHAR(100) NOT NULL,
    previous_reading NUMERIC(10, 2) NOT NULL,
    current_reading NUMERIC(10, 2) NOT NULL,
    units_consumed NUMERIC(10, 2) NOT NULL,
    rate_per_unit NUMERIC(8, 2) NOT NULL,
    total_amount NUMERIC(10, 2) NOT NULL,
    due_date DATE NOT NULL,
    paid_date DATE,
    status VARCHAR(50) DEFAULT 'unpaid' CHECK (status IN ('unpaid', 'partial', 'paid')),
    notes TEXT
);

CREATE TABLE IF NOT EXISTS employee_salaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_name VARCHAR(255) NOT NULL,
    role_designation VARCHAR(100) NOT NULL,
    assigned_shed_code VARCHAR(20),
    month VARCHAR(10) NOT NULL,
    basic_salary NUMERIC(10, 2) NOT NULL,
    allowances NUMERIC(10, 2) DEFAULT 0.00,
    deductions_or_advance NUMERIC(10, 2) DEFAULT 0.00,
    net_salary NUMERIC(10, 2) NOT NULL,
    payment_status VARCHAR(50) DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid')),
    payment_date DATE
);

-- 13. AUDIT LOGS, APPROVALS & NOTIFICATIONS
CREATE TABLE IF NOT EXISTS approval_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    action_type VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(100) NOT NULL,
    requested_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    requested_by_name VARCHAR(255) NOT NULL,
    request_payload JSONB NOT NULL,
    reason TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    reviewed_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    review_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id UUID,
    actor_name VARCHAR(255) NOT NULL,
    actor_role VARCHAR(50) NOT NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(100) NOT NULL,
    old_values JSONB,
    new_values JSONB,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    ip_address VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    target_role VARCHAR(50) DEFAULT 'all',
    link VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE farms ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sheds ENABLE ROW LEVEL SECURITY;
ALTER TABLE batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_bird_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_production ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_egg_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE egg_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE bird_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_requests ENABLE ROW LEVEL SECURITY;

-- Default Permissive Read Policies for Farm Operators (Owner & Managers)
CREATE POLICY "Allow authenticated read for all active farm members" ON sheds
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated read for batches" ON batches
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow insert daily records by managers and admins" ON daily_bird_records
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow read daily records" ON daily_bird_records
    FOR SELECT TO authenticated USING (true);

-- Financial isolation for owner_admin only when restricted
CREATE POLICY "Admins full access to egg sales" ON egg_sales
    FOR ALL TO authenticated USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.id = auth.uid()
            AND user_profiles.role = 'owner_admin'
        )
    );

CREATE POLICY "Admins full access to expenses" ON expenses
    FOR ALL TO authenticated USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.id = auth.uid()
            AND user_profiles.role = 'owner_admin'
        )
    );

CREATE POLICY "Audit logs immutable read only for admins" ON audit_logs
    FOR SELECT TO authenticated USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.id = auth.uid()
            AND user_profiles.role = 'owner_admin'
        )
    );
