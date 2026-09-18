import type { Metadata } from "next";
import { getOrCreateCurrentUser } from "@/services/users/current-user-service";
import { getNotificationPreference } from "@/services/notifications/notification-preference-service";
import { updateNotificationPreferenceAction } from "@/app/actions/notification-preferences";
import { buildMetadata } from "@/lib/seo";
import { SeoStatus } from "@/domain/football/enums";
import { featureFlags } from "@/config/feature-flags";
import type { NotificationPreference } from "@/domain/users/types";

export const metadata: Metadata = buildMetadata({
  title: "Notifications",
  description: "Gérez vos préférences de notification sur FootStats Africa.",
  path: "/parametres/notifications",
  seoStatus: SeoStatus.NOINDEX,
});

const OPTIONS: { field: keyof Omit<NotificationPreference, "userId">; label: string; description: string }[] = [
  { field: "matchStart", label: "Début de match", description: "Recevoir une alerte au coup d'envoi d'un match d'une équipe suivie." },
  { field: "goal", label: "Buts", description: "Recevoir une alerte à chaque but d'une équipe suivie." },
  { field: "matchEnd", label: "Fin de match", description: "Recevoir le résultat final d'un match d'une équipe suivie." },
  { field: "lineup", label: "Compositions", description: "Recevoir la composition dès qu'elle est publiée." },
  { field: "breakingNews", label: "Actualités importantes", description: "Recevoir les actualités marquantes du football africain." },
  { field: "favoriteEntityUpdates", label: "Mises à jour de vos favoris", description: "Recevoir les mises à jour concernant vos équipes, joueurs et compétitions suivis." },
];

export default async function NotificationSettingsPage() {
  const user = await getOrCreateCurrentUser();
  const preference = user ? await getNotificationPreference(user.id) : null;

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Notifications</h1>
        <p className="mt-1 text-sm text-white/50">
          {featureFlags.ENABLE_NOTIFICATIONS
            ? "Choisissez les alertes que vous souhaitez recevoir."
            : "L'envoi de notifications n'est pas encore activé sur cette instance — vos préférences seront prises en compte dès son activation."}
        </p>
      </div>

      <form action={updateNotificationPreferenceAction} className="space-y-4 rounded-xl2 border border-white/10 bg-pitch-900/60 p-6">
        {OPTIONS.map((opt) => (
          <label key={opt.field} className="flex items-start gap-3">
            <input
              type="checkbox"
              name={opt.field}
              defaultChecked={preference?.[opt.field] ?? false}
              className="mt-1 h-4 w-4 rounded border-white/30 bg-transparent accent-brand-500"
            />
            <span>
              <span className="block font-medium">{opt.label}</span>
              <span className="block text-sm text-white/50">{opt.description}</span>
            </span>
          </label>
        ))}
        <button
          type="submit"
          className="rounded-full bg-brand-500 px-5 py-2.5 text-sm font-medium text-pitch-950 hover:bg-brand-600"
        >
          Enregistrer
        </button>
      </form>
    </div>
  );
}
