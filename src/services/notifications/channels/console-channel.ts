import type { NotificationChannel, NotificationMessage } from "../notification-channel.interface";

/**
 * Canal "simple" du MVP (brief §34 : ne pas construire tous les canaux
 * immédiatement). Se contente de logger côté serveur — suffisant pour
 * valider le flux de bout en bout (préférences → déclenchement → envoi)
 * avant de brancher un vrai fournisseur (email transactionnel, web push).
 */
export class ConsoleNotificationChannel implements NotificationChannel {
  readonly name = "console";

  async send(message: NotificationMessage): Promise<void> {
    // eslint-disable-next-line no-console
    console.log(`[notification:${this.name}] → user=${message.userId} :: ${message.title} — ${message.body}`);
  }
}
