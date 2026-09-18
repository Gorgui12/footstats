"use server";

import { revalidatePath } from "next/cache";
import { getOrCreateCurrentUser } from "@/services/users/current-user-service";
import { addFavorite, removeFavorite } from "@/services/users/favorite-service";
import { FavoriteEntityType } from "@/domain/football/enums";

function isValidEntityType(value: FormDataEntryValue | null): value is FavoriteEntityType {
  return value === FavoriteEntityType.TEAM || value === FavoriteEntityType.PLAYER || value === FavoriteEntityType.COMPETITION;
}

export async function toggleFavoriteAction(formData: FormData): Promise<void> {
  const user = await getOrCreateCurrentUser();
  if (!user) return;

  const entityTypeRaw = formData.get("entityType");
  const entityId = formData.get("entityId");
  const wasFavorite = formData.get("isFavorite") === "true";
  const redirectPath = formData.get("redirectPath");

  if (!isValidEntityType(entityTypeRaw) || typeof entityId !== "string") return;

  if (wasFavorite) {
    await removeFavorite(user.id, entityTypeRaw, entityId);
  } else {
    await addFavorite(user.id, entityTypeRaw, entityId);
  }

  if (typeof redirectPath === "string" && redirectPath.length > 0) {
    revalidatePath(redirectPath);
  }
  revalidatePath("/");
  revalidatePath("/favoris");
}
