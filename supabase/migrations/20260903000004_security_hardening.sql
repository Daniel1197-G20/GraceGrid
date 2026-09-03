-- Migration: 20260903000004_security_hardening.sql
-- Description: Comprehensive security hardening for GraceGrid database:
-- 1. Helper function to identify authenticated administrators securely
-- 2. Revoke anonymous execution on sensitive admin RPCs (get_admin_waitlist_all, admin_update_subscriber_role, admin_delete_subscriber, admin_update_milestone, cleanup_test_donations)
-- 3. Lock down waitlist and donations RLS policies so only verified admins can view/edit/delete PII
-- 4. Guard record_support_donation against negative values, excessive bounds, and replay attacks

-- ==============================================================================
-- 1. Admin Verification Helper Function
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    (auth.role() = 'service_role') OR 
    (auth.role() = 'authenticated' AND (
      auth.jwt() ->> 'email' = 'gracegrid4@gmail.com' OR
      COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', '') ILIKE '%admin%' OR
      COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', '') ILIKE '%admin%'
    ));
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated, service_role;

-- ==============================================================================
-- 2. Secure Waitlist Table RLS Policies
-- ==============================================================================
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

-- Drop legacy permissive policies
DROP POLICY IF EXISTS "Allow authenticated users to read waitlist" ON public.waitlist;
DROP POLICY IF EXISTS "Allow authenticated users to update waitlist" ON public.waitlist;
DROP POLICY IF EXISTS "Allow authenticated users to delete waitlist" ON public.waitlist;

-- Enforce strict admin-only policies
CREATE POLICY "Admin select waitlist"
    ON public.waitlist
    FOR SELECT
    TO authenticated, service_role
    USING (public.is_admin());

CREATE POLICY "Admin update waitlist"
    ON public.waitlist
    FOR UPDATE
    TO authenticated, service_role
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY "Admin delete waitlist"
    ON public.waitlist
    FOR DELETE
    TO authenticated, service_role
    USING (public.is_admin());

-- ==============================================================================
-- 3. Harden Admin RPCs & Revoke Anonymous Access
-- ==============================================================================

-- A. get_admin_waitlist_all
REVOKE EXECUTE ON FUNCTION public.get_admin_waitlist_all(integer) FROM anon;
CREATE OR REPLACE FUNCTION public.get_admin_waitlist_all(limit_count integer DEFAULT 1000)
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  email TEXT,
  role TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied. Administrative privileges required.';
  END IF;

  RETURN QUERY
  SELECT 
    w.id,
    w.full_name,
    w.email,
    w.role,
    w.created_at
  FROM public.waitlist w
  ORDER BY w.created_at DESC
  LIMIT limit_count;
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_admin_waitlist_all(integer) TO authenticated, service_role;

-- B. admin_update_subscriber_role
REVOKE EXECUTE ON FUNCTION public.admin_update_subscriber_role(UUID, TEXT) FROM anon;
CREATE OR REPLACE FUNCTION public.admin_update_subscriber_role(
  subscriber_id UUID,
  new_role TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_record RECORD;
BEGIN
  IF NOT public.is_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Access denied. Administrative privileges required.');
  END IF;

  UPDATE public.waitlist
  SET role = new_role
  WHERE id = subscriber_id
  RETURNING id, full_name, email, role, created_at INTO updated_record;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Subscriber not found');
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'data', jsonb_build_object(
      'id', updated_record.id,
      'fullName', updated_record.full_name,
      'email', updated_record.email,
      'role', updated_record.role,
      'createdAt', updated_record.created_at
    )
  );
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_update_subscriber_role(UUID, TEXT) TO authenticated, service_role;

