CREATE TABLE IF NOT EXISTS public.live_stream_settings (
  id boolean PRIMARY KEY DEFAULT true CHECK (id = true),
  title text NOT NULL DEFAULT 'SWIC Live',
  description text,
  embed_url text NOT NULL DEFAULT 'https://www.youtube.com/embed/live_stream?channel=UCsoulwinnersic',
  youtube_url text,
  zoom_url text,
  schedule_note text,
  is_live boolean NOT NULL DEFAULT false,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.live_stream_settings (id)
VALUES (true)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.live_stream_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Live stream publicly viewable"
  ON public.live_stream_settings
  FOR SELECT
  USING (is_published = true);

CREATE POLICY "Live stream editable by content roles"
  ON public.live_stream_settings
  FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin')
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'editor')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'super_admin')
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'editor')
  );

CREATE TRIGGER update_live_stream_settings_updated_at
  BEFORE UPDATE ON public.live_stream_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email text,
  action text NOT NULL,
  table_name text NOT NULL,
  record_id text,
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins view audit logs"
  ON public.audit_logs
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE OR REPLACE FUNCTION public.current_admin_role()
RETURNS public.app_role
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT CASE
    WHEN public.has_role(auth.uid(), 'super_admin') THEN 'super_admin'::public.app_role
    WHEN public.has_role(auth.uid(), 'admin') THEN 'admin'::public.app_role
    WHEN public.has_role(auth.uid(), 'editor') THEN 'editor'::public.app_role
    ELSE NULL::public.app_role
  END
$$;

CREATE OR REPLACE FUNCTION public.can_edit_content()
RETURNS boolean
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.current_admin_role() IN ('super_admin', 'admin', 'editor')
$$;

CREATE OR REPLACE FUNCTION public.can_delete_content()
RETURNS boolean
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.current_admin_role() = 'super_admin'
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.current_admin_role() = 'super_admin'
$$;

CREATE OR REPLACE FUNCTION public.audit_row_change()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  affected_id text;
BEGIN
  IF TG_OP = 'DELETE' THEN
    affected_id := OLD.id::text;
  ELSE
    affected_id := NEW.id::text;
  END IF;

  INSERT INTO public.audit_logs (
    user_id,
    user_email,
    action,
    table_name,
    record_id,
    old_data,
    new_data
  )
  VALUES (
    auth.uid(),
    (SELECT email FROM public.profiles WHERE id = auth.uid()),
    lower(TG_OP),
    TG_TABLE_NAME,
    affected_id,
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END
  );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.attach_audit_trigger(_table regclass)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  EXECUTE format('DROP TRIGGER IF EXISTS audit_%s_changes ON %s', replace(_table::text, '.', '_'), _table);
  EXECUTE format(
    'CREATE TRIGGER audit_%s_changes AFTER INSERT OR UPDATE OR DELETE ON %s FOR EACH ROW EXECUTE FUNCTION public.audit_row_change()',
    replace(_table::text, '.', '_'),
    _table
  );
END;
$$;

SELECT public.attach_audit_trigger('public.sermons');
SELECT public.attach_audit_trigger('public.events');
SELECT public.attach_audit_trigger('public.gallery_images');
SELECT public.attach_audit_trigger('public.leaders');
SELECT public.attach_audit_trigger('public.ministries');
SELECT public.attach_audit_trigger('public.live_stream_settings');
SELECT public.attach_audit_trigger('public.prayer_requests');
SELECT public.attach_audit_trigger('public.contact_messages');
SELECT public.attach_audit_trigger('public.newsletter_subscribers');
SELECT public.attach_audit_trigger('public.user_roles');
SELECT public.attach_audit_trigger('public.profiles');

DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;

CREATE POLICY "Content roles view roles"
  ON public.user_roles
  FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id
    OR public.has_role(auth.uid(), 'super_admin')
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Super admins manage roles"
  ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

DROP POLICY IF EXISTS "Admins manage sermons" ON public.sermons;
CREATE POLICY "Content roles view sermons"
  ON public.sermons FOR SELECT TO authenticated USING (public.can_edit_content());
