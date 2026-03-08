import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

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
