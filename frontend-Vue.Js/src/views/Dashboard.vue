<script setup>
import { ref, onMounted } from 'vue';
import { getOrders, getTables, getMenu } from '../services/api';

const stats = ref({
  tables: { total: 0, occupied: 0 },
  orders: { total: 0, pending: 0, completed: 0 },
  menu: { total: 0 },
  revenue: { today: 0, week: 0, month: 0 },
});

const recentOrders = ref([]);
const loading = ref(true);
const revenueChart = ref([]);
const topDishes = ref([]);

console.log(topDishes);

// Fonction pour calculer les revenus des 6 derniers mois
const calculateMonthlyRevenue = (orders) => {
  const monthlyData = [];
  const now = new Date();
  
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthStart = new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
    const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split('T')[0];
    
    const monthRevenue = orders
      .filter(order => order.datecom >= monthStart && order.datecom <= monthEnd)
      .reduce((sum, order) => sum + order.montant_total, 0);
    
    monthlyData.push({
      month: date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }),
      revenue: monthRevenue
    });
  }
  
  return monthlyData;
};

// Fonction pour calculer le top 10 des plats
const calculateTopDishes = (orders, menuItems) => {
  const dishCount = {};
  
  orders.forEach(order => {
    if (order.plats) {
      order.plats.forEach(plat => {
        if (dishCount[plat.idplat]) {
          dishCount[plat.idplat] += plat.quantite;
        } else {
          dishCount[plat.idplat] = plat.quantite;
        }
      });
    }
  });
  
  const topDishesArray = Object.entries(dishCount)
    .map(([idplat, quantity]) => {
      const menuItem = menuItems.find(item => item.idplat === Number(idplat));
      return {
        idplat,
        name: menuItem ? menuItem.nom : `Plat ${idplat}`,
        quantity,
        price: menuItem ? menuItem.prix : 0
      };
    })
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 10);
  
  return topDishesArray;
};

onMounted(async () => {
  try {
    // Charger les statistiques
    const [tablesRes, ordersRes, menuRes] = await Promise.all([
      getTables(),
      getOrders(),
      getMenu(),
    ]);

    // Tables
    stats.value.tables.total = tablesRes.data.length;
    stats.value.tables.occupied = tablesRes.data.filter(table => table.occupation).length;

    // Commandes
    const orders = ordersRes.data;
    stats.value.orders.total = orders.length;
    stats.value.orders.pending = orders.filter(order => order.statut === 'en attente').length;
    stats.value.orders.completed = orders.filter(order => order.statut === 'terminé' || order.statut === 'payé').length;

    // Menu
    stats.value.menu.total = menuRes.data.length;

    // Revenus
    const today = new Date().toISOString().split('T')[0];
    const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const lastMonth = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    stats.value.revenue.today = orders
      .filter(order => order.datecom.startsWith(today))
      .reduce((sum, order) => sum + order.montant_total, 0);

    stats.value.revenue.week = orders
      .filter(order => order.datecom >= lastWeek)
      .reduce((sum, order) => sum + order.montant_total, 0);

    stats.value.revenue.month = orders
      .filter(order => order.datecom >= lastMonth)
      .reduce((sum, order) => sum + order.montant_total, 0);

    // Commandes récentes
    recentOrders.value = orders.slice(0, 5);
    
    // Calcul des revenus mensuels pour l'histogramme
    revenueChart.value = calculateMonthlyRevenue(orders);
    
    // Calcul du top 10 des plats
    topDishes.value = calculateTopDishes(orders, menuRes.data);

    loading.value = false;
  } catch (error) {
    console.error('Erreur lors du chargement des données du dashboard:', error);
    loading.value = false;
  }
});

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('fr-MG', { style: 'currency', currency: 'MGA' }).format(amount);
};

const getBarHeight = (revenue, maxRevenue) => {
  return maxRevenue > 0 ? (revenue / maxRevenue) * 100 : 0;
};
</script>

