DROP POLICY IF EXISTS "Admins manage giving records" ON public.giving_records;

CREATE POLICY "Admins view giving records"
  ON public.giving_records
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update giving records"
  ON public.giving_records
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Super admins delete giving records"
  ON public.giving_records
  FOR DELETE TO authenticated
  USING (public.can_delete_content());

SELECT public.attach_audit_trigger('public.giving_records');
