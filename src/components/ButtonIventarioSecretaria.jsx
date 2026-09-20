import React, { useState } from "react";
import ExcelJS from "exceljs";
import { FiFileText, FiLoader } from "react-icons/fi";

export function ButtonInventarioSecretaria({
  inventario = [],
  unidade = "POSTO SANTA RITA",
}) {
  const [exportando, setExportando] = useState(false);

  const ITENS_POR_PAGINA = 9;
  const ALTURA_LINHA_ITEM = 51;

  const aplicarBorda = (cell) => {
    cell.border = {
      top: {
        style: "thin",
        color: { argb: "FF000000" },
      },
      left: {
        style: "thin",
        color: { argb: "FF000000" },
      },
      bottom: {
        style: "thin",
        color: { argb: "FF000000" },
      },
      right: {
        style: "thin",
        color: { argb: "FF000000" },
      },
    };
  };

  const formatarTexto = (valor, fallback = "") => {
    return String(valor ?? fallback)
      .trim()
      .toLowerCase();
  };

  const obterDataInventario = (item, dataPadrao) => {
    const rawData =
      item?.dataBaixa ||
      item?.data_baixa ||
      item?.createdAt ||
      item?.data ||
      null;

    if (!rawData) {
      return dataPadrao;
    }

    try {
      const dataConvertida =
        typeof rawData?.toDate === "function"
          ? rawData.toDate()
          : new Date(rawData);

      if (
        dataConvertida instanceof Date &&
        !Number.isNaN(dataConvertida.getTime())
      ) {
        return `${dataConvertida.toLocaleString("pt-BR", {
          month: "short",
        })}/${dataConvertida.getFullYear()}`.toLowerCase();
      }
    } catch (error) {
      console.warn("Não foi possível converter a data:", error);
    }

    return dataPadrao;
  };

  const obterEstado = (item) => {
    return formatarTexto(
      item?.estado ||
        item?.estadoConservacao ||
        item?.conservacao ||
        "bom"
    );
  };

  const handleExportar = async () => {
    try {
      setExportando(true);

      const workbook = new ExcelJS.Workbook();

      workbook.creator = "Sistema de Gestão Hospitalar";
      workbook.lastModifiedBy = "Sistema de Gestão Hospitalar";
      workbook.created = new Date();
      workbook.modified = new Date();

      const listaGeral = Array.isArray(inventario)
        ? inventario
        : [];

      const unidadeFiltro = formatarTexto(unidade);

      const filtrarTodasAsUnidades =
        !unidadeFiltro ||
        unidadeFiltro === "todas" ||
        unidadeFiltro === "geral";

      const itensFiltrados = filtrarTodasAsUnidades
        ? listaGeral
        : listaGeral.filter((item) => {
            const unidadeItem = formatarTexto(item?.unidade);
            return unidadeItem === unidadeFiltro;
          });

      const gruposPorUnidade = itensFiltrados.reduce(
        (acc, item) => {
          const nomeUnidade = formatarTexto(
            item?.unidade || unidade || "unidade"
          );

          if (!acc[nomeUnidade]) {
            acc[nomeUnidade] = [];
          }

          acc[nomeUnidade].push(item);

          return acc;
        },
        {}
      );

      if (Object.keys(gruposPorUnidade).length === 0) {
        const nomeUnidadeVazia =
          unidadeFiltro || "unidade";

        gruposPorUnidade[nomeUnidadeVazia] = [];
      }

      const dataAtual = new Date();

      const mesAnoTexto = `${dataAtual.toLocaleString(
        "pt-BR",
        {
          month: "short",
        }
      )}/${dataAtual.getFullYear()}`.toLowerCase();

      Object.entries(gruposPorUnidade).forEach(
        ([nomeUnidade, itensUnidade]) => {
          const nomeAbaBase =
            nomeUnidade
              .substring(0, 31)
              .replace(/[\\/?*[\]:]/g, "")
              .trim() || "inventario";

          let nomeAba = nomeAbaBase;
          let contadorAba = 1;

          while (
            workbook.worksheets.some(
              (worksheet) =>
                worksheet.name.toLowerCase() ===
                nomeAba.toLowerCase()
            )
          ) {
            const sufixo = `_${contadorAba}`;
            nomeAba = `${nomeAbaBase.substring(
              0,
              31 - sufixo.length
            )}${sufixo}`;
            contadorAba++;
          }

          const ws = workbook.addWorksheet(nomeAba);

          /*
           * Configuração da visualização da planilha
           */
          ws.views = [
            {
              showGridLines: false,
              showRowColHeaders: true,
              zoomScale: 100,
            },
          ];

          /*
           * Configuração da página
           */
          ws.properties.pageSetUpPr = {
            fitToPage: true,
            autoPageBreaks: false,
          };

          ws.pageSetup = {
            paperSize: 9, // A4
            orientation: "portrait",

            fitToPage: true,
            fitToWidth: 1,
            fitToHeight: 0,

            pageOrder: "downThenOver",

            horizontalCentered: true,
            verticalCentered: false,

            margins: {
              left: 0.35,
              right: 0.35,
              top: 0.25,
              bottom: 0.25,
              header: 0.05,
              footer: 0.05,
            },
          };

          /*
           * Larguras das colunas.
           * Essas larguras são interpretadas pelo ExcelJS
           * como largura de coluna em caracteres/WCH.
           */
          const colunasConfig = [
            { index: 1, width: 4.18 }, // A - item
            { index: 2, width: 10.73 }, // B - patrimônio / sms
            { index: 3, width: 14.27 }, // C - descrição
            { index: 4, width: 8.64 }, // D - data
            { index: 5, width: 18.18 }, // E - localização origem
            { index: 6, width: 13.45 }, // F - situação
            { index: 7, width: 4.27 }, // G - excel
            { index: 8, width: 4.27 }, // H - bom
            { index: 9, width: 4.27 }, // I - reg
            { index: 10, width: 4.27 }, // J - péssi
          ];

          colunasConfig.forEach(({ index, width }) => {
            ws.getColumn(index).width = width;
          });

          /*
           * Ordenação dos itens
           */
          const itensOrdenados = [...itensUnidade].sort(
            (a, b) => {
              const setorA = formatarTexto(a?.setor);
              const setorB = formatarTexto(b?.setor);

              const comparacaoSetor = setorA.localeCompare(
                setorB,
                "pt-BR",
                {
                  numeric: true,
                  sensitivity: "base",
                }
              );

              if (comparacaoSetor !== 0) {
                return comparacaoSetor;
              }

              const nomeA = formatarTexto(
                a?.nome ||
                  a?.equipamento ||
                  a?.descricao
              );

              const nomeB = formatarTexto(
                b?.nome ||
                  b?.equipamento ||
                  b?.descricao
              );

              return nomeA.localeCompare(
                nomeB,
                "pt-BR",
                {
                  numeric: true,
                  sensitivity: "base",
                }
              );
            }
          );

          const totalPaginas = Math.max(
            1,
            Math.ceil(
              itensOrdenados.length / ITENS_POR_PAGINA
            )
          );

          let proximaLinha = 1;

          for (
            let pagina = 0;
            pagina < totalPaginas;
            pagina++
          ) {
            const startRow = proximaLinha;

            /*
             * LINHA 1 - TÍTULO
             */
            const r1 = startRow;
            const row1 = ws.getRow(r1);

            row1.height = 20;

            ws.mergeCells(`A${r1}:J${r1}`);

            const tituloCell = ws.getCell(`A${r1}`);
            tituloCell.value = "INVENTÁRIO";
            tituloCell.font = {
              name: "Arial",
              size: 11,
              bold: true,
            };
            tituloCell.alignment = {
              vertical: "middle",
              horizontal: "left",
            };

            /*
             * LINHA 2 - UNIDADE E SITUAÇÃO DO BEM
             */
            const r2 = startRow + 1;
            const row2 = ws.getRow(r2);

            row2.height = 18;

            const exibirUnidade =
              !filtrarTodasAsUnidades
                ? unidade
                : nomeUnidade;

            ws.mergeCells(`A${r2}:F${r2}`);

            const unidadeCell = ws.getCell(`A${r2}`);
            unidadeCell.value = formatarTexto(
              exibirUnidade
            );
            unidadeCell.font = {
              name: "Arial",
              size: 10,
              bold: true,
            };
            unidadeCell.alignment = {
              vertical: "middle",
              horizontal: "left",
            };

            ws.mergeCells(`G${r2}:J${r2}`);

            const situacaoTituloCell =
              ws.getCell(`G${r2}`);

            situacaoTituloCell.value = "situação do bem";
            situacaoTituloCell.font = {
              name: "Arial",
              size: 8,
              bold: true,
            };
            situacaoTituloCell.alignment = {
              vertical: "middle",
              horizontal: "center",
            };

            /*
             * LINHA 3 - DATA E CLASSIFICAÇÕES
             */
            const r3 = startRow + 2;
            const row3 = ws.getRow(r3);

            row3.height = 18;

            ws.mergeCells(`A${r3}:F${r3}`);

            const dataCell = ws.getCell(`A${r3}`);
            dataCell.value = `data inventário: ${mesAnoTexto}`;
            dataCell.font = {
              name: "Arial",
              size: 9,
            };
            dataCell.alignment = {
              vertical: "middle",
              horizontal: "left",
            };

            const classificacoes = {
              G: "excel",
              H: "bom",
              I: "reg",
              J: "péssi",
            };

            Object.entries(classificacoes).forEach(
              ([coluna, valor]) => {
                const cell = ws.getCell(
                  `${coluna}${r3}`
                );

                cell.value = valor;
                cell.font = {
                  name: "Arial",
                  size: 8,
                  bold: true,
                };
                cell.alignment = {
                  horizontal: "center",
                  vertical: "middle",
                };
              }
            );

            /*
             * LINHA 4 - CABEÇALHOS
             */
            const r4 = startRow + 3;
            const row4 = ws.getRow(r4);

            row4.height = 24;

            const cabecalhos = [
              "item",
              "patrimônio / sms",
              "descrição",
              "data",
              "localização origem",
              "situação",
              "",
              "",
              "",
              "",
            ];

            cabecalhos.forEach((valor, index) => {
              const cell = row4.getCell(index + 1);

              cell.value = valor;
              cell.font = {
                name: "Arial",
                size: 8,
                bold: true,
              };
              cell.alignment = {
                vertical: "middle",
                horizontal: "center",
                wrapText: true,
              };
            });

            /*
             * Bordas do cabeçalho
             */
            for (let linha = r1; linha <= r4; linha++) {
              const row = ws.getRow(linha);

              for (let coluna = 1; coluna <= 10; coluna++) {
                aplicarBorda(row.getCell(coluna));
              }
            }

            /*
             * Itens da página
             */
            const inicioItens =
              pagina * ITENS_POR_PAGINA;

            const sublista = itensOrdenados.slice(
              inicioItens,
              inicioItens + ITENS_POR_PAGINA
            );

            for (
              let i = 0;
              i < ITENS_POR_PAGINA;
              i++
            ) {
              const linhaAtual = r4 + 1 + i;
              const row = ws.getRow(linhaAtual);

              /*
               * Altura solicitada:
               * 51 pontos por linha
               */
              row.height = ALTURA_LINHA_ITEM;

              const item = sublista[i];

              if (item) {
                const dataTexto = obterDataInventario(
                  item,
                  mesAnoTexto
                );

                const estado = obterEstado(item);

                const patrimonio = formatarTexto(
                  item?.patrimonio,
                  "sp"
                );

                const descricao = formatarTexto(
                  item?.nome ||
                    item?.equipamento ||
                    item?.descricao,
                  ""
                );

                const setor = formatarTexto(
                  item?.setor,
                  ""
                );

                row.getCell(1).value = i + 1;
                row.getCell(2).value = patrimonio;
                row.getCell(3).value = descricao;
                row.getCell(4).value = dataTexto;
                row.getCell(5).value = setor;
                row.getCell(6).value = "x";

                row.getCell(7).value =
                  estado === "excelente" ||
                  estado === "excel"
                    ? "x"
                    : "";

                row.getCell(8).value =
                  estado === "bom" ? "x" : "";

                row.getCell(9).value =
                  estado === "regular" ||
                  estado === "reg"
                    ? "x"
                    : "";

                row.getCell(10).value =
                  estado === "pessimo" ||
                  estado === "péssimo" ||
                  estado === "pessi" ||
                  estado === "ruim"
                    ? "x"
                    : "";
              }

              /*
               * Formatação de cada linha
               */
              for (
                let coluna = 1;
                coluna <= 10;
                coluna++
              ) {
                const cell = row.getCell(coluna);

                cell.font = {
                  name: "Arial",
                  size: 8,
                };

                cell.alignment = {
                  vertical: "middle",
                  horizontal:
                    coluna === 3 || coluna === 5
                      ? "left"
                      : "center",
                  wrapText: true,
                };

                aplicarBorda(cell);
              }
            }

            /*
             * Quebra de página entre os blocos
             */
            if (pagina < totalPaginas - 1) {
              const ultimaLinhaBloco =
                r4 + ITENS_POR_PAGINA;

              ws.getRow(ultimaLinhaBloco)
                .addPageBreak();
            }

            /*
             * Espaço de duas linhas antes do próximo bloco
             */
            proximaLinha =
              r4 + ITENS_POR_PAGINA + 2;
          }

          /*
           * Área de impressão.
           *
           * Não usamos printTitlesRow porque cada bloco
           * já contém seu próprio cabeçalho.
           */
          const ultimaLinha = ws.lastRow
            ? ws.lastRow.number
            : 1;

          ws.pageSetup.printArea = `A1:J${ultimaLinha}`;

          /*
           * Reforça a configuração depois que todo
           * o conteúdo foi criado.
           */
          ws.pageSetup.fitToPage = true;
          ws.pageSetup.fitToWidth = 1;
          ws.pageSetup.fitToHeight = 0;
          ws.pageSetup.orientation = "portrait";
          ws.pageSetup.paperSize = 9;
          ws.pageSetup.horizontalCentered = true;
          ws.pageSetup.verticalCentered = false;
        }
      );

      /*
       * Gera o arquivo Excel
       */
      const buffer = await workbook.xlsx.writeBuffer();

      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      const sufixo = unidadeFiltro
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, "_")
        .replace(/[^a-zA-Z0-9_]/g, "");

      link.href = url;
      link.download = `inventario_secretaria_${
        sufixo || "geral"
      }.xlsx`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(
        "Erro ao gerar inventário:",
        error
      );
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
          <FiLoader
            size={16}
            className="animate-spin"
          />

          <span>gerando inventário...</span>
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