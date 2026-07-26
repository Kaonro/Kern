-- Remplace les restrictions par GRANT/REVOKE (peu fiables sur ce projet, voir
-- 005) par des triggers BEFORE UPDATE : quoi que le client envoie, les
-- colonnes non prévues pour être éditées par l'utilisateur sont silencieusement
-- remises à leur valeur d'origine. Ce mécanisme ne dépend d'aucun GRANT et ne
-- peut donc pas être réinitialisé par Supabase.

-- Parcours : seuls nom et saisonnalite sont éditables par la communauté.
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

drop trigger if exists enforce_route_update_columns on public.routes;
create trigger enforce_route_update_columns
  before update on public.routes
  for each row execute function public.restrict_route_updates();

-- Votes : seul le niveau de technicité est éditable, pas le parcours ou l'utilisateur visé.
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

drop trigger if exists enforce_vote_update_columns on public.route_votes;
create trigger enforce_vote_update_columns
  before update on public.route_votes
  for each row execute function public.restrict_vote_updates();

-- Profils : seuls pseudo et ville sont éditables, jamais l'id ou la date de création.
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

drop trigger if exists enforce_user_update_columns on public.users;
create trigger enforce_user_update_columns
  before update on public.users
  for each row execute function public.restrict_user_updates();
