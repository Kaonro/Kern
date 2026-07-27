-- Nouveaux types de signalement : fermetures et restrictions d'accès.
-- ALTER TYPE ... ADD VALUE doit s'exécuter hors transaction explicite (chaque
-- instruction est autocommit dans l'éditeur SQL Supabase, donc pas de begin/commit ici).
alter type public.report_type_enum add value if not exists 'route_fermee';
alter type public.report_type_enum add value if not exists 'chemin_prive';
alter type public.report_type_enum add value if not exists 'interdit_pietons';
alter type public.report_type_enum add value if not exists 'interdit_velos';
