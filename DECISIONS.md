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

---

## D11 — Multi-langue réel via routage par préfixe d'URL (`/fr`, `/en`)

**Décision :** toutes les routes vivent sous `src/app/[locale]/`, avec `src/app/[locale]/layout.tsx` comme layout racine (contient `<html lang={locale}>`). Le middleware détecte la langue (cookie `fs_locale` → en-tête `Accept-Language` → français par défaut) et redirige toute URL sans préfixe. Un dictionnaire (`src/i18n/dictionaries/{fr,en}.ts`) centralise les traductions, chargé côté serveur uniquement (`getDictionary(locale)`).

**Contexte :** l'architecture multi-langue était seulement *documentée* comme prête depuis la Phase A (ARCHITECTURE.md §8) mais jamais réellement implémentée — tous les textes étaient en dur en français dans les composants. Le brief demande explicitement (§18, Niveau 4) une vraie prise en charge multi-langue, pas seulement une promesse.

**Alternatives considérées :** (1) langue détectée sans préfixe d'URL (un seul jeu d'URLs, contenu changeant selon un cookie) — rejeté car mauvais pour le SEO (Google indexe une page par URL, pas par variante de cookie) ; (2) sous-domaines par langue (`en.footstats.africa`) — inutilement complexe pour deux langues au lancement.

**Justification :** le préfixe d'URL est le standard recommandé pour le SEO multi-langue (chaque langue a ses propres URLs indexables, avec des balises hreflang reliant les variantes — voir `lib/seo/index.ts` et `app/sitemap.ts`, qui génèrent maintenant une entrée par langue et par page).

**Compromis accepté :** toutes les pages ont dû être déplacées sous `[locale]/` et leurs liens internes reconstruits avec `localizedHref()`. La couverture de traduction est réelle mais pas exhaustive à 100% (voir `README.md` pour ce qui reste en dur).

---

## D12 — Activation de la Côte d'Ivoire et du Mali (affichage/préférences), pas encore de données réelles

**Décision :** `config/countries.ts` marque désormais la Côte d'Ivoire et le Mali `isLaunched: true`, les rendant sélectionnables dans le `CountrySwitcher` (fuseau horaire d'affichage des heures de match).

**Contexte :** brief §Niveau 4 / ROADMAP.md Phase F liste ces deux pays comme prochaines cibles après le Sénégal.

**Justification :** activer un pays au sens "préférence d'affichage" (fuseau horaire, apparaît dans le sélecteur) est une extension purement configurative, sans risque, qui prouve que l'architecture multi-pays fonctionne réellement.

**Compromis accepté — important :** cela ne signifie PAS que des compétitions ivoiriennes ou maliennes réelles sont disponibles. Aucune source de données (mock ou réelle) ne couvre ces pays aujourd'hui. Un utilisateur choisissant "Mali" verra les heures de match dans son fuseau horaire, mais aucune compétition malienne dans le contenu. Ce sera comblé par un fournisseur de données complet couvrant l'Afrique de l'Ouest (recherche en cours côté produit) — voir aussi D9.

---

## D13 — API-FOOTBALL (api-sports) comme source réelle africaine

**Décision :** nouveau provider `api-football` (`src/providers/football/api-football/`) implémentant `FootballProvider`, activé via `FOOTBALL_PROVIDER=api-football` + `APIFOOTBALL_API_KEY`. Il remplace seul à la fois football-data.org et le mock pour les compétitions qu'il couvre (CAN + grandes compétitions européennes mises en avant), en tant que source **réelle** (`isDemoData: false`).

**Contexte :** D9 clamait qu'« une source réelle africaine » manquait — la CAN et la Ligue 1 Sénégal restaient en DEMO via le mock. API-FOOTBALL couvre justement ces compétitions, ce qui supprime la seule donnée fictive encore affichée comme contenu structurant du site.

**Alternatives considérées :** (1) garder le composite `[football-data, mock]` et remplacer uniquement le mock par `api-football` — rejeté : football-data et api-football couvriraient alors les mêmes grandes compétitions (doublons de compétitions dans le repository) ; (2) ne brancher api-football que sur l'Afrique (composite à trois providers) — possible plus tard, mais plus complexe et non requis au premier branchement : api-football couvrant aussi l'Europe, on s'en sert maintenant comme provider unique.

