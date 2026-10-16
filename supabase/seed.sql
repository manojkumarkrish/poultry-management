-- =========================================================================
-- SEED DATA: 100,000 BIRDS POULTRY FARM MANAGEMENT SYSTEM
-- =========================================================================

-- 1. Default Farm
INSERT INTO farms (id, name, capacity_target, address, currency)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'Balaji Commercial Poultry Complex',
    100000,
    'NH-44 Poultry Corridor, Namakkal District, Tamil Nadu',
    'INR'
) ON CONFLICT DO NOTHING;

-- 2. Default Users (Owner/Admin and Managers)
INSERT INTO user_profiles (id, farm_id, email, full_name, role, phone, is_active)
VALUES 
(
    'u0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'owner@balajipoultry.com',
    'Rajesh Balaji (Owner/Admin)',
    'owner_admin',
    '+91 98450 11223',
    true
),
(
    'u0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000001',
    'manager@balajipoultry.com',
    'Suresh Kumar (Shed Operations Manager)',
    'manager',
    '+91 98450 44556',
    true
) ON CONFLICT DO NOTHING;

-- 3. Default Manager Visibility Settings
INSERT INTO manager_visibility_settings (
    id, farm_id, farm_analytics, financial_dashboard, revenue_and_expenses,
    profit_loss, customer_supplier_accounts, purchase_and_payments,
    detailed_reports_export, historical_data_access, shed_level_restrictions_enabled, approval_required_for_sensitive
) VALUES (
    'm0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    true,   -- farm_analytics
    false,  -- financial_dashboard
    false,  -- revenue_and_expenses
    false,  -- profit_loss
    false,  -- customer_supplier_accounts
    false,  -- purchase_and_payments
    false,  -- detailed_reports_export
    false,  -- historical_data_access
    false,  -- shed_level_restrictions_enabled
    true    -- approval_required_for_sensitive
) ON CONFLICT DO NOTHING;

