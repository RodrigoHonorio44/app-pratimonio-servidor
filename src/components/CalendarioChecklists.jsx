import React, { useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Eye, Trash2, Printer, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CalendarioChecklists({ checklists = [], onExcluirChecklist, onVisualizarChecklist }) {
  const [dataAtual, setDataAtual] = useState(new Date());
  const [modalListaAberto, setModalListaAberto] = useState(false);
  const [checklistsDoDia, setChecklistsDoDia] = useState([]);
  const [diaSelecionado, setDiaSelecionado] = useState('');

  const ano = dataAtual.getFullYear();
  const mes = dataAtual.getMonth();

  const primeiroDiaDoMes = new Date(ano, mes, 1).getDay();
  const totalDiasNoMes = new Date(ano, mes + 1, 0).getDate();

  const nomesMeses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const mudarMes = (delta) => {
    setDataAtual(new Date(ano, mes + delta, 1));
  };

  // Mapeia checklists por data (YYYY-MM-DD)
  const checklistsPorData = checklists.reduce((acc, c) => {
    const rawData = c.data || c.criadoEm?.$date || c.criadoEm;
    if (!rawData) return acc;

    let dataIso = '';
    if (typeof rawData === 'string') {
      dataIso = rawData.split('T')[0];
    } else if (rawData instanceof Date) {
      dataIso = rawData.toISOString().split('T')[0];
    }

    if (dataIso) {
      if (!acc[dataIso]) acc[dataIso] = [];
      acc[dataIso].push(c);
    }
    return acc;
  }, {});

  const handleCliqueDia = (dia) => {
    const diaFormatado = String(dia).padStart(2, '0');
    const mesFormatado = String(mes + 1).padStart(2, '0');
    const chaveData = `${ano}-${mesFormatado}-${diaFormatado}`;

    const itens = checklistsPorData[chaveData] || [];
    if (itens.length > 0) {
      setDiaSelecionado(`${diaFormatado}/${mesFormatado}/${ano}`);
      setChecklistsDoDia(itens);
      setModalListaAberto(true);
    }
  };

  const handleExcluir = async (id) => {
    if (window.confirm("deseja realmente excluir este checklist?")) {
      await onExcluirChecklist(id);
      setChecklistsDoDia((prev) => prev.filter((item) => (item.id || item._id) !== id));
      toast.success("checklist removido com sucesso!");
    }
  };

  return (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-4 no-print">
      {/* Cabeçalho do Calendário */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="bg-blue-100 text-blue-700 p-2 rounded-xl">
            <Calendar size={18} />
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-tight text-slate-800">
              Histórico de Vistorias
            </h3>
            <p className="text-[11px] text-slate-500">
              Dias marcados com a bolinha possuem checklists registrados.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => mudarMes(-1)}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition cursor-pointer"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-xs font-black text-slate-700 uppercase min-w-[110px] text-center">
            {nomesMeses[mes]} {ano}
          </span>
          <button
            type="button"
            onClick={() => mudarMes(1)}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition cursor-pointer"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Dias da Semana */}
      <div className="grid grid-cols-7 gap-1 text-center font-black text-[10px] text-slate-400 uppercase">
        <span>Dom</span>
        <span>Seg</span>
        <span>Ter</span>
        <span>Qua</span>
        <span>Qui</span>
        <span>Sex</span>
        <span>Sáb</span>
      </div>

      {/* Grade de Dias */}
      <div className="grid grid-cols-7 gap-1">
        {/* Células vazias para offset do primeiro dia */}
        {Array.from({ length: primeiroDiaDoMes }).map((_, index) => (
          <div key={`empty-${index}`} className="h-10 rounded-xl bg-slate-50/50" />
        ))}

        {/* Dias do Mês */}
        {Array.from({ length: totalDiasNoMes }).map((_, index) => {
          const dia = index + 1;
          const diaFormatado = String(dia).padStart(2, '0');
          const mesFormatado = String(mes + 1).padStart(2, '0');
          const chaveData = `${ano}-${mesFormatado}-${diaFormatado}`;
          const temChecklist = !!checklistsPorData[chaveData];
          const qtd = temChecklist ? checklistsPorData[chaveData].length : 0;

          return (
            <button
              key={dia}
              type="button"
              onClick={() => handleCliqueDia(dia)}
              className={`h-10 rounded-xl flex flex-col items-center justify-center relative transition cursor-pointer border ${
                temChecklist
                  ? 'bg-blue-50 border-blue-300 hover:bg-blue-100'
                  : 'bg-slate-50 border-transparent hover:bg-slate-100'
              }`}
            >
              <span className={`text-xs font-bold ${temChecklist ? 'text-blue-900' : 'text-slate-700'}`}>
                {dia}
              </span>

              {/* Bolinha Indicadora de Checklist */}
              {temChecklist && (
                <div className="flex items-center gap-0.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                  {qtd > 1 && (
                    <span className="text-[8px] font-black text-blue-700">
                      x{qtd}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* MODAL: Lista de Checklists do Dia Selecionado */}
      {modalListaAberto && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-slate-800 text-sm">
                  Vistorias Realizadas em {diaSelecionado}
                </h3>
                <p className="text-xs text-slate-500">
                  Selecione uma ação para o checklist registrado.
                </p>
              </div>
              <button
                onClick={() => setModalListaAberto(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
              {checklistsDoDia.map((item) => {
                const itemId = item.id || item._id;
                return (
                  <div
                    key={itemId}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3"
                  >
                    <div className="space-y-0.5 text-xs">
                      <p className="font-black text-slate-800 uppercase">
                        Placa: {item.placa} | {item.modelo}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Motorista: <span className="font-semibold text-slate-700">{item.condutor}</span>
                      </p>
                      <p className="text-[10px] text-slate-400">
                        Horário: {item.hora || 'não informado'}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          onVisualizarChecklist(item);
                          setModalListaAberto(false);
                        }}
                        title="Visualizar e Imprimir"
                        className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition cursor-pointer"
                      >
                        <Printer size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleExcluir(itemId)}
                        title="Excluir Checklist"
                        className="p-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setModalListaAberto(false)}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-2.5 rounded-xl text-xs uppercase transition cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}