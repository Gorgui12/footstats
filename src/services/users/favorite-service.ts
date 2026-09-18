import { repositories } from "@/db/repositories";
import { FavoriteEntityType } from "@/domain/football/enums";
import type { UserFavorite } from "@/domain/users/types";

export async function addFavorite(
  userId: string,
  entityType: FavoriteEntityType,
  entityId: string,
): Promise<void> {
  const favorite: UserFavorite = {
    id: `${userId}:${entityType}:${entityId}`,
    userId,
    entityType,
    entityId,
    createdAt: new Date().toISOString(),
  };
  await repositories.favorites.add(favorite);
}

export async function removeFavorite(
  userId: string,
  entityType: FavoriteEntityType,
  entityId: string,
): Promise<void> {
  await repositories.favorites.remove(userId, entityType, entityId);
}

export async function isFavorite(
  userId: string | null,
  entityType: FavoriteEntityType,
  entityId: string,
): Promise<boolean> {
  if (!userId) return false;
  return repositories.favorites.isFavorite(userId, entityType, entityId);
}

export async function listFavorites(userId: string): Promise<UserFavorite[]> {
  return repositories.favorites.listByUser(userId);
}

export async function listFavoriteIdsByType(
  userId: string,
  entityType: FavoriteEntityType,
): Promise<string[]> {
  const favorites = await listFavorites(userId);
  return favorites.filter((f) => f.entityType === entityType).map((f) => f.entityId);
}
