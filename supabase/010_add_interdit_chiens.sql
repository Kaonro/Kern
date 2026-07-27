-- Nouveau type de signalement : chiens interdits (utile pour les pratiquants de canicross).
alter type public.report_type_enum add value if not exists 'interdit_chiens';
