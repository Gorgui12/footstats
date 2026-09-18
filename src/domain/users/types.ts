import type { FavoriteEntityType } from "@/domain/football/enums";

/**
 * Compte utilisateur "léger" pour le MVP Niveau 2 : pas de mot de passe, pas
 * d'email obligatoire. Un identifiant est attribué au premier passage
 * (cookie) et retrouve son profil aux visites suivantes — cf.
 * services/users/current-user-service.ts. Une vraie authentification
 * (email/mot de passe, OAuth) pourra être ajoutée plus tard sans changer ce
 * type ni les repositories (brief §72 — ne pas casser le futur).
 */
export interface User {
  id: string;
  email: string | null;
  createdAt: string;
  preferredLanguage: string;
  preferredCountryId: string;
}

export interface UserFavorite {
  id: string;
  userId: string;
  entityType: FavoriteEntityType;
  entityId: string;
  createdAt: string;
}

export interface NotificationPreference {
  userId: string;
  matchStart: boolean;
  goal: boolean;
  lineup: boolean;
  matchEnd: boolean;
  breakingNews: boolean;
  favoriteEntityUpdates: boolean;
}

export const DEFAULT_NOTIFICATION_PREFERENCE: Omit<NotificationPreference, "userId"> = {
  matchStart: true,
  goal: true,
  lineup: false,
  matchEnd: true,
  breakingNews: false,
  favoriteEntityUpdates: true,
};
