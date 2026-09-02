import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVeiculos } from '../hooks/useVeiculos';
import { useAgendamentos } from '../hooks/useAgendamentos';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function GestaoAgendamentoPage() {
  const navigate = useNavigate();
  const { veiculos, loading: loadingVeiculos } = useVeiculos();
  const { salvarAgendamento, loading } = useAgendamentos();

  const listaVeiculos = Array.isArray(veiculos) ? veiculos : [];

  const estadoInicial = {
    veiculoId: '',
    placa: '',
    modelo: '',
    motorista: '',
    dataAgendamento: '',
    horaInicio: '',
    horaFim: '',
    tipoTarefa: 'entrega',
    origem: '',
    destino: '',
    observacoes: ''
  };

  const [form, setForm] = useState(estadoInicial);

  const handleSelectVeiculo = (e) => {
    const id = e.target.value;
    const veiculo = listaVeiculos.find((v) => {
      const vId = v._id?.$oid || v._id || v.id;
      return String(vId) === String(id);
    });

    if (veiculo) {
      setForm((prev) => ({
        ...prev,
        veiculoId: id,
        placa: veiculo.placa || '',
        modelo: veiculo.modelo || ''
      }));
    } else {
      setForm((prev) => ({ ...prev, veiculoId: '', placa: '', modelo: '' }));
    }
  };

  const handleLimpar = () => {
    setForm(estadoInicial);
  };

  const handleVoltarDashboard = () => {
    navigate('/dashboard');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const sucesso = await salvarAgendamento(form);
    if (sucesso) {
      alert('agendamento salvo com sucesso!');
      setForm(estadoInicial);
    }
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
          <div className="p-6 pb-2 flex items-center justify-between border-b border-slate-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center shadow-md text-white">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-black text-slate-800 uppercase tracking-wide">
                  Escala / Agendamento
                </h1>
                <p className="text-xs font-bold text-slate-400 tracking-wider uppercase">
                  Agendamento de Tarefas e Motoristas
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

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold tracking-wider text-slate-500 uppercase mb-1.5">
                  Data da Tarefa <span className="text-blue-600">*</span>
                </label>
                <input
                  type="date"
                  value={form.dataAgendamento}
                  onChange={(e) => setForm({ ...form, dataAgendamento: e.target.value })}
                  required
                  className="w-full bg-[#f8fafc] border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold tracking-wider text-slate-500 uppercase mb-1.5">
                  Motorista Designado <span className="text-blue-600">*</span>
                </label>
                <input
                  type="text"
                  placeholder="ex: joão da silva"
                  value={form.motorista}
                  onChange={(e) => setForm({ ...form, motorista: e.target.value.toLowerCase() })}
                  required
                  className="w-full bg-[#f8fafc] border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition placeholder:text-slate-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold tracking-wider text-slate-500 uppercase mb-1.5">
                Veículo Designado <span className="text-blue-600">*</span>
              </label>
              <select
                value={form.veiculoId}
                onChange={handleSelectVeiculo}
                required
                disabled={loadingVeiculos}
                className="w-full bg-[#f8fafc] border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              >
                <option value="">
                  {loadingVeiculos ? 'Carregando veículos...' : 'Escolha um veículo...'}
                </option>
                {listaVeiculos.map((v) => {
                  const id = v._id?.$oid || v._id || v.id;
                  return (
                    <option key={id} value={id}>
                      {v.marca?.toUpperCase()} {v.modelo?.toUpperCase()} — PLACA: {v.placa?.toUpperCase()}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-bold tracking-wider text-slate-500 uppercase mb-1.5">
                  Tipo de Tarefa
                </label>
                <select
                  value={form.tipoTarefa}
                  onChange={(e) => setForm({ ...form, tipoTarefa: e.target.value })}
                  className="w-full bg-[#f8fafc] border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                >
                  <option value="entrega">entrega padrão (medicamentos)</option>
<option value="entrega_urgente">entrega urgente (uso imediato)</option>
<option value="transporte_pessoas">transporte de pessoas</option>
<option value="coleta">coleta</option>
<option value="manutencao">manutenção</option>
<option value="servico_externo">serviço externo</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold tracking-wider text-slate-500 uppercase mb-1.5">
                  Horário Início <span className="text-blue-600">*</span>
                </label>
                <input
                  type="time"
                  value={form.horaInicio}
                  onChange={(e) => setForm({ ...form, horaInicio: e.target.value })}
                  required
                  className="w-full bg-[#f8fafc] border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold tracking-wider text-slate-500 uppercase mb-1.5">
                  Previsão Fim <span className="text-blue-600">*</span>
                </label>
                <input
                  type="time"
                  value={form.horaFim}
                  onChange={(e) => setForm({ ...form, horaFim: e.target.value })}
                  required
                  className="w-full bg-[#f8fafc] border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold tracking-wider text-slate-500 uppercase mb-1.5">
                  Origem
                </label>
                <input
                  type="text"
                  placeholder="ex: farmácia central"
                  value={form.origem}
                  onChange={(e) => setForm({ ...form, origem: e.target.value.toLowerCase() })}
                  className="w-full bg-[#f8fafc] border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold tracking-wider text-slate-500 uppercase mb-1.5">
                  Destino
                </label>
                <input
                  type="text"
                  placeholder="ex: UTI neonatal"
                  value={form.destino}
                  onChange={(e) => setForm({ ...form, destino: e.target.value.toLowerCase() })}
                  className="w-full bg-[#f8fafc] border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition placeholder:text-slate-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold tracking-wider text-slate-500 uppercase mb-1.5">
                Observações
              </label>
              <textarea
                rows="3"
                placeholder="ex: manter controle de temperatura entre 2°C e 8°C..."
                value={form.observacoes}
                onChange={(e) => setForm({ ...form, observacoes: e.target.value.toLowerCase() })}
                className="w-full bg-[#f8fafc] border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition placeholder:text-slate-400"
              ></textarea>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleLimpar}
                className="w-1/3 bg-slate-100 text-slate-600 py-3 rounded-xl text-sm font-bold hover:bg-slate-200 transition"
              >
                Limpar
              </button>

              <button
                type="submit"
                disabled={loading}
                className="w-2/3 bg-blue-600 text-white py-3 rounded-xl text-sm font-bold hover:bg-blue-700 shadow-md shadow-blue-500/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z" />
                </svg>
                {loading ? 'Agendando...' : 'Salvar Agendamento'}
              </button>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}