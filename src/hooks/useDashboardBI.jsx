// src/hooks/useDashboardBI.js
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export const useDashboardBI = () => {
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    total: 0,
    abertos: 0,
    fechados: 0,
    pendentes: 0,
    baixas: 0,
    slaMedio: "00h 00m",
    totalAtivos: 0,
    totalLaudos: 0,
    totalSaidas: 0,
    taxaConclusao: "0%",
    tempoMedioResolucao: "00h 00m",
    produtividadeGeral: 0,
  });

  const [dadosSetores, setDadosSetores] = useState([]);
  const [dadosEvolucao, setDadosEvolucao] = useState([]);
  const [dadosSlaEquipes, setDadosSlaEquipes] = useState([]);
  const [dadosEquipesAtendimento, setDadosEquipesAtendimento] = useState([]);
  const [baixasPorUnidadeSetor, setBaixasPorUnidadeSetor] = useState([]);
  const [inventarioEquipamentos, setInventarioEquipamentos] = useState([]);
  const [listaLaudos, setListaLaudos] = useState([]);
  const [listaSaidas, setListaSaidas] = useState([]);
  const [listaBaixas, setListaBaixas] = useState([]);
  const [top10Baixas, setTop10Baixas] = useState([]);
  const [unidadesDisponiveis, setUnidadesDisponiveis] = useState([]);
  const [distribuicaoStatus, setDistribuicaoStatus] = useState([]);
  const [kpisAvancados, setKpisAvancados] = useState({
    eficienciaOperacional: 0,
    taxaInutilizacao: 0,
    volumeMovimentacoes: 0
  });

  const [filtroUnidade, setFiltroUnidade] = useState("TODAS");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [loading, setLoading] = useState(true);

  const [dadosBrutos, setDadosBrutos] = useState({
    chamados: [],
    ativos: [],
    laudos: [],
    saidas: [],
  });

  const [showTop10, setShowTop10] = useState(false);
  const [showDetalhes, setShowDetalhes] = useState(false);

  const normalizar = useCallback(
    (texto = "") =>
      texto
        ?.toString()
        .toUpperCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim() || "",
    []
  );

  const parseDataComp = (dataStr) => {
    if (!dataStr || dataStr === "N/A") return null;
    try {
      if (typeof dataStr === "object" && dataStr !== null) {
        if (typeof dataStr.toDate === "function") return dataStr.toDate();
        if (dataStr.seconds) return new Date(dataStr.seconds * 1000);
      }
      const stringLimpa = String(dataStr).trim();
      if (stringLimpa.includes("/")) {
        const apenasData = stringLimpa.split(",")[0].trim();
        const [d, m, a] = apenasData.split("/");
        const anoFull = a.length === 2 ? `20${a}` : a;
        return new Date(Number(anoFull), Number(m) - 1, Number(d), 12, 0, 0);
      }
      if (stringLimpa.includes("-")) {
        const partes = stringLimpa.split("T")[0].split("-");
        return new Date(Number(partes[0]), Number(partes[1]) - 1, Number(partes[2]), 12, 0, 0);
      }
      const dObj = new Date(stringLimpa);
      return isNaN(dObj.getTime()) ? null : dObj;
    } catch (e) {
      return null;
    }
  };

  const formatarDataTexto = (dataBruta) => {
    if (!dataBruta) return "N/A";
    if (typeof dataBruta === "string" && !dataBruta.includes("T")) return dataBruta;
    const dObj = parseDataComp(dataBruta);
    if (dObj && !isNaN(dObj.getTime())) {
      return dObj.toLocaleDateString("pt-BR");
    }
    return "N/A";
  };

  const processarDados = useCallback(
    (
      chamados = dadosBrutos.chamados, 
      ativos = dadosBrutos.ativos,
      laudos = dadosBrutos.laudos,
      saidas = dadosBrutos.saidas
    ) => {
      const dInicio = dataInicio ? parseDataComp(dataInicio) : null;
      if (dInicio) dInicio.setHours(0, 0, 0, 0);

      const dFim = dataFim ? parseDataComp(dataFim) : null;
      if (dFim) dFim.setHours(23, 59, 59, 999);

      const chamadosFiltrados = (chamados || []).filter((item) => {
        const u = item.unidade || "";
        const matchUnidade =
          filtroUnidade === "TODAS" ||
          normalizar(u) === normalizar(filtroUnidade);

        const dataCrua = item.criadoEm || item.data || item.finalizadoEm;
        const dObj = parseDataComp(dataCrua);
        
        let matchData = true;
        if (dObj) {
          dObj.setHours(12, 0, 0, 0);
          if (dInicio && dObj.getTime() < dInicio.getTime()) matchData = false;
          if (dFim && dObj.getTime() > dFim.getTime()) matchData = false;
        } else if (dInicio || dFim) {
          matchData = false;
        }
        return matchUnidade && matchData;
      });

      const chamadosFechados = chamadosFiltrados.filter((c) => {
        const st = normalizar(c.status || "");
        return st.includes("FECHADO") || st.includes("CONCLUIDO") || st.includes("ARQUIVADO");
      });

      const chamadosAbertos = chamadosFiltrados.filter((c) => {
        const st = normalizar(c.status || "");
        return st.includes("ABERTO") || st.includes("EM ATENDIMENTO") || !st;
      });

      const chamadosPendentes = chamadosFiltrados.filter((c) => {
        const st = normalizar(c.status || "");
        return st.includes("PENDENTE") || st.includes("AGUARDANDO") || st.includes("EM ESPERA");
      });

      const totalChamadosValidos = chamadosFiltrados.length;
      const taxaConclusaoCalc = totalChamadosValidos > 0
        ? ((chamadosFechados.length / totalChamadosValidos) * 100).toFixed(1)
        : "0";

      setDistribuicaoStatus([
        { name: "Fechados / Concluídos", value: chamadosFechados.length, color: "#10B981" },
        { name: "Abertos / Em Andamento", value: chamadosAbertos.length, color: "#3B82F6" },
        { name: "Pendentes / Espera", value: chamadosPendentes.length, color: "#F59E0B" }
      ]);

      const equipesSlaMap = {};
      const equipesAtendimentoMap = {};
      let totalSLAEmMinutos = 0;
      let chamadosComSLAValido = 0;

      chamadosFiltrados.forEach((c) => {
        const equipeNome = c.equipe || "NÃO INFORMADA";
        const equipeChave = equipeNome.trim().toUpperCase();
        equipesAtendimentoMap[equipeChave] = (equipesAtendimentoMap[equipeChave] || 0) + 1;

        const dataAberturaObj = parseDataComp(c.criadoEm || c.data);
        const dataFechamentoObj = parseDataComp(c.finalizadoEm);

        if (dataAberturaObj && dataFechamentoObj && dataFechamentoObj >= dataAberturaObj) {
          const diferencaMilissegundos = dataFechamentoObj - dataAberturaObj;
          const minutosGerais = Math.floor(diferencaMilissegundos / 1000 / 60);
          
          totalSLAEmMinutos += minutosGerais;
          chamadosComSLAValido++;

          const diferencaHoras = diferencaMilissegundos / (1000 * 60 * 60);
          if (!equipesSlaMap[equipeChave]) {
            equipesSlaMap[equipeChave] = { totalHoras: 0, totalChamados: 0 };
          }
          equipesSlaMap[equipeChave].totalHoras += diferencaHoras;
          equipesSlaMap[equipeChave].totalChamados += 1;
        }
      });

      const dadosEquipesFormatados = Object.keys(equipesSlaMap).map((nome) => {
        const item = equipesSlaMap[nome];
        const media = item.totalHoras / item.totalChamados;
        return {
          name: nome,
          mediaSLA: parseFloat(media.toFixed(2)),
          total: item.totalChamados,
        };
      }).sort((a, b) => b.mediaSLA - a.mediaSLA);

      setDadosSlaEquipes(dadosEquipesFormatados);

      const equipesAtendimentoArray = Object.keys(equipesAtendimentoMap).map(nome => ({
        name: nome,
        total: equipesAtendimentoMap[nome]
      })).sort((a, b) => b.total - a.total);
      
      setDadosEquipesAtendimento(equipesAtendimentoArray);

      let slaFormatado = "00h 00m";
      if (chamadosComSLAValido > 0 && totalSLAEmMinutos > 0) {
        const mediaMinutos = Math.floor(totalSLAEmMinutos / chamadosComSLAValido);
        const horas = Math.floor(mediaMinutos / 60);
        const minutos = mediaMinutos % 60;
        slaFormatado = `${horas.toString().padStart(2, "0")}h ${minutos.toString().padStart(2, "0")}m`;
      }

      const inventarioMap = {};
      const baixasPorUnidadeSetorMap = {};
      let totalBaixasContagem = 0;
      const listaBaixasTemp = [];
      let totalAtivosGeral = (ativos || []).length;

      (ativos || []).forEach(ativo => {
        const nomeEq = (ativo.nome || ativo.nomeEquipamento || "OUTROS").toUpperCase().trim();
        const qtd = Number(ativo.quantidade) || 1;
        const unidadeAtivo = (ativo.unidade || "GERAL").toUpperCase().trim();
        const setorAtivo = (ativo.setor || "GERAL").toUpperCase().trim();
        const statusAtivo = normalizar(ativo.status || "");
        const patrimonio = ativo.patrimonio || "S/P";
        const dataFormatadaStr = formatarDataTexto(ativo.criadoEm);

        if (filtroUnidade === "TODAS" || unidadeAtivo === filtroUnidade.toUpperCase()) {
          if (!inventarioMap[nomeEq]) {
            inventarioMap[nomeEq] = { nome: nomeEq, quantidade: 0, ativos: 0, manutencao: 0 };
          }
          inventarioMap[nomeEq].quantidade += qtd;

          if (
            statusAtivo.includes("BAIXADO") || 
            statusAtivo.includes("INATIVO") || 
            statusAtivo.includes("INUTILIZADO")
          ) {
            inventarioMap[nomeEq].manutencao += qtd;
            totalBaixasContagem++;

            const chaveUnidadeSetor = `${unidadeAtivo} — ${setorAtivo}`;
            if (!baixasPorUnidadeSetorMap[chaveUnidadeSetor]) {
              baixasPorUnidadeSetorMap[chaveUnidadeSetor] = { unidade: unidadeAtivo, setor: setorAtivo, totalBaixas: 0, itens: [] };
            }
            baixasPorUnidadeSetorMap[chaveUnidadeSetor].totalBaixas += 1;
            baixasPorUnidadeSetorMap[chaveUnidadeSetor].itens.push({ 
              equipamento: nomeEq, 
              patrimonio, 
              data: dataFormatadaStr 
            });

            listaBaixasTemp.push({
              equipamento: nomeEq,
              patrimonio,
              unidade: unidadeAtivo,
              setor: setorAtivo,
              data: dataFormatadaStr,
              parecerTecnico: ativo.observacoes || "Equipamento baixado/inutilizado"
            });
          } else {
            inventarioMap[nomeEq].ativos += qtd;
          }
        }
      });

      setInventarioEquipamentos(Object.values(inventarioMap).sort((a, b) => b.quantidade - a.quantidade));
      setBaixasPorUnidadeSetor(Object.values(baixasPorUnidadeSetorMap).sort((a, b) => b.totalBaixas - a.totalBaixas));
      setListaBaixas(listaBaixasTemp);

      const contagemRanking = listaBaixasTemp.reduce((acc, b) => {
        const chave = `${b.equipamento}|${b.unidade}|${b.setor}`;
        if (!acc[chave]) acc[chave] = { nome: b.equipamento, unidade: b.unidade, setor: b.setor, total: 0 };
        acc[chave].total += 1;
        return acc;
      }, {});

      const rankingFormatado = Object.values(contagemRanking)
        .map((item) => ({ nome: item.nome, unidade: item.unidade, setor: item.setor, total: item.total }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 10);

      setTop10Baixas(rankingFormatado);

      const laudosFiltrados = (laudos || []).map(l => ({
        ...l,
        criadoEmStr: formatarDataTexto(l.criadoEm),
        dataDecisaoStr: formatarDataTexto(l.dataDecisao)
      })).filter(l => {
        const u = (l.unidade || "").toUpperCase();
        return filtroUnidade === "TODAS" || u === filtroUnidade.toUpperCase();
      });

      const saidasFiltradas = (saidas || []).map(s => ({
        ...s,
        dataSaidaStr: formatarDataTexto(s.dataSaida || s.criadoEm)
      })).filter(s => {
        const uOrigem = (s.unidadeOrigem || "").toUpperCase();
        const uDestino = (s.unidadeDestino || "").toUpperCase();
        return filtroUnidade === "TODAS" || uOrigem === filtroUnidade.toUpperCase() || uDestino === filtroUnidade.toUpperCase();
      });

      setListaLaudos(laudosFiltrados);
      setListaSaidas(saidasFiltradas);

      const taxaInutilizacaoCalc = totalAtivosGeral > 0 ? ((totalBaixasContagem / totalAtivosGeral) * 100).toFixed(1) : 0;

      setStats({
        total: totalChamadosValidos,
        abertos: chamadosAbertos.length,
        pendentes: chamadosPendentes.length,
        fechados: chamadosFechados.length,
        baixas: totalBaixasContagem,
        slaMedio: slaFormatado,
        totalAtivos: totalAtivosGeral,
        totalLaudos: laudosFiltrados.length,
        totalSaidas: saidasFiltradas.length,
        taxaConclusao: `${taxaConclusaoCalc}%`,
        tempoMedioResolucao: slaFormatado,
        produtividadeGeral: totalChamadosValidos > 0 ? Math.round((chamadosFechados.length / totalChamadosValidos) * 100) : 0,
      });

      setKpisAvancados({
        eficienciaOperacional: Number(taxaConclusaoCalc),
        taxaInutilizacao: Number(taxaInutilizacaoCalc),
        volumeMovimentacoes: saidasFiltradas.length + laudosFiltrados.length
      });

      const porUnidade = chamadosFiltrados.reduce((acc, c) => {
        const u = (c.unidade || "N/A").toUpperCase();
        acc[u] = (acc[u] || 0) + 1;
        return acc;
      }, {});
      
      setDadosSetores(
        Object.keys(porUnidade)
          .map((k) => ({ name: k, total: porUnidade[k] }))
          .sort((a, b) => b.total - a.total)
      );

      const porDia = chamadosFiltrados.reduce((acc, c) => {
        const dataCrua = c.criadoEm || c.data;
        const dObj = parseDataComp(dataCrua);
        if (dObj) {
          const dStr = dObj.toISOString().split("T")[0];
          acc[dStr] = (acc[dStr] || 0) + 1;
        }
        return acc;
      }, {});

      setDadosEvolucao(
        Object.keys(porDia)
          .map((k) => ({ data: k, dataObj: new Date(k), qtd: porDia[k] }))
          .sort((a, b) => a.dataObj - b.dataObj)
          .slice(-15)
      );

    },
    [dadosBrutos, dataInicio, dataFim, filtroUnidade, normalizar]
  );

  const carregarDadosDoBanco = async () => {
    setLoading(true);
    try {
      const [resChamados, resAtivos, resLaudos, resSaidas] = await Promise.allSettled([
        api.get("/chamados"),
        api.get("/ativos"),
        api.get("/laudos"),
        api.get("/saidas-equipamentos")
      ]);

      const chamadosData = resChamados.status === "fulfilled" && Array.isArray(resChamados.value.data) ? resChamados.value.data : [];
      const ativosData = resAtivos.status === "fulfilled" && Array.isArray(resAtivos.value.data) ? resAtivos.value.data : [];
      const laudosData = resLaudos.status === "fulfilled" && Array.isArray(resLaudos.value.data) ? resLaudos.value.data : [];
      const saidasData = resSaidas.status === "fulfilled" && Array.isArray(resSaidas.value.data) ? resSaidas.value.data : [];

      const novosDadosBrutos = {
        chamados: chamadosData,
        ativos: ativosData,
        laudos: laudosData,
        saidas: saidasData,
      };

      setDadosBrutos(novosDadosBrutos);

      // Coleta unificada de unidades considerando chamados, saídas e ativos para o filtro funcionar plenamente
      const unidadesSet = new Set();
      chamadosData.forEach(c => c.unidade && unidadesSet.add(String(c.unidade).trim().toUpperCase()));
      saidasData.forEach(s => {
        if (s.unidadeOrigem) unidadesSet.add(String(s.unidadeOrigem).trim().toUpperCase());
        if (s.unidadeDestino) unidadesSet.add(String(s.unidadeDestino).trim().toUpperCase());
      });
      ativosData.forEach(a => a.unidade && unidadesSet.add(String(a.unidade).trim().toUpperCase()));

      const unidadesUnicas = ["TODAS", ...Array.from(unidadesSet)];
      setUnidadesDisponiveis(unidadesUnicas);

      processarDados(
        novosDadosBrutos.chamados,
        novosDadosBrutos.ativos,
        novosDadosBrutos.laudos,
        novosDadosBrutos.saidas
      );
    } catch (e) {
      console.error("Erro crítico ao carregar dados do banco de dados:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDadosDoBanco();
  }, []);

  return {
    navigate,
    stats,
    dadosSetores,
    dadosEvolucao,
    dadosSlaEquipes,
    dadosEquipesAtendimento,
    baixasPorUnidadeSetor,
    inventarioEquipamentos,
    listaLaudos,
    listaSaidas,
    listaBaixas,
    top10Baixas,
    unidadesDisponiveis,
    filtroUnidade,
    setFiltroUnidade,
    dataInicio,
    setDataInicio,
    dataFim,
    setDataFim,
    loading,
    dadosBrutos,
    showTop10,
    setShowTop10,
    showDetalhes,
    setShowDetalhes,
    distribuicaoStatus,
    kpisAvancados,
    processarDados,
    carregarDadosDoBanco,
  };
};