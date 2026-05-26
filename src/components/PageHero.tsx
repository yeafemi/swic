import bg from "@/assets/hero-worship.jpg";

export function PageHero({ eyebrow, title, subtitle }: { eyebrow?: string; title: string; subtitle?: string }) {
  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <img src={bg} alt="" className="h-full w-full object-cover opacity-30" />
        <div className="absolute inset-0 gradient-hero opacity-90" />
      </div>
      <div className="container-prose text-center text-white animate-fade-up">
        {eyebrow && <div className="text-xs tracking-[0.3em] text-gold font-semibold mb-4 uppercase">{eyebrow}</div>}
        <h1 className="text-4xl md:text-6xl font-bold leading-[1.05]">{title}</h1>
        {subtitle && <p className="mt-5 max-w-2xl mx-auto text-white/80 text-base md:text-lg">{subtitle}</p>}
      </div>
    </section>
  );
}
