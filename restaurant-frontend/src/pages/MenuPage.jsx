import { useState, useEffect } from 'react'
import axios from 'axios'
import MenuComponent from '../components/MenuComponent'

const MenuPage = ({ toast }) => {
  const [menuItems, setMenuItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMenuItems()
  }, [])

  const fetchMenuItems = async () => {
    try {
      const response = await axios.get('http://localhost:5000/menu')
      if (response.status === 200) {
        setMenuItems(response.data)
      } else {
        toast.error('Réponse inattendue du serveur')
      }
    } catch (error) {
      console.error('Erreur détaillée:', error)
      toast.error(`Erreur lors du chargement du menu: ${error.message}`)
      if (error.response) {
        console.error('Réponse erreur:', error.response.data)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleAddItem = async (itemData) => {
    try {
      await axios.post('http://localhost:5000/menu', itemData)
      toast.success('Plat ajouté au menu avec succès')
      fetchMenuItems()
    } catch (error) {
      toast.error('Erreur lors de l\'ajout du plat')
    }
  }

  const handleUpdateItem = async (id, itemData) => {
    try {
      await axios.put(`http://localhost:5000/menu/${id}`, itemData)
      toast.success('Plat mis à jour avec succès')
      fetchMenuItems()
    } catch (error) {
      toast.error('Erreur lors de la mise à jour du plat')
    }
  }

  const handleDeleteItem = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/menu/${id}`)
      toast.success('Plat supprimé avec succès')
      fetchMenuItems()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erreur lors de la suppression du plat')
    }
  }

  const handleSearch = async (term) => {
    try {
      if (!term) {
        fetchMenuItems() // Si le terme est vide, recharger tout le menu
        return
      }
      const response = await axios.get(`http://localhost:5000/recherche/menu?terme=${term}`)
      setMenuItems(response.data)
    } catch (error) {
      toast.error('Erreur lors de la recherche')
      console.error('Erreur recherche:', error)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Chargement du menu...</div>
  }

  return (
    <MenuComponent
      menuItems={menuItems}
      onAdd={handleAddItem}
      onUpdate={handleUpdateItem}
      onDelete={handleDeleteItem}
      onSearch={handleSearch}
      toast={toast}
    />
  )
}

export default MenuPage