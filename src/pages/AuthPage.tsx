import { useState } from 'react'
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient'

export function AuthPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const { error } =
      mode === 'login'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password })

    setLoading(false)
    setMessage(error ? error.message : mode === 'login' ? 'Connecté.' : 'Compte créé, vérifie ta boîte mail.')
  }

  return (
    <div className="page-padding auth-page">
      <h1>{mode === 'login' ? 'Connexion' : 'Inscription'}</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
        />
        <button type="submit" disabled={loading}>
          {mode === 'login' ? 'Se connecter' : "S'inscrire"}
        </button>
      </form>
      <button type="button" className="link-button" onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}>
        {mode === 'login' ? "Pas de compte ? S'inscrire" : 'Déjà un compte ? Se connecter'}
      </button>
      {message && <p className="notice">{message}</p>}
      {!isSupabaseConfigured && (
        <p className="notice">
          Supabase n'est pas encore configuré (voir .env.example) — la connexion échouera tant que le projet
          Supabase n'est pas créé.
        </p>
      )}
    </div>
  )
}
