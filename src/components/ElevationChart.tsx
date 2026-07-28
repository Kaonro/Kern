import { haversineMeters } from '../lib/haversine'
import type { TrackPoint } from '../types'

interface ElevationChartProps {
  points: TrackPoint[]
}

const WIDTH = 300
const HEIGHT = 120
const PADDING_TOP = 6
const PADDING_BOTTOM = 4

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
  const mid = (min + max) / 2

  const chartHeight = HEIGHT - PADDING_TOP - PADDING_BOTTOM
  const yFor = (ele: number) => PADDING_TOP + chartHeight - ((ele - min) / range) * chartHeight

  const coords = withEle.map((p, i) => {
    const x = (distances[i] / totalDistance) * WIDTH
    return `${x.toFixed(1)},${yFor(p.ele).toFixed(1)}`
  })

  const linePath = `M${coords.join(' L')}`
  const areaPath = `${linePath} L${WIDTH},${PADDING_TOP + chartHeight} L0,${PADDING_TOP + chartHeight} Z`
  const levels = [max, mid, min]

  return (
    <div className="elevation-chart-wrap">
      {/* Libellés en HTML, pas en <text> SVG : le SVG est étiré indépendamment en x/y
          (preserveAspectRatio="none") pour remplir la largeur, ce qui déformait les
          chiffres et les rendait flous/tassés. */}
      <div className="elevation-axis">
        {levels.map((value, i) => (
          <span key={i} className="elevation-axis-label" style={{ top: `${(yFor(value) / HEIGHT) * 100}%` }}>
            {Math.round(value)} m
          </span>
        ))}
      </div>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="elevation-chart"
        preserveAspectRatio="none"
        role="img"
        aria-label={`Profil d'élévation du parcours, de ${Math.round(min)} à ${Math.round(max)} mètres d'altitude`}
      >
        {levels.map((value, i) => (
          <line key={i} x1={0} y1={yFor(value)} x2={WIDTH} y2={yFor(value)} className="elevation-gridline" />
        ))}
        <path d={areaPath} className="elevation-area" />
        <path d={linePath} className="elevation-line" fill="none" />
      </svg>
    </div>
  )
}
