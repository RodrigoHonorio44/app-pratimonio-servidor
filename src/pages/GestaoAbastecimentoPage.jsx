import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVeiculos } from '../hooks/useVeiculos';
import { useAbastecimentos } from '../hooks/useAbastecimentos';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function GestaoAbastecimentoPage() {
  const navigate = useNavigate();
  const { veiculos, loading: loadingVeiculos } = useVeiculos();
  const { salvarAbastecimento, loading } = useAbastecimentos();

  const listaVeiculos = Array.isArray(veiculos) ? veiculos : [];

  const estadoInicial = {
    veiculoId: '',
    placa: '',
    modelo: '',
    motorista: '',
    kmAtual: '',
    tipoCombustivel: 'gasolina',
    litros: '',
    valorTotal: '',
    tanqueCheio: true
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
        modelo: veiculo.modelo || '',
        kmAtual: veiculo.kmAtual || ''
      }));
    } else {
      setForm((prev) => ({ ...prev, veiculoId: '', placa: '', modelo: '', kmAtual: '' }));
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
    const sucesso = await salvarAbastecimento(form);
    if (sucesso) {
      alert('abastecimento salvo com sucesso!');
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
          <div className="p-6 pb-2 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center shadow-md text-white">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19.77 7.23l.01-.01-3.72-3.72L15 4.56l2.11 2.11C16.17 7 15.5 7.9 15.5 9c0 1.22.8 2.25 1.91 2.61l-.91 5.91c-.06.39.07.78.34 1.06.27.28.66.42 1.05.38l.11-.01c.71-.09 1.25-.69 1.25-1.41V11c1.1 0 2-.9 2-2 0-.55-.22-1.05-.58-1.41zM18.5 9.5c-.28 0-.5-.22-.5-.5s.22-.5.5-.5.5.22.5.5-.22.5-.5.5zM12 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h7c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 10H5V8h7v5z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-black text-slate-800 uppercase tracking-wide">
                  Lançamento de Abastecimento
                </h1>
                <p className="text-xs font-bold text-slate-400 tracking-wider uppercase">
                  Registro de Consumo e Controle da Frota
                </p>
              </div>
            </div>

            {/* Botão de fechar direcionando para Dashboard */}
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
            <div>
              <label className="block text-[11px] font-bold tracking-wider text-slate-500 uppercase mb-1.5">
                Selecione o Veículo <span className="text-blue-600">*</span>
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

            <div>
              <label className="block text-[11px] font-bold tracking-wider text-slate-500 uppercase mb-1.5">
                Nome do Motorista <span className="text-blue-600">*</span>
              </label>
              <input
                type="text"
                placeholder="Ex: joão da silva"
                value={form.motorista}
                onChange={(e) => setForm({ ...form, motorista: e.target.value.toLowerCase() })}
                required
                className="w-full bg-[#f8fafc] border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition placeholder:text-slate-400"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold tracking-wider text-slate-500 uppercase mb-1.5">
                  KM Atual <span className="text-blue-600">*</span>
                </label>
                <input
                  type="number"
                  placeholder="20000"
                  value={form.kmAtual}
                  onChange={(e) => setForm({ ...form, kmAtual: e.target.value })}
                  required
                  className="w-full bg-[#f8fafc] border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold tracking-wider text-slate-500 uppercase mb-1.5">
                  Combustível
                </label>
                <select
                  value={form.tipoCombustivel}
                  onChange={(e) => setForm({ ...form, tipoCombustivel: e.target.value })}
                  className="w-full bg-[#f8fafc] border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                >
                  <option value="gasolina">Gasolina</option>
                  <option value="etanol">Etanol</option>
                  <option value="diesel">Diesel</option>
                  <option value="gnv">GNV</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold tracking-wider text-slate-500 uppercase mb-1.5">
                  Litros Abastecidos <span className="text-blue-600">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={form.litros}
                  onChange={(e) => setForm({ ...form, litros: e.target.value })}
                  required
                  className="w-full bg-[#f8fafc] border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold tracking-wider text-slate-500 uppercase mb-1.5">
                  Valor Total (R$) <span className="text-blue-600">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={form.valorTotal}
                  onChange={(e) => setForm({ ...form, valorTotal: e.target.value })}
                  required
                  className="w-full bg-[#f8fafc] border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition placeholder:text-slate-400"
                />
              </div>
            </div>

            <div className="flex items-center bg-[#f8fafc] p-3.5 rounded-2xl border border-slate-200">
              <input
                type="checkbox"
                id="tanqueCheio"
                checked={form.tanqueCheio}
                onChange={(e) => setForm({ ...form, tanqueCheio: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded cursor-pointer"
              />
              <label htmlFor="tanqueCheio" className="ml-3 text-sm font-semibold text-slate-700 cursor-pointer select-none">
                Tanque foi totalmente cheio
              </label>
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
                  <path d="M19.77 7.23l.01-.01-3.72-3.72L15 4.56l2.11 2.11C16.17 7 15.5 7.9 15.5 9c0 1.22.8 2.25 1.91 2.61l-.91 5.91c-.06.39.07.78.34 1.06.27.28.66.42 1.05.38l.11-.01c.71-.09 1.25-.69 1.25-1.41V11c1.1 0 2-.9 2-2 0-.55-.22-1.05-.58-1.41z" />
                </svg>
                {loading ? 'Salvando...' : 'Salvar Abastecimento'}
              </button>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}