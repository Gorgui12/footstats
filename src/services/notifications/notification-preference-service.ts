import { repositories } from "@/db/repositories";
import { DEFAULT_NOTIFICATION_PREFERENCE, type NotificationPreference } from "@/domain/users/types";

export async function getNotificationPreference(userId: string): Promise<NotificationPreference> {
  const existing = await repositories.notificationPreferences.findByUserId(userId);
  if (existing) return existing;
  return { userId, ...DEFAULT_NOTIFICATION_PREFERENCE };
}

export async function updateNotificationPreference(
  userId: string,
  partial: Partial<Omit<NotificationPreference, "userId">>,
): Promise<void> {
  const current = await getNotificationPreference(userId);
  await repositories.notificationPreferences.upsert({ ...current, ...partial, userId });
}
