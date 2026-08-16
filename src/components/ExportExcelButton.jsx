import React, { useState } from "react";
import ExcelJS from "exceljs";
import { toPng } from "html-to-image";
import { FiDownload, FiLoader } from "react-icons/fi";

// Imports das 4 logos da pasta de assets/public
import logoImg1 from "/Imagem1.png"; 
import logoImg2 from "/Imagem2.png"; 
import logoImg3 from "/Imagem3.png"; 
import logoImg4 from "/Imagem4.png"; 

export default function ExportExcelButton({
  idGraficoContainer,
  estatisticas,
  chamados = [],
  baixas = [], // Lista de baixas / pareceres
  saidas = [], // Nova prop: Lista de saídas / transferências
  laudos = [], // Nova prop: Lista de laudos técnicos
  unidade,
}) {
  const [exportando, setExportando] = useState(false);

  // Função auxiliar para carregar as imagens em ArrayBuffer
  const carregarImagemArrayBuffer = async (urlOuImport) => {
    const response = await fetch(urlOuImport);
    const blob = await response.blob();
    return await blob.arrayBuffer();
  };

  // Função auxiliar para formatar datas e timestamps do Firestore/Date
  const formatarDataHora = (valorData) => {
    if (!valorData) return "N/A";
    try {
      let data = valorData;
      if (valorData?.toDate && typeof valorData.toDate === "function") {
        data = valorData.toDate();
      } else if (valorData?.seconds) {
        data = new Date(valorData.seconds * 1000);
      } else if (!(valorData instanceof Date)) {
        data = new Date(valorData);
      }
      if (isNaN(data.getTime())) return "N/A";
      
      return data.toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "N/A";
    }
  };

  const handleExportar = async () => {
    try {
      setExportando(true);
      const workbook = new ExcelJS.Workbook();
      workbook.creator = "Sistema de Gestão Hospitalar - BI";
      workbook.created = new Date();

      // ==========================================
      // ABA 1: RESUMO EXECUTIVO
      // ==========================================
      const wsResumo = workbook.addWorksheet("Resumo Executivo");

      for (let i = 1; i <= 5; i++) {
        wsResumo.getRow(i).height = 18;
      }

      wsResumo.mergeCells("A1:J5");
      const headerBanner = wsResumo.getCell("A1");
      headerBanner.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFFFF" },
      };

      try {
        const [buf1, buf2, buf3, buf4] = await Promise.all([
          carregarImagemArrayBuffer(logoImg1),
          carregarImagemArrayBuffer(logoImg2),
          carregarImagemArrayBuffer(logoImg3),
          carregarImagemArrayBuffer(logoImg4),
        ]);

        const img1Id = workbook.addImage({ buffer: buf1, extension: "png" });
        const img2Id = workbook.addImage({ buffer: buf2, extension: "png" });
        const img3Id = workbook.addImage({ buffer: buf3, extension: "png" });
        const img4Id = workbook.addImage({ buffer: buf4, extension: "png" });

        wsResumo.addImage(img1Id, {
          tl: { col: 0.1, row: 0.2 },
          ext: { width: 170, height: 75 },
        });

        wsResumo.addImage(img2Id, {
          tl: { col: 2.8, row: 0.6 },
          ext: { width: 135, height: 60 },
        });

        wsResumo.addImage(img3Id, {
          tl: { col: 5.7, row: 0.9 },
          ext: { width: 155, height: 45 },
        });

        wsResumo.addImage(img4Id, {
          tl: { col: 7.7, row: 0.3 },
          ext: { width: 185, height: 70 },
        });
      } catch (imgErr) {
        console.warn("Não foi possível carregar as logos no Excel:", imgErr);
      }

      // TÍTULOS
      wsResumo.mergeCells("A7:F7");
      const titleCell = wsResumo.getCell("A7");
      titleCell.value = "RELATÓRIO EXECUTIVO DE AUDITORIA E PATRIMÔNIO";
      titleCell.font = { name: "Arial", size: 13, bold: true, color: { argb: "FF1E3A8A" } };
      titleCell.alignment = { vertical: "middle", horizontal: "left" };

      wsResumo.mergeCells("A8:F8");
      const subTitleCell = wsResumo.getCell("A8");
      subTitleCell.value = `Unidade: ${unidade || "TODAS"}`;
      subTitleCell.font = { name: "Arial", size: 10, bold: true, color: { argb: "FF475569" } };
      subTitleCell.alignment = { vertical: "middle", horizontal: "left" };

      wsResumo.mergeCells("A9:F9");
      const dateCell = wsResumo.getCell("A9");
      dateCell.value = `Data de Emissão: ${new Date().toLocaleString("pt-BR")}`;
      dateCell.font = { name: "Arial", size: 9, italic: true, color: { argb: "FF64748B" } };
      dateCell.alignment = { vertical: "middle", horizontal: "left" };

      // TABELA DE KPIS
      const headerKpi = wsResumo.getRow(11);
      headerKpi.values = ["INDICADOR", "VALOR"];
      headerKpi.font = { name: "Arial", size: 10, bold: true, color: { argb: "FFFFFF" } };
      headerKpi.eachCell((cell) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF2563EB" },
        };
        cell.alignment = { vertical: "middle", horizontal: "left" };
      });

      const kpis = [
        ["Total de Chamados", estatisticas?.total || 0],
        ["Em Aberto", estatisticas?.abertos || 0],
        ["Aguardando / Pendentes", estatisticas?.pendentes || 0],
        ["Concluídos", estatisticas?.fechados || 0],
        ["Itens Inutilizados / Baixas", estatisticas?.baixas || baixas?.length || 0],
        ["Total de Saídas / Transferências", saidas?.length || 0],
        ["Total de Laudos Emitidos", laudos?.length || 0],
        ["Taxa de Conclusão", `${estatisticas?.taxaConclusao || "0.0"}%`],
      ];

      kpis.forEach((kpi, idx) => {
        const row = wsResumo.getRow(12 + idx);
        row.values = kpi;
        row.getCell(1).font = { name: "Arial", size: 10, bold: true, color: { argb: "FF334155" } };
        row.getCell(2).alignment = { horizontal: "right" };

        row.eachCell((cell) => {
          cell.border = {
            top: { style: "thin", color: { argb: "FFE2E8F0" } },
            bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
            left: { style: "thin", color: { argb: "FFE2E8F0" } },
            right: { style: "thin", color: { argb: "FFE2E8F0" } },
          };
        });
      });

      wsResumo.getColumn(1).width = 32;
      wsResumo.getColumn(2).width = 20;

      // GRÁFICO
      if (idGraficoContainer) {
        const graficoEl = document.getElementById(idGraficoContainer);
        if (graficoEl) {
          try {
            const imgDataUrl = await toPng(graficoEl, {
              cacheBust: true,
              backgroundColor: "#ffffff",
            });
            const imageId = workbook.addImage({
              base64: imgDataUrl,
              extension: "png",
            });

            wsResumo.addImage(imageId, {
              tl: { col: 3, row: 10 },
              ext: { width: 560, height: 300 },
            });
          } catch (imgErr) {
            console.warn("Não foi possível capturar o gráfico:", imgErr);
          }
        }
      }

      // ==========================================
      // ABA 2: DETALHAMENTO DOS CHAMADOS
      // ==========================================
      const wsDetalhes = workbook.addWorksheet("Detalhamento de Chamados");

      wsDetalhes.columns = [
        { header: "ID Chamado", key: "id", width: 16 },
        { header: "Unidade", key: "unidade", width: 28 },
        { header: "Setor", key: "setor", width: 22 },
        { header: "Equipamento / Ativo", key: "equipamento", width: 35 },
        { header: "Patrimônio", key: "patrimonio", width: 18 },
        { header: "Status", key: "status", width: 18 },
        { header: "Solicitante", key: "solicitante", width: 25 },
        { header: "Data Abertura", key: "dataAbertura", width: 20 },
        { header: "Data Fechamento", key: "dataFechamento", width: 20 },
      ];

      const headerRow2 = wsDetalhes.getRow(1);
      headerRow2.font = { name: "Arial", size: 11, bold: true, color: { argb: "FFFFFF" } };
      headerRow2.height = 24;
      headerRow2.eachCell((cell) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF1E40AF" },
        };
        cell.alignment = { vertical: "middle", horizontal: "center" };
      });

      (chamados || []).forEach((item) => {
        const dataAberturaRaw = item.dataAbertura || item.createdAt || item.criadoEm || item.data;
        const dataFechamentoRaw = item.dataFechamento || item.closedAt || item.concluidoEm || item.dataConclusao;

        const row = wsDetalhes.addRow({
          id: item.id || item.codigo || "N/A",
          unidade: item.unidade || "N/A",
          setor: item.setor || "N/A",
          equipamento: item.equipamento || item.descricao || "N/A",
          patrimonio: item.patrimonio || "S/P",
          status: item.status || "N/A",
          solicitante: item.solicitante || item.usuario || "N/A",
          dataAbertura: formatarDataHora(dataAberturaRaw),
          dataFechamento: formatarDataHora(dataFechamentoRaw),
        });

        row.getCell("id").alignment = { horizontal: "center" };
        row.getCell("patrimonio").alignment = { horizontal: "center" };
        row.getCell("status").alignment = { horizontal: "center" };
        row.getCell("dataAbertura").alignment = { horizontal: "center" };
        row.getCell("dataFechamento").alignment = { horizontal: "center" };

        row.eachCell((cell) => {
          cell.border = {
            bottom: { style: "thin", color: { argb: "FFF1F5F9" } },
          };
        });
      });

      // ==========================================
      // ABA 3: BAIXAS E PARECERES TÉCNICOS
      // ==========================================
      const wsBaixas = workbook.addWorksheet("Baixas e Inutilizados");

      wsBaixas.columns = [
        { header: "Equipamento", key: "equipamento", width: 35 },
        { header: "Patrimônio", key: "patrimonio", width: 18 },
        { header: "Unidade / Setor", key: "unidadeSetor", width: 38 },
        { header: "Data da Baixa", key: "dataBaixa", width: 20 },
        { header: "Parecer Técnico", key: "parecerTecnico", width: 60 },
      ];

      const headerRow3 = wsBaixas.getRow(1);
      headerRow3.font = { name: "Arial", size: 11, bold: true, color: { argb: "FFFFFF" } };
      headerRow3.height = 24;
      headerRow3.eachCell((cell) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF991B1B" }, // Vermelho Corporativo
        };
        cell.alignment = { vertical: "middle", horizontal: "center" };
      });

      (baixas || []).forEach((item) => {
        const unidadeSetorFormatado = item.unidadeSetor 
          ? item.unidadeSetor 
          : `${item.unidade || "N/A"} — ${item.setor || "N/A"}`;

        const dataBaixaRaw = item.dataBaixa || item.data || item.createdAt || item.dataConclusao;

        const row = wsBaixas.addRow({
          equipamento: item.equipamento || item.descricao || "N/A",
          patrimonio: item.patrimonio || "S/P",
          unidadeSetor: unidadeSetorFormatado,
          dataBaixa: formatarDataHora(dataBaixaRaw),
          parecerTecnico: item.parecerTecnico || item.parecer || item.observacao || "Equipamento baixado/inutilizado",
        });

        row.getCell("patrimonio").alignment = { horizontal: "center" };
        row.getCell("dataBaixa").alignment = { horizontal: "center" };

        row.eachCell((cell) => {
          cell.border = {
            bottom: { style: "thin", color: { argb: "FFF1F5F9" } },
          };
        });
      });

      // ==========================================
      // ABA 4: MOVIMENTAÇÕES E SAÍDAS (NOVA)
      // ==========================================
      const wsSaidas = workbook.addWorksheet("Movimentações e Saídas");

      wsSaidas.columns = [
        { header: "Equipamento", key: "equipamento", width: 35 },
        { header: "Patrimônio", key: "patrimonio", width: 18 },
        { header: "Origem (Unidade/Setor)", key: "origem", width: 35 },
        { header: "Destino (Unidade/Setor)", key: "destino", width: 35 },
        { header: "Motivo / Observações", key: "motivo", width: 45 },
        { header: "Data da Saída", key: "dataSaida", width: 20 },
      ];

      const headerRow4 = wsSaidas.getRow(1);
      headerRow4.font = { name: "Arial", size: 11, bold: true, color: { argb: "FFFFFF" } };
      headerRow4.height = 24;
      headerRow4.eachCell((cell) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFD97706" }, // Âmbar/Laranja Corporativo
        };
        cell.alignment = { vertical: "middle", horizontal: "center" };
      });

      (saidas || []).forEach((s) => {
        const orig = s.unidadeOrigem 
          ? `${s.unidadeOrigem}${s.setorOrigem ? ` — ${s.setorOrigem}` : ""}`
          : "N/A";

        const dest = s.unidadeDestino 
          ? `${s.unidadeDestino}${s.setorDestino ? ` — ${s.setorDestino}` : ""}`
          : "Externa / Manutenção";

        const dataSaidaRaw = s.dataSaida || s.data || s.createdAt;

        const row = wsSaidas.addRow({
          equipamento: s.nomeEquipamento || s.equipamento || "N/A",
          patrimonio: s.patrimonio || "S/P",
          origem: orig,
          destino: dest,
          motivo: s.motivo || s.observacoes || "Transferência",
          dataSaida: s.dataSaidaStr || formatarDataHora(dataSaidaRaw),
        });

        row.getCell("patrimonio").alignment = { horizontal: "center" };
        row.getCell("dataSaida").alignment = { horizontal: "center" };

        row.eachCell((cell) => {
          cell.border = {
            bottom: { style: "thin", color: { argb: "FFF1F5F9" } },
          };
        });
      });

      // ==========================================
      // ABA 5: LAUDOS TÉCNICOS (NOVA)
      // ==========================================
      const wsLaudos = workbook.addWorksheet("Laudos Técnicos");

      wsLaudos.columns = [
        { header: "ID / Ref", key: "id", width: 18 },
        { header: "Equipamento", key: "equipamento", width: 35 },
        { header: "Unidade", key: "unidade", width: 28 },
        { header: "Decisão / Status", key: "decisao", width: 22 },
        { header: "Data de Emissão", key: "dataEmissao", width: 20 },
      ];

      const headerRow5 = wsLaudos.getRow(1);
      headerRow5.font = { name: "Arial", size: 11, bold: true, color: { argb: "FFFFFF" } };
      headerRow5.height = 24;
      headerRow5.eachCell((cell) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF0D9488" }, // Teal/Verde Água Corporativo
        };
        cell.alignment = { vertical: "middle", horizontal: "center" };
      });

      (laudos || []).forEach((l, idx) => {
        const dataEmissaoRaw = l.criadoEm || l.data || l.dataCriacao;

        const row = wsLaudos.addRow({
          id: l.id || `#${idx + 1}`,
          equipamento: l.equipamento || l.nomeEquipamento || "N/A",
          unidade: l.unidade || "N/A",
          decisao: l.decisao || l.status || "Emitido",
          dataEmissao: l.criadoEmStr || formatarDataHora(dataEmissaoRaw),
        });

        row.getCell("id").alignment = { horizontal: "center" };
        row.getCell("decisao").alignment = { horizontal: "center" };
        row.getCell("dataEmissao").alignment = { horizontal: "center" };

        row.eachCell((cell) => {
          cell.border = {
            bottom: { style: "thin", color: { argb: "FFF1F5F9" } },
          };
        });
      });

      // ==========================================
      // DOWNLOAD DO ARQUIVO
      // ==========================================
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Relatorio_Executivo_${unidade || "GERAL"}_${
        new Date().toISOString().split("T")[0]
      }.xlsx`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Erro ao gerar a planilha Excel:", err);
    } finally {
      setExportando(false);
    }
  };

  return (
    <button
      onClick={handleExportar}
      disabled={exportando}
      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-semibold text-xs transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
      title="Exportar Relatório em Planilha Excel"
    >
      {exportando ? (
        <>
          <FiLoader size={16} className="animate-spin text-white" />
          <span>Gerando Excel...</span>
        </>
      ) : (
        <>
          <FiDownload size={16} />
          <span>Exportar Relatório Excel</span>
        </>
      )}
    </button>
  );
}