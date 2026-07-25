import React from "react";
import { ArrowLeft, ClipboardCheck, CheckCircle2, AlertTriangle, RefreshCw, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { MAPA_SETORES_POR_UNIDADE } from "../components/constants/setores";
import { useTelaVistoriaPatrimonio } from "../hooks/useTelaVistoriaPatrimonio";

const OPCOES_ESTADO = [
  { id: "bom", label: "Bom", icon: CheckCircle2, color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
  { id: "ocioso", label: "Ocioso", icon: AlertTriangle, color: "text-amber-600 bg-amber-50 border-amber-200" },
  { id: "recuperavel", label: "Recuperável", icon: RefreshCw, color: "text-blue-600 bg-blue-50 border-blue-200" },
  { id: "irrecuperavel", label: "Irrecuperável", icon: XCircle, color: "text-rose-600 bg-rose-50 border-rose-200" },
];

const TIPOS_MOBILIARIO = [
  "Cadeira Giratória de Escritório",
  "Cadeira Fixa de Atendimento",
  "Longarina de Espera",
  "Leito Hospitalar / Cama",
  "Mesa de Escritório / Estação",
  "Armário / Estante de Aço",
];

const TelaVistoriaPatrimonio = () => {
  const navigate = useNavigate();

  const {
    unidadeSelecionada,
    setUnidadeSelecionada,
    setorSelecionado,
    setSetorSelecionado,
    tipoMobiliario,
    setTipoMobiliario,
    patrimonioFiltro,
    setPatrimonioFiltro,
    estadoAvaliado,
    setEstadoAvaliado,
    observacoes,
    setObservacoes,
    loading,
    handleSalvarVistoria,
  } = useTelaVistoriaPatrimonio();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
      <Header />

      <main className="flex-grow p-4 md:p-8 max-w-5xl w-full mx-auto">
        <header className="mb-6 no-print">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-slate-500 hover:text-blue-600 font-bold text-sm transition-colors mb-4 group cursor-pointer"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            Voltar à Dashboard
          </button>
          
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2 uppercase tracking-tight">
            <ClipboardCheck className="text-blue-600" size={28} /> Vistoria e Avaliação de Mobiliário
          </h1>
          <p className="text-slate-500 text-sm font-medium">
            Avaliação de estado de conservação para planejamento de substituição de bens nas unidades.
          </p>
        </header>

        <form onSubmit={handleSalvarVistoria} className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 space-y-6">
          
          {/* LOCALIZAÇÃO DA VISTORIA */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Unidade</label>
              <select 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                value={unidadeSelecionada} 
                onChange={(e) => { setUnidadeSelecionada(e.target.value); setSetorSelecionado(""); }}
              >
                <option value="">Selecione a Unidade...</option>
                {Object.keys(MAPA_SETORES_POR_UNIDADE).map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Setor Interno</label>
              <select 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                value={setorSelecionado} 
                onChange={(e) => setSetorSelecionado(e.target.value)}
                disabled={!unidadeSelecionada}
              >
                <option value="">Selecione o Setor...</option>
                {(MAPA_SETORES_POR_UNIDADE[unidadeSelecionada] || []).map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* ITEM A SER AVALIADO */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Tipo de Mobiliário</label>
              <select 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                value={tipoMobiliario} 
                onChange={(e) => setTipoMobiliario(e.target.value)}
              >
                {TIPOS_MOBILIARIO.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Nº de Patrimônio (Opcional / Etiqueta)</label>
              <input 
                type="text" 
                placeholder="Ex: 37031" 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
                value={patrimonioFiltro}
                onChange={(e) => setPatrimonioFiltro(e.target.value)}
              />
            </div>
          </div>

          {/* SELEÇÃO DO ESTADO DE CONSERVAÇÃO */}
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Classificação de Conservação</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {OPCOES_ESTADO.map((opt) => {
                const IconComponent = opt.icon;
                const selecionado = estadoAvaliado === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setEstadoAvaliado(opt.id)}
                    className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all cursor-pointer gap-2 ${
                      selecionado 
                        ? `${opt.color} shadow-md scale-[1.02] font-black` 
                        : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100 font-bold'
                    }`}
                  >
                    <IconComponent size={24} />
                    <span className="text-xs uppercase tracking-wider">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* OBSERVAÇÕES DA VISTORIA */}
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Observações Técnicas / Motivo da Classificação</label>
            <textarea 
              rows={3} 
              placeholder="Ex: Cadeira com pistão quebrado, estofado rasgado, necessita substituição urgente..." 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none resize-none" 
              value={observacoes} 
              onChange={(e) => setObservacoes(e.target.value)} 
            />
          </div>

          <button 
            type="submit" 
            disabled={loading} 
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white p-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-100 cursor-pointer"
          >
            <ClipboardCheck size={20} />
            {loading ? "Registrando Vistoria..." : "Salvar Avaliação para Planejamento"}
          </button>
        </form>
      </main>

      <Footer />
    </div>
  );
};

export default TelaVistoriaPatrimonio;