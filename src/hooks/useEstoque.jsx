import { useState, useEffect } from "react";
import { auth } from "../services/firebase";
import api from "../services/api";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

// 1. IMPORTAR O MAPA REAL DE SETORES
import { MAPA_SETORES_POR_UNIDADE } from "../components/constants/setores";

// Função utilitária para normalizar strings preservando 'upa inoã'
const normalizarTexto = (str) => {
  if (!str) return "";
  let texto = str.toLowerCase().trim();

  // Força o padrão 'upa inoã' para qualquer variação de Inoã
  if (/upa.*ino/i.test(texto) || texto.includes("inoã")) {
    return "upa inoã";
  }

  // Remove acentos e caracteres especiais das demais strings
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
};

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
    motivo: "transferencia regular (reforco/expansao)",
  });

  const navigate = useNavigate();

  // 2. LISTA PADRÃO DE UNIDADES (Alinhada com 'upa inoã')
  const unidades = [
    "Estoque Central",
    "Hospital Conde",
    "upa inoã",
    "upa santa rita",
    "samu barroco",
    "samu ponta negra",
    "samu centro",
  ];

  // Busca segura no mapa de setores ignorando acentos e caixa alta/baixa
  const obterSetoresDoMapa = (nomeUnidade) => {
    if (!MAPA_SETORES_POR_UNIDADE) return [];
    
    if (MAPA_SETORES_POR_UNIDADE[nomeUnidade]) {
      return MAPA_SETORES_POR_UNIDADE[nomeUnidade];
    }

    const chaveEncontrada = Object.keys(MAPA_SETORES_POR_UNIDADE).find(
      (chave) => normalizarTexto(chave) === normalizarTexto(nomeUnidade)
    );

    return chaveEncontrada ? MAPA_SETORES_POR_UNIDADE[chaveEncontrada] : [];
  };

  // 3. ESTRUTURAÇÃO SEGURA DOS SETORES POR UNIDADE
  const setoresPorUnidade = {
    ...MAPA_SETORES_POR_UNIDADE,
    "Estoque Central": ["Equipamento Usado", "Reserva Técnica", "Inservível / Manutenção"],
    "Hospital Conde": obterSetoresDoMapa("Hospital Conde"),
    "upa inoã": obterSetoresDoMapa("UPA de Inoã") || obterSetoresDoMapa("upa inoã"),
    "upa santa rita": obterSetoresDoMapa("UPA de Santa Rita"),
    "samu barroco": obterSetoresDoMapa("SAMU Barroco"),
    "samu ponta negra": obterSetoresDoMapa("SAMU Ponta Negra"),
    "samu centro": obterSetoresDoMapa("SAMU Centro"),
  };

  const motivosSaida = [
    { value: "transferencia regular (reforco/expansao)", label: "Transferência Regular (Reforço/Expansão)" },
    { value: "substituicao por rasgo/avaria", label: "Substituição por Rasgo/Avaria" },
    { value: "substituicao por infeccao/contaminacao", label: "Substituição por Infecção/Contaminação (Descarte Sanitário)" },
    { value: "substituicao por defeito tecnico/mecanico", label: "Substituição por Defeito Técnico/Mecânico" },
    { value: "emprestimo temporario", label: "Empréstimo Temporário" },
  ];

  const carregarEstoque = async () => {
    setLoading(true);
    try {
      const resposta = await api.get("/estoque");
      const listaCompleta = Array.isArray(resposta.data) ? resposta.data : [];
      
      const lista = listaCompleta.filter(item => normalizarTexto(item.status || "ativo") === "ativo");
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

    const patrimonioOriginal = normalizarTexto(itemParaAdicionar.patrimonio);
    const patrimonioFinal = (patrimonioOriginal === "s/p" || patrimonioOriginal === "sp")
      ? normalizarTexto(patrimonioInput)
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
      ? "responsavel pelo setor" 
      : normalizarTexto(dadosSaida.responsavelRecebimento);

    const unidadeDestinoNormalizada = normalizarTexto(dadosSaida.novaUnidade);
    const setorDestinoNormalizado = normalizarTexto(dadosSaida.novoSetor);

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
        const patrimonioFinal = normalizarTexto(item.patrimonioMapeado || item.patrimonio);
        const categoriaTratada = normalizarTexto(item.categoriaItem || item.tipoItem || item.tipo || "mobiliario");

        if (!itemId) {
          throw new Error(`Item "${item.nome || 'desconhecido'}" sem identificador válido.`);
        }

        // 1. Registra o histórico na coleção /saidaEquipamento
        await api.post("/saidaEquipamento", {
          estoqueId: itemId,
          patrimonio: patrimonioFinal,
          nomeEquipamento: normalizarTexto(item.nome),
          unidadeOrigem: normalizarTexto(item.unidade || "almoxarifado central"),
          setorOrigem: normalizarTexto(item.setor || "patrimonio"),
          unidadeDestino: unidadeDestinoNormalizada,
          setorDestino: setorDestinoNormalizado,
          quantidadeRetirada: qtdSolicitada,
          responsavelRecebimento: responsavelFinal,
          motivo: normalizarTexto(dadosSaida.motivo),
          dataSaida: new Date().toISOString()
        });

        // 2. Se não for bem durável, faz UPSERT nos ativos
        if (categoriaTratada !== "bem duravel") {
          const resAtivos = await api.get("/ativos").catch(() => ({ data: [] }));
          const listaAtivos = Array.isArray(resAtivos.data) ? resAtivos.data : [];

          let ativoExistente = null;
          if (patrimonioFinal === "s/p" || patrimonioFinal === "sp") {
            ativoExistente = listaAtivos.find(
              (a) =>
                normalizarTexto(a.patrimonio) === patrimonioFinal &&
                normalizarTexto(a.nome) === normalizarTexto(item.nome) &&
                normalizarTexto(a.unidade) === unidadeDestinoNormalizada &&
                normalizarTexto(a.setor) === setorDestinoNormalizado
            );
          } else {
            ativoExistente = listaAtivos.find(
              (a) => normalizarTexto(a.patrimonio) === patrimonioFinal
            );
          }

          const payloadAtivo = {
            nome: normalizarTexto(item.nome),
            tipoItem: categoriaTratada,
            tipo: normalizarTexto(item.tipo || "equipamento"),
            estado: normalizarTexto(item.estado || "bom"),
            observacoes: normalizarTexto(item.observacoes),
            cadastradoPor: normalizarTexto(item.cadastradoPor || currentUser.email),
            criadoEm: item.criadoEm || new Date().toISOString(),
            quantidade: ativoExistente ? Number(ativoExistente.quantidade || 0) + qtdSolicitada : qtdSolicitada,
            patrimonio: patrimonioFinal,
            unidade: unidadeDestinoNormalizada,
            setor: setorDestinoNormalizado,
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
          const payloadEstoque = {
            ...item,
            nome: normalizarTexto(item.nome),
            patrimonio: normalizarTexto(item.patrimonio),
            quantidade: qtdAtual - qtdSolicitada,
            status: "ativo",
            ultimaMovimentacao: new Date().toISOString(),
          };

          delete payloadEstoque.quantidadeMovimentada;
          delete payloadEstoque.patrimonioMapeado;

          await api.put(`/estoque/${itemId}`, payloadEstoque);
        } else {
          try {
            await api.delete(`/estoque/${itemId}`);
          } catch (errDelete) {
            const payloadFallback = {
              ...item,
              nome: normalizarTexto(item.nome),
              patrimonio: normalizarTexto(item.patrimonio),
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
        motivo: "transferencia regular (reforco/expansao)",
      });
      carregarEstoque();
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "Erro ao efetivar transferência.");
    } finally {
      setProcessando(false);
    }
  };

  const isEstoque = normalizarTexto(dadosSaida.novaUnidade) === "estoque central";

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