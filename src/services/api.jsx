import axios from 'axios';
import { auth } from './firebase';

const api = axios.create({
  // Se houver uma variável de ambiente definida, usa ela; caso contrário, define o fallback ideal
  baseURL: import.meta.env.VITE_API_URL || 'http://192.168.0.232:3000/api',
  withCredentials: true,
});

api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;