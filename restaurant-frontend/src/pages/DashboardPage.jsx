// src/pages/DashboardPage.jsx
import { useState } from 'react'
import { toast } from 'react-toastify'
import TablesPage from './TablesPage'
import MenuPage from './MenuPage'
import OrdersPage from './OrdersPage'
import ReservationsPage from './ReservationsPage'
import StatsPage from './StatsPage'

function DashboardPage() {
  const [activeTab, setActiveTab] = useState('tables')

  const renderPage = () => {
    switch (activeTab) {
      case 'tables': return <TablesPage toast={toast} />
      case 'menu': return <MenuPage toast={toast} />
      case 'orders': return <OrdersPage toast={toast} />
      case 'reservations': return <ReservationsPage toast={toast} />
      case 'stats': return <StatsPage toast={toast} />
      default: return <TablesPage toast={toast} />
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-sky-700 text-white shadow-lg">
        <div className="container mx-auto px-4 py-3">
          <h1 className="text-2xl font-bold">Restaurant Management</h1>
          <div className="flex mt-4 space-x-4 overflow-x-auto">
            <button onClick={() => setActiveTab('tables')} className={`px-4 py-2 rounded-lg ${activeTab === 'tables' ? 'bg-blue-800' : 'hover:bg-blue-700'}`}>Tables</button>
            <button onClick={() => setActiveTab('menu')} className={`px-4 py-2 rounded-lg ${activeTab === 'menu' ? 'bg-blue-800' : 'hover:bg-blue-700'}`}>Menu</button>
            <button onClick={() => setActiveTab('orders')} className={`px-4 py-2 rounded-lg ${activeTab === 'orders' ? 'bg-blue-800' : 'hover:bg-blue-700'}`}>Commandes</button>
            <button onClick={() => setActiveTab('reservations')} className={`px-4 py-2 rounded-lg ${activeTab === 'reservations' ? 'bg-blue-800' : 'hover:bg-blue-700'}`}>Réservations</button>
            <button onClick={() => setActiveTab('stats')} className={`px-4 py-2 rounded-lg ${activeTab === 'stats' ? 'bg-blue-800' : 'hover:bg-blue-700'}`}>Statistiques</button>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-6">
        {renderPage()}
      </main>
    </div>
  )
}

export default DashboardPage
