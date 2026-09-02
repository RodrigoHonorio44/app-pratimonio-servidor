import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAgendamentos } from '../hooks/useAgendamentos';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function AgendaMotoristaPage() {
  const navigate = useNavigate();
  const { tarefas, buscarAgendaMotorista, excluirAgendamento, loading } = useAgendamentos();

  const obterDataLocal = (diasAdicionais = 0) => {
    const data = new Date();
    data.setDate(data.getDate() + diasAdicionais);
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const dia = String(data.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  };

  const hojeStr = obterDataLocal(0);
  const amanhaStr = obterDataLocal(1);

  // Estados dos Filtros
  const [modoFiltroData, setModoFiltroData] = useState('mes');
  const [dataSelecionada, setDataSelecionada] = useState(hojeStr);
  const [inputBusca, setInputBusca] = useState('');
  const [termoAplicado, setTermoAplicado] = useState('');
  const [itemParaExcluir, setItemParaExcluir] = useState(null);
  const [toast, setToast] = useState({ exibe: false, mensagem: '', tipo: 'sucesso' });

  // Estados de Paginação
  const [paginaAtual, setPaginaAtual] = useState(1);
  const itensPorPagina = 5;

  const mostrarToast = (mensagem, tipo = 'sucesso') => {
    setToast({ exibe: true, mensagem, tipo });
    setTimeout(() => {
      setToast({ exibe: false, mensagem: '', tipo: 'sucesso' });
    }, 3500);
  };

  const listaTarefas = Array.isArray(tarefas) ? tarefas : [];

  useEffect(() => {
    if (typeof buscarAgendaMotorista === 'function') {
      buscarAgendaMotorista();
    }
  }, [buscarAgendaMotorista]);

  // Reseta para a primeira página sempre que alterar os filtros de busca/data
  useEffect(() => {
    setPaginaAtual(1);
  }, [modoFiltroData, dataSelecionada, termoAplicado]);

  const handleVoltarDashboard = () => {
    navigate('/dashboard');
  };

  const normalizarTexto = (txt) => {
    if (!txt) return '';
    return txt
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  };

  const formatarNomeExibicao = (str) => {
    if (!str) return '';
    return str
      .toLowerCase()
      .split(' ')
      .map((palavra) => palavra.charAt(0).toUpperCase() + palavra.slice(1))
      .join(' ');
  };

  // Executa a busca ao clicar no botão ou pressionar Enter
  const handleBuscar = (e) => {
    if (e) e.preventDefault();
    setTermoAplicado(inputBusca);
  };

  // Limpa o campo de busca
  const handleLimpar = () => {
    setInputBusca('');
    setTermoAplicado('');
  };

  // Lógica de Filtragem
  const tarefasFiltradas = listaTarefas.filter((t) => {
    const dataAgendada = t.dataAgendamento || '';

    // 1. Filtro por Mês ou Dia
    let matchData = false;
    if (modoFiltroData === 'mes') {
      const mesAnoReferencia = (dataSelecionada || hojeStr).substring(0, 7);
      matchData = dataAgendada.startsWith(mesAnoReferencia);
    } else {
      matchData = dataAgendada === dataSelecionada;
    }

    // 2. Filtro Textual (somente se houver termo aplicado)
    const busca = normalizarTexto(termoAplicado);
    if (!busca) return matchData;

    const motorista = normalizarTexto(t.motorista);
    const modelo = normalizarTexto(t.modelo);
    const placa = normalizarTexto(t.placa);
    const origem = normalizarTexto(t.origem);
    const destino = normalizarTexto(t.destino);
    const tipo = normalizarTexto(t.tipoTarefa);
    const obs = normalizarTexto(t.observacoes);

    const palavrasBusca = busca.split(' ').filter(Boolean);
    const matchTexto = palavrasBusca.every((palavra) =>
      motorista.includes(palavra) ||
      modelo.includes(palavra) ||
      placa.includes(palavra) ||
      origem.includes(palavra) ||
      destino.includes(palavra) ||
      tipo.includes(palavra) ||
      obs.includes(palavra)
    );

    return matchData && matchTexto;
  });

  const tarefasOrdenadas = [...tarefasFiltradas].sort((a, b) => {
    const dtA = `${a.dataAgendamento || ''}T${a.horaInicio || '00:00'}`;
    const dtB = `${b.dataAgendamento || ''}T${b.horaInicio || '00:00'}`;
    return new Date(dtA) - new Date(dtB);
  });

  // Cálculo da Paginação
  const totalPaginas = Math.ceil(tarefasOrdenadas.length / itensPorPagina) || 1;
  const indiceInicial = (paginaAtual - 1) * itensPorPagina;
  const tarefasPaginadas = tarefasOrdenadas.slice(indiceInicial, indiceInicial + itensPorPagina);

  const handleEditar = (tarefa) => {
    const id = tarefa._id?.$oid || tarefa._id || tarefa.id;
    navigate(`/agendamentos/editar/${id}`, { state: { tarefa } });
  };

  const handleConfirmarExclusao = async () => {
    if (!itemParaExcluir) return;
    const id = itemParaExcluir._id?.$oid || itemParaExcluir._id || itemParaExcluir.id;

    if (typeof excluirAgendamento === 'function') {
      const sucesso = await excluirAgendamento(id);
      if (sucesso !== false) {
        mostrarToast('agendamento excluído com sucesso!', 'sucesso');
        if (typeof buscarAgendaMotorista === 'function') {
          buscarAgendaMotorista();
        }
      } else {
        mostrarToast('erro ao excluir o agendamento. tente novamente.', 'erro');
      }
    }
    setItemParaExcluir(null);
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#f8fafc] relative">
      <Header />

      {/* Toast Flutuante */}
      {toast.exibe && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-white text-xs font-semibold transition-all transform duration-300 ${
            toast.tipo === 'sucesso' ? 'bg-emerald-600' : 'bg-rose-600'
          }`}
        >
          {toast.tipo === 'sucesso' ? (
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          <span>{toast.mensagem}</span>
        </div>
      )}

      <main className="flex-grow container mx-auto px-4 py-8 flex flex-col items-center">
        <div className="w-full max-w-4xl mb-4 flex justify-between items-center">
          <button
            type="button"
            onClick={handleVoltarDashboard}
            className="flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-800 transition"
          >
            ← Voltar à Dashboard
          </button>
        </div>

        <div className="w-full max-w-4xl bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
          {/* Cabeçalho */}
          <div className="p-6 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center shadow-md text-white shrink-0">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-black text-slate-800 uppercase tracking-wide">
                  Cronograma de Operações
                </h1>
                <p className="text-xs font-bold text-slate-400 tracking-wider uppercase">
                  Gestão Geral de Agendamentos e Afazeres
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleVoltarDashboard}
              className="self-start sm:self-auto px-4 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition border border-slate-200 flex items-center gap-1"
            >
              ✕ Fechar
            </button>
          </div>

          {/* Painel de Controle e Filtros */}
          <div className="p-6 pb-4 bg-slate-50/50 border-b border-slate-100 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 bg-slate-200/60 p-1 rounded-xl text-xs font-bold w-fit">
                <button
                  type="button"
                  onClick={() => setModoFiltroData('mes')}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    modoFiltroData === 'mes'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Tudo do Mês
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setModoFiltroData('dia');
                    setDataSelecionada(hojeStr);
                  }}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    modoFiltroData === 'dia' && dataSelecionada === hojeStr
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Hoje
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setModoFiltroData('dia');
                    setDataSelecionada(amanhaStr);
                  }}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    modoFiltroData === 'dia' && dataSelecionada === amanhaStr
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Amanhã
                </button>
              </div>

              <span className="text-xs font-bold text-slate-500">
                {tarefasOrdenadas.length} agendamento(s) encontrado(s)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                  Filtrar por Dia Específico
                </label>
                <input
                  type="date"
                  value={dataSelecionada}
                  onChange={(e) => {
                    setDataSelecionada(e.target.value);
                    if (e.target.value) {
                      setModoFiltroData('dia');
                    } else {
                      setModoFiltroData('mes');
                    }
                  }}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 shadow-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                  Buscar por Texto
                </label>
                <form onSubmit={handleBuscar} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ex: Coleta, Hospital, Spin..."
                    value={inputBusca}
                    onChange={(e) => setInputBusca(e.target.value.toLowerCase())}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 shadow-sm focus:outline-none focus:border-blue-500 placeholder:text-slate-400"
                  />
                  <button
                    type="submit"
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shrink-0"
                  >
                    Buscar
                  </button>
                  {inputBusca && (
                    <button
                      type="button"
                      onClick={handleLimpar}
                      className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-600 text-xs font-bold rounded-xl transition shrink-0"
                    >
                      Limpar
                    </button>
                  )}
                </form>
              </div>
            </div>
          </div>

          {/* Listagem do Cronograma */}
          <div className="p-6">
            {loading ? (
              <div className="py-12 text-center text-slate-400 font-bold text-sm tracking-wider uppercase">
                carregando tarefas...
              </div>
            ) : tarefasOrdenadas.length === 0 ? (
              <div className="bg-[#f8fafc] border border-slate-200 p-8 rounded-2xl text-center text-slate-500 font-semibold text-sm">
                Nenhum agendamento encontrado para o filtro selecionado.
              </div>
            ) : (
              <div className="space-y-4">
                {tarefasPaginadas.map((t) => {
                  const id = t._id?.$oid || t._id || t.id;
                  const dataFormatada = t.dataAgendamento
                    ? t.dataAgendamento.split('-').reverse().join('/')
                    : '-';

                  const tipoLower = (t.tipoTarefa || '').toLowerCase();
                  let badgeClass = 'bg-blue-100 text-blue-700 border-blue-200';
                  let tipoExibicao = tipoLower;

                  if (tipoLower === 'entrega_urgente') {
                    badgeClass = 'bg-red-100 text-red-700 border-red-200';
                    tipoExibicao = 'entrega urgente';
                  } else if (tipoLower === 'termolabeis') {
                    badgeClass = 'bg-cyan-100 text-cyan-700 border-cyan-200';
                    tipoExibicao = 'carga termolábil';
                  } else if (tipoLower === 'coleta') {
                    badgeClass = 'bg-emerald-100 text-emerald-700 border-emerald-200';
                    tipoExibicao = 'coleta';
                  } else if (tipoLower === 'manutencao') {
                    badgeClass = 'bg-amber-100 text-amber-700 border-amber-200';
                    tipoExibicao = 'manutenção';
                  } else if (tipoLower === 'servico_externo') {
                    badgeClass = 'bg-purple-100 text-purple-700 border-purple-200';
                    tipoExibicao = 'serviço externo';
                  } else if (tipoLower === 'entrega') {
                    badgeClass = 'bg-blue-100 text-blue-700 border-blue-200';
                    tipoExibicao = 'entrega padrão';
                  }

                  return (
                    <div
                      key={id}
                      className="bg-[#f8fafc] p-5 rounded-2xl border border-slate-200 hover:border-blue-200 transition space-y-3"
                    >
                      {/* Topo do Card */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/60 pb-2.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`font-bold lowercase text-xs px-3 py-1 rounded-full border ${badgeClass}`}>
                            {tipoExibicao}
                          </span>
                          <span className="text-xs font-bold text-slate-600 bg-white px-2.5 py-1 rounded-md border border-slate-200">
                            Data: {dataFormatada}
                          </span>
                          <span className="text-xs font-bold text-slate-500 bg-white px-2.5 py-1 rounded-md border border-slate-200">
                            {t.horaInicio} às {t.horaFim}
                          </span>
                        </div>

                        {/* Botões de Ação */}
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleEditar(t)}
                            className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-bold rounded-lg border border-amber-200 transition"
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => setItemParaExcluir(t)}
                            className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-lg border border-rose-200 transition"
                          >
                            Excluir
                          </button>
                        </div>
                      </div>

                      {/* Informações Principais */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="font-bold text-slate-400 text-[10px] uppercase block">
                            Motorista
                          </span>
                          <span className="font-bold text-slate-800">
                            {formatarNomeExibicao(t.motorista)}
                          </span>
                        </div>

                        <div>
                          <span className="font-bold text-slate-400 text-[10px] uppercase block">
                            Veículo
                          </span>
                          <span className="font-bold text-slate-800">
                            {formatarNomeExibicao(t.modelo)} ({t.placa?.toUpperCase()})
                          </span>
                        </div>
                      </div>

                      {/* Rota */}
                      <div className="text-xs font-medium text-slate-600 bg-white p-3 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <div>
                          <strong className="text-slate-500">De:</strong>{' '}
                          {formatarNomeExibicao(t.origem)}
                        </div>
                        <div className="hidden sm:block text-slate-300">→</div>
                        <div>
                          <strong className="text-slate-500">Para:</strong>{' '}
                          {formatarNomeExibicao(t.destino)}
                        </div>
                      </div>

                      {/* Observações */}
                      {t.observacoes && (
                        <div className="text-xs bg-amber-50/60 p-3 rounded-xl text-slate-600 border border-amber-100 font-medium">
                          <strong className="text-amber-800">Obs:</strong>{' '}
                          {t.observacoes?.toLowerCase()}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Componente de Paginação */}
            {totalPaginas > 1 && (
              <div className="flex items-center justify-between pt-6 mt-4 border-t border-slate-100 text-xs font-semibold text-slate-500">
                <span>
                  Página {paginaAtual} de {totalPaginas}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={paginaAtual === 1}
                    onClick={() => setPaginaAtual((prev) => Math.max(prev - 1, 1))}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent transition"
                  >
                    Anterior
                  </button>
                  <button
                    type="button"
                    disabled={paginaAtual === totalPaginas}
                    onClick={() => setPaginaAtual((prev) => Math.min(prev + 1, totalPaginas))}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent transition"
                  >
                    Próxima
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modal de Confirmação de Exclusão */}
      {itemParaExcluir && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-xl border border-slate-100">
            <h3 className="text-base font-bold text-slate-800 uppercase">
              Excluir Tarefa
            </h3>
            <p className="text-xs text-slate-600 font-medium">
              Tem certeza que deseja remover o agendamento de{' '}
              <strong className="text-slate-800">
                {itemParaExcluir.tipoTarefa?.toLowerCase()}
              </strong>{' '}
              para o motorista{' '}
              <strong className="text-slate-800">
                {formatarNomeExibicao(itemParaExcluir.motorista)}
              </strong>
              ?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setItemParaExcluir(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarExclusao}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}