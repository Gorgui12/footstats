import type { Metadata } from "next";
import Link from "next/link";
import { search } from "@/services/search/search-service";
import { EmptyState } from "@/components/ui/states";
import { buildMetadata } from "@/lib/seo";
import { SeoStatus } from "@/domain/football/enums";
import { isSupportedLocale, localizedHref, DEFAULT_LOCALE, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale: Locale = isSupportedLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;
  return buildMetadata({
    title: locale === "en" ? "Search" : "Recherche",
    description:
      locale === "en"
        ? "Search for a team, player, competition, or match on FootStats Africa."
        : "Recherchez une équipe, un joueur, une compétition ou un match sur FootStats Africa.",
    path: localizedHref(locale, "/recherche"),
    seoStatus: SeoStatus.NOINDEX,
  });
}

export default async function SearchPage({ params, searchParams }: PageProps) {
  const { locale: rawLocale } = await params;
  const locale: Locale = isSupportedLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;
  const dict = getDictionary(locale);
  const { q } = await searchParams;
  const query = q?.trim() ?? "";
  const results = query ? await search(query) : null;
  const hasResults =
    results &&
    (results.teams.length > 0 ||
      results.players.length > 0 ||
      results.competitions.length > 0 ||
      results.matches.length > 0);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">{dict.searchPage.title}</h1>

      <form method="get" className="flex gap-2">
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder={dict.searchPage.placeholder}
          className="w-full rounded-full border border-white/15 bg-pitch-900 px-4 py-2.5 text-sm outline-none focus:border-brand-500/60"
        />
        <button
          type="submit"
          className="rounded-full bg-brand-500 px-5 py-2.5 text-sm font-medium text-pitch-950 hover:bg-brand-600"
        >
          {dict.searchPage.submit}
        </button>
      </form>

      {!query && <EmptyState message={dict.searchPage.prompt} />}

      {query && !hasResults && <EmptyState message={`${dict.searchPage.noResults} « ${query} ».`} />}

      {results && results.teams.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white/60">{dict.searchPage.teams}</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {results.teams.map((t) => (
              <Link key={t.id} href={localizedHref(locale, `/equipes/${t.slug}`)} className="rounded-xl2 border border-white/10 bg-pitch-900/60 p-4 hover:border-brand-500/40">
                {t.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {results && results.players.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white/60">{dict.searchPage.players}</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {results.players.map((p) => (
              <Link key={p.id} href={localizedHref(locale, `/joueurs/${p.slug}`)} className="rounded-xl2 border border-white/10 bg-pitch-900/60 p-4 hover:border-brand-500/40">
                {p.fullName}
              </Link>
            ))}
          </div>
        </section>
      )}

      {results && results.competitions.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white/60">{dict.searchPage.competitions}</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {results.competitions.map((c) => (
              <Link key={c.id} href={localizedHref(locale, `/competitions/${c.slug}`)} className="rounded-xl2 border border-white/10 bg-pitch-900/60 p-4 hover:border-brand-500/40">
                {c.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {results && results.matches.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white/60">{dict.searchPage.matches}</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {results.matches.map((m) => (
              <Link key={m.id} href={localizedHref(locale, `/match/${m.slug}`)} className="rounded-xl2 border border-white/10 bg-pitch-900/60 p-4 hover:border-brand-500/40">
                {m.slug.replace(/-vs-/, " vs ")}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
