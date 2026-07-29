-- Compteur de visites minimal pour suivre le démarrage du pilote. Aucune donnée
-- personnelle : juste le chemin visité et l'horodatage.
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
