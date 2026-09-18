"use server";

import { revalidatePath } from "next/cache";
import { getOrCreateCurrentUser } from "@/services/users/current-user-service";
import { updateNotificationPreference } from "@/services/notifications/notification-preference-service";

const TOGGLE_FIELDS = [
  "matchStart",
  "goal",
  "lineup",
  "matchEnd",
  "breakingNews",
  "favoriteEntityUpdates",
] as const;

export async function updateNotificationPreferenceAction(formData: FormData): Promise<void> {
  const user = await getOrCreateCurrentUser();
  if (!user) return;

  const partial: Partial<Record<(typeof TOGGLE_FIELDS)[number], boolean>> = {};
  for (const field of TOGGLE_FIELDS) {
    partial[field] = formData.get(field) === "on";
  }

  await updateNotificationPreference(user.id, partial);
  revalidatePath("/parametres/notifications");
}
