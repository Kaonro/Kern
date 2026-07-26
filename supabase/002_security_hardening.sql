-- Durcissement sécurité post-audit (2026-07-26)
-- A coller dans Supabase > SQL Editor > New query, puis "Run".
-- RLS filtre les LIGNES visibles, pas les COLONNES : sans ces GRANT/REVOKE,
-- n'importe qui (même non connecté, via la clé anon publique) peut lire
-- l'email de tous les utilisateurs, et n'importe quel utilisateur connecté
-- peut modifier le tracé/les stats/l'attribution de n'importe quel parcours.

-- 1) L'email ne doit jamais être lisible via l'API publique (anon ou authenticated).
--    Le pseudo et la ville restent publics, l'email reste dans auth.users pour l'app.
revoke select (email) on public.users from anon, authenticated;

-- 2) Un utilisateur connecté ne peut modifier que son propre pseudo/ville,
--    jamais son id, son email ou sa date de création.
revoke update on public.users from authenticated;
grant update (pseudo, ville) on public.users to authenticated;

-- 3) Un contributeur ne peut éditer que le nom et la praticabilité saisonnière
--    d'un parcours, jamais le tracé GPX, la distance, le dénivelé ou l'attribution.
revoke update on public.routes from authenticated;
grant update (nom, saisonnalite) on public.routes to authenticated;

-- 4) Un utilisateur ne peut modifier que le niveau de technicité de son propre
--    vote, jamais le réassigner à un autre parcours ou un autre utilisateur.
revoke update on public.route_votes from authenticated;
grant update (technicite) on public.route_votes to authenticated;
