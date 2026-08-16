import axios from 'axios';
import { auth } from './firebase';

// Trata a URL base para garantir que SEMPRE termine com /api
const getBaseURL = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (!envUrl) return '/api';
  
  // Remove barra no final se houver e adiciona /api
  const urlLimpa = envUrl.replace(/\/$/, '');
  return urlLimpa.endsWith('/api') ? urlLimpa : `${urlLimpa}/api`;
};

const api = axios.create({
  baseURL: getBaseURL(),
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