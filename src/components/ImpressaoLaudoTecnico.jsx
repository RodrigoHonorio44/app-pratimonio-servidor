import React from "react";
import { AlertOctagon } from "lucide-react";

const ImpressaoLaudoTecnico = ({ equipamento, diagnosticoTecnico, justificativaSubstituicao, historicoManutencoes }) => {

  if (!equipamento) return null;

  return (
    <div id="secao-laudo-oficial" className="bg-white w-full max-w-[850px] font-sans text-slate-900 mx-auto p-2">
      <div className="w-full flex flex-col justify-between flex-1 corpo-documento-print">
        <div>
          {/* CABEÇALHO COM LOGOS */}
          <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-200 w-full cabecalho-logos">
            <img src="/Imagem1.png" alt="Logo 1" className="h-8 sm:h-9 w-auto max-w-[22%] object-contain" />
            <img src="/Imagem2.png" alt="Logo 2" className="h-8 sm:h-9 w-auto max-w-[22%] object-contain" />
            <img src="/Imagem3.png" alt="Logo 3" className="h-8 sm:h-9 w-auto max-w-[22%] object-contain" />
            <img src="/Imagem4.png" alt="Logo 4" className="h-8 sm:h-9 w-auto max-w-[22%] object-contain" />
          </div>

          <div className="text-center space-y-0.5 border-b-2 border-slate-800 pb-2 mb-3">
            <h2 className="text-sm sm:text-base font-black uppercase tracking-wide">Laudo Técnico de Inviabilidade e Substituição de Bem</h2>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Setor de Patrimônio</p>
          </div>

          {/* DADOS DO ATIVO */}
          <div className="grid grid-cols-2 gap-y-1 text-[11px] mb-2.5 border border-slate-200 p-2 rounded-xl bg-slate-50/50">
            <div className="capitalize"><strong>Equipamento / Ativo:</strong> {equipamento.nome}</div>
            <div><strong>Nº de Patrimônio (TAG):</strong> <span className="font-mono font-bold uppercase">#{equipamento.patrimonio || "S/P"}</span></div>
            <div className="capitalize"><strong>Unidade de Origem:</strong> {equipamento.unidade}</div>
            <div className="capitalize"><strong>Setor de Alocação:</strong> {equipamento.setor}</div>
            <div><strong>Data do Diagnóstico:</strong> {new Date().toLocaleDateString("pt-BR")}</div>
            <div className="text-red-600 font-bold flex items-center gap-1 uppercase text-[10px]">
              <AlertOctagon size={12} /> Classificação: Inserviceável / Condenado
            </div>
          </div>

          {/* CORPO DO LAUDO */}
          <div className="space-y-2 text-xs leading-normal text-justify">
            <div>
              <h4 className="font-bold text-[10px] uppercase text-slate-500 tracking-wider mb-0.5">1. Diagnóstico e Parecer do Exame Técnico</h4>
              <p className="bg-slate-50/50 p-2 rounded-lg border border-slate-100 italic whitespace-pre-wrap text-slate-800 uppercase text-[10px] sm:text-[11px]">
                {diagnosticoTecnico}
              </p>
            </div>

            <div>
              <h4 className="font-bold text-[10px] uppercase text-slate-500 tracking-wider mb-0.5">2. Justificativa para Nexo de Substituição</h4>
              <p className="bg-slate-50/50 p-2 rounded-lg border border-slate-100 italic whitespace-pre-wrap text-slate-800 uppercase text-[10px] sm:text-[11px]">
                {justificativaSubstituicao}
              </p>
            </div>

            <div>
              <h4 className="font-bold text-[10px] uppercase text-slate-500 tracking-wider mb-0.5 flex items-center gap-1">
                3. Histórico de Ocorrências e Reincidências Vinculadas (Folha Corrida do Ativo)
              </h4>
              {!historicoManutencoes || historicoManutencoes.length === 0 ? (
                <p className="text-[10px] text-slate-500 italic p-1.5 border border-slate-100 rounded-lg bg-slate-50/30 uppercase">
                  Sem registros anteriores de intervenções críticas nesta TAG até a presente data.
                </p>
              ) : (
                <div className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm max-h-[110px] overflow-y-auto">
                  <table className="w-full text-[9px] border-collapse text-left">
                    <thead className="sticky top-0 bg-slate-100">
                      <tr className="border-b border-slate-200 text-slate-700 font-black uppercase text-[8px] sm:text-[9px]">
                        <th className="p-1 w-[15%]">Cód OS</th>
                        <th className="p-1 w-[15%]">Abertura</th>
                        <th className="p-1 w-[35%]">Defeito Constatado</th>
                        <th className="p-1 w-[35%]">Ação/Solução Aplicada</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700 uppercase">
                      {historicoManutencoes.map((os) => (
                        <tr key={os.id} className="hover:bg-slate-50/50">
                          <td className="p-1 font-mono font-bold text-slate-500">#{os.numeroOs || os.id.substring(0, 6)}</td>
                          <td className="p-1 text-slate-500">{os.dataAbertura || "n/i"}</td>
                          <td className="p-1 font-medium">{os.descricaoDefeito || os.descricaoProblema}</td>
                          <td className="p-1 text-slate-600 bg-slate-50/30">{os.solucaoTecnica || "intervenção técnica s/ r."}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <p className="pt-0.5 text-[10px] sm:text-[11px] text-slate-700">
              Conclui-se que o referido patrimônio apresenta desgaste oneroso ou obsolescência técnica que inviabiliza economicamente qualquer intervenção de manutenção corretiva conforme histórico analítico anexo. Fica recomendada pelo <strong className="font-bold">Setor de Patrimônio</strong> a baixa do registro patrimonial vigente da unidade.
            </p>
          </div>
        </div>

        {/* ASSINATURAS */}
        <div className="mt-4 pt-2">
          <div className="grid grid-cols-2 gap-8 sm:gap-12 text-center text-xs">
            <div className="space-y-1">
              <div className="border-t border-slate-400 w-full mx-auto pt-1"></div>
              <p className="font-bold text-slate-700 text-[10px] sm:text-[11px]">Técnico Responsável pela Avaliação</p>
              <p className="text-[8px] sm:text-[9px] text-slate-400 uppercase">Visto Técnico</p>
            </div>
            <div className="space-y-1">
              <div className="border-t border-slate-400 w-full mx-auto pt-1"></div>
              <p className="font-bold text-slate-700 text-[10px] sm:text-[11px]">Direção / Supervisão Hospitalar</p>
              <p className="text-[8px] sm:text-[9px] text-slate-400 uppercase">Assinatura e Carimbo</p>
            </div>
          </div>
        </div>
      </div>

      {/* ESTILOS DE IMPRESSÃO */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 15mm 10mm 10mm 10mm;
          }

          body, html {
            background: #ffffff !important;
            color: #000000 !important;
            height: 100% !important;
            overflow: hidden !important;
          }

          .print-container {
            position: fixed !important;
            inset: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            background: #ffffff !important;
            backdrop-filter: none !important;
            padding: 0 !important;
            margin: 0 !important;
            z-index: 9999999 !important;
            display: block !important;
            overflow: hidden !important;
          }

          .barra-botoes-preview,
          button,
          nav,
          header,
          aside {
            display: none !important;
          }

          #secao-laudo-oficial {
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            height: 100% !important;
            max-height: 100vh !important;
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
            margin: 0 !important;
            background: #ffffff !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            page-break-inside: avoid !important;
          }

          .cabecalho-logos {
            margin-top: 8px !important;
            padding-top: 4px !important;
          }

          .corpo-documento-print,
          .corpo-documento-print * {
            visibility: visible !important;
          }
        }
      `}</style>
    </div>
  );
};

export default ImpressaoLaudoTecnico;