import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isAdminRoute = createRouteMatcher(["/admin(.*)"]);
const isAdminLogin = createRouteMatcher(["/admin/login"]);

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/user(.*)",
  // Club Privé — toutes les pages membres (sauf la landing /club)
  "/club/deals(.*)",
  "/club/marques(.*)",
  "/club/categories(.*)",
  "/club/dashboard(.*)",
  "/club/onboarding(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  // Admin login page is public
  if (isAdminLogin(req)) return;

  // Admin routes redirect to dedicated admin login page when unauthenticated
  if (isAdminRoute(req)) {
    await auth.protect({ unauthenticatedUrl: "/admin/login" });
    return;
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
