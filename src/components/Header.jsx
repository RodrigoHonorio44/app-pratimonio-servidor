import React, { useState, useEffect } from "react";
import { LogOut, User, Menu } from "lucide-react";
import { auth, db } from "../services/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

export default function Header({ onOpenSidebar }) {
  const navigate = useNavigate();
  const [userData, setUserData] = useState({
    nome: "Usuário",
    cargo: "Carregando...",
    unidade: "Carregando...",
  });

  useEffect(() => {
    const buscarDados = async () => {
      const user = auth.currentUser;
      if (user) {
        try {
          const docRef = doc(db, "usuarios", user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setUserData({
              nome: data.nome || "Usuário do Sistema",
              cargo:
                data.cargoHospitalar || data.cargo || data.role || "Usuário",
              unidade: data.unidade || "Unidade Central",
            });
          }
        } catch (error) {
          console.error("Erro ao buscar dados:", error);
        }
      }
    };
    buscarDados();
  }, []);

  const formatarNome = (nomeCompleto) => {
    if (!nomeCompleto) return "Usuário";
    const nomes = nomeCompleto.split(" ");
    return nomes.length > 1 ? `${nomes[0]} ${nomes[1]}` : nomes[0];
  };

  return (
    <header className="h-20 md:h-24 bg-white/80 backdrop-blur-xl border-b border-slate-100 flex items-center justify-between px-4 md:px-10 sticky top-0 z-40 transition-all">
      
      {/* LADO ESQUERDO: Botão de Menu (Mobile) + Logotipo/Título */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Botão Hambúrguer só aparece no Mobile (md:hidden) */}
        {onOpenSidebar && (
          <button
            onClick={onOpenSidebar}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl md:hidden transition-all shrink-0"
            aria-label="Abrir Menu"
          >
            <Menu size={22} />
          </button>
        )}

        <div
          className="flex flex-col cursor-pointer group truncate"
          onClick={() => navigate("/dashboard")}
        >
          <div className="flex items-center gap-2 mb-0.5 md:mb-1">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse shrink-0"></span>
            <h2 className="text-[9px] md:text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] md:tracking-[0.3em] truncate">
              Rodhon System
            </h2>
          </div>
          <h1 className="text-sm sm:text-lg md:text-xl font-black text-slate-800 tracking-tight italic truncate">
            Centro de{" "}
            <span className="text-slate-400 font-medium">Operações</span>
          </h1>
        </div>
      </div>

      {/* LADO DIREITO: Info do Usuário + Avatar + Sair */}
      <div className="flex items-center gap-2 sm:gap-4 md:gap-8 shrink-0">
        <div className="flex items-center gap-2 md:gap-4 group">
          {/* Informações de Cargo e Nome */}
          <div className="text-right hidden sm:block max-w-[140px] md:max-w-none">
            <div className="flex items-center justify-end gap-1.5 md:gap-2 mb-0.5">
              <div className="bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100 truncate">
                <p className="text-[8px] md:text-[9px] text-blue-600 font-black uppercase truncate">
                  {userData.unidade}
                </p>
              </div>
              <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest truncate">
                {userData.cargo}
              </p>
            </div>
            <p className="text-xs md:text-sm font-black text-slate-800 uppercase italic truncate">
              {formatarNome(userData.nome)}
            </p>
          </div>

          {/* Avatar */}
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-gradient-to-tr from-blue-700 to-blue-400 flex items-center justify-center text-white border-2 border-white shadow-lg shadow-blue-100 transition-all group-hover:scale-105 shrink-0">
            <User size={20} className="md:w-5 md:h-5" />
          </div>
        </div>

        <div className="h-8 md:h-10 w-px bg-slate-100 hidden sm:block"></div>

        {/* Botão Sair */}
        <button
          onClick={() => auth.signOut()}
          className="p-2.5 md:p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all cursor-pointer shrink-0"
          title="Sair do Sistema"
        >
          <LogOut size={18} className="md:w-5 md:h-5" />
        </button>
      </div>
    </header>
  );
}