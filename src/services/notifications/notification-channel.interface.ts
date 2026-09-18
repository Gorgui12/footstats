/**
 * Abstraction canal de notification (brief §34). Chaque canal (email,
 * web push, Telegram, WhatsApp...) implémente cette interface. Le reste du
 * code (services/notifications/notification-service.ts) ne dépend que de
 * cette interface — ajouter un canal ne casse jamais les autres (brief §72).
 */
export interface NotificationMessage {
  userId: string;
  title: string;
  body: string;
}

export interface NotificationChannel {
  readonly name: string;
  send(message: NotificationMessage): Promise<void>;
}
