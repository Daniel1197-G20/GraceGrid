-- Migration: 20260903000002_reset_milestones_to_real_donations.sql
-- Description: Reset support milestones to authentic real amounts (raised = 0) and clean up test data

-- 1. Remove mock/test donations from donations table
DELETE FROM public.donations 
WHERE reference LIKE 'test_%' 
   OR email = 'verifier@gracegrid.app'
   OR email LIKE '%@example.com';

-- 2. Reset milestone raised amounts to real starting value (0)
UPDATE public.support_milestones
SET raised = 0,
    updated_at = timezone('utc'::text, now())
WHERE id IN ('domain', 'playstore');

-- 3. Create helper RPC to recalculate real milestone totals from confirmed donations
CREATE OR REPLACE FUNCTION public.recalculate_milestones_from_donations()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_donation RECORD;
    v_unallocated NUMERIC;
    v_milestone RECORD;
    v_needed NUMERIC;
    v_add NUMERIC;
BEGIN
    -- Reset all milestones to 0
    UPDATE public.support_milestones 
    SET raised = 0, 
        updated_at = timezone('utc'::text, now());

    -- Process all non-test confirmed donations in order of arrival
    FOR v_donation IN
        SELECT amount, milestone_id
        FROM public.donations
        WHERE status = 'success'
          AND (reference IS NULL OR reference NOT LIKE 'test_%')
          AND (email IS NULL OR email != 'verifier@gracegrid.app')
        ORDER BY created_at ASC
    LOOP
        IF v_donation.milestone_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.support_milestones WHERE id = v_donation.milestone_id) THEN
            UPDATE public.support_milestones
            SET raised = raised + v_donation.amount,
                updated_at = timezone('utc'::text, now())
            WHERE id = v_donation.milestone_id;
        ELSE
            -- Waterfall allocation to earliest unfulfilled milestone
            v_unallocated := v_donation.amount;
            FOR v_milestone IN 
                SELECT id, target, raised 
                FROM public.support_milestones 
                ORDER BY display_order ASC 
            LOOP
                IF v_unallocated <= 0 THEN EXIT; END IF;
                v_needed := GREATEST(0, v_milestone.target - v_milestone.raised);
                IF v_needed > 0 THEN
                    v_add := LEAST(v_needed, v_unallocated);
                    UPDATE public.support_milestones 
                    SET raised = raised + v_add, 
                        updated_at = timezone('utc'::text, now()) 
                    WHERE id = v_milestone.id;
                    v_unallocated := v_unallocated - v_add;
                END IF;
            END LOOP;

            -- Overflow to final milestone
            IF v_unallocated > 0 THEN
                UPDATE public.support_milestones 
                SET raised = raised + v_unallocated, 
                    updated_at = timezone('utc'::text, now())
                WHERE id = (SELECT id FROM public.support_milestones ORDER BY display_order DESC LIMIT 1);
            END IF;
        END IF;
    END LOOP;

    RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.recalculate_milestones_from_donations() TO anon, authenticated, service_role;
