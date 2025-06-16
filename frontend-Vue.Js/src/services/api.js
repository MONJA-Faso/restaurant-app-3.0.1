import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Tables
export const getTables = () => api.get('/tables');
export const getTable = (id) => api.get(`/tables/${id}`);
export const createTable = (data) => api.post('/tables', data);
export const updateTable = (id, data) => api.put(`/tables/${id}`, data);
export const deleteTable = (id) => api.delete(`/tables/${id}`);
export const liberateTable = (id) => api.put(`/tables/liberer/${id}`);

// Menu
export const getMenu = (search = '') => api.get('/menu', { params: { search } });
export const getMenuItem = (id) => api.get(`/menu/${id}`);
export const createMenuItem = (data) => api.post('/menu', data);
export const updateMenuItem = (id, data) => api.put(`/menu/${id}`, data);
export const deleteMenuItem = (id) => api.delete(`/menu/${id}`);

// Commandes
export const getOrders = (params) => api.get('/commandes', { params });
export const getOrder = (id) => api.get(`/commandes/${id}`);
export const createOrder = (data) => api.post('/commandes', data);
export const updateOrder = (id, data) => api.put(`/commandes/${id}`, data);
export const deleteOrder = (id) => api.delete(`/commandes/${id}`);
export const getClientOrders = (client, params) => api.get(`/commandes/client/${client}`, { params });
export const generateInvoice = (id) => api.get(`/facture/${id}`);

// Réservations
export const getReservations = (params) => api.get('/reservations', { params });
export const createReservation = (data) => api.post('/reservations', data);
export const updateReservation = (id, data) => api.put(`/reservations/${id}`, data);
export const deleteReservation = (id) => api.delete(`/reservations/${id}`);

// Clients
export const getClients = (params) => api.get('/clients', { params });
export const searchClients = (terme) => api.get('/recherche/clients', { params: { terme } });

export default api;