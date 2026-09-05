import React from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Fuel } from 'lucide-react';

export default function CalendarioAbastecimentos({
  calendarioExpandido,
  setCalendarioExpandido,
  anoAtual,
  mesAtual,
  nomesMeses,
  totalAbastecimentosMes,
  navegarMes,
  primeiroDiaMes,
  totalDiasMes,
  obterAbastecimentosDoDia,
  setListaAbastecimentosDoDiaModal
}) {
  return (
    <div className="bg-white rounded-2xl shadow-xs border border-slate-200 no-print transition-all duration-300 overflow-hidden mb-6">
      <div 
        onClick={() => setCalendarioExpandido(!calendarioExpandido)}
        className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50/80 transition select-none"
      >
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 text-blue-700 p-2 rounded-xl">
            <Fuel size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-black uppercase text-slate-800">Calendário de Abastecimentos</h3>
              <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-100">
                {totalAbastecimentosMes} abastecimento(s) em {nomesMeses[mesAtual]}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {calendarioExpandido ? 'Clique para recolher o calendário.' : 'Clique aqui para expandir o calendário e ver os abastecimentos do mês.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {calendarioExpandido && (
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={(e) => navegarMes(e, -1)}
                className="p-1 hover:bg-white rounded-lg text-slate-600 transition cursor-pointer"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="text-[11px] font-black uppercase text-slate-700 px-2 min-w-[100px] text-center">
                {nomesMeses[mesAtual]} {anoAtual}
              </span>
              <button
                type="button"
                onClick={(e) => navegarMes(e, 1)}
                className="p-1 hover:bg-white rounded-lg text-slate-600 transition cursor-pointer"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          )}

          <div className="bg-slate-100 p-2 rounded-xl text-slate-600">
            {calendarioExpandido ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </div>
      </div>

      {calendarioExpandido && (
        <div className="px-6 pb-6 pt-2 border-t border-slate-100 space-y-3">
          <p className="text-[11px] text-slate-500">
            Dias com marcação azul possuem abastecimentos registrados. Clique no dia para visualizar os lançamentos.
          </p>

          <div className="grid grid-cols-7 gap-1.5 text-center">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((dia) => (
              <div key={dia} className="text-[10px] font-black uppercase text-slate-400 py-1">
                {dia}
              </div>
            ))}

            {Array.from({ length: primeiroDiaMes }).map((_, index) => (
              <div key={`empty-${index}`} className="h-10 bg-slate-50/40 rounded-lg" />
            ))}

            {Array.from({ length: totalDiasMes }).map((_, index) => {
              const dia = index + 1;
              const abastecimentosDoDia = obterAbastecimentosDoDia(dia);
              const possuiAbastecimento = abastecimentosDoDia.length > 0;

              return (
                <div
                  key={dia}
                  className={`h-11 border rounded-xl p-1 flex flex-col justify-between items-center transition ${
                    possuiAbastecimento
                      ? 'bg-blue-50/70 border-blue-300 hover:bg-blue-100 cursor-pointer shadow-xs'
                      : 'bg-white border-slate-100 text-slate-600'
                  }`}
                  onClick={() => {
                    if (possuiAbastecimento) {
                      setListaAbastecimentosDoDiaModal(abastecimentosDoDia);
                    }
                  }}
                >
                  <span className="text-xs font-bold text-slate-700">{dia}</span>
                  {possuiAbastecimento && (
                    <div className="flex items-center gap-0.5 mb-0.5">
                      <span className="w-2 h-2 bg-blue-600 rounded-full inline-block" title={`${abastecimentosDoDia.length} abastecimento(s)`} />
                      {abastecimentosDoDia.length > 1 && (
                        <span className="text-[8px] font-black text-blue-800">x{abastecimentosDoDia.length}</span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}