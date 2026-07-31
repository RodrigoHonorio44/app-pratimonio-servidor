// src/hooks/useDashboard.js
import { useState, useEffect, useMemo } from "react";
import { auth, db } from "../services/firebase";
import api from "../services/api";
import { doc, getDoc } from "firebase/firestore";

export function useDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // O filtro suporta formato mensal ("YYYY-MM") ou anual ("YYYY")
  const [mesFiltro, setMesFiltro] = useState(() => {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, "0");
    return `${ano}-${mes}`;
  });

  const [chamadosBrutos, setChamadosBrutos] = useState([]);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) return;

        // 1. Carrega os dados do usuário do Firestore
        const docRef = doc(db, "usuarios", currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setUserData(docSnap.data());
        }

        // 2. Consome os chamados da API do seu backend
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

  // Processamento das Estatísticas robusto: se a OS não tiver data de criação, ela entra no mês atual por padrão para não sumir do dashboard
  const estatisticas = useMemo(() => {
    if (!Array.isArray(chamadosBrutos) || chamadosBrutos.length === 0) {
      return { abertos: 0, fechados: 0, total: 0, pendentes: 0 };
    }

    const partesFiltro = (mesFiltro || "").split("-");
    const anoAlvo = partesFiltro[0];
    const mesAlvo = partesFiltro[1]; // undefined se for selecionado apenas o ano (YYYY)

    // Função auxiliar robusta para converter qualquer tipo de data
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
    const anoAtual = String(hoje.getFullYear());
    const mesAtual = String(hoje.getMonth() + 1).padStart(2, "0");

    const chamadosDoPeriodo = chamadosBrutos.filter((chamado) => {
      const dataRef = chamado.criadoEm || chamado.criatedAt || chamado.createdAt || chamado.data || chamado.timestamp;
      const dataObjeto = parseData(dataRef);
      
      let anoChamado, mesChamado;

      if (!dataObjeto) {
        // Fallback: se o chamado não tiver nenhuma data preenchida, consideramos o mês/ano atual para ele aparecer
        anoChamado = anoAtual;
        mesChamado = mesAtual;
      } else {
        anoChamado = String(dataObjeto.getFullYear());
        mesChamado = String(dataObjeto.getMonth() + 1).padStart(2, "0");
      }

      if (mesAlvo) {
        return anoChamado === anoAlvo && mesChamado === mesAlvo;
      } else {
        return anoChamado === anoAlvo;
      }
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
  }, [chamadosBrutos, mesFiltro]);

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
    mesFiltro,
    setMesFiltro,
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