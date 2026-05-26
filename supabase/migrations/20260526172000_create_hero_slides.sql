-- Create hero_slides table
CREATE TABLE IF NOT EXISTS public.hero_slides (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  image_url text NOT NULL,
  subtitle text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  alt text,
  display_order integer DEFAULT 0 NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.hero_slides ENABLE ROW LEVEL SECURITY;

-- Allow public read of hero slides
CREATE POLICY "Allow public read of slides" ON public.hero_slides FOR SELECT USING (true);

-- Allow content roles (editor, admin, super_admin) to view/manage hero slides
CREATE POLICY "Content roles view slides" ON public.hero_slides FOR SELECT TO authenticated USING (public.can_edit_content());
CREATE POLICY "Content roles insert slides" ON public.hero_slides FOR INSERT TO authenticated WITH CHECK (public.can_edit_content());
CREATE POLICY "Content roles update slides" ON public.hero_slides FOR UPDATE TO authenticated USING (public.can_edit_content()) WITH CHECK (public.can_edit_content());
CREATE POLICY "Super admins delete slides" ON public.hero_slides FOR DELETE TO authenticated USING (public.can_delete_content());

-- Trigger to automatically update updated_at timestamp
DROP TRIGGER IF EXISTS update_hero_slides_updated_at ON public.hero_slides;
CREATE TRIGGER update_hero_slides_updated_at
  BEFORE UPDATE ON public.hero_slides
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Attach audit trigger to log any changes
SELECT public.attach_audit_trigger('public.hero_slides');

-- Seed the initial 4 slides with static data to keep look consistent with current state
INSERT INTO public.hero_slides (image_url, subtitle, title, description, alt, display_order)
VALUES 
  ('/src/assets/hero-slide-1.png', 'Welcome Home', 'Raising an army of **soul winners** for the nations.', 'A vibrant youth church in North Legon — preaching Christ, teaching the Word, and demonstrating the power of the Holy Ghost.', 'Vibrant worship with hands raised in praise', 0),
  ('/src/assets/hero-slide-2.png', 'The Word of God', 'The Word is a **lamp** unto our feet.', 'Every service is an encounter — rich in biblical teaching, prophetic insight, and the transformative power of the gospel.', 'Pastor preaching the Word with passion', 1),
  ('/src/assets/hero-slide-3.png', 'Prayer & Fellowship', 'A community built on **faith** and family.', 'We are a church that prays without ceasing — every gathering is soaked in the presence and power of the Holy Spirit.', 'Youth united in fervent prayer', 2),
  ('/src/assets/hero-slide-4.png', 'Praise & Worship', 'Lifting His name with **joy** and glory.', 'Our worship is alive and Spirit-filled — a sound that draws heaven down and ignites the fire of God in every heart.', 'Joyful choir singing praises to God', 3)
ON CONFLICT DO NOTHING;
