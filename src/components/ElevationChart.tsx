import type { TrackPoint } from '../types'

interface ElevationChartProps {
  points: TrackPoint[]
}

const WIDTH = 300
const HEIGHT = 70

export function ElevationChart({ points }: ElevationChartProps) {
  const elevations = points.map((p) => p.ele).filter((e): e is number => e !== undefined)
  if (elevations.length < 2) return null

  const min = Math.min(...elevations)
  const max = Math.max(...elevations)
  const range = max - min || 1
  const step = WIDTH / (elevations.length - 1)

  const coords = elevations.map((ele, i) => {
    const x = i * step
    const y = HEIGHT - ((ele - min) / range) * HEIGHT
    return `${x.toFixed(1)},${y.toFixed(1)}`
  })

  const linePath = `M${coords.join(' L')}`
  const areaPath = `${linePath} L${WIDTH},${HEIGHT} L0,${HEIGHT} Z`

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className="elevation-chart"
      preserveAspectRatio="none"
      role="img"
      aria-label="Profil d'élévation du parcours"
    >
      <path d={areaPath} className="elevation-area" />
      <path d={linePath} className="elevation-line" fill="none" />
    </svg>
  )
}
