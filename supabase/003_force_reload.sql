-- Complément au 002 : au cas où le droit vient du rôle PUBLIC (hérité par
-- anon/authenticated), et pour forcer PostgREST à recharger son cache de schéma.

revoke select (email) on public.users from public;
revoke update on public.users from public;
revoke update on public.routes from public;
revoke update on public.route_votes from public;

notify pgrst, 'reload schema';
