import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { IconArrowRight, IconCheck, IconKey, IconSpinner, IconWarningTriangle } from '../components/icons'
import { toFriendlyError } from '../lib/errors'
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient'

export function AuthPage() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [pseudo, setPseudo] = useState('')
  const [ville, setVille] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    const { data, error: authError } =
      mode === 'login'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password, options: { data: { pseudo, ville } } })

    setLoading(false)
    if (authError) {
      setError(toFriendlyError(authError))
    } else if (data.session) {
      // Session déjà active (login, ou signup avec confirmation email désactivée) : direction la carte.
      navigate('/')
    } else {
      setSuccess('Compte créé, vérifie ta boîte mail.')
    }
  }

  return (
    <div className="page-padding auth-page">
      <div className="card auth-card">
        <h1>
          <IconKey /> {mode === 'login' ? 'Connexion' : 'Inscription'}
        </h1>
        <form onSubmit={handleSubmit}>
          <input type="email" placeholder="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input
            type="password"
            placeholder="mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
          {mode === 'signup' && (
            <>
              <input
                type="text"
                placeholder="pseudo"
                value={pseudo}
                onChange={(e) => setPseudo(e.target.value)}
                required
              />
              <input
                type="text"
                placeholder="ville (optionnel)"
                value={ville}
                onChange={(e) => setVille(e.target.value)}
              />
            </>
          )}
          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? (
              <IconSpinner />
            ) : (
              <>
                {mode === 'login' ? 'Se connecter' : "S'inscrire"} <IconArrowRight />
              </>
            )}
          </button>
        </form>
        <button
          type="button"
          className="link-button auth-switch"
          onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
        >
          {mode === 'login' ? "Pas de compte ? S'inscrire" : 'Déjà un compte ? Se connecter'}
        </button>
        {error && (
          <p className="error">
            <IconWarningTriangle /> {error}
          </p>
        )}
        {success && (
          <p className="notice">
            <IconCheck /> {success}
          </p>
        )}
        {!isSupabaseConfigured && (
          <p className="notice">
            <IconWarningTriangle /> Supabase n'est pas encore configuré (voir .env.example) — la connexion échouera
            tant que le projet Supabase n'est pas créé.
          </p>
        )}
      </div>
    </div>
  )
}
