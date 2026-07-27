-- Permet à un utilisateur de supprimer ses propres signalements (ex. fausse manip).
-- Pas de policy DELETE existait jusqu'ici sur public.reports.
create policy "Un utilisateur peut supprimer ses propres signalements" on public.reports
  for delete using (auth.uid() = user_id);
