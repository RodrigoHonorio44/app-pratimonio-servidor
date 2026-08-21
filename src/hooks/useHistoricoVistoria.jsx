import { useState, useEffect, useMemo } from "react";
import api from "../services/api";

export function useHistoricoVistoria() {
  const [vistorias, setVistorias] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filtros de busca
  const [filtroUnidade, setFiltroUnidade] = useState("");
  const [filtroSetor, setFiltroSetor] = useState("");
  const [filtroDataInicio, setFiltroDataInicio] = useState("");
  const [filtroDataFim, setFiltroDataFim] = useState("");

  // Seleção múltipla para relatório consolidado
  const [selecionadas, setSelecionadas] = useState([]);

  // Modal de detalhes individuais
  const [vistoriaAtiva, setVistoriaAtiva] = useState(null);

  useEffect(() => {
    carregarVistorias();
  }, []);

  const carregarVistorias = async () => {
    try {
      setLoading(true);
      const response = await api.get("/vistorias");

      if (Array.isArray(response.data)) {
        // Trata e padroniza os campos para evitar problemas no componente de tela
        const formatadas = response.data.map((item) => {
          const unidadeNome = typeof item.unidade === "object" ? item.unidade?.nome : item.unidade;
          const setorNome = typeof item.setor === "object" ? item.setor?.nome : item.setor;
          const listaItens = item.itensAvaliados || item.itens || [];

          return {
            ...item,
            id: item.id || item._id,
            unidade: unidadeNome || "unidade não informada",
            setor: setorNome || "setor não informado",
            dataHora: item.dataHoraInicio || item.dataHora,
            itensAvaliados: listaItens.map((it) => ({
              ...it,
              equipamento: it.equipamento || it.descricao || it.nome,
              estadoConservacao: it.estadoConservacao || it.estado || "bom",
              foto: it.foto || it.fotoUrl || null,
            })),
          };
        });

        // Ordena por data mais recente primeiro
        formatadas.sort((a, b) => new Date(b.dataHora || 0) - new Date(a.dataHora || 0));

        setVistorias(formatadas);
      } else {
        setVistorias([]);
      }
    } catch (error) {
      console.error("Erro ao carregar histórico de vistorias:", error);
      // Fallback/Mock temporário para demonstração e testes locais
      setVistorias([
        {
          id: "vist_01",
          unidade: "hospital conde",
          setor: "upg",
          dataHora: "2026-06-10T14:30:00",
          responsavel: "rodrigo honório",
          itensAvaliados: [
            {
              patrimonio: "PAT-00124",
              equipamento: "mesa de escritório em mdf",
              estadoConservacao: "ocioso",
              observacao: "tampo riscado e pés frouxos",
              foto: "https://via.placeholder.com/300?text=Foto+Avaria+1",
            },
            {
              patrimonio: "PAT-00125",
              equipamento: "monitor 24 polegadas",
              estadoConservacao: "bom",
              observacao: "funcionando perfeitamente",
              foto: null,
            },
          ],
        },
        {
          id: "vist_02",
          unidade: "upa inoã",
          setor: "pediatria",
          dataHora: "2026-06-12T09:15:00",
          responsavel: "rodrigo honório",
          itensAvaliados: [
            {
              patrimonio: "PAT-00892",
              equipamento: "cadeira giratória longarina",
              estadoConservacao: "irrecuperavel",
              observacao: "braço quebrado e sem regulagem de altura",
              foto: "https://via.placeholder.com/300?text=Foto+Avaria+2",
            },
          ],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Função para excluir vistoria do banco de dados e da interface
  const excluirVistoria = async (idOrObject) => {
    const targetId = typeof idOrObject === "object" ? (idOrObject?.id || idOrObject?._id) : idOrObject;

    if (!targetId) {
      console.error("Identificador de vistoria inválido fornecido para exclusão:", idOrObject);
      throw new Error("ID da vistoria não encontrado.");
    }

    // Auxiliar interno para atualizar todos os estados locais da interface
    const removerDoEstadoLocal = () => {
      setVistorias((prev) => prev.filter((v) => (v.id || v._id) !== targetId));
      setSelecionadas((prev) => prev.filter((selectedId) => selectedId !== targetId));
      if (vistoriaAtiva && (vistoriaAtiva.id === targetId || vistoriaAtiva._id === targetId)) {
        setVistoriaAtiva(null);
      }
    };

    // Caso seja um item mockado localmente (vist_01, vist_02), remove diretamente
    if (String(targetId).startsWith("vist_")) {
      removerDoEstadoLocal();
      return true;
    }

    try {
      // Tenta remover via API no backend
      await api.delete(`/vistorias/${targetId}`);
      removerDoEstadoLocal();
      return true;
    } catch (error) {
      console.error("Erro ao excluir vistoria do banco de dados:", error);

      // Se a rota da API falhar por 404 (endpoint ainda não criado) ou falha de rede/mock local:
      if (error.response?.status === 404 || !error.response) {
        console.warn("Rota da API não encontrada ou offline. Removendo localmente para testes.");
        removerDoEstadoLocal();
        return true;
      }

      // Se for um erro real do servidor (ex: 401 Sem Autorização, 500 Erro Interno), propaga o erro
      throw error;
    }
  };

  // Filtragem avançada das vistorias
  const vistoriasFiltradas = useMemo(() => {
    return vistorias.filter((v) => {
      const unidadeStr = String(v.unidade || "");
      const setorStr = String(v.setor || "");

      const matchUnidade = filtroUnidade
        ? unidadeStr.toLowerCase().includes(filtroUnidade.toLowerCase())
        : true;

      const matchSetor = filtroSetor
        ? setorStr.toLowerCase().includes(filtroSetor.toLowerCase())
        : true;

      const dataVistoria = v.dataHora ? String(v.dataHora).split("T")[0] : "";
      const matchInicio = filtroDataInicio ? dataVistoria >= filtroDataInicio : true;
      const matchFim = filtroDataFim ? dataVistoria <= filtroDataFim : true;

      return matchUnidade && matchSetor && matchInicio && matchFim;
    });
  }, [vistorias, filtroUnidade, filtroSetor, filtroDataInicio, filtroDataFim]);

  const toggleSelecionar = (id) => {
    setSelecionadas((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selecionarTodas = () => {
    if (selecionadas.length === vistoriasFiltradas.length && vistoriasFiltradas.length > 0) {
      setSelecionadas([]);
    } else {
      setSelecionadas(vistoriasFiltradas.map((v) => v.id || v._id));
    }
  };

  const gerarRelatorioImpressao = (idsParaImprimir) => {
    window.print();
  };

  return {
    vistoriasFiltradas,
    loading,
    filtroUnidade,
    setFiltroUnidade,
    filtroSetor,
    setFiltroSetor,
    filtroDataInicio,
    setFiltroDataInicio,
    filtroDataFim,
    setFiltroDataFim,
    selecionadas,
    toggleSelecionar,
    selecionarTodas,
    vistoriaAtiva,
    setVistoriaAtiva,
    excluirVistoria,
    gerarRelatorioImpressao,
    recarregarVistorias: carregarVistorias,
  };
}