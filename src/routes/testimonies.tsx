import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHero } from "@/components/PageHero";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MessageSquareShare, Heart, Quote, Phone, Mail, User } from "lucide-react";
import { TESTIMONIES as STATIC_TESTIMONIES } from "@/lib/site-data";

export const Route = createFileRoute("/testimonies")({
  head: () => ({
    meta: [
      { title: "Testimonies — SWIC" },
      { name: "description", content: "Share what God has done in your life and read the inspiring stories of faith and breakthrough from our church family." },
    ],
  }),
  component: TestimoniesPage,
});

interface Testimony {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  text: string;
  created_at: string;
}

function TestimoniesPage() {
  const [form, setForm] = useState({ name: "", phone: "", email: "", text: "" });
  const [loading, setLoading] = useState(false);
  const [testimonies, setTestimonies] = useState<Testimony[]>([]);
  const [fetching, setFetching] = useState(true);

  const fetchPublishedTestimonies = async () => {
    try {
      const { data, error } = await supabase
        .from("testimonies")
        .select("*")
        .eq("is_published", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTestimonies(data || []);
    } catch (err) {
      console.error("Failed to load testimonies:", err);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchPublishedTestimonies();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.name.trim().length < 2) return toast.error("Please enter your full name.");
    if (form.phone.trim().length < 5) return toast.error("Please enter your contact number.");
    if (form.text.trim().length < 10) return toast.error("Please share a more detailed testimony.");

    setLoading(true);
    const { error } = await supabase.from("testimonies").insert({
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim() || null,
      text: form.text.trim(),
      is_published: false, // Must be approved by admin
    });
    setLoading(false);

    if (error) {
      toast.error("Could not submit your testimony. Please try again.");
    } else {
      toast.success("Thank you! Your testimony has been submitted and is pending review.");
      setForm({ name: "", phone: "", email: "", text: "" });
    }
  };

  return (
    <>
      <PageHero
        eyebrow="Testimonies"
        title="Share the Wonders of God."
        subtitle="Every breakthrough, healing, and answer to prayer is a reminder of God's unchanging goodness. Share your story to encourage and build the faith of others."
      />

      <section className="py-20 bg-muted/20">
        <div className="container-prose max-w-6xl grid lg:grid-cols-5 gap-12 items-start">
          
          {/* TESTIMONY SUBMISSION FORM */}
          <div className="lg:col-span-2">
            <div className="sticky top-28 bg-card border rounded-2xl p-6 sm:p-8 shadow-soft">
              <div className="flex items-center gap-3 text-primary mb-6">
                <MessageSquareShare className="h-6 w-6 text-primary shrink-0" />
                <h2 className="text-xl font-bold text-foreground">Submit Your Testimony</h2>
              </div>
              
              <p className="text-xs text-muted-foreground mb-6 leading-relaxed">
                Fill out the form below. Once approved by our pastoral team, your testimony will be published to inspire the church. Your phone and email will remain confidential.
              </p>

              <form onSubmit={submit} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-foreground/80 flex items-center gap-1.5 mb-1.5">
                    <User className="h-3.5 w-3.5 text-muted-foreground" /> Full Name *
                  </label>
                  <input
                    required
                    maxLength={100}
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Enter your name"
                    className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary transition"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground/80 flex items-center gap-1.5 mb-1.5">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground" /> Telephone *
                  </label>
                  <input
                    required
                    type="tel"
                    maxLength={30}
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="Enter your phone number"
                    className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary transition"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground/80 flex items-center gap-1.5 mb-1.5">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" /> Email (optional)
                  </label>
                  <input
                    type="email"
                    maxLength={255}
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="your@email.com"
                    className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary transition"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground/80 flex items-center gap-1.5 mb-1.5">
                    <Quote className="h-3.5 w-3.5 text-muted-foreground" /> Your Testimony *
                  </label>
                  <textarea
                    required
                    rows={6}
                    maxLength={3000}
                    value={form.text}
                    onChange={(e) => setForm({ ...form, text: e.target.value })}
                    placeholder="What has God done for you? Write it here..."
                    className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary transition resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 rounded-full bg-primary text-primary-foreground py-3 font-semibold hover:opacity-90 disabled:opacity-50 transition shadow-elegant flex items-center justify-center gap-2"
                >
                  {loading ? "Submitting..." : (
                    <>
                      <Heart className="h-4 w-4 fill-current" />
                      Submit Testimony
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* PUBLISHED TESTIMONIES LIST */}
          <div className="lg:col-span-3 space-y-6">
            <h2 className="text-2xl font-bold flex items-center gap-2.5 mb-8">
              <span>Stories of Faith</span>
              <span className="text-xs font-semibold bg-primary/10 text-primary px-3 py-1 rounded-full">
                {fetching ? "Loading..." : testimonies.length > 0 ? `${testimonies.length} Shared` : "3 Shared"}
              </span>
            </h2>

            {fetching ? (
              <div className="space-y-4">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="h-36 bg-card border rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : testimonies.length > 0 ? (
              <div className="space-y-6">
                {testimonies.map((t) => (
                  <div
                    key={t.id}
                    className="relative bg-card border rounded-2xl p-6 sm:p-8 shadow-soft hover:shadow-md transition duration-300"
                  >
                    <Quote className="absolute right-6 top-6 h-12 w-12 text-primary/5 select-none" />
                    <p className="text-foreground/90 text-sm leading-relaxed whitespace-pre-line italic mb-4">
                      "{t.text}"
                    </p>
                    <div className="flex items-center gap-2 border-t pt-4">
                      <div className="h-8 w-8 rounded-full bg-gold/10 text-gold flex items-center justify-center font-bold text-xs">
                        {t.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-foreground">{t.name}</h4>
                        <p className="text-[10px] text-muted-foreground">
                          {new Date(t.created_at).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Fallback to static site testimonies if database is empty */
              <div className="space-y-6">
                {STATIC_TESTIMONIES.map((t, idx) => (
                  <div
                    key={idx}
                    className="relative bg-card border rounded-2xl p-6 sm:p-8 shadow-soft hover:shadow-md transition duration-300"
                  >
                    <Quote className="absolute right-6 top-6 h-12 w-12 text-primary/5 select-none" />
                    <p className="text-foreground/90 text-sm leading-relaxed italic mb-4">
                      "{t.text}"
                    </p>
                    <div className="flex items-center gap-2 border-t pt-4">
                      <div className="h-8 w-8 rounded-full bg-gold/10 text-gold flex items-center justify-center font-bold text-xs">
                        {t.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-foreground">{t.name}</h4>
                        <p className="text-[10px] text-muted-foreground">SWIC Family Member</p>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="text-center py-8 bg-muted/10 border border-dashed rounded-xl mt-6 p-4">
                  <p className="text-xs text-muted-foreground">
                    No testimonies have been published dynamically yet. Be the first to share!
                  </p>
                </div>
              </div>
            )}
          </div>

        </div>
      </section>
    </>
  );
}
