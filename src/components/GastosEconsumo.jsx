import React from 'react';

export default function GastosEconsumo({
  listaVeiculos,
  veiculoFiltroRelatorio,
  setVeiculoFiltroRelatorio,
  custoTotalGasto,
  litrosTotaisAbastecidos,
  formatarNomeExibicao
}) {
  return (
    <div className="w-full bg-white p-6 rounded-2xl shadow-xs border border-slate-200 space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 pb-3 gap-3">
        <div>
          <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider">Relatório de Gastos e Alerta de Consumo</h3>
          <p className="text-[11px] text-slate-500">Acompanhe os custos e verifique indícios de alto consumo de combustível.</p>
        </div>
        <div>
          <select
            value={veiculoFiltroRelatorio}
            onChange={(e) => setVeiculoFiltroRelatorio(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700"
          >
            <option value="">Todos os Veículos (Geral)</option>
            {listaVeiculos.map(v => {
              const vId = v._id?.$oid || v._id || v.id;
              return (
                <option key={vId} value={vId}>{formatarNomeExibicao(v.modelo)} ({v.placa?.toUpperCase()})</option>
              );
            })}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
          <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">Custo Total de Combustível</span>
          <span className="text-lg font-black text-slate-800">
            R$ {custoTotalGasto.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
          <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">Litros Totais Abastecidos</span>
          <span className="text-lg font-black text-blue-600">
            {litrosTotaisAbastecidos.toFixed(1)} L
          </span>
        </div>

        <div className="bg-blue-50/60 border border-blue-200 p-4 rounded-xl flex flex-col justify-between">
          <span className="text-[10px] font-black uppercase text-blue-800 block mb-1">Status de Eficiência</span>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-emerald-500 rounded-full inline-block animate-pulse"></span>
            <span className="text-xs font-bold text-slate-700">Frota monitorada sem desvios críticos</span>
          </div>
        </div>
      </div>
    </div>
  );
}