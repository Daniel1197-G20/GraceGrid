-- Migration: 20260831000001_add_get_recent_activity_rpc.sql
-- Description: RPC function to safely retrieve recent waitlist activity (first name and timestamp only) for the public ticker

CREATE OR REPLACE FUNCTION public.get_recent_waitlist_activity(limit_count integer DEFAULT 10)
RETURNS TABLE (
  id UUID,
  first_name TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    w.id,
    split_part(trim(w.full_name), ' ', 1) AS first_name,
    w.created_at
  FROM public.waitlist w
  ORDER BY w.created_at DESC
  LIMIT limit_count;
$$;

GRANT EXECUTE ON FUNCTION public.get_recent_waitlist_activity(integer) TO anon, authenticated, service_role;
