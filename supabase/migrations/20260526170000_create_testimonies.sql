-- Create testimonies table
CREATE TABLE IF NOT EXISTS public.testimonies (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  name text NOT NULL,
  phone text NOT NULL,
  email text,
  text text NOT NULL,
  is_published boolean DEFAULT false NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.testimonies ENABLE ROW LEVEL SECURITY;

-- Allow public insert (anyone can submit a testimony)
CREATE POLICY "Allow public insert" ON public.testimonies FOR INSERT WITH CHECK (true);

-- Allow public read of published testimonies only
CREATE POLICY "Allow public read of published" ON public.testimonies FOR SELECT USING (is_published = true);

-- Allow content roles (editor, admin, super_admin) to view all testimonies
CREATE POLICY "Content roles view testimonies"
  ON public.testimonies FOR SELECT TO authenticated
  USING (public.can_edit_content());

-- Allow content roles to insert testimonies
CREATE POLICY "Content roles insert testimonies"
  ON public.testimonies FOR INSERT TO authenticated
  WITH CHECK (public.can_edit_content());

-- Allow content roles to update testimonies (e.g. approve/unpublish)
CREATE POLICY "Content roles update testimonies"
  ON public.testimonies FOR UPDATE TO authenticated
  USING (public.can_edit_content())
  WITH CHECK (public.can_edit_content());

-- Allow super admins to delete testimonies
CREATE POLICY "Super admins delete testimonies"
  ON public.testimonies FOR DELETE TO authenticated
  USING (public.can_delete_content());

-- Trigger to automatically update updated_at timestamp
CREATE TRIGGER update_testimonies_updated_at
  BEFORE UPDATE ON public.testimonies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Attach audit trigger to log any changes
SELECT public.attach_audit_trigger('public.testimonies');
