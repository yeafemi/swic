import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHero } from "@/components/PageHero";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { HandHeart } from "lucide-react";

export const Route = createFileRoute("/prayer")({
  head: () => ({
    meta: [
      { title: "Prayer Request — SWIC" },
      { name: "description", content: "Submit a prayer request. Our prayer team stands with you in faith." },
    ],
  }),
  component: Prayer,
});

function Prayer() {
  const [form, setForm] = useState({ name: "", email: "", request: "", is_anonymous: false });
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.request.trim().length < 5) return toast.error("Please share your prayer request.");
    setLoading(true);
    const { error } = await supabase.from("prayer_requests").insert({
      name: form.is_anonymous ? "Anonymous" : form.name,
      email: form.email || null,
      request: form.request,
      is_anonymous: form.is_anonymous,
    });
    setLoading(false);
    if (error) toast.error("Could not submit. Please try again.");
    else {
      toast.success("Your request has been received. We are praying with you.");
      setForm({ name: "", email: "", request: "", is_anonymous: false });
    }
  };

  return (
    <>
      <PageHero eyebrow="Prayer Request" title="We are praying with you." subtitle="Whatever you're facing — health, family, breakthrough, salvation — share it with us and our prayer team will stand with you in faith." />

      <section className="py-16">
        <div className="container-prose max-w-2xl">
          <form onSubmit={submit} className="bg-card border rounded-2xl p-8 shadow-soft space-y-5">
            <div className="flex items-center gap-3 text-primary mb-2">
              <HandHeart className="h-6 w-6" />
              <span className="font-bold">"The effective, fervent prayer of a righteous man avails much." — James 5:16</span>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.is_anonymous}
                onChange={(e) => setForm({ ...form, is_anonymous: e.target.checked })}
                className="h-4 w-4"
              />
              Submit anonymously
            </label>

            {!form.is_anonymous && (
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Your Name *</label>
                  <input required maxLength={100} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1.5 w-full rounded-lg border bg-background px-4 py-3 outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="text-sm font-medium">Email (optional)</label>
                  <input type="email" maxLength={255} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1.5 w-full rounded-lg border bg-background px-4 py-3 outline-none focus:border-primary" />
                </div>
              </div>
            )}

            <div>
              <label className="text-sm font-medium">Your Prayer Request *</label>
              <textarea required rows={7} maxLength={3000} value={form.request} onChange={(e) => setForm({ ...form, request: e.target.value })} className="mt-1.5 w-full rounded-lg border bg-background px-4 py-3 outline-none focus:border-primary" placeholder="Share what's on your heart..." />
            </div>

            <button disabled={loading} className="w-full rounded-full bg-primary text-primary-foreground py-3.5 font-semibold hover:opacity-90 disabled:opacity-50 transition shadow-elegant">
              {loading ? "Submitting..." : "Submit Prayer Request"}
            </button>
            <p className="text-xs text-muted-foreground text-center">Your request is kept strictly confidential within our prayer team.</p>
          </form>
        </div>
      </section>
    </>
  );
}
