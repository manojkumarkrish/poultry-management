-- =========================================================================
-- KASTHURI POULTRY FARM (KPF) — STRICT RBAC & ANTI-SELF-PROMOTION MIGRATION
-- Enforces Row Level Security (RLS) and database-level trigger constraints:
-- 1. Prevents non-admin users from updating role or permissions (no self-promotion).
-- 2. Ensures only Owner/Admin accounts can assign or change roles.
-- 3. Protects the last active Owner/Admin from being deleted, deactivated, or demoted.
-- 4. Secures manager_visibility_settings and user_profiles tables.
-- =========================================================================

-- Enable RLS on core identity and permissions tables if not already enabled
ALTER TABLE IF EXISTS user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS manager_visibility_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS farms ENABLE ROW LEVEL SECURITY;

-- -------------------------------------------------------------------------
-- 1. Helper function: Check if current executing auth user is an Owner/Admin
-- -------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'owner_admin'
      AND user_profiles.is_active = true
  );
$$;

-- -------------------------------------------------------------------------
-- 2. Database Trigger: Enforce Role Immutability & Single-Admin Safeguard
-- -------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION enforce_role_security_and_safeguard()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_admin_count INTEGER;
  v_caller_role VARCHAR(50);
BEGIN
  -- Determine role of calling user (if authenticated session exists)
  SELECT role INTO v_caller_role
  FROM user_profiles
  WHERE id = auth.uid();

  -- If operation is an UPDATE
  IF TG_OP = 'UPDATE' THEN
    -- Check if role or active status is changing
    IF (OLD.role IS DISTINCT FROM NEW.role) OR (OLD.is_active IS DISTINCT FROM NEW.is_active) THEN
      -- Only active Owner/Admin can alter roles or active status
      IF v_caller_role IS DISTINCT FROM 'owner_admin' THEN
        RAISE EXCEPTION 'Forbidden: Only an authenticated Owner/Admin can modify user roles or activation status.';
      END IF;

      -- Single-Admin Safeguard:
      -- If the record being altered is an active Owner/Admin:
      IF OLD.role = 'owner_admin' AND OLD.is_active = true THEN
        -- Check if there are other active admins
        SELECT COUNT(*) INTO v_admin_count
        FROM user_profiles
        WHERE role = 'owner_admin'
          AND is_active = true
          AND id != OLD.id;

        IF v_admin_count = 0 THEN
          IF NEW.role != 'owner_admin' THEN
            RAISE EXCEPTION 'Single-Admin Safeguard: Cannot demote the last active Owner/Admin account.';
          END IF;
          IF NEW.is_active = false THEN
            RAISE EXCEPTION 'Single-Admin Safeguard: Cannot deactivate the last active Owner/Admin account.';
          END IF;
        END IF;
      END IF;
    END IF;

    -- Return updated record
    RETURN NEW;
  END IF;

  -- If operation is a DELETE
  IF TG_OP = 'DELETE' THEN
    IF v_caller_role IS DISTINCT FROM 'owner_admin' THEN
      RAISE EXCEPTION 'Forbidden: Only an authenticated Owner/Admin can delete user accounts.';
    END IF;

    IF OLD.role = 'owner_admin' THEN
      SELECT COUNT(*) INTO v_admin_count
      FROM user_profiles
      WHERE role = 'owner_admin'
        AND is_active = true
        AND id != OLD.id;

      IF v_admin_count = 0 THEN
        RAISE EXCEPTION 'Single-Admin Safeguard: Cannot delete the last active Owner/Admin account.';
      END IF;
    END IF;

    RETURN OLD;
  END IF;

  RETURN NEW;
END;
$$;

-- Drop existing trigger if it was previously created
DROP TRIGGER IF EXISTS trg_enforce_role_security ON user_profiles;

CREATE TRIGGER trg_enforce_role_security
BEFORE UPDATE OR DELETE ON user_profiles
FOR EACH ROW
EXECUTE FUNCTION enforce_role_security_and_safeguard();

-- -------------------------------------------------------------------------
-- 3. Row Level Security Policies for user_profiles
-- -------------------------------------------------------------------------

-- Drop old loose policies if present
DROP POLICY IF EXISTS "Allow authenticated read for all active farm members" ON user_profiles;
DROP POLICY IF EXISTS "Allow user to update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins full management of user_profiles" ON user_profiles;
DROP POLICY IF EXISTS "Read user profiles" ON user_profiles;
DROP POLICY IF EXISTS "Update user profiles" ON user_profiles;

-- Read: Authenticated users can view team member directory
CREATE POLICY "Authenticated users can view profiles" ON user_profiles
  FOR SELECT TO authenticated
  USING (true);

-- Insert: ONLY Owner/Admin can provision new users
CREATE POLICY "Admins can create users" ON user_profiles
  FOR INSERT TO authenticated
  WITH CHECK (is_admin());

-- Update:
-- 1) Owner/Admin can update any profile (subject to single-admin trigger)
-- 2) Normal users can ONLY update their own name/phone (role changes blocked by trigger)
CREATE POLICY "Admins can update all profiles" ON user_profiles
  FOR UPDATE TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Users can update own contact details" ON user_profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid() AND
    -- Role cannot be modified by user themselves
    role = (SELECT role FROM user_profiles WHERE id = auth.uid())
  );

-- Delete: ONLY Owner/Admin can delete profiles (subject to single-admin trigger)
CREATE POLICY "Admins can delete user profiles" ON user_profiles
  FOR DELETE TO authenticated
  USING (is_admin() AND id != auth.uid());

-- -------------------------------------------------------------------------
-- 4. Row Level Security Policies for manager_visibility_settings
-- -------------------------------------------------------------------------
DROP POLICY IF EXISTS "Read manager visibility settings" ON manager_visibility_settings;
DROP POLICY IF EXISTS "Update manager visibility settings" ON manager_visibility_settings;

CREATE POLICY "All active members can read visibility settings" ON manager_visibility_settings
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Only admins can modify manager visibility settings" ON manager_visibility_settings
  FOR ALL TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());
