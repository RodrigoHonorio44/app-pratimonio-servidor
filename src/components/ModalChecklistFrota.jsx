import React from 'react';
import { X, FileText, Trash2, Printer } from 'lucide-react';

export default function ModalChecklistFrota({ 
  listaChecklistsDoDiaModal, 
  onClose, 
  onExcluir, 
  onImprimir 
}) {
  if (!listaChecklistsDoDiaModal) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 no-print">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl border border-slate-200 p-6 space-y-4 max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-black text-slate-800 flex items-center gap-2 text-sm uppercase">
            <FileText className="text-blue-600" size={18} />
            Vistorias do Dia ({listaChecklistsDoDiaModal.length})
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer p-1">
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto space-y-4 pr-1 flex-1">
          {listaChecklistsDoDiaModal.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-4">Nenhum registro encontrado.</p>
          ) : (
            listaChecklistsDoDiaModal.map((item, index) => (
              <div key={item.id || item._id || index} className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3">
                <div className="flex justify-between items-start text-xs border-b border-slate-200 pb-2">
                  <div>
                    <span className="font-black text-blue-900 block text-sm">
                      {item.modelo || 'Veículo'} - Placa: {item.placa}
                    </span>
                    <span className="text-slate-500 text-[11px]">
                      Motorista: <strong>{item.condutor}</strong> | KM: <strong>{item.km}</strong>
                    </span>
                  </div>
                  <span className="bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded text-[10px]">
                    #{index + 1}
                  </span>
                </div>

                {item.obs && (
                  <div className="bg-amber-50 p-2.5 rounded-lg border border-amber-200 text-amber-900 text-xs">
                    <strong>Observações:</strong> {item.obs}
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => onExcluir(item.id || item._id)}
                    className="flex items-center gap-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-1.5 px-3 rounded-lg text-xs transition cursor-pointer"
                  >
                    <Trash2 size={13} /> Excluir
                  </button>
                  <button
                    type="button"
                    onClick={() => onImprimir(item)}
                    className="flex items-center gap-1 bg-slate-700 hover:bg-slate-800 text-white font-bold py-1.5 px-3 rounded-lg text-xs transition cursor-pointer"
                  >
                    <Printer size={13} /> Imprimir
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="pt-2 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold px-4 py-2 rounded-xl transition cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}