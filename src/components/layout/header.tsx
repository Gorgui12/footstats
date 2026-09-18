import Link from "next/link";
import { MAIN_NAVIGATION } from "@/config/navigation";

export function Header() {
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
            <Link key={item.href} href={item.href} className="text-sm text-white/70 hover:text-white">
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

      {/* Navigation mobile simple, en bas d'écran */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t border-white/10 bg-pitch-950/95 py-2 backdrop-blur md:hidden">
        {MAIN_NAVIGATION.map((item) => (
          <Link key={item.href} href={item.href} className="px-3 py-1 text-xs text-white/70">
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
