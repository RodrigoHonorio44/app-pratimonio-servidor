import { useState, useEffect, useMemo } from "react";
import { auth, db } from "../services/firebase";
import api from "../services/api";
import { doc, getDoc } from "firebase/firestore";

export function useDashboard() {
  // Inicializa fechado em telas menores que 768px (Mobile)
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth >= 768;
    }
    return false;
  });
  
  // Modos: 'mensal' ou 'anual'
  const [modoFiltro, setModoFiltro] = useState("mensal");

  // Guarda o mês selecionado (YYYY-MM)
  const [mesFiltro, setMesFiltro] = useState(() => {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, "0");
    return `${ano}-${mes}`;
  });

  // Guarda o ano selecionado (YYYY)
  const [anoFiltro, setAnoFiltro] = useState(() => {
    return String(new Date().getFullYear());
  });

  const [chamadosBrutos, setChamadosBrutos] = useState([]);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) return;

        const docRef = doc(db, "usuarios", currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setUserData(docSnap.data());
        }

        const responseChamados = await api.get("/chamados");
        setChamadosBrutos(Array.isArray(responseChamados.data) ? responseChamados.data : []);

      } catch (error) {
        console.error("Erro ao carregar dados do dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const estatisticas = useMemo(() => {
    if (!Array.isArray(chamadosBrutos) || chamadosBrutos.length === 0) {
      return { abertos: 0, fechados: 0, total: 0, pendentes: 0 };
    }

    const parseData = (campoData) => {
      if (!campoData) return null;
      if (typeof campoData.toDate === "function") {
        return campoData.toDate();
      }
      if (typeof campoData === "object" && campoData.seconds) {
        return new Date(campoData.seconds * 1000);
      }
      const dataObj = new Date(campoData);
      return isNaN(dataObj.getTime()) ? null : dataObj;
    };

    const hoje = new Date();
    const anoAtualStr = String(hoje.getFullYear());
    const mesAtualStr = String(hoje.getMonth() + 1).padStart(2, "0");

    const chamadosDoPeriodo = chamadosBrutos.filter((chamado) => {
      const dataRef = chamado.criadoEm || chamado.criatedAt || chamado.createdAt || chamado.data || chamado.timestamp;
      const dataObjeto = parseData(dataRef);
      
      let anoChamado, mesChamado;

      if (!dataObjeto) {
        anoChamado = anoAtualStr;
        mesChamado = mesAtualStr;
      } else {
        anoChamado = String(dataObjeto.getFullYear());
        mesChamado = String(dataObjeto.getMonth() + 1).padStart(2, "0");
      }

      // Se o modo for 'mensal', filtra por Ano e Mês
      if (modoFiltro === "mensal") {
        const [anoAlvo, mesAlvo] = (mesFiltro || "").split("-");
        return anoChamado === anoAlvo && mesChamado === mesAlvo;
      } 
      
      // Se o modo for 'anual', filtra apenas pelo Ano
      return anoChamado === anoFiltro;
    });

    const abertos = chamadosDoPeriodo.filter(d => {
      const st = (d.status || "").toLowerCase().trim();
      return st === "aberto" || st === "em atendimento" || !st; 
    }).length;

    const pendentes = chamadosDoPeriodo.filter(d => {
      const st = (d.status || "").toLowerCase().trim();
      return st === "pendente" || st === "aguardando" || st === "em espera";
    }).length;

    const fechados = chamadosDoPeriodo.filter(d => {
      const st = (d.status || "").toLowerCase().trim();
      return st === "fechado" || st === "arquivado" || st === "baixado" || st === "finalizado" || st === "concluido";
    }).length;

    return {
      total: chamadosDoPeriodo.length,
      abertos, 
      pendentes,
      fechados
    };
  }, [chamadosBrutos, modoFiltro, mesFiltro, anoFiltro]);

  const isRoot = useMemo(
    () => userData?.role?.toLowerCase() === "root",
    [userData]
  );
  
  const isAdmin = useMemo(
    () =>
      userData?.cargo?.toUpperCase() === "ADMINISTRADOR" ||
      userData?.role?.toLowerCase() === "admin",
    [userData]
  );

  const temAcesso = (moduloId) => {
    if (isRoot) return true;
    return userData?.permissoesExtras?.[moduloId] === true;
  };

  const nomeExibicao = userData?.nome || "Analista";
  const unidadExibicao = userData?.unidade || "SISTEMA";

  return {
    sidebarOpen,
    setSidebarOpen,
    modoFiltro,
    setModoFiltro,
    mesFiltro,
    setMesFiltro,
    anoFiltro,
    setAnoFiltro,
    userData,
    loading,
    estatisticas,
    isRoot,
    isAdmin,
    temAcesso,
    nomeExibicao,
    unidadExibicao
  };
}