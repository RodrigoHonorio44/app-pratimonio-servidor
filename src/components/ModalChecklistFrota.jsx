import React from 'react';
import { X, FileText, Trash2, Printer, CheckCircle2 } from 'lucide-react';
import { imprimirVistoriaHistorico } from "../components/imprimirVistoriaHistorico";

export default function ModalChecklistFrota({ 
  listaChecklistsDoDiaModal, 
  onClose, 
  onExcluir, 
  onImprimir 
}) {
  if (!listaChecklistsDoDiaModal) return null;

  // Função interna para normalizar o item do modal garantindo todas as chaves exigidas pela impressão
  const prepararItemParaImpressao = (item) => {
    const itemNormalizado = {
      ...item,
      id: item.id || item._id,
      placa: item.placa || item.veiculo?.placa || "N/A",
      modelo: item.modelo || item.veiculo?.modelo || "Veículo não especificado",
      ano: item.ano || item.anoModelo || "2019/2020",
      cor: item.cor || "Não informada",
      motorista: item.motorista || item.condutor || "Não informado",
      condutor: item.motorista || item.condutor || "Não informado",
      km: item.km || item.quilometragem || "0",
      combustivel: item.combustivel || "1/2",
      crlv: item.crlv || "SIM (2026)",
      data: item.dataHoraInicio ? new Date(item.dataHoraInicio).toLocaleDateString("pt-BR") : (item.data || ""),
      hora: item.dataHoraInicio ? new Date(item.dataHoraInicio).toLocaleTimeString("pt-BR", {hour: '2-digit', minute:'2-digit'}) : (item.hora || "00:00"),
      acessorios: item.acessorios || item.itensAvaliados || {},
      obs: item.obs || item.observacoes || "Nenhuma observação registrada."
    };

    // Se foi passada uma função customizada por props, usa ela; senão, chama direto o utilitário isolado
    if (onImprimir) {
      onImprimir(itemNormalizado);
    } else {
      imprimirVistoriaHistorico(itemNormalizado);
    }
  };

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
            listaChecklistsDoDiaModal.map((item, index) => {
              const itensAvaliados = item.itensAvaliados || item.itens || [];
              const modeloExibicao = item.modelo || item.veiculo?.modelo || 'Veículo';
              const placaExibicao = item.placa || item.veiculo?.placa || 'N/A';
              const condutorExibicao = item.condutor || item.motorista || 'Não informado';
              const kmExibicao = item.km || item.quilometragem || '0';

              return (
                <div key={item.id || item._id || index} className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3">
                  <div className="flex justify-between items-start text-xs border-b border-slate-200 pb-2">
                    <div>
                      <span className="font-black text-blue-900 block text-sm">
                        {modeloExibicao} - Placa: {placaExibicao}
                      </span>
                      <span className="text-slate-500 text-[11px]">
                        Motorista: <strong>{condutorExibicao}</strong> | KM: <strong>{kmExibicao}</strong>
                      </span>
                    </div>
                    <span className="bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded text-[10px]">
                      #{index + 1}
                    </span>
                  </div>

                  {/* Resumo rápido dos itens avaliados dentro do card do modal */}
                  {itensAvaliados.length > 0 && (
                    <div className="text-[11px] text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200 space-y-1">
                      <span className="font-bold text-slate-700 block uppercase tracking-wider text-[10px]">
                        Itens Conferidos ({itensAvaliados.length}):
                      </span>
                      <div className="grid grid-cols-2 gap-x-2 gap-y-1 max-h-24 overflow-y-auto">
                        {itensAvaliados.map((it, idx) => (
                          <div key={idx} className="flex items-center gap-1 truncate">
                            <CheckCircle2 size={12} className="text-emerald-600 shrink-0" />
                            <span className="truncate">
                              {it.equipamento || it.descricao || it.nome}: <strong>{it.estadoConservacao || it.estado || 'OK'}</strong>
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {(item.obs || item.observacoes) && (
                    <div className="bg-amber-50 p-2.5 rounded-lg border border-amber-200 text-amber-900 text-xs">
                      <strong>Observações:</strong> {item.obs || item.observacoes}
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
                      onClick={() => prepararItemParaImpressao(item)}
                      className="flex items-center gap-1 bg-slate-700 hover:bg-slate-800 text-white font-bold py-1.5 px-3 rounded-lg text-xs transition cursor-pointer"
                    >
                      <Printer size={13} /> Imprimir Relatório Completo
                    </button>
                  </div>
                </div>
              );
            })
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