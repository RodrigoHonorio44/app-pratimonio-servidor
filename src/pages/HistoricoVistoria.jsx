import React, { useState } from "react";
import {
  History,
  Calendar,
  Building2,
  MapPin,
  Printer,
  CheckSquare,
  Square,
  AlertTriangle,
  ArrowLeft,
  Image as ImageIcon,
  CheckCircle2,
  RefreshCw,
  XCircle,
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
    gerarRelatorioImpressao,
  } = useHistoricoVistoria();

  // Estado para o zoom da imagem (lightbox)
  const [fotoExpandida, setFotoExpandida] = useState(null);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans antialiased text-slate-900">
      {/* HEADER */}
      <header className="h-24 bg-white border-b border-slate-100 flex items-center justify-between px-10 z-40">
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
            onClick={() => gerarRelatorioImpressao(selecionadas)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-200 transition-all cursor-pointer"
          >
            <Printer size={18} />
            Gerar Relatório ({selecionadas.length}) para Empresa
          </button>
        )}
      </header>

      {/* CONTEÚDO */}
      <main className="flex-1 p-10 max-w-7xl mx-auto w-full">
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
                placeholder="Ex: Hospital Conde, UPA..."
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
                placeholder="Ex: UPG, Pediatria..."
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
            <div className="flex items-center gap-3">
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
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Mostrando {vistoriasFiltradas.length} vistorias encontradas
            </p>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-400 font-bold uppercase text-xs">
              Carregando histórico...
            </div>
          ) : vistoriasFiltradas.length === 0 ? (
            <div className="p-16 text-center">
              <History size={40} className="mx-auto text-slate-300 mb-3" />
              <p className="text-slate-600 font-bold text-sm">Nenhuma vistoria encontrada com esses filtros.</p>
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
                          {v.responsavel && (
                            <span className="text-xs font-medium text-slate-400 ml-2">({v.responsavel})</span>
                          )}
                        </h3>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                      <span className="px-3 py-1 bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5">
                        <CheckSquare size={14} className="text-blue-600" />
                        {listaItens.length} item(ns) avaliado(s)
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] max-w-3xl w-full p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6 border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">
                  Detalhes da Vistoria
                </span>
                <h2 className="text-2xl font-black text-slate-900 italic mt-1">
                  {vistoriaAtiva.unidade} - {vistoriaAtiva.setor}
                </h2>
                <p className="text-xs font-bold text-slate-400 mt-1">
                  Realizado em: {new Date(vistoriaAtiva.dataHoraInicio || vistoriaAtiva.dataHora).toLocaleString("pt-BR")} 
                  {vistoriaAtiva.responsavel && ` por ${vistoriaAtiva.responsavel}`}
                </p>
              </div>
              <button
                onClick={() => setVistoriaAtiva(null)}
                className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-600 font-bold text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 mb-8">
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">
                Itens Avaliados nesta Vistoria:
              </h4>

              {((vistoriaAtiva.itensAvaliados || vistoriaAtiva.itens) || []).length === 0 ? (
                <p className="text-slate-400 text-xs italic">Nenhum item registrado nesta vistoria.</p>
              ) : (
                ((vistoriaAtiva.itensAvaliados || vistoriaAtiva.itens) || []).map((item, index) => {
                  const estadoChave = (item.estadoConservacao || item.estado || "bom").toLowerCase();
                  const infoEstado = OPCOES_ESTADO[estadoChave] || { label: estadoChave, color: "bg-slate-100 text-slate-700 border-slate-200" };
                  const fotoItem = item.foto || item.fotoUrl;

                  return (
                    <div key={index} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        {fotoItem ? (
                          <div className="relative group cursor-pointer flex-shrink-0" onClick={() => setFotoExpandida(fotoItem)}>
                            <img
                              src={fotoItem}
                              alt="Foto da avaria"
                              className="w-16 h-16 object-cover rounded-xl border border-slate-300 shadow-sm transition-transform group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-black/30 rounded-xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <Maximize2 size={16} className="text-white" />
                            </div>
                          </div>
                        ) : (
                          <div className="w-16 h-16 bg-slate-200/60 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 flex-shrink-0">
                            <ImageIcon size={20} />
                          </div>
                        )}

                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded bg-blue-100 text-blue-700">
                              #{item.patrimonio || "S/P"}
                            </span>
                            <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase border ${infoEstado.color}`}>
                              Estado: {infoEstado.label}
                            </span>
                          </div>
                          <p className="text-sm font-extrabold text-slate-800 uppercase">
                            {item.equipamento || item.descricao || item.nome || "Equipamento"}
                          </p>
                          {item.observacao && (
                            <p className="text-xs text-slate-600 italic bg-white p-2 rounded-lg border border-slate-200/80">
                              Obs: "{item.observacao}"
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => gerarRelatorioImpressao([vistoriaAtiva.id])}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-200 transition-all cursor-pointer"
              >
                <Printer size={16} />
                Imprimir Relatório desta Vistoria
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL LIGHTBOX PARA VISUALIZAR FOTO AMPLIADA */}
      {fotoExpandida && (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 backdrop-blur-xs" onClick={() => setFotoExpandida(null)}>
          <div className="relative max-w-4xl max-h-[90vh] bg-transparent">
            <button
              onClick={() => setFotoExpandida(null)}
              className="absolute -top-10 right-0 text-white font-bold text-sm bg-slate-800/80 hover:bg-slate-700 px-3 py-1 rounded-full cursor-pointer"
            >
              Fechar ✕
            </button>
            <img src={fotoExpandida} alt="Foto Expandida" className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl border border-slate-700" />
          </div>
        </div>
      )}
    </div>
  );
}