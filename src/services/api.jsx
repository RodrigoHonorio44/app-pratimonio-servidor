import axios from 'axios';
import { auth } from './firebase';

const api = axios.create({
  // Utiliza o domínio público do servidor
  baseURL: 'https://hcp.rodhonsystem.com.br/api', 
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
