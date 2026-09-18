/**
 * Génération de slugs SEO-friendly. Gère les accents et caractères spéciaux.
 * La résolution des collisions et des redirections (SlugRedirect, cf.
 * DATA_MODEL.md §6) se fait au niveau du repository, pas ici.
 */
export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // retire les accents
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function matchSlug(homeTeamName: string, awayTeamName: string): string {
  return `${slugify(homeTeamName)}-vs-${slugify(awayTeamName)}`;
}
