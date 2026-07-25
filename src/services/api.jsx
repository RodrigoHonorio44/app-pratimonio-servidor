import axios from 'axios';
import { auth } from './firebase';

const api = axios.create({
  // Utiliza o mesmo domínio público configurado na Vercel para o servidor
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