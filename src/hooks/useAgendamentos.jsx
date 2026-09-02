import { useState, useCallback } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import api from '../services/api';

export function useAgendamentos() {
  const [tarefas, setTarefas] = useState([]);
  const [loading, setLoading] = useState(false);

  // Função auxiliar para obter os cabeçalhos de autenticação do Firebase
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

  // Função auxiliar para normalizar os dados do formulário em minúsculas
  const normalizarParaLowercase = (obj) => {
    const formatado = {};
    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        formatado[key] = obj[key].trim().toLowerCase();
      } else {
        formatado[key] = obj[key];
      }
    }
    return formatado;
  };

  const salvarAgendamento = async (dados) => {
    setLoading(true);
    try {
      const config = await getAuthHeaders();
      const dadosNormalizados = normalizarParaLowercase(dados);

      const res = await api.post('/agendamentos', dadosNormalizados, config);

      setLoading(false);
      return res.status === 200 || res.status === 201;
    } catch (err) {
      console.error('erro ao agendar:', err);
      setLoading(false);
      return false;
    }
  };

  const buscarAgendaMotorista = useCallback(async (nomeMotorista) => {
    setLoading(true);
    try {
      const config = await getAuthHeaders();

      // Se um motorista for informado, filtra por ele.
      // Caso contrário, busca a lista completa.
      const url = nomeMotorista
        ? `/agendamentos/motorista/${nomeMotorista.trim().toLowerCase()}`
        : '/agendamentos';

      const res = await api.get(url, config);
      setTarefas(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('erro ao buscar agenda:', err);
      setTarefas([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const excluirAgendamento = async (id) => {
    setLoading(true);
    try {
      const config = await getAuthHeaders();
      const res = await api.delete(`/agendamentos/${id}`, config);

      setLoading(false);
      return res.status === 200 || res.status === 204;
    } catch (err) {
      console.error('erro ao excluir agendamento:', err);
      setLoading(false);
      return false;
    }
  };

  return { tarefas, salvarAgendamento, buscarAgendaMotorista, excluirAgendamento, loading };
}