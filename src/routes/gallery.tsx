import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageHero } from "@/components/PageHero";
import { supabase } from "@/integrations/supabase/client";
import hero from "@/assets/hero-worship.jpg";
import bible from "@/assets/bible-light.jpg";
import pastor from "@/assets/pastor-preaching.jpg";
import choir from "@/assets/choir.jpg";
import youth from "@/assets/youth-prayer.jpg";

export const Route = createFileRoute("/gallery")({
  head: () => ({
    meta: [
      { title: "Gallery — SWIC" },
      { name: "description", content: "Moments from our services, conferences, outreach and youth events." },
    ],
  }),
  component: Gallery,
});

const FALLBACK = [
  { id: "1", image_url: hero, category: "Services", title: "Sunday Worship" },
  { id: "2", image_url: choir, category: "Services", title: "Beautiful Feet Choir" },
  { id: "3", image_url: pastor, category: "Conferences", title: "Word Encounter" },
  { id: "4", image_url: youth, category: "Youth Events", title: "Youth Prayer" },
  { id: "5", image_url: bible, category: "Conferences", title: "The Word" },
  { id: "6", image_url: hero, category: "Outreach", title: "Campus Outreach" },
  { id: "7", image_url: youth, category: "Youth Events", title: "Tarry Prayer" },
  { id: "8", image_url: choir, category: "Services", title: "Praise & Worship" },
];

const CATS = ["All", "Services", "Conferences", "Outreach", "Youth Events"] as const;

type Img = { id: string; title: string | null; image_url: string; category: string };

function Gallery() {
  const [active, setActive] = useState<typeof CATS[number]>("All");
  const { data: db } = useQuery({
    queryKey: ["gallery"],
    queryFn: async () => {
      const { data, error } = await supabase.from("gallery_images").select("id,title,image_url,category").eq("is_published", true).order("created_at", { ascending: false });
      if (error) throw error;
      return data as Img[];
    },
  });

  const items: Img[] = db && db.length > 0 ? db : FALLBACK;
  const filtered = active === "All" ? items : items.filter((i) => i.category === active);

  return (
    <>
      <PageHero eyebrow="Gallery" title="Captured moments." subtitle="Glimpses of God's goodness in our gatherings and outreach." />
      <section className="py-12">
        <div className="container-prose">
          <div className="flex flex-wrap gap-2 mb-10 justify-center">
            {CATS.map((c) => (
              <button
                key={c}
                onClick={() => setActive(c)}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition ${
                  active === c ? "bg-primary text-primary-foreground shadow-elegant" : "bg-muted hover:bg-muted/70"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((it) => (
              <figure key={it.id} className="group relative aspect-[4/5] overflow-hidden rounded-2xl bg-muted">
                <img src={it.image_url} alt={it.title ?? ""} loading="lazy" className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <figcaption className="absolute inset-x-0 bottom-0 p-5 bg-gradient-to-t from-black/80 to-transparent text-white">
                  <div className="text-xs text-gold uppercase tracking-wider">{it.category}</div>
                  {it.title && <div className="font-semibold mt-0.5">{it.title}</div>}
                </figcaption>
              </figure>
            ))}
            {filtered.length === 0 && <p className="col-span-full text-center text-muted-foreground py-10">No images in this category yet.</p>}
          </div>
        </div>
      </section>
    </>
  );
}
