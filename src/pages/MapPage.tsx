import { useNavigate } from 'react-router-dom'
import { RouteMap } from '../components/RouteMap'
import { MOCK_ROUTES } from '../lib/mockData'

export function MapPage() {
  const navigate = useNavigate()

  return (
    <div className="page-map">
      <RouteMap routes={MOCK_ROUTES} onSelectRoute={(id) => navigate(`/routes/${id}`)} />
    </div>
  )
}
