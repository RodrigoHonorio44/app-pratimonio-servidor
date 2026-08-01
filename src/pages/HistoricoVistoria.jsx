import React, { useState } from "react";
import {
  History,
  Calendar,
  Building2,
  MapPin,
  Printer,
  CheckSquare,
  Square,
  ArrowLeft,
  Image as ImageIcon,
  Maximize2
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useHistoricoVistoria } from "../hooks/useHistoricoVistoria";

const OPCOES_ESTADO = {
  bom: { label: "Bom", color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  ocioso: { label: "Ocioso", color: "text-amber-700 bg-amber-50 border-amber-200" },
  recuperavel: { label: "Recuperável", color: "text-blue-700 bg-blue-50 border-blue-200" },
  irrecuperavel: { label: "Irrecuperável", color: "text-rose-700 bg-rose-50 border-rose-200" },
};

export default function HistoricoVistoria() {
  const navigate = useNavigate();
  const {
    vistoriasFiltradas,
    loading,
    filtroUnidade,
    setFiltroUnidade,
    filtroSetor,
    setFiltroSetor,
    filtroDataInicio,
    setFiltroDataInicio,
    filtroDataFim,
    setFiltroDataFim,
    selecionadas,
    toggleSelecionar,
    selecionarTodas,
    vistoriaAtiva,
    setVistoriaAtiva,
  } = useHistoricoVistoria();

  const [fotoExpandida, setFotoExpandida] = useState(null);
  const vistoriasParaImprimir = vistoriasFiltradas.filter(v => selecionadas.includes(v.id));

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans antialiased text-slate-900">
      {/* HEADER DA TELA */}
      <header className="h-24 bg-white border-b border-slate-100 flex items-center justify-between px-10 z-40 print:hidden">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/dashboard")}
            className="p-3 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-2xl transition-all cursor-pointer"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-[10px] font-black text-blue-600 uppercase tracking-widest">
              Auditoria & Patrimônio
            </h2>
            <h1 className="text-xl font-black text-slate-800 tracking-tight italic">
              Histórico e Relatórios de Vistoria
            </h1>
          </div>
        </div>

        {selecionadas.length > 0 && (
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-200 transition-all cursor-pointer"
          >
            <Printer size={18} />
            Gerar Relatório Consolidado ({selecionadas.length})
          </button>
        )}
      </header>

      {/* CONTEÚDO VISÍVEL NA TELA */}
      <main className="flex-1 p-10 max-w-7xl mx-auto w-full print:hidden">
        {/* FILTROS DE BUSCA */}
        <div className="bg-white p-6 rounded-[2rem] border border-slate-200/80 shadow-sm mb-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
              Unidade
            </label>
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3">
              <Building2 size={18} className="text-blue-600" />
              <input
                type="text"
                placeholder="Ex: Hospital Conde..."
                value={filtroUnidade}
                onChange={(e) => setFiltroUnidade(e.target.value)}
                className="bg-transparent text-sm font-bold text-slate-700 focus:outline-none w-full"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
              Setor
            </label>
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3">
              <MapPin size={18} className="text-blue-600" />
              <input
                type="text"
                placeholder="Ex: Almoxarifado..."
                value={filtroSetor}
                onChange={(e) => setFiltroSetor(e.target.value)}
                className="bg-transparent text-sm font-bold text-slate-700 focus:outline-none w-full"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
              Data Início
            </label>
            <input
              type="date"
              value={filtroDataInicio}
              onChange={(e) => setFiltroDataInicio(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 focus:outline-none w-full cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
              Data Fim
            </label>
            <input
              type="date"
              value={filtroDataFim}
              onChange={(e) => setFiltroDataFim(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 focus:outline-none w-full cursor-pointer"
            />
          </div>
        </div>

        {/* LISTAGEM DE VISTORIAS */}
        <div className="bg-white rounded-[2rem] border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <button
              onClick={selecionarTodas}
              className="flex items-center gap-2 text-xs font-black text-slate-600 uppercase tracking-wider cursor-pointer"
            >
              {selecionadas.length === vistoriasFiltradas.length && vistoriasFiltradas.length > 0 ? (
                <CheckSquare size={18} className="text-blue-600" />
              ) : (
                <Square size={18} className="text-slate-400" />
              )}
              Selecionar Todas ({vistoriasFiltradas.length})
            </button>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Mostrando {vistoriasFiltradas.length} vistorias
            </p>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-400 font-bold uppercase text-xs">
              Carregando histórico...
            </div>
          ) : vistoriasFiltradas.length === 0 ? (
            <div className="p-16 text-center">
              <History size={40} className="mx-auto text-slate-300 mb-3" />
              <p className="text-slate-600 font-bold text-sm">Nenhuma vistoria encontrada.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {vistoriasFiltradas.map((v) => {
                const isSelected = selecionadas.includes(v.id);
                const dataFormatada = v.dataHoraInicio || v.dataHora 
                  ? new Date(v.dataHoraInicio || v.dataHora).toLocaleString("pt-BR") 
                  : "Data não informada";
                const listaItens = v.itensAvaliados || v.itens || [];

                return (
                  <div
                    key={v.id}
                    className={`p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all hover:bg-blue-50/30 ${
                      isSelected ? "bg-blue-50/50" : ""
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <button onClick={() => toggleSelecionar(v.id)} className="cursor-pointer">
                        {isSelected ? (
                          <CheckSquare size={22} className="text-blue-600" />
                        ) : (
                          <Square size={22} className="text-slate-300 hover:text-slate-400" />
                        )}
                      </button>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-[10px] font-black uppercase tracking-wider">
                            {v.unidade}
                          </span>
                          <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-[10px] font-black uppercase tracking-wider">
                            Setor: {v.setor}
                          </span>
                        </div>
                        <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                          <Calendar size={14} className="text-slate-400" />
                          {dataFormatada}
                        </h3>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                      <span className="px-3 py-1 bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5">
                        <CheckSquare size={14} className="text-blue-600" />
                        {listaItens.length} item(ns)
                      </span>

                      <button
                        onClick={() => setVistoriaAtiva(v)}
                        className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 hover:border-blue-600 hover:text-blue-600 rounded-xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-sm"
                      >
                        Ver Detalhes
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* MODAL DE DETALHES DA VISTORIA */}
      {vistoriaAtiva && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:hidden">
          <div className="bg-white rounded-[2.5rem] max-w-3xl w-full p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6 border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">
                  Detalhes da Vistoria
                </span>
                <h2 className="text-2xl font-black text-slate-900 italic mt-1">
                  {vistoriaAtiva.unidade} - {vistoriaAtiva.setor}
                </h2>
              </div>
              <button
                onClick={() => setVistoriaAtiva(null)}
                className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-600 font-bold text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 mb-8">
              {((vistoriaAtiva.itensAvaliados || vistoriaAtiva.itens) || []).map((item, index) => {
                const estadoChave = (item.estadoConservacao || item.estado || "bom").toLowerCase();
                const infoEstado = OPCOES_ESTADO[estadoChave] || { label: estadoChave, color: "bg-slate-100 text-slate-700 border-slate-200" };
                const fotoItem = item.foto || item.fotoUrl;

                return (
                  <div key={index} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      {fotoItem && (
                        <img src={fotoItem} alt="Foto" className="w-14 h-14 object-cover rounded-xl border cursor-pointer" onClick={() => setFotoExpandida(fotoItem)} />
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded bg-blue-100 text-blue-700">
                            #{item.patrimonio || "S/P"}
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase border ${infoEstado.color}`}>
                            {infoEstado.label}
                          </span>
                        </div>
                        <p className="text-sm font-extrabold text-slate-800 uppercase mt-1">
                          {item.equipamento || item.descricao || item.nome}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setVistoriaAtiva(null);
                  setTimeout(() => window.print(), 100);
                }}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-200 transition-all cursor-pointer"
              >
                <Printer size={16} />
                Imprimir Termo Desta Vistoria
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SEÇÃO DE IMPRESSÃO OFICIAL (Mesmo layout exato do ImpressaoLaudoTecnico) */}
      {/* ========================================================================= */}
      <div id="secao-laudo-oficial" className="hidden print:block bg-white w-full max-w-[850px] font-sans text-slate-900 mx-auto p-2">
        <div className="w-full flex flex-col justify-between flex-1 corpo-documento-print">
          <div>
            {/* CABEÇALHO COM OS 4 LOGOS OFICIAIS */}
            <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-200 w-full cabecalho-logos">
              <img src="/Imagem1.png" alt="Logo 1" className="h-8 sm:h-9 w-auto max-w-[22%] object-contain" />
              <img src="/Imagem2.png" alt="Logo 2" className="h-8 sm:h-9 w-auto max-w-[22%] object-contain" />
              <img src="/Imagem3.png" alt="Logo 3" className="h-8 sm:h-9 w-auto max-w-[22%] object-contain" />
              <img src="/Imagem4.png" alt="Logo 4" className="h-8 sm:h-9 w-auto max-w-[22%] object-contain" />
            </div>

            <div className="text-center space-y-0.5 border-b-2 border-slate-800 pb-2 mb-3">
              <h2 className="text-sm sm:text-base font-black uppercase tracking-wide">Relatório Oficial de Vistorias Patrimoniais</h2>
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Documento formal para auditoria e prestação de contas — Emitido em: {new Date().toLocaleString("pt-BR")}</p>
            </div>

            {/* LISTAGEM DOS ITENS DAS VISTORIAS SELECIONADAS */}
            <div className="space-y-4">
              {vistoriasParaImprimir.length === 0 ? (
                <p className="text-xs font-bold text-slate-600">Nenhuma vistoria selecionada para impressão.</p>
              ) : (
                vistoriasParaImprimir.map((v, i) => {
                  const itens = v.itensAvaliados || v.itens || [];
                  const dataVistoria = v.dataHoraInicio || v.dataHora ? new Date(v.dataHoraInicio || v.dataHora).toLocaleString("pt-BR") : "Data não informada";

                  return (
                    <div key={i} className="mb-4 border border-slate-200 p-2 rounded-xl bg-slate-50/50">
                      <div className="flex justify-between items-center mb-2 pb-1 border-b border-slate-200">
                        <span className="text-[11px] font-black uppercase text-blue-700">{v.unidade} — Setor: {v.setor}</span>
                        <span className="text-[10px] text-slate-500 font-bold">Realizado em: {dataVistoria}</span>
                      </div>

                      <table className="w-full text-[9px] border-collapse text-left">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-700 font-black uppercase text-[8px]">
                            <th className="p-1 w-[15%]">Patrimônio</th>
                            <th className="p-1 w-[40%]">Equipamento / Descrição</th>
                            <th className="p-1 w-[15%]">Estado</th>
                            <th className="p-1 w-[30%]">Observação</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700 uppercase">
                          {itens.map((item, idx) => {
                            const estadoChave = (item.estadoConservacao || item.estado || "bom").toUpperCase();
                            return (
                              <tr key={idx}>
                                <td className="p-1 font-mono font-bold">#{item.patrimonio || "S/P"}</td>
                                <td className="p-1 font-bold">{item.equipamento || item.descricao || item.nome}</td>
                                <td className="p-1 font-extrabold">{estadoChave}</td>
                                <td className="p-1 italic text-slate-600">{item.observacao || "-"}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* ASSINATURAS */}
          <div className="mt-6 pt-2">
            <div className="grid grid-cols-2 gap-8 sm:gap-12 text-center text-xs">
              <div className="space-y-1">
                <div className="border-t border-slate-400 w-full mx-auto pt-1"></div>
                <p className="font-bold text-slate-700 text-[10px] sm:text-[11px]">Responsável Pela Vistoria</p>
                <p className="text-[8px] sm:text-[9px] text-slate-400 uppercase">Técnico em TI / Patrimônio</p>
              </div>
              <div className="space-y-1">
                <div className="border-t border-slate-400 w-full mx-auto pt-1"></div>
                <p className="font-bold text-slate-700 text-[10px] sm:text-[11px]">Aceite do Setor / Chefia</p>
                <p className="text-[8px] sm:text-[9px] text-slate-400 uppercase">Assinatura / Carimbo</p>
              </div>
            </div>
          </div>
        </div>

        {/* ESTILOS DE IMPRESSÃO IGUAIS AO LAUDO */}
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
              box-shadow: none !important;
              border: none !important;
              padding: 0 !important;
              margin: 0 !important;
              background: #ffffff !important;
              display: flex !important;
              flex-direction: column !important;
              justify-content: space-between !important;
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
    </div>
  );
}