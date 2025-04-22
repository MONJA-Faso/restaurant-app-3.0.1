import { useState, useEffect } from 'react'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import TablesPage from './pages/TablesPage'
import MenuPage from './pages/MenuPage'
import OrdersPage from './pages/OrdersPage'
import ReservationsPage from './pages/ReservationsPage'
import StatsPage from './pages/StatsPage'

function App() {
  const [activeTab, setActiveTab] = useState('tables')

  const renderPage = () => {
    switch (activeTab) {
      case 'tables':
        return <TablesPage toast={toast} />
      case 'menu':
        return <MenuPage toast={toast} />
      case 'orders':
        return <OrdersPage toast={toast} />
      case 'reservations':
        return <ReservationsPage toast={toast} />
      case 'stats':
        return <StatsPage toast={toast} />
      default:
        return <TablesPage toast={toast} />
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation */}
      <nav className="bg-blue-600 text-white shadow-lg">
        <div className="container mx-auto px-4 py-3">
          <h1 className="text-2xl font-bold">Restaurant Management</h1>
          <div className="flex mt-4 space-x-4 overflow-x-auto">
            <button
              onClick={() => setActiveTab('tables')}
              className={`px-4 py-2 rounded-lg ${activeTab === 'tables' ? 'bg-blue-800' : 'hover:bg-blue-700'}`}
            >
              <i className="fas fa-table mr-2"></i>Tables
            </button>
            <button
              onClick={() => setActiveTab('menu')}
              className={`px-4 py-2 rounded-lg ${activeTab === 'menu' ? 'bg-blue-800' : 'hover:bg-blue-700'}`}
            >
              <i className="fas fa-utensils mr-2"></i>Menu
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-4 py-2 rounded-lg ${activeTab === 'orders' ? 'bg-blue-800' : 'hover:bg-blue-700'}`}
            >
              <i className="fas fa-clipboard-list mr-2"></i>Commandes
            </button>
            <button
              onClick={() => setActiveTab('reservations')}
              className={`px-4 py-2 rounded-lg ${activeTab === 'reservations' ? 'bg-blue-800' : 'hover:bg-blue-700'}`}
            >
              <i className="fas fa-calendar-alt mr-2"></i>Réservations
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`px-4 py-2 rounded-lg ${activeTab === 'stats' ? 'bg-blue-800' : 'hover:bg-blue-700'}`}
            >
              <i className="fas fa-chart-bar mr-2"></i>Statistiques
            </button>
          </div>
        </div>
      </nav>

      {/* Contenu principal */}
      <main className="container mx-auto px-4 py-6">
        {renderPage()}
      </main>

      {/* Toast notifications */}
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </div>
  )
}

export default App