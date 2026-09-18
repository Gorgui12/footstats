import { toggleFavoriteAction } from "@/app/actions/favorites";
import { FavoriteEntityType } from "@/domain/football/enums";
import { cn } from "@/lib/utils/cn";

interface FavoriteButtonProps {
  entityType: FavoriteEntityType;
  entityId: string;
  isFavorite: boolean;
  redirectPath: string;
  label?: string;
}

/**
 * Formulaire progressivement amélioré (Server Action) — fonctionne même
 * sans JavaScript côté client, conformément à l'approche mobile-first et
 * peu coûteuse du MVP (pas de state client superflu).
 */
export function FavoriteButton({ entityType, entityId, isFavorite, redirectPath, label }: FavoriteButtonProps) {
  return (
    <form action={toggleFavoriteAction}>
      <input type="hidden" name="entityType" value={entityType} />
      <input type="hidden" name="entityId" value={entityId} />
      <input type="hidden" name="isFavorite" value={String(isFavorite)} />
      <input type="hidden" name="redirectPath" value={redirectPath} />
      <button
        type="submit"
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition",
          isFavorite
            ? "border-brand-500/50 bg-brand-500/15 text-brand-300"
            : "border-white/15 text-white/70 hover:border-white/30 hover:text-white",
        )}
      >
        <span>{isFavorite ? "★" : "☆"}</span>
        {label ?? (isFavorite ? "Dans mes favoris" : "Ajouter aux favoris")}
      </button>
    </form>
  );
}
