/**
 * Nom du cookie léger d'identité utilisateur. Partagé entre le middleware
 * (qui le pose) et les services serveur (qui le lisent) pour éviter de
 * faire dépendre le code serveur du module `middleware.ts` (edge runtime).
 */
export const USER_COOKIE_NAME = "fs_uid";