<template>
  <div class="p-6">
    <h1 class="text-3xl font-bold mb-8 text-gray-900 dark:text-white">Dashboard</h1>

    <div v-if="loading" class="flex justify-center items-center h-64">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
    </div>

    <div v-else class="space-y-8">
      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <!-- Tables -->
        <div class="card">
          <h2 class="text-lg font-medium text-gray-900 dark:text-white mb-2">Tables</h2>
          <div class="flex justify-between items-end">
            <div>
              <p class="text-3xl font-bold">{{ stats.tables.occupied }} / {{ stats.tables.total }}</p>
              <p class="text-sm text-gray-500 dark:text-gray-400">Tables occupées</p>
            </div>
            <div class="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center dark:bg-blue-900">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-blue-600 dark:text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
          </div>
        </div>

        <!-- Commandes -->
        <div class="card">
          <h2 class="text-lg font-medium text-gray-900 dark:text-white mb-2">Commandes</h2>
          <div class="flex justify-between items-end">
            <div>
              <p class="text-3xl font-bold">{{ stats.orders.pending }} / {{ stats.orders.total }}</p>
              <p class="text-sm text-gray-500 dark:text-gray-400">Commandes en attente</p>
            </div>
            <div class="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center dark:bg-yellow-900">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-yellow-600 dark:text-yellow-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
          </div>
        </div>

        <!-- Menu -->
        <div class="card">
          <h2 class="text-lg font-medium text-gray-900 dark:text-white mb-2">Menu</h2>
          <div class="flex justify-between items-end">
            <div>
              <p class="text-3xl font-bold">{{ stats.menu.total }}</p>
              <p class="text-sm text-gray-500 dark:text-gray-400">Plats disponibles</p>
            </div>
            <div class="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center dark:bg-green-900">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-green-600 dark:text-green-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
          </div>
        </div>

        <!-- Revenus -->
        <div class="card">
          <h2 class="text-lg font-medium text-gray-900 dark:text-white mb-2">Revenus</h2>
          <div class="flex justify-between items-end">
            <div>
              <p class="text-3xl font-bold">{{ formatCurrency(stats.revenue.today) }}</p>
              <p class="text-sm text-gray-500 dark:text-gray-400">Aujourd'hui</p>
            </div>
            <div class="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center dark:bg-purple-900">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-purple-600 dark:text-purple-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- Nouvelle section: Histogramme des revenus et Top 10 des plats -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- Histogramme des revenus des 6 derniers mois -->
        <div class="card">
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-6">Revenus des 6 derniers mois</h2>
          <div class="space-y-4">
            <div 
              v-for="(month, index) in revenueChart" 
              :key="index"
              class="flex items-center space-x-4"
            >
              <div class="w-16 text-sm font-medium text-gray-600 dark:text-gray-400">
                {{ month.month }}
              </div>
              <div class="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-6 relative overflow-hidden">
                <div 
                  class="bg-gradient-to-r from-blue-500 to-purple-600 h-full rounded-full transition-all duration-500 ease-out"
                  :style="{ width: getBarHeight(month.revenue, Math.max(...revenueChart.map(m => m.revenue))) + '%' }"
                ></div>
                <div class="absolute inset-0 flex items-center justify-center text-xs font-medium text-gray-700 dark:text-gray-300">
                  {{ formatCurrency(month.revenue) }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Top 10 des plats les plus vendus -->
        <div class="card">
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-6">Top 10 des plats les plus vendus</h2>
          <div class="space-y-3">
            <div 
              v-for="(dish, index) in topDishes" 
              :key="dish.idplat"
              class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
            >
              <div class="flex items-center space-x-3">
                <div class="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {{ index + 1 }}
                </div>
                <div>
                  <p class="font-medium text-gray-900 dark:text-white">{{ dish.name }}</p>
                  <p class="text-sm text-gray-500 dark:text-gray-400">{{ formatCurrency(dish.price) }}</p>
                </div>
              </div>
              <div class="text-right">
                <p class="font-bold text-lg text-gray-900 dark:text-white">{{ dish.quantity }}</p>
                <p class="text-sm text-gray-500 dark:text-gray-400">vendus</p>
              </div>
            </div>
            <div v-if="topDishes.length === 0" class="text-center py-8 text-gray-500 dark:text-gray-400">
              Aucune donnée de vente disponible
            </div>
          </div>
        </div>
      </div>

      <!-- Commandes récentes -->
      <div class="card">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-6">Commandes récentes</h2>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">ID</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Client</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Type</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Statut</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Montant</th>
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              <tr v-for="order in recentOrders" :key="order.idcom">
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{{ order.idcom }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{{ order.nomcli }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{{ order.typecom }}</td>
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
              </tr>
              <tr v-if="recentOrders.length === 0">
                <td colspan="6" class="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">Aucune commande récente</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>



  
</template>

<!-- Statistics section -->
<!--<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
  <div class="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
    <div class="flex items-center justify-between">
      <div>
        <p class="text-sm font-medium opacity-80">Tables</p>
        <h3 class="text-2xl font-bold mt-1">{{ stats.tables }}</h3>
      </div>
      <div class="p-3 bg-white bg-opacity-30 rounded-lg">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      </div>
    </div>
    <div class="mt-4 text-sm">
      <span class="font-medium">{{ stats.tables_occupees }}</span> occupées
    </div>
  </div>

  <div class="card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
    <div class="flex items-center justify-between">
      <div>
        <p class="text-sm font-medium opacity-80">Commandes</p>
        <h3 class="text-2xl font-bold mt-1">{{ stats.commandes }}</h3>
      </div>
      <div class="p-3 bg-white bg-opacity-30 rounded-lg">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      </div>
    </div>
    <div class="mt-4 text-sm">
      <span class="font-medium">{{ stats.commandes_en_cours }}</span> en cours
    </div>
  </div>

  <div class="card bg-gradient-to-br from-green-500 to-green-600 text-white">
    <div class="flex items-center justify-between">
      <div>
        <p class="text-sm font-medium opacity-80">Menu</p>
        <h3 class="text-2xl font-bold mt-1">{{ stats.plats }}</h3>
      </div>
      <div class="p-3 bg-white bg-opacity-30 rounded-lg">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      </div>
    </div>
    <div class="mt-4 text-sm">
      <span class="font-medium">{{ formatCurrency(stats.prix_moyen) }}</span> prix moyen
    </div>
  </div>

  <div class="card bg-gradient-to-br from-red-500 to-red-600 text-white">
    <div class="flex items-center justify-between">
      <div>
        <p class="text-sm font-medium opacity-80">Revenus</p>
        <h3 class="text-2xl font-bold mt-1">{{ formatCurrency(stats.revenu_total) }}</h3>
      </div>
      <div class="p-3 bg-white bg-opacity-30 rounded-lg">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
    </div>
    <div class="mt-4 text-sm">
      <span class="font-medium">{{ formatCurrency(stats.revenu_mensuel) }}</span> ce mois
    </div>
  </div>
</div> -->