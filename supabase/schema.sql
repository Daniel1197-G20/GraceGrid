-- ==============================================================================
-- GraceGrid Database Schema: Waitlist Table
-- ==============================================================================

-- 1. Create the waitlist table
CREATE TABLE IF NOT EXISTS public.waitlist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'believer',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Ensure all columns exist if the table was created earlier
ALTER TABLE public.waitlist ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.waitlist ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'believer';
ALTER TABLE public.waitlist ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now());

-- 2. Case-insensitive unique index on email to prevent duplicate signups
CREATE UNIQUE INDEX IF NOT EXISTS waitlist_email_lower_uidx 
    ON public.waitlist (LOWER(TRIM(email)));

-- 3. Performance index on created_at for fast administrative querying
CREATE INDEX IF NOT EXISTS waitlist_created_at_idx 
    ON public.waitlist (created_at DESC);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

-- 5. Row Level Security Policies
-- Allow anonymous (and authenticated) users to INSERT into waitlist
DROP POLICY IF EXISTS "Allow anonymous waitlist insert" ON public.waitlist;
CREATE POLICY "Allow anonymous waitlist insert"
    ON public.waitlist
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- Explicitly restrict direct SELECT, UPDATE, and DELETE from anonymous users.
-- Only the service_role (used by Edge Functions / Admin backend) can query or mutate records directly.
DROP POLICY IF EXISTS "Service role has full access" ON public.waitlist;
CREATE POLICY "Service role has full access"
    ON public.waitlist
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- 6. Secure RPC function to return total waitlist count to public clients without leaking subscriber emails
CREATE OR REPLACE FUNCTION public.get_waitlist_count()
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT count(*)::integer FROM public.waitlist;
$$;

GRANT EXECUTE ON FUNCTION public.get_waitlist_count() TO anon, authenticated, service_role;

-- Secure RPC function to return recent signup first names for the public activity ticker
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

-- 7. Enable Supabase Realtime for waitlist table idempotently
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'waitlist'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.waitlist;
  END IF;
END $$;

-- 8. Add documentation comments
COMMENT ON TABLE public.waitlist IS 'GraceGrid pre-launch early access waitlist registrations';
COMMENT ON COLUMN public.waitlist.id IS 'Unique identifier (UUID v4)';
COMMENT ON COLUMN public.waitlist.full_name IS 'Subscriber full name';
COMMENT ON COLUMN public.waitlist.email IS 'Unique subscriber email address (normalized to lower case)';
COMMENT ON COLUMN public.waitlist.role IS 'Subscriber church/community role (e.g., believer, leader, group, student)';
COMMENT ON COLUMN public.waitlist.created_at IS 'UTC timestamp when the user joined the waitlist';
COMMENT ON FUNCTION public.get_waitlist_count() IS 'Returns total subscriber count safely for the Community Progress section';
