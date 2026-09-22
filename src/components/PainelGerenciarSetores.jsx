import React, { useState, useMemo } from "react";
import { Edit2, Trash2, Plus, Layers, X } from "lucide-react";
import { toast } from "react-toastify";
import { useSetores } from "./constants/setores";
import api from "../services/api";

const PainelGerenciarSetores = ({ onAtualizarTela }) => {
  const { unidades, mapaSetores, carregarSetores } = useSetores();

  const [modalAberto, setModalAberto] = useState(false);
  const [unidadeModal, setUnidadeModal] = useState("Hospital Conde");
  
  // Modais internos
  const [modalAdicionar, setModalAdicionar] = useState(false);
  const [novoSetorNome, setNovoSetorNome] = useState("");

  const [setorParaRenomear, setSetorParaRenomear] = useState(null);
  const [novoNomeSetor, setNovoNomeSetor] = useState("");

  const [setorParaExcluir, setSetorParaExcluir] = useState(null);

  const [loading, setLoading] = useState(false);

  const setoresDaUnidade = useMemo(() => {
    const chaveBusca = unidadeModal?.toLowerCase().trim();
    const chaveEncontrada = Object.keys(mapaSetores).find(
      k => k.toLowerCase().trim() === chaveBusca
    );
    const lista = chaveEncontrada ? mapaSetores[chaveEncontrada] : [];
    
    return [...lista].sort((a, b) => a.localeCompare(b, 'pt-BR', { sensitivity: 'accent' }));
  }, [unidadeModal, mapaSetores]);

  // 1. Adicionar Setor
  const handleAdicionarSetor = async (e) => {
    e.preventDefault();
    if (!novoSetorNome.trim()) return;

    setLoading(true);
    const toastId = toast.loading("Adicionando novo setor...");

    try {
      const res = await api.post("/setores/adicionar", {
        unidade: unidadeModal,
        setor: novoSetorNome.trim()
      });

      if (res.status === 200 || res.status === 201) {
        toast.update(toastId, {
          render: `Setor adicionado com sucesso!`,
          type: "success",
          isLoading: false,
          autoClose: 3000
        });
        setModalAdicionar(false);
        setNovoSetorNome("");
        await carregarSetores();
        if (onAtualizarTela) onAtualizarTela();
      }
    } catch (err) {
      toast.update(toastId, {
        render: err.response?.data?.error || "Erro ao adicionar setor.",
        type: "error",
        isLoading: false,
        autoClose: 3000
      });
    } finally {
      setLoading(false);
    }
  };

  // 2. Renomear Setor (Atualiza em lote nos equipamentos)
  const handleRenomearEmLote = async (e) => {
    e.preventDefault();
    if (!novoNomeSetor.trim() || !setorParaRenomear) return;

    setLoading(true);
    const toastId = toast.loading("Renomeando setor e atualizando ativos...");

    try {
      const res = await api.put("/setores/renomear", {
        unidade: unidadeModal,
        setorAntigo: setorParaRenomear,
        setorNovo: novoNomeSetor.trim()
      });

      toast.update(toastId, {
        render: `Sucesso! ${res.data.equipamentosAfetados} equipamentos atualizados.`,
        type: "success",
        isLoading: false,
        autoClose: 3000
      });

      setSetorParaRenomear(null);
      setNovoNomeSetor("");
      await carregarSetores();
      if (onAtualizarTela) onAtualizarTela();
    } catch (err) {
      toast.update(toastId, {
        render: "Erro ao renomear setor.",
        type: "error",
        isLoading: false,
        autoClose: 3000
      });
    } finally {
      setLoading(false);
    }
  };

  // 3. Excluir Setor (Move ativos vinculados para "sem setor" e remove o setor)
  const handleExcluirSetor = async () => {
    if (!setorParaExcluir) return;

    setLoading(true);
    const toastId = toast.loading("Excluindo setor e limpando ativos...");

    try {
      const res = await api.delete("/setores/excluir-completo", {
        data: {
          unidade: unidadeModal,
          setorParaRemover: setorParaExcluir,
          setorDestino: "sem setor"
        }
      });

      toast.update(toastId, {
        render: `Setor excluído! ${res.data.equipamentosAfetados} equipamentos movidos para "sem setor".`,
        type: "success",
        isLoading: false,
        autoClose: 3000
      });

      setSetorParaExcluir(null);
      await carregarSetores();
      if (onAtualizarTela) onAtualizarTela();
    } catch (err) {
      toast.update(toastId, {
        render: "Erro ao excluir setor.",
        type: "error",
        isLoading: false,
        autoClose: 3000
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Botão no topo da tela */}
      <button
        type="button"
        onClick={() => setModalAberto(true)}
        className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-4 py-2.5 rounded-xl font-bold text-xs uppercase shadow-md transition-all cursor-pointer"
      >
        <Layers size={16} /> Gerenciar Catálogo de Setores
      </button>

      {/* MODAL PRINCIPAL DE CATÁLOGO */}
      {modalAberto && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-5 border border-slate-100 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 uppercase">
                <Layers className="text-blue-600" /> Gerenciar Catálogo de Setores
              </h3>
              <button 
                onClick={() => setModalAberto(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* SELECIONAR UNIDADE E BOTÃO ADICIONAR */}
            <div className="flex flex-col sm:flex-row gap-3 items-end">
              <div className="flex-1 w-full">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                  Selecione a Unidade
                </label>
                <select
                  className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer uppercase"
                  value={unidadeModal}
                  onChange={(e) => setUnidadeModal(e.target.value)}
                >
                  {unidades.map((u) => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={() => setModalAdicionar(true)}
                className="h-[46px] px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow transition-all cursor-pointer whitespace-nowrap"
              >
                <Plus size={16} /> Adicionar Setor
              </button>
            </div>

            {/* LISTA DE SETORES */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                Setores Cadastrados ({setoresDaUnidade.length})
              </label>

              <div className="border border-slate-200 rounded-2xl max-h-64 overflow-y-auto divide-y divide-slate-100 bg-slate-50/50 p-2">
                {setoresDaUnidade.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400 font-medium">Nenhum setor cadastrado nesta unidade.</div>
                ) : (
                  setoresDaUnidade.map((setor) => (
                    <div key={setor} className="flex justify-between items-center p-2.5 hover:bg-white rounded-xl transition-all">
                      <span className="text-sm font-bold text-slate-700">{setor}</span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => { setSetorParaRenomear(setor); setNovoNomeSetor(setor); }}
                          className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                        >
                          <Edit2 size={12} /> Renomear
                        </button>
                        <button
                          type="button"
                          onClick={() => setSetorParaExcluir(setor)}
                          className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                        >
                          <Trash2 size={12} /> Excluir
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* MODAL INTERNO: ADICIONAR */}
            {modalAdicionar && (
              <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200 space-y-3">
                <h4 className="text-xs font-extrabold text-emerald-900 uppercase">Adicionar novo setor em {unidadeModal}</h4>
                <form onSubmit={handleAdicionarSetor} className="space-y-3">
                  <input
                    type="text"
                    required
                    placeholder="Nome do novo setor..."
                    className="w-full bg-white border border-emerald-300 p-2.5 rounded-xl text-sm font-bold text-slate-800 outline-none"
                    value={novoSetorNome}
                    onChange={(e) => setNovoSetorNome(e.target.value)}
                  />
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => setModalAdicionar(false)} className="px-3 py-1.5 bg-white border text-slate-600 rounded-xl text-xs font-bold cursor-pointer">Cancelar</button>
                    <button type="submit" disabled={loading} className="px-4 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow cursor-pointer">Salvar</button>
                  </div>
                </form>
              </div>
            )}

            {/* MODAL INTERNO: RENOMEAR */}
            {setorParaRenomear && (
              <div className="bg-blue-50/70 p-4 rounded-2xl border border-blue-200 space-y-3">
                <h4 className="text-xs font-extrabold text-blue-900 uppercase">
                  Renomear "{setorParaRenomear}" (Atualiza todos os equipamentos em lote)
                </h4>
                <form onSubmit={handleRenomearEmLote} className="space-y-3">
                  <input
                    type="text"
                    required
                    placeholder="Novo nome..."
                    className="w-full bg-white border border-blue-300 p-2.5 rounded-xl text-sm font-bold text-slate-800 outline-none"
                    value={novoNomeSetor}
                    onChange={(e) => setNovoNomeSetor(e.target.value)}
                  />
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => setSetorParaRenomear(null)} className="px-3 py-1.5 bg-white border text-slate-600 rounded-xl text-xs font-bold cursor-pointer">Cancelar</button>
                    <button type="submit" disabled={loading} className="px-4 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-bold shadow cursor-pointer">Confirmar Alteração</button>
                  </div>
                </form>
              </div>
            )}

            {/* MODAL INTERNO: EXCLUIR (SIMPLES - SIM / NÃO) */}
            {setorParaExcluir && (
              <div className="bg-rose-50/70 p-4 rounded-2xl border border-rose-200 space-y-3 text-center">
                <h4 className="text-xs font-extrabold text-rose-900 uppercase">
                  Deseja realmente excluir o setor "{setorParaExcluir}"?
                </h4>
                <p className="text-[11px] text-rose-700 font-medium">
                  Os equipamentos vinculados a este setor serão movidos automaticamente para "sem setor".
                </p>
                <div className="flex justify-center gap-2 pt-2">
                  <button 
                    type="button" 
                    onClick={() => setSetorParaExcluir(null)} 
                    className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Não
                  </button>
                  <button 
                    type="button" 
                    disabled={loading} 
                    onClick={handleExcluirSetor} 
                    className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow cursor-pointer"
                  >
                    Sim, Excluir
                  </button>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2 border-t">
              <button
                type="button"
                onClick={() => setModalAberto(false)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold uppercase cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PainelGerenciarSetores;