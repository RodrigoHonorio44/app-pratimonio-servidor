import React from "react";
import { FiPrinter, FiEye } from "react-icons/fi";

const ChamadosAnalista = ({
  chamados = [],
  loading,
  isRemaneja,
  formatarDataHora,
  handleImprimir,
  setChamadoSelecionado,
  setMostrarModalVer,
  handleAssumirChamado,
}) => {
  if (loading) {
    return (
      <tr>
        <td
          colSpan="5"
          className="p-20 text-center animate-pulse font-bold text-slate-400"
        >
          Sincronizando Banco de Dados...
        </td>
      </tr>
    );
  }

  return (
    <>
      {chamados.map((item) => {
        const remaneja = isRemaneja ? isRemaneja(item) : false;
        const corOs = remaneja ? "text-[#FF5C00]" : "text-[#2563EB]";
        const bgBotao = remaneja
          ? "bg-[#FF5C00] hover:bg-[#E65200]"
          : "bg-[#2563EB] hover:bg-[#1D4ED8]";

        return (
          <tr
            key={item.id || item._id}
            className="border-b border-slate-50 hover:bg-slate-50/30 transition-colors"
          >
            {/* OS / ENTRADA */}
            <td className="p-6">
              <span className={`font-black text-xl tracking-tighter ${corOs}`}>
                {remaneja ? `##REM-${item.numeroOs || item.protocolo}` : `#${item.numeroOs || item.protocolo}`}
              </span>
              <p className="text-[11px] text-slate-400 font-bold mt-1">
                {formatarDataHora ? formatarDataHora(item.criadoEm || item.createdAt) : (item.criadoEm || item.createdAt)}
              </p>
            </td>

            {/* SOLICITANTE */}
            <td className="p-6">
              <div className="font-black text-[#475569] uppercase text-sm">
                {item.nome || item.solicitante || "Usuário"}
              </div>
              <div className="text-[11px] text-[#94A3B8] font-bold uppercase">
                {item.unidade}
              </div>
            </td>

            {/* DETALHES */}
            <td className="p-6">
              <p
                className={`text-[11px] font-black uppercase tracking-tight ${
                  remaneja ? "text-[#B43403]" : "text-[#334155]"
                }`}
              >
                {item.problema || item.descricao}
              </p>
            </td>

            {/* STATUS */}
            <td className="p-6">
              <span className="bg-[#F1F5F9] text-[#64748B] px-4 py-1.5 rounded-full text-[10px] font-black uppercase">
                {item.status}
              </span>
            </td>

            {/* AÇÕES */}
            <td className="p-6">
              <div className="flex items-center gap-3 justify-end">
                {handleImprimir && (
                  <button
                    onClick={() => handleImprimir(item)}
                    className="p-2.5 bg-[#F8FAFC] text-[#94A3B8] rounded-xl hover:bg-[#F1F5F9] transition-all"
                  >
                    <FiPrinter size={20} />
                  </button>
                )}
                <button
                  onClick={() => {
                    setChamadoSelecionado(item);
                    setMostrarModalVer(true);
                  }}
                  className="p-2.5 bg-[#F8FAFC] text-[#94A3B8] rounded-xl hover:bg-[#F1F5F9] transition-all"
                >
                  <FiEye size={20} />
                </button>
                {item.status === "aberto" && handleAssumirChamado && (
                  <button
                    onClick={() => handleAssumirChamado(item)}
                    className={`px-8 py-3 ${bgBotao} text-white rounded-xl text-[11px] font-black uppercase shadow-lg shadow-slate-200 transition-all active:scale-95`}
                  >
                    Atender
                  </button>
                )}
              </div>
            </td>
          </tr>
        );
      })}
    </>
  );
};

export default ChamadosAnalista;