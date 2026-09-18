import { featureFlags } from "@/config/feature-flags";
import { getUpcomingMatches } from "@/services/football/match-service";
import { getPlayerBySlug } from "@/services/football/player-service";

/**
 * Fondation de l'assistant IA football (brief §36-38, ROADMAP Phase C).
 * Principe non négociable : toute réponse s'appuie sur les données
 * structurées de la plateforme (`DATA VERIFIED`) — jamais sur une
 * statistique inventée par le modèle de langage. Ce qui relève d'une
 * analyse probabiliste doit être marqué `INFERENCE` explicitement.
 *
 * Implémentation actuelle : intent detection minimale + accès direct aux
 * services football. Pas d'appel LLM branché au MVP (ENABLE_AI_ASSISTANT
 * est false par défaut) — le point d'extension pour brancher un vrai
 * modèle est `answerFootballQuestion`.
 */

export type AiAnswerSource = "DATA_VERIFIED" | "INFERENCE";

export interface AiAnswer {
  text: string;
  source: AiAnswerSource;
}

export async function answerFootballQuestion(question: string): Promise<AiAnswer> {
  if (!featureFlags.ENABLE_AI_ASSISTANT) {
    return {
      text: "L'assistant football n'est pas encore activé sur cette instance.",
      source: "DATA_VERIFIED",
    };
  }

  const q = question.toLowerCase();

  // Intent très simple pour la fondation — à remplacer par une vraie
  // détection d'intention (règle-based ou LLM) sans changer la signature.
  const playerSlugMatch = q.match(/prochain match de ([a-zàâäéèêëïîôöùûüç\s-]+)/i);
  if (playerSlugMatch) {
    const player = await getPlayerBySlug(playerSlugMatch[1]!.trim().replace(/\s+/g, "-"));
    if (!player) {
      return { text: "Je n'ai pas trouvé ce joueur dans nos données.", source: "DATA_VERIFIED" };
    }
    return {
      text: `Je n'ai pas encore de données de calendrier individuelles fiables pour ${player.fullName}. Consultez la page de son équipe pour les prochains matchs.`,
      source: "DATA_VERIFIED",
    };
  }

  if (q.includes("prochain match")) {
    const upcoming = await getUpcomingMatches(1);
    if (upcoming.length === 0) {
      return { text: "Aucun prochain match connu pour le moment.", source: "DATA_VERIFIED" };
    }
    return {
      text: `Le prochain match connu débute le ${new Date(upcoming[0]!.kickoffAtUtc).toLocaleString("fr-FR")} (UTC).`,
      source: "DATA_VERIFIED",
    };
  }

  return {
    text: "Je ne peux répondre qu'à partir des données football disponibles sur la plateforme pour le moment.",
    source: "DATA_VERIFIED",
  };
}
