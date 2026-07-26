-- Le vote (upsert côté client) envoie route_id/user_id dans la clause
-- "ON CONFLICT DO UPDATE" même quand ils ne changent pas, ce qui se heurtait
-- au GRANT restreint posé en 002/003 et cassait le vote en production
-- (erreur "permission denied for table route_votes"). Le trigger posé en 006
-- suffit à empêcher une vraie tentative de réassignation ; on retire donc la
-- restriction de colonne ici, qui était trop stricte pour ce pattern d'upsert.
grant update on public.route_votes to authenticated;
