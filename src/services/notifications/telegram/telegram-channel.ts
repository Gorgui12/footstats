import type { NotificationChannel, NotificationMessage } from "../notification-channel.interface";

/**
 * Implémentation Telegram de NotificationChannel. Gardée derrière
 * ENABLE_TELEGRAM (feature-flags.ts) tant qu'aucun bot n'est réellement
 * configuré — voir DECISIONS.md pour le principe (ne pas construire tous
 * les canaux avant d'en avoir besoin). Le point d'intégration réel serait
 * un appel à l'API Bot Telegram (`sendMessage`) avec TELEGRAM_BOT_TOKEN.
 */
export class TelegramNotificationChannel implements NotificationChannel {
  readonly name = "telegram";

  async send(message: NotificationMessage): Promise<void> {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      console.warn(
        `[notification:telegram] TELEGRAM_BOT_TOKEN absent — message non envoyé (user=${message.userId}).`,
      );
      return;
    }
    // Intégration réelle à ajouter ici : appel à l'API Bot Telegram.
    console.log(`[notification:telegram] (stub) → user=${message.userId} :: ${message.title}`);
  }
}
