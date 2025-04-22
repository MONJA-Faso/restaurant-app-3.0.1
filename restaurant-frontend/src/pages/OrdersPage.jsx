import { useState, useEffect } from 'react';
import axios from 'axios';
import Modal from '../components/Modal';

const API_URL = 'http://localhost:5000';

const OrderComponent = ({ 
  toast = { error: () => {} } 
}) => {
  const [orders, setOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [tables, setTables] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    idcom: '',
    nomcli: '',
    typecom: 'sur place',
    idtable: '',
    datecom: new Date().toISOString().split('T')[0],
    plats: [{ idplat: '', quantite: 1 }]
  });

  // Charger les données initiales
  useEffect(() => {
    fetchOrders();
    fetchMenus();
    fetchTables();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/commandes`);
      setOrders(response.data);
    } catch (err) {
      console.error('Erreur lors du chargement des commandes:', err);
      toast.error('Impossible de charger les commandes');
    } finally {
      setLoading(false);
    }
  };

  const fetchMenus = async () => {
    try {
      const response = await axios.get(`${API_URL}/menu`);
      setMenuItems(response.data);
    } catch (err) {
      console.error('Erreur lors du chargement du menu:', err);
      toast.error('Impossible de charger le menu');
    }
  };

  const fetchTables = async () => {
    try {
      const response = await axios.get(`${API_URL}/tables`);
      setTables(response.data);
    } catch (err) {
      console.error('Erreur lors du chargement des tables:', err);
      toast.error('Impossible de charger les tables');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handlePlatChange = (index, field, value) => {
    const newPlats = [...formData.plats];
    newPlats[index][field] = value;
    setFormData({
      ...formData,
      plats: newPlats
    });
  };

  const addPlat = () => {
    setFormData({
      ...formData,
      plats: [...formData.plats, { idplat: '', quantite: 1 }]
    });
  };

  const removePlat = (index) => {
    if (formData.plats.length <= 1) return;
    const newPlats = [...formData.plats];
    newPlats.splice(index, 1);
    setFormData({
      ...formData,
      plats: newPlats
    });
  };

  const onAdd = async (orderData) => {
    try {
      setLoading(true);
      // Générer un ID unique si non fourni
      if (!orderData.idcom) {
        orderData.idcom = `COM${Date.now()}`;
      }
      
      const response = await axios.post(`${API_URL}/commandes`, orderData);
      setOrders([...orders, response.data]);
      fetchTables(); // Rafraîchir l'état des tables
      toast.success('Commande créée avec succès');
    } catch (err) {
      console.error('Erreur lors de la création de la commande:', err);
      toast.error(err.response?.data?.error || 'Erreur lors de la création de la commande');
    } finally {
      setLoading(false);
    }
  };

  const onUpdate = async (id, orderData) => {
    try {
      setLoading(true);
      await axios.put(`${API_URL}/commandes/${id}`, orderData);
      setOrders(orders.map(order => order.idcom === id ? { ...order, ...orderData } : order));
      fetchTables(); // Rafraîchir l'état des tables
      toast.success('Commande modifiée avec succès');
    } catch (err) {
      console.error('Erreur lors de la modification de la commande:', err);
      toast.error(err.response?.data?.error || 'Erreur lors de la modification de la commande');
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async (id) => {
    try {
      setLoading(true);
      await axios.delete(`${API_URL}/commandes/${id}`);
      setOrders(orders.filter(order => order.idcom !== id));
      fetchTables(); // Rafraîchir l'état des tables
      toast.success('Commande supprimée avec succès');
    } catch (err) {
      console.error('Erreur lors de la suppression de la commande:', err);
      toast.error(err.response?.data?.error || 'Erreur lors de la suppression de la commande');
    } finally {
      setLoading(false);
    }
  };

  const onGenerateInvoice = async (id) => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/commandes/${id}/facture`, {
        responseType: 'blob'
      });
      
      // Créer un URL pour le PDF et l'ouvrir dans un nouvel onglet
      const fileURL = window.URL.createObjectURL(new Blob([response.data]));
      const fileLink = document.createElement('a');
      fileLink.href = fileURL;
      fileLink.setAttribute('download', `facture_${id}.pdf`);
      document.body.appendChild(fileLink);
      fileLink.click();
      fileLink.remove();
      
      toast.success('Facture générée avec succès');
    } catch (err) {
      console.error('Erreur lors de la génération de la facture:', err);
      toast.error(err.response?.data?.error || 'Erreur lors de la génération de la facture');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validation
    if (formData.plats.some(plat => !plat.idplat)) {
      toast.error('Veuillez sélectionner un plat pour chaque ligne');
      return;
    }
    
    if (formData.typecom === 'sur place' && !formData.idtable) {
      toast.error('Veuillez sélectionner une table pour les commandes sur place');
      return;
    }

    if (currentOrder) {
      onUpdate(currentOrder.idcom, formData);
    } else {
      onAdd(formData);
    }
    setIsModalOpen(false);
  };

  const openEditModal = (order) => {
    setCurrentOrder(order);
    setFormData({
      idcom: order.idcom,
      nomcli: order.nomcli,
      typecom: order.typecom,
      idtable: order.idtable || '',
      datecom: order.datecom,
      plats: order.plats || [{ idplat: '', quantite: 1 }]
    });
    setIsModalOpen(true);
  };

  const openAddModal = () => {
    setCurrentOrder(null);
    setFormData({
      idcom: '',
      nomcli: '',
      typecom: 'sur place',
      idtable: '',
      datecom: new Date().toISOString().split('T')[0],
      plats: [{ idplat: '', quantite: 1 }]
    });
    setIsModalOpen(true);
  };

  const calculateOrderTotal = (order) => {
    if (!order.plats) return 0;
    return order.plats.reduce((total, plat) => {
      const menuItem = menuItems.find(item => item.idplat === plat.idplat);
      return total + (menuItem?.pu || 0) * plat.quantite;
    }, 0);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Gestion des Commandes</h2>
        <button
          onClick={openAddModal}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          disabled={loading}
        >
          {loading ? 'Chargement...' : (
            <>
              <i className="fas fa-plus mr-2"></i>Ajouter une commande
            </>
          )}
        </button>
      </div>

      {loading && orders.length === 0 ? (
        <div className="text-center py-8">Chargement des commandes...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded-lg overflow-hidden">
            <thead className="bg-gray-800 text-white">
              <tr>
                <th className="py-3 px-4 text-left">ID</th>
                <th className="py-3 px-4 text-left">Client</th>
                <th className="py-3 px-4 text-left">Plats</th>
                <th className="py-3 px-4 text-left">Type</th>
                <th className="py-3 px-4 text-left">Table</th>
                <th className="py-3 px-4 text-left">Total</th>
                <th className="py-3 px-4 text-left">Date</th>
                <th className="py-3 px-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {orders.map((order) => (
                <tr key={order.idcom}>
                  <td className="py-3 px-4">{order.idcom}</td>
                  <td className="py-3 px-4">{order.nomcli}</td>
                  <td className="py-3 px-4">
                    {order.plats ? (
                      <div className="flex flex-col">
                        {order.plats.map((plat, index) => {
                          const menuItem = menuItems.find(item => item.idplat === plat.idplat);
                          return (
                            <div key={index}>
                              {plat.quantite}x {menuItem?.nomplat || plat.idplat} ({menuItem?.pu || '?'} Ar)
                            </div>
                          );
                        })}
                      </div>
                    ) : '-'}
                  </td>
                  <td className="py-3 px-4 capitalize">{order.typecom}</td>
                  <td className="py-3 px-4">{order.idtable || '-'}</td>
                  <td className="py-3 px-4">{calculateOrderTotal(order)} Ar</td>
                  <td className="py-3 px-4">{order.datecom}</td>
                  <td className="py-3 px-4">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openEditModal(order)}
                        className="text-blue-600 hover:text-blue-800"
                        title="Modifier"
                        disabled={loading}
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      <button
                        onClick={() => onGenerateInvoice(order.idcom)}
                        className="text-green-600 hover:text-green-800"
                        title="Générer facture"
                        disabled={loading}
                      >
                        <i className="fas fa-file-invoice"></i>
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm('Voulez-vous vraiment supprimer cette commande ?')) {
                            onDelete(order.idcom);
                          }
                        }}
                        className="text-red-600 hover:text-red-800"
                        title="Supprimer"
                        disabled={loading}
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
      )}

      <Modal isOpen={isModalOpen} onClose={() => !loading && setIsModalOpen(false)} title={currentOrder ? 'Modifier Commande' : 'Ajouter Commande'}>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="idcom">
              ID Commande
            </label>
            <input
              type="text"
              id="idcom"
              name="idcom"
              value={formData.idcom}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded-lg"
              required
              disabled={!!currentOrder || loading}
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
              disabled={loading}
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Plats commandés</label>
            {formData.plats.map((plat, index) => (
              <div key={index} className="flex mb-2 gap-2">
                <select
                  value={plat.idplat}
                  onChange={(e) => handlePlatChange(index, 'idplat', e.target.value)}
                  className="flex-1 px-3 py-2 border rounded-lg"
                  required
                  disabled={loading}
                >
                  <option value="">Sélectionner un plat</option>
                  {menuItems.map((item) => (
                    <option key={item.idplat} value={item.idplat}>
                      {item.nomplat} - {item.pu} Ar
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min="1"
                  value={plat.quantite}
                  onChange={(e) => handlePlatChange(index, 'quantite', parseInt(e.target.value))}
                  className="w-20 px-3 py-2 border rounded-lg"
                  disabled={loading}
                />
                {formData.plats.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removePlat(index)}
                    className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                    disabled={loading}
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addPlat}
              className="mt-2 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
              disabled={loading}
            >
              <i className="fas fa-plus mr-2"></i>Ajouter un plat
            </button>
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="typecom">
              Type de Commande
            </label>
            <select
              id="typecom"
              name="typecom"
              value={formData.typecom}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded-lg"
              required
              disabled={loading}
            >
              <option value="sur place">Sur place</option>
              <option value="à emporter">À emporter</option>
            </select>
          </div>

          {formData.typecom === 'sur place' && (
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
                required={formData.typecom === 'sur place'}
                disabled={loading}
              >
                <option value="">Sélectionner une table</option>
                {tables.map((table) => (
                  <option 
                    key={table.idtable} 
                    value={table.idtable}
                    disabled={table.occupation}
                  >
                    {table.designation} ({table.occupation ? 'Occupée' : 'Libre'})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="datecom">
              Date
            </label>
            <input
              type="date"
              id="datecom"
              name="datecom"
              value={formData.datecom}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded-lg"
              required
              disabled={loading}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400"
              disabled={loading}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? 'Traitement...' : (currentOrder ? 'Modifier' : 'Ajouter')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default OrderComponent;