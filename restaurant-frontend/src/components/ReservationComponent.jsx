import { useState } from 'react'
import Modal from './Modal'

const ReservationComponent = ({ reservations, tables, onAdd, onUpdate, onDelete, toast }) => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentReservation, setCurrentReservation] = useState(null)
  const [formData, setFormData] = useState({
    idreserv: '',
    idtable: '',
    date_de_reserv: new Date().toISOString().slice(0, 16),
    date_reserve: new Date(Date.now() + 3600000).toISOString().slice(0, 16),
    nomcli: ''
  })

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (currentReservation) {
      onUpdate(currentReservation.idreserv, formData)
    } else {
      onAdd(formData)
    }
    setIsModalOpen(false)
  }

  const openEditModal = (reservation) => {
    setCurrentReservation(reservation)
    setFormData({
      idreserv: reservation.idreserv,
      idtable: reservation.idtable,
      date_de_reserv: reservation.date_de_reserv.replace(' ', 'T').slice(0, 16),
      date_reserve: reservation.date_reserve.replace(' ', 'T').slice(0, 16),
      nomcli: reservation.nomcli
    })
    setIsModalOpen(true)
  }

  const openAddModal = () => {
    setCurrentReservation(null)
    setFormData({
      idreserv: '',
      idtable: '',
      date_de_reserv: new Date().toISOString().slice(0, 16),
      date_reserve: new Date(Date.now() + 3600000).toISOString().slice(0, 16),
      nomcli: ''
    })
    setIsModalOpen(true)
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Gestion des Réservations</h2>
        <button
          onClick={openAddModal}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
        >
          <i className="fas fa-plus mr-2"></i>Ajouter une réservation
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded-lg overflow-hidden">
          <thead className="bg-gray-800 text-white">
            <tr>
              <th className="py-3 px-4 text-left">ID</th>
              <th className="py-3 px-4 text-left">Client</th>
              <th className="py-3 px-4 text-left">Table</th>
              <th className="py-3 px-4 text-left">Début</th>
              <th className="py-3 px-4 text-left">Fin</th>
              <th className="py-3 px-4 text-left">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {reservations.map((reservation) => (
              <tr key={reservation.idreserv}>
                <td className="py-3 px-4">{reservation.idreserv}</td>
                <td className="py-3 px-4">{reservation.nomcli}</td>
                <td className="py-3 px-4">{reservation.designation} (ID: {reservation.idtable})</td>
                <td className="py-3 px-4">{reservation.date_de_reserv}</td>
                <td className="py-3 px-4">{reservation.date_reserve}</td>
                <td className="py-3 px-4">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => openEditModal(reservation)}
                      className="text-blue-600 hover:text-blue-800"
                      title="Modifier"
                    >
                      <i className="fas fa-edit"></i>
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm('Voulez-vous vraiment supprimer cette réservation ?')) {
                          onDelete(reservation.idreserv)
                        }
                      }}
                      className="text-red-600 hover:text-red-800"
                      title="Supprimer"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={currentReservation ? 'Modifier Réservation' : 'Ajouter Réservation'}>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="idreserv">
              ID Réservation
            </label>
            <input
              type="text"
              id="idreserv"
              name="idreserv"
              value={formData.idreserv}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded-lg"
              required
              disabled={!!currentReservation}
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="nomcli">
              Nom du Client
            </label>
            <input
              type="text"
              id="nomcli"
              name="nomcli"
              value={formData.nomcli}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded-lg"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="idtable">
              Table
            </label>
            <select
              id="idtable"
              name="idtable"
              value={formData.idtable}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded-lg"
              required
            >
              <option value="">Sélectionner une table</option>
              {tables.map((table) => (
                <option key={table.idtable} value={table.idtable}>
                  {table.designation} (ID: {table.idtable})
                </option>
              ))}
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="date_de_reserv">
              Date et Heure de Début
            </label>
            <input
              type="datetime-local"
              id="date_de_reserv"
              name="date_de_reserv"
              value={formData.date_de_reserv}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded-lg"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="date_reserve">
              Date et Heure de Fin
            </label>
            <input
              type="datetime-local"
              id="date_reserve"
              name="date_reserve"
              value={formData.date_reserve}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded-lg"
              required
            />
          </div>
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {currentReservation ? 'Modifier' : 'Ajouter'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default ReservationComponent