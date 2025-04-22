import { useState } from 'react'
import Modal from './Modal'

const MenuComponent = ({ menuItems, onAdd, onUpdate, onDelete, onSearch, toast }) => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentItem, setCurrentItem] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [formData, setFormData] = useState({
    idplat: '',
    nomplat: '',
    pu: 0
  })

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: name === 'pu' ? parseInt(value) || 0 : value
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (currentItem) {
      onUpdate(currentItem.idplat, formData)
    } else {
      onAdd(formData)
    }
    setIsModalOpen(false)
  }

  const openEditModal = (item) => {
    setCurrentItem(item)
    setFormData({
      idplat: item.idplat,
      nomplat: item.nomplat,
      pu: item.pu
    })
    setIsModalOpen(true)
  }

  const openAddModal = () => {
    setCurrentItem(null)
    setFormData({
      idplat: '',
      nomplat: '',
      pu: 0
    })
    setIsModalOpen(true)
  }

  const handleSearch = (e) => {
    e.preventDefault()
    onSearch(searchTerm)
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Gestion du Menu</h2>
        <button
          onClick={openAddModal}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
        >
          <i className="fas fa-plus mr-2"></i>Ajouter un plat
        </button>
      </div>

      <div className="mb-6">
        <form onSubmit={handleSearch} className="flex">
          <input
            type="text"
            placeholder="Rechercher un plat..."
            className="flex-grow px-4 py-2 border rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-r-lg"
          >
            <i className="fas fa-search mr-2"></i>Rechercher
          </button>
        </form>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded-lg overflow-hidden">
          <thead className="bg-gray-800 text-white">
            <tr>
              <th className="py-3 px-4 text-left">ID</th>
              <th className="py-3 px-4 text-left">Nom du Plat</th>
              <th className="py-3 px-4 text-left">Prix (Ar)</th>
              <th className="py-3 px-4 text-left">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {menuItems.map((item) => (
              <tr key={item.idplat}>
                <td className="py-3 px-4">{item.idplat}</td>
                <td className="py-3 px-4">{item.nomplat}</td>
                <td className="py-3 px-4">{item.pu.toLocaleString()} Ar</td>
                <td className="py-3 px-4">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => openEditModal(item)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <i className="fas fa-edit"></i>
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm('Voulez-vous vraiment supprimer ce plat ?')) {
                          onDelete(item.idplat)
                        }
                      }}
                      className="text-red-600 hover:text-red-800"
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

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={currentItem ? 'Modifier Plat' : 'Ajouter Plat'}>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="idplat">
              ID Plat
            </label>
            <input
              type="text"
              id="idplat"
              name="idplat"
              value={formData.idplat}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded-lg"
              required
              disabled={!!currentItem}
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="nomplat">
              Nom du Plat
            </label>
            <input
              type="text"
              id="nomplat"
              name="nomplat"
              value={formData.nomplat}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded-lg"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="pu">
              Prix (Ar)
            </label>
            <input
              type="number"
              id="pu"
              name="pu"
              value={formData.pu}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded-lg"
              required
              min="0"
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
              {currentItem ? 'Modifier' : 'Ajouter'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default MenuComponent