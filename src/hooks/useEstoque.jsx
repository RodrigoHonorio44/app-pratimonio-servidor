import { useState, useEffect } from "react";
import { auth } from "../services/firebase";
import api from "../services/api";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import { MAPA_SETORES_POR_UNIDADE } from "../components/constants/setores";

const normalizarTexto = (str) => {
  if (!str) return "";
  let texto = String(str).toLowerCase().trim();

  if (/upa.*ino/i.test(texto) || texto.includes("inoã")) {
    return "upa inoã";
  }

  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
};

export const useEstoque = () => {
  const [itensEstoque, setItensEstoque] = useState([]);
  const [termosPendentes, setTermosPendentes] = useState([]);
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

  const unidades = [
    "estoque central",
    "hospital conde",
    "upa inoã",
    "upa santa rita",
    "samu barroco",
    "samu ponta negra",
    "samu centro",
  ];

  const obterSetoresDoMapa = (nomeUnidade) => {
    if (!MAPA_SETORES_POR_UNIDADE) return [];

    if (MAPA_SETORES_POR_UNIDADE[nomeUnidade]) {
      return MAPA_SETORES_POR_UNIDADE[nomeUnidade].map((s) => normalizarTexto(s));
    }

    const chaveEncontrada = Object.keys(MAPA_SETORES_POR_UNIDADE).find(
      (chave) => normalizarTexto(chave) === normalizarTexto(nomeUnidade)
    );

    return chaveEncontrada
      ? MAPA_SETORES_POR_UNIDADE[chaveEncontrada].map((s) => normalizarTexto(s))
      : [];
  };

  const setoresPorUnidade = {
    ...Object.keys(MAPA_SETORES_POR_UNIDADE || {}).reduce((acc, key) => {
      acc[normalizarTexto(key)] = MAPA_SETORES_POR_UNIDADE[key].map((s) =>
        normalizarTexto(s)
      );
      return acc;
    }, {}),
    "estoque central": [
      "equipamento usado",
      "reserva tecnica",
      "inservivel / manutencao",
    ],
    "hospital conde": obterSetoresDoMapa("Hospital Conde"),
    "upa inoã":
      obterSetoresDoMapa("UPA de Inoã") || obterSetoresDoMapa("upa inoã"),
    "upa santa rita": obterSetoresDoMapa("UPA de Santa Rita"),
    "samu barroco": obterSetoresDoMapa("SAMU Barroco"),
    "samu ponta negra": obterSetoresDoMapa("SAMU Ponta Negra"),
    "samu centro": obterSetoresDoMapa("SAMU Centro"),
  };

  const motivosSaida = [
    {
      value: "transferencia regular (reforco/expansao)",
      label: "transferência regular (reforço/expansão)",
    },
    {
      value: "substituicao por rasgo/avaria",
      label: "substituição por rasgo/avaria",
    },
    {
      value: "substituicao por infeccao/contaminacao",
      label: "substituição por infecção/contaminação (descarte sanitário)",
    },
    {
      value: "substituicao por defeito tecnico/mecanico",
      label: "substituição por defeito técnico/mecânico",
    },
    {
      value: "emprestimo temporario",
      label: "empréstimo temporário",
    },
  ];

  const carregarEstoque = async () => {
    setLoading(true);
    try {
      const resposta = await api.get("/estoque");
      const listaCompleta = Array.isArray(resposta.data) ? resposta.data : [];

      const lista = listaCompleta.filter(
        (item) => normalizarTexto(item.status || "ativo") === "ativo"
      );
      setItensEstoque(lista);
    } catch (error) {
      console.error("Erro ao carregar estoque:", error);
      toast.error("Erro ao carregar itens do estoque.");
    } finally {
      setLoading(false);
    }
  };

  const carregarTermosPendentes = async () => {
    try {
      const resposta = await api.get("/saidaEquipamento");
      const lista = Array.isArray(resposta.data) ? resposta.data : [];

      const pendentes = lista.filter((item) => {
        const st = normalizarTexto(item.status);
        if (!st) {
          return !item.dataEfetivacao && !item.dataCancelamento;
        }
        return st === "pendente" || st === "pendentes";
      });

      setTermosPendentes(pendentes);
    } catch (error) {
      console.error("Erro ao carregar termos pendentes:", error);
    }
  };

  useEffect(() => {
    carregarEstoque();
    carregarTermosPendentes();
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
    const patrimonioFinal =
      patrimonioOriginal === "s/p" || patrimonioOriginal === "sp"
        ? normalizarTexto(patrimonioInput)
        : patrimonioOriginal;

    if (!patrimonioFinal) {
      toast.error("Insira um número de patrimônio válido.");
      return;
    }

    const itemIdAtual = itemParaAdicionar._id?.$oid || itemParaAdicionar._id || itemParaAdicionar.id;

    const jaExiste = loteSaida.some((item) => {
      const itemIdNoLote = item._id?.$oid || item._id || item.id;
      return (
        itemIdNoLote === itemIdAtual &&
        item.patrimonioMapeado === patrimonioFinal
      );
    });

    if (jaExiste) {
      toast.error("Este item com este patrimônio já foi adicionado ao lote!");
      return;
    }

    if (patrimonioFinal !== "s/p" && patrimonioFinal !== "sp") {
      const patrimonioDuplicadoGlobal = loteSaida.some(
        (item) => item.patrimonioMapeado === patrimonioFinal
      );
      if (patrimonioDuplicadoGlobal) {
        toast.error("Este número de patrimônio já foi adicionado ao lote!");
        return;
      }
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

        const itemId = item._id?.$oid || item._id || item.id;
        const patrimonioFinal = normalizarTexto(
          item.patrimonioMapeado || item.patrimonio
        );

        if (!itemId) {
          throw new Error(
            `Item "${item.nome || "desconhecido"}" sem identificador válido.`
          );
        }

        await api.post("/saidaEquipamento", {
          estoqueId: itemId,
          patrimonio: patrimonioFinal,
          nomeEquipamento: normalizarTexto(item.nome),
          unidadeOrigem: normalizarTexto(
            item.unidade || "almoxarifado central"
          ),
          setorOrigem: normalizarTexto(item.setor || "patrimonio"),
          unidadeDestino: unidadeDestinoNormalizada,
          setorDestino: setorDestinoNormalizado,
          quantidadeRetirada: qtdSolicitada,
          responsavelRecebimento: responsavelFinal,
          motivo: normalizarTexto(dadosSaida.motivo),
          categoriaItem: normalizarTexto(
            item.categoriaItem || item.tipoItem || item.tipo || "mobiliario"
          ),
          estado: normalizarTexto(item.estado || "bom"),
          observacoes: normalizarTexto(item.observacoes || ""),
          dataSaida: new Date().toISOString(),
          status: "pendente",
          criadoPor: normalizarTexto(currentUser.email),
        });
      }

      toast.success(
        "Termo gerado com sucesso! Aguardando confirmação do setor."
      );
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
      carregarTermosPendentes();
    } catch (error) {
      toast.error(
        error.response?.data?.message || error.message || "Erro ao gerar termo."
      );
    } finally {
      setProcessando(false);
    }
  };

  const confirmarBaixaTermoPendente = async (termoPendenteInput, responsavelNome = null) => {
    setProcessando(true);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("Usuário não autenticado");

      let termoPendente = termoPendenteInput;

      if (typeof termoPendenteInput === "string") {
        const res = await api.get(`/saidaEquipamento/${termoPendenteInput}`);
        termoPendente = res.data;
      }

      const termoId =
        termoPendente._id?.$oid || termoPendente._id || termoPendente.id;
      const itemId = termoPendente.estoqueId;
      const qtdSolicitada = Number(termoPendente.quantidadeRetirada);
      const patrimonioFinal = normalizarTexto(termoPendente.patrimonio);
      const categoriaTratada = normalizarTexto(
        termoPendente.categoriaItem || "mobiliario"
      );
      const unidadeDestinoNormalizada = normalizarTexto(
        termoPendente.unidadeDestino
      );
      const setorDestinoNormalizado = normalizarTexto(
        termoPendente.setorDestino
      );
      const responsavelFinal = normalizarTexto(
        responsavelNome || termoPendente.responsavelRecebimento || "responsavel pelo setor"
      );

      // Busca item na lista de estoque completa para evitar erro 404 em GET individual
      const resEstoque = await api.get("/estoque");
      const listaEstoque = Array.isArray(resEstoque.data) ? resEstoque.data : [];
      const itemEstoque = listaEstoque.find((i) => {
        const idItem = i._id?.$oid || i._id || i.id;
        return String(idItem) === String(itemId);
      });

      if (!itemEstoque) {
        throw new Error("Item original não encontrado no estoque.");
      }

      const qtdAtual = Number(itemEstoque.quantidade || 0);
      if (qtdSolicitada > qtdAtual) {
        throw new Error(
          `Estoque insuficiente para dar baixa no item ${termoPendente.nomeEquipamento}.`
        );
      }

      // 1. Registra / atualiza em /ativos
      if (categoriaTratada !== "bem duravel") {
        const resAtivos = await api.get("/ativos").catch(() => ({ data: [] }));
        const listaAtivos = Array.isArray(resAtivos.data) ? resAtivos.data : [];

        let ativoExistente = null;
        if (patrimonioFinal === "s/p" || patrimonioFinal === "sp") {
          ativoExistente = listaAtivos.find(
            (a) =>
              normalizarTexto(a.patrimonio) === patrimonioFinal &&
              normalizarTexto(a.nome) ===
                normalizarTexto(termoPendente.nomeEquipamento) &&
              normalizarTexto(a.unidade) === unidadeDestinoNormalizada &&
              normalizarTexto(a.setor) === setorDestinoNormalizado
          );
        } else {
          ativoExistente = listaAtivos.find(
            (a) => normalizarTexto(a.patrimonio) === patrimonioFinal
          );
        }

        const payloadAtivo = {
          nome: normalizarTexto(termoPendente.nomeEquipamento),
          tipoItem: categoriaTratada,
          tipo: normalizarTexto(itemEstoque.tipo || "equipamento"),
          estado: normalizarTexto(termoPendente.estado || "bom"),
          observacoes: normalizarTexto(termoPendente.observacoes || ""),
          cadastradoPor: normalizarTexto(
            itemEstoque.cadastradoPor || currentUser.email
          ),
          criadoEm: itemEstoque.criadoEm || new Date().toISOString(),
          quantidade: ativoExistente
            ? Number(ativoExistente.quantidade || 0) + qtdSolicitada
            : qtdSolicitada,
          patrimonio: patrimonioFinal,
          unidade: unidadeDestinoNormalizada,
          setor: setorDestinoNormalizado,
          status: "ativo",
          ultimaMovimentacao: new Date().toISOString(),
        };

        if (ativoExistente) {
          const idTarget = ativoExistente._id?.$oid || ativoExistente._id || ativoExistente.id;
          await api.put(`/ativos/${idTarget}`, payloadAtivo);
        } else {
          await api.post("/ativos", payloadAtivo);
        }
      }

      // 2. Abate ou exclui do /estoque
      if (qtdSolicitada < qtdAtual) {
        const payloadEstoque = {
          ...itemEstoque,
          nome: normalizarTexto(itemEstoque.nome),
          patrimonio: normalizarTexto(itemEstoque.patrimonio),
          quantidade: qtdAtual - qtdSolicitada,
          status: "ativo",
          ultimaMovimentacao: new Date().toISOString(),
        };

        await api.put(`/estoque/${itemId}`, payloadEstoque);
      } else {
        try {
          await api.delete(`/estoque/${itemId}`);
        } catch (errDelete) {
          const payloadFallback = {
            ...itemEstoque,
            nome: normalizarTexto(itemEstoque.nome),
            patrimonio: normalizarTexto(itemEstoque.patrimonio),
            quantidade: 0,
            status: "movimentado",
            ultimaMovimentacao: new Date().toISOString(),
          };

          await api.put(`/estoque/${itemId}`, payloadFallback);
        }
      }

      // 3. Atualiza o status do termo para "concluido"
      await api.put(`/saidaEquipamento/${termoId}`, {
        ...termoPendente,
        responsavelRecebimento: responsavelFinal,
        status: "concluido",
        dataEfetivacao: new Date().toISOString(),
        confirmadoPor: normalizarTexto(currentUser.email),
      });

      toast.success("Baixa no estoque efetuada com sucesso!");
      carregarEstoque();
      carregarTermosPendentes();
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Erro ao confirmar baixa."
      );
    } finally {
      setProcessando(false);
    }
  };

  const recusarTermoPendente = async (termoPendente) => {
    setProcessando(true);
    try {
      const termoId =
        termoPendente._id?.$oid ||
        termoPendente._id ||
        termoPendente.id ||
        termoPendente;

      await api.delete(`/saidaEquipamento/${termoId}`);

      toast.success("Registro excluído permanentemente do banco de dados!");
      carregarTermosPendentes();
    } catch (error) {
      console.error("Erro ao excluir registro:", error);
      toast.error("Erro ao excluir o registro do banco de dados.");
    } finally {
      setProcessando(false);
    }
  };

  const isEstoque =
    normalizarTexto(dadosSaida.novaUnidade) === "estoque central";

  return {
    itensEstoque,
    termosPendentes,
    saidasPendentes: termosPendentes,
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
    carregarTermosPendentes,
    adicionarAoLote,
    removerDoLote,
    efetivarTransferenciaESalvar,
    confirmarBaixaTermoPendente,
    confirmarSaidaPendente: confirmarBaixaTermoPendente,
    recusarTermoPendente,
    navigate,
  };
};