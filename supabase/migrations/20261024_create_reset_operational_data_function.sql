-- =========================================================================
-- KPF: TRANSACTIONAL OPERATIONAL DATA RESET PROCEDURE (ADMIN-ONLY)
-- Preserves: user_profiles, farms, sheds, manager_visibility_settings,
--            feed_recipes, vaccination_schedules, and system audit trail.
-- Resets: operational daily records, sales, bills, expenses, payments.
-- =========================================================================

CREATE OR REPLACE FUNCTION reset_kpf_operational_data(
    p_actor_id UUID,
    p_actor_name TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_actor_role TEXT;
    v_audit_id UUID := uuid_generate_v4();
    v_records_cleared INTEGER := 0;
    v_count INTEGER;
BEGIN
    -- 1. Security Check: Actor must be active owner_admin
    SELECT role INTO v_actor_role
    FROM user_profiles
    WHERE id = p_actor_id AND is_active = TRUE;

    IF v_actor_role IS NULL OR v_actor_role <> 'owner_admin' THEN
        RAISE EXCEPTION 'Authorization Error: Only an authenticated Owner/Admin can execute an operational data reset.';
    END IF;

    -- 2. Transactional Deletions (Ordered by foreign key dependencies)
    -- Payments & financial vouchers
    DELETE FROM payments;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_records_cleared := v_records_cleared + v_count;

    -- Egg and bird sales
    DELETE FROM egg_sales;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_records_cleared := v_records_cleared + v_count;

    DELETE FROM bird_sales;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_records_cleared := v_records_cleared + v_count;

    -- Supplier bills
    DELETE FROM supplier_bills;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_records_cleared := v_records_cleared + v_count;

    -- Feed operations
    DELETE FROM feed_issues;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_records_cleared := v_records_cleared + v_count;

    DELETE FROM feed_production;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_records_cleared := v_records_cleared + v_count;

    -- Daily production records
    DELETE FROM daily_egg_records;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_records_cleared := v_records_cleared + v_count;

    DELETE FROM daily_bird_records;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_records_cleared := v_records_cleared + v_count;

    -- Batch movements
    DELETE FROM batch_movements;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_records_cleared := v_records_cleared + v_count;

    -- Health, vaccination, and weight sampling
    DELETE FROM health_events;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_records_cleared := v_records_cleared + v_count;

    DELETE FROM vaccination_records;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_records_cleared := v_records_cleared + v_count;

    DELETE FROM weight_records;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_records_cleared := v_records_cleared + v_count;

    -- Expenses, utility bills, and salary vouchers
    DELETE FROM expenses;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_records_cleared := v_records_cleared + v_count;

    DELETE FROM electricity_bills;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_records_cleared := v_records_cleared + v_count;

    DELETE FROM employee_salaries;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_records_cleared := v_records_cleared + v_count;

    -- Pending/handled approval requests
    DELETE FROM approval_requests;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_records_cleared := v_records_cleared + v_count;

    -- 3. Balance & Stock Restorations to Baseline
    UPDATE customers
    SET current_balance = opening_balance;

    UPDATE suppliers
    SET current_balance = opening_balance;

    UPDATE feed_ingredients
    SET current_stock_kg = opening_stock_kg;

    -- Reset batch active bird counts to initial stock
    UPDATE batches
    SET current_count = initial_count,
        status = 'active';

    -- Reset shed current_birds to capacity or batch counts
    UPDATE sheds s
    SET current_birds = COALESCE(
        (SELECT SUM(current_count) FROM batches b WHERE b.current_shed_id = s.id AND b.status = 'active'),
        0
    );

    -- 4. Record Audit Log Entry for Reset Action
    INSERT INTO audit_logs (
        id,
        actor_id,
        actor_name,
        actor_role,
        action,
        entity_type,
        entity_id,
        old_values,
        new_values,
        timestamp
    ) VALUES (
        v_audit_id,
        p_actor_id,
        p_actor_name,
        'owner_admin',
        'RESET_OPERATIONAL_DATA',
        'SYSTEM',
        'ALL_OPERATIONAL_TABLES',
        jsonb_build_object('scope', 'operational_records'),
        jsonb_build_object(
            'status', 'SUCCESS',
            'records_cleared', v_records_cleared,
            'preserved', jsonb_build_array('user_profiles', 'farms', 'sheds', 'manager_visibility_settings', 'feed_recipes')
        ),
        NOW()
    );

    RETURN jsonb_build_object(
        'success', true,
        'records_cleared', v_records_cleared,
        'audit_id', v_audit_id,
        'timestamp', NOW()
    );

EXCEPTION WHEN OTHERS THEN
    -- Any unexpected failure rolls back all deletions automatically in this transaction
    RAISE EXCEPTION 'Operational Data Reset Failed: % (Transaction automatically rolled back)', SQLERRM;
END;
$$;

-- Restrict function execution
REVOKE ALL ON FUNCTION reset_kpf_operational_data(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION reset_kpf_operational_data(UUID, TEXT) TO authenticated, service_role;
