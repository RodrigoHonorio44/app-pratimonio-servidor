import { useState } from "react";
import { auth, db } from "../services/firebase";
import { doc, getDoc } from "firebase/firestore";
import api from "../services/api";
import { toast } from "react-hot-toast";
import { MAPA_SETORES_POR_UNIDADE } from "../components/constants/setores";

export const useCadastroChamado = () => {
  const [loading, setLoading] = useState(false);
  const [buscandoAtivo, setBuscandoAtivo] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [protocoloGerado, setProtocoloGerado] = useState("");

  const [unidade, setUnidade] = useState("");
  const [equipe, setEquipe] = useState("");
  const [equipamento, setEquipamento] = useState("");
  const [patrimonio, setPatrimonio] = useState("");
  const [setor, setSetor] = useState("");
  const [setorManual, setSetorManual] = useState(false);
  const [descricao, setDescricao] = useState("");
  const [prioridade, setPrioridade] = useState("média");
  const [naoSeiPatrimonio, setNaoSeiPatrimonio] = useState(false);

  // Altera a unidade mantendo o setor caso tenha sido preenchido por busca manual/automática
  const handleUnidadeChange = (valor) => {
    setUnidade(valor);
    if (!setorManual) {
      setSetor("");
    }
  };

  const handleLimparCampos = () => {
    setPatrimonio("");
    setUnidade("");
    setSetor("");
    setEquipamento("");
    setSetorManual(false);
    setNaoSeiPatrimonio(false);
    toast.success("campos limpos com sucesso!");
  };

  const toggleNaoSei = () => {
    const novoEstado = !naoSeiPatrimonio;
    setNaoSeiPatrimonio(novoEstado);
    setPatrimonio(novoEstado ? "s/p" : "");
    if (novoEstado) {
      setUnidade("");
      setEquipamento("");
      setSetor("");
      setSetorManual(false);
    }
  };

  const handleBotaoBusca = async (e) => {
    if (e) e.preventDefault();
    const tagOriginal = patrimonio.trim();
    if (!tagOriginal || tagOriginal.toLowerCase() === "s/p") return;

    setBuscandoAtivo(true);
    try {
      const currentUser = auth.currentUser;
      const token = currentUser ? await currentUser.getIdToken() : "";

      const resposta = await api.get("/ativos", {
        headers: { Authorization: `Bearer ${token}` }
      });

      const ativos = Array.isArray(resposta.data) ? resposta.data : [];
      
      const ativoEncontrado = ativos.find(a => 
        String(a.patrimonio || "").toLowerCase() === tagOriginal.toLowerCase() ||
        String(a.tag || "").toLowerCase() === tagOriginal.toLowerCase() ||
        String(a.id || "") === tagOriginal
      );

      if (ativoEncontrado) {
        setEquipamento(ativoEncontrado.nome || ativoEncontrado.equipamento || "");
        setSetor(ativoEncontrado.setor || "");
        setSetorManual(true);

        // Mapeia case-insensitive a unidade do banco para bater com o chave exata do select
        const unidadeBanco = String(ativoEncontrado.unidade || "").trim().toLowerCase();
        const chavesUnidades = Object.keys(MAPA_SETORES_POR_UNIDADE || {});
        const chaveCorrespondente = chavesUnidades.find(
          u => u.toLowerCase() === unidadeBanco
        );

        setUnidade(chaveCorrespondente || ativoEncontrado.unidade || "");

        toast.success("equipamento cadastrado");
      } else {
        toast.error("equipamento nao cadastrado");
      }
    } catch (error) {
      console.error("erro ao buscar dados:", error);
      toast.error("erro ao consultar o banco de dados.");
    } finally {
      setBuscandoAtivo(false);
    }
  };

  const handleNovoChamado = async (e) => {
    e.preventDefault();
    if (!unidade || !equipe) return toast.error("Selecione a unidade e a equipe.");
    setLoading(true);

    const novaOs = `${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("Usuário não autenticado");

      const token = await currentUser.getIdToken();
      const uidExibicao = currentUser.uid;

      let nomeParaSalvar = currentUser.displayName || currentUser.email?.split("@")[0] || "Usuário";

      try {
        const userRes = await api.get(`/usuarios/${uidExibicao}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (userRes.data && userRes.data.nome) {
          nomeParaSalvar = userRes.data.nome.trim();
        }
      } catch (err) {
        try {
          const userDocSnap = await getDoc(doc(db, "usuarios", uidExibicao));
          if (userDocSnap.exists() && userDocSnap.data().nome) {
            nomeParaSalvar = userDocSnap.data().nome.trim();
          }
        } catch (fsErr) {
          console.warn("Não foi possível buscar nome do usuário no Firestore.", fsErr);
        }
      }

      await api.post("/chamados", {
        equipe: equipe.toLowerCase(),
        equipamento: equipamento.toLowerCase(),
        patrimonio: patrimonio.trim().toLowerCase(),
        setor: setor.toLowerCase(),
        descricao: descricao.toLowerCase(),
        unidade: unidade.toLowerCase(),
        prioridade: prioridade.toLowerCase(),
        criadoEm: new Date(),
        iniciadoEm: null,
        finalizadoEm: null,
        arquivadoEm: null,
        emailSolicitante: currentUser.email ? currentUser.email.toLowerCase() : "",
        
        solicitante: nomeParaSalvar, 
        nome: nomeParaSalvar,
        
        numeroOs: novaOs,
        status: "aberto",
        userId: uidExibicao,
        feedbackAnalista: "",
        tecnicoResponsavel: ""
      }, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        }
      });

      setProtocoloGerado(novaOs);
      setSucesso(true);
      toast.success("chamado registrado!");
    } catch (error) {
      console.error(error);
      toast.error("erro ao enviar chamado técnico.");
    } finally {
      setLoading(false);
    }
  };

  return {
    loading, 
    buscandoAtivo, 
    sucesso, 
    setSucesso, 
    protocoloGerado,
    unidade, 
    setUnidade: handleUnidadeChange, 
    equipe, 
    setEquipe, 
    equipamento, 
    setEquipamento,
    patrimonio, 
    setPatrimonio, 
    setor, 
    setSetor, 
    setorManual, 
    setSetorManual,
    descricao, 
    setDescricao,
    prioridade, 
    setPrioridade, 
    naoSeiPatrimonio, 
    handleLimparCampos,
    toggleNaoSei, 
    handleBotaoBusca, 
    handleNovoChamado,
    MAPA_SETORES_POR_UNIDADE
  };
};