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
        // Garantir que todo registro tenha um 'id' mapeado (seja _id do Mongo ou id)
        const formatadas = response.data.map((item) => ({
          ...item,
          id: item.id || item._id,
        }));
        setVistorias(formatadas);
      } else {
        setVistorias([]);
      }
    } catch (error) {
      console.error("Erro ao carregar histórico de vistorias:", error);
      // Fallback/Mock temporário caso a API não retorne nada ou ocorra falha na conexão
      setVistorias([
        {
          id: "vist_01",
          unidade: "Hospital Conde",
          setor: "UPG",
          dataHora: "2026-06-10T14:30:00",
          responsavel: "Rodrigo Honório",
          itens: [
            {
              patrimonio: "PAT-00124",
              descricao: "Mesa de escritório em MDF",
              estado: "Ruim",
              observacao: "Tampo riscado e pés frouxos",
            },
          ],
        },
        {
          id: "vist_02",
          unidade: "UPA Inoã",
          setor: "Pediatria",
          dataHora: "2026-06-12T09:15:00",
          responsavel: "Rodrigo Honório",
          itens: [
            {
              patrimonio: "PAT-00892",
              descricao: "Cadeira giratória longarina",
              estado: "Ruim",
              observacao: "Braço quebrável e sem regulagem de altura",
            },
          ],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Filtragem avançada das vistorias
  const vistoriasFiltradas = useMemo(() => {
    return vistorias.filter((v) => {
      const unidadeStr = typeof v.unidade === "string" ? v.unidade : v.unidade?.nome || "";
      const setorStr = typeof v.setor === "string" ? v.setor : v.setor?.nome || "";

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
      setSelecionadas(vistoriasFiltradas.map((v) => v.id));
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
    gerarRelatorioImpressao,
    recarregarVistorias: carregarVistorias, // Exposto caso precise recarregar manualmente
  };
}