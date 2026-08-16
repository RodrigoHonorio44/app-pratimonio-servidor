import React from "react";
import { FiSave, FiX } from "react-icons/fi";

const ModalGerenciarSetor = ({
  showModal,
  setShowModal,
  modoEdicao,
  formData,
  setFormData,
  handleSalvar,
  loading,
  unidades,
  MAPA_SETORES_POR_UNIDADE
}) => {
  if (!showModal) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg text-slate-800">
            {modoEdicao ? "Editar Equipamento" : "Incluir Novo Equipamento"}
          </h3>
          <button 
            onClick={() => setShowModal(false)} 
            className="text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <FiX size={20} />
          </button>
        </div>

        <form onSubmit={handleSalvar} className="space-y-4">
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Patrimônio</label>
            <input
              type="text"
              required
              disabled={modoEdicao} // Bloqueia a edição do patrimônio se estiver editando
              className={`w-full border p-3 rounded-xl text-xs font-bold outline-none ${
                modoEdicao 
                  ? "bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200" 
                  : "bg-slate-50 text-slate-700 border-slate-200"
              }`}
              value={formData.patrimonio}
              onChange={(e) => setFormData({ ...formData, patrimonio: e.target.value })}
            />
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Nome do Equipamento</label>
            <input
              type="text"
              required
              className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs font-bold text-slate-700 outline-none"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Unidade</label>
              <select
                className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs font-bold text-slate-700 outline-none cursor-pointer"
                value={formData.unidade}
                onChange={(e) => setFormData({ ...formData, unidade: e.target.value, setor: "" })}
              >
                {unidades.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Setor</label>
              <select
                className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs font-bold text-slate-700 outline-none cursor-pointer"
                value={formData.setor}
                onChange={(e) => setFormData({ ...formData, setor: e.target.value })}
              >
                <option value="">Selecione o setor...</option>
                {MAPA_SETORES_POR_UNIDADE[formData.unidade]?.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold text-xs uppercase cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs uppercase shadow-md flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
            >
              <FiSave size={16} /> {loading ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalGerenciarSetor;