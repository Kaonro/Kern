import { useState } from 'react'
import { parseGpx } from '../lib/gpx'
import type { GpxData } from '../types'

export function UploadGpxPage() {
  const [preview, setPreview] = useState<GpxData | null>(null)
  const [fileName, setFileName] = useState('')
  const [error, setError] = useState('')

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
      setError(err instanceof Error ? err.message : 'Erreur de lecture du fichier.')
    }
  }

  return (
    <div className="page-padding">
      <h1>Ajouter un parcours</h1>
      <p>Exporte ta trace depuis Strava, Garmin Connect ou Coros (.gpx), puis importe-la ici.</p>

      <input type="file" accept=".gpx" onChange={handleFileChange} />

      {error && <p className="error">{error}</p>}

      {preview && (
        <div className="gpx-preview">
          <h2>{fileName}</h2>
          <ul>
            <li>{preview.points.length} points de trace</li>
            <li>{preview.distanceKm.toFixed(1)} km</li>
            <li>+{preview.elevationGainM} m / -{preview.elevationLossM} m</li>
          </ul>
          <p className="notice">
            Aperçu local uniquement pour l'instant — la sauvegarde vers la base de données arrivera une fois
            Supabase branché.
          </p>
        </div>
      )}
    </div>
  )
}
