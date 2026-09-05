import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVeiculos } from '../hooks/useVeiculos';
import { useMotoristas } from '../hooks/useMotoristas';
import { useAbastecimentos } from '../hooks/useAbastecimentos';
import Header from '../components/Header';
import Footer from '../components/Footer';
import GastosEconsumo from '../components/GastosEconsumo';
import HistoricoAbastecimento from '../components/HistoricoAbastecimento';
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Fuel, Plus, BarChart2, History } from 'lucide-react';

export default function GestaoAbastecimentoPage() {
  const navigate = useNavigate();
  const { veiculos, loading: loadingVeiculos } = useVeiculos();
  const { motoristas, loading: loadingMotoristas } = useMotoristas();
  const { abastecimentos, salvarAbastecimento, atualizarAbastecimento, excluirAbastecimento, loading } = useAbastecimentos();

  const listaVeiculos = Array.isArray(veiculos) ? veiculos : [];
  const listaMotoristas = Array.isArray(motoristas) ? motoristas : [];
  const listaAbastecimentos = Array.isArray(abastecimentos) ? abastecimentos : [];

  // Aba ativa para visualização Mobile ("lancar", "relatorios", "historico")
  const [abaAtivaMobile, setAbaAtivaMobile] = useState('lancar');

  // Estados do Calendário e Relatório
  const [dataSelecionadaCalendario, setDataSelecionadaCalendario] = useState(new Date());
  const [calendarioExpandido, setCalendarioExpandido] = useState(false);
  const [listaAbastecimentosDoDiaModal, setListaAbastecimentosDoDiaModal] = useState(null);
  const [veiculoFiltroRelatorio, setVeiculoFiltroRelatorio] = useState('');

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

  // Lógica do Calendário de Abastecimentos
  const anoAtual = dataSelecionadaCalendario.getFullYear();
  const mesAtual = dataSelecionadaCalendario.getMonth();
  const primeiroDiaMes = new Date(anoAtual, mesAtual, 1).getDay();
  const totalDiasMes = new Date(anoAtual, mesAtual + 1, 0).getDate();
  const nomesMeses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  const navegarMes = (e, direcao) => {
    e.stopPropagation();
    setDataSelecionadaCalendario(new Date(anoAtual, mesAtual + direcao, 1));
  };

  const obterAbastecimentosDoDia = (dia) => {
    const dataFormatada = `${anoAtual}-${String(mesAtual + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
    return listaAbastecimentos.filter((item) => {
      const dataItem = (item.dataAbastecimento || item.criadoEm || item.data || '').split('T')[0];
      return dataItem === dataFormatada;
    });
  };

  const totalAbastecimentosMes = listaAbastecimentos.filter((item) => {
    const dataItem = new Date(item.dataAbastecimento || item.criadoEm || item.data);
    return dataItem.getFullYear() === anoAtual && dataItem.getMonth() === mesAtual;
  }).length;

  // Cálculos do Relatório de Consumo (KM/L e Gastos)
  const abastecimentosFiltradosRelatorio = veiculoFiltroRelatorio 
    ? listaAbastecimentos.filter(a => {
        const aId = a.veiculoId?.$oid || a.veiculoId || a.veiculo_id;
        return String(aId) === String(veiculoFiltroRelatorio);
      })
    : listaAbastecimentos;

  const custoTotalGasto = abastecimentosFiltradosRelatorio.reduce((acc, curr) => acc + Number(curr.valorTotal || curr.valor || 0), 0);
  const litrosTotaisAbastecidos = abastecimentosFiltradosRelatorio.reduce((acc, curr) => acc + Number(curr.litros || 0), 0);

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
    setAbaAtivaMobile('lancar');
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
      mostrarToast('Abastecimento excluído com sucesso!', 'sucesso');
      if (editandoId === id) handleLimpar();
    } else {
      mostrarToast('Erro ao excluir abastecimento.', 'erro');
    }
    setItemExcluir(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.motorista) {
      mostrarToast('Por favor, selecione o motorista.', 'alerta');
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
        editandoId ? 'Abastecimento atualizado com sucesso!' : 'Abastecimento salvo com sucesso!',
        'sucesso'
      );
      handleLimpar();
      setAbaAtivaMobile('historico');
    } else {
      mostrarToast('Erro ao processar solicitação.', 'erro');
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
    <div className="min-h-screen flex flex-col justify-between bg-[#f8fafc] relative pb-20 md:pb-0">
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

      {/* Modal Abastecimentos do Dia */}
      {listaAbastecimentosDoDiaModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 no-print">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl border border-slate-200 p-6 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-slate-800 flex items-center gap-2 text-sm uppercase">
                Abastecimentos do Dia ({listaAbastecimentosDoDiaModal.length})
              </h3>
              <button onClick={() => setListaAbastecimentosDoDiaModal(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                ✕
              </button>
            </div>

            <div className="overflow-y-auto space-y-3 flex-1 pr-1">
              {listaAbastecimentosDoDiaModal.map((item, idx) => (
                <div key={idx} className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex justify-between items-center text-xs">
                  <div>
                    <span className="font-bold text-blue-900 block uppercase">{formatarNomeExibicao(item.modelo) || item.placa}</span>
                    <span className="text-slate-500">Motorista: {formatarNomeExibicao(item.motorista)} | KM: {item.kmAtual}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-slate-800 block">{item.litros} L</span>
                    <span className="text-emerald-600 font-bold">R$ {Number(item.valorTotal || 0).toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setListaAbastecimentosDoDiaModal(null)}
                className="bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold px-4 py-2 rounded-xl transition cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="flex-grow container mx-auto px-4 py-6 flex flex-col items-center gap-6">
        <div className="w-full max-w-7xl flex justify-between items-center">
          <button
            type="button"
            onClick={handleVoltarDashboard}
            className="flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-800 transition"
          >
            ← Voltar à Dashboard
          </button>
        </div>

        {/* NAVEGAÇÃO / ABAS EXCLUSIVAS PARA MOBILE */}
        <div className="w-full max-w-7xl flex md:hidden bg-slate-200/70 p-1 rounded-2xl gap-1">
          <button
            type="button"
            onClick={() => setAbaAtivaMobile('lancar')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition ${
              abaAtivaMobile === 'lancar'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Plus size={15} />
            <span>Lançar</span>
          </button>
          
          <button
            type="button"
            onClick={() => setAbaAtivaMobile('relatorios')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition ${
              abaAtivaMobile === 'relatorios'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart2 size={15} />
            <span>Relatórios</span>
          </button>

          <button
            type="button"
            onClick={() => setAbaAtivaMobile('historico')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition ${
              abaAtivaMobile === 'historico'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <History size={15} />
            <span>Histórico</span>
          </button>
        </div>

        {/* ESTRUTURA PRINCIPAL EM DUAS COLUNAS (DESKTOP) / ABAS (MOBILE) */}
        <div className="w-full max-w-7xl grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          
          {/* COLUNA ESQUERDA: Formulário de Lançamento */}
          <div className={`md:col-span-5 w-full bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden ${
            abaAtivaMobile === 'lancar' ? 'block' : 'hidden md:block'
          }`}>
            <div className="p-6 pb-2 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center shadow-md text-white">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19.77 7.23l.01-.01-3.72-3.72L15 4.56l2.11 2.11C16.17 7 15.5 7.9 15.5 9c0 1.22.8 2.25 1.91 2.61l-.91 5.91c-.06.39.07.78.34 1.06.27.28.66.42 1.05.38l.11-.01c.71-.09 1.25-.69 1.25-1.41V11c1.1 0 2-.9 2-2 0-.55-.22-1.05-.58-1.41zM18.5 9.5c-.28 0-.5-.22-.5-.5s.22-.5.5-.5.5.22.5.5-.22.5-.5.5zM12 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h7c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 10H5V8h7v5z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-base font-black text-slate-800 uppercase tracking-wide">
                    {editandoId ? 'Editar Abastecimento' : 'Novo Abastecimento'}
                  </h1>
                  <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                    Controle de Frota
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-[11px] font-bold tracking-wider text-slate-500 uppercase mb-1">
                  Selecione o Veículo <span className="text-blue-600">*</span>
                </label>
                <select
                  value={form.veiculoId}
                  onChange={handleSelectVeiculo}
                  required
                  disabled={loadingVeiculos}
                  className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
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

              <div>
                <label className="block text-[11px] font-bold tracking-wider text-slate-500 uppercase mb-1">
                  Nome do Motorista <span className="text-blue-600">*</span>
                </label>
                <select
                  value={form.motorista}
                  onChange={(e) => setForm({ ...form, motorista: e.target.value.toLowerCase() })}
                  required
                  disabled={loadingMotoristas}
                  className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
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
                <label className="block text-[11px] font-bold tracking-wider text-slate-500 uppercase mb-1">
                  Data e Hora do Abastecimento <span className="text-blue-600">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={form.dataAbastecimento}
                  onChange={(e) => setForm({ ...form, dataAbastecimento: e.target.value })}
                  required
                  className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold tracking-wider text-slate-500 uppercase mb-1">
                    KM Atual <span className="text-blue-600">*</span>
                  </label>
                  <input
                    type="number"
                    placeholder="20000"
                    value={form.kmAtual}
                    onChange={(e) => setForm({ ...form, kmAtual: e.target.value })}
                    required
                    className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition placeholder:text-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold tracking-wider text-slate-500 uppercase mb-1">
                    Combustível
                  </label>
                  <select
                    value={form.tipoCombustivel}
                    onChange={(e) => setForm({ ...form, tipoCombustivel: e.target.value.toLowerCase() })}
                    className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  >
                    <option value="gasolina">Gasolina</option>
                    <option value="etanol">Etanol</option>
                    <option value="diesel">Diesel</option>
                    <option value="gnv">GNV</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold tracking-wider text-slate-500 uppercase mb-1">
                    Litros <span className="text-blue-600">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={form.litros}
                    onChange={(e) => setForm({ ...form, litros: e.target.value })}
                    required
                    className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition placeholder:text-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold tracking-wider text-slate-500 uppercase mb-1">
                    Valor Total (R$) <span className="text-blue-600">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={form.valorTotal}
                    onChange={(e) => setForm({ ...form, valorTotal: e.target.value })}
                    required
                    className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div className="flex items-center bg-[#f8fafc] p-3 rounded-xl border border-slate-200">
                <input
                  type="checkbox"
                  id="tanqueCheio"
                  checked={form.tanqueCheio}
                  onChange={(e) => setForm({ ...form, tanqueCheio: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="tanqueCheio" className="ml-2 text-[11px] font-bold text-slate-700 cursor-pointer select-none">
                  Tanque Cheio (Cálculo preciso KM/L)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                {editandoId && (
                  <button
                    type="button"
                    onClick={handleLimpar}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-600 font-bold text-xs hover:bg-slate-200 transition"
                  >
                    Cancelar
                  </button>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-5 py-3 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition shadow-md shadow-blue-600/20 disabled:opacity-50"
                >
                  {loading ? 'Salvando...' : editandoId ? 'Atualizar Abastecimento' : 'Salvar Abastecimento'}
                </button>
              </div>
            </form>
          </div>

          {/* COLUNA DIREITA: Calendário, Painel de Consumo e Histórico */}
          <div className={`md:col-span-7 w-full flex flex-col gap-6 ${
            abaAtivaMobile === 'relatorios' || abaAtivaMobile === 'historico' ? 'block' : 'hidden md:flex'
          }`}>
            
            {/* 1. Calendário de Abastecimentos */}
            <div className="w-full bg-white rounded-2xl shadow-xs border border-slate-200 no-print transition-all duration-300 overflow-hidden">
              <div 
                onClick={() => setCalendarioExpandido(!calendarioExpandido)}
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50/80 transition select-none"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 text-blue-700 p-2 rounded-xl">
                    <Fuel size={18} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs font-black uppercase text-slate-800">Calendário</h3>
                      <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-100">
                        {totalAbastecimentosMes} em {nomesMeses[mesAtual]}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      {calendarioExpandido ? 'Recolher calendário' : 'Expandir para ver dias'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {calendarioExpandido && (
                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                      <button
                        type="button"
                        onClick={(e) => navegarMes(e, -1)}
                        className="p-1 hover:bg-white rounded-lg text-slate-600 transition cursor-pointer"
                      >
                        <ChevronLeft size={14} />
                      </button>
                      <span className="text-[11px] font-black uppercase text-slate-700 px-2 min-w-[90px] text-center">
                        {nomesMeses[mesAtual]} {anoAtual}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => navegarMes(e, 1)}
                        className="p-1 hover:bg-white rounded-lg text-slate-600 transition cursor-pointer"
                      >
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  )}

                  <div className="bg-slate-100 p-2 rounded-xl text-slate-600">
                    {calendarioExpandido ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </div>
              </div>

              {calendarioExpandido && (
                <div className="px-5 pb-5 pt-2 border-t border-slate-100 space-y-3">
                  <p className="text-[11px] text-slate-500">
                    Dias em azul possuem registros. Clique neles para ver detalhes.
                  </p>

                  <div className="grid grid-cols-7 gap-1.5 text-center">
                    {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((dia) => (
                      <div key={dia} className="text-[10px] font-black uppercase text-slate-400 py-1">
                        {dia}
                      </div>
                    ))}

                    {Array.from({ length: primeiroDiaMes }).map((_, index) => (
                      <div key={`empty-${index}`} className="h-9 bg-slate-50/40 rounded-lg" />
                    ))}

                    {Array.from({ length: totalDiasMes }).map((_, index) => {
                      const dia = index + 1;
                      const abastecimentosDoDia = obterAbastecimentosDoDia(dia);
                      const possuiAbastecimento = abastecimentosDoDia.length > 0;

                      return (
                        <div
                          key={dia}
                          className={`h-10 border rounded-xl p-1 flex flex-col justify-between items-center transition ${
                            possuiAbastecimento
                              ? 'bg-blue-50/70 border-blue-300 hover:bg-blue-100 cursor-pointer shadow-xs'
                              : 'bg-white border-slate-100 text-slate-600'
                          }`}
                          onClick={() => {
                            if (possuiAbastecimento) {
                              setListaAbastecimentosDoDiaModal(abastecimentosDoDia);
                            }
                          }}
                        >
                          <span className="text-xs font-bold text-slate-700">{dia}</span>
                          {possuiAbastecimento && (
                            <div className="flex items-center gap-0.5 mb-0.5">
                              <span className="w-2 h-2 bg-blue-600 rounded-full inline-block" title={`${abastecimentosDoDia.length} abastecimento(s)`} />
                              {abastecimentosDoDia.length > 1 && (
                                <span className="text-[8px] font-black text-blue-800">x{abastecimentosDoDia.length}</span>
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

            {/* 2. Painel de Relatório e Análise de Consumo */}
            <div className="w-full">
              <GastosEconsumo
                listaVeiculos={listaVeiculos}
                veiculoFiltroRelatorio={veiculoFiltroRelatorio}
                setVeiculoFiltroRelatorio={setVeiculoFiltroRelatorio}
                custoTotalGasto={custoTotalGasto}
                litrosTotaisAbastecidos={litrosTotaisAbastecidos}
                formatarNomeExibicao={formatarNomeExibicao}
              />
            </div>

            {/* 3. Histórico de Abastecimentos */}
            <div className="w-full">
              <HistoricoAbastecimento
                abastecimentosPaginados={abastecimentosPaginados}
                totalAbastecimentos={listaAbastecimentos.length}
                paginaAtual={paginaAtual}
                totalPaginas={totalPaginas}
                onMudarPagina={setPaginaAtual}
                onEditar={handleEditar}
                onExcluir={setItemExcluir}
                formatarNomeExibicao={formatarNomeExibicao}
                formatarDataExibicao={formatarDataExibicao}
              />
            </div>

          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}