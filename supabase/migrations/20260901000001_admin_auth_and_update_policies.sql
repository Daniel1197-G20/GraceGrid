-- Migration: 20260901000001_admin_auth_and_update_policies.sql
-- Description: Policies and helper functions for authenticated Supabase Admin dashboard access

-- 1. Enable Authenticated Users to Read all waitlist records
DROP POLICY IF EXISTS "Allow authenticated users to read waitlist" ON public.waitlist;
CREATE POLICY "Allow authenticated users to read waitlist"
    ON public.waitlist
    FOR SELECT
    TO authenticated
    USING (true);

-- 2. Enable Authenticated Users to Update subscriber records (e.g. modify role)
DROP POLICY IF EXISTS "Allow authenticated users to update waitlist" ON public.waitlist;
CREATE POLICY "Allow authenticated users to update waitlist"
    ON public.waitlist
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- 3. Enable Authenticated Users to Delete subscriber records
DROP POLICY IF EXISTS "Allow authenticated users to delete waitlist" ON public.waitlist;
CREATE POLICY "Allow authenticated users to delete waitlist"
    ON public.waitlist
    FOR DELETE
    TO authenticated
    USING (true);

-- 4. Helper RPC function to update subscriber role safely
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

GRANT EXECUTE ON FUNCTION public.admin_update_subscriber_role(UUID, TEXT) TO authenticated, anon, service_role;

-- 5. Helper RPC function to delete subscriber
CREATE OR REPLACE FUNCTION public.admin_delete_subscriber(
  subscriber_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.waitlist WHERE id = subscriber_id;
  RETURN jsonb_build_object('success', true, 'id', subscriber_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_delete_subscriber(UUID) TO authenticated, anon, service_role;
