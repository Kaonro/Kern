-- Schéma initial Kern MVP : users, routes, route_votes, reports
-- A coller dans Supabase > SQL Editor > New query, puis "Run".

create extension if not exists pgcrypto;

-- Profil utilisateur (lié à auth.users, qui gère déjà email/mot de passe).
-- Pas de colonne email ici volontairement : Supabase réapplique automatiquement
-- des GRANT larges sur les tables du schéma public, donc restreindre une colonne
-- par REVOKE n'est pas fiable dans la durée. L'email reste uniquement dans
-- auth.users (jamais exposé par l'API publique) et l'app lit toujours
-- session.user.email, jamais cette table.
create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  pseudo text not null,
  ville text,
  created_at timestamptz not null default now()
);

alter table public.users enable row level security;

create policy "Les profils sont visibles par tous" on public.users
  for select using (true);

create policy "Chacun peut modifier son propre profil" on public.users
  for update using (auth.uid() = id);

-- Crée automatiquement une ligne dans public.users à l'inscription (auth.signUp)
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, pseudo, ville)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'pseudo', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'ville'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Seuls pseudo et ville sont éditables par le propriétaire du profil (jamais
-- id/created_at). Un trigger plutôt que des GRANT par colonne : Supabase
-- réapplique automatiquement des GRANT larges sur les tables du schéma
-- public, donc REVOKE par colonne n'est pas fiable dans la durée.
create or replace function public.restrict_user_updates()
returns trigger
language plpgsql
as $$
begin
  new.id := old.id;
  new.created_at := old.created_at;
  return new;
end;
$$;

create trigger enforce_user_update_columns
  before update on public.users
  for each row execute function public.restrict_user_updates();

-- Parcours (chaque upload GPX crée une entrée ; la "heatmap" vient de la superposition visuelle des tracés)
create table public.routes (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  gpx_track jsonb not null, -- [{ "lat": .., "lng": .., "ele": .. }, ...]
  distance_km numeric not null,
  denivele_m integer not null default 0,
  saisonnalite text,
  created_by uuid references public.users (id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.routes enable row level security;

create policy "Les parcours sont visibles par tous" on public.routes
  for select using (true);

create policy "Les utilisateurs connectés peuvent ajouter un parcours" on public.routes
  for insert with check (auth.uid() = created_by);

create policy "Les contributeurs connectés peuvent éditer un parcours" on public.routes
  for update using (auth.uid() is not null);

-- Seuls le nom et la praticabilité saisonnière sont éditables par la communauté,
-- jamais le tracé GPX, la distance, le dénivelé ou l'attribution du parcours.
create or replace function public.restrict_route_updates()
returns trigger
language plpgsql
as $$
begin
  new.gpx_track := old.gpx_track;
  new.distance_km := old.distance_km;
  new.denivele_m := old.denivele_m;
  new.created_by := old.created_by;
  new.created_at := old.created_at;
  return new;
end;
$$;

create trigger enforce_route_update_columns
  before update on public.routes
  for each row execute function public.restrict_route_updates();

-- Votes de technicité (un vote par utilisateur et par parcours, écrasable)
create type public.technicite_enum as enum ('roulant', 'technique', 'tres_technique');

create table public.route_votes (
  id uuid primary key default gen_random_uuid(),
  route_id uuid not null references public.routes (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  technicite public.technicite_enum not null,
  created_at timestamptz not null default now(),
  unique (route_id, user_id)
);

alter table public.route_votes enable row level security;

create policy "Les votes sont visibles par tous" on public.route_votes
  for select using (true);

create policy "Un utilisateur connecté peut voter" on public.route_votes
  for insert with check (auth.uid() = user_id);

create policy "Un utilisateur peut changer son propre vote" on public.route_votes
  for update using (auth.uid() = user_id);

-- Seul le niveau voté est modifiable, pas le parcours ou l'utilisateur associé au vote.
create or replace function public.restrict_vote_updates()
returns trigger
language plpgsql
as $$
begin
  new.route_id := old.route_id;
  new.user_id := old.user_id;
  new.created_at := old.created_at;
  return new;
end;
$$;

create trigger enforce_vote_update_columns
  before update on public.route_votes
  for each row execute function public.restrict_vote_updates();

-- Votes de difficulté générale (accessible aux débutants), distincts de la technicité du
-- terrain : un même parcours peut être "roulant" (peu technique) mais "difficile" (long,
-- dénivelé important), ou l'inverse. Même schéma/policies/trigger que route_votes.
create type public.difficulte_enum as enum ('tres_facile', 'facile', 'moyen', 'difficile', 'tres_difficile');

create table public.route_difficulty_votes (
  id uuid primary key default gen_random_uuid(),
  route_id uuid not null references public.routes (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  difficulte public.difficulte_enum not null,
  created_at timestamptz not null default now(),
  unique (route_id, user_id)
);

alter table public.route_difficulty_votes enable row level security;

create policy "Les votes de difficulté sont visibles par tous" on public.route_difficulty_votes
  for select using (true);

create policy "Un utilisateur connecté peut voter la difficulté" on public.route_difficulty_votes
  for insert with check (auth.uid() = user_id);

create policy "Un utilisateur peut changer son propre vote de difficulté" on public.route_difficulty_votes
  for update using (auth.uid() = user_id);

create trigger enforce_difficulty_vote_update_columns
  before update on public.route_difficulty_votes
  for each row execute function public.restrict_vote_updates();

-- Signalements géolocalisés
create type public.report_type_enum as enum (
  'eau_a_sec',
  'passage_boueux',
  'danger_eboulement',
  'balisage_manquant',
  'animal',
  'route_fermee',
  'chemin_prive',
  'interdit_pietons',
  'interdit_velos',
  'interdit_chiens',
  'autre'
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  route_id uuid not null references public.routes (id) on delete cascade,
  user_id uuid references public.users (id) on delete set null,
  type public.report_type_enum not null,
  description text,
  latitude double precision not null,
  longitude double precision not null,
  created_at timestamptz not null default now()
);

alter table public.reports enable row level security;

create policy "Les signalements sont visibles par tous" on public.reports
  for select using (true);

create policy "Un utilisateur connecté peut signaler" on public.reports
  for insert with check (auth.uid() = user_id);

create policy "Un utilisateur peut supprimer ses propres signalements" on public.reports
  for delete using (auth.uid() = user_id);

-- Compteur de visites minimal pour suivre le démarrage du pilote (pas d'IP, pas d'user
-- agent, pas de cookie de suivi — juste le chemin et l'horodatage, aucune donnée personnelle).
create table public.page_views (
  id uuid primary key default gen_random_uuid(),
  path text not null,
  created_at timestamptz not null default now()
);

alter table public.page_views enable row level security;

create policy "N'importe qui peut enregistrer une visite" on public.page_views
  for insert with check (true);

create policy "Les stats de visite sont visibles par tous" on public.page_views
  for select using (true);
