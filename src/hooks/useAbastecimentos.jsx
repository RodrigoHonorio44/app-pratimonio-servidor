import { useState, useEffect, useCallback } from 'react';
import { auth } from '../services/firebase';

export function useAbastecimentos() {
  const [loading, setLoading] = useState(false);
  const [abastecimentos, setAbastecimentos] = useState([]);
  const [motoristas, setMotoristas] = useState([]);

  const buscarMotoristas = useCallback(async () => {
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/motoristas', {
        headers: {
          'Authorization': `Bearer ${token || ''}`
        }
      });
      const data = await res.json();
      setMotoristas(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('erro ao buscar motoristas:', err);
    }
  }, []);

  const buscarAbastecimentos = useCallback(async () => {
    try {
      setLoading(true);
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/abastecimentos', {
        headers: {
          'Authorization': `Bearer ${token || ''}`
        }
      });
      const data = await res.json();
      setAbastecimentos(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('erro ao buscar abastecimentos:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const salvarAbastecimento = async (dados) => {
    setLoading(true);
    try {
      const token = await auth.currentUser?.getIdToken();

      const dadosNormalizados = {
        ...dados,
        motorista: dados.motorista ? dados.motorista.toLowerCase().trim() : '',
        placa: dados.placa ? dados.placa.toLowerCase().trim() : '',
        modelo: dados.modelo ? dados.modelo.toLowerCase().trim() : ''
      };

      const res = await fetch('/api/abastecimentos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || ''}`
        },
        body: JSON.stringify(dadosNormalizados)
      });

      if (res.ok) {
        await buscarAbastecimentos();
      }

      setLoading(false);
      return res.ok;
    } catch (err) {
      console.error('erro ao salvar abastecimento:', err);
      setLoading(false);
      return false;
    }
  };

  const atualizarAbastecimento = async (id, dados) => {
    setLoading(true);
    try {
      const token = await auth.currentUser?.getIdToken();

      const dadosNormalizados = {
        ...dados,
        motorista: dados.motorista ? dados.motorista.toLowerCase().trim() : '',
        placa: dados.placa ? dados.placa.toLowerCase().trim() : '',
        modelo: dados.modelo ? dados.modelo.toLowerCase().trim() : ''
      };

      const res = await fetch(`/api/abastecimentos/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || ''}`
        },
        body: JSON.stringify(dadosNormalizados)
      });

      if (res.ok) {
        await buscarAbastecimentos();
      }

      setLoading(false);
      return res.ok;
    } catch (err) {
      console.error('erro ao atualizar abastecimento:', err);
      setLoading(false);
      return false;
    }
  };

  const excluirAbastecimento = async (id) => {
    setLoading(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`/api/abastecimentos/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token || ''}`
        }
      });

      if (res.ok) {
        await buscarAbastecimentos();
      }

      setLoading(false);
      return res.ok;
    } catch (err) {
      console.error('erro ao excluir abastecimento:', err);
      setLoading(false);
      return false;
    }
  };

  useEffect(() => {
    buscarMotoristas();
    buscarAbastecimentos();
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