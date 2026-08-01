import React from "react";

export default function TelaVistoriaPatrimonioImpressao({
  unidadeSelecionada,
  setorSelecionado,
  dataHoraVistoria,
  itensAvaliados,
}) {
  return (
    <div id="secao-vistoria-oficial" className="bg-white w-full max-w-[850px] font-sans text-slate-900 mx-auto p-4">
      <div className="w-full flex flex-col justify-between corpo-documento-print">
        <div>
          {/* CABEÇALHO COM LOGOS */}
          <div className="flex items-center justify-between gap-4 mb-3 pb-3 border-b border-slate-200 w-full cabecalho-logos">
            <img src="/Imagem1.png" alt="Logo 1" className="h-10 w-auto object-contain" />
            <img src="/Imagem2.png" alt="Logo 2" className="h-10 w-auto object-contain" />
            <img src="/Imagem3.png" alt="Logo 3" className="h-10 w-auto object-contain" />
            <img src="/Imagem4.png" alt="Logo 4" className="h-10 w-auto object-contain" />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-slate-800 pb-3 mb-4 text-center md:text-left">
            <div>
              <h2 className="font-black text-slate-900 text-sm sm:text-base uppercase tracking-tight">Termo Oficial de Vistoria Patrimonial</h2>
              <p className="text-[10px] text-slate-500 font-semibold uppercase">
                Unidade: {unidadeSelecionada || "N/I"} • Setor: {setorSelecionado || "N/I"}
              </p>
            </div>
            <div className="text-right">
              <span className="text-[9px] font-mono font-bold text-slate-400 block">DATA / HORA</span>
              <span className="text-xs font-bold text-slate-700">{dataHoraVistoria || new Date().toLocaleString("pt-BR")}</span>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider">Relação dos Itens Vistoriados</h3>
            {/* table-fixed adicionado para respeitar rigorosamente as larguras das colunas */}
            <table className="w-full text-left border-collapse border border-slate-200 table-fixed">
              <thead>
                <tr className="bg-slate-100 text-[11px] font-black uppercase text-slate-700 border-b border-slate-200">
                  <th className="p-2.5 border-r border-slate-200 w-[18%]">Patrimônio</th>
                  <th className="p-2.5 border-r border-slate-200 w-[30%]">Equipamento / Descrição</th>
                  <th className="p-2.5 border-r border-slate-200 w-[14%]">Estado</th>
                  <th className="p-2.5 w-[38%]">Observação</th>
                </tr>
              </thead>
              <tbody>
                {!itensAvaliados || itensAvaliados.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="p-3 text-center text-xs text-slate-500 italic uppercase">
                      Nenhum item avaliado nesta vistoria.
                    </td>
                  </tr>
                ) : (
                  itensAvaliados.map((item, idx) => (
                    <tr key={idx} className="border-b border-slate-200 text-xs font-medium">
                      <td className="p-2.5 border-r border-slate-200 font-mono font-bold uppercase truncate">#{item.patrimonio || "S/P"}</td>
                      <td className="p-2.5 border-r border-slate-200 uppercase truncate">{item.equipamento || item.nome}</td>
                      <td className="p-2.5 border-r border-slate-200 font-bold uppercase truncate">{item.estado}</td>
                      {/* break-all e whitespace-pre-wrap garantem que qualquer texto longo quebre a linha e desça perfeitamente */}
                      <td className="p-2.5 italic text-slate-600 break-all whitespace-pre-wrap overflow-hidden">{item.observacao || "-"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ASSINATURAS */}
        <div className="mt-12 pt-4">
          <div className="grid grid-cols-2 gap-12 text-center text-xs font-bold text-slate-700">
            <div className="border-t border-slate-400 pt-2">
              <p className="uppercase text-[11px]">Responsável Pela Vistoria</p>
              <p className="text-[10px] text-slate-400 font-normal">Técnico em TI / Patrimônio</p>
            </div>
            <div className="border-t border-slate-400 pt-2">
              <p className="uppercase text-[11px]">Aceite do Setor / Chefia</p>
              <p className="text-[10px] text-slate-400 font-normal">Assinatura / Carimbo</p>
            </div>
          </div>
        </div>
      </div>

      {/* ESTILOS DE IMPRESSÃO */}
      <style>{`
        @media print {
          /* Oculta tudo na página por padrão */
          body * {
            visibility: hidden;
          }

          /* Mostra apenas a seção de vistoria oficial e seus filhos */
          #secao-vistoria-oficial, 
          #secao-vistoria-oficial * {
            visibility: visible;
          }

          /* Posiciona o bloco perfeitamente no topo da folha A4 limpa */
          #secao-vistoria-oficial {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 10mm;
            background: #ffffff !important;
            box-shadow: none !important;
            border: none !important;
          }

          @page {
            size: A4 portrait;
            margin: 0mm;
          }
        }
      `}</style>
    </div>
  );
}