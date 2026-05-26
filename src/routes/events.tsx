import { createFileRoute } from "@tanstack/react-router";
import { PageHero } from "@/components/PageHero";
import { EVENTS, EVENTS_ONGOING } from "@/lib/site-data";
import { Calendar, Clock, MapPin } from "lucide-react";

export const Route = createFileRoute("/events")({
  head: () => ({
    meta: [
      { title: "Events — SWIC" },
      { name: "description", content: "Upcoming events, camps and services at Soul Winners International Church." },
    ],
  }),
  component: Events,
});

function Events() {
  return (
    <>
      <PageHero eyebrow="Events" title="Gather, encounter, grow." subtitle="Mark your calendar — there's always something stirring in the house of God." />

      <section className="py-16">
        <div className="container-prose">
          {EVENTS_ONGOING.length > 0 && (
            <>
              <div className="text-xs tracking-[0.3em] text-primary uppercase font-bold mb-4">Ongoing</div>
              <div className="grid gap-6 mb-16">
                {EVENTS_ONGOING.map((e) => (
                  <div key={e.name} className="gradient-red text-white rounded-2xl p-8 md:p-10 shadow-elegant relative overflow-hidden">
                    <div className="absolute top-4 right-4 inline-flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full text-xs font-semibold">
                      <span className="h-2 w-2 rounded-full bg-gold animate-pulse" /> LIVE NOW
                    </div>
                    <h2 className="text-3xl md:text-4xl font-bold">{e.name}</h2>
                    <p className="mt-4 text-white/85 max-w-2xl">{e.description}</p>
                    <div className="mt-6 flex flex-wrap gap-5 text-sm">
                      <span className="inline-flex items-center gap-2"><Calendar className="h-4 w-4" />{e.date}</span>
                      <span className="inline-flex items-center gap-2"><Clock className="h-4 w-4" />{e.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          <div className="text-xs tracking-[0.3em] text-primary uppercase font-bold mb-4">Upcoming</div>
          <div className="grid md:grid-cols-2 gap-6">
            {EVENTS.map((e) => (
              <article key={e.id} className="p-8 rounded-2xl border bg-card hover:border-primary hover:shadow-elegant transition-all">
                <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                  <Calendar className="h-4 w-4" /> {e.date}
                </div>
                <h3 className="mt-3 text-2xl font-bold">{e.name}</h3>
                <p className="mt-3 text-muted-foreground">{e.description}</p>
                <div className="mt-5 flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5"><Clock className="h-4 w-4" />{e.time}</span>
                  <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4" />{e.venue}</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
