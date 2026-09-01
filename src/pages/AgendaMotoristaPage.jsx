import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAgendamentos } from '../hooks/useAgendamentos';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function AgendaMotoristaPage({ nomeMotorista }) {
  const navigate = useNavigate();
  const { tarefas, buscarAgendaMotorista, loading } = useAgendamentos();

  const listaTarefas = Array.isArray(tarefas) ? tarefas : [];

  useEffect(() => {
    if (nomeMotorista) {
      buscarAgendaMotorista(nomeMotorista);
    }
  }, [nomeMotorista, buscarAgendaMotorista]);

  const handleVoltarDashboard = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#f8fafc]">
      <Header />

      <main className="flex-grow container mx-auto px-4 py-8 flex flex-col items-center">
        {/* Link superior para voltar à Dashboard */}
        <div className="w-full max-w-2xl mb-4 flex justify-start">
          <button
            type="button"
            onClick={handleVoltarDashboard}
            className="flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-800 transition"
          >
            ← Voltar à Dashboard
          </button>
        </div>

        <div className="w-full max-w-2xl bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
          {/* Cabeçalho */}
          <div className="p-6 pb-4 flex items-center justify-between border-b border-slate-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center shadow-md text-white">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-black text-slate-800 uppercase tracking-wide">
                  Afazeres de Hoje
                </h1>
                <p className="text-xs font-bold text-slate-400 tracking-wider uppercase">
                  {nomeMotorista ? (
                    <span>Motorista: <strong className="text-slate-600">{nomeMotorista}</strong></span>
                  ) : (
                    'Escala do Motorista'
                  )}
                </p>
              </div>
            </div>

            {/* Botão de fechar */}
            <button
              type="button"
              onClick={handleVoltarDashboard}
              className="px-4 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition border border-slate-200 flex items-center gap-1"
            >
              ✕ Fechar
            </button>
          </div>

          {/* Conteúdo */}
          <div className="p-6">
            {loading ? (
              <div className="py-12 text-center text-slate-400 font-bold text-sm tracking-wider uppercase">
                carregando tarefas...
              </div>
            ) : listaTarefas.length === 0 ? (
              <div className="bg-[#f8fafc] border border-slate-200 p-8 rounded-2xl text-center text-slate-500 font-semibold text-sm">
                Nenhuma tarefa agendada para você hoje.
              </div>
            ) : (
              <div className="space-y-4">
                {listaTarefas.map((t) => {
                  const id = t._id?.$oid || t._id || t.id;
                  return (
                    <div key={id} className="bg-[#f8fafc] p-5 rounded-2xl border border-slate-200 hover:border-blue-200 transition">
                      <div className="flex justify-between items-center mb-3">
                        <span className="font-bold uppercase text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full border border-blue-200">
                          {t.tipoTarefa}
                        </span>
                        <span className="text-xs font-bold text-slate-500 bg-white px-2.5 py-1 rounded-md border border-slate-200">
                          {t.horaInicio} - {t.horaFim}
                        </span>
                      </div>

                      <div className="space-y-1 mb-3">
                        <p className="text-sm font-bold text-slate-800">
                          Veículo: <span className="text-blue-600">{t.modelo?.toLowerCase()}</span> ({t.placa?.toUpperCase()})
                        </p>
                        <p className="text-xs font-medium text-slate-600">
                          <strong>De:</strong> {t.origem?.toLowerCase()} <br />
                          <strong>Para:</strong> {t.destino?.toLowerCase()}
                        </p>
                      </div>

                      {t.observacoes && (
                        <div className="text-xs bg-white p-3 rounded-xl text-slate-600 border border-slate-200 font-medium">
                          <strong className="text-slate-500">Obs:</strong> {t.observacoes?.toLowerCase()}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}