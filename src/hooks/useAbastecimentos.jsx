import { useState } from 'react';

export function useAbastecimentos() {
  const [loading, setLoading] = useState(false);

  const salvarAbastecimento = async (dados) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');

      // Sanitiza campos de texto para salvar em minúsculas
      const dadosNormalizados = {
        ...dados,
        motorista: dados.motorista ? dados.motorista.toLowerCase() : '',
        placa: dados.placa ? dados.placa.toLowerCase() : '',
        modelo: dados.modelo ? dados.modelo.toLowerCase() : ''
      };

      const res = await fetch('/api/abastecimentos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify(dadosNormalizados)
      });

      setLoading(false);
      return res.ok;
    } catch (err) {
      console.error('erro ao salvar abastecimento:', err);
      setLoading(false);
      return false;
    }
  };

  return { salvarAbastecimento, loading };
}