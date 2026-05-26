-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Admins view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Super admins delete any profile" ON public.profiles;

-- Policy to allow admins and super admins to view all profiles
CREATE POLICY "Admins view all profiles" 
  ON public.profiles
  FOR SELECT 
  TO authenticated 
  USING (
    public.has_role(auth.uid(), 'super_admin') 
    OR public.has_role(auth.uid(), 'admin')
  );

-- Policy to allow admins and super admins to update any profile
CREATE POLICY "Admins update any profile" 
  ON public.profiles
  FOR UPDATE 
  TO authenticated 
  USING (
    public.has_role(auth.uid(), 'super_admin') 
    OR public.has_role(auth.uid(), 'admin')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'super_admin') 
    OR public.has_role(auth.uid(), 'admin')
  );

-- Policy to allow super admins to delete any profile
CREATE POLICY "Super admins delete any profile" 
  ON public.profiles
  FOR DELETE 
  TO authenticated 
  USING (
    public.has_role(auth.uid(), 'super_admin')
  );
