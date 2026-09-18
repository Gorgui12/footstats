/**
 * Feature flags centralisés — permet d'activer progressivement les
 * fonctionnalités de Niveau 2+ sans conditionner le code un peu partout.
 * Lues depuis l'environnement, avec une valeur par défaut sûre (désactivé)
 * pour tout ce qui n'est pas encore prêt pour la production.
 */
function readBooleanEnv(name: string, defaultValue: boolean): boolean {
  const raw = process.env[name];
  if (raw === undefined) return defaultValue;
  return raw === "true" || raw === "1";
}

export const featureFlags = {
  ENABLE_AI_ASSISTANT: readBooleanEnv("ENABLE_AI_ASSISTANT", false),
  ENABLE_NOTIFICATIONS: readBooleanEnv("ENABLE_NOTIFICATIONS", false),
  ENABLE_AFFILIATE: readBooleanEnv("ENABLE_AFFILIATE", false),
  ENABLE_LIVE_STATS: readBooleanEnv("ENABLE_LIVE_STATS", true),
  ENABLE_TELEGRAM: readBooleanEnv("ENABLE_TELEGRAM", false),
  ENABLE_FAVORITES: readBooleanEnv("ENABLE_FAVORITES", true),
} as const;

export type FeatureFlags = typeof featureFlags;
