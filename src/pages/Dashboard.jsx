// src/pages/Dashboard.jsx
import React from "react";
import {
  ClipboardList,
  Clock,
  CheckCircle,
  AlertCircle,
  PieChart,
  User,
  FileText,
  Barcode,
  Calendar,
  ClipboardCheck,
  Search,
  TrendingUp,
  ShieldCheck,
  ArrowUpRight,
  Sparkles,
  Layers,
} from "lucide-react";

import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { useDashboard } from "../hooks/useDashboard";

export default function Dashboard() {
  const navigate = useNavigate();
  const {
    sidebarOpen,
    setSidebarOpen,
    mesFiltro,
    setMesFiltro,
    userData,
    loading,
    estatisticas,
    isRoot,
    isAdmin,
    temAcesso,
    nomeExibicao,
    unidadExibicao
  } = useDashboard();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest italic">
            Carregando ambiente corporativo...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden font-sans antialiased text-slate-900">
      
      {/* SIDEBAR IMPORTADA */}
      <Sidebar 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen} 
        userData={userData} 
      />

      {/* CONTEÚDO PRINCIPAL */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* HEADER CORPORATIVO COMPACTO E ELEGANTE */}
        <header className="h-20 bg-white/90 backdrop-blur-md border-b border-slate-200/60 flex items-center justify-between px-6 lg:px-10 z-40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-2xs">
              <ShieldCheck size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest">
                  {isRoot ? "Root Access" : isAdmin ? "Administrador" : "Analista"}
                </span>
              </div>
              <h1 className="text-base font-black text-slate-800 tracking-tight italic">
                Dashboard Executivo
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end">
              <span className="px-2 py-0.5 bg-slate-100 text-slate-600 border border-slate-200/60 rounded text-[9px] font-black uppercase tracking-wider">
                {unidadExibicao}
              </span>
              <span className="text-xs font-black text-slate-900 uppercase tracking-tight mt-0.5">
                {nomeExibicao}
              </span>
            </div>
            <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl shadow-md shadow-blue-500/20 flex items-center justify-center text-white ring-2 ring-blue-50">
              <User size={18} strokeWidth={2.5} />
            </div>
          </div>
        </header>

        {/* ÁREA DE CONTEÚDO OTIMIZADA PARA NÃO EXIGIR SCROLL EM NOTEBOOKS */}
        <section className="flex-1 overflow-y-auto p-6 lg:p-8 bg-[#F8FAFC]">
          <div className="max-w-7xl mx-auto space-y-6">
            
            {/* BARRA DE BOAS-VINDAS E FILTRO COMPACTA */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white px-6 py-5 rounded-2xl border border-slate-200/60 shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900 tracking-tight">
                    Olá, {nomeExibicao.split(" ")[0]}!
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    Visão sistêmica e atalhos operacionais do mês.
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 shadow-inner">
                <Calendar size={14} className="text-blue-600" />
                <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">Período:</span>
                <input
                  type="month"
                  value={mesFiltro}
                  onChange={(e) => setMesFiltro(e.target.value)}
                  className="bg-transparent font-black text-slate-800 text-xs focus:outline-none cursor-pointer"
                />
              </div>
            </div>

            {/* CARDS DE ESTATÍSTICAS EM UMA LINHA COMPACTA */}
            {temAcesso("chamados") && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Em Aberto" value={estatisticas.abertos} color="amber" icon={Clock} trend="Mês Atual" />
                <StatCard title="Aguardando" value={estatisticas.pendentes} color="rose" icon={AlertCircle} trend="Estável" />
                <StatCard title="Concluídos" value={estatisticas.fechados} color="emerald" icon={CheckCircle} trend={`${estatisticas.taxaResolucao}%`} />
                <StatCard title="Histórico Geral" value={estatisticas.total} color="blue" icon={ClipboardList} trend="Total Mês" />
              </div>
            )}

            {/* MÓDULOS / AÇÕES RÁPIDAS (GRADE INTELIGENTE DE ALTURA FIXA) */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Layers size={14} className="text-blue-600" />
                  <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-700">
                    Módulos do Sistema
                  </h3>
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Acesso por Permissão</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {temAcesso("dashboard_bi") && (
                  <QuickActionCard
                    title="Painel de BI"
                    description="Relatórios gerenciais e indicadores analíticos em tempo real."
                    icon={PieChart}
                    onClick={() => navigate("/bi")}
                    variant="dark"
                    tag="Analítico"
                  />
                )}
                {temAcesso("inventario") && (
                  <QuickActionCard
                    title="Inventário Geral"
                    description="Base completa de equipamentos, hardware e ativos de rede."
                    icon={Search}
                    onClick={() => navigate("/inventario")}
                    variant="light"
                    tag="Ativos"
                  />
                )}
                {temAcesso("inventario") && (
                  <QuickActionCard
                    title="Vistoria de Patrimônio"
                    description="Avaliação de estado de conservação e inventário físico."
                    icon={ClipboardCheck}
                    onClick={() => navigate("/vistoria-patrimonio")}
                    variant="light"
                    tag="Fiscalização"
                  />
                )}
                {temAcesso("inventario") && (
                  <QuickActionCard
                    title="Histórico de Vistorias"
                    description="Trilha de auditoria detalhada das vistorias já realizadas."
                    icon={ClipboardList}
                    onClick={() => navigate("/historico-vistorias")}
                    variant="light"
                    tag="Auditoria"
                  />
                )}
                {temAcesso("laudos") && (
                  <QuickActionCard
                    title="Laudos emitidos"
                    description="Laudos oficiais de inviabilidade técnica para baixa de ativos."
                    icon={FileText}
                    onClick={() => navigate("/laudo-inviabilidade")}
                    variant="light"
                    tag="Documentação"
                  />
                )}
                {temAcesso("etiquetas") && (
                  <QuickActionCard
                    title="Emissão de Etiquetas"
                    description="Impressão de etiquetas patrimoniais e códigos de barras."
                    icon={Barcode}
                    onClick={() => navigate("/emissao-etiquetas")}
                    variant="light"
                    tag="Operacional"
                  />
                )}
              </div>
            </div>

          </div>
        </section>
      </main>
    </div>
  );
}

