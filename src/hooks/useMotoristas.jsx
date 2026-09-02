import { useState, useEffect, useCallback } from 'react';
import { auth } from '../services/firebase';

export function useMotoristas() {
  const [motoristas, setMotoristas] = useState([]);
  const [loading, setLoading] = useState(false);

  const buscarMotoristas = useCallback(async () => {
    setLoading(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch('/api/motoristas', {
        headers: {
          'Authorization': `Bearer ${token || ''}`
        }
      });
      const data = await response.json();
      setMotoristas(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erro ao buscar motoristas:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const salvarMotorista = async (dados) => {
    setLoading(true);
    try {
      const token = await auth.currentUser?.getIdToken();

      const payload = {
        ...dados,
        nome: dados.nome ? dados.nome.toLowerCase().trim() : '',
        matricula: dados.matricula ? dados.matricula.toLowerCase().trim() : '',
        telefone: dados.telefone ? String(dados.telefone).replace(/\D/g, '') : ''
      };

      const response = await fetch('/api/motoristas', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || ''}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        await buscarMotoristas();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erro ao salvar motorista:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const atualizarMotorista = async (id, dados) => {
    setLoading(true);
    try {
      const token = await auth.currentUser?.getIdToken();

      const payload = {
        ...dados,
        nome: dados.nome ? dados.nome.toLowerCase().trim() : '',
        matricula: dados.matricula ? dados.matricula.toLowerCase().trim() : '',
        telefone: dados.telefone ? String(dados.telefone).replace(/\D/g, '') : ''
      };

      const response = await fetch(`/api/motoristas/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || ''}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        await buscarMotoristas();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erro ao atualizar motorista:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const excluirMotorista = async (id) => {
    setLoading(true);
    try {
      const token = await auth.currentUser?.getIdToken();

      const response = await fetch(`/api/motoristas/${id}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${token || ''}`
        }
      });

      if (response.ok) {
        await buscarMotoristas();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erro ao excluir motorista:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    buscarMotoristas();
  }, [buscarMotoristas]);

  return { motoristas, loading, buscarMotoristas, salvarMotorista, atualizarMotorista, excluirMotorista };
}