import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextFetchEvent, NextRequest } from "next/server";

const isAdminRoute = createRouteMatcher(["/admin(.*)"]);
const isAdminLogin = createRouteMatcher(["/admin/login"]);
// Dev-only routes — have their own NODE_ENV guard, no Clerk needed
const isDevOnlyRoute = createRouteMatcher([
  "/pixel-agents(.*)",
  "/api/admin/pixel-agents(.*)",
]);

const isMarketplaceInscription = createRouteMatcher(["/proprietaire/inscription(.*)"]);
const isMarketplaceConnexion = createRouteMatcher(["/proprietaire/connexion(.*)"]);
const isOldMarketplaceDashboard = createRouteMatcher(["/proprietaire/dashboard(.*)"]);

const isFormationRoute = createRouteMatcher(["/dashboard/formations(.*)"]);
const isProtectedRoute = createRouteMatcher([
  "/dashboard/vba(.*)",
  "/user(.*)",
]);

// Routes qui ont réellement besoin de Clerk côté serveur. Tout le reste
// (pages publiques SEO) ne doit JAMAIS passer par clerkMiddleware : en
// instance de développement, Clerk répond aux navigations sans cookie par
// un 307 handshake vers accounts.dev — invisible pour un humain, mais
// Googlebot le reçoit et classe toutes les pages en "Redirect error".
const needsClerk = createRouteMatcher([
  "/dashboard(.*)",
  "/user(.*)",
  "/admin(.*)",
  // /proprietaire tout court est une landing publique (dans le sitemap) —
  // seuls les sous-chemins (inscription, connexion, dashboard) passent par Clerk
  "/proprietaire/(.*)",
  "/formations(.*)",
  "/pixel-agents(.*)",
  "/api(.*)",
  "/trpc(.*)",
]);

// Old WordPress paths that no longer exist — return 410 Gone
const GONE_PREFIXES = [
  "/blogs/blogarticles",
  "/blogarticles/",
  "/events/",
  "/wp-content/",
  "/wp-",
  "/product-category/",
  "/checkout",
  "/galerie",
  "/author/",
  "/category/",
  "/club",
  // Article Sanity supprimé avec le Club (juillet 2026)
  "/articles/club-prive-vanzon-liste-attente",
];

function isGonePath(pathname: string): boolean {
  return GONE_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

// WordPress ghost URLs with query params (e.g. ?action=register) — 410 Gone
function isWordPressGhost(pathname: string, searchParams: string): boolean {
  if (pathname.startsWith("/blogs/") && searchParams.includes("action=register")) return true;
  if (pathname.startsWith("/blogs/category/")) return true;
  return false;
}

const clerkHandler = clerkMiddleware(async (auth, req) => {
  // Dev-only routes (pixel-agents) — pass through, they have their own NODE_ENV guard
  if (isDevOnlyRoute(req)) return NextResponse.next();

  // Admin login page is public
  if (isAdminLogin(req)) return NextResponse.next();

  // Admin routes redirect to dedicated admin login page when unauthenticated
  if (isAdminRoute(req)) {
    const { userId } = await auth();
    if (!userId) {
      const loginUrl = new URL("/admin/login", req.url);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // Old /proprietaire/dashboard → permanent redirect to /dashboard
  if (isOldMarketplaceDashboard(req)) {
    return NextResponse.redirect(new URL("/dashboard", req.url), 301);
  }

  // Marketplace — already signed in → skip connexion page → go to dashboard
  if (isMarketplaceConnexion(req)) {
    const { userId } = await auth();
    if (userId) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  }

  // Marketplace — inscription requires auth → redirect to connexion
  if (isMarketplaceInscription(req)) {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.redirect(new URL("/proprietaire/connexion", req.url));
    }
    return NextResponse.next();
  }

  // Formations — redirect to dedicated formation sign-up page
  if (isFormationRoute(req)) {
    const { userId } = await auth();
    if (!userId) {
      // Extract slug from /dashboard/formations/[slug]/...
      const slugMatch = req.nextUrl.pathname.match(/\/dashboard\/formations\/([^/]+)/);
      const slug = slugMatch?.[1] ?? "homologation-vasp";
      const inscriptionUrl = new URL(`/formations/${slug}/inscription`, req.url);
      return NextResponse.redirect(inscriptionUrl);
    }
    return NextResponse.next();
  }

  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export default function middleware(req: NextRequest, event: NextFetchEvent) {
  // Old WordPress URLs + /club — 410 Gone (tell Google to stop crawling)
  if (isGonePath(req.nextUrl.pathname)) {
    return new NextResponse("Gone", { status: 410 });
  }
  if (isWordPressGhost(req.nextUrl.pathname, req.nextUrl.search)) {
    return new NextResponse("Gone", { status: 410 });
  }

  // Pages publiques : ne jamais invoquer Clerk (cf. commentaire needsClerk)
  if (!needsClerk(req)) return NextResponse.next();

  return clerkHandler(req, event);
}

export const config = {
  matcher: [
    // Skip Next.js internals, static files, and SEO files (robots.txt, sitemap.xml)
    "/((?!_next|robots\\.txt|sitemap\\.xml|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
