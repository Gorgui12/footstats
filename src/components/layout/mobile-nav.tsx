"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MAIN_NAVIGATION } from "@/config/navigation";
import { localizedHref, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/types";

/**
 * Navigation mobile en bas d'écran. Composant client : il lit le chemin
 * courant (usePathname) pour marquer l'élément actif et affiche chaque
 * entrée avec son icône (Lucide). Le reste du header reste un Server
 * Component.
 */
export function MobileNav({ locale, labels }: { locale: Locale; labels: Dictionary["nav"] }) {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex items-stretch justify-around border-t border-white/10 bg-pitch-950/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      {MAIN_NAVIGATION.map((item) => {
        const Icon = item.icon;
        const href = localizedHref(locale, item.href);
        const active = item.href === "/" ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={item.href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`flex flex-1 flex-col items-center gap-1 px-1 py-2 text-[10px] transition-colors active:text-brand-400 ${
              active ? "text-brand-400" : "text-white/60 hover:text-white"
            }`}
          >
            <Icon className="h-5 w-5" strokeWidth={active ? 2.25 : 1.75} />
            {labels[item.labelKey]}
          </Link>
        );
      })}
    </nav>
  );
}