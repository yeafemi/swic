import { Instagram, Youtube, Send } from "lucide-react";
import { SITE } from "@/lib/site-data";

const ITEMS = [
  { href: SITE.socials.instagram, label: "Instagram", Icon: Instagram, color: "#E1306C" },
  { href: SITE.socials.youtube, label: "YouTube", Icon: Youtube, color: "#FF0000" },
  { href: SITE.socials.telegram, label: "Telegram", Icon: Send, color: "#229ED9" },
  {
    href: SITE.socials.tiktok,
    label: "TikTok",
    color: "#000000",
    glowColor: "#25F4EE",
    Icon: (props: React.SVGProps<SVGSVGElement>) => (
      <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43V8.74a8.16 8.16 0 0 0 4.77 1.52V6.85a4.85 4.85 0 0 1-1.84-.16z"/>
      </svg>
    ),
  },
];

export function FloatingSocials() {
  return (
    <div className="fixed right-3 md:right-4 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-2.5 md:gap-4 p-1">
      {ITEMS.map(({ href, label, Icon, color, glowColor }, index) => {
        const haloColor = glowColor || color;
        return (
          /* Staggered float wrapper for each individual social button */
          <div
            key={label}
            className="animate-float"
            style={{
              animationDelay: `${index * 250}ms`,
            }}
          >
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              aria-label={label}
              className="group relative h-8 w-8 md:h-11 md:w-11 rounded-full border border-white/20 text-white shadow-[0_8px_24px_rgba(0,0,0,0.18)] hover:shadow-[0_0_20px_var(--glow-color)] transition-all duration-500 ease-out grid place-items-center hover:scale-120 active:scale-95"
              style={{
                backgroundColor: color,
                "--glow-color": `${haloColor}66`,
              } as React.CSSProperties}
            >
              <Icon
                className="transition-transform duration-700 ease-out group-hover:rotate-[360deg] group-hover:scale-110 shrink-0 w-3.5 h-3.5 md:w-4.5 md:h-4.5"
              />
            </a>
          </div>
        );
      })}
    </div>
  );
}
