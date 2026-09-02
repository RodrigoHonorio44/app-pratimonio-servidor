import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVeiculos } from '../hooks/useVeiculos';
import { useMotoristas } from '../hooks/useMotoristas';
import { useAbastecimentos } from '../hooks/useAbastecimentos';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function GestaoAbastecimentoPage() {
  const navigate = useNavigate();
  const { veiculos, loading: loadingVeiculos } = useVeiculos();
  const { motoristas, loading: loadingMotoristas } = useMotoristas();
  const { abastecimentos, salvarAbastecimento, atualizarAbastecimento, excluirAbastecimento, loading } = useAbastecimentos();

  const listaVeiculos = Array.isArray(veiculos) ? veiculos : [];
  const listaMotoristas = Array.isArray(motoristas) ? motoristas : [];
  const listaAbastecimentos = Array.isArray(abastecimentos) ? abastecimentos : [];

  const obterDataHoraAtual = () => {
    const agora = new Date();
    const tzOffset = agora.getTimezoneOffset() * 60000;
    return new Date(agora.getTime() - tzOffset).toISOString().slice(0, 16);
  };

  const estadoInicial = {
    id: null,
    veiculoId: '',
    placa: '',
    modelo: '',
    motorista: '',
    dataAbastecimento: obterDataHoraAtual(),
    kmAtual: '',
    tipoCombustivel: 'gasolina',
    litros: '',
    valorTotal: '',
    tanqueCheio: true
  };

  const [form, setForm] = useState(estadoInicial);
  const [editandoId, setEditandoId] = useState(null);
  const [toast, setToast] = useState({ exibe: false, mensagem: '', tipo: 'sucesso' });

  // Estados de Paginação
  const [paginaAtual, setPaginaAtual] = useState(1);
  const itensPorPagina = 5;

  // Estado Modal de Exclusão
  const [itemExcluir, setItemExcluir] = useState(null);

  const mostrarToast = (mensagem, tipo = 'sucesso') => {
    setToast({ exibe: true, mensagem, tipo });
    setTimeout(() => {
      setToast({ exibe: false, mensagem: '', tipo: 'sucesso' });
    }, 4000);
  };

  const formatarNomeExibicao = (str) => {
    if (!str) return '';
    return str
      .toLowerCase()
      .split(' ')
      .map((palavra) => palavra.charAt(0).toUpperCase() + palavra.slice(1))
      .join(' ');
  };

  const formatarDataExibicao = (dataISO) => {
    if (!dataISO) return '-';
    const data = new Date(dataISO);
    if (isNaN(data.getTime())) return '-';
    return data.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleSelectVeiculo = (e) => {
    const id = e.target.value;
    const veiculo = listaVeiculos.find((v) => {
      const vId = v._id?.$oid || v._id || v.id;
      return String(vId) === String(id);
    });

    if (veiculo) {
      const historicoVeiculo = listaAbastecimentos.filter((a) => {
        const aVeiculoId = a.veiculoId?.$oid || a.veiculoId || a.veiculo_id;
        return String(aVeiculoId) === String(id);
      });

      let kmReferencia = '';

      if (historicoVeiculo.length > 0) {
        const historicoOrdenado = [...historicoVeiculo].sort((a, b) => {
          const dataA = new Date(a.dataAbastecimento || a.criadoEm || a.data || 0);
          const dataB = new Date(b.dataAbastecimento || b.criadoEm || b.data || 0);
          return dataB - dataA;
        });

        kmReferencia = historicoOrdenado[0]?.kmAtual || '';
      } else {
        kmReferencia = veiculo.kmInicial || veiculo.kmAtual || '';
      }

      setForm((prev) => ({
        ...prev,
        veiculoId: id,
        placa: veiculo.placa ? veiculo.placa.toLowerCase() : '',
        modelo: veiculo.modelo ? veiculo.modelo.toLowerCase() : '',
        kmAtual: kmReferencia
      }));
    } else {
      setForm((prev) => ({ ...prev, veiculoId: '', placa: '', modelo: '', kmAtual: '' }));
    }
  };

  const handleLimpar = () => {
    setForm({
      ...estadoInicial,
      dataAbastecimento: obterDataHoraAtual()
    });
    setEditandoId(null);
  };

  const handleVoltarDashboard = () => {
    navigate('/dashboard');
  };

  const handleEditar = (item) => {
    const id = item._id?.$oid || item._id || item.id;
    let dataVal = obterDataHoraAtual();

    if (item.dataAbastecimento) {
      const d = new Date(item.dataAbastecimento);
      if (!isNaN(d.getTime())) {
        const tzOffset = d.getTimezoneOffset() * 60000;
        dataVal = new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
      }
    }

    setForm({
      id,
      veiculoId: item.veiculoId?.$oid || item.veiculoId || item.veiculo_id || '',
      placa: item.placa ? item.placa.toLowerCase() : '',
      modelo: item.modelo ? item.modelo.toLowerCase() : '',
      motorista: item.motorista ? item.motorista.toLowerCase() : '',
      dataAbastecimento: dataVal,
      kmAtual: item.kmAtual || '',
      tipoCombustivel: item.tipoCombustivel ? item.tipoCombustivel.toLowerCase() : 'gasolina',
      litros: item.litros || '',
      valorTotal: item.valorTotal || '',
      tanqueCheio: item.tanqueCheio !== undefined ? item.tanqueCheio : true
    });

    setEditandoId(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleConfirmarExcluir = async () => {
    if (!itemExcluir) return;
    const id = itemExcluir._id?.$oid || itemExcluir._id || itemExcluir.id;

    let sucesso = false;
    if (excluirAbastecimento) {
      sucesso = await excluirAbastecimento(id);
    }

    if (sucesso) {
      mostrarToast('abastecimento excluído com sucesso!', 'sucesso');
      if (editandoId === id) handleLimpar();
    } else {
      mostrarToast('erro ao excluir abastecimento.', 'erro');
    }
    setItemExcluir(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.motorista) {
      mostrarToast('por favor, selecione o motorista.', 'alerta');
      return;
    }

    const payloadNormalizado = {
      ...form,
      placa: form.placa ? form.placa.toLowerCase() : '',
      modelo: form.modelo ? form.modelo.toLowerCase() : '',
      motorista: form.motorista ? form.motorista.toLowerCase() : '',
      tipoCombustivel: form.tipoCombustivel ? form.tipoCombustivel.toLowerCase() : 'gasolina'
    };

    let sucesso = false;

    if (editandoId && atualizarAbastecimento) {
      sucesso = await atualizarAbastecimento(editandoId, payloadNormalizado);
    } else {
      sucesso = await salvarAbastecimento(payloadNormalizado);
    }

    if (sucesso) {
      mostrarToast(
        editandoId ? 'abastecimento atualizado com sucesso!' : 'abastecimento salvo com sucesso!',
        'sucesso'
      );
      handleLimpar();
    } else {
      mostrarToast('erro ao processar solicitação.', 'erro');
    }
  };

  // Lógica de Paginação
  const historicoOrdenado = [...listaAbastecimentos].sort((a, b) => {
    const dataA = new Date(a.dataAbastecimento || a.criadoEm || a.data || 0);
    const dataB = new Date(b.dataAbastecimento || b.criadoEm || b.data || 0);
    return dataB - dataA;
  });

  const totalPaginas = Math.ceil(historicoOrdenado.length / itensPorPagina) || 1;
  const indiceInicial = (paginaAtual - 1) * itensPorPagina;
  const abastecimentosPaginados = historicoOrdenado.slice(indiceInicial, indiceInicial + itensPorPagina);

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#f8fafc] relative">
      <Header />

      {/* Toast Notification */}
      {toast.exibe && (
        <div className="fixed top-6 right-6 z-50 animate-in slide-in-from-top-2 duration-300">
          <div
            className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl text-white font-medium text-xs border ${
              toast.tipo === 'sucesso'
                ? 'bg-emerald-600 border-emerald-500 shadow-emerald-600/20'
                : toast.tipo === 'alerta'
                ? 'bg-amber-500 border-amber-400 shadow-amber-500/20'
                : 'bg-rose-600 border-rose-500 shadow-rose-600/20'
            }`}
          >
            {toast.tipo === 'sucesso' && (
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
              </svg>
            )}
            {toast.tipo === 'alerta' && (
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            )}
            {toast.tipo === 'erro' && (
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            <span>{toast.mensagem}</span>
          </div>
        </div>
      )}

      {/* Modal Confirmar Exclusão */}
      {itemExcluir && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100">
            <h3 className="text-lg font-black text-slate-800 uppercase tracking-wide mb-2">
              Confirmar Exclusão
            </h3>
            <p className="text-sm text-slate-600 mb-6">
              Deseja realmente remover o registro de abastecimento do veículo{' '}
              <span className="font-bold text-slate-800">
                {formatarNomeExibicao(itemExcluir.modelo)} - {itemExcluir.placa?.toUpperCase()}
              </span>?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setItemExcluir(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-600 font-bold text-xs hover:bg-slate-200 transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarExcluir}
                className="px-5 py-2.5 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 transition shadow-md shadow-rose-600/20"
              >
                Excluir Registro
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="flex-grow container mx-auto px-4 py-8 flex flex-col items-center gap-8">
        <div className="w-full max-w-4xl flex justify-start">
          <button
            type="button"
            onClick={handleVoltarDashboard}
            className="flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-800 transition"
          >
            ← Voltar à Dashboard
          </button>
        </div>

        {/* Form Container */}
        <div className="w-full max-w-4xl bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
          <div className="p-6 pb-2 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center shadow-md text-white">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19.77 7.23l.01-.01-3.72-3.72L15 4.56l2.11 2.11C16.17 7 15.5 7.9 15.5 9c0 1.22.8 2.25 1.91 2.61l-.91 5.91c-.06.39.07.78.34 1.06.27.28.66.42 1.05.38l.11-.01c.71-.09 1.25-.69 1.25-1.41V11c1.1 0 2-.9 2-2 0-.55-.22-1.05-.58-1.41zM18.5 9.5c-.28 0-.5-.22-.5-.5s.22-.5.5-.5.5.22.5.5-.22.5-.5.5zM12 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h7c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 10H5V8h7v5z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-black text-slate-800 uppercase tracking-wide">
                  {editandoId ? 'Editar Abastecimento' : 'Lançamento de Abastecimento'}
                </h1>
                <p className="text-xs font-bold text-slate-400 tracking-wider uppercase">
                  Registro de Consumo e Controle da Frota
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleVoltarDashboard}
              className="px-4 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition border border-slate-200 flex items-center gap-1"
            >
              ✕ Fechar
            </button>
          </div>

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
                      {formatarNomeExibicao(v.marca)} {formatarNomeExibicao(v.modelo)} — PLACA: {v.placa?.toUpperCase()}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold tracking-wider text-slate-500 uppercase mb-1.5">
                  Nome do Motorista <span className="text-blue-600">*</span>
                </label>
                <select
                  value={form.motorista}
                  onChange={(e) => setForm({ ...form, motorista: e.target.value.toLowerCase() })}
                  required
                  disabled={loadingMotoristas}
                  className="w-full bg-[#f8fafc] border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                >
                  <option value="">
                    {loadingMotoristas ? 'Carregando motoristas...' : 'Selecione o motorista...'}
                  </option>
                  {listaMotoristas.map((m) => {
                    const id = m._id?.$oid || m._id || m.id;
                    return (
                      <option key={id} value={m.nome ? m.nome.toLowerCase() : ''}>
                        {formatarNomeExibicao(m.nome)} {m.matricula ? `— Matrícula: ${m.matricula.toUpperCase()}` : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold tracking-wider text-slate-500 uppercase mb-1.5">
                  Data e Hora do Abastecimento <span className="text-blue-600">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={form.dataAbastecimento}
                  onChange={(e) => setForm({ ...form, dataAbastecimento: e.target.value })}
                  required
                  className="w-full bg-[#f8fafc] border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>
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
                  onChange={(e) => setForm({ ...form, tipoCombustivel: e.target.value.toLowerCase() })}
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
                {editandoId ? 'Cancelar Edição' : 'Limpar'}
              </button>

              <button
                type="submit"
                disabled={loading}
                className="w-2/3 bg-blue-600 text-white py-3 rounded-xl text-sm font-bold hover:bg-blue-700 shadow-md shadow-blue-500/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19.77 7.23l.01-.01-3.72-3.72L15 4.56l2.11 2.11C16.17 7 15.5 7.9 15.5 9c0 1.22.8 2.25 1.91 2.61l-.91 5.91c-.06.39.07.78.34 1.06.27.28.66.42 1.05.38l.11-.01c.71-.09 1.25-.69 1.25-1.41V11c1.1 0 2-.9 2-2 0-.55-.22-1.05-.58-1.41zM18.5 9.5c-.28 0-.5-.22-.5-.5s.22-.5.5-.5.5.22.5.5-.22.5-.5.5zM12 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h7c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 10H5V8h7v5z" />
                </svg>
                {loading ? 'Salvando...' : editandoId ? 'Atualizar Abastecimento' : 'Salvar Abastecimento'}
              </button>
            </div>
          </form>
        </div>

        {/* Histórico / Tabela com Paginação */}
        <div className="w-full max-w-4xl bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-black text-slate-800 uppercase tracking-wide">
                Histórico de Abastecimentos
              </h2>
              <p className="text-xs font-bold text-slate-400 tracking-wider uppercase">
                Listagem completa dos últimos registros
              </p>
            </div>
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
              Total: {historicoOrdenado.length}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-wider bg-slate-50/50">
                  <th className="py-3 px-4">Data / Hora</th>
                  <th className="py-3 px-4">Veículo</th>
                  <th className="py-3 px-4">Motorista</th>
                  <th className="py-3 px-4">KM</th>
                  <th className="py-3 px-4">Litros</th>
                  <th className="py-3 px-4">Valor Total</th>
                  <th className="py-3 px-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {abastecimentosPaginados.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-slate-400 font-semibold">
                      Nenhum abastecimento registrado até o momento.
                    </td>
                  </tr>
                ) : (
                  abastecimentosPaginados.map((item) => {
                    const id = item._id?.$oid || item._id || item.id;
                    return (
                      <tr key={id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3.5 px-4 font-bold text-slate-600">
                          {formatarDataExibicao(item.dataAbastecimento || item.criadoEm || item.data)}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-800 uppercase">{formatarNomeExibicao(item.modelo) || '-'}</div>
                          <div className="text-[10px] font-bold text-blue-600 uppercase">{item.placa || '-'}</div>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-800">
                          {formatarNomeExibicao(item.motorista)}
                        </td>
                        <td className="py-3.5 px-4">{item.kmAtual ? `${item.kmAtual} KM` : '-'}</td>
                        <td className="py-3.5 px-4">{item.litros ? `${item.litros} L` : '-'}</td>
                        <td className="py-3.5 px-4 font-bold text-emerald-600">
                          {item.valorTotal ? `R$ ${Number(item.valorTotal).toFixed(2)}` : '-'}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleEditar(item)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                              title="Editar Abastecimento"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              onClick={() => setItemExcluir(item)}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                              title="Excluir Abastecimento"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Paginação */}
          {totalPaginas > 1 && (
            <div className="flex items-center justify-between pt-4 mt-2 border-t border-slate-100 text-xs font-semibold text-slate-500">
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
      </main>

      <Footer />
    </div>
  );
}