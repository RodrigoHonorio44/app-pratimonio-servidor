import React, { useState } from "react";
import {
  History,
  Calendar,
  Building2,
  MapPin,
  Printer,
  CheckSquare,
  Square,
  ArrowLeft,
  Trash2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useHistoricoVistoria } from "../hooks/useHistoricoVistoria";
import CalendarioChecklists from "../components/CalendarioChecklists";
import ModalChecklistFrota from "../components/ModalChecklistFrota";
import { imprimirVistoriaHistorico } from "../components/imprimirVistoriaHistorico";

const NOMES_MESES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"
];

export default function HistoricoVistoria() {
  const navigate = useNavigate();
  const {
    vistoriasFiltradas = [],
    loading,
    filtroUnidade,
    setFiltroUnidade,
    filtroSetor,
    setFiltroSetor,
    filtroDataInicio,
    setFiltroDataInicio,
    filtroDataFim,
    setFiltroDataFim,
    selecionadas = [],
    toggleSelecionar,
    selecionarTodas,
    vistoriaAtiva,
    setVistoriaAtiva,
    excluirVistoria,
  } = useHistoricoVistoria();

  const [calendarioExpandido, setCalendarioExpandido] = useState(false);
  const [dataCalendario, setDataCalendario] = useState(new Date());
  const [listaChecklistsDoDiaModal, setListaChecklistsDoDiaModal] = useState(null);

  const anoAtual = dataCalendario.getFullYear();
  const mesAtual = dataCalendario.getMonth();

  const navegarMes = (e, direcao) => {
    e.stopPropagation();
    setDataCalendario((prev) => new Date(prev.getFullYear(), prev.getMonth() + direcao, 1));
  };

  const primeiroDiaMes = new Date(anoAtual, mesAtual, 1).getDay();
  const totalDiasMes = new Date(anoAtual, mesAtual + 1, 0).getDate();

  const getIdVistoria = (v) => v?.id || v?._id?.$oid || v?._id;

  const extrairAnoMesDia = (v) => {
    const dataStr = v.data || v.dataHoraInicio || v.dataHora || (v.criadoEm && v.criadoEm.$date);
    if (!dataStr) return null;

    if (typeof dataStr === 'string' && dataStr.includes('-')) {
      const [ano, mes, dia] = dataStr.split('T')[0].split('-').map(Number);
      return { ano, mes: mes - 1, dia };
    }

    const d = new Date(dataStr);
    if (!isNaN(d.getTime())) {
      return { ano: d.getFullYear(), mes: d.getMonth(), dia: d.getDate() };
    }
    return null;
  };

  const obterChecklistsDoDia = (dia) => {
    return vistoriasFiltradas.filter((v) => {
      const dataObj = extrairAnoMesDia(v);
      if (!dataObj) return false;
      return (
        dataObj.dia === dia &&
        dataObj.mes === mesAtual &&
        dataObj.ano === anoAtual
      );
    });
  };

  const totalChecklistsMes = vistoriasFiltradas.filter((v) => {
    const dataObj = extrairAnoMesDia(v);
    if (!dataObj) return false;
    return (
      dataObj.mes === mesAtual &&
      dataObj.ano === anoAtual
    );
  }).length;

  const handleSelecionarDiaDoCalendario = (dataString, vistoriasDoDia) => {
    if (!vistoriasDoDia || vistoriasDoDia.length === 0) {
      toast.error("nenhuma vistoria neste dia.");
      return;
    }

    const vistoriasCompletas = vistoriasDoDia.map(v => ({
      ...v,
      id: getIdVistoria(v),
      placa: v.placa || v.veiculo?.placa || "n/a",
      modelo: v.modelo || v.veiculo?.modelo || "veículo",
      marca: v.marca || v.veiculo?.marca || "",
      ano: v.ano || v.anoModelo || v.veiculo?.ano || "2026",
      cor: v.cor || v.veiculo?.cor || "não informada",
      condutor: v.condutor || v.motorista || v.responsavel || "não informado",
      km: v.km || v.quilometragem || v.kmAtual || "0",
      combustivel: v.combustivel || "1/2",
      crlv: v.crlv || "sim",
      data: v.data || (v.dataHoraInicio ? v.dataHoraInicio.split('T')[0] : dataString),
      hora: v.hora || (v.dataHoraInicio ? new Date(v.dataHoraInicio).toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' }) : "00:00"),
      acessorios: v.acessorios || {},
      itensInspecao: v.itensInspecao || v.itensAvaliados || {},
      obs: v.obs || v.observacoes || "nenhuma observação registrada.",
      nomeResponsavel: v.nomeResponsavel || v.avaliador || v.vistoriador || v.motorista || v.condutor || v.responsavel || "",
      tipoResponsavel: v.tipoResponsavel || v.cargoResponsavel || ""
    }));

    setListaChecklistsDoDiaModal(vistoriasCompletas);
  };

  const vistoriasParaImprimir = vistoriasFiltradas.filter((v) =>
    selecionadas.includes(getIdVistoria(v))
  );

  // Tratamento totalmente isolado para impressão em lote via popups sequenciais
  const handleImprimirLote = () => {
    if (vistoriasParaImprimir.length === 0) {
      toast.error("selecione ao menos uma vistoria para gerar as ordens.");
      return;
    }

    vistoriasParaImprimir.forEach((v, index) => {
      setTimeout(() => {
        const itemNormalizado = {
          ...v,
          id: getIdVistoria(v),
          placa: v.placa || v.veiculo?.placa || "n/a",
          modelo: v.modelo || v.veiculo?.modelo || "veículo",
          marca: v.marca || v.veiculo?.marca || "",
          ano: v.ano || v.anoModelo || v.veiculo?.ano || "2026",
          cor: v.cor || v.veiculo?.cor || "não informada",
          condutor: v.condutor || v.motorista || v.responsavel || "não informado",
          km: v.km || v.quilometragem || v.kmAtual || "0",
          combustivel: v.combustivel || "1/2",
          crlv: v.crlv || "sim",
          data: v.data || (v.dataHoraInicio ? v.dataHoraInicio.split('T')[0] : "data não informada"),
          hora: v.hora || (v.dataHoraInicio ? new Date(v.dataHoraInicio).toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' }) : ""),
          acessorios: v.acessorios || {},
          itensInspecao: v.itensInspecao || v.itensAvaliados || {},
          obs: v.obs || v.observacoes || "nenhuma observação registrada nesta vistoria.",
          nomeResponsavel: v.nomeResponsavel || v.avaliador || v.vistoriador || v.motorista || v.condutor || v.responsavel || "",
          tipoResponsavel: v.tipoResponsavel || v.cargoResponsavel || "",
          avaliador: v.avaliador || v.vistoriador || "",
          motorista: v.motorista || v.condutor || ""
        };
        imprimirVistoriaHistorico(itemNormalizado);
      }, index * 500);
    });
  };

  const handleExcluirDireto = (idOuObjeto) => {
    const id = typeof idOuObjeto === "object" ? getIdVistoria(idOuObjeto) : idOuObjeto;

    if (!id) {
      toast.error("id da vistoria não encontrado.");
      return;
    }

    toast.custom((t) => (
      <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white shadow-2xl rounded-2xl pointer-events-auto flex flex-col p-5 border border-slate-200`}>
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-rose-100 text-rose-600 rounded-xl">
            <Trash2 size={20} />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-800">confirmar exclusão</h3>
            <p className="text-xs text-slate-500 font-medium">tem certeza que deseja excluir esta vistoria?</p>
          </div>
        </div>
        <div className="flex gap-2 justify-end mt-2">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
          >
            cancelar
          </button>
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              const toastLoading = toast.loading("excluindo vistoria...");
              try {
                await excluirVistoria(id);
                if (vistoriaAtiva && getIdVistoria(vistoriaAtiva) === id) {
                  setVistoriaAtiva(null);
                }
                setListaChecklistsDoDiaModal((prev) =>
                  prev ? prev.filter(item => getIdVistoria(item) !== id) : null
                );
                toast.success("vistoria excluída com sucesso!", { id: toastLoading });
              } catch (error) {
                console.error("erro capturado ao excluir:", error);
                toast.error("erro ao excluir vistoria.", { id: toastLoading });
              }
            }}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-md shadow-rose-200"
          >
            sim, excluir
          </button>
        </div>
      </div>
    ), { duration: 6000 });
  };

  const handleImprimirItemModal = (item) => {
    if (!item) return;

    const itemNormalizado = {
      ...item,
      id: getIdVistoria(item),
      placa: item.placa || item.veiculo?.placa || "n/a",
      modelo: item.modelo || item.veiculo?.modelo || "veículo",
      marca: item.marca || item.veiculo?.marca || "",
      ano: item.ano || item.anoModelo || item.veiculo?.ano || "2026",
      cor: item.cor || item.veiculo?.cor || "não informada",
      condutor: item.condutor || item.motorista || item.responsavel || "não informado",
      km: item.km || item.quilometragem || item.kmAtual || "0",
      combustivel: item.combustivel || "1/2",
      crlv: item.crlv || "sim",
      data: item.data || (item.dataHoraInicio ? item.dataHoraInicio.split('T')[0] : "data não informada"),
      hora: item.hora || (item.dataHoraInicio ? new Date(item.dataHoraInicio).toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' }) : ""),
      acessorios: item.acessorios || {},
      itensInspecao: item.itensInspecao || item.itensAvaliados || {},
      obs: item.obs || item.observacoes || "nenhuma observação registrada nesta vistoria.",
      nomeResponsavel: item.nomeResponsavel || item.avaliador || item.vistoriador || item.motorista || item.condutor || item.responsavel || "",
      tipoResponsavel: item.tipoResponsavel || item.cargoResponsavel || "",
      avaliador: item.avaliador || item.vistoriador || "",
      motorista: item.motorista || item.condutor || ""
    };

    imprimirVistoriaHistorico(itemNormalizado);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans antialiased text-slate-900">
      <header className="h-24 bg-white border-b border-slate-100 flex items-center justify-between px-10 z-40">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/dashboard")}
            className="p-3 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-2xl transition-all cursor-pointer"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-[10px] font-black text-blue-600 uppercase tracking-widest">
              auditoria & patrimônio
            </h2>
            <h1 className="text-xl font-black text-slate-800 tracking-tight italic">
              histórico e relatórios de vistoria
            </h1>
          </div>
        </div>

        {selecionadas.length > 0 && (
          <button
            onClick={handleImprimirLote}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-200 transition-all cursor-pointer"
          >
            <Printer size={18} />
            gerar ordens de manutenção ({selecionadas.length})
          </button>
        )}
      </header>

      <main className="flex-1 p-10 max-w-7xl mx-auto w-full space-y-6">
        <CalendarioChecklists
          calendarioExpandido={calendarioExpandido}
          setCalendarioExpandido={setCalendarioExpandido}
          anoAtual={anoAtual}
          mesAtual={mesAtual}
          nomesMeses={NOMES_MESES}
          totalChecklistsMes={totalChecklistsMes}
          navegarMes={navegarMes}
          primeiroDiaMes={primeiroDiaMes}
          totalDiasMes={totalDiasMes}
          obterChecklistsDoDia={obterChecklistsDoDia}
          setListaChecklistsDoDiaModal={setListaChecklistsDoDiaModal}
          onSelecionarDia={handleSelecionarDiaDoCalendario}
        />

        {/* FILTROS DE BUSCA */}
        <div className="bg-white p-6 rounded-[2rem] border border-slate-200/80 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">unidade</label>
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3">
              <Building2 size={18} className="text-blue-600" />
              <input
                type="text"
                placeholder="ex: hospital..."
                value={filtroUnidade}
                onChange={(e) => setFiltroUnidade(e.target.value)}
                className="bg-transparent text-sm font-bold text-slate-700 focus:outline-none w-full"
              />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">setor</label>
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3">
              <MapPin size={18} className="text-blue-600" />
              <input
                type="text"
                placeholder="ex: almoxarifado..."
                value={filtroSetor}
                onChange={(e) => setFiltroSetor(e.target.value)}
                className="bg-transparent text-sm font-bold text-slate-700 focus:outline-none w-full"
              />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">data início</label>
            <input
              type="date"
              value={filtroDataInicio}
              onChange={(e) => setFiltroDataInicio(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 focus:outline-none w-full cursor-pointer"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">data fim</label>
            <input
              type="date"
              value={filtroDataFim}
              onChange={(e) => setFiltroDataFim(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 focus:outline-none w-full cursor-pointer"
            />
          </div>
        </div>

        {/* LISTAGEM DE VISTORIAS */}
        <div className="bg-white rounded-[2rem] border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <button
              onClick={selecionarTodas}
              className="flex items-center gap-2 text-xs font-black text-slate-600 uppercase tracking-wider cursor-pointer"
            >
              {selecionadas.length === vistoriasFiltradas.length && vistoriasFiltradas.length > 0 ? (
                <CheckSquare size={18} className="text-blue-600" />
              ) : (
                <Square size={18} className="text-slate-400" />
              )}
              selecionar todas ({vistoriasFiltradas.length})
            </button>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              mostrando {vistoriasFiltradas.length} vistorias
            </p>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-400 font-bold uppercase text-xs">carregando histórico...</div>
          ) : vistoriasFiltradas.length === 0 ? (
            <div className="p-16 text-center">
              <History size={40} className="mx-auto text-slate-300 mb-3" />
              <p className="text-slate-600 font-bold text-sm">nenhuma vistoria encontrada.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {vistoriasFiltradas.map((v) => {
                const currentId = getIdVistoria(v);
                const isSelected = selecionadas.includes(currentId);
                const dataFormatada = v.data || v.dataHoraInicio || v.dataHora
                  ? (v.data || new Date(v.dataHoraInicio || v.dataHora).toLocaleDateString("pt-BR"))
                  : "data não informada";

                return (
                  <div
                    key={currentId}
                    className={`p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all hover:bg-blue-50/30 ${
                      isSelected ? "bg-blue-50/50" : ""
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <button onClick={() => toggleSelecionar(currentId)} className="cursor-pointer">
                        {isSelected ? (
                          <CheckSquare size={22} className="text-blue-600" />
                        ) : (
                          <Square size={22} className="text-slate-300 hover:text-slate-400" />
                        )}
                      </button>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-[10px] font-black uppercase tracking-wider">
                            {v.placa || v.veiculo?.placa || "placa n/a"}
                          </span>
                          <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-[10px] font-black uppercase tracking-wider">
                            modelo: {v.modelo || v.veiculo?.modelo || "veículo"}
                          </span>
                        </div>
                        <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                          <Calendar size={14} className="text-slate-400" />
                          data: {dataFormatada} {v.hora ? `às ${v.hora}` : ''} - condutor: <strong>{v.condutor || v.motorista || 'não informado'}</strong>
                        </h3>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                      <span className="px-3 py-1 bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5">
                        <CheckSquare size={14} className="text-blue-600" />
                        km: {v.km || v.quilometragem || '0'}
                      </span>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleImprimirItemModal(v);
                        }}
                        className="px-5 py-2.5 bg-slate-700 hover:bg-slate-800 text-white rounded-xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-sm flex items-center gap-1"
                      >
                        <Printer size={14} /> imprimir
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleExcluirDireto(currentId);
                        }}
                        title="excluir vistoria"
                        className="p-2.5 bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-600 hover:text-white rounded-xl transition-all cursor-pointer shadow-sm"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* MODAL DE CHECKLIST DE FROTA INTEGRADO */}
      <ModalChecklistFrota
        listaChecklistsDoDiaModal={listaChecklistsDoDiaModal}
        onClose={() => setListaChecklistsDoDiaModal(null)}
        onExcluir={handleExcluirDireto}
        onImprimir={handleImprimirItemModal}
      />
    </div>
  );
}