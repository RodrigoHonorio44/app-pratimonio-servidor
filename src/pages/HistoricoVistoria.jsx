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
  Trash2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
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
    excluirVistoria,
  } = useHistoricoVistoria();

  const [fotoExpandida, setFotoExpandida] = useState(null);
  const vistoriasParaImprimir = vistoriasFiltradas.filter((v) => selecionadas.includes(v.id));

  // CONFIRMAÇÃO DE EXCLUSÃO COM TOAST
  const handleExcluir = (e, id) => {
    e.stopPropagation();

    toast.custom((t) => (
      <div
        className={`${
          t.visible ? "animate-enter" : "animate-leave"
        } max-w-md w-full bg-white shadow-2xl rounded-2xl pointer-events-auto flex flex-col p-5 border border-slate-200`}
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2.5 bg-rose-100 text-rose-600 rounded-xl">
            <Trash2 size={20} />
          </div>
          <div>
            <h4 className="text-sm font-black text-slate-800">Excluir Vistoria</h4>
            <p className="text-xs font-semibold text-slate-500">
              Tem certeza que deseja remover este item do histórico?
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl transition-all cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              try {
                await excluirVistoria(id);
                if (vistoriaAtiva?.id === id) {
                  setVistoriaAtiva(null);
                }
                toast.success("Vistoria excluída com sucesso!", {
                  style: {
                    borderRadius: "16px",
                    background: "#0f172a",
                    color: "#fff",
                    fontWeight: "bold",
                    fontSize: "13px",
                  },
                });
              } catch (error) {
                toast.error("Erro ao excluir vistoria.");
              }
            }}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer"
          >
            Confirmar Exclusão
          </button>
        </div>
      </div>
    ), { duration: 5000 });
  };

  // IMPRIMIR APENAS A VISTORIA ATIVA DO MODAL
  const handleImprimirVistoriaAtiva = () => {
    if (!vistoriaAtiva) return;
    if (!selecionadas.includes(vistoriaAtiva.id)) {
      toggleSelecionar(vistoriaAtiva.id);
    }
    setVistoriaAtiva(null);
    setTimeout(() => {
      window.print();
    }, 150);
  };

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
            Gerar Ordens de Manutenção ({selecionadas.length})
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

                      {/* BOTÃO EXCLUIR VISTORIA */}
                      <button
                        onClick={(e) => handleExcluir(e, v.id)}
                        title="Excluir Vistoria"
                        className="p-2.5 bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-600 hover:text-white rounded-xl transition-all cursor-pointer shadow-sm"
                      >
                        <Trash2 size={16} />
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
                        <img 
                          src={fotoItem} 
                          alt="Foto" 
                          className="w-14 h-14 object-cover rounded-xl border cursor-pointer hover:opacity-90 transition-opacity" 
                          onClick={() => setFotoExpandida(fotoItem)} 
                        />
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

            <div className="flex justify-between items-center gap-3 border-t border-slate-100 pt-6">
              <button
                onClick={(e) => handleExcluir(e, vistoriaAtiva.id)}
                className="flex items-center gap-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all cursor-pointer"
              >
                <Trash2 size={16} />
                Excluir Vistoria
              </button>

              <button
                onClick={handleImprimirVistoriaAtiva}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-200 transition-all cursor-pointer"
              >
                <Printer size={16} />
                Imprimir Ordem de Manutenção
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE AMPLIAÇÃO DA FOTO */}
      {fotoExpandida && (
        <div 
          className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[60] flex items-center justify-center p-4 print:hidden"
          onClick={() => setFotoExpandida(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img 
              src={fotoExpandida} 
              alt="Foto Expandida" 
              className="max-w-full max-h-[85vh] object-contain rounded-2xl border-4 border-white shadow-2xl"
            />
            <button
              onClick={() => setFotoExpandida(null)}
              className="absolute -top-4 -right-4 bg-white text-slate-900 w-10 h-10 rounded-full font-black flex items-center justify-center shadow-lg hover:bg-slate-100 cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* SEÇÃO DE IMPRESSÃO OFICIAL */}
      <div id="secao-laudo-oficial" className="hidden print:block bg-white w-full max-w-[850px] font-sans text-slate-900 mx-auto p-2">
        <div className="w-full flex flex-col justify-between flex-1 corpo-documento-print">
          <div>
            {/* CABEÇALHO COM LOGOS */}
            <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-200 w-full cabecalho-logos">
              <img src="/Imagem1.png" alt="Logo 1" className="h-8 sm:h-9 w-auto max-w-[22%] object-contain" />
              <img src="/Imagem2.png" alt="Logo 2" className="h-8 sm:h-9 w-auto max-w-[22%] object-contain" />
              <img src="/Imagem3.png" alt="Logo 3" className="h-8 sm:h-9 w-auto max-w-[22%] object-contain" />
              <img src="/Imagem4.png" alt="Logo 4" className="h-8 sm:h-9 w-auto max-w-[22%] object-contain" />
            </div>

            {/* TÍTULO FOCADO EM MANUTENÇÃO */}
            <div className="text-center space-y-0.5 border-b-2 border-slate-800 pb-2 mb-4">
              <h2 className="text-base sm:text-lg font-black uppercase tracking-wide">
                Ordem de Serviço & Laudo de Manutenção
              </h2>
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                Documento de Encaminhamento Técnico — Emitido em: {new Date().toLocaleString("pt-BR")}
              </p>
            </div>

            {/* CARDS INDIVIDUAIS POR EQUIPAMENTO */}
            <div className="space-y-6">
              {vistoriasParaImprimir.length === 0 ? (
                <p className="text-xs font-bold text-slate-600">Nenhuma vistoria selecionada para impressão.</p>
              ) : (
                vistoriasParaImprimir.map((v, i) => {
                  const itens = v.itensAvaliados || v.itens || [];
                  const dataVistoria = v.dataHoraInicio || v.dataHora ? new Date(v.dataHoraInicio || v.dataHora).toLocaleString("pt-BR") : "Data não informada";

                  return (
                    <div key={i} className="space-y-6">
                      {itens.map((item, idx) => {
                        const estadoChave = (item.estadoConservacao || item.estado || "bom").toUpperCase();
                        const fotoItem = item.foto || item.fotoUrl;

                        return (
                          <div key={idx} className="border-2 border-slate-800 rounded-2xl p-4 bg-white page-break-inside-avoid">
                            {/* DADOS DE LOCALIZAÇÃO */}
                            <div className="flex justify-between items-center bg-slate-900 text-white px-3 py-1.5 rounded-lg mb-4 text-xs font-black uppercase">
                              <span>Unidade: {v.unidade} — Setor: {v.setor}</span>
                              <span className="text-[10px] text-slate-300">Vistoriado em: {dataVistoria}</span>
                            </div>

                            {/* FOTO GRANDE E CENTRALIZADA */}
                            <div className="flex flex-col items-center justify-center my-3">
                              {fotoItem ? (
                                <div className="border-2 border-slate-300 p-1 bg-slate-50 rounded-xl max-w-[320px] w-full flex justify-center">
                                  <img 
                                    src={fotoItem} 
                                    alt="Foto do Equipamento" 
                                    className="max-h-[220px] w-auto object-contain rounded-lg" 
                                  />
                                </div>
                              ) : (
                                <div className="w-full max-w-[320px] h-36 border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center bg-slate-50">
                                  <span className="text-xs font-bold text-slate-400 uppercase">Sem foto cadastrada</span>
                                </div>
                              )}
                            </div>

                            {/* DETALHES DO EQUIPAMENTO */}
                            <div className="grid grid-cols-3 gap-2 bg-slate-100 p-3 rounded-xl mb-4 text-xs uppercase border border-slate-200">
                              <div>
                                <span className="block text-[8px] font-black text-slate-500">Patrimônio</span>
                                <span className="font-mono font-black text-slate-900 text-sm">#{item.patrimonio || "S/P"}</span>
                              </div>
                              <div>
                                <span className="block text-[8px] font-black text-slate-500">Equipamento / Descrição</span>
                                <span className="font-extrabold text-slate-900">{item.equipamento || item.descricao || item.nome}</span>
                              </div>
                              <div>
                                <span className="block text-[8px] font-black text-slate-500">Estado Constatado</span>
                                <span className="font-black text-red-700 bg-red-100 px-2 py-0.5 rounded text-[10px] inline-block mt-0.5">
                                  {estadoChave}
                                </span>
                              </div>
                            </div>

                            {/* DIZERES E INSTRUÇÕES PARA A EQUIPE DE MANUTENÇÃO */}
                            <div className="space-y-3">
                              <div className="border border-slate-300 p-2.5 rounded-xl bg-slate-50/50">
                                <span className="block text-[9px] font-black uppercase text-blue-800 mb-1">
                                  📌 Observação do Técnico da Vistoria:
                                </span>
                                <p className="text-xs font-semibold text-slate-800 capitalize italic">
                                  {item.observacao || "Nenhuma observação informada."}
                                </p>
                              </div>

                              <div className="border border-amber-300 bg-amber-50/40 p-2.5 rounded-xl">
                                <span className="block text-[9px] font-black uppercase text-amber-900 mb-1">
                                  🛠️ Instrução para Equipe de Manutenção:
                                </span>
                                <p className="text-[10px] font-bold text-slate-700 uppercase">
                                  Realizar avaliação técnica, reparo/mantenabilidade do item listado ou emitir laudo de baixa definitiva caso seja irrecuperável.
                                </p>
                              </div>

                              {/* CAMPO EM BRANCO PARA O TÉCNICO DE MANUTENÇÃO PREENCHER */}
                              <div className="border border-slate-300 p-2.5 rounded-xl space-y-2">
                                <span className="block text-[9px] font-black uppercase text-slate-600">
                                  ✍️ Parecer do Técnico de Manutenção (Preenchimento Manual):
                                </span>
                                <div className="h-10 border-b border-dashed border-slate-300"></div>
                                <div className="flex justify-between items-center pt-1 text-[8px] font-bold text-slate-500 uppercase">
                                  <span>Data do Reparo: ____/____/________</span>
                                  <span>Status: (  ) Concluído  (  ) Aguardando Peça  (  ) Condenado</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* ASSINATURAS DE PROTOCOLO */}
          <div className="mt-6 pt-2">
            <div className="grid grid-cols-2 gap-8 sm:gap-12 text-center text-xs">
              <div className="space-y-1">
                <div className="border-t border-slate-400 w-full mx-auto pt-1"></div>
                <p className="font-bold text-slate-700 text-[10px] sm:text-[11px]">Solicitante / Patrimônio</p>
                <p className="text-[8px] sm:text-[9px] text-slate-400 uppercase">Assinatura do Emissor</p>
              </div>
              <div className="space-y-1">
                <div className="border-t border-slate-400 w-full mx-auto pt-1"></div>
                <p className="font-bold text-slate-700 text-[10px] sm:text-[11px]">Recebido Pela Manutenção Patrimonial</p>
                <p className="text-[8px] sm:text-[9px] text-slate-400 uppercase">Técnico Responsável / Data</p>
              </div>
            </div>
          </div>
        </div>

        {/* ESTILOS DE IMPRESSÃO */}
        <style>{`
          @media print {
            @page {
              size: A4 portrait;
              margin: 12mm 10mm 10mm 10mm;
            }

            body, html {
              background: #ffffff !important;
              color: #000000 !important;
            }

            button, nav, header, aside {
              display: none !important;
            }

            #secao-laudo-oficial {
              position: absolute !important;
              top: 0 !important;
              left: 0 !important;
              width: 100% !important;
              max-width: 100% !important;
              padding: 0 !important;
              margin: 0 !important;
              background: #ffffff !important;
              display: block !important;
            }

            .page-break-inside-avoid {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }

            img {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
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