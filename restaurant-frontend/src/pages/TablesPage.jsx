import { useState, useEffect } from 'react'
import TableComponent from '../components/TableComponent'
import axios from 'axios'

const TablesPage = ({ toast }) => {
  const [tables, setTables] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTables()
  }, [])

  const fetchTables = async () => {
    try {
      const response = await axios.get('http://localhost:5000/tables')
      setTables(response.data)
      setLoading(false)
    } catch (error) {
      toast.error('Erreur lors du chargement des tables')
      setLoading(false)
    }
  }

  const handleAddTable = async (tableData) => {
    try {
      await axios.post('http://localhost:5000/tables', tableData)
      toast.success('Table ajoutée avec succès')
      fetchTables()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erreur lors de l\'ajout de la table')
    }
  }

  const handleUpdateTable = async (id, tableData) => {
    try {
      await axios.put(`http://localhost:5000/tables/${id}`, tableData)
      toast.success('Table mise à jour avec succès')
      fetchTables()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erreur lors de la mise à jour de la table')
    }
  }

  const handleDeleteTable = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/tables/${id}`)
      toast.success('Table supprimée avec succès')
      fetchTables()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erreur lors de la suppression de la table')
    }
  }

  const handleStatusChange = async (id, status) => {
    try {
      if (status === false) {
        await axios.put(`http://localhost:5000/tables/liberer/${id}`)
      } else {
        await axios.put(`http://localhost:5000/tables/${id}`, { occupation: status })
      }
      toast.success('Statut de la table mis à jour')
      fetchTables()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erreur lors du changement de statut')
    }
  }

  if (loading) {
    return <div className="text-center py-8">Chargement des tables...</div>
  }

  return (
    <TableComponent
      tables={tables}
      onAdd={handleAddTable}
      onUpdate={handleUpdateTable}
      onDelete={handleDeleteTable}
      onStatusChange={handleStatusChange}
      toast={toast}
    />
  )
}

export default TablesPage