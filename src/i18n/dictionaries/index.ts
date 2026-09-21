import type { Locale } from "../config";
import type { Dictionary } from "./types";
import { fr } from "./fr";
import { en } from "./en";

const dictionaries: Record<Locale, Dictionary> = { fr, en };

/**
 * Point d'entrée unique pour charger les traductions d'une page. Server
 * Components uniquement (pas de fetch client) — cohérent avec le choix
 * "pas de state client superflu" du reste du projet.
 */
export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}
