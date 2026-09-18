-- Schéma PostgreSQL de référence pour FootStats Africa.
-- Correspond à DATA_MODEL.md. Non exécuté en développement (le repository
-- en mémoire sert de stub — cf. db/repositories/in-memory) mais c'est la
-- source de vérité pour la mise en place réelle de la base en production.
--
-- Choix ORM (Drizzle vs Prisma) non tranché — voir DECISIONS.md D8.
-- Ce fichier reste donc en SQL brut, indépendant de tout ORM, pour ne pas
-- présupposer la décision.

create table country (
  id text primary key,
  code text not null unique,
  name text not null,
  timezone text not null,
  currency text not null,
  default_language text not null
);

create table language (
  id text primary key,
  code text not null unique,
  name text not null
);

create table competition (
  id text primary key,
  slug text not null unique,
  name text not null,
  country_id text references country(id),
  type text not null check (type in ('league', 'cup', 'international')),
  logo_url text,
  is_active boolean not null default true,
  seo_status text not null default 'draft' check (seo_status in ('indexable', 'noindex', 'draft'))
);

create table season (
  id text primary key,
  competition_id text not null references competition(id),
  label text not null,
  start_date date not null,
  end_date date not null,
  is_current boolean not null default false
);

create table team (
  id text primary key,
  slug text not null unique,
  name text not null,
  short_name text not null,
  country_id text not null references country(id),
  logo_url text,
  founded_year int,
  seo_status text not null default 'draft' check (seo_status in ('indexable', 'noindex', 'draft'))
);

create table player (
  id text primary key,
  slug text not null unique,
  full_name text not null,
  date_of_birth date,
  nationality_country_id text references country(id),
  position text,
  current_team_id text references team(id),
  photo_url text,
  seo_status text not null default 'draft' check (seo_status in ('indexable', 'noindex', 'draft'))
);

create table venue (
  id text primary key,
  name text not null,
  city_name text,
  capacity int
);

create table match (
  id text primary key,
  slug text not null unique,
  competition_id text not null references competition(id),
  season_id text not null references season(id),
  home_team_id text not null references team(id),
  away_team_id text not null references team(id),
  venue_id text references venue(id),
  kickoff_at_utc timestamptz not null,
  status text not null check (status in
    ('scheduled', 'postponed', 'cancelled', 'live', 'halftime', 'finished', 'after_extra_time', 'after_penalties')),
  home_score int,
  away_score int,
  halftime_home_score int,
  halftime_away_score int,
  extra_time_home_score int,
  extra_time_away_score int,
  penalty_home_score int,
  penalty_away_score int,
  round text,
  referee text,
  minute int,
  data_freshness text not null default 'unavailable' check (data_freshness in ('fresh', 'stale', 'unavailable')),
  last_synced_at timestamptz not null default now(),
  seo_status text not null default 'draft' check (seo_status in ('indexable', 'noindex', 'draft'))
);
create index idx_match_kickoff on match (kickoff_at_utc);
create index idx_match_status on match (status);

create table match_event (
  id text primary key,
  match_id text not null references match(id),
  minute int not null,
  type text not null,
  team_id text not null references team(id),
  player_id text references player(id),
  related_player_id text references player(id),
  description text
);

create table match_statistic (
  match_id text not null references match(id),
  team_id text not null references team(id),
  key text not null,
  value numeric not null,
  primary key (match_id, team_id, key)
);

create table team_statistic (
  team_id text not null references team(id),
  competition_id text not null references competition(id),
  season_id text not null references season(id),
  key text not null,
  value numeric not null,
  primary key (team_id, competition_id, season_id, key)
);

create table player_statistic (
  player_id text not null references player(id),
  competition_id text not null references competition(id),
  season_id text not null references season(id),
  appearances int not null default 0,
  goals int not null default 0,
  assists int not null default 0,
  minutes_played int not null default 0,
  primary key (player_id, competition_id, season_id)
);

create table standing (
  competition_id text not null references competition(id),
  season_id text not null references season(id),
  team_id text not null references team(id),
  position int not null,
  played int not null,
  wins int not null,
  draws int not null,
  losses int not null,
  goals_for int not null,
  goals_against int not null,
  goal_difference int not null,
  points int not null,
  last_synced_at timestamptz not null default now(),
  primary key (competition_id, season_id, team_id)
);

create table news_article (
  id text primary key,
  slug text not null unique,
  title text not null,
  excerpt text not null,
  content text not null,
  cover_image_url text,
  author_name text not null,
  published_at timestamptz not null,
  updated_at timestamptz not null,
  category text not null,
  tags text[] not null default '{}',
  related_match_id text references match(id),
  related_team_id text references team(id),
  related_player_id text references player(id),
  related_competition_id text references competition(id),
  seo_status text not null default 'draft' check (seo_status in ('indexable', 'noindex', 'draft'))
);

create table broadcast (
  match_id text not null references match(id),
  country_id text not null references country(id),
  channel_name text,
  source text,
  confirmed_at timestamptz,
  primary key (match_id, country_id)
);

create table app_user (
  id text primary key,
  email text unique,
  created_at timestamptz not null default now(),
  preferred_language text not null default 'fr',
  preferred_country_id text references country(id)
);

create table user_favorite (
  id text primary key,
  user_id text not null references app_user(id),
  entity_type text not null check (entity_type in ('team', 'player', 'competition')),
  entity_id text not null,
  created_at timestamptz not null default now(),
  unique (user_id, entity_type, entity_id)
);

create table notification_preference (
  user_id text primary key references app_user(id),
  match_start boolean not null default true,
  goal boolean not null default true,
  lineup boolean not null default false,
  match_end boolean not null default true,
  breaking_news boolean not null default false,
  favorite_entity_updates boolean not null default true
);

create table provider (
  id text primary key,
  name text not null unique,
  is_active boolean not null default false,
  config jsonb not null default '{}'
);

create table provider_mapping (
  id text primary key,
  provider_id text not null references provider(id),
  internal_entity_type text not null,
  internal_entity_id text not null,
  external_id text not null,
  unique (provider_id, internal_entity_type, external_id)
);

create table slug_redirect (
  id text primary key,
  entity_type text not null,
  entity_id text not null,
  old_slug text not null,
  new_slug text not null,
  redirected_at timestamptz not null default now()
);

-- Tables préparées pour l'affiliation (Phase E de ROADMAP.md) — non alimentées au MVP.
create table affiliate_partner (
  id text primary key,
  name text not null,
  is_active boolean not null default false,
  disclosure_text text,
  allowed_countries text[] not null default '{}'
);

create table affiliate_campaign (
  id text primary key,
  partner_id text not null references affiliate_partner(id),
  name text not null,
  start_date date,
  end_date date,
  is_active boolean not null default false
);

create table affiliate_click (
  id text primary key,
  campaign_id text not null references affiliate_campaign(id),
  user_id text references app_user(id),
  country_id text references country(id),
  clicked_at timestamptz not null default now(),
  target_url text not null
);
