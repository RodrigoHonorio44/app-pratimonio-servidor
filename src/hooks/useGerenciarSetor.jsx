import { useState, useEffect, useRef } from "react";
import { db, auth } from "../services/firebase";
import api from "../services/api";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { MAPA_SETORES_POR_UNIDADE } from "../components/constants/setores";

export const useGerenciarSetor = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [verificandoAcesso, setVerificandoAcesso] = useState(true);

  // Estados de busca e filtros
  const [patrimonioBusca, setPatrimonioBusca] = useState("");
  const [nomeBusca, setNomeBusca] = useState("");
  const [setorBusca, setSetorBusca] = useState("");
  const [unidadeFiltro, setUnidadeFiltro] = useState("");
  
  const [mostrarDropdown, setMostrarDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Dados e paginação
  const [ativos, setAtivos] = useState([]);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const itensPorPagina = 9;

  // Estados dos Modais
  const [showModal, setShowModal] = useState(false);
  const [modoEdicao, setModoEdicao] = useState(false);
  const [showModalExcluir, setShowModalExcluir] = useState(false);
  const [itemSelecionado, setItemSelecionado] = useState(null);

  // Form Data para Criar/Editar
  const [formData, setFormData] = useState({
    patrimonio: "",
    nome: "",
    tipoItem: "mobiliário",
    unidade: "hospital conde",
    setor: "",
    estado: "novo",
    observacoes: ""
  });

  const unidades = Object.keys(MAPA_SETORES_POR_UNIDADE || {});

  // Normalização refinada para lidar com acentos, caracteres especiais e abreviações comuns (ex: hc -> hospitalar)
  const normalizarParaComparacao = (texto) => {
    if (!texto) return "";
    let limpo = texto
      .toString()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[\/\s._-]/g, " ")
      .trim();

    // Mapeamento de sinonímias/siglas conhecidas
    limpo = limpo.replace(/\bhc\b/g, "hospitalar");
    return limpo.replace(/\s+/g, "");
  };

  // Comparador flexível por palavras (verifica se os termos digitados/selecionados batem parcialmente com o item)
  const compararSetoresFlexivel = (setorBuscado, setorItem) => {
    if (!setorBuscado) return true;
    if (!setorItem) return false;

    const termoBuscaNorm = normalizarParaComparacao(setorBuscado);
    const termoItemNorm = normalizarParaComparacao(setorItem);

    if (termoItemNorm.includes(termoBuscaNorm) || termoBuscaNorm.includes(termoItemNorm)) {
      return true;
    }

    // Validação palavra por palavra (ex: "deposito material" bate em "deposito material de hospitalar")
    const palavrasBusca = setorBuscado
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .split(/\s+/)
      .filter((p) => p.length > 2 && p !== "de" && p !== "da" && p !== "do");

    const palavrasItem = setorItem
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .split(/\s+/)
      .filter((p) => p.length > 2 && p !== "de" && p !== "da" && p !== "do");

    return palavrasBusca.every((pBusca) =>
      palavrasItem.some((pItem) => pItem.startsWith(pBusca) || pBusca.startsWith(pItem) || (pBusca === "hc" && pItem.startsWith("hosp")))
    );
  };

  // Helper robusto para extrair o ID real do MongoDB
  const obterIdSanitizado = (item) => {
    if (!item) return "";
    
    const rawId = item._id?.$oid || item._id || item.id || item.patrimonio || "";
    
    if (typeof rawId === "object" && rawId !== null) {
      return String(rawId.toString()).trim();
    }
    return String(rawId).trim();
  };

  // Validação de acesso
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const docRef = doc(db, "usuarios", user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const role = docSnap.data().role?.toLowerCase().trim() || "";
            if (["root", "adm", "admin", "analista", "ti"].includes(role)) {
              setVerificandoAcesso(false);
            } else {
              toast.error("acesso negado.");
              navigate("/dashboard");
            }
          } else {
            navigate("/login");
          }
        } catch (error) {
          navigate("/dashboard");
        }
      } else {
        navigate("/login");
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setMostrarDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Busca de ativos com ordenação alfabética garantida e busca flexível de setor
  const buscarAtivos = async () => {
    setLoading(true);
    setMostrarDropdown(false);

    try {
      const token = await auth.currentUser?.getIdToken();
      const headers = { ...(token && { Authorization: `Bearer ${token}` }) };

      const response = await api.get("/ativos", { headers });
      
      const listaGeral = response.data.ativos || response.data || [];
      
      const unidadeFiltroNorm = normalizarParaComparacao(unidadeFiltro);
      const patrimonioNorm = normalizarParaComparacao(patrimonioBusca);
      const nomeNorm = normalizarParaComparacao(nomeBusca);

      const filtrados = listaGeral.filter((item) => {
        const itemUnidadeNorm = normalizarParaComparacao(item.unidade || "");
        const itemPatrimonioNorm = normalizarParaComparacao(item.patrimonio || item._id || item.id || "");
        const itemNomeNorm = normalizarParaComparacao(item.nome || item.descricao || "");

        if (unidadeFiltroNorm && !itemUnidadeNorm.includes(unidadeFiltroNorm) && !unidadeFiltroNorm.includes(itemUnidadeNorm)) {
          return false;
        }

        if (setorBusca && !compararSetoresFlexivel(setorBusca, item.setor || "")) {
          return false;
        }

        if (patrimonioNorm && !itemPatrimonioNorm.includes(patrimonioNorm)) {
          return false;
        }

        if (nomeNorm && !itemNomeNorm.includes(nomeNorm)) {
          return false;
        }

        return true;
      });

      // Ordenação por ordem alfabética (A-Z)
      const ordenados = filtrados.sort((a, b) => {
        const nomeA = String(a.nome || a.descricao || "").trim();
        const nomeB = String(b.nome || b.descricao || "").trim();
        return nomeA.localeCompare(nomeB, "pt-BR", { sensitivity: "base", numeric: true });
      });

      setAtivos(ordenados);
      setPaginaAtual(1);

      if (ordenados.length === 0) {
        toast.info("nenhum equipamento encontrado com os filtros informados.");
      }
    } catch (error) {
      toast.error("erro ao carregar equipamentos.");
    } finally {
      setLoading(false);
    }
  };

  const obterSetoresFiltrados = () => {
    if (!unidadeFiltro) return [];

    const chaveUnidade = Object.keys(MAPA_SETORES_POR_UNIDADE).find(
      (key) => normalizarParaComparacao(key) === normalizarParaComparacao(unidadeFiltro)
    );

    const setoresDaUnidade = chaveUnidade ? MAPA_SETORES_POR_UNIDADE[chaveUnidade] : [];
    
    if (!setorBusca.trim()) return setoresDaUnidade;

    return setoresDaUnidade.filter((setor) =>
      compararSetoresFlexivel(setorBusca, setor)
    );
  };

  const limparBusca = () => {
    setPatrimonioBusca("");
    setNomeBusca("");
    setSetorBusca("");
    setUnidadeFiltro("");
    setAtivos([]);
    setPaginaAtual(1);
    toast.info("busca resetada");
  };

  const totalPaginas = Math.ceil(ativos.length / itensPorPagina) || 1;
  const itensExibidos = ativos.slice(
    (paginaAtual - 1) * itensPorPagina,
    paginaAtual * itensPorPagina
  );

  // Salvar (Criar ou Editar)
  const handleSalvar = async (e) => {
    e.preventDefault();
    setLoading(true);
    const idToast = toast.loading("salvando dados...");

    try {
      const token = await auth.currentUser?.getIdToken();
      const headers = { ...(token && { Authorization: `Bearer ${token}` }) };

      const dadosTratados = {
        ...formData,
        patrimonio: String(formData.patrimonio || "").toLowerCase().trim(),
        nome: String(formData.nome || "").toLowerCase().trim(),
        setor: String(formData.setor || "").toLowerCase().trim(),
        unidade: String(formData.unidade || "").toLowerCase().trim(),
        tipoItem: String(formData.tipoItem || "mobiliário").toLowerCase().trim(),
        estado: String(formData.estado || "novo").toLowerCase().trim(),
        observacoes: String(formData.observacoes || "").toLowerCase().trim()
      };

      const idItem = obterIdSanitizado(itemSelecionado);

      if (modoEdicao) {
        if (!idItem) {
          toast.update(idToast, { render: "erro: id do equipamento não encontrado.", type: "error", isLoading: false, autoClose: 2000 });
          setLoading(false);
          return;
        }

        await api.put(`/ativos/${idItem}`, dadosTratados, { headers });
        toast.update(idToast, { render: "equipamento atualizado com sucesso!", type: "success", isLoading: false, autoClose: 2000 });
      } else {
        await api.post("/ativos", { ...dadosTratados, status: "ativo", tipo: "equipamento" }, { headers });
        toast.update(idToast, { render: "equipamento incluído com sucesso!", type: "success", isLoading: false, autoClose: 2000 });
      }

      setShowModal(false);
      buscarAtivos();
    } catch (error) {
      toast.update(idToast, { render: "erro ao salvar o equipamento.", type: "error", isLoading: false, autoClose: 2000 });
    } finally {
      setLoading(false);
    }
  };

  // Exclusão
  const handleExcluir = async () => {
    setLoading(true);
    
    const idItem = obterIdSanitizado(itemSelecionado);

    if (!idItem) {
      toast.error("erro: id do equipamento é inválido ou ausente.");
      setLoading(false);
      return;
    }

    const idToast = toast.loading("excluindo equipamento...");

    try {
      const token = await auth.currentUser?.getIdToken();
      const headers = { ...(token && { Authorization: `Bearer ${token}` }) };

      await api.delete(`/ativos/${idItem}`, { headers });

      toast.update(idToast, { 
        render: "equipamento excluído com sucesso!", 
        type: "success", 
        isLoading: false, 
        autoClose: 2000 
      });
      setShowModalExcluir(false);
      setItemSelecionado(null);
      buscarAtivos();
    } catch (error) {
      const mensagemErro = error.response?.data?.error || "erro ao excluir o equipamento no banco de dados.";
      toast.update(idToast, { 
        render: mensagemErro, 
        type: "error", 
        isLoading: false, 
        autoClose: 3000 
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    verificandoAcesso,
    patrimonioBusca, setPatrimonioBusca,
    nomeBusca, setNomeBusca,
    setorBusca, setSetorBusca,
    unidadeFiltro, setUnidadeFiltro,
    mostrarDropdown, setMostrarDropdown,
    dropdownRef,
    unidades,
    obterSetoresFiltrados,
    limparBusca,
    executarBusca: buscarAtivos,
    itensExibidos,
    paginaAtual, setPaginaAtual,
    totalPaginas,
    showModal, setShowModal,
    modoEdicao, setModoEdicao,
    showModalExcluir, setShowModalExcluir,
    itemSelecionado, setItemSelecionado,
    formData, setFormData,
    handleSalvar,
    handleExcluir,
    loading,
    MAPA_SETORES_POR_UNIDADE
  };
};