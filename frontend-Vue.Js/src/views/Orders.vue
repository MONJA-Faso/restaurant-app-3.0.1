<script setup>
import { ref, onMounted, computed } from 'vue';
import { getOrders, getOrder, createOrder, updateOrder, deleteOrder, generateInvoice, getTables, getMenu } from '../services/api';

const orders = ref([]);
const tables = ref([]);
const menuItems = ref([]);
const loading = ref(true);
const showModal = ref(false);
const editMode = ref(false);
const currentOrder = ref({
  idcom: '',
  nomcli: '',
  typecom: 'sur place',
  idtable: null,
  statut: 'en attente',
  plats: []
});
const error = ref('');
const dateFilter = ref({
  date_debut: '',
  date_fin: ''
});

const currentPlat = ref({
  idplat: '',
  quantite: 1
});

const fetchOrders = async () => {
  try {
    loading.value = true;
    const response = await getOrders(dateFilter.value);
    orders.value = response.data;
    loading.value = false;
  } catch (err) {
    console.error('Erreur lors du chargement des commandes:', err);
    error.value = 'Erreur lors du chargement des commandes';
    loading.value = false;
  }
};

const fetchTables = async () => {
  try {
    const response = await getTables();
    tables.value = response.data;
  } catch (err) {
    console.error('Erreur lors du chargement des tables:', err);
  }
};

const fetchMenu = async () => {
  try {
    const response = await getMenu();
    menuItems.value = response.data;
  } catch (err) {
    console.error('Erreur lors du chargement du menu:', err);
  }
};

onMounted(async () => {
  await Promise.all([fetchOrders(), fetchTables(), fetchMenu()]);
});

const openAddModal = () => {
  const now = new Date();
  const orderId = 'C' + now.getTime().toString().slice(-8);
  
  currentOrder.value = {
    idcom: orderId,
    nomcli: '',
    typecom: 'sur place',
    idtable: null,
    statut: 'en attente',
    plats: []
  };
  currentPlat.value = { idplat: '', quantite: 1 };
  editMode.value = false;
  showModal.value = true;
};

const openEditModal = async (orderId) => {
  try {
    loading.value = true;
    const response = await getOrder(orderId);
    currentOrder.value = {
      ...response.data,
      plats: response.data.plats.map(plat => ({
        idplat: plat.idplat,
        quantite: plat.quantite
      }))
    };
    currentPlat.value = { idplat: '', quantite: 1 };
    editMode.value = true;
    showModal.value = true;
    loading.value = false;
  } catch (err) {
    console.error('Erreur lors du chargement de la commande:', err);
    alert('Erreur lors du chargement de la commande');
    loading.value = false;
  }
};

const closeModal = () => {
  showModal.value = false;
  error.value = '';
};

const addPlat = () => {
  if (!currentPlat.value.idplat || currentPlat.value.quantite < 1) {
    error.value = 'Veuillez sélectionner un plat et une quantité valide';
    return;
  }

  // Vérifier si le plat existe déjà dans la commande
  const existingIndex = currentOrder.value.plats.findIndex(
    plat => plat.idplat === currentPlat.value.idplat
  );

  if (existingIndex >= 0) {
    // Mettre à jour la quantité si le plat existe déjà
    currentOrder.value.plats[existingIndex].quantite += currentPlat.value.quantite;
  } else {
    // Ajouter le nouveau plat
    currentOrder.value.plats.push({ ...currentPlat.value });
  }

  // Réinitialiser le formulaire d'ajout de plat
  currentPlat.value = { idplat: '', quantite: 1 };
  error.value = '';
};

const removePlat = (index) => {
  currentOrder.value.plats.splice(index, 1);
};

const handleSubmit = async () => {
  try {
    if (!currentOrder.value.idcom || !currentOrder.value.nomcli || currentOrder.value.plats.length === 0) {
      error.value = 'Veuillez remplir tous les champs obligatoires et ajouter au moins un plat';
      return;
    }

    if (currentOrder.value.typecom === 'sur place' && !currentOrder.value.idtable) {
      error.value = 'Veuillez sélectionner une table pour une commande sur place';
      return;
    }

    if (editMode.value) {
      await updateOrder(currentOrder.value.idcom, currentOrder.value);
    } else {
      await createOrder(currentOrder.value);
    }

    await fetchOrders();
    closeModal();
  } catch (err) {
    console.error('Erreur lors de l\'enregistrement de la commande:', err);
    error.value = err.response?.data?.error || 'Erreur lors de l\'enregistrement';
  }
};

