<script setup>
import { ref, onMounted } from 'vue';
import { getMenu, getMenuItem, createMenuItem, updateMenuItem, deleteMenuItem } from '../services/api';

const menuItems = ref([]);
const loading = ref(true);
const showModal = ref(false);
const editMode = ref(false);
const currentItem = ref({ idplat: '', nomplat: '', pu: 0 });
const error = ref('');
const searchTerm = ref('');

const fetchMenu = async () => {
  try {
    loading.value = true;
    const response = await getMenu(searchTerm.value);
    menuItems.value = response.data;
    loading.value = false;
  } catch (err) {
    console.error('Erreur lors du chargement du menu:', err);
    error.value = 'Erreur lors du chargement du menu';
    loading.value = false;
  }
};

onMounted(fetchMenu);

const openAddModal = () => {
  currentItem.value = { idplat: '', nomplat: '', pu: 0 };
  editMode.value = false;
  showModal.value = true;
};

const openEditModal = (item) => {
  currentItem.value = { ...item };
  editMode.value = true;
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  error.value = '';
};

const handleSubmit = async () => {
  try {
    if (!currentItem.value.idplat || !currentItem.value.nomplat || !currentItem.value.pu) {
      error.value = 'Veuillez remplir tous les champs obligatoires';
      return;
    }

    if (editMode.value) {
      await updateMenuItem(currentItem.value.idplat, currentItem.value);
    } else {
      await createMenuItem(currentItem.value);
    }

    await fetchMenu();
    closeModal();
  } catch (err) {
    console.error('Erreur lors de l\'enregistrement du plat:', err);
    error.value = err.response?.data?.error || 'Erreur lors de l\'enregistrement';
  }
};

const handleDelete = async (idplat) => {
  if (!confirm(`Êtes-vous sûr de vouloir supprimer ce plat ?`)) return;

  try {
    await deleteMenuItem(idplat);
    await fetchMenu();
  } catch (err) {
    console.error('Erreur lors de la suppression du plat:', err);
    alert(err.response?.data?.error || 'Erreur lors de la suppression');
  }
};

const formatPrice = (price) => {
  return new Intl.NumberFormat('fr-MG', { style: 'currency', currency: 'MGA' }).format(price);
};
</script>

<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-semibold">Menu du Restaurant</h1>
      <button @click="openAddModal" class="btn-primary rounded-md px-4 py-2">
        Ajouter un plat
      </button>
    </div>

    <div class="mb-6">
      <div class="relative">
        <input
          v-model="searchTerm"
          @input="fetchMenu"
          type="text"
          placeholder="Rechercher un plat..."
          class="input pl-10"
        />
        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>
    </div>

    <div v-if="loading" class="flex justify-center items-center h-64">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
    </div>

    <div v-else-if="menuItems.length === 0" class="card p-8 text-center">
      <p class="text-gray-500 dark:text-gray-400">
        {{ searchTerm ? 'Aucun plat ne correspond à votre recherche' : 'Aucun plat disponible' }}
      </p>
      <button v-if="!searchTerm" @click="openAddModal" class="btn-primary mt-4">
        Ajouter votre premier plat
      </button>
    </div>

    <!-- Remplacer la section des cartes de menu par ce code -->
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      <div v-for="item in menuItems" :key="item.idplat" class="card relative hover:shadow-lg transition-all duration-300 overflow-hidden group">
        <div class="absolute top-4 right-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button @click="openEditModal(item)" class="p-1 rounded-md text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button @click="handleDelete(item.idplat)" class="p-1 rounded-md text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
    
        <div class="absolute -top-10 -right-10 w-20 h-20 bg-primary-500 rotate-45 transform origin-bottom-left"></div>
    
        <h2 class="text-xl font-semibold mb-2">{{ item.nomplat }}</h2>
        <p class="text-gray-600 dark:text-gray-400 mb-1 text-sm">
          ID: {{ item.idplat }}
        </p>
        <p class="text-lg font-bold text-primary-600 dark:text-primary-400 mt-4">
          {{ formatPrice(item.pu) }}
        </p>
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
              {{ editMode ? 'Modifier le plat' : 'Ajouter un plat' }}
            </h3>

            <div v-if="error" class="mb-4 p-2 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300 rounded">
              {{ error }}
            </div>

            <form @submit.prevent="handleSubmit">
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  ID du plat*
                </label>
                <input
                  v-model="currentItem.idplat"
                  type="text"
                  :disabled="editMode"
                  class="input"
                  :class="{ 'opacity-50 cursor-not-allowed': editMode }"
                  required
                />
              </div>

              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nom du plat*
                </label>
                <input
                  v-model="currentItem.nomplat"
                  type="text"
                  class="input"
                  required
                />
              </div>

              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Prix unitaire (Ar)*
                </label>
                <input
                  v-model.number="currentItem.pu"
                  type="number"
                  min="0"
                  step="100"
                  class="input"
                  required
                />
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