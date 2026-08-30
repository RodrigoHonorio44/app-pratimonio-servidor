import { useState, useEffect } from 'react';

export function useReferencias() {
  const [referencias, setReferencias] = useState([]);
  const [categoriaAtiva, setCategoriaAtiva] = useState('todos');
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/referencias.json')
      .then((res) => res.json())
      .then((data) => {
        setReferencias(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Erro ao carregar o catálogo de referências:", err);
        setLoading(false);
      });
  }, []);

  const referenciasFiltradas = referencias.filter((item) => {
    const bateCategoria = categoriaAtiva === 'todos' || item.categoria === categoriaAtiva;
    const bateBusca = item.nomeModelo.toLowerCase().includes(busca.toLowerCase()) ||
                      item.subtitulo.toLowerCase().includes(busca.toLowerCase());
    return bateCategoria && bateBusca;
  });

  return {
    referencias: referenciasFiltradas,
    categoriaAtiva,
    setCategoriaAtiva,
    busca,
    setBusca,
    loading
  };
}