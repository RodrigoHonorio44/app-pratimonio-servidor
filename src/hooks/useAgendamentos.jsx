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
    if (!nomeMotorista) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/agendamentos/motorista/${nomeMotorista.toLowerCase()}`);
      const data = await res.json();
      setTarefas(data);
    } catch (err) {
      console.error('erro ao buscar agenda:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  return { tarefas, salvarAgendamento, buscarAgendaMotorista, loading };
}