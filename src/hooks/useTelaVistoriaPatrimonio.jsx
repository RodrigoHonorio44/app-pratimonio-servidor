import { useState, useEffect } from "react";
import { auth } from "../services/firebase";
import api from "../services/api";

export const useTelaVistoriaPatrimonio = () => {
  const [unidadeSelecionada, setUnidadeSelecionada] = useState("");
  const [setorSelecionado, setSetorSelecionado] = useState("");
  const [ativosDoSetor, setAtivosDoSetor] = useState([]);
  const [loadingAtivos, setLoadingAtivos] = useState(false);
  const [loading, setLoading] = useState(false);

  // Normalizador de texto para comparação segura
  const normalizarParaComparacao = (texto) => {
    if (!texto) return "";
    return texto
      .toString()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[/\s._-]/g, "")
      .trim();
  };

  // Funcao para resetar/limpar as selecoes de pesquisa
  const limparFiltros = () => {
    setUnidadeSelecionada("");
    setSetorSelecionado("");
    setAtivosDoSetor([]);
  };

  // 1. BUSCA OS EQUIPAMENTOS VIA AXIOS NO ENDPOINT '/ativos'
  useEffect(() => {
    const buscarAtivosDaApi = async () => {
      if (!unidadeSelecionada || !setorSelecionado) {
        setAtivosDoSetor([]);
        return;
      }

      setLoadingAtivos(true);

      try {
        const currentUser = auth.currentUser;
        const token = currentUser ? await currentUser.getIdToken() : "";

        const response = await api.get("/ativos", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const dadosBrutos = response.data;
        const todosOsDados = Array.isArray(dadosBrutos)
          ? dadosBrutos
          : dadosBrutos?.ativos || dadosBrutos?.dados || [];

        // Filtra os ativos em memoria combinando Unidade e Setor selecionados
        const filtrados = todosOsDados.filter((item) => {
          const unidadeItemNorm = normalizarParaComparacao(item.unidade || "");
          const unidadeSelNorm = normalizarParaComparacao(unidadeSelecionada);
          const matchUnidade = unidadeItemNorm.includes(unidadeSelNorm);

          const setorItemNorm = normalizarParaComparacao(item.setor || "");
          const setorSelNorm = normalizarParaComparacao(setorSelecionado);
          const matchSetor =
            setorItemNorm === setorSelNorm || setorItemNorm.includes(setorSelNorm);

          return matchUnidade && matchSetor;
        });

        setAtivosDoSetor(filtrados);
      } catch (error) {
        console.error("Erro ao buscar equipamentos na API /ativos:", error);
        setAtivosDoSetor([]);
      } finally {
        setLoadingAtivos(false);
      }
    };

    buscarAtivosDaApi();
  }, [unidadeSelecionada, setorSelecionado]);

  // 2. GRAVA A VISTORIA FINALIZADA VIA API AXIOS
  const handleFinalizarVistoriaLote = async ({ unidade, setor, dataHora, itens }) => {
    if (!unidade || !setor) {
      alert("Por favor, selecione a unidade e o setor.");
      return;
    }

    if (!itens || itens.length === 0) {
      alert("Adicione pelo menos um equipamento para finalizar a vistoria.");
      return;
    }

    setLoading(true);

    try {
      const currentUser = auth.currentUser;
      const token = currentUser ? await currentUser.getIdToken() : "";

      const payloadVistoria = {
        unidade,
        setor,
        dataHoraInicio: dataHora,
        quantidadeItens: itens.length,
        itensAvaliados: itens.map((item) => ({
          patrimonio: item.patrimonio || "S/P",
          equipamento: item.equipamento || item.nome,
          estadoConservacao: item.estado,
          observacao: item.observacao || "",
          avaliadoEm: item.dataHora,
        })),
        createdAt: new Date().toISOString(),
      };

      await api.post("/vistorias", payloadVistoria, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      alert("Vistoria gravada com sucesso!");

      // Dispara a janela de impressão do relatório
      window.print();
    } catch (error) {
      console.error("Erro ao salvar no endpoint /vistorias:", error);
      alert("Ocorreu um erro ao gravar a vistoria no banco de dados.");
    } finally {
      setLoading(false);
    }
  };

  return {
    unidadeSelecionada,
    setUnidadeSelecionada,
    setorSelecionado,
    setSetorSelecionado,
    ativosDoSetor,
    loadingAtivos,
    loading,
    limparFiltros,
    handleFinalizarVistoriaLote,
  };
};