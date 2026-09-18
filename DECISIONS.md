# DECISIONS.md — Project WinMax / FootStats Africa

Ce document liste les décisions architecturales importantes et leur justification. Toute décision future significative doit être ajoutée ici avec la même structure : **Décision / Contexte / Alternatives considérées / Justification / Compromis accepté**.

---

## D1 — Modular monolith plutôt que microservices

**Décision :** un seul déploiement Next.js avec des domaines internes isolés par dossier (`domain/*`, `services/*`).

**Contexte :** le produit vise potentiellement des millions d'utilisateurs et plusieurs domaines (football, notifications, IA, affiliation), ce qui pourrait suggérer des microservices.

**Alternatives considérées :** microservices dès le départ, serverless functions séparées par domaine.

**Justification :** au stade MVP, la complexité opérationnelle des microservices (déploiement, observabilité distribuée, latence réseau interne) coûte plus cher que la valeur qu'elle apporte. Les frontières de domaine en code permettent une extraction future si un domaine a besoin de scaler indépendamment.

**Compromis accepté :** si un domaine (ex. ingestion de données live) devient un goulot d'étranglement, il faudra l'extraire — c'est anticipé mais pas prématurément construit.

---

## D2 — Provider abstraction dès le MVP

**Décision :** interface `FootballProvider` unique, avec un `MockFootballProvider` par défaut tant qu'aucun contrat n'est signé avec un fournisseur payant.

**Justification :** le coût, la couverture et les limites des fournisseurs (API-Football ou autres) ne sont pas encore arbitrés côté business. Coder en dur un fournisseur spécifique rendrait un changement ultérieur coûteux et risqué (règle 72 du brief : changer de provider sans refaire le frontend).

**Compromis accepté :** un peu de code d'abstraction supplémentaire dès le départ, pour un gain de flexibilité majeur.

---

## D3 — Pas de temps réel websocket au lancement

**Décision :** polling raisonnable (ISR courte / route handler interrogée à intervalle) pour les scores live.

**Justification :** un pipeline d'ingestion d'événements temps réel est complexe à opérer et coûteux à maintenir pour un volume d'utilisateurs initial modeste. Le polling suffit largement à l'échelle du lancement.

**Compromis accepté :** latence de quelques secondes sur les mises à jour live, acceptable au MVP. L'interface de service est conçue pour permettre un remplacement par du push plus tard sans changer les appelants.

---

## D4 — Redis différé

**Décision :** cache applicatif en mémoire + ISR Next.js au MVP ; Redis ajouté seulement si un besoin concret de cache partagé multi-instance apparaît.

**Justification :** ajouter Redis sans besoin réel ajoute un composant d'infrastructure à opérer et surveiller pour un gain nul tant qu'il n'y a qu'une poignée d'instances serveur.

**Compromis accepté :** une interface `CacheProvider` est posée dès le départ pour que l'introduction de Redis soit un simple changement d'implémentation.

---

## D5 — Multi-pays et multi-langue : structure prête, activation différée

**Décision :** les tables et registres (`Country`, `Language`, `config/countries.ts`) existent dès le MVP, mais seul le Sénégal / français est activé.

**Justification :** répond directement à l'exigence "ajouter le Ghana dans 6 mois sans réécrire l'application" sans payer le coût de traduction et d'opérations multi-pays avant d'en avoir besoin.

