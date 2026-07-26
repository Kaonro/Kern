import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { IconCheck, IconLock, IconSpinner, IconUser, IconWarningTriangle } from '../components/icons'
import { useAuth } from '../lib/AuthContext'
import { toFriendlyError } from '../lib/errors'
import { fetchProfile, updateProfile } from '../lib/profileApi'

export function ProfilePage() {
  const { session } = useAuth()

  const [pseudo, setPseudo] = useState('')
  const [ville, setVille] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!session) return
    fetchProfile(session.user.id)
      .then((profile) => {
        setPseudo(profile?.pseudo ?? '')
        setVille(profile?.ville ?? '')
      })
      .catch((err) => setError(toFriendlyError(err)))
      .finally(() => setLoading(false))
  }, [session])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!session) return
    setSaving(true)
    setError('')
    setMessage('')
    try {
      await updateProfile(session.user.id, { pseudo, ville })
      setMessage('Profil mis à jour.')
    } catch (err) {
      setError(toFriendlyError(err))
    } finally {
      setSaving(false)
    }
  }

  if (!session) {
    return (
      <div className="empty-state">
        <span className="big-icon">
          <IconLock />
        </span>
        <h1>Mon profil</h1>
        <p>
          Connecte-toi pour voir ton profil. <Link to="/auth">Se connecter</Link>
        </p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="loading-state">
        <span className="big-icon">
          <IconSpinner />
        </span>
        Chargement du profil...
      </div>
    )
  }

  return (
    <div className="page-padding">
      <h1>
        <IconUser /> Mon profil
      </h1>
      <div className="card">
        <form onSubmit={handleSave}>
          <label>
            Pseudo
            <input type="text" value={pseudo} onChange={(e) => setPseudo(e.target.value)} required />
          </label>
          <label>
            Ville
            <input type="text" value={ville} onChange={(e) => setVille(e.target.value)} placeholder="optionnel" />
          </label>
          <p className="notice">{session.user.email}</p>
          {error && (
            <p className="error">
              <IconWarningTriangle /> {error}
            </p>
          )}
          {message && (
            <p className="notice">
              <IconCheck /> {message}
            </p>
          )}
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? (
              <>
                <IconSpinner /> Enregistrement...
              </>
            ) : (
              'Enregistrer'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
