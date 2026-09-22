import { useState, useEffect, useRef } from "react";
import { auth } from "../services/firebase";
import api from "../services/api";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";
import ExcelJS from "exceljs";
import { useSetores } from "../components/constants/setores";

export const useInventario = () => {
  const [itens, setItens] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Consome os setores e o mapa de setores dinâmico vindo da base de dados/hook
  const { mapaSetores, setores: listaTodosSetoresBD } = useSetores();

  // Estados dos Filtros
  const [unidadeFiltro, setUnidadeFiltro] = useState("Todas");
  const [setorFiltro, setSetorFiltro] = useState("Todos");
  const [statusFiltro, setStatusFiltro] = useState("Todos");
  const [buscaPatrimonio, setBuscaPatrimonio] = useState("");

  const [paginaAtual, setPaginaAtual] = useState(1);

  // Estado para controlar o Novo Modal de etapas
  const [modalAberto, setModalAberto] = useState(false);
  const [equipamentoSelecionado, setEquipamentoSelecionado] = useState(null);

  // CONTROLE DO DROPDOWN CUSTOMIZADO DE SETORES
  const [mostrarDropdownSetor, setMostrarDropdownSetor] = useState(false);
  const dropdownSetorRef = useRef(null);

  const navigate = useNavigate();
  const itensPorPagina = 15;
  const WEBAPP_URL_SHEETS =
    "https://script.google.com/macros/s/AKfycbxR6EGGtOkeZCUMXA4y2hggPXNPUZL80L4acj9CP9MxVxqSbOrYcsyQ2OY2aFpYabsAEA/exec";

  // Normalização para comparações e busca
  const normalizarParaComparacao = (texto) => {
    if (!texto) return "";
    let limpo = texto
      .toString()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[/\s._-]/g, " ")
      .trim();

    limpo = limpo.replace(/\bhc\b/g, "hospitalar");
    return limpo.replace(/\s+/g, "");
  };

  // Função centralizada para ordenar por Unidade -> Setor -> Equipamento (A-Z)
  const ordenarHierarquico = (lista) => {
    return [...lista].sort((a, b) => {
      const unidadeA = String(a.unidade || "").toLowerCase().trim();
      const unidadeB = String(b.unidade || "").toLowerCase().trim();
      const compUnidade = unidadeA.localeCompare(unidadeB, "pt-BR", {
        sensitivity: "base",
        numeric: true,
      });
      if (compUnidade !== 0) return compUnidade;

      const setorA = String(a.setor || "").toLowerCase().trim();
      const setorB = String(b.setor || "").toLowerCase().trim();
      const compSetor = setorA.localeCompare(setorB, "pt-BR", {
        sensitivity: "base",
        numeric: true,
      });
      if (compSetor !== 0) return compSetor;

      const nomeA = String(a.nome || a.equipamento || a.descricao || "")
        .toLowerCase()
        .trim();
      const nomeB = String(b.nome || b.equipamento || b.descricao || "")
        .toLowerCase()
        .trim();
      return nomeA.localeCompare(nomeB, "pt-BR", {
        sensitivity: "base",
        numeric: true,
      });
    });
  };

  // Comparador flexível por palavras para evitar falhas por variações de nomenclatura
  const compararSetoresFlexivel = (setorBuscado, setorItem) => {
    if (!setorBuscado || setorBuscado === "Todos" || !setorBuscado.trim())
      return true;
    if (!setorItem) return false;

    const termoBuscaNorm = normalizarParaComparacao(setorBuscado);
    const termoItemNorm = normalizarParaComparacao(setorItem);

    if (
      termoItemNorm.includes(termoBuscaNorm) ||
      termoBuscaNorm.includes(termoItemNorm)
    ) {
      return true;
    }

    const palavrasBusca = setorBuscado
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .split(/\s+/)
      .filter((p) => p.length > 2 && !["de", "da", "do"].includes(p));

    const palavrasItem = setorItem
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .split(/\s+/)
      .filter((p) => p.length > 2 && !["de", "da", "do"].includes(p));

    return palavrasBusca.every((pBusca) =>
      palavrasItem.some(
        (pItem) =>
          pItem.startsWith(pBusca) ||
          pBusca.startsWith(pItem) ||
          (pBusca === "hc" && pItem.startsWith("hosp"))
      )
    );
  };

  useEffect(() => {
    const clicarFora = (e) => {
      if (
        dropdownSetorRef.current &&
        !dropdownSetorRef.current.contains(e.target)
      ) {
        setMostrarDropdownSetor(false);
      }
    };
    document.addEventListener("mousedown", clicarFora);
    return () => document.removeEventListener("mousedown", clicarFora);
  }, []);

  const carregarDados = async (e) => {
    if (e) e.preventDefault();
    if (loading) return;
    setLoading(true);
    setHasSearched(true);
    setPaginaAtual(1);

    try {
      const currentUser = auth.currentUser;
      const token = currentUser ? await currentUser.getIdToken() : "";

      const resposta = await api.get("/ativos", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const dadosBrutos = resposta.data;
      const todosOsDados = Array.isArray(dadosBrutos)
        ? dadosBrutos
        : dadosBrutos?.ativos || dadosBrutos?.dados || [];

      const ordenados = ordenarHierarquico(todosOsDados);
      setItens(ordenados);

      if (ordenados.length > 0) {
        toast.success(`${ordenados.length} itens encontrados.`);
      } else {
        toast.info("Nenhum item encontrado no banco.");
      }
    } catch (error) {
      console.error("Erro ao carregar:", error);
      toast.error("Erro ao consultar dados.");
      setItens([]);
    } finally {
      setLoading(false);
    }
  };

  const confirmarBaixaPatrimonio = async (
    equipamentoParaBaixar,
    dadosBaixaAvulsa
  ) => {
    const itemTarget = equipamentoParaBaixar || equipamentoSelecionado;

    if (!itemTarget) {
      toast.error("Nenhum equipamento selecionado para baixa.");
      return;
    }

    const idAtivo =
      itemTarget.idAtivo ||
      itemTarget.ativoId ||
      itemTarget.id ||
      itemTarget._id;

    if (!idAtivo) {
      toast.error("ID do patrimônio não localizado.");
      return;
    }

    try {
      setLoading(true);
      const currentUser = auth.currentUser;
      const token = currentUser ? await currentUser.getIdToken() : "";

      const dataHoraAtual = new Date().toISOString();
      const destinoFinal =
        dadosBaixaAvulsa?.destino ||
        dadosBaixaAvulsa?.localArmazenamento ||
        itemTarget.destino ||
        "armazenamento central";
      const motivoFinal = dadosBaixaAvulsa?.motivoBaixa || "inservivel";
      const estadoFinal = dadosBaixaAvulsa?.estadoConservacao || "sucata";
      const processoFinal =
        dadosBaixaAvulsa?.numeroProcesso ||
        `laudo-${new Date().getFullYear()}-${Math.floor(
          1000 + Math.random() * 9000
        )}`;
      const parecerTecnico = dadosBaixaAvulsa?.parecerTecnico || "";

      await api.put(
        `/ativos/${idAtivo}`,
        {
          status: "inutilizado",
          dataBaixa: dataHoraAtual,
          localArmazenamentoAcervo: destinoFinal.toLowerCase(),
          destino: destinoFinal.toLowerCase(),
          motivoBaixa: motivoFinal.toLowerCase(),
          estadoConservacao: estadoFinal.toLowerCase(),
          numeroProcesso: processoFinal.toLowerCase(),
          parecerTecnico: parecerTecnico.toLowerCase(),
          observacoes: `baixa definitiva realizada em ${new Date(
            dataHoraAtual
          ).toLocaleString("pt-BR")}. ref/os: ${processoFinal}. destino: ${destinoFinal}. motivo: ${motivoFinal}`.toLowerCase(),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success("Baixa do patrimônio realizada com sucesso!");
      setModalAberto(false);
      await carregarDados();
    } catch (error) {
      console.error("Erro ao efetuar baixa via API:", error);
      toast.error(
        error.response?.data?.message || "Erro ao dar baixa no patrimônio."
      );
    } finally {
      setLoading(false);
    }
  };

  const limparFiltros = () => {
    setBuscaPatrimonio("");
    setUnidadeFiltro("Todas");
    setSetorFiltro("Todos");
    setStatusFiltro("Todos");
    setItens([]);
    setHasSearched(false);
  };

  const obterSetoresDisponiveis = () => {
    const deParaUnidades = {
      "Hospital Conde": "Hospital Conde",
      "Santa Rita": "Upa Santa Rita",
      Inoã: "Upa Inoã",
      Barroco: "Samu Barroco",
      "Ponta Negra": "Samu Ponta Negra",
      Centro: "Samu Centro",
    };

    const chaveUnidade = deParaUnidades[unidadeFiltro] || unidadeFiltro;
    let listaSetores = [];

    // Tenta procurar os setores mapeados na estrutura do mapa vindo do banco de dados
    if (chaveUnidade && mapaSetores && mapaSetores[chaveUnidade]) {
      listaSetores = [...mapaSetores[chaveUnidade]];
    } else {
      // Se não encontrar no mapa dinâmico, extrai os setores diretamente dos itens do inventário ou da lista global de setores
      const setoresUnicos = new Set();
      
      if (Array.isArray(listaTodosSetoresBD) && listaTodosSetoresBD.length > 0) {
        listaTodosSetoresBD.forEach((s) => {
          const nomeSetor = typeof s === "string" ? s : s.nome;
          if (nomeSetor) setoresUnicos.add(nomeSetor.trim());
        });
      } else {
        const listaSegura = Array.isArray(itens) ? itens : [];
        listaSegura.forEach((item) => {
          if (item.setor && item.setor.trim() !== "") {
            setoresUnicos.add(item.setor.trim());
          }
        });
      }
      
      listaSetores = Array.from(setoresUnicos);
    }

    listaSetores.sort();

    if (setorFiltro !== "Todos" && setorFiltro.trim() !== "") {
      return listaSetores.filter((setor) =>
        compararSetoresFlexivel(setorFiltro, setor)
      );
    }

    return listaSetores;
  };

  const listaItensSegura = Array.isArray(itens) ? itens : [];
  const itensFiltrados = ordenarHierarquico(
    listaItensSegura.filter((item) => {
      const unidadeItemNorm = normalizarParaComparacao(item.unidade || "");
      const unidadeSelecionadaNorm = normalizarParaComparacao(unidadeFiltro);
      const matchUnidade =
        unidadeFiltro === "Todas" ||
        unidadeItemNorm.includes(unidadeSelecionadaNorm) ||
        unidadeSelecionadaNorm.includes(unidadeItemNorm);

      const matchSetor = compararSetoresFlexivel(setorFiltro, item.setor || "");

      const statusItemLower = String(item.status || "operante")
        .toLowerCase()
        .trim();
      let matchStatus = false;
      if (statusFiltro === "Todos") {
        matchStatus = true;
      } else if (statusFiltro === "Ativo") {
        matchStatus =
          statusItemLower === "ativo" || statusItemLower === "operante";
      } else if (statusFiltro === "Baixado") {
        matchStatus =
          statusItemLower === "baixado" ||
          statusItemLower === "inutilizado" ||
          statusItemLower === "inutilizados";
      }

      let matchBusca = true;
      if (buscaPatrimonio.trim() !== "") {
        const termoNorm = normalizarParaComparacao(buscaPatrimonio);
        const patItemNorm = normalizarParaComparacao(item.patrimonio || "");
        const nomeItemNorm = normalizarParaComparacao(
          item.nome || item.equipamento || item.descricao || ""
        );
        matchBusca =
          patItemNorm.includes(termoNorm) || nomeItemNorm.includes(termoNorm);
      }

      return matchUnidade && matchSetor && matchStatus && matchBusca;
    })
  );

  const totalPaginas = Math.ceil(itensFiltrados.length / itensPorPagina);
  const itensExibidos = itensFiltrados.slice(
    (paginaAtual - 1) * itensPorPagina,
    paginaAtual * itensPorPagina
  );

  const formatarDataBR = (timestamp) => {
    if (!timestamp) return "";
    try {
      let data;
      if (typeof timestamp.toDate === "function") {
        data = timestamp.toDate();
      } else {
        data = new Date(timestamp);
      }
      if (isNaN(data.getTime())) return "";
      return data.toLocaleDateString("pt-BR");
    } catch (e) {
      return "";
    }
  };

  const exportarExcelCompleto = async () => {
    if (itensFiltrados.length === 0)
      return toast.error("Não há dados para exportar.");

    toast.info("Sincronizando e gerando arquivos...");

    try {
      const dadosParaEnviar = ordenarHierarquico(itensFiltrados).map((i) => ({
        patrimonio: String(i.patrimonio || "sp").toLowerCase(),
        nome: String(i.nome || i.equipamento || i.descricao || "sem nome").toLowerCase(),
        unidade: String(i.unidade || "").toLowerCase(),
        setor: String(i.setor || "").toLowerCase(),
        estado: String(i.estado || "bom").toLowerCase(),
        quantidade: i.quantidade || 1,
        observacoes: String(i.observacoes || "").toLowerCase(),
        status: String(i.status || "operante").toLowerCase(),
        tipo: String(i.tipo || "n/a").toLowerCase(),
        motivoBaixa: String(i.motivoBaixa || "").toLowerCase(),
        estadoConservacao: String(i.estadoConservacao || "").toLowerCase(),
        numeroProcesso: String(i.numeroProcesso || "").toLowerCase(),
        parecerTecnico: String(i.parecerTecnico || "").toLowerCase(),
        localArmazenamentoAcervo: String(
          i.localArmazenamentoAcervo || ""
        ).toLowerCase(),
        dataBaixa: formatarDataBR(i.dataBaixa || i.data_baixa),
      }));

      const ws = XLSX.utils.json_to_sheet(dadosParaEnviar);
      const wb = XLSX.utils.book_new();

      XLSX.utils.book_append_sheet(wb, ws, "Inventario");
      XLSX.writeFile(
        wb,
        `inventario_${unidadeFiltro.toLowerCase().replace(/\s+/g, "_")}.xlsx`
      );

      await fetch(WEBAPP_URL_SHEETS, {
        method: "POST",
        mode: "no-cors",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dadosParaEnviar),
      });

      toast.success("Exportação local concluída e Google Sheets atualizado!");
    } catch (error) {
      console.error("Erro na sincronização:", error);
      toast.error("Erro ao atualizar a planilha online.");
    }
  };

  // EXPORTAÇÃO NO MODELO FÍSICO/IMPRESSO DA SECRETARIA
  const exportarInventarioSecretaria = async () => {
    if (!itensFiltrados || itensFiltrados.length === 0) {
      toast.error("Nenhum item filtrado para exportar.");
      return;
    }

    try {
      toast.info("Gerando modelo impresso da secretaria...");

      const workbook = new ExcelJS.Workbook();
      workbook.creator = "sistema de gestao hospitalar";
      workbook.created = new Date();

      const ws = workbook.addWorksheet("inventario", {
        views: [{ showGridLines: true }],
      });

      // Largura das colunas conforme o formulário oficial
      ws.columns = [
        { key: "item", width: 8 },
        { key: "patrimonio", width: 18 },
        { key: "descricao", width: 40 },
        { key: "data", width: 12 },
        { key: "localizacao", width: 30 },
        { key: "situacao", width: 12 },
        { key: "excel", width: 10 },
        { key: "bom", width: 10 },
        { key: "reg", width: 10 },
        { key: "pessi", width: 10 },
      ];

      // --- LINHA 1: TÍTULO ---
      ws.mergeCells("A1:F1");
      ws.getCell("A1").value = "INVENTÁRIO";
      ws.getCell("A1").font = { name: "Arial", size: 11, bold: true };

      // --- LINHA 2: POSTO / UNIDADE E CABEÇALHO SITUAÇÃO DO BEM ---
      const nomeUnidade = (unidadeFiltro || "posto santa rita").toLowerCase();
      ws.mergeCells("A2:E2");
      ws.getCell("A2").value = nomeUnidade;
      ws.getCell("A2").font = { name: "Arial", size: 10, bold: true };

      ws.mergeCells("F2:F3");
      ws.getCell("F2").value = "situação do bem";
      ws.getCell("F2").font = { name: "Arial", size: 9, bold: true };
      ws.getCell("F2").alignment = { vertical: "middle", horizontal: "center" };

      // --- LINHA 3: DATA DO INVENTÁRIO E OPÇÕES DE ESTADO ---
      const dataAtual = new Date();
      const mesAnoTexto = `${dataAtual.toLocaleString("pt-BR", { month: "short" })}/${dataAtual.getFullYear()}`.toLowerCase();

      ws.mergeCells("A3:E3");
      ws.getCell("A3").value = `data inventário: ${mesAnoTexto}`;
      ws.getCell("A3").font = { name: "Arial", size: 9 };

      ws.getCell("G3").value = "excel";
      ws.getCell("H3").value = "bom";
      ws.getCell("I3").value = "reg";
      ws.getCell("J3").value = "péssi";

      ["G3", "H3", "I3", "J3"].forEach((ref) => {
        ws.getCell(ref).font = { name: "Arial", size: 8, bold: true };
        ws.getCell(ref).alignment = { horizontal: "center", vertical: "middle" };
      });

      // --- LINHA 4: CABEÇALHO DAS COLUNAS DA TABELA ---
      const headers = [
        "item",
        "patrimônio / sms",
        "descrição",
        "data",
        "localização origem",
        "situação",
      ];

      headers.forEach((header, index) => {
        const cell = ws.getCell(4, index + 1);
        cell.value = header;
        cell.font = { name: "Arial", size: 9, bold: true };
        cell.alignment = { vertical: "middle", horizontal: "center" };
      });

      // Aplica bordas ao bloco do cabeçalho (Linhas 1 a 4)
      for (let r = 1; r <= 4; r++) {
        ws.getRow(r).eachCell({ includeEmpty: true }, (cell) => {
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
        });
      }

      // --- LINHAS DE DADOS (DADOS DOS EQUIPAMENTOS) ---
      const itensOrdenados = ordenarHierarquico(itensFiltrados);

      itensOrdenados.forEach((item, index) => {
        let dataTexto = mesAnoTexto;
        const rawData = item.dataBaixa || item.data_baixa || item.createdAt;
        if (rawData) {
          try {
            const d =
              typeof rawData.toDate === "function"
                ? rawData.toDate()
                : new Date(rawData);
            if (d && !isNaN(d.getTime())) {
              dataTexto = `${d.toLocaleString("pt-BR", { month: "short" })}-${d
                .getFullYear()
                .toString()
                .slice(-2)}`.toLowerCase();
            }
          } catch {
            dataTexto = mesAnoTexto;
          }
        }

        const estadoLower = String(
          item.estado || item.estadoConservacao || "bom"
        )
          .toLowerCase()
          .trim();

        const row = ws.addRow([
          index + 1,
          String(item.patrimonio || "sp").toLowerCase().trim(),
          String(item.nome || item.equipamento || item.descricao || "")
            .toLowerCase()
            .trim(),
          dataTexto,
          String(item.setor || "").toLowerCase().trim(),
          "x",
          estadoLower === "excelente" || estadoLower === "excel" ? "x" : "",
          estadoLower === "bom" ? "x" : "",
          estadoLower === "regular" || estadoLower === "reg" ? "x" : "",
          estadoLower === "pessimo" ||
          estadoLower === "pessi" ||
          estadoLower === "ruim"
            ? "x"
            : "",
        ]);

        row.font = { name: "Arial", size: 9 };

        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          cell.alignment = {
            vertical: "middle",
            horizontal: colNumber === 3 || colNumber === 5 ? "left" : "center",
          };
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
        });
      });

      // Gerar e fazer download do arquivo .xlsx
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const sufixo = unidadeFiltro
        .toLowerCase()
        .replace(/\s+/g, "_")
        .replace(/[^a-z0-9_]/g, "");
      link.download = `inventario_secretaria_${sufixo || "geral"}.xlsx`;
      link.click();
      window.URL.revokeObjectURL(url);

      toast.success("Relatório no modelo da secretaria gerado com sucesso!");
    } catch (error) {
      console.error("Erro ao exportar modelo da secretaria:", error);
      toast.error("Erro ao gerar o arquivo Excel no modelo da secretaria.");
    }
  };

  const lidarComAberturaModal = (item) => {
    setEquipamentoSelecionado(item);
    setModalAberto(true);
  };

  return {
    itens,
    loading,
    hasSearched,
    unidadeFiltro,
    setUnidadeFiltro,
    setorFiltro,
    setSetorFiltro,
    statusFiltro,
    setStatusFiltro,
    buscaPatrimonio,
    setBuscaPatrimonio,
    paginaAtual,
    setPaginaAtual,
    modalAberto,
    setModalAberto,
    equipamentoSelecionado,
    setEquipamentoSelecionado,
    mostrarDropdownSetor,
    setMostrarDropdownSetor,
    dropdownSetorRef,
    navigate,
    itensFiltrados,
    totalPaginas,
    itensExibidos,
    formatarDataBR,
    carregarDados,
    confirmarBaixaPatrimonio,
    limparFiltros,
    obterSetoresDisponiveis,
    exportarExcelCompleto,
    exportarInventarioSecretaria,
    lidarComAberturaModal,
  };
};