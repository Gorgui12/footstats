"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MAIN_NAVIGATION } from "@/config/navigation";

export function Header() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/" ? pathname === href : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-pitch-950/90 backdrop-blur">
      <div className="container-app flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold tracking-tight">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 text-pitch-950">
            ⚽
          </span>
          FootStats <span className="text-brand-400">Africa</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {MAIN_NAVIGATION.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
              className={`text-sm hover:text-white ${
                isActive(item.href) ? "text-brand-400" : "text-white/70"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <Link
          href="/recherche"
          className="rounded-full border border-white/15 px-4 py-1.5 text-sm text-white/80 hover:border-brand-500/50 hover:text-white"
        >
          Rechercher
        </Link>
      </div>

      {/* Navigation mobile avec icônes, en bas d'écran */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex items-stretch justify-around border-t border-white/10 bg-pitch-950/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        {MAIN_NAVIGATION.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex flex-1 flex-col items-center gap-1 px-1 py-2 text-[10px] transition-colors active:text-brand-400 ${
                active ? "text-brand-400" : "text-white/60 hover:text-white"
              }`}
            >
              <Icon className="h-5 w-5" strokeWidth={active ? 2.25 : 1.75} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
