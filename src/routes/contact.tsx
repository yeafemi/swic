import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHero } from "@/components/PageHero";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SITE } from "@/lib/site-data";
import { MapPin, Phone, Mail, Clock } from "lucide-react";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — SWIC" },
      { name: "description", content: "Get in touch with Soul Winners International Church. Visit us at Camp Elim Africa, North Legon." },
    ],
  }),
  component: Contact,
});

function Contact() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.message.length < 5) return toast.error("Please write a longer message.");
    setLoading(true);
    const { error } = await supabase.from("contact_messages").insert(form);
    setLoading(false);
    if (error) toast.error("Could not send. Please try again.");
    else {
      toast.success("Message sent! We'll get back to you shortly.");
      setForm({ name: "", email: "", subject: "", message: "" });
    }
  };

  return (
    <>
      <PageHero eyebrow="Contact" title="We'd love to hear from you." subtitle="Visit, call, write or send us a message. We respond within 24 hours." />

      <section className="py-16">
        <div className="container-prose grid lg:grid-cols-5 gap-10">
          <div className="lg:col-span-2 space-y-6">
            <Info icon={<MapPin />} title="Visit" lines={[SITE.address]} />
            <Info icon={<Phone />} title="Call" lines={SITE.phones} />
            <Info icon={<Mail />} title="Email" lines={[SITE.email]} />
            <Info icon={<Clock />} title="Office Hours" lines={[SITE.officeHours]} />
            <div className="aspect-video rounded-2xl overflow-hidden border">
              <iframe
                title="Map"
                src="https://maps.google.com/maps?q=North%20Legon%2C%20Accra&t=&z=13&ie=UTF8&iwloc=&output=embed"
                className="w-full h-full"
                loading="lazy"
              />
            </div>
          </div>

          <form onSubmit={submit} className="lg:col-span-3 bg-card border rounded-2xl p-8 shadow-soft space-y-4">
            <h2 className="text-2xl font-bold mb-2">Send us a message</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Your Name" required value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
              <Field label="Email" type="email" required value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
            </div>
            <Field label="Subject" value={form.subject} onChange={(v) => setForm({ ...form, subject: v })} />
            <div>
              <label className="text-sm font-medium">Message *</label>
              <textarea
                required
                rows={6}
                maxLength={2000}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="mt-1.5 w-full rounded-lg border bg-background px-4 py-3 outline-none focus:border-primary"
              />
            </div>
            <button disabled={loading} className="w-full rounded-full bg-primary text-primary-foreground py-3.5 font-semibold hover:opacity-90 disabled:opacity-50 transition shadow-elegant">
              {loading ? "Sending..." : "Send Message"}
            </button>
          </form>
        </div>
      </section>
    </>
  );
}

function Info({ icon, title, lines }: { icon: React.ReactNode; title: string; lines: string[] }) {
  return (
    <div className="flex gap-4 bg-card border rounded-xl p-5">
      <div className="h-11 w-11 rounded-lg gradient-red text-white grid place-items-center shrink-0">{icon}</div>
      <div>
        <div className="text-xs tracking-wider uppercase text-primary font-bold">{title}</div>
        {lines.map((l) => <div key={l} className="text-sm text-foreground/85">{l}</div>)}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", required }: { label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean }) {
  return (
    <div>
      <label className="text-sm font-medium">{label}{required && " *"}</label>
      <input
        type={type}
        required={required}
        value={value}
        maxLength={255}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 w-full rounded-lg border bg-background px-4 py-3 outline-none focus:border-primary"
      />
    </div>
  );
}
