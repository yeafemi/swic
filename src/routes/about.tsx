import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHero } from "@/components/PageHero";
import { BELIEFS, LEADERSHIP, CORE_VALUES } from "@/lib/site-data";
import { supabase } from "@/integrations/supabase/client";
import pastor from "@/assets/pastor-preaching.jpg";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About SWIC — Our Story, Beliefs & Leadership" },
      { name: "description", content: "Learn about Soul Winners International Church, our history under Pastor Jake Dimado, our beliefs, and our leadership team." },
      { property: "og:title", content: "About Soul Winners International Church" },
      { property: "og:description", content: "From a campus fellowship of two to a thriving youth church. This is our story." },
    ],
  }),
  component: About,
});

type Leader = { id: string; name: string; role: string; bio: string | null; photo_url: string | null };

function About() {
  const { data: dbLeaders } = useQuery({
    queryKey: ["leaders"],
    queryFn: async () => {
      const { data, error } = await supabase.from("leaders").select("id,name,role,bio,photo_url").eq("is_published", true).order("display_order");
      if (error) throw error;
      return data as Leader[];
    },
  });

  const leaders = dbLeaders && dbLeaders.length > 0
    ? dbLeaders
    : LEADERSHIP.map((l, i) => ({ id: String(i), name: l.name, role: l.role, bio: l.bio, photo_url: null }));

  return (
    <>
      <PageHero eyebrow="About SWIC" title="A church born to win souls." subtitle="What began with two members on the Legon campus is now a thriving youth church passionately pursuing the Great Commission." />

      <section className="py-20">
        <div className="container-prose grid lg:grid-cols-2 gap-14 items-center">
          <img src={pastor} alt="Pastor Jake Dimado preaching" loading="lazy" width={1200} height={1500} className="rounded-2xl shadow-elegant" />
          <div>
            <div className="text-xs tracking-[0.3em] text-primary uppercase font-bold mb-3">Our History</div>
            <h2 className="text-3xl md:text-4xl font-bold leading-tight">From two members to a movement.</h2>
            <p className="mt-5 text-muted-foreground leading-relaxed">
              Soul Winners International Church is a vibrant youth church under the leadership of Pastor Jake Dimado, committed to
              soul winning, discipleship, and raising believers for the work of ministry.
            </p>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              What began as a small fellowship on the Legon campus with just two members has, by the grace of God, grown into a thriving
              church with a seating capacity of 150–200 members — passionately pursuing the mandate of spreading the Gospel across
              university campuses in Ghana.
            </p>
            <blockquote className="mt-6 border-l-4 border-primary pl-5 italic text-foreground/80">
              "Go ye into all the world, and preach the gospel to every creature." — Mark 16:15
            </blockquote>
          </div>
        </div>
      </section>

      <section className="py-20 bg-muted/40">
        <div className="container-prose max-w-4xl">
          <div className="text-xs tracking-[0.3em] text-primary uppercase font-bold mb-3 text-center">Our Beliefs</div>
          <h2 className="text-3xl md:text-5xl font-bold text-center mb-12">What we stand on.</h2>
          <ul className="space-y-5">
            {BELIEFS.map((b, i) => (
              <li key={i} className="flex gap-5 bg-card p-6 rounded-xl border">
                <div className="h-10 w-10 rounded-full gradient-red text-white grid place-items-center font-bold shrink-0">{i + 1}</div>
                <p className="text-foreground/85 leading-relaxed pt-1.5">{b}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="py-20">
        <div className="container-prose">
          <div className="text-center mb-14">
            <div className="text-xs tracking-[0.3em] text-primary uppercase font-bold mb-3">Our Culture</div>
            <h2 className="text-3xl md:text-5xl font-bold">Core values that shape us.</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {CORE_VALUES.map((v, i) => (
              <div key={v} className="p-6 rounded-xl border bg-card">
                <div className="text-3xl font-black text-primary/30">{String(i + 1).padStart(2, "0")}</div>
                <div className="mt-2 font-semibold">{v}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-muted/40">
        <div className="container-prose">
          <div className="text-center mb-14">
            <div className="text-xs tracking-[0.3em] text-primary uppercase font-bold mb-3">Leadership</div>
            <h2 className="text-3xl md:text-5xl font-bold">Meet our leadership.</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {leaders.map((l) => (
              <div key={l.id} className="bg-card rounded-2xl border p-8 shadow-soft">
                {l.photo_url ? (
                  <img src={l.photo_url} alt={l.name} className="h-20 w-20 rounded-full object-cover mb-5" />
                ) : (
                  <div className="h-20 w-20 rounded-full gradient-red text-white grid place-items-center text-3xl font-bold mb-5">
                    {l.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                  </div>
                )}
                <h3 className="text-xl font-bold">{l.name}</h3>
                <p className="text-sm text-primary font-semibold mt-1">{l.role}</p>
                {l.bio && <p className="mt-4 text-sm text-muted-foreground leading-relaxed">{l.bio}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