const handleDelete = async (idcom) => {
  if (!confirm(`Êtes-vous sûr de vouloir supprimer cette commande ?`)) return;

  try {
    await deleteOrder(idcom);
    await fetchOrders();
  } catch (err) {
    console.error('Erreur lors de la suppression de la commande:', err);
    alert(err.response?.data?.error || 'Erreur lors de la suppression');
  }
};

const handleGenerateInvoice = async (idcom) => {
  try {
    const response = await generateInvoice(idcom);
    
    // Créer un lien de téléchargement pour le PDF
    if (response.data.url || response.data.filename) {
      const link = document.createElement('a');
      link.href = response.data.url || `/api/facture/${idcom}/download`;
      link.download = response.data.filename || `facture_${idcom}.pdf`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      alert(`Facture générée et téléchargée avec succès: ${response.data.filename || `facture_${idcom}.pdf`}`);
    } else {
      alert('Facture générée avec succès');
    }
  } catch (err) {
    console.error('Erreur lors de la génération de la facture:', err);
    alert('Erreur lors de la génération de la facture');
  }
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('fr-MG', { style: 'currency', currency: 'MGA' }).format(amount);
};

const getMenuItemName = (idplat) => {
  const item = menuItems.value.find(item => item.idplat === idplat);
  return item ? item.nomplat : 'Plat inconnu';
};

const getMenuItemPrice = (idplat) => {
  const item = menuItems.value.find(item => item.idplat === idplat);
  return item ? item.pu : 0;
};

const availableTables = computed(() => {
  return tables.value.filter(table => {
    // Si on est en mode édition et que la table est déjà sélectionnée, on l'inclut
    if (editMode.value && table.idtable === currentOrder.value.idtable) {
      return true;
    }
    // Sinon, on ne prend que les tables libres
    return !table.occupation;
  });
});

const calculateTotal = computed(() => {
  return currentOrder.value.plats.reduce((total, plat) => {
    return total + (getMenuItemPrice(plat.idplat) * plat.quantite);
  }, 0);
});

const applyDateFilter = () => {
  fetchOrders();
};

const clearDateFilter = () => {
  dateFilter.value = {
    date_debut: '',
    date_fin: ''
  };
  fetchOrders();
};
</script>

