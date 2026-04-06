import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isAdminRoute = createRouteMatcher(["/admin(.*)"]);
const isAdminLogin = createRouteMatcher(["/admin/login"]);
// Dev-only routes — have their own NODE_ENV guard, no Clerk needed
const isDevOnlyRoute = createRouteMatcher([
  "/pixel-agents(.*)",
  "/api/admin/pixel-agents(.*)",
]);

const isMarketplaceInscription = createRouteMatcher(["/proprietaire/inscription(.*)"]);
const isMarketplaceConnexion = createRouteMatcher(["/proprietaire/connexion(.*)"]);
const isMarketplaceDashboard = createRouteMatcher(["/proprietaire/dashboard(.*)"]);

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/user(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
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

  // Marketplace — already signed in → skip connexion page → go to dashboard
  if (isMarketplaceConnexion(req)) {
    const { userId } = await auth();
    if (userId) {
      return NextResponse.redirect(new URL("/proprietaire/dashboard", req.url));
    }
    return NextResponse.next();
  }

  // Marketplace — dashboard requires auth → redirect to connexion
  if (isMarketplaceDashboard(req)) {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.redirect(new URL("/proprietaire/connexion", req.url));
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

  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
