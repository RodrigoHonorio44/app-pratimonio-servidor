import React, { useState } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  X,
  Printer,
  Trash2,
} from "lucide-react";
import { imprimirVistoriaHistorico } from "../components/imprimirVistoriaHistorico";

export default function CalendarioChecklists({
  anoAtual = 2026,
  mesAtual = 0,
  nomesMeses = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ],
  totalChecklistsMes = 0,
  primeiroDiaMes = 0,
  totalDiasMes = 30,
  obterChecklistsDoDia = () => [],
  navegarMes = () => {},
  onExcluirVistoria = () => {},
}) {
  const [calendarioExpandido, setCalendarioExpandido] = useState(false);
  const [modalVistoriasDiaAberto, setModalVistoriasDiaAberto] = useState(false);
  const [vistoriasDoDiaSelected, setVistoriasDoDiaSelected] = useState([]);

  const handleSelecionarDiaCalendario = (dia, checklistsDoDia) => {
    if (!checklistsDoDia || checklistsDoDia.length === 0) return;
    setVistoriasDoDiaSelected(checklistsDoDia);
    setModalVistoriasDiaAberto(true);
  };

  const handleImprimirItem = (item) => {
    if (!item) return;

    // Normalização dos campos para garantir o preenchimento no laudo oficial
    const vistoriaFormatada = {
      ...item,
      id: item.id || item._id?.$oid || item._id,
      placa: item.placa || item.veiculo?.placa || "n/a",
      modelo: item.modelo || item.veiculo?.modelo || "veículo",
      marca: item.marca || item.veiculo?.marca || "",
      ano: item.ano || item.anoModelo || item.veiculo?.ano || "2026",
      cor: item.cor || item.veiculo?.cor || "não informada",
      condutor: item.condutor || item.motorista || item.responsavel || "não informado",
      km: item.km || item.quilometragem || item.kmAtual || "0",
      combustivel: item.combustivel || "1/2",
      crlv: item.crlv || "sim",
      data: item.data || (item.dataHoraInicio ? item.dataHoraInicio.split("T")[0] : "data não informada"),
      hora: item.hora || (item.dataHoraInicio ? new Date(item.dataHoraInicio).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "00:00"),
      acessorios: item.acessorios || {},
      itensInspecao: item.itensInspecao || item.itensAvaliados || {},
      obs: item.obs || item.observacoes || "nenhuma observação registrada.",
    };

    // Executa a impressão isolada via janela dedicada
    imprimirVistoriaHistorico(vistoriaFormatada);
  };

  return (
    <>
      {/* CARD DO CALENDÁRIO */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 transition-all duration-300 overflow-hidden print:hidden">
        <div
          onClick={() => setCalendarioExpandido(!calendarioExpandido)}
          className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50/80 transition select-none"
        >
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 text-blue-700 p-2.5 rounded-xl">
              <CalendarIcon size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-black uppercase text-slate-800">
                  Calendário de Vistorias
                </h3>
                <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-blue-100">
                  {totalChecklistsMes} registro(s) em {nomesMeses[mesAtual]}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                {calendarioExpandido
                  ? "Clique para recolher a exibição do calendário."
                  : "Clique para expandir e filtrar os checklists por dia."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {calendarioExpandido && (
              <div
                className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={(e) => navegarMes(e, -1)}
                  className="p-1 hover:bg-white rounded-lg text-slate-600 transition cursor-pointer"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-[11px] font-black uppercase text-slate-700 px-2 min-w-[110px] text-center">
                  {nomesMeses[mesAtual]} {anoAtual}
                </span>
                <button
                  type="button"
                  onClick={(e) => navegarMes(e, 1)}
                  className="p-1 hover:bg-white rounded-lg text-slate-600 transition cursor-pointer"
                >
                  <ChevronRight size={16} />
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
            <p className="text-[11px] text-slate-500 font-medium">
              Dias marcados com indicador azul possuem registros. Clique no dia para visualizar, excluir ou imprimir.
            </p>

            <div className="grid grid-cols-7 gap-1.5 text-center">
              {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((dia) => (
                <div key={dia} className="text-[10px] font-black uppercase text-slate-400 py-1">
                  {dia}
                </div>
              ))}

              {Array.from({ length: primeiroDiaMes }).map((_, index) => (
                <div key={`empty-${index}`} className="h-11 bg-slate-50/40 rounded-xl" />
              ))}

              {Array.from({ length: totalDiasMes }).map((_, index) => {
                const dia = index + 1;
                const checklistsDoDia = obterChecklistsDoDia(dia);
                const possuiChecklist = checklistsDoDia.length > 0;

                return (
                  <div
                    key={dia}
                    className={`h-11 border rounded-xl p-1 flex flex-col justify-between items-center transition ${
                      possuiChecklist
                        ? "bg-blue-50/80 border-blue-300 hover:bg-blue-100 cursor-pointer shadow-xs"
                        : "bg-white border-slate-100 text-slate-600"
                    }`}
                    onClick={() => {
                      if (possuiChecklist) {
                        handleSelecionarDiaCalendario(dia, checklistsDoDia);
                      }
                    }}
                  >
                    <span className="text-xs font-bold text-slate-700">{dia}</span>
                    {possuiChecklist && (
                      <div className="flex items-center gap-0.5 mb-0.5">
                        <span
                          className="w-2 h-2 bg-blue-600 rounded-full inline-block"
                          title={`${checklistsDoDia.length} vistoria(s)`}
                        />
                        {checklistsDoDia.length > 1 && (
                          <span className="text-[8px] font-black text-blue-800">
                            x{checklistsDoDia.length}
                          </span>
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

      {/* MODAL DE VISTORIAS DO DIA SELECIONADO */}
      {modalVistoriasDiaAberto && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:hidden">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl max-h-[85vh] flex flex-col border border-slate-100">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 mb-4">
              <h2 className="text-base font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                <span className="text-blue-600">📄</span> Vistorias do dia ({vistoriasDoDiaSelected.length})
              </h2>
              <button
                onClick={() => setModalVistoriasDiaAberto(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 space-y-4 pr-1">
              {vistoriasDoDiaSelected.map((item, index) => (
                <div
                  key={item.id || item._id || index}
                  className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-5 relative"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-sm font-black text-blue-900 uppercase">
                        {item.modelo || item.veiculo?.modelo || "veículo"} - Placa: {item.placa || item.veiculo?.placa || "n/a"}
                      </h3>
                      <p className="text-xs font-bold text-slate-500 mt-0.5">
                        Motorista: {item.condutor || item.motorista || "não informado"} | KM: {item.km || item.quilometragem || "0"}
                      </p>
                    </div>
                    <span className="text-[10px] font-black text-blue-600 bg-blue-100 px-2 py-0.5 rounded-md">
                      #{index + 1}
                    </span>
                  </div>

                  {item.obs && (
                    <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-3 mb-4">
                      <p className="text-xs font-bold text-amber-900 leading-relaxed">
                        <strong>Observações:</strong> {item.obs}
                      </p>
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-200/60">
                    <button
                      type="button"
                      onClick={() => {
                        onExcluirVistoria(item);
                        setVistoriasDoDiaSelected((prev) =>
                          prev.filter((v) => (v.id || v._id) !== (item.id || item._id))
                        );
                      }}
                      className="flex items-center gap-1.5 px-4 py-2 bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-600 hover:text-white font-black text-xs rounded-xl transition-all cursor-pointer shadow-xs"
                    >
                      <Trash2 size={14} /> Excluir
                    </button>
                    <button
                      type="button"
                      onClick={() => handleImprimirItem(item)}
                      className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-black text-xs rounded-xl transition-all cursor-pointer shadow-md"
                    >
                      <Printer size={14} /> Imprimir
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-100 mt-2 text-right">
              <button
                type="button"
                onClick={() => setModalVistoriasDiaAberto(false)}
                className="px-5 py-2 bg-slate-100 text-slate-600 font-bold text-xs rounded-xl hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}