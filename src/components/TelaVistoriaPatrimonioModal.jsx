import React from "react";
import { FileText, Printer, Check } from "lucide-react";
import TelaVistoriaPatrimonioImpressao from "./TelaVistoriaPatrimonioImpressao";

export default function TelaVistoriaPatrimonioModal({
  modalDocumentoAberto,
  setModalDocumentoAberto,
  handleImprimir,
  loading,
  handleConfirmarESalvar,
  unidadeSelecionada,
  setorSelecionado,
  dataHoraVistoria,
  itensAvaliados,
}) {
  if (!modalDocumentoAberto) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-slate-50 border-b border-slate-200 p-4 flex flex-wrap items-center justify-between gap-3 no-print">
          <div className="flex items-center gap-2 text-blue-700 font-black text-xs uppercase tracking-wider">
            <FileText size={18} /> Conferência do Termo de Vistoria
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setModalDocumentoAberto(false)}
              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-xl border border-slate-300 text-xs transition-all cursor-pointer"
            >
              EDITAR
            </button>
            <button
              type="button"
              onClick={handleImprimir}
              className="px-4 py-2 bg-slate-900 hover:bg-black text-white font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Printer size={15} /> IMPRIMIR TERMO
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={handleConfirmarESalvar}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Check size={15} /> {loading ? "SALVANDO..." : "HOMOLOGAR / SALVAR"}
            </button>
          </div>
        </div>

        <TelaVistoriaPatrimonioImpressao
          unidadeSelecionada={unidadeSelecionada}
          setorSelecionado={setorSelecionado}
          dataHoraVistoria={dataHoraVistoria}
          itensAvaliados={itensAvaliados}
        />
      </div>
    </div>
  );
}