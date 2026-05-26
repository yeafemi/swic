import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHero } from "@/components/PageHero";
import { MINISTRIES } from "@/lib/site-data";
import { supabase } from "@/integrations/supabase/client";
import { Users } from "lucide-react";

export const Route = createFileRoute("/ministries")({
  head: () => ({
    meta: [
      { title: "Ministries & Departments — SWIC" },
      { name: "description", content: "Find your place to serve at Soul Winners International Church — Choir, Media, Dance, Protocol, Precious Pearls and more." },
    ],
  }),
  component: Ministries,
});

type Ministry = { id: string; title: string; description: string | null; image_url: string | null };

function Ministries() {
  const { data: db } = useQuery({
    queryKey: ["ministries"],
    queryFn: async () => {
      const { data, error } = await supabase.from("ministries").select("id,title,description,image_url").eq("is_published", true).order("display_order");
      if (error) throw error;
      return data as Ministry[];
    },
  });

  const items = db && db.length > 0
    ? db
    : MINISTRIES.map((m, i) => ({ id: String(i), title: m.name, description: m.desc, image_url: null }));

  return (
    <>
      <PageHero eyebrow="Our Ministries" title="A place to grow, serve & thrive." subtitle="At SWIC we believe everyone has a place to grow, serve, and thrive spiritually." />
      <section className="py-20">
        <div className="container-prose grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((m, i) => (
            <article key={m.id} className="group rounded-2xl border bg-card hover:border-primary hover:shadow-elegant transition-all overflow-hidden animate-fade-up" style={{ animationDelay: `${i * 60}ms` }}>
              {m.image_url && <img src={m.image_url} alt={m.title} loading="lazy" className="h-44 w-full object-cover group-hover:scale-105 transition-transform duration-700" />}
              <div className="p-7">
                {!m.image_url && (
                  <div className="h-12 w-12 rounded-xl gradient-red text-white grid place-items-center mb-5 group-hover:scale-110 transition">
                    <Users className="h-5 w-5" />
                  </div>
                )}
                <h3 className="font-bold text-lg">{m.title}</h3>
                {m.description && <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{m.description}</p>}
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
