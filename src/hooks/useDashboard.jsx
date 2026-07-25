// src/hooks/useDashboard.js
import { useState, useEffect, useMemo } from "react";
import { auth, db } from "../services/firebase";
import api from "../services/api";
import { doc, getDoc } from "firebase/firestore";

export function useDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
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

  // Processamento das Estatísticas robusto contra ausência de campos de data
  const estatisticas = useMemo(() => {
    if (!Array.isArray(chamadosBrutos) || chamadosBrutos.length === 0) {
      return { abertos: 0, fechados: 0, total: 0, pendentes: 0 };
    }

    const [anoAlvo, mesAlvo] = (mesFiltro || "").split("-");

    const chamadosFiltrados = chamadosBrutos.filter((chamado) => {
      const dataCriacao = chamado.criadoEm || chamado.criatedAt || chamado.createdAt || chamado.data || chamado.timestamp;
      
      if (!dataCriacao) return true; 

      let dataObjeto;
      if (typeof dataCriacao.toDate === "function") {
        dataObjeto = dataCriacao.toDate();
      } else {
        dataObjeto = new Date(dataCriacao);
      }

      if (isNaN(dataObjeto.getTime())) return true; 

      const anoChamado = String(dataObjeto.getFullYear());
      const mesChamado = String(dataObjeto.getMonth() + 1).padStart(2, "0");

      return anoChamado === anoAlvo && mesChamado === mesAlvo;
    });

    const abertos = chamadosFiltrados.filter(d => {
      const st = (d.status || "").toLowerCase().trim();
      return st === "aberto" || st === "em atendimento" || !st; 
    }).length;

    const pendentes = chamadosFiltrados.filter(d => {
      const st = (d.status || "").toLowerCase().trim();
      return st === "pendente" || st === "aguardando" || st === "em espera";
    }).length;
    
    const fechados = chamadosFiltrados.filter(d => {
      const st = (d.status || "").toLowerCase().trim();
      return st === "fechado" || st === "arquivado" || st === "baixado" || st === "finalizado" || st === "concluido";
    }).length;

    return {
      total: chamadosFiltrados.length,
      abertos: abertos > 0 ? abertos : chamadosFiltrados.length, 
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