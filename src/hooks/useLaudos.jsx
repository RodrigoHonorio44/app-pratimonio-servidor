import { useState, useEffect } from "react";
import api from "../services/api";
import { auth } from "../services/firebase";
import { toast } from "react-toastify";
import { MAPA_SETORES_POR_UNIDADE } from "../components/constants/setores";

export const useLaudos = () => {
  const [itens, setItens] = useState([]);
  const [unidadesDisponiveis, setUnidadesDisponiveis] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [buscaPatrimonio, setBuscaPatrimonio] = useState("");
  const [unidadeSelecionada, setUnidadeSelecionada] = useState("Todas");
  const [buscaSetor, setBuscaSetor] = useState("Todos");

  const [laudosPendentes, setLaudosPendentes] = useState([]);
  const [loadingLaudos, setLoadingLaudos] = useState(false);
  const [processandoAcao, setProcessandoAcao] = useState(null);

  const [modalAberto, setModalAberto] = useState(false);
  const [equipamentoSelecionado, setEquipamentoSelecionado] = useState(null);

  useEffect(() => {
    const inicializarPainel = async () => {
      await carregarUnidadesEAtivosIniciais();
      await carregarLaudosPendentes();
    };
    inicializarPainel();
  }, []);

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

  const obterSetoresDaUnidade = (unidade) => {
    if (!unidade || unidade === "Todas" || unidade === "Todas As Unidades...") return null;

    const deParaUnidades = {
      "Hospital Conde": "Hospital Conde",
      "Estoque Patrimônio": "Estoque Patrimônio",
      "Residência Do Paciente": "Residência Do Paciente",
      "Santa Rita": "Upa Santa Rita",
      "Upa Santa Rita": "Upa Santa Rita",
      "UPA Santa Rita": "Upa Santa Rita",
      "Inoã": "Upa Inoã",
      "Upa Inoã": "Upa Inoã",
      "UPA Inoã": "Upa Inoã",
      "Upa Inoa": "Upa Inoã",
      "upa inoa": "Upa Inoã",
      "Barroco": "Samu Barroco",
      "Samu Barroco": "Samu Barroco",
      "Ponta Negra": "Samu Ponta Negra",
      "Samu Ponta Negra": "Samu Ponta Negra",
      "Centro": "Samu Centro",
      "Samu Centro": "Samu Centro"
    };

    const chaveUnidade = deParaUnidades[unidade] || unidade;
    let listaSetores = [];

    if (chaveUnidade && MAPA_SETORES_POR_UNIDADE[chaveUnidade]) {
      listaSetores = [...MAPA_SETORES_POR_UNIDADE[chaveUnidade]];
    } else {
      const setoresUnicos = new Set();
      const unidadeNorm = normalizarParaComparacao(unidade);

      itens.forEach((item) => {
        const itemUnidadeNorm = normalizarParaComparacao(item.unidade || "");
        if (itemUnidadeNorm.includes(unidadeNorm) && item.setor && item.setor.trim() !== "") {
          setoresUnicos.add(item.setor.trim());
        }
      });
      listaSetores = Array.from(setoresUnicos);
    }

    listaSetores.sort((a, b) => a.localeCompare(b, "pt", { sensitivity: "base" }));

    if (buscaSetor !== "Todos" && buscaSetor !== "Todos Os Setores..." && buscaSetor.trim() !== "") {
      const termoNorm = normalizarParaComparacao(buscaSetor);
      return listaSetores.filter(setor => 
        normalizarParaComparacao(setor).includes(termoNorm)
      );
    }

    return listaSetores.length > 0 ? listaSetores : null;
  };

  // Carrega laudos em aberto/pendentes via API
  const carregarLaudosPendentes = async () => {
    setLoadingLaudos(true);
    try {
      const currentUser = auth.currentUser;
      const token = currentUser ? await currentUser.getIdToken() : "";

      const response = await api.get("/laudos", {
        params: { status: "pendente", limit: 50 },
        headers: { Authorization: `Bearer ${token}` }
      });

      const dados = response.data;
      const listaLaudos = Array.isArray(dados) 
        ? dados 
        : (dados?.laudos || dados?.docs || []);

      setLaudosPendentes(listaLaudos);
    } catch (error) {
      console.error("Erro ao carregar laudos pendentes:", error);
      setLaudosPendentes([]);
    } finally {
      setLoadingLaudos(false);
    }
  };

  // Aprova o laudo e move o ativo para 'inutilizado'
  const handleAprovarLaudo = async (laudoParam, equipamentoParam) => {
    const laudoId = typeof laudoParam === "object" ? (laudoParam._id || laudoParam.id) : laudoParam;
    const laudoObj = typeof laudoParam === "object" ? laudoParam : laudosPendentes.find(l => (l._id || l.id) === laudoId);

    const equipamentoId = equipamentoParam || laudoObj?.equipamentoId || laudoObj?.ativoId || laudoObj?.idAtivo;

    setProcessandoAcao(laudoId);
    try {
      const currentUser = auth.currentUser;
      const token = currentUser ? await currentUser.getIdToken() : "";
      const headers = { Authorization: `Bearer ${token}` };

      // 1. Atualiza status do laudo para aprovado
      await api.put(
        `/laudos/${laudoId}`,
        {
          status: "aprovado",
          dataDecisao: new Date().toISOString(),
        },
        { headers }
      );

      // 2. Atualiza o status do equipamento no cadastro de ativos para 'inutilizado'
      if (equipamentoId) {
        await api.put(
          `/ativos/${equipamentoId}`,
          {
            status: "inutilizado",
            dataBaixa: new Date().toISOString(),
            ultimaMovimentacao: new Date().toISOString(),
            motivoBaixa: laudoObj?.justificativaLaudo || "Laudo técnico de inviabilidade aprovado"
          },
          { headers }
        );
      }

      toast.success("Laudo aprovado e ativo movido para Inutilizados!");
      await carregarLaudosPendentes();
      if (hasSearched) carregarDados();
    } catch (error) {
      console.error("Erro ao aprovar laudo:", error);
      toast.error(error.response?.data?.message || "Erro ao aprovar o laudo no sistema.");
    } finally {
      setProcessandoAcao(null);
    }
  };

  // Cancela o laudo e garante que o ativo permanece/retorna como 'operante'
  const handleCancelarLaudo = async (laudoParam, equipamentoParam) => {
    const laudoId = typeof laudoParam === "object" ? (laudoParam._id || laudoParam.id) : laudoParam;
    const laudoObj = typeof laudoParam === "object" ? laudoParam : laudosPendentes.find(l => (l._id || l.id) === laudoId);

    const equipamentoId = equipamentoParam || laudoObj?.equipamentoId || laudoObj?.ativoId || laudoObj?.idAtivo;

    setProcessandoAcao(laudoId);
    try {
      const currentUser = auth.currentUser;
      const token = currentUser ? await currentUser.getIdToken() : "";
      const headers = { Authorization: `Bearer ${token}` };

      await api.put(
        `/laudos/${laudoId}`,
        {
          status: "cancelado",
          dataDecisao: new Date().toISOString(),
        },
        { headers }
      );

      if (equipamentoId) {
        await api.put(
          `/ativos/${equipamentoId}`,
          {
            status: "operante",
            ultimaMovimentacao: new Date().toISOString(),
          },
          { headers }
        );
      }

      toast.info("Laudo técnico cancelado e ativo mantido como operante.");
      await carregarLaudosPendentes();
      if (hasSearched) carregarDados();
    } catch (error) {
      console.error("Erro ao cancelar laudo:", error);
      toast.error(error.response?.data?.message || "Erro ao cancelar o laudo.");
    } finally {
      setProcessandoAcao(null);
    }
  };

  const carregarUnidadesEAtivosIniciais = async () => {
    try {
      const currentUser = auth.currentUser;
      const token = currentUser ? await currentUser.getIdToken() : "";

      const response = await api.get("/ativos", {
        params: { limit: 1000 },
        headers: { Authorization: `Bearer ${token}` }
      });

      const dados = Array.isArray(response.data) ? response.data : (response.data?.ativos || response.data?.docs || []);
      const mapaUnicas = new Map();

      dados.forEach((item) => {
        if (item.unidade) {
          const original = item.unidade.trim();
          if (original) {
            const chaveNorm = normalizarParaComparacao(original);
            if (!mapaUnicas.has(chaveNorm)) {
              mapaUnicas.set(chaveNorm, original);
            }
          }
        }
      });

      const listaUnidades = Array.from(mapaUnicas.values()).sort((a, b) => 
        a.localeCompare(b, "pt", { sensitivity: "base" })
      );

      setUnidadesDisponiveis(listaUnidades);
      setItens(dados);
    } catch (error) {
      console.error("Erro ao carregar unidades iniciais:", error);
    }
  };

  const carregarDados = async (e) => {
    if (e) e.preventDefault();
    if (loading) return;
    setLoading(true);
    setHasSearched(true);

    try {
      const currentUser = auth.currentUser;
      const token = currentUser ? await currentUser.getIdToken() : "";

      const response = await api.get("/ativos", {
        headers: { Authorization: `Bearer ${token}` }
      });

      const todosOsDados = Array.isArray(response.data) ? response.data : (response.data?.ativos || response.data?.docs || []);
      setItens(todosOsDados);

      if (todosOsDados.length > 0) {
        toast.success(`${todosOsDados.length} itens encontrados.`);
      } else {
        toast.info("Nenhum item encontrado no banco.");
      }
    } catch (error) {
      console.error("Erro ao carregar:", error);
      toast.error("Erro ao consultar equipamentos.");
    } finally {
      setLoading(false);
    }
  };

  const handleLimparBusca = () => {
    setBuscaPatrimonio("");
    setBuscaSetor("Todos");
    setUnidadeSelecionada("Todas");
    setHasSearched(false);
  };

  const abrirLaudo = (item) => {
    setEquipamentoSelecionado(item);
    setModalAberto(true);
  };

  const itensFiltrados = itens.filter((item) => {
    const statusItemLower = String(item.status || "operante").toLowerCase().trim();
    const statusBloqueados = ["inutilizados", "baixado", "descartado", "baixados", "inutilizado"];
    if (statusBloqueados.includes(statusItemLower)) return false;

    const unidadeItemNorm = normalizarParaComparacao(item.unidade || "");
    const unidadeSelecionadaNorm = normalizarParaComparacao(unidadeSelecionada);
    const matchUnidade =
      unidadeSelecionada === "Todas" ||
      unidadeSelecionada === "Todas As Unidades..." ||
      unidadeItemNorm.includes(unidadeSelecionadaNorm);

    const setorItemNorm = normalizarParaComparacao(item.setor || "");
    const setorSelecionadoNorm = normalizarParaComparacao(buscaSetor);
    const matchSetor =
      buscaSetor === "Todos" ||
      buscaSetor === "Todos Os Setores..." ||
      buscaSetor.trim() === "" ||
      setorItemNorm === setorSelecionadoNorm ||
      setorItemNorm.includes(setorSelecionadoNorm);

    let matchBusca = true;
    if (buscaPatrimonio.trim() !== "") {
      const termoNorm = normalizarParaComparacao(buscaPatrimonio);
      const patItemNorm = normalizarParaComparacao(item.patrimonio || "");
      const nomeItemNorm = normalizarParaComparacao(item.nome || "");
      matchBusca =
        patItemNorm.includes(termoNorm) || nomeItemNorm.includes(termoNorm);
    }

    return matchUnidade && matchSetor && matchBusca;
  });

  return {
    itensFiltrados,
    unidadesDisponiveis,
    setoresDaUnidadeAtual: obterSetoresDaUnidade(unidadeSelecionada),
    loading,
    hasSearched,
    buscaPatrimonio,
    setBuscaPatrimonio,
    unidadeSelecionada,
    setUnidadeSelecionada,
    buscaSetor,
    setBuscaSetor,
    laudosPendentes,
    loadingLaudos,
    processandoAcao,
    modalAberto,
    setModalAberto,
    equipamentoSelecionado,
    setEquipamentoSelecionado,
    carregarLaudosPendentes,
    carregarDados,
    handleAprovarLaudo,
    handleCancelarLaudo,
    handleLimparBusca,
    abrirLaudo,
  };
};