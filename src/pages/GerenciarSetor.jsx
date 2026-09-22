import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  FiBox,
  FiArrowLeft,
  FiPackage,
  FiFilter,
  FiChevronLeft,
  FiChevronRight,
  FiRotateCcw,
  FiChevronDown,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiSearch,
  FiAlertTriangle,
  FiRefreshCw
} from "react-icons/fi";
import { toast } from "react-toastify";
import { useGerenciarSetor } from "../hooks/useGerenciarSetor";
import { useSetores } from "../components/constants/setores";
import CadastroRapido from "../pages/CadastroRapido";
import PainelGerenciarSetores from "../components/PainelGerenciarSetores";
import api from "../services/api";

const GerenciarSetor = () => {
  const {
    verificandoAcesso,
    patrimonioBusca, setPatrimonioBusca,
    nomeBusca, setNomeBusca,
    setorBusca, setSetorBusca,
    unidadeFiltro, setUnidadeFiltro,
    mostrarDropdown, setMostrarDropdown,
    dropdownRef,
    unidades,
    obterSetoresFiltrados,
    limparBusca,
    executarBusca,
    itensExibidos,
    paginaAtual, setPaginaAtual,
    totalPaginas,
    showModal, setShowModal,
    modoEdicao, setModoEdicao,
    showModalExcluir, setShowModalExcluir,
    setItemSelecionado,
    formData, setFormData,
    handleExcluir,
    loading
  } = useGerenciarSetor();

  const { mapaSetores, carregarSetores } = useSetores();

  // Estados dos Modais de Ações em Lote do Setor
  const [modalRenomear, setModalRenomear] = useState(false);
  const [novoNomeSetor, setNovoNomeSetor] = useState("");
  const [modalExcluirSetor, setModalExcluirSetor] = useState(false);
  const [setorDestinoExclusao, setSetorDestinoExclusao] = useState("");
  const [loadingLote, setLoadingLote] = useState(false);

  // Lista de setores da unidade atual selecionada no filtro
  const setoresUnidadeAtual = useMemo(() => {
    if (!unidadeFiltro) return [];
    return mapaSetores[unidadeFiltro.toLowerCase().trim()] || [];
  }, [unidadeFiltro, mapaSetores]);

  // 1. Renomear Setor e atualizar todos os equipamentos vinculados em lote
  const handleRenomearSetorEmLote = async (e) => {
    e.preventDefault();
    if (!novoNomeSetor.trim() || !setorBusca || !unidadeFiltro) {
      toast.error("preencha a unidade, o setor atual e o novo nome.");
      return;
    }

    setLoadingLote(true);
    const idToast = toast.loading("renomeando setor e atualizando equipamentos em lote...");

    try {
      const res = await api.put("/setores/renomear", {
        unidade: unidadeFiltro,
        setorAntigo: setorBusca,
        setorNovo: novoNomeSetor.trim().toLowerCase()
      });

      toast.update(idToast, {
        render: `sucesso! ${res.data?.equipamentosAfetados || 0} equipamentos foram alterados para "${novoNomeSetor.trim().toLowerCase()}".`,
        type: "success",
        isLoading: false,
        autoClose: 3000
      });

      const novoNomeFormatado = novoNomeSetor.trim().toLowerCase();
      setModalRenomear(false);
      setNovoNomeSetor("");
      setSetorBusca(novoNomeFormatado);

      await carregarSetores();
      executarBusca();
    } catch (err) {
      console.error("erro ao renomear setor:", err);
      toast.update(idToast, {
        render: err.response?.data?.error || "erro ao renomear setor no servidor.",
        type: "error",
        isLoading: false,
        autoClose: 3000
      });
    } finally {
      setLoadingLote(false);
    }
  };

  // 2. Excluir Setor e transferir ativos para outro setor
  const handleExcluirSetorEmLote = async (e) => {
    e.preventDefault();
    if (!unidadeFiltro || !setorBusca) return;

    setLoadingLote(true);
    const idToast = toast.loading("excluindo setor e transferindo equipamentos...");

    try {
      const res = await api.delete("/setores/excluir-completo", {
        data: {
          unidade: unidadeFiltro,
          setorParaRemover: setorBusca,
          setorDestino: setorDestinoExclusao || "sem setor"
        }
      });

      toast.update(idToast, {
        render: `setor removido! ${res.data?.equipamentosAfetados || 0} equipamentos foram transferidos.`,
        type: "success",
        isLoading: false,
        autoClose: 3000
      });

      setModalExcluirSetor(false);
      setSetorDestinoExclusao("");
      setSetorBusca("");

      await carregarSetores();
      executarBusca();
    } catch (err) {
      console.error("erro ao excluir setor:", err);
      toast.update(idToast, {
        render: err.response?.data?.error || "erro ao excluir setor.",
        type: "error",
        isLoading: false,
        autoClose: 3000
      });
    } finally {
      setLoadingLote(false);
    }
  };

  if (verificandoAcesso) return null;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* CABEÇALHO */}
        <header className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <FiBox className="text-blue-600" /> gerenciar equipamentos por setor
          </h1>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setModoEdicao(false);
                setItemSelecionado(null);
                setFormData({
                  patrimonio: "",
                  nome: "",
                  tipoItem: "mobiliário",
                  unidade: String(unidadeFiltro || "hospital conde").toLowerCase().trim(),
                  setor: String(setorBusca || "").toLowerCase().trim(),
                  estado: "novo",
                  observacoes: ""
                });
                setShowModal(true);
              }}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs uppercase shadow-md transition-all cursor-pointer"
            >
              <FiPlus size={16} /> novo equipamento
            </button>
            <Link
              to="/dashboard"
              className="flex items-center gap-2 text-slate-500 hover:text-blue-600 font-bold transition-colors bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-sm"
            >
              <FiArrowLeft /> voltar
            </Link>
          </div>
        </header>

        {/* PAINEL DE GESTÃO DE SETORES (Adicionar, Renomear e Excluir) */}
        <PainelGerenciarSetores 
          unidadeAtual={unidadeFiltro} 
          setorAtual={setorBusca} 
          onAtualizarTela={executarBusca} 
        />

        {/* ÁREA DE FILTROS */}
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-4 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1">
              <FiFilter /> unidade atual
            </label>
            <select
              className="border border-slate-200 p-2 rounded-lg text-sm outline-blue-500 bg-white cursor-pointer h-[38px]"
              value={unidadeFiltro}
              onChange={(e) => setUnidadeFiltro(e.target.value)}
            >
              <option value="">todas</option>
              {unidades.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1 relative" ref={dropdownRef}>
            <label className="text-xs font-bold text-slate-400 uppercase">setor atual</label>
            <div className="flex">
              <div className="relative flex-1 flex items-center">
                <input
                  type="text"
                  className="w-full border border-slate-200 p-2 pr-8 rounded-l-lg text-sm outline-blue-500 h-[38px]"
                  placeholder="ex: emergência, uti..."
                  value={setorBusca}
                  onFocus={() => setMostrarDropdown(true)}
                  onChange={(e) => {
                    setSetorBusca(e.target.value);
                    setMostrarDropdown(true);
                  }}
                />
                <button 
                  type="button"
                  onClick={() => setMostrarDropdown(!mostrarDropdown)}
                  className="absolute right-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <FiChevronDown size={16} />
                </button>
              </div>
            </div>

            {mostrarDropdown && (
              <div className="absolute left-0 right-0 top-[62px] bg-white border border-slate-200 rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto">
                {obterSetoresFiltrados().length > 0 ? (
                  obterSetoresFiltrados().map((setor, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => {
                        setSetorBusca(setor);
                        setMostrarDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-blue-600 border-b border-slate-50 last:border-0 transition-colors font-medium cursor-pointer"
                    >
                      {setor}
                    </button>
                  ))
                ) : (
                  <div className="p-3 text-xs text-slate-400 text-center font-medium">
                    nenhum setor disponível
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-400 uppercase">nº patrimônio</label>
            <input
              type="text"
              className="w-full border border-slate-200 p-2 rounded-lg text-sm outline-blue-500 h-[38px]"
              placeholder="ex: hmc-001"
              value={patrimonioBusca}
              onChange={(e) => setPatrimonioBusca(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-400 uppercase">nome do equipamento</label>
            <input
              type="text"
              className="w-full border border-slate-200 p-2 rounded-lg text-sm outline-blue-500 h-[38px]"
              placeholder="ex: monitor..."
              value={nomeBusca}
              onChange={(e) => setNomeBusca(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 lg:col-span-2">
            <button
              type="button"
              disabled={loading}
              onClick={executarBusca}
              className="flex-1 h-[38px] flex items-center justify-center gap-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-all shadow-sm cursor-pointer disabled:opacity-50 text-sm"
            >
              <FiSearch /> {loading ? "buscando..." : "buscar"}
            </button>
            <button
              type="button"
              onClick={limparBusca}
              className="flex-1 h-[38px] flex items-center justify-center gap-2 bg-slate-100 text-slate-600 font-bold rounded-lg hover:bg-red-50 hover:text-red-600 transition-all border border-slate-200 cursor-pointer text-sm"
            >
              <FiRotateCcw /> limpar
            </button>
          </div>
        </section>

        {/* RESULTADOS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {itensExibidos.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-400 font-medium bg-white rounded-2xl border border-slate-200">
              nenhum equipamento encontrado com estes filtros.
            </div>
          ) : (
            itensExibidos.map((item) => (
              <div
                key={item.id || item._id}
                className="bg-white p-5 rounded-xl border border-slate-200 hover:border-blue-400 transition-all hover:shadow-md flex flex-col justify-between relative group"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                        <FiPackage size={20} />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800 capitalize">{item.nome}</h3>
                        <span className="text-[10px] font-black bg-slate-100 px-2 py-0.5 rounded text-slate-500 uppercase mt-1 inline-block">
                          {item.patrimonio || "s/p"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          const itemId = item.id || item._id;
                          setItemSelecionado(item);
                          setFormData({
                            id: itemId,
                            _id: itemId,
                            patrimonio: String(item.patrimonio || "").toLowerCase().trim(),
                            nome: String(item.nome || "").toLowerCase().trim(),
                            tipoItem: String(item.tipoItem || item.tipo || "mobiliário").toLowerCase().trim(),
                            unidade: String(item.unidade || "hospital conde").toLowerCase().trim(),
                            setor: String(item.setor || "").toLowerCase().trim(),
                            estado: String(item.estado || "novo").toLowerCase().trim(),
                            observacoes: String(item.observacoes || "").toLowerCase().trim()
                          });
                          setModoEdicao(true);
                          setShowModal(true);
                        }}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all cursor-pointer"
                        title="editar"
                      >
                        <FiEdit2 size={16} />
                      </button>
                      <button
                        onClick={() => {
                          setItemSelecionado(item);
                          setShowModalExcluir(true);
                        }}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                        title="excluir"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-50 text-xs text-slate-500">
                  local:{" "}
                  <strong className="text-slate-700 capitalize">
                    {item.unidade} - {item.setor}
                  </strong>
                </div>
              </div>
            ))
          )}
        </div>

        {/* PAGINAÇÃO */}
        {totalPaginas > 1 && (
          <div className="flex justify-center items-center gap-4 mt-8">
            <button
              disabled={paginaAtual === 1}
              onClick={() => setPaginaAtual((prev) => prev - 1)}
              className="p-2 rounded bg-white border disabled:opacity-50 cursor-pointer shadow-sm"
            >
              <FiChevronLeft />
            </button>
            <span className="text-sm font-bold text-slate-600">
              página {paginaAtual} de {totalPaginas}
            </span>
            <button
              disabled={paginaAtual === totalPaginas}
              onClick={() => setPaginaAtual((prev) => prev + 1)}
              className="p-2 rounded bg-white border disabled:opacity-50 cursor-pointer shadow-sm"
            >
              <FiChevronRight />
            </button>
          </div>
        )}
      </div>

      {/* MODAL DE CADASTRO RÁPIDO / EDIÇÃO */}
      {showModal && (
        <CadastroRapido
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            if (modoEdicao) {
              setShowModal(false);
            }
            executarBusca();
          }}
          initialData={modoEdicao ? formData : null}
          isEditing={modoEdicao}
        />
      )}

      {/* MODAL DE EXCLUSÃO */}
      {showModalExcluir && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl border border-slate-100">
            <h3 className="font-bold text-lg text-slate-800 mb-2">excluir equipamento?</h3>
            <p className="text-slate-500 text-xs mb-6">esta ação removerá permanentemente o item do sistema.</p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setShowModalExcluir(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold text-xs uppercase cursor-pointer"
              >
                cancelar
              </button>
              <button
                onClick={handleExcluir}
                disabled={loading}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs uppercase shadow-md cursor-pointer"
              >
                sim, excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GerenciarSetor;