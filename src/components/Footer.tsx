import { Link } from "@tanstack/react-router";
import { Instagram, Youtube, MessageCircle, Send, Mail, MapPin, Phone } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SITE, SERVICES } from "@/lib/site-data";
import logo from "@/assets/swic-logo.jpg";

export function Footer() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const subscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    const { error } = await supabase.from("newsletter_subscribers").insert({ email });
    setLoading(false);
    if (error) {
      if (error.code === "23505") toast.success("You're already subscribed — thank you!");
      else toast.error("Something went wrong. Please try again.");
    } else {
      toast.success("Subscribed! Welcome to the family.");
      setEmail("");
    }
  };

  return (
    <footer className="bg-ink text-white pt-20 pb-8 mt-20">
      <div className="container-prose grid gap-12 lg:grid-cols-4 md:grid-cols-2">
        <div className="lg:col-span-1">
          <div className="flex items-center gap-3 mb-5">
            <img src={logo} alt="SWIC" className="h-12 w-12 rounded-full" />
            <div className="leading-tight">
              <div className="font-bold">SOUL WINNERS</div>
              <div className="text-[10px] tracking-[0.18em] text-white/60">INTERNATIONAL CHURCH</div>
            </div>
          </div>
          <p className="text-sm text-white/70 leading-relaxed">{SITE.tagline}</p>
          <div className="flex gap-3 mt-6">
            <a href={SITE.socials.instagram} target="_blank" rel="noreferrer" className="h-9 w-9 rounded-full bg-white/10 hover:bg-primary grid place-items-center transition"><Instagram className="h-4 w-4" /></a>
            <a href={SITE.socials.youtube} target="_blank" rel="noreferrer" className="h-9 w-9 rounded-full bg-white/10 hover:bg-primary grid place-items-center transition"><Youtube className="h-4 w-4" /></a>
            <a href={SITE.socials.telegram} target="_blank" rel="noreferrer" className="h-9 w-9 rounded-full bg-white/10 hover:bg-primary grid place-items-center transition"><Send className="h-4 w-4" /></a>
            <a href={SITE.socials.whatsapp} target="_blank" rel="noreferrer" className="h-9 w-9 rounded-full bg-white/10 hover:bg-primary grid place-items-center transition"><MessageCircle className="h-4 w-4" /></a>
          </div>
        </div>

        <div>
          <h4 className="font-semibold mb-4 text-sm tracking-wider uppercase text-gold">Visit Us</h4>
          <ul className="space-y-3 text-sm text-white/75">
            <li className="flex gap-2"><MapPin className="h-4 w-4 mt-0.5 shrink-0 text-primary" />{SITE.address}</li>
            <li className="flex gap-2"><Phone className="h-4 w-4 mt-0.5 shrink-0 text-primary" />{SITE.phones.join(" · ")}</li>
            <li className="flex gap-2"><Mail className="h-4 w-4 mt-0.5 shrink-0 text-primary" />{SITE.email}</li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-4 text-sm tracking-wider uppercase text-gold">Services</h4>
          <ul className="space-y-2 text-sm text-white/75">
            {SERVICES.map((s) => (
              <li key={s.name}>
                <div className="font-medium text-white">{s.name}</div>
                <div className="text-xs">{s.day} · {s.time}</div>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-4 text-sm tracking-wider uppercase text-gold">Stay Connected</h4>
          <p className="text-sm text-white/70 mb-3">Get weekly devotionals and event updates.</p>
          <form onSubmit={subscribe} className="flex gap-2">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="flex-1 rounded-md bg-white/10 px-3 py-2 text-sm placeholder:text-white/40 outline-none focus:bg-white/15 border border-white/10"
            />
            <button disabled={loading} className="rounded-md bg-primary px-4 text-sm font-semibold hover:opacity-90 disabled:opacity-50">
              {loading ? "..." : "Join"}
            </button>
          </form>
          <div className="mt-6 text-xs text-white/50">
            <Link to="/faq" className="hover:text-white">FAQ</Link> · <Link to="/prayer" className="hover:text-white">Prayer</Link> · <Link to="/giving" className="hover:text-white">Give</Link>
          </div>
        </div>
      </div>

      <div className="container-prose mt-14 pt-6 border-t border-white/10 flex flex-col sm:flex-row justify-between gap-3 text-xs text-white/50">
        <p>© {new Date().getFullYear()} Soul Winners International Church. All rights reserved.</p>
        <p>“Go ye into all the world, and preach the gospel to every creature.” — Mark 16:15</p>
      </div>
    </footer>
  );
}
