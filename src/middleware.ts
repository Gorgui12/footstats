import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { USER_COOKIE_NAME } from "@/config/auth";
import { DEFAULT_LOCALE, SUPPORTED_LOCALES, isSupportedLocale } from "@/i18n/config";

const LOCALE_COOKIE_NAME = "fs_locale";

function detectLocale(request: NextRequest): string {
  const cookieLocale = request.cookies.get(LOCALE_COOKIE_NAME)?.value;
  if (cookieLocale && isSupportedLocale(cookieLocale)) return cookieLocale;

  const acceptLanguage = request.headers.get("accept-language");
  if (acceptLanguage) {
    const preferred = acceptLanguage.split(",")[0]?.split("-")[0];
    if (preferred && isSupportedLocale(preferred)) return preferred;
  }

  return DEFAULT_LOCALE;
}

/**
 * Deux responsabilités combinées :
 * 1. Routage par langue (brief §18, Niveau 4) : redirige toute URL sans
 *    préfixe de langue vers `/{locale}{path}`, où la langue est déduite du
 *    cookie `fs_locale`, sinon de l'en-tête Accept-Language, sinon du
 *    français par défaut.
 * 2. Compte utilisateur léger (Niveau 2) : pose le cookie `fs_uid` au
 *    premier passage — voir services/users/current-user-service.ts.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const pathnameHasLocale = SUPPORTED_LOCALES.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  );

  let response: NextResponse;

  if (!pathnameHasLocale) {
    const locale = detectLocale(request);
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
    response = NextResponse.redirect(url);
  } else {
    response = NextResponse.next();
    // Garde le cookie de langue synchronisé avec l'URL réellement visitée,
    // pour que le prochain lien "sans préfixe" (ex. /manifest.json → non
    // concerné, mais un futur lien externe) retombe sur la bonne langue.
    const currentLocale = pathname.split("/")[1];
    if (currentLocale && isSupportedLocale(currentLocale)) {
      response.cookies.set(LOCALE_COOKIE_NAME, currentLocale, {
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 365,
        path: "/",
      });
    }
  }

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
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|icons|sitemap.xml|robots.txt).*)",
  ],
};
