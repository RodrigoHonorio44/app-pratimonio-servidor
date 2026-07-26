import { useEffect, useState, useMemo, useCallback } from "react";
import { auth } from "../services/firebase";
import api from "../services/api";
import { toast } from "react-toastify";

const WEB_APP_URL =
  "https://script.google.com/macros/s/AKfycbyGgcYmM7oXjpx0li898F2RCy5M4a6os5Ti9s9t5J6h9BbgO0W8PpOfrQ3TxqIOCNNVpg/exec";

export const usePainelAnalista = () => {
  const [chamados, setChamados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);

  const [inputValue, setInputValue] = useState("");
  const [termoBusca, setTermoBusca] = useState("");

  const [enviandoPlanilha, setEnviandoPlanilha] = useState(null);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const itensPorPagina = 12;

  // CONTROLE DO MODAL UNIFICADO
  const [mostrarModal, setMostrarModal] = useState(false);
  const [tipoModal, setTipoModal] = useState(""); // "visualizar", "finalizar" ou "pausar"
  const [chamadoSelecionado, setChamadoSelecionado] = useState(null);

  // ESTADOS DOS CAMPOS DOS MODAIS
  const [equipamento, setEquipamento] = useState("");
  const [patrimonio, setPatrimonio] = useState("");
  const [parecerTecnico, setParecerTecnico] = useState("");
  const [motivoPausa, setMotivoPausa] = useState("");
  const [detalhePausa, setDetalhePausa] = useState("");

  const user = auth.currentUser;

  const isRemaneja = useCallback(
    (item) =>
      item?.tipo?.toLowerCase().includes("remanejamento") ||
      !!item?.setorDestino,
    []
  );

  const analistaNome = useMemo(() => {
    return (
      userData?.nome ||
      user?.displayName ||
      user?.email?.split("@")[0] ||
      "analista"
    );
  }, [userData, user]);

  const formatarDataHora = (timestamp) => {
    if (!timestamp) return "n/a";
    
    // Se for um objeto do Firebase Firestore com seconds
    if (typeof timestamp === "object" && timestamp.seconds) {
      return new Date(timestamp.seconds * 1000).toLocaleString("pt-BR");
    }

    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    if (isNaN(date.getTime())) return "n/a";
    return date.toLocaleString("pt-BR");
  };

  const executarBusca = () => {
    setTermoBusca(inputValue);
    setPaginaAtual(1);
  };

  const limparBusca = () => {
    setInputValue("");
    setTermoBusca("");
    setPaginaAtual(1);
  };

  const calcularSlaLinha = useCallback((item) => {
    const statusAtual = item?.status?.toLowerCase() || "";

    if (statusAtual === "fechado" || statusAtual === "arquivado") {
      return { texto: "concluído", estourado: false, classe: "bg-slate-100 text-slate-500 border border-slate-200", bola: "bg-slate-400" };
    }

    const timestampCriado = item?.criadoEm || item?.criatedAt || item?.createdAt || item?.data || item?.timestamp;
    if (!timestampCriado) {
      return { texto: "--", estourado: false, classe: "bg-slate-100 text-slate-400", bola: "bg-slate-300" };
    }

    let dataAbertura;
    if (typeof timestampCriado === "object" && timestampCriado.seconds) {
      dataAbertura = new Date(timestampCriado.seconds * 1000);
    } else {
      dataAbertura = timestampCriado.toDate ? timestampCriado.toDate() : new Date(timestampCriado);
    }

    if (isNaN(dataAbertura.getTime())) {
      return { texto: "--", estourado: false, classe: "bg-slate-100 text-slate-400", bola: "bg-slate-300" };
    }

    const agora = new Date();
    const tempoDecorridoHoras = (agora - dataAbertura) / (1000 * 60 * 60);

    if (statusAtual === "aberto") {
      const limiteAtendimento = 6;
      if (tempoDecorridoHoras > limiteAtendimento) {
        const atraso = Math.floor(tempoDecorridoHoras - limiteAtendimento);
        return {
          texto: `sla atendimento estourado (+${atraso}h)`,
          estourado: true,
          classe: "bg-red-100 text-red-600 animate-pulse border border-red-200",
          bola: "bg-red-600 animate-ping"
        };
      }
      return {
        texto: "prazo atendimento ok",
        estourado: false,
        classe: "bg-emerald-100 text-emerald-700 border border-emerald-200",
        bola: "bg-emerald-500"
      };
    }

    const limiteSolucao = 12;
    if (tempoDecorridoHoras > limiteSolucao) {
      const atraso = Math.floor(tempoDecorridoHoras - limiteSolucao);
      return {
        texto: `sla solução estourado (+${atraso}h)`,
        estourado: true,
        classe: "bg-red-100 text-red-600 animate-pulse border border-red-200",
        bola: "bg-red-600 animate-ping"
      };
    }

    return {
      texto: "prazo solução ok",
      estourado: false,
      classe: "bg-emerald-100 text-emerald-700 border border-emerald-200",
      bola: "bg-emerald-500"
    };
  }, []);

  // Carrega os dados do usuário logado via API do servidor
  useEffect(() => {
    if (!user) return;
    const fetchUserData = async () => {
      try {
        const response = await api.get(`/usuarios/${user.uid}`);
        if (response.data) setUserData(response.data);
      } catch (error) {
        console.error("erro ao buscar dados do usuário:", error);
      }
    };
    fetchUserData();
  }, [user]);

  // Carrega os chamados via API do servidor
  useEffect(() => {
    if (!user) return;
    const carregarChamados = async () => {
      setLoading(true);
      try {
        const response = await api.get("/chamados");
        setChamados(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        toast.error("erro ao carregar chamados do servidor.");
        setChamados([]);
      } finally {
        setLoading(false);
      }
    };
    carregarChamados();
  }, [user]);

  const handleAssumirChamado = async (chamado) => {
    const chamadoId = chamado.id || chamado._id;
    if (!chamadoId) {
      toast.error("ID do chamado não encontrado.");
      return;
    }

    const jaTemTecnico =
      chamado.status === "em atendimento" || chamado.status === "pendente";

    try {
      const dadosAtualizacao = {
        status: "em atendimento",
        tecnicoResponsavel: analistaNome.toLowerCase(),
        tecnicoId: user.uid,
        iniciadoEm: new Date().toISOString(),
        logSeguranca: jaTemTecnico
          ? `override realizado por admin: ${analistaNome.toLowerCase()}`
          : null,
      };

      await api.put(`/chamados/${chamadoId}`, dadosAtualizacao);

      setChamados((prev) =>
        (Array.isArray(prev) ? prev : []).map((c) => ((c.id === chamadoId || c._id === chamadoId) ? { ...c, ...dadosAtualizacao } : c))
      );

      toast.info(
        jaTemTecnico
          ? `override realizado na os #${chamado.numeroOs}`
          : `você assumiu a os #${chamado.numeroOs}`
      );
    } catch (err) {
      console.error(err);
      toast.error("erro ao assumir.");
    }
  };

  const handleDevolverChamado = async (chamado) => {
    const chamadoId = chamado.id || chamado._id;
    try {
      const dadosAtualizacao = {
        status: "aberto",
        tecnicoResponsavel: null,
        tecnicoId: null,
        iniciadoEm: null,
        motivoPausa: null,
        detalhePausa: null,
        pausadoEm: null,
      };

      await api.put(`/chamados/${chamadoId}`, dadosAtualizacao);

      setChamados((prev) =>
        (Array.isArray(prev) ? prev : []).map((c) => ((c.id === chamadoId || c._id === chamadoId) ? { ...c, ...dadosAtualizacao } : c))
      );

      toast.warning("chamado devolvido para a fila.");
    } catch (err) {
      toast.error("erro ao devolver.");
    }
  };

  const handleFinalizarChamado = async (e) => {
    e.preventDefault();
    if (!patrimonio.trim()) return toast.error("informe o patrimônio.");
    const chamadoId = chamadoSelecionado?.id || chamadoSelecionado?._id;

    try {
      const novosDados = {
        status: "fechado",
        feedbackAnalista: parecerTecnico.trim().toLowerCase(),
        patrimonio: patrimonio.trim().toLowerCase(),
        finalizadoEm: new Date().toISOString(),
      };

      if (equipamento.trim()) {
        novosDados.equipamento = equipamento.trim().toLowerCase();
      }

      await api.put(`/chamados/${chamadoId}`, novosDados);

      setChamados((prev) =>
        (Array.isArray(prev) ? prev : []).map((c) => ((c.id === chamadoId || c._id === chamadoId) ? { ...c, ...novosDados } : c))
      );

      setMostrarModal(false);
      setTipoModal("");
      setParecerTecnico("");
      setPatrimonio("");
      setEquipamento("");
      toast.success("os finalizada com sucesso!");
    } catch (err) {
      toast.error("erro ao finalizar.");
    }
  };

  const handlePausarSLA = async (e) => {
    e.preventDefault();
    if (!motivoPausa) return toast.error("escolha um motivo.");
    const chamadoId = chamadoSelecionado?.id || chamadoSelecionado?._id;

    try {
      const novosDados = {
        status: "pendente",
        motivoPausa: motivoPausa.toLowerCase(),
        detalhePausa: detalhePausa.trim().toLowerCase(),
        pausadoEm: new Date().toISOString(),
      };

      await api.put(`/chamados/${chamadoId}`, novosDados);

      setChamados((prev) =>
        (Array.isArray(prev) ? prev : []).map((c) => ((c.id === chamadoId || c._id === chamadoId) ? { ...c, ...novosDados } : c))
      );

      setMostrarModal(false);
      setTipoModal("");
      setMotivoPausa("");
      setDetalhePausa("");
      toast.warning("sla pausado.");
    } catch (err) {
      toast.error("erro ao pausar.");
    }
  };

  const handleRetomarChamado = async (chamado) => {
    const chamadoId = chamado.id || chamado._id;
    try {
      const novosDados = {
        status: "em atendimento",
        retomadoEm: new Date().toISOString(),
      };

      await api.put(`/chamados/${chamadoId}`, novosDados);

      setChamados((prev) =>
        (Array.isArray(prev) ? prev : []).map((c) => ((c.id === chamadoId || c._id === chamadoId) ? { ...c, ...novosDados } : c))
      );

      toast.success("atendimento retomado!");
    } catch (err) {
      toast.error("erro ao retomar.");
    }
  };

  const handleEnviarParaPlanilha = async (item) => {
    if (enviandoPlanilha) return;
    const chamadoId = item.id || item._id;
    setEnviandoPlanilha(chamadoId);
    const idToast = toast.loading(`sincronizando os #${item.numeroOs}...`);
    try {
      const payload = {
        tipo: "CHAMADOS_POWERBI",
        dados: [
          {
            OS: item.numeroOs || "s/n",
            Patrimonio: item.patrimonio || "s/p",
            Unidade: item.unidade || "",
            Setor: item.setor || item.setorOrigem || "",
            Equipamento: item.equipamento || "s/p",
            Status: "FECHADO",
            Descricao: item.problema || item.descricao || "sem descrição",
            Parecer_Tecnico: item.feedbackAnalista || "sem parecer",
            Equipe: item.equipe || "",
            Finalizado_Por: item.tecnicoResponsavel || analistaNome,
            Data: formatarDataHora(item.criatedAt || item.criadoEm || item.createdAt || item.data),
            Finalizado_Em: formatarDataHora(item.finalizadoEm),
          },
        ],
      };
      await fetch(WEB_APP_URL, {
        method: "POST",
        mode: "no-cors",
        body: JSON.stringify(payload),
      });

      const novosDados = {
        status: "arquivado",
        arquivadoEm: new Date().toISOString(),
      };

      await api.put(`/chamados/${chamadoId}`, novosDados);

      setChamados((prev) =>
        (Array.isArray(prev) ? prev : []).map((c) => ((c.id === chamadoId || c._id === chamadoId) ? { ...c, ...novosDados } : c))
      );

      toast.update(idToast, {
        render: "sincronizado e arquivado!",
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });
    } catch (error) {
      toast.update(idToast, {
        render: "erro na sincronização.",
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
    } finally {
      setEnviandoPlanilha(null);
    }
  };

  const chamadosFiltrados = useMemo(() => {
    const listaSegura = Array.isArray(chamados) ? chamados : [];
    const busca = termoBusca.toLowerCase().trim();
    const isAdminOuRoot = ["root", "admin"].includes(
      userData?.role?.toLowerCase()
    );
    const equipeUsuario = userData?.equipe?.toLowerCase().trim();

    return listaSegura.filter((c) => {
      if (!isAdminOuRoot) {
        const equipeChamado = c.equipe?.toLowerCase().trim();
        if (!equipeUsuario || equipeChamado !== equipeUsuario) {
          return false;
        }
      }

      const matchesBusca =
        c.numeroOs?.toString().includes(busca) ||
        c.nome?.toLowerCase().includes(busca) ||
        c.unidade?.toLowerCase().includes(busca) ||
        c.patrimonio?.toLowerCase().includes(busca) ||
        c.equipamento?.toLowerCase().includes(busca) ||
        c.equipe?.toLowerCase().includes(busca);

      return busca ? matchesBusca : c.status?.toLowerCase() !== "arquivado";
    });
  }, [chamados, termoBusca, userData]);

  const totalPaginas =
    Math.ceil(chamadosFiltrados.length / itensPorPagina) || 1;

  const chamadosPaginados = useMemo(() => {
    const inicio = (paginaAtual - 1) * itensPorPagina;
    return chamadosFiltrados.slice(inicio, inicio + itensPorPagina);
  }, [chamadosFiltrados, paginaAtual]);

  const abrirModalUnificado = (tipo, chamado) => {
    setChamadoSelecionado(chamado);
    setTipoModal(tipo);
    setMostrarModal(true);

    if (tipo === "finalizar") {
      setEquipamento(chamado.equipamento || "");
      setPatrimonio(chamado.patrimonio || "");
      setParecerTecnico(chamado.feedbackAnalista || "");
    } else if (tipo === "pausar") {
      setMotivoPausa(chamado.motivoPausa || "");
      setDetalhePausa(chamado.detalhePausa || "");
    }
  };

  const fecharModalUnificado = () => {
    setMostrarModal(false);
    setTipoModal("");
    setChamadoSelecionado(null);
    setEquipamento("");
    setPatrimonio("");
    setParecerTecnico("");
    setMotivoPausa("");
    setDetalhePausa("");
  };

  return {
    user,
    userData,
    loading,
    inputValue,
    setInputValue,
    paginaAtual,
    setPaginaAtual,
    totalPaginas,
    chamadosPaginados,
    chamadoSelecionado,
    setChamadoSelecionado,
    mostrarModal,
    tipoModal,
    equipamento,
    setEquipamento,
    patrimonio,
    setPatrimonio,
    parecerTecnico,
    setParecerTecnico,
    motivoPausa,
    setMotivoPausa,
    detalhePausa,
    setDetalhePausa,
    enviandoPlanilha,
    isRemaneja,
    analistaNome,
    formatarDataHora,
    executarBusca,
    limparBusca,
    handleAssumirChamado,
    handleDevolverChamado,
    handleFinalizarChamado,
    handlePausarSLA,
    handleRetomarChamado,
    handleEnviarParaPlanilha,
    abrirModalUnificado,
    fecharModalUnificado,
    calcularSlaLinha,
  };
};