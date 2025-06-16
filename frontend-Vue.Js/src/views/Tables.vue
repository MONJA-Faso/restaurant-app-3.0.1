<script setup>
import { ref, onMounted } from 'vue';
import { getTables, createTable, updateTable, deleteTable, liberateTable } from '../services/api';

const tables = ref([]);
const loading = ref(true);
const showModal = ref(false);
const editMode = ref(false);
const currentTable = ref({ idtable: '', designation: '', occupation: false });
const error = ref('');

const fetchTables = async () => {
  try {
    loading.value = true;
    const response = await getTables();
    tables.value = response.data;
    loading.value = false;
  } catch (err) {
    console.error('Erreur lors du chargement des tables:', err);
    error.value = 'Erreur lors du chargement des tables';
    loading.value = false;
  }
};

onMounted(fetchTables);

const openAddModal = () => {
  currentTable.value = { idtable: '', designation: '', occupation: false };
  editMode.value = false;
  showModal.value = true;
};

const openEditModal = (table) => {
  currentTable.value = { ...table };
  editMode.value = true;
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  error.value = '';
};

const handleSubmit = async () => {
  try {
    if (!currentTable.value.idtable || !currentTable.value.designation) {
      error.value = 'Veuillez remplir tous les champs obligatoires';
      return;
    }

    if (editMode.value) {
      await updateTable(currentTable.value.idtable, currentTable.value);
    } else {
      await createTable(currentTable.value);
    }

    await fetchTables();
    closeModal();
  } catch (err) {
    console.error('Erreur lors de l\'enregistrement de la table:', err);
    error.value = err.response?.data?.error || 'Erreur lors de l\'enregistrement';
  }
};

const handleDelete = async (idtable) => {
  if (!confirm(`Êtes-vous sûr de vouloir supprimer la table ${idtable} ?`)) return;

  try {
    await deleteTable(idtable);
    await fetchTables();
  } catch (err) {
    console.error('Erreur lors de la suppression de la table:', err);
    alert(err.response?.data?.error || 'Erreur lors de la suppression');
  }
};

const handleLiberate = async (idtable) => {
  try {
    await liberateTable(idtable);
    await fetchTables();
  } catch (err) {
    console.error('Erreur lors de la libération de la table:', err);
    alert(err.response?.data?.error || 'Erreur lors de la libération de la table');
  }
};
</script>

<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-semibold">Gestion des Tables</h1>
      <button @click="openAddModal" class="btn-primary rounded-md px-4 py-2">
        Ajouter une table
      </button>
    </div>

    <div v-if="loading" class="flex justify-center items-center h-64">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
    </div>

    <div v-else-if="tables.length === 0" class="card p-8 text-center">
      <p class="text-gray-500 dark:text-gray-400">Aucune table disponible</p>
      <button @click="openAddModal" class="btn-primary mt-4 rounded-md px-4 py-2">
        Ajouter votre première table
      </button>
    </div>

    <!-- Remplacer la ligne avec la grille -->
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 auto-rows-fr">
      <div v-for="table in tables" :key="table.idtable" class="card relative">
        <div class="absolute top-4 right-4 flex space-x-2">
          <button @click="openEditModal(table)" class="p-1 rounded-md text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button @click="handleDelete(table.idtable)" class="p-1 rounded-md text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>

        <div class="flex items-center mb-4">
          <div
            class="w-4 h-4 rounded-full mr-2"
            :class="table.occupation ? 'bg-red-500' : 'bg-green-500'"
          ></div>
          <h2 class="text-xl font-semibold">{{ table.designation }}</h2>
        </div>

        <p class="text-gray-600 dark:text-gray-400 mb-4">
          ID: {{ table.idtable }}
        </p>

        <div class="flex justify-between items-center">
          <span
            class="px-2 py-1 text-xs rounded-full"
            :class="table.occupation ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'"
          >
            {{ table.occupation ? 'Occupée' : 'Libre' }}
          </span>

          <button
            v-if="table.occupation"
            @click="handleLiberate(table.idtable)"
            class="btn-secondary text-sm"
          >
            Libérer
          </button>
        </div>
      </div>
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
              {{ editMode ? 'Modifier la table' : 'Ajouter une table' }}
            </h3>

            <div v-if="error" class="mb-4 p-2 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300 rounded">
              {{ error }}
            </div>

            <form @submit.prevent="handleSubmit">
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  ID de la table*
                </label>
                <input
                  v-model="currentTable.idtable"
                  type="text"
                  :disabled="editMode"
                  class="input"
                  :class="{ 'opacity-50 cursor-not-allowed': editMode }"
                  required
                />
              </div>

              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Désignation*
                </label>
                <input
                  v-model="currentTable.designation"
                  type="text"
                  class="input"
                  required
                />
              </div>

              <div class="mb-4">
                <label class="flex items-center">
                  <input
                    v-model="currentTable.occupation"
                    type="checkbox"
                    class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">Table occupée</span>
                </label>
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
                  {{ editMode ? 'Mettre à jour' : 'Ajouter' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>