-- 4. 8 Physical Sheds: L1, L2, L3, L4, L5 (Layer), G1, G2 (Grower), C1 (Chick)
INSERT INTO sheds (id, farm_id, code, name, shed_type, capacity, current_birds, status, location, notes)
VALUES
('s0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'L1', 'Layer Shed 1', 'layer', 18000, 17400, 'active', 'East Wing Bay-1', 'Automated nipple drinkers & conveyor egg collection'),
('s0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'L2', 'Layer Shed 2', 'layer', 18000, 17250, 'active', 'East Wing Bay-2', 'Automated nipple drinkers & manual egg collection'),
('s0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'L3', 'Layer Shed 3', 'layer', 18000, 17600, 'active', 'East Wing Bay-3', 'Automated climate ventilation'),
('s0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'L4', 'Layer Shed 4', 'layer', 18000, 17800, 'active', 'West Wing Bay-1', 'Tunnel ventilation system'),
('s0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'L5', 'Layer Shed 5', 'layer', 18000, 17100, 'active', 'West Wing Bay-2', 'Conveyor egg collector, mature flock'),
('s0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001', 'G1', 'Grower Shed 1', 'grower', 6000, 5800, 'active', 'North Rearing Bay-1', 'Deep litter rearing system with automatic pan feeders'),
('s0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000001', 'G2', 'Grower Shed 2', 'grower', 4000, 3920, 'active', 'North Rearing Bay-2', 'Pre-lay grower batch'),
('s0000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000001', 'C1', 'Chick Brooding Shed', 'chick', 3000, 2980, 'active', 'South Brooder Bay', 'Controlled infrared brooder heating & gas canopy')
ON CONFLICT (code) DO UPDATE SET capacity = EXCLUDED.capacity, current_birds = EXCLUDED.current_birds;

-- 5. Batches in Production (Totaling ~99,850 live birds across all 8 sheds)
INSERT INTO batches (id, farm_id, batch_code, name, bird_type, stage, current_shed_id, purchase_date, initial_count, current_count, age_days, cost_per_bird, purchase_cost, supplier_hatchery, status)
VALUES
('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'BATCH-L1-2026', 'Flock 2026-Alpha (L1)', 'BV300 White Leghorn', 'layer', 's0000000-0000-0000-0000-000000000001', '2026-03-20', 18000, 17400, 210, 48.00, 864000.00, 'Venkateshwara Hatcheries', 'active'),
('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'BATCH-L2-2026', 'Flock 2026-Beta (L2)', 'BV300 White Leghorn', 'layer', 's0000000-0000-0000-0000-000000000002', '2026-04-05', 18000, 17250, 195, 48.00, 864000.00, 'Venkateshwara Hatcheries', 'active'),
('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'BATCH-L3-2026', 'Flock 2026-Gamma (L3)', 'BV300 White Leghorn', 'layer', 's0000000-0000-0000-0000-000000000003', '2026-04-30', 18000, 17600, 170, 49.00, 882000.00, 'Venkateshwara Hatcheries', 'active'),
('b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'BATCH-L4-2026', 'Flock 2026-Delta (L4)', 'Lohmann Brown Classic', 'layer', 's0000000-0000-0000-0000-000000000004', '2026-05-30', 18000, 17800, 140, 52.00, 936000.00, 'Suguna Breeding Farms', 'active'),
('b0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'BATCH-L5-2026', 'Flock 2025-Epsilon (L5)', 'BV300 White Leghorn', 'layer', 's0000000-0000-0000-0000-000000000005', '2026-02-20', 18000, 17100, 240, 47.00, 846000.00, 'Venkateshwara Hatcheries', 'active'),
('b0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001', 'BATCH-G1-2026', 'Grower Batch G1', 'BV300 White Leghorn', 'grower', 's0000000-0000-0000-0000-000000000006', '2026-08-02', 6000, 5800, 75, 48.00, 288000.00, 'Venkateshwara Hatcheries', 'active'),
('b0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000001', 'BATCH-G2-2026', 'Grower Batch G2', 'BV300 White Leghorn', 'grower', 's0000000-0000-0000-0000-000000000007', '2026-08-22', 4000, 3920, 55, 48.00, 192000.00, 'Venkateshwara Hatcheries', 'active'),
('b0000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000001', 'BATCH-C1-2026', 'Chick Brooder Batch C1', 'BV300 White Leghorn', 'chick', 's0000000-0000-0000-0000-000000000008', '2026-10-04', 3000, 2980, 12, 48.00, 144000.00, 'Venkateshwara Hatcheries', 'active')
ON CONFLICT (batch_code) DO NOTHING;

-- 6. Feed Ingredients
INSERT INTO feed_ingredients (code, name, unit, opening_stock_kg, current_stock_kg, unit_price_per_kg, reorder_level_kg, supplier_name)
VALUES
('ING-MAIZE', 'Yellow Maize (Corn)', 'kg', 25000.00, 18500.00, 23.50, 5000.00, 'Kisan Agro Traders'),
('ING-SOYA', 'De-oiled Soya Cake (DOC 46% Protein)', 'kg', 12000.00, 8400.00, 42.00, 3000.00, 'Godrej Agrovet Ltd'),
('ING-DORB', 'De-oiled Rice Bran (DORB)', 'kg', 8000.00, 5200.00, 16.00, 2000.00, 'Sri Lakshmi Rice Mills'),
('ING-CALC', 'Calcite Powder / Limestone Grit', 'kg', 10000.00, 7800.00, 5.20, 2500.00, 'Deccan Minerals Corp'),
('ING-DCP', 'Di-Calcium Phosphate (DCP)', 'kg', 3000.00, 2100.00, 46.00, 800.00, 'Aries Agro Chem'),
('ING-PREMIX', 'Layer Vitamin-Mineral Premix + Amino Acids', 'kg', 1500.00, 950.00, 180.00, 300.00, 'Nutritech Animal Health'),
('ING-SALT', 'Pure Sodium Chloride (Feed Salt)', 'kg', 2000.00, 1450.00, 6.00, 500.00, 'Tata Solar Salts')
ON CONFLICT (code) DO NOTHING;

-- 7. Standard Vaccination Schedules
INSERT INTO vaccination_schedules (bird_stage, target_age_days, vaccine_name, route_of_administration, disease_targeted, notes)
VALUES
('chick', 1, 'Marek''s Disease Vaccine (HVT)', 'subcutaneous', 'Marek''s Disease', 'Administered at hatchery or on arrival day'),
('chick', 7, 'Ranikhet / Newcastle (RD F1 / Lasota)', 'eye_drop', 'Newcastle Disease', 'Primary eye-drop immunization'),
('chick', 14, 'Infectious Bursal Disease (IBD Gumboro - Intermediate)', 'drinking_water', 'Gumboro Disease', 'Administer with skimmed milk stabilizer'),
('grower', 28, 'Newcastle Disease (Lasota Booster)', 'drinking_water', 'Newcastle Disease', 'Second booster'),
('grower', 42, 'Infectious Coryza (Bivalent)', 'subcutaneous', 'Avian Coryza', 'Neck subcutaneous injection'),
('layer', 112, 'Newcastle + Egg Drop Syndrome (ND+EDS Inactivated)', 'subcutaneous', 'ND & Egg Drop Syndrome', 'Pre-laying combined immunization booster')
ON CONFLICT DO NOTHING;
