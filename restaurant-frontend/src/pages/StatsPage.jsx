import { useState, useEffect } from 'react'
import axios from 'axios'
import StatsComponent from '../components/StatsComponent'

const StatsPage = ({ toast }) => {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        
        // 1. D'abord récupérer les stats de base
        const mainStatsResponse = await axios.get('http://localhost:5000/stats/recettes')
        
        let statsData = {
          ...mainStatsResponse.data
        }

        // 2. Récupérer l'histogramme dans une requête séparée
        try {
          const histogramResponse = await axios.get('http://localhost:5000/stats/histogramme')
          statsData.histogramme = histogramResponse.data || []
        } catch (histError) {
          console.warn("Histogram data not available:", histError)
          statsData.histogramme = [] // Assurer que l'histogramme est au moins un tableau vide
        }

        // 3. S'assurer que toutes les propriétés attendues sont présentes
        statsData = {
          total: statsData.total || 0,
          recettes_6mois: statsData.recettes_6mois || [],
          top_plats: statsData.top_plats || [],
          stats_par_type: statsData.stats_par_type || [],
          stats_par_jour: statsData.stats_par_jour || [],
          histogramme: statsData.histogramme || []
        }

        setStats(statsData)
        setError(null)
      } catch (err) {
        console.error("Failed to load stats:", err)
        setError(err)
        if (toast && toast.error) {
          toast.error('Erreur lors du chargement des statistiques')
        }
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [toast])

  if (loading) {
    return <div className="text-center py-8">Chargement des statistiques...</div>
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          <p>Impossible de charger les statistiques</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Réessayer
          </button>
        </div>
      </div>
    )
  }

  if (!stats) {
    return <div className="text-center py-8">Aucune donnée disponible</div>
  }

  return <StatsComponent stats={stats} />
}

export default StatsPage