-- C. admin_delete_subscriber
REVOKE EXECUTE ON FUNCTION public.admin_delete_subscriber(UUID) FROM anon;
CREATE OR REPLACE FUNCTION public.admin_delete_subscriber(
  subscriber_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Access denied. Administrative privileges required.');
  END IF;

  DELETE FROM public.waitlist WHERE id = subscriber_id;
  RETURN jsonb_build_object('success', true, 'id', subscriber_id);
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_delete_subscriber(UUID) TO authenticated, service_role;

-- D. admin_update_milestone
REVOKE EXECUTE ON FUNCTION public.admin_update_milestone(TEXT, NUMERIC, NUMERIC, TEXT, TEXT) FROM anon;
CREATE OR REPLACE FUNCTION public.admin_update_milestone(
    p_id TEXT,
    p_target NUMERIC DEFAULT NULL,
    p_raised NUMERIC DEFAULT NULL,
    p_title TEXT DEFAULT NULL,
    p_description TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT public.is_admin() THEN
        RETURN jsonb_build_object('success', false, 'error', 'Access denied. Administrative privileges required.');
    END IF;

    UPDATE public.support_milestones
    SET 
        target = COALESCE(p_target, target),
        raised = COALESCE(p_raised, raised),
        title = COALESCE(p_title, title),
        description = COALESCE(p_description, description),
        updated_at = timezone('utc'::text, now())
    WHERE id = p_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Milestone not found');
    END IF;

    RETURN jsonb_build_object(
        'success', true, 
        'id', p_id, 
        'milestones', (
            SELECT jsonb_agg(to_jsonb(t)) 
            FROM (SELECT id, title, badge_text, target, raised, description, icon, display_order 
                  FROM public.support_milestones 
                  ORDER BY display_order ASC) t
        )
    );
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_update_milestone(TEXT, NUMERIC, NUMERIC, TEXT, TEXT) TO authenticated, service_role;

-- E. cleanup_test_donations
REVOKE EXECUTE ON FUNCTION public.cleanup_test_donations() FROM anon;
CREATE OR REPLACE FUNCTION public.cleanup_test_donations()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT public.is_admin() THEN
        RETURN jsonb_build_object('success', false, 'error', 'Access denied. Administrative privileges required.');
    END IF;

    DELETE FROM public.donations 
    WHERE reference LIKE 'test_%' 
       OR email = 'verifier@gracegrid.app';

    RETURN jsonb_build_object('success', true);
END;
$$;
GRANT EXECUTE ON FUNCTION public.cleanup_test_donations() TO authenticated, service_role;

-- ==============================================================================
-- 4. Secure Donations Table (Protect Donor PII)
-- ==============================================================================
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

-- Drop permissive public reading policies
DROP POLICY IF EXISTS "Allow authenticated and anon to view donations" ON public.donations;
DROP POLICY IF EXISTS "Allow anon and auth to delete test donations" ON public.donations;

-- Only verified admins can read donations list
CREATE POLICY "Admin view donations"
    ON public.donations
    FOR SELECT
    TO authenticated, service_role
    USING (public.is_admin());

CREATE POLICY "Admin delete donations"
    ON public.donations
    FOR DELETE
    TO authenticated, service_role
    USING (public.is_admin());

-- ==============================================================================
-- 5. Harden record_support_donation RPC
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.record_support_donation(
    p_amount NUMERIC,
    p_email TEXT DEFAULT NULL,
    p_donor_name TEXT DEFAULT NULL,
    p_reference TEXT DEFAULT NULL,
    p_milestone_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_milestone RECORD;
    v_unallocated NUMERIC;
    v_needed NUMERIC;
    v_add NUMERIC;
    v_result JSONB;
    v_clean_ref TEXT;
BEGIN
    -- Input bounds validation: amount must be positive and reasonable (max 10,000,000 NGN)
    IF p_amount IS NULL OR p_amount <= 0 OR p_amount > 10000000 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid donation amount.');
    END IF;

    -- Normalize reference
    v_clean_ref := NULLIF(trim(p_reference), '');

    -- Prevent duplicate transaction replay if reference is provided
    IF v_clean_ref IS NOT NULL THEN
        IF EXISTS (SELECT 1 FROM public.donations WHERE reference = v_clean_ref) THEN
            RETURN jsonb_build_object('success', false, 'error', 'Transaction reference has already been processed.');
        END IF;
    END IF;

    -- 1. Insert into donations audit log
    INSERT INTO public.donations (
        amount,
        email,
        donor_name,
        reference,
        milestone_id,
        status,
        payment_method
    ) VALUES (
        p_amount,
        NULLIF(trim(p_email), ''),
        NULLIF(trim(p_donor_name), ''),
        v_clean_ref,
        NULLIF(trim(p_milestone_id), ''),
        'success',
        'paystack'
    );

    -- 2. Allocate funds to milestones
    IF p_milestone_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.support_milestones WHERE id = p_milestone_id) THEN
        UPDATE public.support_milestones
        SET raised = raised + p_amount,
            updated_at = timezone('utc'::text, now())
        WHERE id = p_milestone_id;
    ELSE
        -- Auto-allocate cascade
        v_unallocated := p_amount;

        FOR v_milestone IN 
            SELECT id, target, raised 
            FROM public.support_milestones 
            ORDER BY display_order ASC 
        LOOP
            IF v_unallocated <= 0 THEN
                EXIT;
            END IF;

            v_needed := GREATEST(0, v_milestone.target - v_milestone.raised);
            IF v_needed > 0 THEN
                v_add := LEAST(v_needed, v_unallocated);
            ELSE
                v_add := 0;
            END IF;

            IF v_add > 0 THEN
                UPDATE public.support_milestones
                SET raised = raised + v_add,
                    updated_at = timezone('utc'::text, now())
                WHERE id = v_milestone.id;

                v_unallocated := v_unallocated - v_add;
            END IF;
        END LOOP;

        IF v_unallocated > 0 THEN
            UPDATE public.support_milestones
            SET raised = raised + v_unallocated,
                updated_at = timezone('utc'::text, now())
            WHERE id = (
                SELECT id FROM public.support_milestones ORDER BY display_order DESC LIMIT 1
            );
        END IF;
    END IF;

    -- Return updated milestones
    SELECT jsonb_agg(to_jsonb(t)) INTO v_result
    FROM (
        SELECT id, title, badge_text, target, raised, description, icon, display_order
        FROM public.support_milestones
        ORDER BY display_order ASC
    ) t;

    RETURN jsonb_build_object(
        'success', true,
        'amount', p_amount,
        'milestones', v_result
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_support_donation(NUMERIC, TEXT, TEXT, TEXT, TEXT) TO anon, authenticated, service_role;
