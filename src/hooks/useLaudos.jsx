import { useState, useEffect } from "react";
import { auth } from "../services/firebase";
import { toast } from "react-toastify";
import { MAPA_SETORES_POR_UNIDADE } from "../components/constants/setores"; 

const API_URL = "http://IP_DA_SUA_VPS:3000/api";

export const useLaudos = () => {
  const [itens, setItens] = useState([]);
  const [unidadesDisponiveis, setUnidadesDisponiveis] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [buscaPatrimonio, setBuscaPatrimonio] = useState("");
  const [unidadeSelecionada, setUnidadeSelecionada] = useState("");
  const [buscaSetor, setBuscaSetor] = useState("");

  const [laudosPendentes, setLaudosPendentes] = useState([]);
  const [loadingLaudos, setLoadingLaudos] = useState(false);
  const [processandoAcao, setProcessandoAcao] = useState(null);

  const [modalAberto, setModalAberto] = useState(false);
  const [equipamentoSelecionado, setEquipamentoSelecionado] = useState(null);

  useEffect(() => {
    const inicializarPainel = async () => {
      await carregarUnidades();
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
    if (!unidade || unidade === "Todas") return null;

    const unidadeLimpa = unidade.toString().trim();
    
    const chaveEncontrada = Object.keys(MAPA_SETORES_POR_UNIDADE).find((k) => {
      const kNorm = normalizarParaComparacao(k);
      const uNorm = normalizarParaComparacao(unidadeLimpa);
      return k.toLowerCase() === unidadeLimpa.toLowerCase() || kNorm === uNorm || kNorm.includes(uNorm) || uNorm.includes(kNorm);
    });

    if (chaveEncontrada && MAPA_SETORES_POR_UNIDADE[chaveEncontrada]) {
      return MAPA_SETORES_POR_UNIDADE[chaveEncontrada];
    }

    const deParaUnidades = {
      "Hospital Conde": "Hospital Conde",
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

    let chaveMapeada = deParaUnidades[unidadeLimpa] || deParaUnidades[unidade];
    if (chaveMapeada && MAPA_SETORES_POR_UNIDADE[chaveMapeada]) {
      return MAPA_SETORES_POR_UNIDADE[chaveMapeada];
    }

    const setoresUnicos = new Set();
    itens.forEach((item) => {
      const itemUnidadeNorm = normalizarParaComparacao(item.unidade || "");
      const unidadeSelecionadaNorm = normalizarParaComparacao(unidade);
      if (itemUnidadeNorm.includes(unidadeSelecionadaNorm) && item.setor && item.setor.trim() !== "") {
        setoresUnicos.add(item.setor.trim());
      }
    });

    const listaFallback = Array.from(setoresUnicos).sort();
    return listaFallback.length > 0 ? listaFallback : null;
  };

  const carregarLaudosPendentes = async () => {
    setLoadingLaudos(true);
    try {
      const currentUser = auth.currentUser;
      const token = currentUser ? await currentUser.getIdToken() : "";

      const resposta = await fetch(`${API_URL}/laudos`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!resposta.ok) throw new Error("Erro ao buscar laudos");

      const listaCompleta = await resposta.json();
      const listaLaudos = listaCompleta.filter(l => (l.status || "").toLowerCase() === "pendente").slice(0, 25);
      setLaudosPendentes(listaLaudos);
    } catch (error) {
      console.error("Erro ao carregar laudos pendentes:", error);
    } finally {
      setLoadingLaudos(false);
    }
  };

  const handleAprovarLaudo = async (laudoId, equipamentoId) => {
    setProcessandoAcao(laudoId);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("Usuário não autenticado");
      const token = await currentUser.getIdToken();

      // Atualiza o status do laudo
      await fetch(`${API_URL}/laudos/${laudoId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          status: "aprovado",
          dataDecisao: new Date().toISOString()
        })
      });

      if (equipamentoId) {
        await fetch(`${API_URL}/ativos/${equipamentoId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            status: "inutilizados",
            dataBaixa: new Date().toISOString(),
            ultimaMovimentacao: new Date().toISOString()
          })
        });
      }

      toast.success("Laudo aprovado e ativo movido para Inutilizados! 🎉");
      await carregarLaudosPendentes();
      if (hasSearched) carregarDados();
    } catch (error) {
      console.error("Erro ao aprovar laudo:", error);
      toast.error("Erro ao aprovar o laudo.");
    } finally {
      setProcessandoAcao(null);
    }
  };

  const handleCancelarLaudo = async (laudoId, equipamentoId) => {
    setProcessandoAcao(laudoId);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("Usuário não autenticado");
      const token = await currentUser.getIdToken();

      await fetch(`${API_URL}/laudos/${laudoId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          status: "cancelado",
          dataDecisao: new Date().toISOString()
        })
      });

      if (equipamentoId) {
        await fetch(`${API_URL}/ativos/${equipamentoId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            status: "operante",
            ultimaMovimentacao: new Date().toISOString()
          })
        });
      }

      toast.info("Laudo técnico cancelado e ativo restaurado para operante.");
      await carregarLaudosPendentes();
      if (hasSearched) carregarDados();
    } catch (error) {
      console.error("Erro ao cancelar laudo:", error);
      toast.error("Erro ao cancelar o laudo.");
    } finally {
      setProcessandoAcao(null);
    }
  };

  const carregarUnidades = async () => {
    try {
      const currentUser = auth.currentUser;
      const token = currentUser ? await currentUser.getIdToken() : "";

      const resposta = await fetch(`${API_URL}/ativos`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!resposta.ok) return;
      const dados = await resposta.json();

      const listaUnidades = Array.from(
        new Set(
          dados
            .map((item) => (item.unidade || "").trim())
            .filter(Boolean)
        )
      ).sort((a, b) => a.localeCompare(b, "pt", { sensitivity: "base" }));

      setUnidadesDisponiveis(listaUnidades);
    } catch (error) {
      console.error("Erro ao pré-carregar unidades:", error);
    }
  };

  const carregarDados = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setHasSearched(true);

    try {
      const currentUser = auth.currentUser;
      const token = currentUser ? await currentUser.getIdToken() : "";

      const resposta = await fetch(`${API_URL}/ativos`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!resposta.ok) throw new Error("Erro ao consultar equipamentos");

      const dados = await resposta.json();
      setItens(dados);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao consultar equipamentos.");
    } finally {
      setLoading(false);
    }
  };

  const handleLimparBusca = () => {
    setBuscaPatrimonio("");
    setBuscaSetor("");
    setUnidadeSelecionada("");
    setItens([]);
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

    const termo = buscaPatrimonio.trim();
    const patrimonioItemNorm = normalizarParaComparacao(item.patrimonio || "");
    const nomeItemNorm = normalizarParaComparacao(item.nome || "");
    const termoNorm = normalizarParaComparacao(termo);

    const eBuscaExataPatrimonio = termo && patrimonioItemNorm.includes(termoNorm);

    if (!eBuscaExataPatrimonio) {
      if (unidadeSelecionada.trim() && unidadeSelecionada !== "Todas") {
        const unidadeItemNorm = normalizarParaComparacao(item.unidade || "");
        const unidadeSelecionadaNorm = normalizarParaComparacao(unidadeSelecionada);
        if (!unidadeItemNorm.includes(unidadeSelecionadaNorm)) return false;
      }

      if (buscaSetor.trim() && buscaSetor !== "Todos") {
        const setorItemNorm = normalizarParaComparacao(item.setor || "");
        const setorBuscaNorm = normalizarParaComparacao(buscaSetor);
        if (!setorItemNorm.includes(setorBuscaNorm)) return false;
      }
    }

    if (!termo) return true; 

    return patrimonioItemNorm.includes(termoNorm) || nomeItemNorm.includes(termoNorm);
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