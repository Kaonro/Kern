import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { parseGpx } from '../lib/gpx'
import { createRoute } from '../lib/routesApi'
import type { GpxData } from '../types'

export function UploadGpxPage() {
  const { session } = useAuth()
  const navigate = useNavigate()

  const [preview, setPreview] = useState<GpxData | null>(null)
  const [nom, setNom] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setError('')
    setPreview(null)

    try {
      const text = await file.text()
      setPreview(parseGpx(text))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de lecture du fichier.')
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
      setError(err instanceof Error ? err.message : "Erreur lors de l'enregistrement.")
    } finally {
      setSaving(false)
    }
  }

  if (!session) {
    return (
      <div className="page-padding">
        <h1>Ajouter un parcours</h1>
        <p>Connecte-toi pour pouvoir ajouter un parcours.</p>
      </div>
    )
  }

  return (
    <div className="page-padding">
      <h1>Ajouter un parcours</h1>
      <p>Exporte ta trace depuis Strava, Garmin Connect ou Coros (.gpx), puis importe-la ici.</p>

      <input type="file" accept=".gpx" onChange={handleFileChange} />

      {error && <p className="error">{error}</p>}

      {preview && (
        <form className="gpx-preview" onSubmit={handleSave}>
          <ul>
            <li>{preview.points.length} points de trace</li>
            <li>{preview.distanceKm.toFixed(1)} km</li>
            <li>
              +{preview.elevationGainM} m / -{preview.elevationLossM} m
            </li>
          </ul>
          <input
            type="text"
            placeholder="Nom du parcours"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            required
          />
          <button type="submit" disabled={saving}>
            {saving ? 'Enregistrement...' : 'Enregistrer ce parcours'}
          </button>
        </form>
      )}
    </div>
  )
}
