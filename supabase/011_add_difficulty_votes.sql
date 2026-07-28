-- Nouveau système de vote "difficulté" (5 niveaux, vocabulaire accessible aux débutants),
-- distinct de la technicité du terrain déjà en place. Réutilise la fonction de trigger
-- existante restrict_vote_updates() : elle ne touche que route_id/user_id/created_at,
-- des colonnes communes aux deux tables de vote.
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
