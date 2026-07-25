// src/hooks/useDashboard.js
import { useState, useEffect, useMemo } from "react";
import { auth, db } from "../services/firebase";
import api from "../services/api";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";

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

        const docRef = doc(db, "usuarios", currentUser.uid);
        const docSnap = await getDoc(docRef);
        let dadosUsuario = null;
        if (docSnap.exists()) {
          dadosUsuario = docSnap.data();
          setUserData(dadosUsuario);
        }

        let listaChamados = [];
        try {
          const responseChamados = await api.get("/chamados");
          if (Array.isArray(responseChamados.data) && responseChamados.data.length > 0) {
            listaChamados = responseChamados.data;
          }
        } catch (apiError) {
          console.warn("API de chamados indisponível, buscando diretamente do Firestore...", apiError);
        }

        if (listaChamados.length === 0) {
          const chamadosSnapshot = await getDocs(collection(db, "chamados"));
          listaChamados = chamadosSnapshot.docs.map(docSnapItem => ({
            id: docSnapItem.id,
            ...docSnapItem.data()
          }));
        }

        const isRootUser = dadosUsuario?.role?.toLowerCase() === "root";
        const isAdminUser = dadosUsuario?.cargo?.toUpperCase() === "ADMINISTRADOR" || dadosUsuario?.role?.toLowerCase() === "admin";
        
        if (!isRootUser && !isAdminUser && dadosUsuario) {
          const equipeUsuario = (dadosUsuario.equipe || dadosUsuario.unidade || "").toLowerCase().trim();
          if (equipeUsuario) {
            listaChamados = listaChamados.filter(item => {
              const eqItem = (item.equipe || item.unidade || item.departamento || "").toLowerCase().trim();
              const criadoPorId = item.userId || item.criadoPorId || item.uid;
              return eqItem === equipeUsuario || criadoPorId === currentUser.uid;
            });
          }
        }

        setChamadosBrutos(listaChamados);

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
      return { abertos: 0, fechados: 0, total: 0, pendentes: 0, taxaResolucao: 0 };
    }

    const [anoAlvo, mesAlvo] = (mesFiltro || "").split("-");

    const chamadosFiltrados = chamadosBrutos.filter((chamado) => {
      const dataCriacao = 
        chamado.criadoEm || 
        chamado.createdAt || 
        chamado.criatedAt || 
        chamado.data || 
        chamado.timestamp || 
        chamado.Finalizado_Em ||
        chamado.dataCriacao;
      
      if (!dataCriacao) return false; 

      let dataObjeto;
      
      if (typeof dataCriacao.toDate === "function") {
        dataObjeto = dataCriacao.toDate();
      } else if (typeof dataCriacao === "object" && dataCriacao !== null) {
        if ("seconds" in dataCriacao) {
          dataObjeto = new Date(dataCriacao.seconds * 1000);
        } else if ("_seconds" in dataCriacao) {
          dataObjeto = new Date(dataCriacao._seconds * 1000);
        } else {
          dataObjeto = new Date(dataCriacao);
        }
      } else if (typeof dataCriacao === "string" && dataCriacao.includes("/")) {
        const [dataPart] = dataCriacao.split(",");
        const [d, m, a] = dataPart.trim().split("/");
        const anoFull = a && a.length === 2 ? `20${a}` : a;
        dataObjeto = new Date(Number(anoFull), Number(m) - 1, Number(d));
      } else {
        dataObjeto = new Date(dataCriacao);
      }

      if (!dataObjeto || isNaN(dataObjeto.getTime())) return false; 

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

    const totalCalculado = chamadosFiltrados.length;
    const taxaResolucao = totalCalculado > 0 ? Math.round((fechados / totalCalculado) * 100) : 0;

    return {
      total: totalCalculado,
      abertos,
      pendentes,
      fechados,
      taxaResolucao
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