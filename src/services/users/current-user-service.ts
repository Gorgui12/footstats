import { cookies } from "next/headers";
import { repositories } from "@/db/repositories";
import type { User } from "@/domain/users/types";
import { DEFAULT_COUNTRY_CODE } from "@/config/countries";
import { USER_COOKIE_NAME } from "@/config/auth";

/**
 * Résout l'utilisateur courant à partir du cookie léger posé par le
 * middleware. Crée paresseusement l'enregistrement `User` au premier
 * accès qui en a besoin (ex. premier ajout aux favoris) plutôt qu'à
 * chaque requête, pour ne pas peupler la table pour les simples visiteurs.
 */
export async function getCurrentUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(USER_COOKIE_NAME)?.value ?? null;
}

export async function getOrCreateCurrentUser(): Promise<User | null> {
  const userId = await getCurrentUserId();
  if (!userId) return null;

  const existing = await repositories.users.findById(userId);
  if (existing) return existing;

  const user: User = {
    id: userId,
    email: null,
    createdAt: new Date().toISOString(),
    preferredLanguage: "fr",
    preferredCountryId: DEFAULT_COUNTRY_CODE,
  };
  await repositories.users.upsert(user);
  return user;
}
