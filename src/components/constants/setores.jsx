import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';

const SetoresContext = createContext(null);

export const SetoresProvider = ({ children }) => {
  const [unidadesRaw, setUnidadesRaw] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. Busca todos os documentos do MongoDB
  const carregarSetores = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/setores');
      if (res.ok) {
        const dados = await res.json();
        setUnidadesRaw(Array.isArray(dados) ? dados : []);
      } else {
        console.error("erro ao buscar setores: status", res.status);
      }
    } catch (err) {
      console.error("erro ao conectar com a api /api/setores:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarSetores();
  }, []);

  // 2. Adiciona um novo setor na unidade
  const adicionarSetor = async (unidadeNome, novoSetor) => {
    try {
      const res = await fetch('/api/setores/adicionar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          unidade: String(unidadeNome).trim(), 
          setor: String(novoSetor).trim() 
        })
      });
      if (res.ok) {
        await carregarSetores();
        return true;
      }
    } catch (err) {
      console.error("erro ao adicionar setor:", err);
    }
    return false;
  };

  // 3. Remove o setor do banco
  const removerSetor = async (unidadeNome, setorParaRemover) => {
    try {
      const res = await fetch('/api/setores/remover', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          unidade: String(unidadeNome).trim(), 
          setor: String(setorParaRemover).trim() 
        })
      });
      if (res.ok) {
        await carregarSetores();
        return true;
      }
    } catch (err) {
      console.error("erro ao remover setor:", err);
    }
    return false;
  };

  // Mapeia os setores ordenados alfabeticamente
  const mapaSetores = useMemo(() => {
    const mapa = {};
    unidadesRaw.forEach((doc) => {
      if (doc.unidade && Array.isArray(doc.setores)) {
        const chaveMinusc = String(doc.unidade).toLowerCase().trim();
        
        // Mapeia e ordena alfabeticamente considerando acentuação e ignorando maiúsculas/minúsculas
        const listaSetoresOrdenada = [...doc.setores]
          .map((s) => String(s).trim())
          .sort((a, b) => a.localeCompare(b, 'pt-BR', { sensitivity: 'accent' }));
        
        mapa[chaveMinusc] = listaSetoresOrdenada;
        mapa[doc.unidade] = listaSetoresOrdenada; // Mapeia também com o nome exato da API
      }
    });
    return mapa;
  }, [unidadesRaw]);

  // Lista com os nomes das unidades para o select, também ordenada alfabeticamente
  const unidades = useMemo(() => {
    const listaUnidades = unidadesRaw.map((doc) => String(doc.unidade).toLowerCase().trim());
    return [...new Set(listaUnidades)].sort((a, b) => a.localeCompare(b, 'pt-BR', { sensitivity: 'accent' }));
  }, [unidadesRaw]);

  // Função auxiliar para buscar os setores de qualquer unidade sem falhar
  const obterSetoresDaUnidade = (unidadeBuscada) => {
    if (!unidadeBuscada) return [];
    const buscaNorm = String(unidadeBuscada).toLowerCase().trim();
    
    // Procura no objeto a chave correspondente
    const chaveEncontrada = Object.keys(mapaSetores).find(
      (key) => key.toLowerCase().trim() === buscaNorm
    );

    return chaveEncontrada ? mapaSetores[chaveEncontrada] : [];
  };

  return (
    <SetoresContext.Provider 
      value={{ 
        unidades,
        mapaSetores, 
        MAPA_SETORES_POR_UNIDADE: mapaSetores,
        unidadesRaw, 
        loading, 
        carregarSetores, 
        adicionarSetor, 
        removerSetor,
        obterSetoresDaUnidade
      }}
    >
      {children}
    </SetoresContext.Provider>
  );
};

export const useSetores = () => {
  const context = useContext(SetoresContext);
  if (!context) {
    return {
      unidades: [],
      mapaSetores: {},
      MAPA_SETORES_POR_UNIDADE: {},
      unidadesRaw: [],
      loading: false,
      carregarSetores: async () => {},
      adicionarSetor: async () => false,
      removerSetor: async () => false,
      obterSetoresDaUnidade: () => []
    };
  }
  return context;
};