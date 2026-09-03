-- Migration: 20260903000000_create_support_milestones_and_donations.sql
-- Description: Support milestones and donations tables with realtime synchronization, safe RPCs, and RLS policies

-- 1. Create support_milestones table
CREATE TABLE IF NOT EXISTS public.support_milestones (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    badge_text TEXT NOT NULL DEFAULT 'Milestone',
    target NUMERIC NOT NULL DEFAULT 10000,
    raised NUMERIC NOT NULL DEFAULT 0,
    description TEXT NOT NULL,
    icon TEXT NOT NULL DEFAULT 'Globe',
    display_order INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Seed default milestones (Milestone 1: Domain ₦10,000, Milestone 2: Play Store ₦37,000)
INSERT INTO public.support_milestones (id, title, badge_text, target, raised, description, icon, display_order)
VALUES
  (
    'domain', 
    'GraceGrid .com Domain', 
    'Milestone 1', 
    10000, 
    6500, 
    'Securing our permanent official gracegrid.com domain and dedicated SSL encryption for global fellowship, worship streaming, and community access.', 
    'Globe', 
    1
  ),
  (
    'playstore', 
    'Google Play Store Release', 
    'Milestone 2', 
    37000, 
    14500, 
    'Acquiring the Google Play Console developer license to publish and distribute the GraceGrid Android sanctuary app directly to believers worldwide.', 
    'Smartphone', 
    2
  )
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  badge_text = EXCLUDED.badge_text,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  display_order = EXCLUDED.display_order;

-- 3. Create donations audit table
CREATE TABLE IF NOT EXISTS public.donations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    amount NUMERIC NOT NULL CHECK (amount > 0),
    email TEXT,
    donor_name TEXT,
    reference TEXT UNIQUE,
    milestone_id TEXT REFERENCES public.support_milestones(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'success',
    payment_method TEXT NOT NULL DEFAULT 'paystack',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_donations_created_at ON public.donations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_donations_reference ON public.donations(reference);
CREATE INDEX IF NOT EXISTS idx_support_milestones_display_order ON public.support_milestones(display_order ASC);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.support_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

-- 5. Policies for support_milestones
DROP POLICY IF EXISTS "Allow public read of support_milestones" ON public.support_milestones;
CREATE POLICY "Allow public read of support_milestones"
    ON public.support_milestones
    FOR SELECT
    TO anon, authenticated, service_role
    USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to update support_milestones" ON public.support_milestones;
CREATE POLICY "Allow authenticated users to update support_milestones"
    ON public.support_milestones
    FOR UPDATE
    TO authenticated, service_role
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Service role has full access to support_milestones" ON public.support_milestones;
CREATE POLICY "Service role has full access to support_milestones"
    ON public.support_milestones
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- 6. Policies for donations
DROP POLICY IF EXISTS "Allow anon and auth to insert donations" ON public.donations;
CREATE POLICY "Allow anon and auth to insert donations"
    ON public.donations
    FOR INSERT
    TO anon, authenticated, service_role
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated to view donations" ON public.donations;
CREATE POLICY "Allow authenticated to view donations"
    ON public.donations
    FOR SELECT
    TO authenticated, service_role
    USING (true);

DROP POLICY IF EXISTS "Service role has full access to donations" ON public.donations;
CREATE POLICY "Service role has full access to donations"
    ON public.donations
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- 7. Secure RPC function: Get all support milestones safely
CREATE OR REPLACE FUNCTION public.get_support_milestones()
RETURNS TABLE (
    id TEXT,
    title TEXT,
    badge_text TEXT,
    target NUMERIC,
    raised NUMERIC,
    description TEXT,
    icon TEXT,
    display_order INTEGER
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT 
        m.id,
        m.title,
        m.badge_text,
        m.target,
        m.raised,
        m.description,
        m.icon,
        m.display_order
    FROM public.support_milestones m
    ORDER BY m.display_order ASC;
$$;

GRANT EXECUTE ON FUNCTION public.get_support_milestones() TO anon, authenticated, service_role;

-- 8. Secure RPC function: Record donation and update milestone raised amounts
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
    v_unallocated NUMERIC := p_amount;
    v_milestone RECORD;
    v_needed NUMERIC;
    v_add NUMERIC;
    v_result JSONB;
BEGIN
    -- Validate amount
    IF p_amount IS NULL OR p_amount <= 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid donation amount');
    END IF;

    -- Record donation if reference provided (idempotent by reference)
    IF p_reference IS NOT NULL AND TRIM(p_reference) != '' THEN
        INSERT INTO public.donations (amount, email, donor_name, reference, milestone_id, status)
        VALUES (p_amount, TRIM(p_email), TRIM(p_donor_name), TRIM(p_reference), p_milestone_id, 'success')
        ON CONFLICT (reference) DO NOTHING;
    ELSE
        INSERT INTO public.donations (amount, email, donor_name, milestone_id, status)
        VALUES (p_amount, TRIM(p_email), TRIM(p_donor_name), p_milestone_id, 'success');
    END IF;

    -- If a specific milestone is targeted, add directly to it
    IF p_milestone_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.support_milestones WHERE id = p_milestone_id) THEN
        UPDATE public.support_milestones
        SET raised = raised + p_amount,
            updated_at = timezone('utc'::text, now())
        WHERE id = p_milestone_id;
    ELSE
        -- Waterfall allocation across milestones in order
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

        -- If any remaining amount after all milestones reached, add overflow to last milestone
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

-- 9. Secure RPC function: Admin update milestone targets/raised amounts
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

    RETURN jsonb_build_object('success', true, 'id', p_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_update_milestone(TEXT, NUMERIC, NUMERIC, TEXT, TEXT) TO authenticated, service_role;

-- 10. Enable Supabase Realtime for support_milestones and donations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'support_milestones'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.support_milestones;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'donations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.donations;
  END IF;
END $$;
