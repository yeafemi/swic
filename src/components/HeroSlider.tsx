import { useState, useEffect, useCallback } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Play, HandHeart, ChevronLeft, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

import heroSlide1 from "@/assets/hero-slide-1.png";
import heroSlide2 from "@/assets/hero-slide-2.png";
import heroSlide3 from "@/assets/hero-slide-3.png";
import heroSlide4 from "@/assets/hero-slide-4.png";

interface SlideData {
  image_url: string;
  alt: string;
  subtitle: string;
  title: string;
  description: string;
}

const STATIC_SLIDES: SlideData[] = [
  {
    image_url: "/src/assets/hero-slide-1.png",
    alt: "Vibrant worship with hands raised in praise",
    subtitle: "Welcome Home",
    title: "Raising an army of **soul winners** for the nations.",
    description: "A vibrant youth church in North Legon — preaching Christ, teaching the Word, and demonstrating the power of the Holy Ghost.",
  },
  {
    image_url: "/src/assets/hero-slide-2.png",
    alt: "Pastor preaching the Word with passion",
    subtitle: "The Word of God",
    title: "The Word is a **lamp** unto our feet.",
    description: "Every service is an encounter — rich in biblical teaching, prophetic insight, and the transformative power of the gospel.",
  },
  {
    image_url: "/src/assets/hero-slide-3.png",
    alt: "Youth united in fervent prayer",
    subtitle: "Prayer & Fellowship",
    title: "A community built on **faith** and family.",
    description: "We are a church that prays without ceasing — every gathering is soaked in the presence and power of the Holy Spirit.",
  },
  {
    image_url: "/src/assets/hero-slide-4.png",
    alt: "Joyful choir singing praises to God",
    subtitle: "Praise & Worship",
    title: "Lifting His name with **joy** and glory.",
    description: "Our worship is alive and Spirit-filled — a sound that draws heaven down and ignites the fire of God in every heart.",
  },
];

const resolveImage = (imageUrl: string) => {
  if (imageUrl === "/src/assets/hero-slide-1.png") return heroSlide1;
  if (imageUrl === "/src/assets/hero-slide-2.png") return heroSlide2;
  if (imageUrl === "/src/assets/hero-slide-3.png") return heroSlide3;
  if (imageUrl === "/src/assets/hero-slide-4.png") return heroSlide4;
  return imageUrl;
};

const renderTitle = (title: string) => {
  if (!title) return "";
  const parts = title.split(/\*\*(.*?)\*\*/g);
  return parts.map((part, i) => {
    if (i % 2 === 1) {
      return <span key={i} className="text-gold">{part}</span>;
    }
    return part;
  });
};

const SLIDE_DURATION = 6000; // ms per slide

