import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

if (!isSupabaseConfigured) {
  console.warn(
    'Variables Supabase manquantes : copie .env.example vers .env et renseigne VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY.',
  )
}

// Placeholder valide tant que le projet Supabase n'est pas configuré, pour que createClient ne lève pas d'exception au chargement.
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
)
