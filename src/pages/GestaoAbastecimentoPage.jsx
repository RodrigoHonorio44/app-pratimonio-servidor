import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVeiculos } from '../hooks/useVeiculos';
import { useMotoristas } from '../hooks/useMotoristas';
import { useAbastecimentos } from '../hooks/useAbastecimentos';
import Header from '../components/Header';
import Footer from '../components/Footer';
import HistoricoAbastecimento from '../components/HistoricoAbastecimento';
import FormularioAbastecimento from '../components/FormularioAbastecimento';
import RelatorioAbastecimentos from '../components/RelatorioAbastecimentos'; // <- Importação do novo componente
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Fuel, Plus, BarChart2, History } from 'lucide-react';

export default function GestaoAbastecimentoPage() {
  const navigate = useNavigate();
  const { veiculos, loading: loadingVeiculos } = useVeiculos();
  const { motoristas, loading: loadingMotoristas } = useMotoristas();
  const { abastecimentos, salvarAbastecimento, atualizarAbastecimento, excluirAbastecimento, loading } = useAbastecimentos();

  const listaVeiculos = Array.isArray(veiculos) ? veiculos : [];
  const listaMotoristas = Array.isArray(motoristas) ? motoristas : [];
  const listaAbastecimentos = Array.isArray(abastecimentos) ? abastecimentos : [];

  const [abaAtivaMobile, setAbaAtivaMobile] = useState('lancar');
  const [dataSelecionadaCalendario, setDataSelecionadaCalendario] = useState(new Date());
  const [calendarioExpandido, setCalendarioExpandido] = useState(false);
  const [listaAbastecimentosDoDiaModal, setListaAbastecimentosDoDiaModal] = useState(null);

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
  const [paginaAtual, setPaginaAtual] = useState(1);
  const itensPorPagina = 5;
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
    setForm({ ...estadoInicial, dataAbastecimento: obterDataHoraAtual() });
    setEditandoId(null);
  };

  const handleVoltarDashboard = () => navigate('/dashboard');

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
    let sucesso = excluirAbastecimento ? await excluirAbastecimento(id) : false;

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

    let sucesso = editandoId && atualizarAbastecimento 
      ? await atualizarAbastecimento(editandoId, payloadNormalizado)
      : await salvarAbastecimento(payloadNormalizado);

    if (sucesso) {
      mostrarToast(editandoId ? 'Abastecimento atualizado com sucesso!' : 'Abastecimento salvo com sucesso!', 'sucesso');
      handleLimpar();
      setAbaAtivaMobile('historico');
    } else {
      mostrarToast('Erro ao processar solicitação.', 'erro');
    }
  };

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
          <div className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl text-white font-medium text-xs border ${
            toast.tipo === 'sucesso' ? 'bg-emerald-600 border-emerald-500 shadow-emerald-600/20' : 
            toast.tipo === 'alerta' ? 'bg-amber-500 border-amber-400 shadow-amber-500/20' : 'bg-rose-600 border-rose-500 shadow-rose-600/20'
          }`}>
            <span>{toast.mensagem}</span>
          </div>
        </div>
      )}

      {/* Modal Exclusão */}
      {itemExcluir && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100">
            <h3 className="text-lg font-black text-slate-800 uppercase tracking-wide mb-2">Confirmar Exclusão</h3>
            <p className="text-sm text-slate-600 mb-6">
              Deseja realmente remover o registro de abastecimento do veículo{' '}
              <span className="font-bold text-slate-800">{formatarNomeExibicao(itemExcluir.modelo)} - {itemExcluir.placa?.toUpperCase()}</span>?
            </p>
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => setItemExcluir(null)} className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-600 font-bold text-xs hover:bg-slate-200 transition">Cancelar</button>
              <button type="button" onClick={handleConfirmarExcluir} className="px-5 py-2.5 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 transition shadow-md shadow-rose-600/20">Excluir Registro</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Abastecimentos do Dia */}
      {listaAbastecimentosDoDiaModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 no-print">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl border border-slate-200 p-6 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-slate-800 flex items-center gap-2 text-sm uppercase">Abastecimentos do Dia ({listaAbastecimentosDoDiaModal.length})</h3>
              <button onClick={() => setListaAbastecimentosDoDiaModal(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">✕</button>
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
              <button type="button" onClick={() => setListaAbastecimentosDoDiaModal(null)} className="bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold px-4 py-2 rounded-xl transition cursor-pointer">Fechar</button>
            </div>
          </div>
        </div>
      )}

      <main className="flex-grow container mx-auto px-4 py-6 flex flex-col items-center gap-6">
        <div className="w-full max-w-7xl flex justify-between items-center">
          <button type="button" onClick={handleVoltarDashboard} className="flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-800 transition">← Voltar à Dashboard</button>
        </div>

        {/* Abas Mobile */}
        <div className="w-full max-w-7xl flex md:hidden bg-slate-200/70 p-1 rounded-2xl gap-1">
          <button type="button" onClick={() => setAbaAtivaMobile('lancar')} className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition ${abaAtivaMobile === 'lancar' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600'}`}><Plus size={15} /><span>Lançar</span></button>
          <button type="button" onClick={() => setAbaAtivaMobile('relatorios')} className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition ${abaAtivaMobile === 'relatorios' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600'}`}><BarChart2 size={15} /><span>Relatórios</span></button>
          <button type="button" onClick={() => setAbaAtivaMobile('historico')} className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition ${abaAtivaMobile === 'historico' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600'}`}><History size={15} /><span>Histórico</span></button>
        </div>

        <div className="w-full max-w-7xl grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          
          {/* Formulário (Esquerda) */}
          <div className={`md:col-span-5 w-full ${abaAtivaMobile === 'lancar' ? 'block' : 'hidden md:block'}`}>
            <FormularioAbastecimento
              form={form}
              setForm={setForm}
              editandoId={editandoId}
              loading={loading}
              loadingVeiculos={loadingVeiculos}
              loadingMotoristas={loadingMotoristas}
              listaVeiculos={listaVeiculos}
              listaMotoristas={listaMotoristas}
              handleSelectVeiculo={handleSelectVeiculo}
              handleLimpar={handleLimpar}
              handleSubmit={handleSubmit}
              formatarNomeExibicao={formatarNomeExibicao}
            />
          </div>

          {/* Painel Geral (Direita) */}
          <div className={`md:col-span-7 w-full flex flex-col gap-6 ${abaAtivaMobile === 'relatorios' || abaAtivaMobile === 'historico' ? 'block' : 'hidden md:flex'}`}>
            
            {/* Calendário */}
            <div className="w-full bg-white rounded-2xl shadow-xs border border-slate-200 no-print overflow-hidden">
              <div onClick={() => setCalendarioExpandido(!calendarioExpandido)} className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition select-none">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 text-blue-700 p-2 rounded-xl"><Fuel size={18} /></div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs font-black uppercase text-slate-800">Calendário</h3>
                      <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-100">{totalAbastecimentosMes} em {nomesMeses[mesAtual]}</span>
                    </div>
                    <p className="text-[11px] text-slate-400">{calendarioExpandido ? 'Recolher' : 'Expandir'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {calendarioExpandido && (
                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                      <button type="button" onClick={(e) => navegarMes(e, -1)} className="p-1 hover:bg-white rounded-lg text-slate-600 transition"><ChevronLeft size={14} /></button>
                      <span className="text-[11px] font-black uppercase text-slate-700 px-2 min-w-[90px] text-center">{nomesMeses[mesAtual]} {anoAtual}</span>
                      <button type="button" onClick={(e) => navegarMes(e, 1)} className="p-1 hover:bg-white rounded-lg text-slate-600 transition"><ChevronRight size={14} /></button>
                    </div>
                  )}
                  <div className="bg-slate-100 p-2 rounded-xl text-slate-600">{calendarioExpandido ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</div>
                </div>
              </div>

              {calendarioExpandido && (
                <div className="px-5 pb-5 pt-2 border-t border-slate-100 space-y-3">
                  <div className="grid grid-cols-7 gap-1.5 text-center">
                    {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((dia) => (
                      <div key={dia} className="text-[10px] font-black uppercase text-slate-400 py-1">{dia}</div>
                    ))}
                    {Array.from({ length: primeiroDiaMes }).map((_, index) => (
                      <div key={`empty-${index}`} className="h-9 bg-slate-50/40 rounded-lg" />
                    ))}
                    {Array.from({ length: totalDiasMes }).map((_, index) => {
                      const dia = index + 1;
                      const abastecimentosDoDia = obterAbastecimentosDoDia(dia);
                      const possuiAbastecimento = abastecimentosDoDia.length > 0;
                      return (
                        <div key={dia} className={`h-10 border rounded-xl p-1 flex flex-col justify-between items-center transition ${possuiAbastecimento ? 'bg-blue-50/70 border-blue-300 hover:bg-blue-100 cursor-pointer shadow-xs' : 'bg-white border-slate-100 text-slate-600'}`} onClick={() => { if (possuiAbastecimento) setListaAbastecimentosDoDiaModal(abastecimentosDoDia); }}>
                          <span className="text-xs font-bold text-slate-700">{dia}</span>
                          {possuiAbastecimento && (
                            <div className="flex items-center gap-0.5 mb-0.5">
                              <span className="w-2 h-2 bg-blue-600 rounded-full inline-block" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Relatório Avançado Substituindo o Antigo Painel */}
            <div className="w-full">
              <RelatorioAbastecimentos abastecimentos={listaAbastecimentos} />
            </div>

            {/* Histórico Paginado */}
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