import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHero } from "@/components/PageHero";
import { SITE, SERVICES, SERMONS } from "@/lib/site-data";
import { supabase } from "@/integrations/supabase/client";
import { Youtube, Video, Calendar } from "lucide-react";

export const Route = createFileRoute("/live")({
  head: () => ({
    meta: [
      { title: "Live Stream - SWIC" },
      { name: "description", content: "Watch SWIC services live on YouTube and Zoom. Past streams available on demand." },
    ],
  }),
  component: Live,
});

function Live() {
  const { data } = useQuery({
    queryKey: ["live-stream-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("live_stream_settings").select("*").eq("id", true).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const embedUrl = data?.embed_url ?? "https://www.youtube.com/embed/live_stream?channel=UCsoulwinnersic";
  const youtubeUrl = data?.youtube_url ?? SITE.livestream;
  const zoomUrl = data?.zoom_url ?? SITE.zoom;

  return (
    <>
      <PageHero
        eyebrow={data?.is_live ? "Live Now" : "Live Stream"}
        title={data?.title ?? "Worship with us - anywhere."}
        subtitle={data?.description ?? "Join our services live wherever you are in the world."}
      />

      <section className="py-16">
        <div className="container-prose">
          <div className="aspect-video bg-ink rounded-2xl overflow-hidden shadow-elegant mb-10">
            <iframe
              src={embedUrl}
              className="w-full h-full"
              allowFullScreen
              title="SWIC Live"
            />
          </div>

          <div className="grid md:grid-cols-3 gap-4 mb-14">
            <a href={youtubeUrl} target="_blank" rel="noreferrer" className="p-6 rounded-2xl border bg-card hover:border-primary hover:shadow-elegant transition-all">
              <Youtube className="h-7 w-7 text-primary mb-3" />
              <div className="font-bold">YouTube</div>
              <div className="text-xs text-muted-foreground mt-1">@soulwinnersic</div>
            </a>
            <a href={zoomUrl} target="_blank" rel="noreferrer" className="p-6 rounded-2xl border bg-card hover:border-primary hover:shadow-elegant transition-all">
              <Video className="h-7 w-7 text-primary mb-3" />
              <div className="font-bold">Join via Zoom</div>
              <div className="text-xs text-muted-foreground mt-1">Tap to open meeting</div>
            </a>
            <div className="p-6 rounded-2xl border bg-card">
              <Calendar className="h-7 w-7 text-primary mb-3" />
              <div className="font-bold">Schedule</div>
              <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                {data?.schedule_note
                  ? <li>{data.schedule_note}</li>
                  : SERVICES.map((s) => <li key={s.name}>{s.day} - {s.time}</li>)}
              </ul>
            </div>
          </div>

          <h2 className="text-2xl md:text-3xl font-bold mb-6">Past streams</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {SERMONS.map((s) => (
              <article key={s.id} className="bg-card rounded-2xl overflow-hidden border">
                <div className="aspect-video bg-ink relative">
                  <iframe src={s.youtube} className="absolute inset-0 w-full h-full" allowFullScreen title={s.title} />
                </div>
                <div className="p-5">
                  <div className="text-xs text-primary font-semibold uppercase tracking-wider">{s.date}</div>
                  <div className="font-bold mt-1">{s.title}</div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
