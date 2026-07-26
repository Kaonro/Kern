-- Fix définitif : au lieu de compter sur des GRANT/REVOKE qui peuvent être
-- silencieusement réinitialisés par Supabase, on supprime purement et
-- simplement la colonne email de la table publique. L'app n'en a jamais eu
-- besoin (elle lit toujours l'email depuis la session de connexion), et
-- sans colonne, il n'y a plus rien à exposer par erreur.

alter table public.users drop column if exists email;

create or replace function public.handle_new_user()
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
