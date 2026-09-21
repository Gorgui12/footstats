"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { SUPPORTED_LOCALES, type Locale } from "@/i18n/config";
import { cn } from "@/lib/utils/cn";

/**
 * Seul composant client de la navigation — nécessaire pour lire le chemin
 * courant (usePathname) et reconstruire le même chemin sous l'autre
 * langue. Le reste du header reste un Server Component.
 */
export function LocaleSwitcher({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const segments = pathname.split("/");
  // segments[0] === "" (chemin commence par /), segments[1] === locale actuelle
  const pathWithoutLocale = "/" + segments.slice(2).join("/");

  return (
    <div className="flex items-center gap-1 text-xs">
      {SUPPORTED_LOCALES.map((l) => (
        <Link
          key={l}
          href={`/${l}${pathWithoutLocale === "/" ? "" : pathWithoutLocale}`}
          className={cn(
            "rounded-full px-2 py-1 uppercase tracking-wide",
            l === locale ? "bg-brand-500/20 text-brand-300" : "text-white/50 hover:text-white",
          )}
        >
          {l}
        </Link>
      ))}
    </div>
  );
}
