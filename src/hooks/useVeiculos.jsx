import { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import api from '../services/api'; // <--- Import padronizado usando o axios do projeto

export function useVeiculos() {
  const [veiculos, setVeiculos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth();

    const getAuthHeaders = async (user) => {
      if (user) {
        const token = await user.getIdToken();
        return { headers: { Authorization: `Bearer ${token}` } };
      }
      return {};
    };

    const carregarVeiculos = async (user) => {
      try {
        const config = await getAuthHeaders(user);
        const response = await api.get('/veiculos_frota', config);
        const lista = response.data;

        if (Array.isArray(lista)) {
          lista.sort((a, b) => (a.modelo || '').localeCompare(b.modelo || ''));
          setVeiculos(lista);
        } else {
          setVeiculos([]);
        }
      } catch (error) {
        console.error("Erro ao carregar veículos:", error);
        setVeiculos([]);
      } finally {
        setLoading(false);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        carregarVeiculos(user);
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return { veiculos, loading };
}