import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Play, HandHeart, Calendar, MapPin, Clock, Quote } from "lucide-react";
import hero from "@/assets/hero-worship.jpg";
import bible from "@/assets/bible-light.jpg";
import youth from "@/assets/youth-prayer.jpg";
import { SERVICES, SERMONS, EVENTS, TESTIMONIES, CORE_VALUES, SITE } from "@/lib/site-data";
import { ScrollReveal } from "@/components/ScrollReveal";
import { HeroSlider } from "@/components/HeroSlider";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Soul Winners International Church — North Legon, Ghana" },
      { name: "description", content: "Join SWIC for Sunday Word Encounter at 10am. A vibrant youth church raising soul winners for the nations." },
      { property: "og:title", content: "Soul Winners International Church" },
      { property: "og:description", content: "The Word of God illuminating the world for the salvation of souls." },
      { property: "og:image", content: hero },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <>
      {/* HERO SLIDER */}
      <section className="relative">
        <HeroSlider />

        {/* Service times bar */}
        <div className="absolute bottom-0 inset-x-0 bg-ink/90 backdrop-blur text-white border-t border-white/10 z-30">
          <div className="container-prose grid sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-white/10">
            {SERVICES.map((s) => (
              <div key={s.name} className="py-5 px-2 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full gradient-red grid place-items-center shrink-0">
                  <Clock className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-[10px] tracking-[0.2em] text-gold uppercase">{s.day}</div>
                  <div className="font-semibold text-sm">{s.name}</div>
                  <div className="text-xs text-white/60">{s.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WELCOME */}
      <section className="py-24 md:py-32 overflow-hidden">
        <div className="container-prose grid lg:grid-cols-2 gap-14 items-center">
          <ScrollReveal delay={100}>
            <div className="relative">
              <img src={bible} alt="Open Bible illuminated by light" loading="lazy" width={1600} height={1000} className="rounded-2xl shadow-elegant w-full" />
              <div className="absolute -bottom-6 -right-6 bg-primary text-primary-foreground p-6 rounded-2xl max-w-xs shadow-elegant hidden md:block hover:shadow-[0_12px_30px_rgba(175,22,15,0.3)] hover:-translate-y-1 transition-all duration-300">
                <Quote className="h-6 w-6 mb-2 opacity-70" />
                <p className="text-sm font-medium leading-relaxed">"Go ye into all the world, and preach the gospel to every creature."</p>
                <p className="text-xs mt-2 opacity-80">— Mark 16:15</p>
              </div>
            </div>
          </ScrollReveal>
          
          <ScrollReveal delay={250}>
            <div>
              <div className="text-xs tracking-[0.3em] text-primary uppercase font-bold mb-3">Welcome to SWIC</div>
              <h2 className="text-3xl md:text-5xl font-bold leading-tight">A house full of fire, faith and family.</h2>
              <p className="mt-6 text-muted-foreground leading-relaxed">
                What began as a fellowship of just two members on the Legon campus has grown — by the grace of God — into a thriving youth
                church passionately spreading the Gospel across university campuses in Ghana.
              </p>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Whether you're seeking God, searching for community, or hungry for the Word — there's a place for you here.
              </p>
              <Link to="/about" className="mt-8 inline-flex items-center gap-2 font-semibold text-primary hover:gap-3 transition-all">
                Discover Our Story <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* MISSION + VISION */}
      <section className="py-20 bg-muted/40 overflow-hidden">
        <div className="container-prose grid md:grid-cols-2 gap-6">
          <ScrollReveal delay={100} className="h-full">
            <div className="bg-card p-10 rounded-2xl border shadow-soft hover:shadow-elegant hover:-translate-y-1.5 transition-all duration-300 h-full">
              <div className="text-xs tracking-[0.3em] text-primary uppercase font-bold mb-3">Our Mission</div>
              <h3 className="text-2xl font-bold mb-4">An army of soul winners for the nations.</h3>
              <p className="text-muted-foreground leading-relaxed">
                Raising an army of soul winners who will go into all the nations of the world full of the Holy Ghost — preaching the gospel,
                teaching the word, and demonstrating the supernatural power of God in these last days.
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={250} className="h-full">
            <div className="gradient-red text-white p-10 rounded-2xl shadow-elegant hover:shadow-[0_15px_30px_rgba(175,22,15,0.25)] hover:-translate-y-1.5 transition-all duration-300 h-full">
              <div className="text-xs tracking-[0.3em] text-gold uppercase font-bold mb-3">Our Vision</div>
              <h3 className="text-2xl font-bold mb-4">Shake the nations by His power.</h3>
              <p className="text-white/85 leading-relaxed">
                To preach the gospel of our Lord Jesus Christ to every creature, to feed the nations with the Word of God, and to shake the
                nations with and by the power of the Holy Ghost.
              </p>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* CORE VALUES */}
      <section className="py-24 overflow-hidden">
        <div className="container-prose">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <div className="text-xs tracking-[0.3em] text-primary uppercase font-bold mb-3">Core Values</div>
            <h2 className="text-3xl md:text-5xl font-bold">What we live by.</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {CORE_VALUES.map((v, i) => (
              <ScrollReveal key={v} delay={i * 100}>
                <div className="group p-6 rounded-xl border bg-card hover:border-primary/35 hover:shadow-elegant hover:-translate-y-1.5 transition-all duration-300 h-full">
                  <div className="text-3xl font-black text-primary/20 group-hover:text-primary/60 transition-colors">{String(i + 1).padStart(2, "0")}</div>
                  <div className="mt-2 font-semibold">{v}</div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED SERMONS */}
      <section className="py-24 bg-muted/40 overflow-hidden">
        <div className="container-prose">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-12">
            <div>
              <div className="text-xs tracking-[0.3em] text-primary uppercase font-bold mb-3">Featured Sermons</div>
              <h2 className="text-3xl md:text-5xl font-bold">Latest messages.</h2>
            </div>
            <Link to="/sermons" className="text-primary font-semibold inline-flex items-center gap-2">All sermons <ArrowRight className="h-4 w-4" /></Link>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {SERMONS.map((s, i) => (
              <ScrollReveal key={s.id} delay={i * 150}>
                <article className="group bg-card rounded-2xl overflow-hidden border hover:border-primary/20 hover:shadow-elegant hover:-translate-y-2 transition-all duration-500 h-full flex flex-col">
                  <div className="aspect-video bg-ink relative overflow-hidden">
                    <iframe src={s.youtube} className="absolute inset-0 w-full h-full" allowFullScreen title={s.title} />
                  </div>
                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="text-xs text-primary font-semibold tracking-wider uppercase">{s.date}</div>
                      <h3 className="mt-2 text-xl font-bold group-hover:text-primary transition-colors">{s.title}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{s.speaker}</p>
                      <p className="mt-3 text-sm text-muted-foreground line-clamp-2">{s.description}</p>
                    </div>
                  </div>
                </article>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* UPCOMING EVENTS */}
      <section className="py-24 overflow-hidden">
        <div className="container-prose">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-12">
            <div>
              <div className="text-xs tracking-[0.3em] text-primary uppercase font-bold mb-3">Upcoming Events</div>
              <h2 className="text-3xl md:text-5xl font-bold">Don't miss out.</h2>
            </div>
            <Link to="/events" className="text-primary font-semibold inline-flex items-center gap-2">All events <ArrowRight className="h-4 w-4" /></Link>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {EVENTS.map((e, i) => (
              <ScrollReveal key={e.id} delay={i * 150}>
                <article className="group p-8 rounded-2xl border bg-card hover:border-primary/30 hover:shadow-elegant hover:-translate-y-2 transition-all duration-500 h-full flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                      <Calendar className="h-4 w-4" /> {e.date}
                    </div>
                    <h3 className="mt-3 text-2xl font-bold group-hover:text-primary transition-colors">{e.name}</h3>
                    <p className="mt-3 text-muted-foreground">{e.description}</p>
                  </div>
                  <div className="mt-5 flex flex-wrap gap-4 text-sm text-muted-foreground border-t pt-4">
                    <span className="inline-flex items-center gap-1.5"><Clock className="h-4 w-4" />{e.time}</span>
                    <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4" />{e.venue}</span>
                  </div>
                </article>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIES */}
      <section className="py-24 bg-ink text-white relative overflow-hidden">
        <div className="absolute inset-0 -z-10 opacity-20">
          <img src={youth} alt="" className="h-full w-full object-cover" />
        </div>
        <div className="container-prose">
          <div className="text-center mb-14">
            <div className="text-xs tracking-[0.3em] text-gold uppercase font-bold mb-3">Testimonies</div>
            <h2 className="text-3xl md:text-5xl font-bold">Lives changed forever.</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIES.map((t, i) => (
              <ScrollReveal key={t.name} delay={i * 150}>
                <blockquote className="bg-white/5 backdrop-blur border border-white/10 p-8 rounded-2xl hover:bg-white/10 hover:border-white/20 hover:-translate-y-1.5 transition-all duration-300 h-full">
                  <Quote className="h-7 w-7 text-gold mb-4" />
                  <p className="text-white/90 leading-relaxed">"{t.text}"</p>
                  <footer className="mt-5 text-sm text-gold font-semibold">— {t.name}</footer>
                </blockquote>
              </ScrollReveal>
            ))}
          </div>
          <p className="text-center mt-10 text-sm text-white/70">
            Have a testimony? Email us at <a href={`mailto:${SITE.testimoniesEmail}`} className="text-gold underline">{SITE.testimoniesEmail}</a>
          </p>
        </div>
      </section>

      {/* GIVING CTA */}
      <section className="py-24 overflow-hidden">
        <div className="container-prose">
          <ScrollReveal delay={100}>
            <div className="gradient-red text-white rounded-3xl p-12 md:p-16 text-center shadow-elegant relative overflow-hidden hover:shadow-[0_20px_40px_rgba(175,22,15,0.3)] hover:-translate-y-1 transition-all duration-500">
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_30%_20%,white,transparent_50%)]" />
              <div className="relative">
                <div className="text-xs tracking-[0.3em] text-gold uppercase font-bold mb-3">Online Giving</div>
                <h2 className="text-3xl md:text-5xl font-bold max-w-2xl mx-auto">"Give, and it will be given to you." — Luke 6:38</h2>
                <p className="mt-5 text-white/85 max-w-xl mx-auto">Partner with us to reach the nations with the Gospel and disciple a generation of soul winners.</p>
                <Link to="/giving" className="mt-8 inline-flex items-center gap-2 rounded-full bg-white text-primary px-8 py-3.5 font-bold hover:scale-105 active:scale-98 hover:shadow-lg transition-all duration-300">
                  Support the Ministry <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </>
  );
}
