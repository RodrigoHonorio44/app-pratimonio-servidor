import { useState, useEffect, useCallback } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import api from '../services/api';

export function useMotoristas() {
  const [motoristas, setMotoristas] = useState([]);
  const [loading, setLoading] = useState(false);

  const buscarMotoristas = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/motoristas');
      setMotoristas(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Erro ao buscar motoristas:', error);
      setMotoristas([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const salvarMotorista = async (dados) => {
    setLoading(true);
    try {
      const payload = {
        ...dados,
        nome: dados.nome ? dados.nome.toLowerCase().trim() : '',
        matricula: dados.matricula ? dados.matricula.toLowerCase().trim() : '',
        telefone: dados.telefone ? String(dados.telefone).replace(/\D/g, '') : ''
      };

      const response = await api.post('/motoristas', payload);

      if (response.status === 200 || response.status === 201) {
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
      const payload = {
        ...dados,
        nome: dados.nome ? dados.nome.toLowerCase().trim() : '',
        matricula: dados.matricula ? dados.matricula.toLowerCase().trim() : '',
        telefone: dados.telefone ? String(dados.telefone).replace(/\D/g, '') : ''
      };

      const response = await api.put(`/motoristas/${id}`, payload);

      if (response.status === 200) {
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
      const response = await api.delete(`/motoristas/${id}`);

      if (response.status === 200 || response.status === 204) {
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
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        buscarMotoristas();
      } else {
        setMotoristas([]);
      }
    });

    return () => unsubscribe();
  }, [buscarMotoristas]);

  return { 
    motoristas, 
    loading, 
    buscarMotoristas, 
    salvarMotorista, 
    atualizarMotorista, 
    excluirMotorista 
  };
}