function StatCard({ title, value, color, icon: Icon, trend }) {
  const themes = {
    amber: "bg-amber-500 text-amber-500",
    rose: "bg-rose-500 text-rose-500",
    emerald: "bg-emerald-500 text-emerald-500",
    blue: "bg-blue-600 text-blue-600",
  };
  
  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-2xs hover:shadow-md transition-all duration-200 group relative overflow-hidden flex flex-col justify-between">
      <div className="flex justify-between items-center mb-3">
        <div className={`${themes[color].split(" ")[0]} p-2.5 rounded-xl text-white shadow-sm group-hover:scale-105 transition-transform`}>
          <Icon size={18} strokeWidth={2.2} />
        </div>
        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
          {title}
        </span>
      </div>

      <div className="flex items-baseline justify-between pt-2 border-t border-slate-100">
        <h3 className="text-2xl font-black text-slate-900 tracking-tight">
          {String(value || 0).padStart(2, "0")}
        </h3>
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded">
          <TrendingUp size={11} className={color === 'emerald' ? 'text-emerald-600' : 'text-blue-600'} /> {trend}
        </span>
      </div>
    </div>
  );
}

function QuickActionCard({ title, description, icon: Icon, onClick, variant, tag }) {
  const isDark = variant === "dark";
  return (
    <div
      onClick={onClick}
      className={`group cursor-pointer rounded-2xl p-5 transition-all duration-200 flex flex-col justify-between h-40 relative overflow-hidden ${
        isDark
          ? "bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950 text-white shadow-lg shadow-slate-900/10 hover:shadow-xl"
          : "bg-white border border-slate-200/80 text-slate-900 shadow-2xs hover:shadow-md hover:border-blue-200"
      }`}
    >
      <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 w-28 h-28 bg-blue-500/5 rounded-full blur-xl group-hover:bg-blue-500/10 transition-colors"></div>

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-2">
          <div className={`inline-flex p-2.5 rounded-xl transition-transform duration-200 group-hover:scale-105 ${
            isDark 
              ? "bg-slate-800 text-blue-400 border border-slate-700/50" 
              : "bg-blue-50 text-blue-600 border border-blue-100/60"
          }`}>
            <Icon size={18} strokeWidth={2.2} />
          </div>
          {tag && (
            <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
              isDark ? "bg-slate-800 text-slate-300 border border-slate-700" : "bg-slate-100 text-slate-600 border border-slate-200/60"
            }`}>
              {tag}
            </span>
          )}
        </div>
        
        <h2 className="text-sm font-black mb-1 tracking-tight group-hover:text-blue-500 transition-colors">{title}</h2>
        <p className={`text-[11px] leading-snug font-medium line-clamp-2 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
          {description}
        </p>
      </div>

      <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest relative z-10 pt-2 border-t border-slate-100/10">
        <span className={isDark ? "text-blue-400" : "text-blue-600"}>Acessar Módulo</span>
        <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-transform duration-200 group-hover:translate-x-0.5 ${
          isDark ? "bg-slate-800 text-blue-400" : "bg-blue-50 text-blue-600"
        }`}>
          <ArrowUpRight size={12} />
        </div>
      </div>
    </div>
  );
}