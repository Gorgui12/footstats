import { getActiveNotificationChannels } from "@/config/notification-channels";
import type { NotificationMessage } from "./notification-channel.interface";
import { featureFlags } from "@/config/feature-flags";

/**
 * Point d'entrée unique pour déclencher une notification. Respecte le
 * feature flag global ENABLE_NOTIFICATIONS — désactivé, rien n'est envoyé,
 * quel que soit le canal. Les préférences fines (match_start, goal...) se
 * vérifient en amont, côté appelant, via notification-preference-service.
 */
export async function dispatchNotification(message: NotificationMessage): Promise<void> {
  if (!featureFlags.ENABLE_NOTIFICATIONS) return;
  const channels = getActiveNotificationChannels();
  await Promise.all(channels.map((channel) => channel.send(message)));
}
