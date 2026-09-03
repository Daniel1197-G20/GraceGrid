-- Migration: 20260903000003_allow_test_donation_cleanup.sql
-- Description: Allow anon and authenticated to delete test donations and provide RPC for cleaning test records

DROP POLICY IF EXISTS "Allow anon and auth to delete test donations" ON public.donations;
CREATE POLICY "Allow anon and auth to delete test donations"
    ON public.donations
    FOR DELETE
    TO anon, authenticated, service_role
    USING (reference LIKE 'test_%' OR email = 'verifier@gracegrid.app');

CREATE OR REPLACE FUNCTION public.cleanup_test_donations()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    DELETE FROM public.donations 
    WHERE reference LIKE 'test_%' 
       OR email = 'verifier@gracegrid.app';

    RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.cleanup_test_donations() TO anon, authenticated, service_role;
