import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { toFriendlyError } from '../lib/errors'
import { parseGpx } from '../lib/gpx'
import { createRoute } from '../lib/routesApi'
import type { GpxData } from '../types'

export function UploadGpxPage() {
  const { session } = useAuth()
  const navigate = useNavigate()

  const [preview, setPreview] = useState<GpxData | null>(null)
  const [fileName, setFileName] = useState('')
  const [nom, setNom] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setError('')
    setPreview(null)
    setFileName(file.name)

    try {
      const text = await file.text()
      setPreview(parseGpx(text))
    } catch (err) {
      setError(toFriendlyError(err))
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!preview || !session) return

    setSaving(true)
    setError('')
    try {
      const route = await createRoute({ nom, gpx: preview, createdBy: session.user.id })
      navigate(`/routes/${route.id}`)
    } catch (err) {
      setError(toFriendlyError(err))
    } finally {
      setSaving(false)
    }
  }

  if (!session) {
    return (
      <div className="empty-state">
        <span className="big-emoji">🔒</span>
        <h1>Ajouter un parcours</h1>
        <p>Connecte-toi pour pouvoir ajouter un parcours.</p>
      </div>
    )
  }

  return (
    <div className="page-padding">
      <Link to="/" className="back-link">
        ⬅️ Retour à la carte
      </Link>
      <h1>📤 Ajouter un parcours</h1>
      <p className="notice">
        Exporte ta trace depuis Strava, Garmin Connect ou Coros (.gpx), puis importe-la ici. 🥾
      </p>

      <label className="dropzone card">
        <span style={{ fontSize: '2rem' }}>🗻</span>
        <strong>{fileName || 'Choisir un fichier .gpx'}</strong>
        <span className="notice">Clique ou dépose ton fichier ici</span>
        <input type="file" accept=".gpx" onChange={handleFileChange} />
      </label>

      {error && <p className="error">{error}</p>}

      {preview && (
        <form className="card gpx-preview" onSubmit={handleSave}>
          <h2>✅ Trace détectée</h2>
          <ul>
            <li className="stat-pill">📍 {preview.points.length} points</li>
            <li className="stat-pill">📏 {preview.distanceKm.toFixed(1)} km</li>
            <li className="stat-pill">
              ⛰️ +{preview.elevationGainM} m / -{preview.elevationLossM} m
            </li>
          </ul>
          <input
            type="text"
            placeholder="Nom du parcours 🏔️"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            required
          />
          <button type="submit" className="btn btn-primary btn-block" disabled={saving}>
            {saving ? '⏳ Enregistrement...' : '💾 Enregistrer ce parcours'}
          </button>
        </form>
      )}
    </div>
  )
}
