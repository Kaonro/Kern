-- Confirmation communautaire des signalements, façon Waze ("toujours là" / "plus
-- d'actualité") : n'importe quel utilisateur connecté peut donner son avis sur un
-- signalement existant, pas seulement son auteur. Un avis par utilisateur et par
-- signalement (upsert si on change d'avis).
create table public.report_confirmations (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  confirmed boolean not null, -- true = "toujours là", false = "plus d'actualité"
  created_at timestamptz not null default now(),
  unique (report_id, user_id)
);

alter table public.report_confirmations enable row level security;

create policy "Les confirmations sont visibles par tous" on public.report_confirmations
  for select using (true);

create policy "Un utilisateur connecté peut confirmer ou infirmer" on public.report_confirmations
  for insert with check (auth.uid() = user_id);

create policy "Un utilisateur peut changer son propre avis" on public.report_confirmations
  for update using (auth.uid() = user_id);

-- Seul le choix (confirmed) est modifiable, jamais le signalement ou l'utilisateur associé.
create or replace function public.restrict_report_confirmation_updates()
returns trigger
language plpgsql
as $$
begin
  new.report_id := old.report_id;
  new.user_id := old.user_id;
  new.created_at := old.created_at;
  return new;
end;
$$;

create trigger enforce_report_confirmation_update_columns
  before update on public.report_confirmations
  for each row execute function public.restrict_report_confirmation_updates();

-- Cf. 007_fix_vote_upsert_regression.sql : l'upsert côté client envoie report_id/user_id
-- dans la clause ON CONFLICT DO UPDATE même quand ils ne changent pas, ce qui se heurte
-- aux GRANT restreints par défaut. Le trigger ci-dessus suffit à empêcher une vraie
-- réassignation, donc pas besoin de restreindre le GRANT lui-même.
grant update on public.report_confirmations to authenticated;
