import { useState, useEffect, useCallback } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import api from '../services/api';

export function useAbastecimentos() {
  const [loading, setLoading] = useState(false);
  const [abastecimentos, setAbastecimentos] = useState([]);
  const [motoristas, setMotoristas] = useState([]);

  // Função auxiliar para aguardar e injetar o token do Firebase
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

  const buscarMotoristas = useCallback(async () => {
    try {
      const config = await getAuthHeaders();
      const res = await api.get('/motoristas', config);
      setMotoristas(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('erro ao buscar motoristas:', err);
    }
  }, []);

  const buscarAbastecimentos = useCallback(async () => {
    try {
      setLoading(true);
      const config = await getAuthHeaders();
      const res = await api.get('/abastecimentos', config);
      setAbastecimentos(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('erro ao buscar abastecimentos:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const salvarAbastecimento = async (dados) => {
    setLoading(true);
    try {
      const config = await getAuthHeaders();

      const dadosNormalizados = {
        ...dados,
        motorista: dados.motorista ? dados.motorista.toLowerCase().trim() : '',
        placa: dados.placa ? dados.placa.toLowerCase().trim() : '',
        modelo: dados.modelo ? dados.modelo.toLowerCase().trim() : ''
      };

      const res = await api.post('/abastecimentos', dadosNormalizados, config);

      if (res.status === 200 || res.status === 201) {
        await buscarAbastecimentos();
        setLoading(false);
        return true;
      }
      setLoading(false);
      return false;
    } catch (err) {
      console.error('erro ao salvar abastecimento:', err);
      setLoading(false);
      return false;
    }
  };

  const atualizarAbastecimento = async (id, dados) => {
    setLoading(true);
    try {
      const config = await getAuthHeaders();

      const dadosNormalizados = {
        ...dados,
        motorista: dados.motorista ? dados.motorista.toLowerCase().trim() : '',
        placa: dados.placa ? dados.placa.toLowerCase().trim() : '',
        modelo: dados.modelo ? dados.modelo.toLowerCase().trim() : ''
      };

      const res = await api.put(`/abastecimentos/${id}`, dadosNormalizados, config);

      if (res.status === 200) {
        await buscarAbastecimentos();
        setLoading(false);
        return true;
      }
      setLoading(false);
      return false;
    } catch (err) {
      console.error('erro ao atualizar abastecimento:', err);
      setLoading(false);
      return false;
    }
  };

  const excluirAbastecimento = async (id) => {
    setLoading(true);
    try {
      const config = await getAuthHeaders();
      const res = await api.delete(`/abastecimentos/${id}`, config);

      if (res.status === 200) {
        await buscarAbastecimentos();
        setLoading(false);
        return true;
      }
      setLoading(false);
      return false;
    } catch (err) {
      console.error('erro ao excluir abastecimento:', err);
      setLoading(false);
      return false;
    }
  };

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        buscarMotoristas();
        buscarAbastecimentos();
      }
    });
    return () => unsubscribe();
  }, [buscarMotoristas, buscarAbastecimentos]);

  return {
    abastecimentos,
    motoristas,
    loading,
    buscarAbastecimentos,
    salvarAbastecimento,
    atualizarAbastecimento,
    excluirAbastecimento
  };
}