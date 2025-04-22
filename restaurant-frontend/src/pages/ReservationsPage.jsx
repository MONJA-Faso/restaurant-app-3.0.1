import { useState, useEffect } from 'react'
import axios from 'axios'
import ReservationComponent from '../components/ReservationComponent'

const ReservationsPage = ({ toast }) => {
  const [reservations, setReservations] = useState([])
  const [tables, setTables] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [reservationsRes, tablesRes] = await Promise.all([
        axios.get('http://localhost:5000/reservations'),
        axios.get('http://localhost:5000/tables')
      ])
      setReservations(reservationsRes.data)
      setTables(tablesRes.data)
      setLoading(false)
    } catch (error) {
      toast.error('Erreur lors du chargement des données')
      setLoading(false)
    }
  }

  const handleAddReservation = async (reservationData) => {
    try {
      // Ajouter la date de fin si elle n'est pas fournie (défaut: +2h)
      if (!reservationData.date_reserve && reservationData.date_de_reserv) {
        const dateObj = new Date(reservationData.date_de_reserv)
        dateObj.setHours(dateObj.getHours() + 2)
        reservationData.date_reserve = dateObj.toISOString()
      }

      await axios.post('http://localhost:5000/reservations', reservationData)
      toast.success('Réservation ajoutée avec succès')
      fetchData()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erreur lors de l\'ajout de la réservation')
    }
  }

  const handleUpdateReservation = async (id, reservationData) => {
    try {
      await axios.put(`http://localhost:5000/reservations/${id}`, reservationData)
      toast.success('Réservation mise à jour avec succès')
      fetchData()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erreur lors de la mise à jour de la réservation')
    }
  }

  const handleDeleteReservation = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/reservations/${id}`)
      toast.success('Réservation supprimée avec succès')
      fetchData()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erreur lors de la suppression de la réservation')
    }
  }

  if (loading) {
    return <div className="text-center py-8">Chargement des réservations...</div>
  }

  return (
    <ReservationComponent
      reservations={reservations}
      tables={tables}
      onAdd={handleAddReservation}
      onUpdate={handleUpdateReservation}
      onDelete={handleDeleteReservation}
      toast={toast}
    />
  )
}

export default ReservationsPage