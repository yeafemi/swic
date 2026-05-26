-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Allow public insert to site_visits" ON public.site_visits;
DROP POLICY IF EXISTS "Admins view site_visits" ON public.site_visits;

-- Create site_visits table
CREATE TABLE IF NOT EXISTS public.site_visits (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  visitor_id uuid NOT NULL,
  visited_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.site_visits ENABLE ROW LEVEL SECURITY;

-- Policy to allow anonymous/public users to insert new visit logs
CREATE POLICY "Allow public insert to site_visits" 
  ON public.site_visits 
  FOR INSERT 
  WITH CHECK (true);

-- Policy to allow admins, super admins, and editors to view site visit counts
CREATE POLICY "Admins view site_visits" 
  ON public.site_visits 
  FOR SELECT 
  TO authenticated 
  USING (
    public.has_role(auth.uid(), 'super_admin') 
    OR public.has_role(auth.uid(), 'admin') 
    OR public.has_role(auth.uid(), 'editor')
  );
