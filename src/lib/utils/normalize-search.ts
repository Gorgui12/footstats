/**
 * Normalise une chaîne pour la recherche : minuscules, sans accents.
 * Permet à "Ligue 1 Senegal" de matcher "Ligue 1 Sénégal" (brief §26/29).
 */
export function normalizeForSearch(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}
