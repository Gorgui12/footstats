import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { USER_COOKIE_NAME } from "@/config/auth";

/**
 * Compte utilisateur "léger" (brief Niveau 2) : pas de formulaire
 * d'inscription. Un identifiant est déposé en cookie httpOnly au premier
 * passage et sert de clé pour les favoris/préférences de notification.
 * Le user "réel" (profil, préférences) est créé paresseusement côté
 * serveur — voir services/users/current-user-service.ts.
 */

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  if (!request.cookies.get(USER_COOKIE_NAME)) {
    response.cookies.set(USER_COOKIE_NAME, crypto.randomUUID(), {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
    });
  }

  return response;
}

export const config = {
  matcher: "/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|icons).*)",
};
