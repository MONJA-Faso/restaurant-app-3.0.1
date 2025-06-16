<script setup>
import { ref, onMounted } from 'vue';
import { getClients, searchClients, getClientOrders } from '../services/api';

const clients = ref([]);
const loading = ref(true);
const searchTerm = ref('');
const selectedClient = ref(null);
const clientOrders = ref([]);
const showClientDetails = ref(false);
const dateFilter = ref({
  date_debut: '',
  date_fin: ''
});

const fetchClients = async () => {
  try {
    loading.value = true;
    const response = await getClients(dateFilter.value);
    clients.value = response.data;
    loading.value = false;
  } catch (err) {
    console.error('Erreur lors du chargement des clients:', err);
    loading.value = false;
  }
};

const searchClientsByTerm = async () => {
  if (!searchTerm.value.trim()) {
    await fetchClients();
    return;
  }
  
  try {
    loading.value = true;
    const response = await searchClients(searchTerm.value);
    clients.value = response.data;
    loading.value = false;
  } catch (err) {
    console.error('Erreur lors de la recherche des clients:', err);
    loading.value = false;
  }
};

const viewClientDetails = async (client) => {
  selectedClient.value = client;
  showClientDetails.value = true;
  
  try {
    const response = await getClientOrders(client.nomcli);
    clientOrders.value = response.data;
  } catch (err) {
    console.error('Erreur lors du chargement des commandes du client:', err);
    clientOrders.value = [];
  }
};

const closeClientDetails = () => {
  showClientDetails.value = false;
  selectedClient.value = null;
  clientOrders.value = [];
};

const applyDateFilter = () => {
  fetchClients();
};

const clearDateFilter = () => {
  dateFilter.value = {
    date_debut: '',
    date_fin: ''
  };
  searchTerm.value = '';
  fetchClients();
};

const formatDate = (dateString) => {
  if (!dateString) return 'Jamais';
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('fr-MG', { style: 'currency', currency: 'MGA' }).format(amount);
};

onMounted(fetchClients);
</script>

<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-semibold">Gestion des Clients</h1>
    </div>

    <!-- Filtres et recherche -->
    <div class="card mb-6">
      <div class="mb-4">
        <div class="relative">
          <input
            v-model="searchTerm"
            @input="searchClientsByTerm"
            type="text"
            placeholder="Rechercher un client..."
            class="input pl-10"
          />
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      <h2 class="text-lg font-medium mb-4">Filtres par date</h2>
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

    <div v-else-if="clients.length === 0" class="card p-8 text-center">
      <p class="text-gray-500 dark:text-gray-400">
        {{ searchTerm ? 'Aucun client ne correspond à votre recherche' : 'Aucun client disponible' }}
      </p>
    </div>

    <div v-else class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead class="bg-gray-50 dark:bg-gray-700">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Nom</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Dernière visite</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Nombre de commandes</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Total dépensé</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Réservations</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          <tr v-for="client in clients" :key="client.nomcli">
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{{ client.nomcli }}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{{ formatDate(client.derniere_visite) }}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{{ client.nb_commandes }}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{{ formatCurrency(client.total_depense) }}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{{ client.nb_reservations || 0 }}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
              <button @click="viewClientDetails(client)" class="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300">
                Détails
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal détails client -->
    <div v-if="showClientDetails" class="fixed inset-0 z-50 overflow-y-auto">
      <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div class="fixed inset-0 transition-opacity" @click="closeClientDetails">
          <div class="absolute inset-0 bg-gray-500 dark:bg-gray-900 opacity-75"></div>
        </div>

        <div class="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          <div class="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div class="flex justify-between items-center mb-4">
              <h3 class="text-lg font-medium text-gray-900 dark:text-white">
                Détails du client: {{ selectedClient?.nomcli }}
              </h3>
              <button @click="closeClientDetails" class="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div class="mb-6">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div class="card">
                  <h4 class="text-md font-medium mb-2">Statistiques</h4>
                  <p><span class="font-medium">Dernière visite:</span> {{ formatDate(selectedClient?.derniere_visite) }}</p>
                  <p><span class="font-medium">Nombre de commandes:</span> {{ selectedClient?.nb_commandes }}</p>
                  <p><span class="font-medium">Total dépensé:</span> {{ formatCurrency(selectedClient?.total_depense) }}</p>
                  <p><span class="font-medium">Nombre de réservations:</span> {{ selectedClient?.nb_reservations || 0 }}</p>
                </div>
              </div>

              <h4 class="text-md font-medium mb-2">Historique des commandes</h4>
              <div v-if="clientOrders.length === 0" class="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-md">
                <p class="text-gray-500 dark:text-gray-400">Aucune commande trouvée</p>
              </div>
              <div v-else class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead class="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">ID</th>
                      <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                      <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Type</th>
                      <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Statut</th>
                      <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Montant</th>
                    </tr>
                  </thead>
                  <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    <tr v-for="order in clientOrders" :key="order.idcom">
                      <td class="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{{ order.idcom }}</td>
                      <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{{ formatDate(order.datecom) }}</td>
                      <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{{ order.typecom }}</td>
                      <td class="px-4 py-2 whitespace-nowrap">
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
                      <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{{ formatCurrency(order.montant_total) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>