<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-semibold">Gestion des Commandes</h1>
      <button @click="openAddModal" class="btn-primary rounded-md px-4 py-2">
        Nouvelle commande
      </button>
    </div>

    <!-- Filtres -->
    <div class="card mb-6">
      <h2 class="text-lg font-medium mb-4">Filtres</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Date début
          </label>
          <input
            v-model="dateFilter.date_debut"
            type="date"
            class="input"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Date fin
          </label>
          <input
            v-model="dateFilter.date_fin"
            type="date"
            class="input"
          />
        </div>
        <div class="flex items-end space-x-2">
          <button @click="applyDateFilter" class="btn-primary rounded-md px-4 py-2">
            Filtrer
          </button>
          <button @click="clearDateFilter" class="btn-secondary rounded-md px-4 py-2">
            Réinitialiser
          </button>
        </div>
      </div>
    </div>

    <div v-if="loading" class="flex justify-center items-center h-64">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
    </div>

    <div v-else-if="orders.length === 0" class="card p-8 text-center">
      <p class="text-gray-500 dark:text-gray-400">Aucune commande disponible</p>
      <button @click="openAddModal" class="btn-primary mt-4">
        Créer votre première commande
      </button>
    </div>

    <div v-else class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead class="bg-gray-50 dark:bg-gray-700">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">ID</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Client</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Type</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Table</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Statut</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Montant</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          <tr v-for="order in orders" :key="order.idcom">
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{{ order.idcom }}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{{ order.nomcli }}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{{ order.typecom }}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{{ order.table_designation || '-' }}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{{ formatDate(order.datecom) }}</td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span
                class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
                :class="{
                  'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300': order.statut === 'en attente',
                  'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300': order.statut === 'terminé',
                  'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300': order.statut === 'payé',
                }"
              >
                {{ order.statut }}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{{ formatCurrency(order.montant_total) }}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
              <div class="flex space-x-2">
                <button @click="openEditModal(order.idcom)" class="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300">
                  Modifier
                </button>
                <button @click="handleDelete(order.idcom)" class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300">
                  Supprimer
                </button>
                <button 
                  v-if="order.statut !== 'payé'"
                  @click="handleGenerateInvoice(order.idcom)" 
                  class="inline-flex items-center px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  PDF
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal -->
    <div v-if="showModal" class="fixed inset-0 z-50 overflow-y-auto">
      <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div class="fixed inset-0 transition-opacity" @click="closeModal">
          <div class="absolute inset-0 bg-gray-500 dark:bg-gray-900 opacity-75"></div>
        </div>

        <div class="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          <div class="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
              {{ editMode ? 'Modifier la commande' : 'Nouvelle commande' }}
            </h3>

            <div v-if="error" class="mb-4 p-2 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300 rounded">
              {{ error }}
            </div>

            <form @submit.prevent="handleSubmit">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    ID de la commande*
                  </label>
                  <input
                    v-model="currentOrder.idcom"
                    type="text"
                    :disabled="editMode"
                    class="input"
                    :class="{ 'opacity-50 cursor-not-allowed': editMode }"
                    required
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nom du client*
                  </label>
                  <input
                    v-model="currentOrder.nomcli"
                    type="text"
                    class="input"
                    required
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Type de commande*
                  </label>
                  <select
                    v-model="currentOrder.typecom"
                    class="input"
                    required
                  >
                    <option value="sur place">Sur place</option>
                    <option value="emporter">À emporter</option>
                  </select>
                </div>

                <div v-if="currentOrder.typecom === 'sur place'">
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Table*
                  </label>
                  <select
                    v-model="currentOrder.idtable"
                    class="input"
                    required
                  >
                    <option value="">Sélectionner une table</option>
                    <option 
                      v-for="table in availableTables" 
                      :key="table.idtable" 
                      :value="table.idtable"
                    >
                      {{ table.designation }}
                    </option>
                  </select>
                </div>

                <div v-if="editMode">
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Statut
                  </label>
                  <select
                    v-model="currentOrder.statut"
                    class="input"
                  >
                    <option value="en attente">En attente</option>
                    <option value="terminé">Terminé</option>
                    <option value="payé">Payé</option>
                  </select>
                </div>
              </div>

              <div class="mb-6">
                <h4 class="text-md font-medium text-gray-900 dark:text-white mb-2">Plats</h4>
                
                <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-md mb-4">
                  <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Plat
                      </label>
                      <select
                        v-model="currentPlat.idplat"
                        class="input"
                      >
                        <option value="">Sélectionner un plat</option>
                        <option 
                          v-for="item in menuItems" 
                          :key="item.idplat" 
                          :value="item.idplat"
                        >
                          {{ item.nomplat }} ({{ formatCurrency(item.pu) }})
                        </option>
                      </select>
                    </div>

                    <div>
                      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Quantité
                      </label>
                      <input
                        v-model.number="currentPlat.quantite"
                        type="number"
                        min="1"
                        class="input"
                      />
                    </div>

                    <div class="flex items-end">
                      <button 
                        type="button" 
                        @click="addPlat" 
                        class="btn-primary w-full rounded-md px-4 py-2"
                      >
                        Ajouter
                      </button>
                    </div>
                  </div>
                </div>

                <div v-if="currentOrder.plats.length === 0" class="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-md">
                  <p class="text-gray-500 dark:text-gray-400">Aucun plat ajouté</p>
                </div>

                <div v-else class="overflow-x-auto">
                  <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead class="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Plat</th>
                        <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Prix unitaire</th>
                        <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Quantité</th>
                        <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Total</th>
                        <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Action</th>
                      </tr>
                    </thead>
                    <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      <tr v-for="(plat, index) in currentOrder.plats" :key="index">
                        <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{{ getMenuItemName(plat.idplat) }}</td>
                        <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{{ formatCurrency(getMenuItemPrice(plat.idplat)) }}</td>
                        <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{{ plat.quantite }}</td>
                        <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{{ formatCurrency(getMenuItemPrice(plat.idplat) * plat.quantite) }}</td>
                        <td class="px-4 py-2 whitespace-nowrap text-sm font-medium">
                          <button 
                            type="button" 
                            @click="removePlat(index)" 
                            class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          >
                            Supprimer
                          </button>
                        </td>
                      </tr>
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colspan="3" class="px-4 py-2 text-right font-bold text-gray-700 dark:text-gray-300">Total:</td>
                        <td class="px-4 py-2 font-bold text-gray-700 dark:text-gray-300">{{ formatCurrency(calculateTotal) }}</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              <div class="flex justify-end space-x-3">
                <button
                  type="button"
                  @click="closeModal"
                  class="btn-secondary rounded-md px-4 py-2"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  class="btn-primary rounded-md px-4 py-2"
                >
                  {{ editMode ? 'Mettre à jour' : 'Créer' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>