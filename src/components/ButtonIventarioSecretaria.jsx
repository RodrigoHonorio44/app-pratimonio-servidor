import React, { useState } from "react";
import ExcelJS from "exceljs";
import { FiFileText, FiLoader } from "react-icons/fi";

export function ButtonInventarioSecretaria({
  inventario = [],
  unidade = "POSTO SANTA RITA",
}) {
  const [exportando, setExportando] = useState(false);

  const handleExportar = async () => {
    try {
      setExportando(true);
      const workbook = new ExcelJS.Workbook();
      workbook.creator = "sistema de gestao hospitalar";
      workbook.created = new Date();

      const listaGeral = Array.isArray(inventario) ? inventario : [];

      const unidadeFiltro = (unidade || "").toString().trim().toLowerCase();
      const itensFiltrados =
        unidadeFiltro && unidadeFiltro !== "todas" && unidadeFiltro !== "geral"
          ? listaGeral.filter(
              (item) =>
                (item.unidade || "").toString().trim().toLowerCase() ===
                unidadeFiltro
            )
          : listaGeral;

      const gruposPorUnidade = itensFiltrados.reduce((acc, item) => {
        const uNome = (item.unidade || unidade || "unidade")
          .toString()
          .trim()
          .toLowerCase();
        if (!acc[uNome]) acc[uNome] = [];
        acc[uNome].push(item);
        return acc;
      }, {});

      if (Object.keys(gruposPorUnidade).length === 0) {
        gruposPorUnidade[unidadeFiltro || unidade || "unidade"] = [];
      }

      const ITENS_POR_PAGINA = 9;

      const aplicarBorda = (cell) => {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      };

      Object.keys(gruposPorUnidade).forEach((nomeUnidade) => {
        const itensUnidade = gruposPorUnidade[nomeUnidade];
        const ws = workbook.addWorksheet(
          nomeUnidade.substring(0, 31).toLowerCase(),
          {
            views: [{ showGridLines: true }],
            pageSetup: {
              paperSize: 9, // A4
              orientation: "portrait",
              fitToPage: true,
              fitToWidth: 1,
              fitToHeight: 0,
              margins: {
                left: 0.2,
                right: 0.2,
                top: 0.3,
                bottom: 0.3,
                header: 0.1,
                footer: 0.1,
              },
            },
          }
        );

        // --- LARGURAS EXATAS FORÇADAS (COM WCH PARA O EXCELJS) ---
        const colunasConfig = [
          { index: 1, width: 4.18 },   // A (item)
          { index: 2, width: 10.73 },  // B (patrimônio / sms)
          { index: 3, width: 14.27 },  // C (descrição)
          { index: 4, width: 8.64 },   // D (data)
          { index: 5, width: 18.18 },  // E (localização origem)
          { index: 6, width: 13.45 },  // F (situação)
          { index: 7, width: 4.27 },   // G (excel)
          { index: 8, width: 4.27 },   // H (bom)
          { index: 9, width: 4.27 },   // I (reg)
          { index: 10, width: 4.27 },  // J (péssi)
        ];

        colunasConfig.forEach(col => {
          const column = ws.getColumn(col.index);
          column.width = col.width;
          column.defn = { ...column.defn, wch: col.width };
        });

        const itensOrdenados = [...itensUnidade].sort((a, b) => {
          const setorA = String(a.setor || "").toLowerCase().trim();
          const setorB = String(b.setor || "").toLowerCase().trim();
          const compSetor = setorA.localeCompare(setorB, "pt-BR", { numeric: true });
          if (compSetor !== 0) return compSetor;

          const nomeA = String(a.nome || a.equipamento || a.descricao || "").toLowerCase().trim();
          const nomeB = String(b.nome || b.equipamento || b.descricao || "").toLowerCase().trim();
          return nomeA.localeCompare(nomeB, "pt-BR", { numeric: true });
        });

        const totalPaginasSheet = Math.max(1, Math.ceil(itensOrdenados.length / ITENS_POR_PAGINA));
        const dataAtual = new Date();
        const mesAnoTexto = `${dataAtual.toLocaleString("pt-BR", { month: "short" })}/${dataAtual.getFullYear()}`.toLowerCase();

        for (let p = 0; p < totalPaginasSheet; p++) {
          const startRow = ws.rowCount === 0 ? 1 : ws.rowCount + 1;

          // --- LINHA 1: INVENTÁRIO (A até J) ---
          const r1 = startRow;
          const row1 = ws.getRow(r1);
          row1.height = 20;
          ws.getCell(`A${r1}`).value = "INVENTÁRIO";
          ws.mergeCells(`A${r1}:J${r1}`);
          ws.getCell(`A${r1}`).font = { name: "Arial", size: 11, bold: true };
          ws.getCell(`A${r1}`).alignment = { vertical: "middle", horizontal: "left" };

          // --- LINHA 2: Unidade (A até F) | Situação do bem (G até J) ---
          const r2 = startRow + 1;
          const row2 = ws.getRow(r2);
          row2.height = 18;
          
          const exibirUnidade = (unidade && unidade !== "todas" && unidade !== "geral" ? unidade : nomeUnidade).toLowerCase();
          ws.getCell(`A${r2}`).value = exibirUnidade;
          ws.mergeCells(`A${r2}:F${r2}`);
          ws.getCell(`A${r2}`).font = { name: "Arial", size: 10, bold: true };
          ws.getCell(`A${r2}`).alignment = { vertical: "middle", horizontal: "left" };

          ws.getCell(`G${r2}`).value = "situação do bem";
          ws.mergeCells(`G${r2}:J${r2}`);
          ws.getCell(`G${r2}`).font = { name: "Arial", size: 8, bold: true };
          ws.getCell(`G${r2}`).alignment = { vertical: "middle", horizontal: "center" };

          // --- LINHA 3: Data inventário (A até F) | excel, bom, reg, péssi (G, H, I, J) ---
          const r3 = startRow + 2;
          const row3 = ws.getRow(r3);
          row3.height = 18;
          ws.getCell(`A${r3}`).value = `data inventário: ${mesAnoTexto}`;
          ws.mergeCells(`A${r3}:F${r3}`);
          ws.getCell(`A${r3}`).font = { name: "Arial", size: 9 };
          ws.getCell(`A${r3}`).alignment = { vertical: "middle", horizontal: "left" };

          ws.getCell(`G${r3}`).value = "excel";
          ws.getCell(`H${r3}`).value = "bom";
          ws.getCell(`I${r3}`).value = "reg";
          ws.getCell(`J${r3}`).value = "péssi";

          ["G", "H", "I", "J"].forEach((col) => {
            const cell = ws.getCell(`${col}${r3}`);
            cell.font = { name: "Arial", size: 8, bold: true };
            cell.alignment = { horizontal: "center", vertical: "middle" };
          });

          // --- LINHA 4: Títulos das colunas ---
          const r4 = startRow + 3;
          const row4 = ws.getRow(r4);
          row4.height = 24;
          
          ws.getCell(`A${r4}`).value = "item";
          ws.getCell(`B${r4}`).value = "patrimônio / sms";
          ws.getCell(`C${r4}`).value = "descrição";
          ws.getCell(`D${r4}`).value = "data";
          ws.getCell(`E${r4}`).value = "localização origem";
          ws.getCell(`F${r4}`).value = "situação";
          
          ws.getCell(`G${r4}`).value = "";
          ws.getCell(`H${r4}`).value = "";
          ws.getCell(`I${r4}`).value = "";
          ws.getCell(`J${r4}`).value = "";

          for (let c = 1; c <= 10; c++) {
            const cell = row4.getCell(c);
            cell.font = { name: "Arial", size: 8, bold: true };
            cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
          }

          // Aplica bordas em todo o cabeçalho (linhas 1 até 4, colunas 1 até 10)
          for (let r = r1; r <= r4; r++) {
            const row = ws.getRow(r);
            for (let c = 1; c <= 10; c++) {
              aplicarBorda(row.getCell(c));
            }
          }

          // --- LINHAS DE ITENS (EXATAMENTE 9 POR PÁGINA) ---
          const inicioItens = p * ITENS_POR_PAGINA;
          const sublista = itensOrdenados.slice(inicioItens, inicioItens + ITENS_POR_PAGINA);

          for (let i = 0; i < ITENS_POR_PAGINA; i++) {
            const currentRowNum = r4 + 1 + i;
            const row = ws.getRow(currentRowNum);

            // --- ALTURA DA LINHA FIXA EM 51 PARA TODOS OS ITENS ---
            row.height = 51;

            const item = sublista[i];
            const numItem = i + 1; // Reinicia numeração de 1 a 9 por bloco/página

            if (item) {
              let dataTexto = mesAnoTexto;
              const rawData = item.dataBaixa || item.data_baixa || item.createdAt;
              if (rawData) {
                try {
                  const d = typeof rawData.toDate === "function" ? rawData.toDate() : new Date(rawData);
                  if (d && !isNaN(d.getTime())) {
                    dataTexto = `${d.toLocaleString("pt-BR", { month: "short" })}/${d.getFullYear()}`.toLowerCase();
                  }
                } catch {
                  dataTexto = mesAnoTexto;
                }
              }

              const estadoLower = String(item.estado || item.estadoConservacao || "bom").toLowerCase().trim();

              row.getCell(1).value = numItem;
              row.getCell(2).value = String(item.patrimonio || "sp").toLowerCase().trim();
              row.getCell(3).value = String(item.nome || item.equipamento || item.descricao || "").toLowerCase().trim();
              row.getCell(4).value = dataTexto;
              row.getCell(5).value = String(item.setor || "").toLowerCase().trim();
              row.getCell(6).value = "x";
              row.getCell(7).value = estadoLower === "excelente" || estadoLower === "excel" ? "x" : "";
              row.getCell(8).value = estadoLower === "bom" ? "x" : "";
              row.getCell(9).value = estadoLower === "regular" || estadoLower === "reg" ? "x" : "";
              row.getCell(10).value = estadoLower === "pessimo" || estadoLower === "pessi" || estadoLower === "ruim" ? "x" : "";
            }

            for (let c = 1; c <= 10; c++) {
              const cell = row.getCell(c);
              cell.font = { name: "Arial", size: 8 };
              cell.alignment = {
                vertical: "middle",
                horizontal: c === 3 || c === 5 ? "left" : "center",
                wrapText: true,
              };
              aplicarBorda(cell);
            }
          }

          if (p < totalPaginasSheet - 1) {
            ws.getRow(r4 + ITENS_POR_PAGINA).addPageBreak();
          }
        }
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const sufixo = unidadeFiltro.replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
      link.download = `inventario_secretaria_${sufixo || "geral"}.xlsx`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("erro ao gerar inventario no modelo impresso:", err);
    } finally {
      setExportando(false);
    }
  };

  return (
    <button
      onClick={handleExportar}
      disabled={exportando}
      className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-semibold text-xs transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
    >
      {exportando ? (
        <>
          <FiLoader size={16} className="animate-spin" />
          <span>gerando inventario...</span>
        </>
      ) : (
        <>
          <FiFileText size={16} />
          <span>Inventário Secretaria</span>
        </>
      )}
    </button>
  );
}