export function HeroSlider() {
  const [current, setCurrent] = useState(0);
  const [lastActive, setLastActive] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const { data: dbSlides } = useQuery({
    queryKey: ["hero-slides"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hero_slides")
        .select("*")
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const slides = dbSlides && dbSlides.length > 0 ? dbSlides : STATIC_SLIDES;

  const goTo = useCallback(
    (index: number) => {
      setLastActive(current);
      setCurrent(index);
      setProgress(0);
    },
    [current],
  );

  const next = useCallback(() => {
    goTo((current + 1) % slides.length);
  }, [current, goTo, slides.length]);

  const prev = useCallback(() => {
    goTo((current - 1 + slides.length) % slides.length);
  }, [current, goTo, slides.length]);

  // Auto-advance timer
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          next();
          return 0;
        }
        return p + 100 / (SLIDE_DURATION / 50);
      });
    }, 50);
    return () => clearInterval(interval);
  }, [isPaused, next]);

  return (
    <section
      id="hero-slider"
      className="relative min-h-[100svh] flex items-center overflow-hidden bg-black"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background slides with crossfade + Ken Burns */}
      {slides.map((slide, i) => {
        const isActive = i === current;
        const isPrev = i === lastActive;
        return (
          <div
            key={i}
            className="absolute inset-0 -z-10 transition-opacity duration-1000 ease-in-out will-change-opacity"
            style={{
              opacity: isActive || isPrev ? 1 : 0,
              zIndex: isActive ? 2 : isPrev ? 1 : 0,
              transform: "translateZ(0)",
            }}
            aria-hidden={!isActive}
          >
            <img
              src={resolveImage(slide.image_url)}
              alt={slide.alt || "Soul Winners International Church Hero Slide"}
              className="h-full w-full object-cover"
              width={1920}
              height={1080}
              style={{
                animation:
                  isActive ? "heroKenBurns 10s ease-in-out forwards" : "none",
              }}
            />
            {/* Gradient overlays */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/50 to-black/95" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-transparent to-transparent" />
          </div>
        );
      })}

      {/* Content */}
      <div className="container-prose text-white pt-20 pb-36 md:py-32 relative z-10">
        <div className="max-w-3xl -translate-y-14 md:translate-y-0">
          <div className="transition-all duration-1000 ease-out will-change-opacity will-change-transform backface-hidden">
            {/* Subtitle / Eyebrow */}
            {slides[current]?.subtitle && (
              <span className="inline-block text-xs md:text-sm font-semibold tracking-widest text-gold uppercase mb-3">
                {slides[current].subtitle}
              </span>
            )}

            {/* Title */}
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold leading-[1.02]">
              {renderTitle(slides[current]?.title || "")}
            </h1>

            {/* Description */}
            <p className="mt-6 text-lg md:text-xl text-white/85 max-w-2xl leading-relaxed">
              {slides[current]?.description}
            </p>

            {/* CTA buttons */}
            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                to="/live"
                className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-7 py-3.5 font-semibold hover:scale-105 active:scale-98 hover:shadow-[0_10px_25px_rgba(175,22,15,0.35)] transition-all duration-300 shadow-elegant"
              >
                <Play className="h-4 w-4" /> Watch Live
              </Link>
              <Link
                to="/prayer"
                className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/25 text-white backdrop-blur px-7 py-3.5 font-semibold hover:bg-white/20 hover:scale-105 active:scale-98 transition-all duration-300"
              >
                <HandHeart className="h-4 w-4" /> Send Prayer Request
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation arrows */}
      <button
        onClick={prev}
        aria-label="Previous slide"
        className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-20 h-12 w-12 rounded-full bg-white/10 border border-white/20 backdrop-blur-md text-white hidden md:grid place-items-center hover:bg-white/25 hover:scale-110 active:scale-95 transition-all duration-300 cursor-pointer"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        onClick={next}
        aria-label="Next slide"
        className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-20 h-12 w-12 rounded-full bg-white/10 border border-white/20 backdrop-blur-md text-white hidden md:grid place-items-center hover:bg-white/25 hover:scale-110 active:scale-95 transition-all duration-300 cursor-pointer"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      {/* Slide indicators with progress */}
      <div className="absolute bottom-28 sm:bottom-24 left-1/2 -translate-x-1/2 z-20 hidden md:flex items-center gap-3">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            aria-label={`Go to slide ${i + 1}`}
            className="group relative h-1.5 rounded-full overflow-hidden transition-all duration-500 cursor-pointer"
            style={{ width: i === current ? 48 : 16 }}
          >
            {/* Background track */}
            <div className="absolute inset-0 bg-white/30 rounded-full" />
            {/* Progress fill */}
            <div
              className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-100 ease-linear"
              style={{
                width: i === current ? `${progress}%` : i < current ? "100%" : "0%",
                background:
                  "linear-gradient(90deg, rgba(175,22,15,1) 0%, rgba(220,174,82,1) 100%)",
              }}
            />
          </button>
        ))}
      </div>

      {/* Slide counter */}
      <div className="absolute bottom-28 sm:bottom-24 right-6 md:right-10 z-20 text-white/50 text-sm font-mono tracking-wider hidden md:block">
        <span className="text-white font-semibold">
          {String(current + 1).padStart(2, "0")}
        </span>
        <span className="mx-1">/</span>
        <span>{String(slides.length).padStart(2, "0")}</span>
      </div>
    </section>
  );
}
