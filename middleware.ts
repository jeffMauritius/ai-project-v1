import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });
  const isAuthPage = request.nextUrl.pathname.startsWith("/auth");
  const isDashboardPage = request.nextUrl.pathname.startsWith("/dashboard");
  const isPartnerPage = request.nextUrl.pathname.startsWith("/partner");
  const isAdminPage = request.nextUrl.pathname.startsWith("/admin");

  // Si l'utilisateur est sur une page d'authentification et est déjà connecté
  if (isAuthPage && token) {
    // Rediriger vers la page appropriée en fonction du rôle
    if (token.role === "PARTNER") {
      return NextResponse.redirect(new URL("/partner-dashboard", request.url));
    } else if (token.role === "ADMIN") {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    } else {
      return NextResponse.redirect(new URL("/dashboard/planning", request.url));
    }
  }

  // Si l'utilisateur n'est pas connecté et essaie d'accéder à une page protégée
  if (!token && (isDashboardPage || isPartnerPage || isAdminPage)) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  // Si l'utilisateur est connecté mais essaie d'accéder à une page non autorisée
  if (token) {
    if (token.role === "USER" && (isPartnerPage || isAdminPage)) {
      return NextResponse.redirect(new URL("/dashboard/planning", request.url));
    }
    if (token.role === "PARTNER" && (isDashboardPage || isAdminPage)) {
      return NextResponse.redirect(new URL("/partner-dashboard", request.url));
    }
    if (token.role === "ADMIN" && (isDashboardPage || isPartnerPage)) {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/partner/:path*", "/admin/:path*", "/auth/:path*"],
};