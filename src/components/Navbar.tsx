import { Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { BookOpen, ChevronDown, Menu, Radio, UsersRound, X } from "lucide-react";
import logo from "@/assets/swic-logo.jpg";

const links = [
  {
    to: "/about",
    label: "About",
    children: [{ to: "/ministries", label: "Ministries", Icon: UsersRound }],
  },
  {
    label: "Multimedia",
    children: [
      { to: "/sermons", label: "Sermons", Icon: BookOpen },
      { to: "/live", label: "Live", Icon: Radio },
    ],
  },
  { to: "/events", label: "Events" },
  { to: "/gallery", label: "Gallery" },
  { to: "/contact", label: "Contact" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-background/90 backdrop-blur-md shadow-soft border-b" : "bg-transparent"
      }`}
    >
      <div className="container-prose grid grid-cols-[1fr_auto_1fr] items-center h-16 md:h-20">
        <Link to="/" className="flex items-center gap-2.5 group">
          <img src={logo} alt="SWIC logo" className="h-10 w-10 rounded-full object-cover ring-2 ring-primary/20" />
          <div className="leading-tight">
            <div className={`font-bold text-sm md:text-base ${scrolled ? "text-foreground" : "text-white"}`}>SOUL WINNERS</div>
            <div className={`text-[10px] md:text-xs tracking-[0.18em] ${scrolled ? "text-muted-foreground" : "text-white/80"}`}>INTERNATIONAL CHURCH</div>
          </div>
        </Link>

        <nav className="hidden lg:flex items-center justify-center gap-7">
          {links.map((l) => {
            const isDropdownOpen = activeDropdown === l.label;

            return (
            <div
              key={l.label}
              className="relative group"
              onMouseEnter={() => l.children && setActiveDropdown(l.label)}
              onMouseLeave={() => l.children && setActiveDropdown(null)}
              onFocus={() => l.children && setActiveDropdown(l.label)}
              onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                  setActiveDropdown(null);
                }
              }}
            >
              {"to" in l ? (
                <Link
                  to={l.to}
                  className={`inline-flex items-center gap-1 text-sm font-medium transition-colors hover:text-primary ${
                    scrolled ? "text-foreground/80" : "text-white/90"
                  }`}
                  activeProps={{ className: "text-primary" }}
                >
                  {l.label}
                  {l.children ? (
                    <ChevronDown
                      className={`h-3.5 w-3.5 transition-transform duration-300 ${isDropdownOpen ? "rotate-180" : ""}`}
                    />
                  ) : null}
                </Link>
              ) : (
                <button
                  type="button"
                  aria-expanded={isDropdownOpen}
                  onClick={() => setActiveDropdown(isDropdownOpen ? null : l.label)}
                  onKeyDown={(event) => {
                    if (event.key === "Escape") {
                      setActiveDropdown(null);
                    }
                  }}
                  className={`inline-flex items-center gap-1 text-sm font-medium transition-colors hover:text-primary ${
                    scrolled ? "text-foreground/80" : "text-white/90"
                  }`}
                >
                  {l.label}
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-300 ${isDropdownOpen ? "rotate-180" : ""}`} />
                </button>
              )}

              {l.children ? (
                <div
                  className="absolute left-1/2 top-full z-50 min-w-56 -translate-x-1/2 pt-4 transition-all duration-300 ease-out"
                  style={{
                    opacity: isDropdownOpen ? 1 : 0,
                    pointerEvents: isDropdownOpen ? "auto" : "none",
                    transform: `translateX(-50%) translateY(${isDropdownOpen ? "0" : "0.5rem"}) scale(${isDropdownOpen ? 1 : 0.95})`,
                    visibility: isDropdownOpen ? "visible" : "hidden",
                  }}
                >
                  <div className="relative overflow-hidden rounded-xl border border-white/15 bg-background/95 p-2 text-foreground shadow-[0_24px_70px_rgba(0,0,0,0.22)] ring-1 ring-primary/10 backdrop-blur-xl">
                    <div className="absolute -top-1 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-l border-t border-white/15 bg-background/95" />
                    {l.children.map((child, index) => (
                      <Link
                        key={child.to}
                        to={child.to}
                        className="group/item flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold text-foreground/75 transition-all duration-300 hover:bg-primary/10 hover:text-primary"
                        style={{
                          opacity: isDropdownOpen ? 1 : 0,
                          transform: `translateY(${isDropdownOpen ? "0" : "0.25rem"})`,
                          transitionDelay: `${index * 55}ms`,
                        }}
                        activeProps={{ className: "text-primary bg-primary/10" }}
                      >
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 text-primary transition-transform duration-300 group-hover/item:scale-110">
                          <child.Icon className="h-4 w-4" />
                        </span>
                        {child.label}
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
            );
          })}
        </nav>

        <div className="hidden lg:flex items-center justify-end gap-3">
          <Link
            to="/giving"
            className={`rounded-full border px-5 py-2.5 text-sm font-semibold transition ${
              scrolled
                ? "border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                : "border-white/70 text-white hover:bg-white hover:text-primary"
            }`}
          >
            Give
          </Link>
          <Link
            to="/prayer"
            className="rounded-full bg-primary text-primary-foreground px-5 py-2.5 text-sm font-semibold hover:opacity-90 transition shadow-elegant"
          >
            Prayer Request
          </Link>
        </div>

        <div className="flex items-center gap-2.5 lg:hidden justify-self-end col-start-3">
          <Link
            to="/giving"
            className={`rounded-full border px-4 py-1.5 text-xs font-bold tracking-wide transition ${
              scrolled
                ? "border-primary text-primary hover:bg-primary hover:text-primary-foreground bg-primary/5"
                : "border-white/80 text-white hover:bg-white hover:text-primary bg-white/5"
            }`}
          >
            Give
          </Link>
          <button
            onClick={() => setOpen(!open)}
            className={`p-1.5 rounded-md ${scrolled ? "text-foreground" : "text-white"}`}
            aria-label="Menu"
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="lg:hidden bg-background border-t shadow-soft">
          <nav className="container-prose flex flex-col py-4 gap-1">
            {links.map((l) => (
              <div key={l.label} className="border-b border-border/50 last:border-0">
                {"to" in l ? (
                  <Link
                    to={l.to}
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-between py-2.5 text-base text-foreground/80 hover:text-primary"
                    activeProps={{ className: "text-primary font-semibold" }}
                  >
                    {l.label}
                    {l.children ? <ChevronDown className="h-4 w-4" /> : null}
                  </Link>
                ) : (
                  <div className="flex items-center justify-between py-2.5 text-base font-medium text-foreground/80">
                    {l.label}
                    <ChevronDown className="h-4 w-4" />
                  </div>
                )}

                {l.children ? (
                  <div className="pb-2 pl-4">
                    {l.children.map((child) => (
                      <Link
                        key={child.to}
                        to={child.to}
                        onClick={() => setOpen(false)}
                        className="block py-2 text-sm text-foreground/70 hover:text-primary"
                        activeProps={{ className: "text-primary font-semibold" }}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
            <Link
              to="/giving"
              onClick={() => setOpen(false)}
              className="mt-3 rounded-full border border-primary px-5 py-3 text-center font-semibold text-primary"
            >
              Give
            </Link>
            <Link
              to="/prayer"
              onClick={() => setOpen(false)}
              className="rounded-full bg-primary text-primary-foreground px-5 py-3 text-center font-semibold"
            >
              Prayer Request
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
