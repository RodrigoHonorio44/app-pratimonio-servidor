import { useState, useEffect } from "react";
import { auth } from "../services/firebase";
import api from "../services/api"; // Importa a instância centralizada do axios
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

// 1. IMPORTAR O MAPA REAL DE SETORES
import { MAPA_SETORES_POR_UNIDADE } from "../components/constants/setores";

export const useEstoque = () => {
  const [itensEstoque, setItensEstoque] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processando, setProcessando] = useState(false);

  const [loteSaida, setLoteSaida] = useState([]);
  const [itemParaAdicionar, setItemParaAdicionar] = useState(null);
  const [patrimonioInput, setPatrimonioInput] = useState("");
  const [qtdInput, setQtdInput] = useState(1);

  const [mostrarPreview, setMostrarPreview] = useState(false);
  const [naoSabeResponsavel, setNaoSabeResponsavel] = useState(false);

  const [dadosSaida, setDadosSaida] = useState({
    novaUnidade: "",
    novoSetor: "",
    responsavelRecebimento: "",
    motivo: "Transferência Regular (Reforço/Expansão)",
  });

  const navigate = useNavigate();

  // 2. CHAVES EXATAMENTE IGUAIS AS DO MAPA ABAIXO
  const unidades = [
    "Estoque Central",
    "Hospital Conde",
    "UPA de Inoã",
    "UPA de Santa Rita",
    "SAMU Barroco",
    "SAMU Ponta Negra",
    "SAMU Centro",
  ];

  // 3. ADICIONE O ESTOQUE CENTRAL NO MAPA PARA EVITAR QUEBRA CASO SEJA SELECIONADO
  const setoresPorUnidade = {
    ...MAPA_SETORES_POR_UNIDADE,
    "Estoque Central": ["Equipamento Usado", "Reserva Técnica", "Inservível / Manutenção"],
    "UPA de Inoã": MAPA_SETORES_POR_UNIDADE["Upa Inoã"] || MAPA_SETORES_POR_UNIDADE["UPA de Inoã"],
    "UPA de Santa Rita": MAPA_SETORES_POR_UNIDADE["Upa Santa Rita"] || MAPA_SETORES_POR_UNIDADE["UPA de Santa Rita"],
    "SAMU Barroco": MAPA_SETORES_POR_UNIDADE["Samu Barroco"] || MAPA_SETORES_POR_UNIDADE["SAMU Barroco"],
    "SAMU Ponta Negra": MAPA_SETORES_POR_UNIDADE["Samu Ponta Negra"] || MAPA_SETORES_POR_UNIDADE["SAMU Ponta Negra"],
    "SAMU Centro": MAPA_SETORES_POR_UNIDADE["Samu Centro"] || MAPA_SETORES_POR_UNIDADE["SAMU Centro"],
  };

  const motivosSaida = [
    { value: "Transferência Regular (Reforço/Expansão)", label: "Transferência Regular (Reforço/Expansão)" },
    { value: "Substituição por Rasgo/Avaria", label: "Substituição por Rasgo/Avaria" },
    { value: "Substituição por Infecção/Contaminação", label: "Substituição por Infecção/Contaminação (Descarte Sanitário)" },
    { value: "Substituição por Defeito Técnico/Mecânico", label: "Substituição por Defeito Técnico/Mecânico" },
    { value: "Empréstimo Temporário", label: "Empréstimo Temporário" },
  ];

  // Função auxiliar interna para obter os headers com o Bearer Token do Firebase
  const obterHeadersAuth = async () => {
    const currentUser = auth.currentUser;
    const token = currentUser ? await currentUser.getIdToken() : "";
    return {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
  };

  const carregarEstoque = async () => {
    setLoading(true);
    try {
      const config = await obterHeadersAuth();
      const resposta = await api.get("/estoque", config);
      const listaCompleta = Array.isArray(resposta.data) ? resposta.data : [];
      
      const lista = listaCompleta.filter(item => (item.status || "ativo").toLowerCase() === "ativo");
      setItensEstoque(lista);
    } catch (error) {
      console.error("Erro ao carregar estoque:", error);
      toast.error("Erro ao carregar itens do estoque.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarEstoque();
  }, []);

  const adicionarAoLote = (e) => {
    e.preventDefault();
    if (!itemParaAdicionar) return;

    const qtdDisponivel = Number(itemParaAdicionar.quantidade || 1);
    const qtdSolicitada = Number(qtdInput);

    if (qtdSolicitada > qtdDisponivel) {
      toast.error(`Quantidade indisponível! Estoque atual: ${qtdDisponivel}`);
      return;
    }

    const patrimonioFinal = itemParaAdicionar.patrimonio === "S/P" 
      ? patrimonioInput.trim() 
      : String(itemParaAdicionar.patrimonio || "").trim();

    if (!patrimonioFinal) {
      toast.error("Insira um número de patrimônio válido.");
      return;
    }

    const jaExiste = loteSaida.some(item => item.patrimonioMapeado === patrimonioFinal);
    if (jaExiste) {
      toast.error("Este número de patrimônio já foi adicionado ao lote!");
      return;
    }

    const novoItemLote = {
      ...itemParaAdicionar,
      quantidadeMovimentada: qtdSolicitada,
      patrimonioMapeado: patrimonioFinal,
    };

    setLoteSaida([...loteSaida, novoItemLote]);
    setItemParaAdicionar(null);
    setPatrimonioInput("");
    setQtdInput(1);
    toast.success("Item adicionado ao lote!");
  };

  const removerDoLote = (index) => {
    const novaLista = [...loteSaida];
    novaLista.splice(index, 1);
    setLoteSaida(novaLista);
  };

  const efetivarTransferenciaESalvar = async () => {
    if (loteSaida.length === 0) return;
    setProcessando(true);

    const responsavelFinal = naoSabeResponsavel 
      ? "responsável pelo setor" 
      : dadosSaida.responsavelRecebimento.trim();

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("Usuário não autenticado");

      const config = await obterHeadersAuth();

      // Processa cada item do lote enviando para a API backend utilizando o token injetado
      for (const item of loteSaida) {
        const qtdSolicitada = item.quantidadeMovimentada;

        // Cria o registro na coleção saidaEquipamento
        await api.post("/saidaEquipamento", {
          estoqueId: item.id,
          patrimonio: item.patrimonioMapeado,
          nomeEquipamento: (item.nome || "").trim(),
          unidadeOrigem: item.unidade || "Almoxarifado Central",
          setorOrigem: item.setor || "Patrimônio",
          unidadeDestino: dadosSaida.novaUnidade,
          setorDestino: dadosSaida.novoSetor.trim(),
          quantidadeRetirada: qtdSolicitada,
          responsavelRecebimento: responsavelFinal,
          motivo: dadosSaida.motivo,
          dataSaida: new Date().toISOString()
        }, config);

        // Se não for bem durável, cria também na coleção de ativos
        if (item.categoriaItem !== "Bem durável") {
          await api.post("/ativos", {
            nome: (item.nome || "").trim(),
            categoriaItem: item.categoriaItem || item.tipo || "Mobiliário",
            tipo: item.tipo || "equipamento",
            estado: item.estado || "Bom",
            observacoes: item.observacoes || "",
            cadastradoPor: item.cadastradoPor || currentUser.email,
            criadoEm: item.criadoEm || new Date().toISOString(),
            quantidade: qtdSolicitada,
            patrimonio: item.patrimonioMapeado,
            unidade: dadosSaida.novaUnidade,
            setor: dadosSaida.novoSetor.trim(),
            status: "Ativo",
            ultimaMovimentacao: new Date().toISOString()
          }, config);
        }
      }

      toast.success("Transferência concluída com sucesso!");
      window.print();

      setLoteSaida([]);
      setMostrarPreview(false);
      setNaoSabeResponsavel(false);
      setDadosSaida({
        novaUnidade: "",
        novoSetor: "",
        responsavelRecebimento: "",
        motivo: "Transferência Regular (Reforço/Expansão)",
      });
      carregarEstoque();
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "Erro ao efetivar transferência.");
    } finally {
      setProcessando(false);
    }
  };

  const isEstoque = dadosSaida.novaUnidade === "Estoque Central";

  return {
    itensEstoque,
    loading,
    processando,
    loteSaida,
    itemParaAdicionar,
    setItemParaAdicionar,
    patrimonioInput,
    setPatrimonioInput,
    qtdInput,
    setQtdInput,
    mostrarPreview,
    setMostrarPreview,
    naoSabeResponsavel,
    setNaoSabeResponsavel,
    dadosSaida,
    setDadosSaida,
    unidades,
    setoresPorUnidade,
    motivosSaida,
    isEstoque,
    carregarEstoque,
    adicionarAoLote,
    removerDoLote,
    efetivarTransferenciaESalvar,
    navigate,
  };
};
