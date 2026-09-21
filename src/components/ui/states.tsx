import type { Dictionary } from "@/i18n/dictionaries/types";

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-xl2 border border-dashed border-white/15 p-8 text-center text-sm text-white/50">
      {message}
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-xl2 border border-live/30 bg-live/10 p-8 text-center text-sm text-live">
      {message}
    </div>
  );
}

/** Utilisé pour toute donnée dont la fraîcheur peut être incertaine (brief §53). */
export function FreshnessNote({
  lastSyncedAt,
  freshness,
  dict,
}: {
  lastSyncedAt: string;
  freshness: string;
  dict: Dictionary;
}) {
  if (freshness === "fresh") return null;
  const label =
    freshness === "unavailable"
      ? dict.states.demoNotConfirmed
      : `${dict.states.lastUpdated} : ${new Date(lastSyncedAt).toLocaleTimeString()}`;
  return <p className="mt-1 text-[11px] italic text-white/40">{label}</p>;
}
