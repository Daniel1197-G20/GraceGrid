-- Migration: 20260831000000_create_waitlist_table.sql
-- Description: Create waitlist table with RLS, constraints, public get_waitlist_count RPC, and Realtime publication for GraceGrid

CREATE TABLE IF NOT EXISTS public.waitlist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'believer',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),

    CONSTRAINT waitlist_full_name_length_check CHECK (char_length(trim(full_name)) >= 2),
    CONSTRAINT waitlist_email_format_check CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

CREATE UNIQUE INDEX IF NOT EXISTS waitlist_email_lower_uidx 
    ON public.waitlist (LOWER(TRIM(email)));

CREATE INDEX IF NOT EXISTS waitlist_created_at_idx 
    ON public.waitlist (created_at DESC);

ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anonymous waitlist insert" ON public.waitlist;
CREATE POLICY "Allow anonymous waitlist insert"
    ON public.waitlist
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Service role has full access" ON public.waitlist;
CREATE POLICY "Service role has full access"
    ON public.waitlist
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.get_waitlist_count()
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT count(*)::integer FROM public.waitlist;
$$;

GRANT EXECUTE ON FUNCTION public.get_waitlist_count() TO anon, authenticated, service_role;

-- Enable Realtime publication for waitlist table
ALTER PUBLICATION supabase_realtime ADD TABLE public.waitlist;
