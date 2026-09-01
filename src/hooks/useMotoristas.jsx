import { useState, useEffect, useCallback } from 'react';

export function useMotoristas() {
  const [motoristas, setMotoristas] = useState([]);
  const [loading, setLoading] = useState(false);

  const buscarMotoristas = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/motoristas'); // Ajuste a URL da sua API/Firebase
      const data = await response.json();
      setMotoristas(data || []);
    } catch (error) {
      console.error('Erro ao buscar motoristas:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const salvarMotorista = async (dados) => {
    setLoading(true);
    try {
      const response = await fetch('/api/motoristas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...dados,
          nome: dados.nome?.toLowerCase()
        })
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

  useEffect(() => {
    buscarMotoristas();
  }, [buscarMotoristas]);

  return { motoristas, loading, buscarMotoristas, salvarMotorista };
}