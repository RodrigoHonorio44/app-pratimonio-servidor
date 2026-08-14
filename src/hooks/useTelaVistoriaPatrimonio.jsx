import { useState, useEffect } from "react";
import { auth } from "../services/firebase";
import api from "../services/api";
import { toast } from "react-toastify";

export const useTelaVistoriaPatrimonio = () => {
  const [unidadeSelecionada, setUnidadeSelecionada] = useState(() => {
    return localStorage.getItem("@vistoria_unidade") || "";
  });
  
  const [setorSelecionado, setSetorSelecionado] = useState(() => {
    return localStorage.getItem("@vistoria_setor") || "";
  });

  const [ativosDoSetor, setAtivosDoSetor] = useState([]);
  const [loadingAtivos, setLoadingAtivos] = useState(false);
  const [loading, setLoading] = useState(false);

  // Itens avaliados salvos em rascunho no navegador baseados na unidade e setor atuais
  const [itensAvaliados, setItensAvaliados] = useState(() => {
    if (!unidadeSelecionada || !setorSelecionado) return [];
    const salvo = localStorage.getItem(`@vistoria_itens_${unidadeSelecionada}_${setorSelecionado}`);
    return salvo ? JSON.parse(salvo) : [];
  });

  // Garante que o estado inicial seja sempre uma ISO String válida (sem textos nativos pré-formatados)
  const [dataHoraInicioVistoria, setDataHoraInicioVistoria] = useState(() => {
    const salvo = localStorage.getItem("@vistoria_data_inicio");
    if (salvo && salvo.includes("T")) return salvo;
    return new Date().toISOString();
  });

  // Sincroniza rascunhos com o localStorage sempre que houver alteração
  useEffect(() => {
    localStorage.setItem("@vistoria_unidade", unidadeSelecionada);
  }, [unidadeSelecionada]);

  useEffect(() => {
    localStorage.setItem("@vistoria_setor", setorSelecionado);
  }, [setorSelecionado]);

  // Salva os itens avaliados vinculados ao setor/unidade para não cruzar dados entre setores diferentes
  useEffect(() => {
    if (unidadeSelecionada && setorSelecionado) {
      localStorage.setItem(
        `@vistoria_itens_${unidadeSelecionada}_${setorSelecionado}`,
        JSON.stringify(itensAvaliados)
      );
    }
  }, [itensAvaliados, unidadeSelecionada, setorSelecionado]);

  // Carrega os itens do rascunho específico quando a unidade ou o setor mudam
  useEffect(() => {
    if (unidadeSelecionada && setorSelecionado) {
      const salvo = localStorage.getItem(`@vistoria_itens_${unidadeSelecionada}_${setorSelecionado}`);
      setItensAvaliados(salvo ? JSON.parse(salvo) : []);
    } else {
      setItensAvaliados([]);
    }
  }, [unidadeSelecionada, setorSelecionado]);

  // Grava a data inicial em ISO no localStorage
  useEffect(() => {
    if (unidadeSelecionada) {
      const dataAtualISO = new Date().toISOString();
      const salvo = localStorage.getItem("@vistoria_data_inicio");
      if (!salvo || !salvo.includes("T")) {
        localStorage.setItem("@vistoria_data_inicio", dataHoraInicioVistoria || dataAtualISO);
      }
    }
  }, [unidadeSelecionada, dataHoraInicioVistoria]);

  // Normalizador de texto para comparação segura
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

  // Função para resetar/limpar as seleções e o rascunho
  const limparFiltros = () => {
    if (unidadeSelecionada && setorSelecionado) {
      localStorage.removeItem(`@vistoria_itens_${unidadeSelecionada}_${setorSelecionado}`);
    }
    setUnidadeSelecionada("");
    setSetorSelecionado("");
    setAtivosDoSetor([]);
    setItensAvaliados([]);
    localStorage.removeItem("@vistoria_unidade");
    localStorage.removeItem("@vistoria_setor");
    localStorage.removeItem("@vistoria_data_inicio");
  };

  // Função auxiliar para comprimir imagens e evitar o erro 413 (Payload Too Large)
  const comprimirImagem = (base64Str, maxWidth = 800, quality = 0.6) => {
    return new Promise((resolve) => {
      if (!base64Str || !base64Str.startsWith("data:image")) {
        resolve(base64Str);
        return;
      }
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = () => resolve(base64Str);
    });
  };

  // 1. BUSCA OS EQUIPAMENTOS VIA AXIOS NO ENDPOINT '/ativos'
  useEffect(() => {
    const buscarAtivosDaApi = async () => {
      if (!unidadeSelecionada || !setorSelecionado) {
        setAtivosDoSetor([]);
        return;
      }

      setLoadingAtivos(true);

      try {
        const currentUser = auth.currentUser;
        const token = currentUser ? await currentUser.getIdToken() : "";

        const response = await api.get("/ativos", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const dadosBrutos = response.data;
        const todosOsDados = Array.isArray(dadosBrutos)
          ? dadosBrutos
          : dadosBrutos?.ativos || dadosBrutos?.dados || [];

        // Filtra os ativos em memória combinando Unidade e Setor selecionados
        const filtrados = todosOsDados.filter((item) => {
          const unidadeItemNorm = normalizarParaComparacao(item.unidade || "");
          const unidadeSelNorm = normalizarParaComparacao(unidadeSelecionada);
          const matchUnidade = unidadeItemNorm.includes(unidadeSelNorm);

          const setorItemNorm = normalizarParaComparacao(item.setor || "");
          const setorSelNorm = normalizarParaComparacao(setorSelecionado);
          const matchSetor =
            setorItemNorm === setorSelNorm || setorItemNorm.includes(setorSelNorm);

          return matchUnidade && matchSetor;
        });

        setAtivosDoSetor(filtrados);
      } catch (error) {
        console.error("Erro ao buscar equipamentos na API /ativos:", error);
        toast.error("Erro ao carregar os equipamentos do setor.");
        setAtivosDoSetor([]);
      } finally {
        setLoadingAtivos(false);
      }
    };

    buscarAtivosDaApi();
  }, [unidadeSelecionada, setorSelecionado]);

  // 2. GRAVA A VISTORIA FINALIZADA VIA API AXIOS COM COMPRESSÃO DE IMAGENS
  const handleFinalizarVistoriaLote = async ({ unidade, setor, dataHora, itens, onSuccess }) => {
    if (!unidade || !setor) {
      toast.warn("Por favor, selecione a unidade e o setor.");
      return;
    }

    if (!itens || itens.length === 0) {
      toast.warn("Adicione pelo menos um equipamento para finalizar a vistoria.");
      return;
    }

    setLoading(true);

    try {
      const currentUser = auth.currentUser;
      const token = currentUser ? await currentUser.getIdToken() : "";

      const dataAgoraISO = new Date().toISOString();
      
      // Valida se a data enviada/armazenada é uma ISO válida. Se não for, usa a data atual
      let dataInicioFormatada = dataHora || dataHoraInicioVistoria;
      if (!dataInicioFormatada || !dataInicioFormatada.includes("T")) {
        dataInicioFormatada = dataAgoraISO;
      }

      // Comprime as fotos de cada item e formata a data de cada avaliação
      const itensProcessados = await Promise.all(
        itens.map(async (item) => {
          let fotoCompacta = item.foto;
          if (fotoCompacta) {
            fotoCompacta = await comprimirImagem(fotoCompacta, 800, 0.6);
          }
          
          let avaliadoEmIso = item.dataHora || item.avaliadoEm;
          if (!avaliadoEmIso || !avaliadoEmIso.includes("T")) {
            avaliadoEmIso = dataAgoraISO;
          }

          return {
            patrimonio: item.patrimonio || "S/P",
            equipamento: item.equipamento || item.nome,
            estadoConservacao: item.estado || item.estadoConservacao,
            observacao: item.observacao || item.observacoes || item.observacaoTecnica || "",
            foto: fotoCompacta,
            avaliadoEm: avaliadoEmIso,
          };
        })
      );

      const payloadVistoria = {
        unidade,
        setor,
        dataHoraInicio: dataInicioFormatada,
        dataHoraFim: dataAgoraISO,
        dataHora: dataInicioFormatada,
        quantidadeItens: itensProcessados.length,
        itensAvaliados: itensProcessados,
        createdAt: dataAgoraISO,
      };

      await api.post("/vistorias", payloadVistoria, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      toast.success("Vistoria gravada com sucesso!");

      // Limpa os rascunhos do armazenamento local após sucesso
      limparFiltros();

      if (typeof onSuccess === "function") {
        onSuccess();
      }

      // Dispara a janela de impressão do relatório
      window.print();
    } catch (error) {
      console.error("Erro ao salvar no endpoint /vistorias:", error);
      toast.error("Ocorreu um erro ao gravar a vistoria no banco de dados.");
    } finally {
      setLoading(false);
    }
  };

  return {
    unidadeSelecionada,
    setUnidadeSelecionada,
    setorSelecionado,
    setSetorSelecionado,
    ativosDoSetor,
    loadingAtivos,
    loading,
    itensAvaliados,
    setItensAvaliados,
    dataHoraInicioVistoria,
    limparFiltros,
    handleFinalizarVistoriaLote,
  };
};