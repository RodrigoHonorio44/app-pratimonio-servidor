import React from 'react';
import { Fuel, Calendar, User, Gauge, Trash2, X, AlertTriangle } from 'lucide-react';

export function ModalAbastecimento({
  listaAbastecimentosDoDia,
  onFecharDia,
  itemExcluir,
  onFecharExcluir,
  onConfirmarExcluir,
  onSolicitarExcluir, // Função opcional para abrir o modal de exclusão a partir do card
  formatarNomeExibicao = (nome) => nome || '',
  formatarDataExibicao = (data) => (data ? new Date(data).toLocaleDateString('pt-BR') : '')
}) {
  return (
    <>
      {/* MODAL: Abastecimentos do Dia Clicado */}
      {listaAbastecimentosDoDia && listaAbastecimentosDoDia.length > 0 && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in duration-200">
            {/* Cabeçalho do Modal */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="bg-blue-100 text-blue-700 p-2 rounded-xl">
                  <Fuel size={18} />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase text-slate-800">
                    Abastecimentos do Dia
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {formatarDataExibicao(
                      listaAbastecimentosDoDia[0].dataAbastecimento ||
                        listaAbastecimentosDoDia[0].data ||
                        listaAbastecimentosDoDia[0].createdAt
                    )}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onFecharDia}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Lista dos Cards do Dia */}
            <div className="max-h-[60vh] overflow-y-auto space-y-3 pr-1">
              {listaAbastecimentosDoDia.map((item) => {
                const id = item._id?.$oid || item._id || item.id;
                const kmValor = Number(item.kmAtual || item.km || 0);
                const litrosValor = Number(item.litros || 0);
                const valorTotalCalculado = Number(item.valorTotal || item.valor || 0);
                const dataRaw = item.dataAbastecimento || item.data || item.createdAt;

                return (
                  <div
                    key={id}
                    className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2 hover:border-blue-300 transition relative group"
                  >
                    {/* Linha 1: Veículo, Placa e Botão Excluir */}
                    <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-800 uppercase">
                          {formatarNomeExibicao(item.veiculoMarca || item.veiculo || '')}{' '}
                          {formatarNomeExibicao(item.veiculoModelo || item.modelo || '')}
                        </span>
                        {(item.veiculoPlaca || item.placa) && (
                          <span className="bg-slate-200 text-slate-700 text-[10px] font-black px-2 py-0.5 rounded-md uppercase">
                            {item.veiculoPlaca || item.placa}
                          </span>
                        )}
                      </div>

                      {/* Botão para solicitar a exclusão do registro individual */}
                      {onSolicitarExcluir && (
                        <button
                          type="button"
                          onClick={() => onSolicitarExcluir(item)}
                          className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                          title="Excluir abastecimento"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>

                    {/* Linha 2: Detalhes em Grade */}
                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                      {item.motorista && (
                        <div className="flex items-center gap-1.5">
                          <User size={13} className="text-slate-400" />
                          <span>{formatarNomeExibicao(item.motorista)}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5">
                        <Gauge size={13} className="text-slate-400" />
                        <span>{kmValor.toLocaleString('pt-BR')} KM</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar size={13} className="text-slate-400" />
                        <span>
                          {dataRaw
                            ? new Date(dataRaw).toLocaleTimeString('pt-BR', {
                                hour: '2-digit',
                                minute: '2-digit'
                              }) + 'h'
                            : '-'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Fuel size={13} className="text-slate-400" />
                        <span className="capitalize">
                          {item.tipoCombustivel || item.combustivel || 'Gasolina'}
                        </span>
                      </div>
                    </div>

                    {/* Linha 3: Totais */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-xs font-bold">
                      <span className="text-slate-500">
                        {litrosValor.toFixed(2)} L
                      </span>
                      <span className="text-blue-700 font-extrabold">
                        R$ {valorTotalCalculado.toFixed(2)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Rodapé do Modal */}
            <div className="pt-2">
              <button
                type="button"
                onClick={onFecharDia}
                className="w-full py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 transition cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Confirmação de Exclusão */}
      {itemExcluir && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3 text-red-600">
              <div className="p-2.5 bg-red-100 rounded-xl">
                <AlertTriangle size={20} />
              </div>
              <h3 className="text-xs font-black uppercase text-slate-800">
                Confirmar Exclusão
              </h3>
            </div>

            <p className="text-xs text-slate-600">
              Tem certeza que deseja excluir o registro de abastecimento do veículo{' '}
              <strong className="text-slate-800">
                {formatarNomeExibicao(itemExcluir.veiculoMarca || itemExcluir.veiculo)}{' '}
                {formatarNomeExibicao(itemExcluir.veiculoModelo || itemExcluir.modelo || '')}
                {itemExcluir.veiculoPlaca || itemExcluir.placa
                  ? ` (${(itemExcluir.veiculoPlaca || itemExcluir.placa).toUpperCase()})`
                  : ''}
              </strong>?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onFecharExcluir}
                className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-600 font-bold text-xs hover:bg-slate-200 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={onConfirmarExcluir}
                className="px-4 py-2.5 rounded-xl bg-red-600 text-white font-bold text-xs hover:bg-red-700 transition shadow-md shadow-red-600/20 flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 size={14} />
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ModalAbastecimento;