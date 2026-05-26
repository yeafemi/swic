import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect } from "react";
import { Toaster } from "sonner";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { CursorTracker } from "@/components/CursorTracker";
import { FloatingSocials } from "@/components/FloatingSocials";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-primary">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">This page doesn't exist or has been moved.</p>
        <a href="/" className="mt-6 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">Go home</a>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">Please try again.</p>
        <button onClick={() => { router.invalidate(); reset(); }} className="mt-6 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">Try again</button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Soul Winners International Church — Raising an Army of Soul Winners" },
      { name: "description", content: "Soul Winners International Church (SWIC) is a vibrant youth church in North Legon, Ghana — preaching the Gospel, discipling believers, and impacting nations." },
      { name: "theme-color", content: "#af160f" },
      { property: "og:title", content: "Soul Winners International Church" },
      { property: "og:description", content: "The Word of God illuminating the world for the salvation of souls." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Raleway:wght@300;400;500;600;700;800;900&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isChromeless = pathname.startsWith("/admin") || pathname.startsWith("/auth");

  useEffect(() => {
    const blockClipboardAction = (event: Event) => {
      event.preventDefault();
    };

    document.addEventListener("copy", blockClipboardAction);
    document.addEventListener("cut", blockClipboardAction);
    document.addEventListener("selectstart", blockClipboardAction);

    return () => {
      document.removeEventListener("copy", blockClipboardAction);
      document.removeEventListener("cut", blockClipboardAction);
      document.removeEventListener("selectstart", blockClipboardAction);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {!isChromeless && <Navbar />}
      <main className={isChromeless ? "" : "min-h-screen"}>
        <Outlet />
      </main>
      {!isChromeless && <Footer />}
      {!isChromeless && <WhatsAppButton />}
      {!isChromeless && <FloatingSocials />}
      {!isChromeless && <CursorTracker />}
      <Toaster position="top-center" richColors />
    </QueryClientProvider>
  );
}