**Justification :** un seul provider = une seule source de vérité, pas de doublons d'ids internes (`providerName:externalId`), et l'Afrique est enfin réelle. La liste des ligues suivies est centralisée dans `providers/football/api-football/leagues.ts` (ids constatables sur le dashboard, jamais devinés). La CAN correspond à l'id **6** (« Africa Cup of Nations »), confirmé via `/leagues?search=Africa` — l'id 1 est la Coupe du Monde et a été corrigé en conséquence ; les championnats locaux sont laissés en commentaire en attendant les ids réels (Sénégal, Côte d'Ivoire, Mali).

**Compromis accepté :** le plan gratuit API-FOOTBALL plafonne à **100 requêtes/jour** et verrouille la **saison courante** (seules les saisons 2022-2024 répondent à `league`+`season`). Constats empiriques validés sur l'API : `from`/`to` seuls sont rejetés, `page` n'existe pas sur `/fixtures`, et `date` combiné à `league` exige `season`. La synchro globale s'appuie donc sur **`live=all`** (scores en cours) + **`date=today`** (matchs réels du jour, 1 appel, filtrés aux ligues suivies) — pas de fenêtre temporelle from/to. TTL résultants : live 30 min (48 req/j), matchs du jour 60 min (24 req/j), méta ligues 24 h (7 req/j), classements/effectifs/événements à la demande — le tout sous les 100 req/j en usage personnel. **Conséquence assumée :** les classements (standings) de la saison courante sont indisponibles tant qu'elle est verrouillée sur Free (retour vide, repli sur le repository), et l'historique récent/à venir se limite au jour courant. Pour un trafic soutenu ou le classement en direct, monter de plan.

---

## D14 — Persistance SQLite (node:sqlite) des données football synchronisées

**Décision :** les données football syncronisées depuis le provider (équipes, joueurs, compétitions, matchs, classements) sont **persistées dans une base SQLite locale** (`data/footstats.db`, mode WAL) via le module natif `node:sqlite` (Node ≥ 22.5), en **write-through** à chaque `upsert` des repositories, et **réhydratées en mémoire au démarrage** du serveur. Le `lastSyncedAt` du sync-service est lui aussi persisté.

**Contexte :** avec API-FOOTBALL (D13), les repositories en mémoire étaient la seule couche de stockage : à chaque redémarrage, tout était perdu et le site rappelait massivement l'API (quota 100 req/j libre), ce qui pouvait même afficher des pages vides si le quota était atteint au pire moment.

**Alternatives considérées :** (1) PostgreSQL (ce que laissait deviner `DATABASE_URL` du template) — rejeté pour l'instant : nécessite un serveur externe, une migration ORM (D8), une authentification ; hors proportion pour un MVP monoprocess. (2) un fichier JSON de snapshots — rejeté : pas d'upsert incrémental, relecture/écriture complet, risque de corruption. (3) `better-sqlite3` — très équivalent, mais nécessite `npm install` d'un paquet natif à compiler, alors que `node:sqlite` est disponible sans dépendance sur Node ≥ 22.5 (utilisé ici).

**Justification :** le repository mémoire reste le chemin de lecture (rapide, signatures d'interfaces intactes — D1/§4) ; SQLite n'apporte que la durabilité. Le write-through rend la persistance transparente (aucun service n'a changé) et la réhydratation garantit un affichage immédiat après redémarrage, avec un `lastSyncedAt` qui évite de re-frapper l'API tant que les données restaurées sont récentes (< 45 s). Défaut : sans `node:sqlite` (Node < 22.5) ou si la base est inutilisable, la persistance se désactive silencieusement (comportement mémoire d'origine).

**Compromis accepté :** (a) le schéma est un simple KV JSON par entité (`kind` + `id`) — pas de requêtes SQL riches, mais pleinement suffisant pour servir de cache durable entre redémarrages ; (b) les données éphémères par match (événements, statistiques, compositions) et les données utilisateur (favoris, préférences, profils) restent en mémoire — elles n'ont pas de sens persisté pour l'affichage à l'instant T ; (c) `node:sqlite` est expérimental en Node 22 (avertissement à l'import, API susceptible d'évoluer) — acceptable au MVP, documenté, isolé derrière `src/db/sqlite.ts` ; (d) écriture synchrone à chaque upsert, sans file — OK pour les volumes actuels (dizaines d'entités par sync toutes les 45 s), à reconsidérer si le volume explose (checkpoint par batch). Un vrai Postgres (D8) resterait le passage obligé pour un scale-out multi-instance.
