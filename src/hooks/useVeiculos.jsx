import { useState, useEffect, useCallback } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import api from '../services/api';

export function useVeiculos() {
  const [veiculos, setVeiculos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Função auxiliar para injetar o Token do Firebase no Axios
  const getAuthHeaders = async () => {
    const auth = getAuth();
    let user = auth.currentUser;

    if (!user) {
      await new Promise((resolve) => {
        const unsubscribe = onAuthStateChanged(auth, (u) => {
          user = u;
          unsubscribe();
          resolve();
        });
      });
    }

    if (user) {
      const token = await user.getIdToken();
      return { headers: { Authorization: `Bearer ${token}` } };
    }
    return {};
  };

  // Função para buscar veículos do backend
  const carregarVeiculos = useCallback(async () => {
    setLoading(true);
    try {
      const config = await getAuthHeaders();
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
  }, []);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        carregarVeiculos();
      } else {
        setVeiculos([]);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [carregarVeiculos]);

  return { veiculos, loading, carregarVeiculos };
}