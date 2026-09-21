/**
 * Nom du cookie léger d'identité utilisateur. Partagé entre le middleware
 * (qui le pose) et les services serveur (qui le lisent) pour éviter de
 * faire dépendre le code serveur du module `middleware.ts` (edge runtime).
 */
export const USER_COOKIE_NAME = "fs_uid";

/**
 * Pays d'affichage préféré (fuseau horaire des heures de match affichées,
 * mise en avant de compétitions locales — brief §17, Niveau 4). Distinct
 * de la langue (locale d'URL) : un utilisateur peut lire le site en
 * anglais tout en préférant l'heure du Sénégal, par exemple.
 */
export const COUNTRY_COOKIE_NAME = "fs_country";
