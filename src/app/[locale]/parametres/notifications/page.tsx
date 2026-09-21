import type { Metadata } from "next";
import { getOrCreateCurrentUser } from "@/services/users/current-user-service";
import { getNotificationPreference } from "@/services/notifications/notification-preference-service";
import { updateNotificationPreferenceAction } from "@/app/actions/notification-preferences";
import { buildMetadata } from "@/lib/seo";
import { SeoStatus } from "@/domain/football/enums";
import { featureFlags } from "@/config/feature-flags";
import type { NotificationPreference } from "@/domain/users/types";
import { isSupportedLocale, localizedHref, DEFAULT_LOCALE, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import type { Dictionary } from "@/i18n/dictionaries/types";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale: Locale = isSupportedLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;
  return buildMetadata({
    title: "Notifications",
    description:
      locale === "en"
        ? "Manage your notification preferences on FootStats Africa."
        : "Gérez vos préférences de notification sur FootStats Africa.",
    path: localizedHref(locale, "/parametres/notifications"),
    seoStatus: SeoStatus.NOINDEX,
  });
}

function buildOptions(dict: Dictionary): { field: keyof Omit<NotificationPreference, "userId">; label: string; description: string }[] {
  const n = dict.notificationsPage;
  return [
    { field: "matchStart", ...n.matchStart },
    { field: "goal", ...n.goal },
    { field: "matchEnd", ...n.matchEnd },
    { field: "lineup", ...n.lineup },
    { field: "breakingNews", ...n.breakingNews },
    { field: "favoriteEntityUpdates", ...n.favoriteEntityUpdates },
  ];
}

export default async function NotificationSettingsPage({ params }: PageProps) {
  const { locale: rawLocale } = await params;
  const locale: Locale = isSupportedLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;
  const dict = getDictionary(locale);
  const options = buildOptions(dict);

  const user = await getOrCreateCurrentUser();
  const preference = user ? await getNotificationPreference(user.id) : null;

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{dict.notificationsPage.title}</h1>
        <p className="mt-1 text-sm text-white/50">
          {featureFlags.ENABLE_NOTIFICATIONS ? dict.notificationsPage.enabledDescription : dict.notificationsPage.disabledDescription}
        </p>
      </div>

      <form action={updateNotificationPreferenceAction} className="space-y-4 rounded-xl2 border border-white/10 bg-pitch-900/60 p-6">
        {options.map((opt) => (
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
          {dict.notificationsPage.save}
        </button>
      </form>
    </div>
  );
}
