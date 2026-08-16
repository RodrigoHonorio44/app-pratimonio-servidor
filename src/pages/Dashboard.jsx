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
} from "lucide-react";

import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { useDashboard } from "../hooks/useDashboard";

export default function Dashboard() {
  const navigate = useNavigate();
  const {
    sidebarOpen,
    setSidebarOpen,
    modoFiltro,
    setModoFiltro,
    mesFiltro,
    setMesFiltro,
    anoFiltro,
    setAnoFiltro,
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
      
      <Sidebar 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen} 
        userData={userData} 
      />

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-24 bg-white border-b border-slate-100 flex items-center justify-between px-10 z-40">
          <div className="flex flex-col">
            <h2 className="text-[10px] font-black text-blue-600 uppercase tracking-widest">
              {isRoot ? "Root Access" : isAdmin ? "Administrador" : "Analista"}
            </h2>
            <h1 className="text-xl font-black text-slate-800 tracking-tight italic">
              Dashboard
            </h1>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[9px] font-black uppercase tracking-tighter">
                  {unidadExibicao}
                </span>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                  Usuário
                </span>
              </div>
              <h3 className="text-lg font-black text-slate-800 uppercase italic leading-tight mt-0.5">
                {nomeExibicao}
              </h3>
            </div>
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl shadow-lg shadow-blue-200 flex items-center justify-center text-white">
              <User size={28} strokeWidth={2.5} />
            </div>
          </div>
        </header>

        <section className="flex-1 overflow-y-auto p-10 bg-[#F8FAFC]">
          <div className="max-w-7xl mx-auto">
            
            {/* CABEÇALHO DO PAINEL COM FILTRO REFORÇADO */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-12">
              <h1 className="text-4xl font-black text-slate-900">
                Olá, {nomeExibicao.split(" ")[0]}!
              </h1>
              
              <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-2xl p-1.5 shadow-sm">
                
                {/* Selector do Modo (Mensal ou Anual) */}
                <select
                  value={modoFiltro}
                  onChange={(e) => setModoFiltro(e.target.value)}
                  className="bg-slate-100 font-black text-slate-700 text-xs uppercase rounded-xl px-3 py-2 border-none focus:outline-none cursor-pointer"
                >
                  <option value="mensal">Visão Mensal</option>
                  <option value="anual">Visão Anual (Ano Todo)</option>
                </select>

                <div className="h-6 w-[1px] bg-slate-200"></div>

                {/* Input Dinâmico de acordo com a seleção */}
                <div className="flex items-center gap-2 px-2 py-1">
                  <Calendar size={16} className="text-blue-600" />
                  
                  {modoFiltro === "mensal" ? (
                    <input
                      type="month"
                      value={mesFiltro}
                      onChange={(e) => setMesFiltro(e.target.value)}
                      className="bg-transparent font-bold text-slate-700 text-sm focus:outline-none cursor-pointer"
                    />
                  ) : (
                    <select
                      value={anoFiltro}
                      onChange={(e) => setAnoFiltro(e.target.value)}
                      className="bg-transparent font-bold text-slate-700 text-sm focus:outline-none cursor-pointer"
                    >
                      <option value="2026">2026</option>
                      <option value="2025">2025</option>
                      <option value="2024">2024</option>
                    </select>
                  )}
                </div>
              </div>
            </div>

            {/* CARDS DE ESTATÍSTICA */}
            {temAcesso("chamados") && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                <StatCard title="Em Aberto" value={estatisticas.abertos} color="amber" icon={Clock} />
                <StatCard title="Aguardando" value={estatisticas.pendentes} color="rose" icon={AlertCircle} />
                <StatCard title="Concluídos" value={estatisticas.fechados} color="emerald" icon={CheckCircle} />
                <StatCard title="Histórico" value={estatisticas.total} color="blue" icon={ClipboardList} />
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
    <div className="bg-white p-7 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group overflow-hidden">
      <div className="flex justify-between items-center mb-6">
        <div className={`${themes[color]} p-3 rounded-2xl text-white shadow-lg group-hover:scale-110 transition-transform`}>
          <Icon size={20} />
        </div>
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
          {title}
        </span>
      </div>
      <h3 className="text-4xl font-black text-slate-900">
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
      className={`group cursor-pointer rounded-[2rem] p-8 transition-all flex flex-col justify-between h-72 ${
        isDark
          ? "bg-slate-900 text-white hover:bg-slate-800"
          : "bg-white border border-slate-200 text-slate-900 shadow-sm hover:border-blue-200"
      }`}
    >
      <div>
        <div className={`mb-6 inline-block p-4 rounded-2xl ${isDark ? "bg-slate-800" : "bg-blue-50 text-blue-600"}`}>
          <Icon size={24} />
        </div>
        <h2 className="text-xl font-black mb-2">{title}</h2>
        <p className="text-sm opacity-70 leading-relaxed font-medium">
          {description}
        </p>
      </div>
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-500">
        Acessar Módulo{" "}
        <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
      </div>
    </div>
  );
}