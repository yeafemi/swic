import { useEffect, useRef, useState } from "react";

/** Ambient Gradient Spotlight Follower.
 * Refined to be more radiant and clearly visible on the light website theme.
 * Uses a slightly smaller radius, lower blur, and higher color opacity to create a distinct,
 * gorgeous glowing warm orb that trails smoothly behind the cursor.
 */
export function CursorTracker() {
  const glowRef = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(hover: none)").matches) return;
    setEnabled(true);

    let mx = window.innerWidth / 2, my = window.innerHeight / 2;
    let rx = mx, ry = my;
    let raf = 0;

    const onMove = (e: MouseEvent) => {
      mx = e.clientX;
      my = e.clientY;
    };

    const tick = () => {
      // Smooth tracking interpolation (lag effect)
      rx += (mx - rx) * 0.09;
      ry += (my - ry) * 0.09;
      if (glowRef.current) {
        // Offset by 150px to perfectly center the 300px spotlight on the pointer coordinates
        glowRef.current.style.transform = `translate3d(${rx - 150}px, ${ry - 150}px, 0)`;
      }
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener("mousemove", onMove);
    raf = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  if (!enabled) return null;

  return (
    <div
      ref={glowRef}
      aria-hidden
      className="pointer-events-none fixed top-0 left-0 z-[35] h-[300px] w-[300px] rounded-full bg-gradient-to-tr from-primary/20 via-gold/15 to-transparent blur-[60px] opacity-100 dark:opacity-70 transition-opacity duration-500"
    />
  );
}
