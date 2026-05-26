import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { PageHero } from "@/components/PageHero";
import { SERMONS } from "@/lib/site-data";
import { Search, Play } from "lucide-react";

export const Route = createFileRoute("/sermons")({
  head: () => ({
    meta: [
      { title: "Sermons & Messages — SWIC" },
      { name: "description", content: "Be inspired and strengthened through powerful messages from the Word of God preached at Soul Winners International Church." },
    ],
  }),
  component: Sermons,
});

function Sermons() {
  const [q, setQ] = useState("");
  const [speaker, setSpeaker] = useState("all");

  const speakers = useMemo(() => ["all", ...new Set(SERMONS.map((s) => s.speaker))], []);
  const filtered = SERMONS.filter(
    (s) =>
      (speaker === "all" || s.speaker === speaker) &&
      (s.title.toLowerCase().includes(q.toLowerCase()) || s.description.toLowerCase().includes(q.toLowerCase()))
  );

  return (
    <>
      <PageHero eyebrow="Sermons" title="Sermons & messages." subtitle="Be inspired and strengthened through powerful messages from the Word of God." />

      <section className="py-12">
        <div className="container-prose">
          <div className="flex flex-col md:flex-row gap-3 mb-10">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search sermons..."
                className="w-full pl-11 pr-4 py-3 rounded-full border bg-card focus:border-primary outline-none"
              />
            </div>
            <select value={speaker} onChange={(e) => setSpeaker(e.target.value)} className="px-5 py-3 rounded-full border bg-card focus:border-primary outline-none">
              {speakers.map((s) => <option key={s} value={s}>{s === "all" ? "All speakers" : s}</option>)}
            </select>
          </div>

          {filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">No sermons match your search.</p>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((s) => (
                <article key={s.id} className="bg-card rounded-2xl overflow-hidden border hover:shadow-elegant transition-all">
                  <div className="aspect-video bg-ink relative">
                    <iframe src={s.youtube} className="absolute inset-0 w-full h-full" allowFullScreen title={s.title} />
                  </div>
                  <div className="p-6">
                    <div className="text-xs text-primary font-semibold tracking-wider uppercase">{s.date}</div>
                    <h3 className="mt-2 text-xl font-bold">{s.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{s.speaker}</p>
                    <p className="mt-3 text-sm text-muted-foreground line-clamp-3">{s.description}</p>
                    <a href={s.link} target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-2 text-primary font-semibold text-sm">
                      <Play className="h-4 w-4" /> Watch / Listen
                    </a>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
