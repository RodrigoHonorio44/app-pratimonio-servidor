import { useState, useCallback } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import api from '../services/api';

export function useAgendamentos() {
  const [tarefas, setTarefas] = useState([]);
  const [loading, setLoading] = useState(false);

  // Estados para Toast e Modal de Confirmação
  const [toast, setToast] = useState({ exibe: false, mensagem: '', tipo: 'sucesso' });
  const [confirmModal, setConfirmModal] = useState({ exibe: false, id: null, titulo: '' });

  const mostrarToast = (mensagem, tipo = 'sucesso') => {
    setToast({ exibe: true, mensagem, tipo });
    setTimeout(() => {
      setToast({ exibe: false, mensagem: '', tipo: 'sucesso' });
    }, 3500);
  };

  const fecharModal = () => {
    setConfirmModal({ exibe: false, id: null, titulo: '' });
  };

  // Obtenção segura do usuário autenticado no Firebase
  const getUsuarioAtual = () => {
    const auth = getAuth();
    if (auth.currentUser) return Promise.resolve(auth.currentUser);

    return new Promise((resolve) => {
      let unsubscribe;
      const timer = setTimeout(() => {
        if (unsubscribe) unsubscribe();
        resolve(auth.currentUser || null);
      }, 3500);

      unsubscribe = onAuthStateChanged(auth, (user) => {
        clearTimeout(timer);
        unsubscribe();
        resolve(user);
      });
    });
  };

  const getAuthHeaders = async () => {
    const user = await getUsuarioAtual();

    if (!user) {
      throw new Error('Usuário não autenticado.');
    }

    const token = await user.getIdToken(true);
    return {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
  };

  // Normalização de todos os campos de texto para minúsculas
  const normalizarParaLowercase = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;
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

      if (res.status === 200 || res.status === 201) {
        mostrarToast('Agendamento salvo com sucesso!', 'sucesso');
        return true;
      }
      mostrarToast('Erro ao salvar agendamento.', 'erro');
      return false;
    } catch (err) {
      console.error('Erro ao agendar:', err?.response?.data || err.message);
      mostrarToast('Erro ao salvar agendamento.', 'erro');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const buscarAgendaMotorista = useCallback(async (nomeMotorista) => {
    setLoading(true);
    try {
      const config = await getAuthHeaders();

      const url = nomeMotorista && nomeMotorista.trim()
        ? `/agendamentos/motorista/${encodeURIComponent(nomeMotorista.trim().toLowerCase())}`
        : '/agendamentos';

      const res = await api.get(url, config);
      setTarefas(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Erro ao buscar agenda:', err?.response?.data || err.message);
      mostrarToast('Erro ao carregar agendamentos.', 'erro');
      setTarefas([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Solicita a confirmação via Modal
  const solicitarExclusao = (id, titulo = '') => {
    setConfirmModal({
      exibe: true,
      id,
      titulo: titulo ? titulo.trim().toLowerCase() : 'este agendamento'
    });
  };

  // Executa a exclusão após o aceite no Modal
  const confirmarExclusao = async () => {
    const id = confirmModal.id;
    fecharModal();

    if (!id) return false;

    setLoading(true);
    try {
      const config = await getAuthHeaders();
      const res = await api.delete(`/agendamentos/${id}`, config);

      if (res.status === 200 || res.status === 204) {
        mostrarToast('Agendamento excluído com sucesso!', 'sucesso');
        setTarefas((prev) => prev.filter((item) => (item._id?.$oid || item._id || item.id) !== id));
        return true;
      }
      mostrarToast('Erro ao excluir agendamento.', 'erro');
      return false;
    } catch (err) {
      console.error('Erro ao excluir agendamento:', err?.response?.data || err.message);
      mostrarToast('Erro ao excluir agendamento.', 'erro');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    tarefas,
    salvarAgendamento,
    buscarAgendaMotorista,
    solicitarExclusao,
    confirmarExclusao,
    fecharModal,
    loading,
    toast,
    confirmModal,
    mostrarToast
  };
}