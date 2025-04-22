import { useState } from 'react'
import Modal from './Modal'

const TableComponent = ({ tables, onAdd, onUpdate, onDelete, onStatusChange, toast }) => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentTable, setCurrentTable] = useState(null)
  const [formData, setFormData] = useState({
    idtable: '',
    designation: '',
    occupation: false
  })

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (currentTable) {
      onUpdate(currentTable.idtable, formData)
    } else {
      onAdd(formData)
    }
    setIsModalOpen(false)
  }

  const openEditModal = (table) => {
    setCurrentTable(table)
    setFormData({
      idtable: table.idtable,
      designation: table.designation,
      occupation: table.occupation
    })
    setIsModalOpen(true)
  }

  const openAddModal = () => {
    setCurrentTable(null)
    setFormData({
      idtable: '',
      designation: '',
      occupation: false
    })
    setIsModalOpen(true)
  }

  const toggleStatus = (idtable, currentStatus) => {
    if (window.confirm(`Voulez-vous vraiment ${currentStatus ? 'libérer' : 'occuper'} cette table ?`)) {
      onStatusChange(idtable, !currentStatus)
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Gestion des Tables</h2>
        <button
          onClick={openAddModal}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
        >
          <i className="fas fa-plus mr-2"></i>Ajouter une table
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tables.map((table) => (
          <div key={table.idtable} className="bg-white rounded-lg shadow-md p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-lg">{table.designation}</h3>
                <p className="text-gray-600">ID: {table.idtable}</p>
              </div>
              <span
                className={`px-2 py-1 rounded-full text-xs font-semibold ${table.occupation ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}
              >
                {table.occupation ? 'Occupée' : 'Libre'}
              </span>
            </div>
            <div className="mt-4 flex space-x-2">
              <button
                onClick={() => toggleStatus(table.idtable, table.occupation)}
                className={`px-3 py-1 rounded ${table.occupation ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-red-100 text-red-800 hover:bg-red-200'}`}
              >
                {table.occupation ? 'Libérer' : 'Occuper'}
              </button>
              <button
                onClick={() => openEditModal(table)}
                className="px-3 py-1 rounded bg-blue-100 text-blue-800 hover:bg-blue-200"
              >
                Modifier
              </button>
              <button
                onClick={() => {
                  if (window.confirm('Voulez-vous vraiment supprimer cette table ?')) {
                    onDelete(table.idtable)
                  }
                }}
                className="px-3 py-1 rounded bg-red-100 text-red-800 hover:bg-red-200"
              >
                Supprimer
              </button>
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={currentTable ? 'Modifier Table' : 'Ajouter Table'}>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="idtable">
              ID Table
            </label>
            <input
              type="text"
              id="idtable"
              name="idtable"
              value={formData.idtable}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded-lg"
              required
              disabled={!!currentTable}
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="designation">
              Désignation
            </label>
            <input
              type="text"
              id="designation"
              name="designation"
              value={formData.designation}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded-lg"
              required
            />
          </div>
          {currentTable && (
            <div className="mb-4 flex items-center">
              <input
                type="checkbox"
                id="occupation"
                name="occupation"
                checked={formData.occupation}
                onChange={handleInputChange}
                className="mr-2"
              />
              <label htmlFor="occupation">Occupée</label>
            </div>
          )}
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
              {currentTable ? 'Modifier' : 'Ajouter'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default TableComponent