<script setup>
import { ref, onMounted, computed } from 'vue';
import { getReservations, createReservation, updateReservation, deleteReservation, getTables } from '../services/api';

const reservations = ref([]);
const tables = ref([]);
const loading = ref(true);
const showModal = ref(false);
const editMode = ref(false);
const currentReservation = ref({
  idreservation: '',
  nomcli: '',
  idtable: '',
  date_heure: '',
  duree: 60, // Durée par défaut en minutes
  nb_personnes: 1,
  statut: 'confirmée'
});
const error = ref('');
const dateFilter = ref({
  date: ''
});

const fetchReservations = async () => {
  try {
    loading.value = true;
    const response = await getReservations(dateFilter.value);
    reservations.value = response.data;
    loading.value = false;
  } catch (err) {
    console.error('Erreur lors du chargement des réservations:', err);
    error.value = 'Erreur lors du chargement des réservations';
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

onMounted(async () => {
  await Promise.all([fetchReservations(), fetchTables()]);
});

const openAddModal = () => {
  const now = new Date();
  const reservationId = 'R' + now.getTime().toString().slice(-8);
  
  // Formater la date et l'heure pour l'input datetime-local
  const dateTime = new Date();
  dateTime.setMinutes(dateTime.getMinutes() + 30); // Ajouter 30 minutes à l'heure actuelle
  const formattedDateTime = dateTime.toISOString().slice(0, 16);
  
  currentReservation.value = {
    idreservation: reservationId,
    nomcli: '',
    idtable: '',
    date_heure: formattedDateTime,
    duree: 60,
    nb_personnes: 1,
    statut: 'confirmée'
  };
  editMode.value = false;
  showModal.value = true;
};

const openEditModal = (reservation) => {
  // Formater la date et l'heure pour l'input datetime-local
  const dateTime = new Date(reservation.date_heure);
  const formattedDateTime = dateTime.toISOString().slice(0, 16);
  
  currentReservation.value = {
    ...reservation,
    date_heure: formattedDateTime
  };
  editMode.value = true;
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  error.value = '';
};

const handleSubmit = async () => {
  try {
    if (!currentReservation.value.idreservation || 
        !currentReservation.value.nomcli || 
        !currentReservation.value.idtable || 
        !currentReservation.value.date_heure) {
      error.value = 'Veuillez remplir tous les champs obligatoires';
      return;
    }

    if (editMode.value) {
      await updateReservation(currentReservation.value.idreservation, currentReservation.value);
    } else {
      await createReservation(currentReservation.value);
    }

    await fetchReservations();
    closeModal();
  } catch (err) {
    console.error('Erreur lors de l\'enregistrement de la réservation:', err);
    error.value = err.response?.data?.error || 'Erreur lors de l\'enregistrement';
  }
};

const handleDelete = async (idreservation) => {
  if (!confirm(`Êtes-vous sûr de vouloir supprimer cette réservation ?`)) return;

  try {
    await deleteReservation(idreservation);
    await fetchReservations();
  } catch (err) {
    console.error('Erreur lors de la suppression de la réservation:', err);
    alert(err.response?.data?.error || 'Erreur lors de la suppression');
  }
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit' 
  });
};

const getTableName = (idtable) => {
  const table = tables.value.find(t => t.idtable === idtable);
  return table ? table.designation : 'Table inconnue';
};

const applyDateFilter = () => {
  fetchReservations();
};

const clearDateFilter = () => {
  dateFilter.value = {
    date: ''
  };
  fetchReservations();
};
</script>

<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-semibold">Gestion des Réservations</h1>
      <button @click="openAddModal" class="btn-primary rounded-md px-4 py-2">
        Nouvelle réservation
      </button>
    </div>

    <!-- Filtres -->
    <div class="card mb-6">
      <h2 class="text-lg font-medium mb-4">Filtres</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Date
          </label>
          <input
            v-model="dateFilter.date"
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

    <div v-else-if="reservations.length === 0" class="card p-8 text-center">
      <p class="text-gray-500 dark:text-gray-400">Aucune réservation disponible</p>
      <button @click="openAddModal" class="btn-primary mt-4">
        Créer votre première réservation
      </button>
    </div>

    <div v-else class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead class="bg-gray-50 dark:bg-gray-700">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">ID</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Client</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Table</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date et heure</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Durée</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Personnes</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Statut</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          <tr v-for="reservation in reservations" :key="reservation.idreservation">
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{{ reservation.idreservation }}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{{ reservation.nomcli }}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{{ getTableName(reservation.idtable) }}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{{ formatDate(reservation.date_heure) }}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{{ reservation.duree }} min</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{{ reservation.nb_personnes }}</td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span
                class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
                :class="{
                  'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300': reservation.statut === 'confirmée',
                  'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300': reservation.statut === 'en attente',
                  'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300': reservation.statut === 'annulée',
                }"
              >
                {{ reservation.statut }}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
              <div class="flex space-x-2">
                <button @click="openEditModal(reservation)" class="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300">
                  Modifier
                </button>
                <button @click="handleDelete(reservation.idreservation)" class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300">
                  Supprimer
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

        <div class="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div class="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
              {{ editMode ? 'Modifier la réservation' : 'Nouvelle réservation' }}
            </h3>

            <div v-if="error" class="mb-4 p-2 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300 rounded">
              {{ error }}
            </div>

            <form @submit.prevent="handleSubmit">
              <div class="grid grid-cols-1 gap-4 mb-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    ID de la réservation*
                  </label>
                  <input
                    v-model="currentReservation.idreservation"
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
                    v-model="currentReservation.nomcli"
                    type="text"
                    class="input"
                    required
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Table*
                  </label>
                  <select
                    v-model="currentReservation.idtable"
                    class="input"
                    required
                  >
                    <option value="">Sélectionner une table</option>
                    <option 
                      v-for="table in tables" 
                      :key="table.idtable" 
                      :value="table.idtable"
                    >
                      {{ table.designation }}
                    </option>
                  </select>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Date et heure*
                  </label>
                  <input
                    v-model="currentReservation.date_heure"
                    type="datetime-local"
                    class="input"
                    required
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Durée (minutes)*
                  </label>
                  <input
                    v-model.number="currentReservation.duree"
                    type="number"
                    min="15"
                    step="15"
                    class="input"
                    required
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nombre de personnes*
                  </label>
                  <input
                    v-model.number="currentReservation.nb_personnes"
                    type="number"
                    min="1"
                    class="input"
                    required
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Statut
                  </label>
                  <select
                    v-model="currentReservation.statut"
                    class="input"
                  >
                    <option value="confirmée">Confirmée</option>
                    <option value="en attente">En attente</option>
                    <option value="annulée">Annulée</option>
                  </select>
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