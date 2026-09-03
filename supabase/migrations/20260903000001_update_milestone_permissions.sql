-- Migration: 20260903000001_update_milestone_permissions.sql
-- Description: Grant execute on admin_update_milestone to anon, authenticated, and service_role, and reset seed amounts

GRANT EXECUTE ON FUNCTION public.admin_update_milestone(TEXT, NUMERIC, NUMERIC, TEXT, TEXT) TO anon, authenticated, service_role;

-- Allow anon and authenticated to view donations safely
DROP POLICY IF EXISTS "Allow authenticated to view donations" ON public.donations;
CREATE POLICY "Allow authenticated and anon to view donations"
    ON public.donations
    FOR SELECT
    TO anon, authenticated, service_role
    USING (true);

-- Reset initial raised values
UPDATE public.support_milestones SET raised = 6500 WHERE id = 'domain';
UPDATE public.support_milestones SET raised = 14500 WHERE id = 'playstore';
DELETE FROM public.donations WHERE reference LIKE 'test_ref_%';
