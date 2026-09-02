import { useState, useCallback } from 'react';

export function useAgendamentos() {
  const [tarefas, setTarefas] = useState([]);
  const [loading, setLoading] = useState(false);

  const salvarAgendamento = async (dados) => {
    setLoading(true);
    try {
      const res = await fetch('/api/agendamentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados)
      });
      setLoading(false);
      return res.ok;
    } catch (err) {
      console.error('erro ao agendar:', err);
      setLoading(false);
      return false;
    }
  };

  const buscarAgendaMotorista = useCallback(async (nomeMotorista) => {
    setLoading(true);
    try {
      // Se um motorista for informado explicitamente, filtra por ele.
      // Caso contrário, busca a lista completa de agendamentos para a gestão.
      const url = nomeMotorista
        ? `/api/agendamentos/motorista/${nomeMotorista.toLowerCase()}`
        : '/api/agendamentos';

      const res = await fetch(url);
      const data = await res.json();
      setTarefas(Array.isArray(data) ? data : []);
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
      const res = await fetch(`/api/agendamentos/${id}`, {
        method: 'DELETE'
      });
      setLoading(false);
      return res.ok;
    } catch (err) {
      console.error('erro ao excluir agendamento:', err);
      setLoading(false);
      return false;
    }
  };

  return { tarefas, salvarAgendamento, buscarAgendaMotorista, excluirAgendamento, loading };
}