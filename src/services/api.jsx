import axios from 'axios';
import { auth } from './firebase';

const api = axios.create({
  // Use o domínio público HTTPS do seu túnel do Cloudflare
  baseURL: 'https://api.rodhonsystem.com.br/api', 
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