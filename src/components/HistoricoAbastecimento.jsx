import React from 'react';

export default function HistoricoAbastecimento({
  abastecimentosPaginados,
  totalAbastecimentos,
  paginaAtual,
  totalPaginas,
  onMudarPagina,
  onEditar,
  onExcluir,
  formatarNomeExibicao,
  formatarDataExibicao
}) {
  return (
    <div className="w-full bg-white rounded-2xl shadow-xs border border-slate-200 p-6 space-y-4">
      <div className="flex justify-between items-center border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider">Histórico de Abastecimentos</h3>
          <p className="text-[11px] text-slate-500">Registros realizados recentemente no sistema.</p>
        </div>
        <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-xl">
          Total: {totalAbastecimentos}
        </span>
      </div>

      <div className="space-y-3">
        {abastecimentosPaginados.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-6">Nenhum abastecimento cadastrado até o momento.</p>
        ) : (
          abastecimentosPaginados.map((item) => {
            const id = item._id?.$oid || item._id || item.id;
            return (
              <div key={id} className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-blue-900 uppercase">
                      {formatarNomeExibicao(item.modelo) || 'Veículo'} — {item.placa?.toUpperCase()}
                    </span>
                    <span className="bg-blue-100 text-blue-700 text-[9px] font-bold px-2 py-0.5 rounded-md uppercase">
                      {item.tipoCombustivel || 'gasolina'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Motorista: <span className="font-semibold text-slate-700">{formatarNomeExibicao(item.motorista)}</span> | KM: <span className="font-semibold text-slate-700">{item.kmAtual}</span> | Data: {formatarDataExibicao(item.dataAbastecimento || item.criadoEm || item.data)}
                  </p>
                </div>

                <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                  <div className="text-right">
                    <span className="text-xs font-black text-slate-800 block">{item.litros} Litros</span>
                    <span className="text-xs font-bold text-emerald-600">R$ {Number(item.valorTotal || 0).toFixed(2)}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onEditar(item)}
                      className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition cursor-pointer"
                      title="Editar"
                    >
                      ✎
                    </button>
                    <button
                      type="button"
                      onClick={() => onExcluir(item)}
                      className="p-2 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition cursor-pointer"
                      title="Excluir"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {totalPaginas > 1 && (
        <div className="flex justify-between items-center pt-2 border-t border-slate-100">
          <button
            type="button"
            disabled={paginaAtual === 1}
            onClick={() => onMudarPagina(paginaAtual - 1)}
            className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-xs font-bold disabled:opacity-40 hover:bg-slate-200 transition"
          >
            Anterior
          </button>
          <span className="text-xs font-bold text-slate-500">
            Página {paginaAtual} de {totalPaginas}
          </span>
          <button
            type="button"
            disabled={paginaAtual === totalPaginas}
            onClick={() => onMudarPagina(paginaAtual + 1)}
            className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-xs font-bold disabled:opacity-40 hover:bg-slate-200 transition"
          >
            Próxima
          </button>
        </div>
      )}
    </div>
  );
}