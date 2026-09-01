-- Migration: 20260901000000_add_admin_waitlist_functions.sql
-- Description: RPC function to safely retrieve all waitlist registrations for the GraceGrid Admin Dashboard

ALTER TABLE public.waitlist ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'believer';

CREATE OR REPLACE FUNCTION public.get_admin_waitlist_all(limit_count integer DEFAULT 1000)
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  email TEXT,
  role TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    w.id,
    w.full_name,
    w.email,
    w.role,
    w.created_at
  FROM public.waitlist w
  ORDER BY w.created_at DESC
  LIMIT limit_count;
$$;

GRANT EXECUTE ON FUNCTION public.get_admin_waitlist_all(integer) TO anon, authenticated, service_role;
