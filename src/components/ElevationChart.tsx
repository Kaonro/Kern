import { haversineMeters } from '../lib/haversine'
import type { TrackPoint } from '../types'

interface ElevationChartProps {
  points: TrackPoint[]
}

const WIDTH = 300
const HEIGHT = 120
const PADDING_LEFT = 40
const PADDING_TOP = 12
const PADDING_BOTTOM = 8

export function ElevationChart({ points }: ElevationChartProps) {
  const withEle = points.filter((p): p is TrackPoint & { ele: number } => p.ele !== undefined)
  if (withEle.length < 2) return null

  // Distance cumulée réelle plutôt que l'index du point : les traces GPS ont souvent plus
  // de points par mètre dans les virages/passages techniques que sur les lignes droites,
  // un axe par index écraserait donc les longs faux-plats et exagérerait le reste.
  const distances = [0]
  for (let i = 1; i < withEle.length; i++) {
    distances.push(distances[i - 1] + haversineMeters(withEle[i - 1], withEle[i]))
  }
  const totalDistance = distances[distances.length - 1] || 1

  const elevations = withEle.map((p) => p.ele)
  const min = Math.min(...elevations)
  const max = Math.max(...elevations)
  const range = max - min || 1

  const chartWidth = WIDTH - PADDING_LEFT
  const chartHeight = HEIGHT - PADDING_TOP - PADDING_BOTTOM
  const baseY = PADDING_TOP + chartHeight

  const yFor = (ele: number) => PADDING_TOP + chartHeight - ((ele - min) / range) * chartHeight

  const coords = withEle.map((p, i) => {
    const x = PADDING_LEFT + (distances[i] / totalDistance) * chartWidth
    return `${x.toFixed(1)},${yFor(p.ele).toFixed(1)}`
  })

  const linePath = `M${coords.join(' L')}`
  const areaPath = `${linePath} L${WIDTH},${baseY} L${PADDING_LEFT},${baseY} Z`
  const midElevation = (min + max) / 2

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className="elevation-chart"
      preserveAspectRatio="none"
      role="img"
      aria-label={`Profil d'élévation du parcours, de ${Math.round(min)} à ${Math.round(max)} mètres d'altitude`}
    >
      {[min, midElevation, max].map((value, i) => (
        <g key={i}>
          <line x1={PADDING_LEFT} y1={yFor(value)} x2={WIDTH} y2={yFor(value)} className="elevation-gridline" />
          <text x={1} y={yFor(value) + 3.5} className="elevation-axis-label">
            {Math.round(value)} m
          </text>
        </g>
      ))}
      <path d={areaPath} className="elevation-area" />
      <path d={linePath} className="elevation-line" fill="none" />
    </svg>
  )
}
