import axios from 'axios';
import { auth } from './firebase'; // Importa sua configuração do firebase

const api = axios.create({
  // Adicionamos o /api aqui para que você não precise repetir nas chamadas
  baseURL: 'http://192.168.0.232:3000/api', 
});

// Interceptor para injetar o token do Firebase em todas as chamadas
api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;