import { featureFlags } from "@/config/feature-flags";
import type { NotificationChannel } from "@/services/notifications/notification-channel.interface";
import { ConsoleNotificationChannel } from "@/services/notifications/channels/console-channel";
import { TelegramNotificationChannel } from "@/services/notifications/telegram/telegram-channel";

/**
 * Retourne les canaux actifs. Même principe que config/football-provider.ts :
 * un seul point de composition, aucun service ne doit instancier un canal
 * directement.
 */
export function getActiveNotificationChannels(): NotificationChannel[] {
  const channels: NotificationChannel[] = [new ConsoleNotificationChannel()];
  if (featureFlags.ENABLE_TELEGRAM) {
    channels.push(new TelegramNotificationChannel());
  }
  return channels;
}
