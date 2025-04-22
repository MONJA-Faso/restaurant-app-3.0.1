import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const StatsComponent = ({ stats }) => {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">Statistiques du Restaurant</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-medium mb-4">Recette Totale</h3>
          <p className="text-3xl font-bold text-blue-600">
            {stats.total?.toLocaleString() || '0'} Ar
          </p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h3 className="text-lg font-medium mb-4">Recettes des 6 derniers mois</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={stats.recettes_6mois}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mois" />
              <YAxis />
              <Tooltip formatter={(value) => [`${value} Ar`, 'Montant']} />
              <Legend />
              <Bar dataKey="montant" name="Recette" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-medium mb-4">Plats les plus vendus</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-2 px-4 text-left">Plat</th>
                <th className="py-2 px-4 text-left">Quantité vendue</th>
              </tr>
            </thead>
            <tbody>
              {stats.top_plats.map((plat, index) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="py-2 px-4">{plat.nomplat}</td>
                  <td className="py-2 px-4">{plat.quantite}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default StatsComponent