**Compromis accepté :** un peu de complexité de modélisation en amont (clé étrangère `countryId` partout où c'est pertinent) pour éviter une migration lourde plus tard.

---

## D6 — Affiliation : tables préparées, logique non construite

**Décision :** schéma DB (`AffiliatePartner`, `AffiliateCampaign`, `AffiliateClick`) présent dès le MVP ; aucune logique de sélection dynamique d'offre développée.

**Justification :** évite une migration de schéma majeure quand l'affiliation sera activée, sans investir de temps de développement dans une fonctionnalité non encore monétisable ni cadrée business/légalement marché par marché.

**Compromis accepté :** tables présentes mais vides/inutilisées un temps — coût de modélisation minime, accepté.

---

## D7 — Aucune donnée simulée présentée comme réelle

**Décision :** toute donnée de démonstration (scores, compositions, chaînes TV) est explicitement marquée `DEMO` dans le code et, si nécessaire, visible pour l'utilisateur tant qu'aucune source réelle n'est branchée.

**Justification :** la confiance éditoriale est un actif stratégique du produit (cf. principes éditoriaux du brief) ; une donnée fictive présentée comme réelle détruit cette confiance et expose à des risques de désinformation (notamment sur les chaînes de diffusion).

**Compromis accepté :** aucun — c'est une contrainte non négociable, pas un compromis.

---

## D8 — Choix de l'ORM/DB layer : à trancher à l'implémentation

**Décision :** PostgreSQL confirmé comme moteur de base de données. Le choix entre Drizzle ORM et Prisma (ou SQL brut avec un query builder léger) n'est **pas encore tranché** dans ce document.

**Justification :** ce choix a un impact sur la structure de `db/schema` et `db/repositories` mais n'affecte pas les couches supérieures (domain/services) si l'interface des repositories reste stable. Il sera tranché à l'étape d'implémentation en fonction des besoins de typage strict et de performance de migration.

**À trancher avant Phase A, implémentation DB.**

---

## D9 — football-data.org comme premier provider réel, combiné en composite avec le mock

**Décision :** `ApiFootballDataProvider` implémente `FootballProvider` en s'appuyant sur football-data.org (plan gratuit du compte configuré : WC, CL, BL1, DED, BSA, PD, FL1, ELC, PPL, EC, SA, PL). Il est combiné à `MockFootballProvider` via un nouveau `CompositeFootballProvider`, activé par `FOOTBALL_PROVIDER=football-data`.

**Contexte :** le plan gratuit football-data.org ne couvre aucune compétition sénégalaise ou africaine. Basculer entièrement dessus aurait fait disparaître Ligue 1 Sénégal et la CAN — contraire au positionnement "Africa-first" (brief §32/§80) qui est justement le point de différenciation stratégique du produit (brief §89).

**Alternatives considérées :** (1) tout migrer vers football-data.org et abandonner temporairement le contenu sénégalais ; (2) attendre une source réelle africaine avant de brancher quoi que ce soit de réel.

**Justification :** le `CompositeFootballProvider` permet d'avoir des données réelles là où une source existe (Europe/international) sans sacrifier le contenu africain, qui reste sur le mock — toujours marqué `isDemoData: true` donc `dataFreshness: "unavailable"`, jamais confondu avec du réel (brief §95). C'est une extension pure de l'abstraction provider déjà posée en Phase A : aucun service n'a eu à changer.

**Compromis accepté :** Ligue 1 Sénégal et la CAN restent en données de démonstration jusqu'à ce qu'une source réelle africaine soit identifiée et branchée (il suffira alors de la substituer au `MockFootballProvider` dans la liste du composite).

**Contrainte de quota :** le plan gratuit limite à 10 req/min. `ApiFootballDataProvider` mutualise un seul appel `/v4/matches` pour tous les matchs (scores + calendrier), dérive la liste des équipes de ce même appel plutôt que d'appeler `/v4/teams` séparément, et cache agressivement (60 s pour les matchs, 10 min pour les classements, 24 h pour les compétitions). Les classements et effectifs sont récupérés à la demande (par compétition/équipe visitée) plutôt que pré-chargés pour tout au moment de la synchronisation globale — voir le changement dans `sync-service.ts`, `competition-service.ts` et `player-service.ts`.

---

## D10 — Cotes et codes promo : architecture posée, aucun scraper branché

**Décision :** une interface `OddsProvider` (`src/providers/odds/`) et les types `AffiliatePartner`/`OddsQuote` sont posés, avec un `NotConfiguredOddsProvider` par défaut qui ne retourne jamais de donnée inventée. Aucune implémentation de scraping n'est écrite pour le moment.

**Contexte :** la demande porte sur un "Custom Scraper" pour les cotes exactes et codes promo d'un bookmaker, mais aucun site cible n'a été précisé. Un scraper est par nature spécifique à un site (structure HTML propre à chaque bookmaker) — il n'existe pas de "scraper générique".

**Justification :** écrire un scraper sans cible nommée reviendrait à deviner une structure HTML arbitraire, donc à livrer du code inutilisable. Par ailleurs, avant de scraper un bookmaker précis, il faut vérifier ses conditions d'utilisation/robots.txt, et le brief impose déjà des garde-fous (§83) — mentions légales, restrictions géographiques, pas de promesse de gain — qui doivent être en place avant toute mise en production de cette fonctionnalité, pas après.

**Prochaine étape :** dès que le bookmaker/partenaire cible est identifié, implémenter `providers/odds/<nom-du-partenaire>/` en respectant l'interface `OddsProvider`, dans son propre dossier, sans toucher au domaine football.
