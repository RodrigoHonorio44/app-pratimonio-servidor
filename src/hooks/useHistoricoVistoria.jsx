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
            unidade: unidadeNome || "Unidade Não Informada",
            setor: setorNome || "Setor Não Informado",
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
          unidade: "Hospital Conde",
          setor: "UPG",
          dataHora: "2026-06-10T14:30:00",
          responsavel: "Rodrigo Honório",
          itensAvaliados: [
            {
              patrimonio: "PAT-00124",
              equipamento: "Mesa de escritório em MDF",
              estadoConservacao: "ocioso",
              observacao: "Tampo riscado e pés frouxos",
              foto: "https://via.placeholder.com/300?text=Foto+Avaria+1",
            },
            {
              patrimonio: "PAT-00125",
              equipamento: "Monitor 24 polegadas",
              estadoConservacao: "bom",
              observacao: "Funcionando perfeitamente",
              foto: null,
            },
          ],
        },
        {
          id: "vist_02",
          unidade: "UPA Inoã",
          setor: "Pediatria",
          dataHora: "2026-06-12T09:15:00",
          responsavel: "Rodrigo Honório",
          itensAvaliados: [
            {
              patrimonio: "PAT-00892",
              equipamento: "Cadeira giratória longarina",
              estadoConservacao: "irrecuperavel",
              observacao: "Braço quebrado e sem regulagem de altura",
              foto: "https://via.placeholder.com/300?text=Foto+Avaria+2",
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
    recarregarVistorias: carregarVistorias,
  };
}