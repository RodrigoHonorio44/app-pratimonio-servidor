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
  ChevronRight,
  Menu,
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
    unidadExibicao,
  } = useDashboard();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest italic">
            Carregando dados da API...
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
      <main className="flex-1 flex flex-col overflow-hidden w-full">
        {/* HEADER RESPONSIVO E CORRIGIDO */}
        <header className="min-h-[72px] md:h-24 bg-white border-b border-slate-100 flex items-center justify-between px-3 sm:px-6 md:px-10 z-40 shrink-0 gap-2">
          {/* Esquerda: Ícone Hambúrguer + Título */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 text-slate-700 hover:text-blue-600 hover:bg-slate-100 rounded-xl bg-slate-50 border border-slate-200 shadow-2xs cursor-pointer transition-colors"
              aria-label="Abrir Menu"
            >
              <Menu size={20} />
            </button>

            <div className="flex flex-col">
              <span className="text-[8px] sm:text-[10px] font-black text-blue-600 uppercase tracking-widest leading-none mb-1">
                {isRoot ? "Root Access" : isAdmin ? "Administrador" : "Analista"}
              </span>
              <h1 className="text-base sm:text-xl font-black text-slate-800 tracking-tight italic leading-none">
                Dashboard
              </h1>
            </div>
          </div>

          {/* Direita: Perfil / Unidade */}
          <div className="flex items-center gap-2 sm:gap-4 overflow-hidden">
            <div className="flex flex-col items-end overflow-hidden">
              <div className="flex items-center gap-1 sm:gap-2">
                <span className="px-1.5 sm:px-2.5 py-0.5 bg-blue-50 text-blue-600 rounded-md text-[8px] sm:text-[9px] font-black uppercase tracking-tighter max-w-[80px] sm:max-w-none truncate">
                  {unidadExibicao}
                </span>
                <span className="hidden sm:inline text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                  Usuário
                </span>
              </div>
              <h3 className="text-xs sm:text-base md:text-lg font-black text-slate-800 uppercase italic leading-tight mt-0.5 max-w-[110px] sm:max-w-[200px] md:max-w-none truncate text-right">
                {nomeExibicao}
              </h3>
            </div>

            <div className="w-9 h-9 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl sm:rounded-2xl shadow-md sm:shadow-lg shadow-blue-200 flex items-center justify-center text-white shrink-0">
              <User size={18} className="sm:w-6 sm:h-6" strokeWidth={2.5} />
            </div>
          </div>
        </header>

        {/* ÁREA DE CONTEÚDO */}
        <section className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-10 bg-[#F8FAFC]">
          <div className="max-w-7xl mx-auto">
            {/* Cabeçalho de Boas-Vindas e Filtro de Período */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 mb-6 md:mb-10">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 leading-tight">
                Olá, {nomeExibicao.split(" ")[0]}!
              </h1>

              <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl sm:rounded-2xl px-3 py-2 sm:px-4 sm:py-2.5 shadow-2xs w-full sm:w-auto justify-between sm:justify-start">
                <div className="flex items-center gap-1.5">
                  <Calendar size={14} className="text-blue-600 shrink-0" />
                  <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Período:
                  </span>
                </div>
                <input
                  type="month"
                  value={mesFiltro}
                  onChange={(e) => setMesFiltro(e.target.value)}
                  className="bg-transparent font-bold text-slate-700 text-xs sm:text-sm focus:outline-none cursor-pointer"
                />
              </div>
            </div>

            {/* CARDS DE ESTATÍSTICAS */}
            {temAcesso("chamados") && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8 md:mb-12">
                <StatCard
                  title="Em Aberto"
                  value={estatisticas.abertos}
                  color="amber"
                  icon={Clock}
                />
                <StatCard
                  title="Aguardando"
                  value={estatisticas.pendentes}
                  color="rose"
                  icon={AlertCircle}
                />
                <StatCard
                  title="Concluídos"
                  value={estatisticas.fechados}
                  color="emerald"
                  icon={CheckCircle}
                />
                <StatCard
                  title="Histórico"
                  value={estatisticas.total}
                  color="blue"
                  icon={ClipboardList}
                />
              </div>
            )}

            {/* MÓDULOS DE ACESSO RÁPIDO */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {temAcesso("dashboard_bi") && (
                <QuickActionCard
                  title="Painel de BI"
                  description="Relatórios e indicadores em tempo real."
                  icon={PieChart}
                  onClick={() => navigate("/bi")}
                  variant="dark"
                />
              )}
              {temAcesso("inventario") && (
                <QuickActionCard
                  title="Inventário Geral"
                  description="Base completa de equipamentos e ativos."
                  icon={Search}
                  onClick={() => navigate("/inventario")}
                  variant="light"
                />
              )}
              {temAcesso("inventario") && (
                <QuickActionCard
                  title="Vistoria de Patrimônio"
                  description="Avaliação de estado de conservação e planejamento de bens."
                  icon={ClipboardCheck}
                  onClick={() => navigate("/vistoria-patrimonio")}
                  variant="light"
                />
              )}
              {temAcesso("inventario") && (
                <QuickActionCard
                  title="Histórico de Vistorias"
                  description="Consulte o registro e o histórico detalhado das vistorias de patrimônio realizadas."
                  icon={ClipboardList}
                  onClick={() => navigate("/historico-vistorias")}
                  variant="light"
                />
              )}
              {temAcesso("laudos") && (
                <QuickActionCard
                  title="Laudos emitidos"
                  description="Gerencie e emita laudos de inviabilidade técnica para descarte de ativos."
                  icon={FileText}
                  onClick={() => navigate("/laudo-inviabilidade")}
                  variant="light"
                />
              )}
              {temAcesso("etiquetas") && (
                <QuickActionCard
                  title="Emissão de Etiquetas"
                  description="Gere e imprima etiquetas industriais com códigos de barras sequenciais."
                  icon={Barcode}
                  onClick={() => navigate("/emissao-etiquetas")}
                  variant="light"
                />
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function StatCard({ title, value, color, icon: Icon }) {
  const themes = {
    amber: "bg-amber-500 shadow-amber-100",
    rose: "bg-rose-500 shadow-rose-100",
    emerald: "bg-emerald-500 shadow-emerald-100",
    blue: "bg-blue-600 shadow-blue-100",
  };
  return (
    <div className="bg-white p-5 sm:p-7 rounded-2xl sm:rounded-[2rem] border border-slate-100 shadow-2xs hover:shadow-xl transition-all group overflow-hidden">
      <div className="flex justify-between items-center mb-4 sm:mb-6">
        <div
          className={`${themes[color]} p-2.5 sm:p-3 rounded-xl sm:rounded-2xl text-white shadow-md group-hover:scale-110 transition-transform`}
        >
          <Icon size={18} className="sm:w-5 sm:h-5" />
        </div>
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
          {title}
        </span>
      </div>
      <h3 className="text-3xl sm:text-4xl font-black text-slate-900">
        {value.toString().padStart(2, "0")}
      </h3>
    </div>
  );
}

function QuickActionCard({ title, description, icon: Icon, onClick, variant }) {
  const isDark = variant === "dark";
  return (
    <div
      onClick={onClick}
      className={`group cursor-pointer rounded-2xl sm:rounded-[2rem] p-6 sm:p-8 transition-all flex flex-col justify-between min-h-[220px] sm:h-72 ${
        isDark
          ? "bg-slate-900 text-white hover:bg-slate-800"
          : "bg-white border border-slate-200 text-slate-900 shadow-2xs hover:border-blue-200"
      }`}
    >
      <div>
        <div
          className={`mb-4 sm:mb-6 inline-block p-3 sm:p-4 rounded-xl sm:rounded-2xl ${
            isDark ? "bg-slate-800" : "bg-blue-50 text-blue-600"
          }`}
        >
          <Icon size={20} className="sm:w-6 sm:h-6" />
        </div>
        <h2 className="text-lg sm:text-xl font-black mb-1.5 sm:mb-2">{title}</h2>
        <p className="text-xs sm:text-sm opacity-70 leading-relaxed font-medium">
          {description}
        </p>
      </div>
      <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] font-black uppercase tracking-widest text-blue-500 mt-4">
        Acessar Módulo{" "}
        <ChevronRight
          size={12}
          className="sm:w-3.5 sm:h-3.5 group-hover:translate-x-1 transition-transform"
        />
      </div>
    </div>
  );
}