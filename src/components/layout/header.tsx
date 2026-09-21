import Link from "next/link";
import { MAIN_NAVIGATION } from "@/config/navigation";
import { localizedHref, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/types";
import { LocaleSwitcher } from "./locale-switcher";
import { CountrySwitcher } from "./country-switcher";
import { getPreferredCountryCode } from "@/services/users/country-preference-service";

export async function Header({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const preferredCountry = await getPreferredCountryCode();

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-pitch-950/90 backdrop-blur">
      <div className="container-app flex h-16 items-center justify-between gap-4">
        <Link href={localizedHref(locale, "/")} className="flex items-center gap-2 text-lg font-bold tracking-tight">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 text-pitch-950">
            ⚽
          </span>
          FootStats <span className="text-brand-400">Africa</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {MAIN_NAVIGATION.map((item) => (
            <Link key={item.href} href={localizedHref(locale, item.href)} className="text-sm text-white/70 hover:text-white">
              {dict.nav[item.labelKey]}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <CountrySwitcher currentCode={preferredCountry} redirectPath={localizedHref(locale, "/")} />
          <LocaleSwitcher locale={locale} />
          <Link
            href={localizedHref(locale, "/recherche")}
            className="rounded-full border border-white/15 px-4 py-1.5 text-sm text-white/80 hover:border-brand-500/50 hover:text-white"
          >
            {dict.common.search}
          </Link>
        </div>
      </div>

      {/* Navigation mobile simple, en bas d'écran */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t border-white/10 bg-pitch-950/95 py-2 backdrop-blur md:hidden">
        {MAIN_NAVIGATION.map((item) => (
          <Link key={item.href} href={localizedHref(locale, item.href)} className="px-3 py-1 text-xs text-white/70">
            {dict.nav[item.labelKey]}
          </Link>
        ))}
      </nav>
    </header>
  );
}
