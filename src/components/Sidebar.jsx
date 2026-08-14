import React, { useState } from "react";
import {
  LogOut,
  BarChart3,
  PlusCircle,
  Repeat,
  Search,
  Package,
  Truck,
  Users,
  MessageSquarePlus,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Key,
  Layers3,
  FileText,
  Barcode,
  ClipboardCheck,
  ClipboardList,
  ShieldAlert,
  Cpu,
  FolderKanban,
  Boxes,
  X,
} from "lucide-react";
import { auth } from "../services/firebase";
import { useNavigate, useLocation } from "react-router-dom";

export default function Sidebar({ sidebarOpen, setSidebarOpen, userData }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [openSections, setOpenSections] = useState({
    master: true,
    inteligencia: true,
    operacao: true,
    patrimonio: true,
  });

  const toggleSection = (section) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleNavigate = (path) => {
    navigate(path);
    // Se estiver no mobile, fecha a gaveta ao clicar em um link
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  const isRoot = userData?.role?.toLowerCase() === "root";
  const isAdmin =
    userData?.cargo?.toUpperCase() === "ADMINISTRADOR" ||
    userData?.role?.toLowerCase() === "admin";

  const temAcesso = (moduloId) => {
    if (isRoot) return true;
    return userData?.permissoesExtras?.[moduloId] === true;
  };

  const canManageUsers = isRoot || isAdmin;

  const NavButton = ({ icon: Icon, label, path, moduloId }) => {
    if (moduloId && !temAcesso(moduloId)) return null;
    const active = location.pathname === path;

    return (
      <button
        onClick={() => handleNavigate(path)}
        title={!sidebarOpen ? label : ""}
        className={`flex items-center gap-3 w-full px-3.5 py-2.5 rounded-xl font-bold text-[11px] uppercase tracking-wider transition-all duration-200 group cursor-pointer ${
          active
            ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
            : "text-slate-500 hover:bg-white hover:text-blue-600 shadow-2xs"
        } ${!sidebarOpen && "md:justify-center md:px-0 md:py-3"}`}
      >
        <Icon
          size={18}
          className={
            active
              ? "text-white"
              : "text-slate-400 group-hover:text-blue-600 group-hover:scale-110 transition-all"
          }
        />
        {/* No mobile o texto sempre aparece; no desktop depende da prop sidebarOpen */}
        <span className={`truncate ${!sidebarOpen ? "md:hidden" : "inline"}`}>
          {label}
        </span>
      </button>
    );
  };

  return (
    <>
      {/* OVERLAY DE FUNDO PARA O MOBILE */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 md:hidden transition-opacity"
        />
      )}

      {/* CONTAINER ASIDE (DESKTOP E MOBILE GAVETA) */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 bg-[#F8FAFC] border-r border-slate-200/80 flex flex-col transition-all duration-300 ease-in-out ${
          // Regras para Mobile (Gaveta)
          sidebarOpen ? "translate-x-0 w-72" : "-translate-x-full md:translate-x-0"
        } ${
          // Regras para Desktop (Retração)
          sidebarOpen ? "md:w-72" : "md:w-24"
        }`}
      >
        {/* Botão de Retração / Expansão (Visível apenas em Desktop) */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="hidden md:flex absolute -right-3 top-12 bg-white border border-slate-200 text-slate-400 p-1.5 rounded-full shadow-sm z-60 cursor-pointer hover:text-blue-600 hover:scale-105 transition-all"
        >
          {sidebarOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
        </button>

        {/* Header da Sidebar */}
        <div className="h-20 md:h-28 flex items-center justify-between px-6 mb-2 border-b border-slate-200/50">
          <div className="flex items-center text-xl md:text-2xl font-black italic tracking-tighter">
            {sidebarOpen ? (
              <>
                <span className="text-[#0F172A]">RODHON</span>
                <span className="text-[#2563EB]">SYSTEM</span>
              </>
            ) : (
              <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black italic mx-auto shadow-lg shadow-blue-200">
                R
              </div>
            )}
          </div>

          {/* Botão fechar (Apenas no Mobile) */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden text-slate-400 hover:text-slate-700 p-2"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navegação */}
        <nav className="flex-1 px-3 space-y-3 overflow-y-auto py-4 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
          
          {/* Master Control */}
          {canManageUsers && (
            <div
              className={`${
                sidebarOpen || window.innerWidth < 768
                  ? "bg-slate-200/40 border border-slate-200/60 rounded-2xl p-1.5"
                  : "bg-transparent"
              } transition-all`}
            >
              <div
                onClick={() => toggleSection("master")}
                className="flex items-center justify-between px-3 py-2 cursor-pointer select-none group rounded-xl transition-colors hover:bg-slate-200/70"
              >
                <div className="flex items-center gap-2.5">
                  <ShieldAlert size={18} className="text-blue-600" />
                  <span
                    className={`text-[10px] font-black text-blue-600 uppercase tracking-widest ${
                      !sidebarOpen ? "md:hidden" : "inline"
                    }`}
                  >
                    Master Control
                  </span>
                </div>
                <ChevronDown
                  size={14}
                  className={`text-blue-600 transition-transform duration-300 ${
                    openSections.master ? "rotate-180" : ""
                  } ${!sidebarOpen ? "md:hidden" : "inline"}`}
                />
              </div>
              {openSections.master && (
                <div className="space-y-1 mt-1.5">
                  {isRoot && (
                    <NavButton
                      icon={Key}
                      label="Licenças e SaaS"
                      path="/admin/licencas"
                    />
                  )}
                  <NavButton
                    icon={Users}
                    label="Gestão de Usuários"
                    path="/usuarios"
                  />
                </div>
              )}
            </div>
          )}

          {/* Inteligência */}
          {temAcesso("dashboard_bi") && (
            <div
              className={`${
                sidebarOpen || window.innerWidth < 768
                  ? "bg-slate-200/40 border border-slate-200/60 rounded-2xl p-1.5"
                  : "bg-transparent"
              } transition-all`}
            >
              <div
                onClick={() => toggleSection("inteligencia")}
                className="flex items-center justify-between px-3 py-2 cursor-pointer select-none group rounded-xl transition-colors hover:bg-slate-200/70"
              >
                <div className="flex items-center gap-2.5">
                  <Cpu size={18} className="text-slate-500" />
                  <span
                    className={`text-[10px] font-black text-slate-500 uppercase tracking-widest ${
                      !sidebarOpen ? "md:hidden" : "inline"
                    }`}
                  >
                    Inteligência
                  </span>
                </div>
                <ChevronDown
                  size={14}
                  className={`text-slate-400 transition-transform duration-300 ${
                    openSections.inteligencia ? "rotate-180" : ""
                  } ${!sidebarOpen ? "md:hidden" : "inline"}`}
                />
              </div>
              {openSections.inteligencia && (
                <div className="space-y-1 mt-1.5">
                  <NavButton icon={BarChart3} label="Power BI" path="/bi" />
                </div>
              )}
            </div>
          )}

          {/* Operação */}
          {temAcesso("chamados") && (
            <div
              className={`${
                sidebarOpen || window.innerWidth < 768
                  ? "bg-slate-200/40 border border-slate-200/60 rounded-2xl p-1.5"
                  : "bg-transparent"
              } transition-all`}
            >
              <div
                onClick={() => toggleSection("operacao")}
                className="flex items-center justify-between px-3 py-2 cursor-pointer select-none group rounded-xl transition-colors hover:bg-slate-200/70"
              >
                <div className="flex items-center gap-2.5">
                  <FolderKanban size={18} className="text-slate-500" />
                  <span
                    className={`text-[10px] font-black text-slate-500 uppercase tracking-widest ${
                      !sidebarOpen ? "md:hidden" : "inline"
                    }`}
                  >
                    Operação
                  </span>
                </div>
                <ChevronDown
                  size={14}
                  className={`text-slate-400 transition-transform duration-300 ${
                    openSections.operacao ? "rotate-180" : ""
                  } ${!sidebarOpen ? "md:hidden" : "inline"}`}
                />
              </div>
              {openSections.operacao && (
                <div className="space-y-1 mt-1.5">
                  <NavButton
                    icon={MessageSquarePlus}
                    label="Abrir Chamado"
                    path="/cadastro-chamado"
                  />
                  <NavButton
                    icon={ClipboardList}
                    label="Fila de Trabalho"
                    path="/painel-analista"
                  />
                  <NavButton
                    icon={Repeat}
                    label="Remanejamento"
                    path="/remanejamento"
                    moduloId="remanejamento"
                  />
                  <NavButton
                    icon={FileText}
                    label="Laudo Técnico"
                    path="/laudo-inviabilidade"
                    moduloId="laudos"
                  />
                </div>
              )}
            </div>
          )}

          {/* Patrimônio */}
          {(temAcesso("inventario") ||
            temAcesso("etiquetas") ||
            temAcesso("vistoria")) && (
            <div
              className={`${
                sidebarOpen || window.innerWidth < 768
                  ? "bg-slate-200/40 border border-slate-200/60 rounded-2xl p-1.5"
                  : "bg-transparent"
              } transition-all`}
            >
              <div
                onClick={() => toggleSection("patrimonio")}
                className="flex items-center justify-between px-3 py-2 cursor-pointer select-none group rounded-xl transition-colors hover:bg-slate-200/70"
              >
                <div className="flex items-center gap-2.5">
                  <Boxes size={18} className="text-slate-500" />
                  <span
                    className={`text-[10px] font-black text-slate-500 uppercase tracking-widest ${
                      !sidebarOpen ? "md:hidden" : "inline"
                    }`}
                  >
                    Patrimônio
                  </span>
                </div>
                <ChevronDown
                  size={14}
                  className={`text-slate-400 transition-transform duration-300 ${
                    openSections.patrimonio ? "rotate-180" : ""
                  } ${!sidebarOpen ? "md:hidden" : "inline"}`}
                />
              </div>
              {openSections.patrimonio && (
                <div className="space-y-1 mt-1.5">
                  <NavButton
                    icon={PlusCircle}
                    label="Novo Ativo"
                    path="/cadastro-equipamento"
                    moduloId="inventario"
                  />
                  <NavButton
                    icon={Search}
                    label="Inventário"
                    path="/inventario"
                    moduloId="inventario"
                  />
                  <NavButton
                    icon={Layers3}
                    label="Consulta de Itens"
                    path="/consulta-patrimonio"
                    moduloId="inventario"
                  />
                  <NavButton
                    icon={Package}
                    label="Sala do Patrimônio"
                    path="/estoque"
                    moduloId="inventario"
                  />
                  <NavButton
                    icon={Truck}
                    label="Saída/Transferência"
                    path="/transferencia"
                    moduloId="inventario"
                  />
                  <NavButton
                    icon={ClipboardCheck}
                    label="Vistoria Patrimônio"
                    path="/vistoria-patrimonio"
                    moduloId="vistoria"
                  />
                  <NavButton
                    icon={ClipboardList}
                    label="Histórico Vistorias"
                    path="/historico-vistorias"
                    moduloId="vistoria"
                  />
                  <NavButton
                    icon={Barcode}
                    label="Gerar Etiquetas"
                    path="/emissao-etiquetas"
                    moduloId="etiquetas"
                  />
                </div>
              )}
            </div>
          )}
        </nav>

        {/* Footer / Logout */}
        <div className="p-4 border-t border-slate-200/60 bg-[#F1F5F9]/50">
          <button
            onClick={() => auth.signOut()}
            title={!sidebarOpen ? "Encerrar Sessão" : ""}
            className="w-full flex items-center gap-4 px-4 py-3.5 text-slate-500 rounded-2xl hover:bg-red-50 hover:text-red-600 transition-all font-black text-[11px] uppercase tracking-widest cursor-pointer group shadow-2xs"
          >
            <LogOut
              size={18}
              className={`transition-transform group-hover:scale-110 ${
                !sidebarOpen && "md:mx-auto"
              }`}
            />
            <span
              className={`truncate ${!sidebarOpen ? "md:hidden" : "inline"}`}
            >
              Encerrar Sessão
            </span>
          </button>
        </div>
      </aside>
    </>
  );
}