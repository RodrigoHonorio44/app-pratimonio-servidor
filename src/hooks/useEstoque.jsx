import { useState, useEffect } from "react";
import { auth } from "../services/firebase";
import api from "../services/api";
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
    motivo: "transferência regular (reforço/expansão)",
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
    { value: "transferência regular (reforço/expansão)", label: "Transferência Regular (Reforço/Expansão)" },
    { value: "substituição por rasgo/avaria", label: "Substituição por Rasgo/Avaria" },
    { value: "substituição por infecção/contaminação", label: "Substituição por Infecção/Contaminação (Descarte Sanitário)" },
    { value: "substituição por defeito técnico/mecânico", label: "Substituição por Defeito Técnico/Mecânico" },
    { value: "empréstimo temporário", label: "Empréstimo Temporário" },
  ];

  const carregarEstoque = async () => {
    setLoading(true);
    try {
      const resposta = await api.get("/estoque");
      const listaCompleta = Array.isArray(resposta.data) ? resposta.data : [];
      
      // Filtra estritamente apenas os ativos
      const lista = listaCompleta.filter(item => (item.status || "ativo").toLowerCase().trim() === "ativo");
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

    const patrimonioOriginal = String(itemParaAdicionar.patrimonio || "").toLowerCase().trim();
    const patrimonioFinal = (patrimonioOriginal === "s/p" || patrimonioOriginal === "sp")
      ? patrimonioInput.toLowerCase().trim()
      : patrimonioOriginal;

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
      : dadosSaida.responsavelRecebimento.toLowerCase().trim();

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("Usuário não autenticado");

      for (const item of loteSaida) {
        const qtdSolicitada = Number(item.quantidadeMovimentada);
        const qtdAtual = Number(item.quantidade || 1);

        if (qtdSolicitada > qtdAtual) {
          throw new Error(`Estoque insuficiente para ${item.nome}!`);
        }

        const itemId = item._id || item.id;
        const patrimonioFinal = (item.patrimonioMapeado || item.patrimonio || "").toLowerCase().trim();
        const categoriaTratada = (item.categoriaItem || item.tipoItem || item.tipo || "mobiliário").toLowerCase().trim();

        if (!itemId) {
          throw new Error(`Item "${item.nome || 'desconhecido'}" sem identificador válido.`);
        }

        // 1. Registra o histórico na coleção /saidaEquipamento
        await api.post("/saidaEquipamento", {
          estoqueId: itemId,
          patrimonio: patrimonioFinal,
          nomeEquipamento: (item.nome || "").toLowerCase().trim(),
          unidadeOrigem: (item.unidade || "almoxarifado central").toLowerCase().trim(),
          setorOrigem: (item.setor || "patrimônio").toLowerCase().trim(),
          unidadeDestino: dadosSaida.novaUnidade.toLowerCase().trim(),
          setorDestino: dadosSaida.novoSetor.toLowerCase().trim(),
          quantidadeRetirada: qtdSolicitada,
          responsavelRecebimento: responsavelFinal,
          motivo: dadosSaida.motivo.toLowerCase().trim(),
          dataSaida: new Date().toISOString()
        });

        // 2. Se não for bem durável, faz UPSERT nos ativos (Cria novo ou incrementa existente no destino)
        if (categoriaTratada !== "bem durável") {
          const resAtivos = await api.get("/ativos").catch(() => ({ data: [] }));
          const listaAtivos = Array.isArray(resAtivos.data) ? resAtivos.data : [];

          let ativoExistente = null;
          if (patrimonioFinal === "s/p" || patrimonioFinal === "sp") {
            ativoExistente = listaAtivos.find(
              (a) =>
                String(a.patrimonio || "").toLowerCase().trim() === patrimonioFinal &&
                String(a.nome || "").toLowerCase().trim() === (item.nome || "").toLowerCase().trim() &&
                String(a.unidade || "").toLowerCase().trim() === dadosSaida.novaUnidade.toLowerCase().trim() &&
                String(a.setor || "").toLowerCase().trim() === dadosSaida.novoSetor.toLowerCase().trim()
            );
          } else {
            ativoExistente = listaAtivos.find(
              (a) => String(a.patrimonio || "").toLowerCase().trim() === patrimonioFinal
            );
          }

          const payloadAtivo = {
            nome: (item.nome || "").toLowerCase().trim(),
            tipoItem: categoriaTratada,
            tipo: (item.tipo || "equipamento").toLowerCase().trim(),
            estado: (item.estado || "bom").toLowerCase().trim(),
            observacoes: (item.observacoes || "").toLowerCase().trim(),
            cadastradoPor: (item.cadastradoPor || currentUser.email || "").toLowerCase().trim(),
            criadoEm: item.criadoEm || new Date().toISOString(),
            quantidade: ativoExistente ? Number(ativoExistente.quantidade || 0) + qtdSolicitada : qtdSolicitada,
            patrimonio: patrimonioFinal,
            unidade: dadosSaida.novaUnidade.toLowerCase().trim(),
            setor: dadosSaida.novoSetor.toLowerCase().trim(),
            status: "ativo",
            ultimaMovimentacao: new Date().toISOString(),
          };

          if (ativoExistente) {
            const idTarget = ativoExistente._id || ativoExistente.id;
            await api.put(`/ativos/${idTarget}`, payloadAtivo);
          } else {
            await api.post("/ativos", payloadAtivo);
          }
        }

        // 3. Atualiza ou Remove o registro da coleção /estoque
        if (qtdSolicitada < qtdAtual) {
          // Se ainda sobrou saldo, decrementa a quantidade via PUT
          const payloadEstoque = {
            ...item,
            nome: (item.nome || "").toLowerCase().trim(),
            patrimonio: (item.patrimonio || "").toLowerCase().trim(),
            quantidade: qtdAtual - qtdSolicitada,
            status: "ativo",
            ultimaMovimentacao: new Date().toISOString(),
          };

          delete payloadEstoque.quantidadeMovimentada;
          delete payloadEstoque.patrimonioMapeado;

          await api.put(`/estoque/${itemId}`, payloadEstoque);
        } else {
          // Se a quantidade foi toda transferida, deleta do estoque
          try {
            await api.delete(`/estoque/${itemId}`);
          } catch (errDelete) {
            // Fallback caso a rota DELETE não esteja mapeada no backend
            const payloadFallback = {
              ...item,
              nome: (item.nome || "").toLowerCase().trim(),
              patrimonio: (item.patrimonio || "").toLowerCase().trim(),
              quantidade: 0,
              status: "movimentado",
              ultimaMovimentacao: new Date().toISOString(),
            };

            delete payloadFallback.quantidadeMovimentada;
            delete payloadFallback.patrimonioMapeado;

            await api.put(`/estoque/${itemId}`, payloadFallback);
          }
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
        motivo: "transferência regular (reforço/expansão)",
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