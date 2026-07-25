import { useState } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../services/firebase"; // Ajuste o caminho do seu arquivo de configuração do firebase se necessário

export const useTelaVistoriaPatrimonio = () => {
  const [unidadeSelecionada, setUnidadeSelecionada] = useState("");
  const [setorSelecionado, setSetorSelecionado] = useState("");
  const [tipoMobiliario, setTipoMobiliario] = useState("Cadeira Giratória de Escritório");
  const [patrimonioFiltro, setPatrimonioFiltro] = useState("");
  const [estadoAvaliado, setEstadoAvaliado] = useState("bom");
  const [observacoes, setObservacoes] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSalvarVistoria = async (e) => {
    e.preventDefault();
    if (!unidadeSelecionada || !setorSelecionado) {
      alert("Por favor, selecione a unidade e o setor.");
      return;
    }

    setLoading(true);

    try {
      const dadosVistoria = {
        unidade: unidadeSelecionada,
        setor: setorSelecionado,
        tipoMobiliario: tipoMobiliario,
        patrimonio: patrimonioFiltro.trim() || "N/A",
        estadoConservacao: estadoAvaliado, // "bom", "ocioso", "recuperavel", "irrecuperavel"
        observacoes: observacoes.trim(),
        createdAt: serverTimestamp(), // Salva a data e hora exata do servidor do Firebase
      };

      // Salva na collection "vistoriapatrimonio" (criada automaticamente se não existir)
      await addDoc(collection(db, "vistoriapatrimonio"), dadosVistoria);

      alert("Vistoria salva com sucesso no banco de dados!");
      
      // Limpa os campos após o sucesso
      setObservacoes("");
      setPatrimonioFiltro("");
      setEstadoAvaliado("bom");

    } catch (error) {
      console.error("Erro ao registrar vistoria:", error);
      alert("Ocorreu um erro ao salvar a vistoria. Verifique o console.");
    } finally {
      setLoading(false);
    }
  };

  return {
    unidadeSelecionada,
    setUnidadeSelecionada,
    setorSelecionado,
    setSetorSelecionado,
    tipoMobiliario,
    setTipoMobiliario,
    patrimonioFiltro,
    setPatrimonioFiltro,
    estadoAvaliado,
    setEstadoAvaliado,
    observacoes,
    setObservacoes,
    loading,
    handleSalvarVistoria,
  };
};