CREATE POLICY "Content roles insert sermons"
  ON public.sermons FOR INSERT TO authenticated WITH CHECK (public.can_edit_content());
CREATE POLICY "Content roles update sermons"
  ON public.sermons FOR UPDATE TO authenticated USING (public.can_edit_content()) WITH CHECK (public.can_edit_content());
CREATE POLICY "Super admins delete sermons"
  ON public.sermons FOR DELETE TO authenticated USING (public.can_delete_content());

DROP POLICY IF EXISTS "Admins manage events" ON public.events;
CREATE POLICY "Content roles view events"
  ON public.events FOR SELECT TO authenticated USING (public.can_edit_content());
CREATE POLICY "Content roles insert events"
  ON public.events FOR INSERT TO authenticated WITH CHECK (public.can_edit_content());
CREATE POLICY "Content roles update events"
  ON public.events FOR UPDATE TO authenticated USING (public.can_edit_content()) WITH CHECK (public.can_edit_content());
CREATE POLICY "Super admins delete events"
  ON public.events FOR DELETE TO authenticated USING (public.can_delete_content());

DROP POLICY IF EXISTS "Admins manage gallery" ON public.gallery_images;
CREATE POLICY "Content roles view gallery"
  ON public.gallery_images FOR SELECT TO authenticated USING (public.can_edit_content());
CREATE POLICY "Content roles insert gallery"
  ON public.gallery_images FOR INSERT TO authenticated WITH CHECK (public.can_edit_content());
CREATE POLICY "Content roles update gallery"
  ON public.gallery_images FOR UPDATE TO authenticated USING (public.can_edit_content()) WITH CHECK (public.can_edit_content());
CREATE POLICY "Super admins delete gallery"
  ON public.gallery_images FOR DELETE TO authenticated USING (public.can_delete_content());

DROP POLICY IF EXISTS "Admins manage leaders" ON public.leaders;
CREATE POLICY "Admins view leaders"
  ON public.leaders FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins insert leaders"
  ON public.leaders FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update leaders"
  ON public.leaders FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Super admins delete leaders"
  ON public.leaders FOR DELETE TO authenticated USING (public.can_delete_content());

DROP POLICY IF EXISTS "Admins manage ministries" ON public.ministries;
CREATE POLICY "Admins view ministries"
  ON public.ministries FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins insert ministries"
  ON public.ministries FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update ministries"
  ON public.ministries FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Super admins delete ministries"
  ON public.ministries FOR DELETE TO authenticated USING (public.can_delete_content());

DROP POLICY IF EXISTS "Admins can view prayer requests" ON public.prayer_requests;
DROP POLICY IF EXISTS "Admins can update prayer requests" ON public.prayer_requests;
DROP POLICY IF EXISTS "Admins can delete prayer requests" ON public.prayer_requests;
CREATE POLICY "Admins view prayer requests"
  ON public.prayer_requests FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update prayer requests"
  ON public.prayer_requests FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Super admins delete prayer requests"
  ON public.prayer_requests FOR DELETE TO authenticated USING (public.can_delete_content());

DROP POLICY IF EXISTS "Admins can view contact messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Admins can update contact messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Admins can delete contact messages" ON public.contact_messages;
CREATE POLICY "Admins view contact messages"
  ON public.contact_messages FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update contact messages"
  ON public.contact_messages FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Super admins delete contact messages"
  ON public.contact_messages FOR DELETE TO authenticated USING (public.can_delete_content());

DROP POLICY IF EXISTS "Admins can view subscribers" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "Admins can delete subscribers" ON public.newsletter_subscribers;
CREATE POLICY "Admins view subscribers"
  ON public.newsletter_subscribers FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Super admins delete subscribers"
  ON public.newsletter_subscribers FOR DELETE TO authenticated USING (public.can_delete_content());

INSERT INTO public.user_roles (user_id, role)
SELECT user_id, 'super_admin'::public.app_role
FROM public.user_roles
WHERE role = 'admin'
ON CONFLICT (user_id, role) DO NOTHING;
