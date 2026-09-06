import React, { useState } from "react";
import { useEstoque } from "../hooks/useEstoque";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { ModalPatrimonio, ModalPreviewTermo } from "../components/ModalEstoque";
import {
  Box,
  ArrowLeft,
  RefreshCw,
  Truck,
  Plus,
  Trash2,
  Clock,
  CheckCircle,
  FileText,
  X,
} from "lucide-react";

const Estoque = () => {
  const {
    itensEstoque,
    loading,
    processando,
    loteSaida,
    itemParaAdicionar,
    setItemParaAdicionar,
    patrimonioInput,
    setPatrimonioInput,
    qtdInput,
    setQtdInput,
    mostrarPreview,
    setMostrarPreview,
    naoSabeResponsavel,
    setNaoSabeResponsavel,
    dadosSaida,
    setDadosSaida,
    unidades,
    setoresPorUnidade,
    motivosSaida,
    isEstoque,
    carregarEstoque,
    adicionarAoLote,
    removerDoLote,
    efetivarTransferenciaESalvar,
    saidasPendentes = [],
    confirmarSaidaPendente,
    recusarTermoPendente,
    navigate,
  } = useEstoque();

  const [digitarSetorManual, setDigitarSetorManual] = useState(false);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const itensPorPagina = 5;

  // Estado para o Modal Personalizado de Confirmação
  const [saidaParaConfirmar, setSaidaParaConfirmar] = useState(null);
  const [nomeConfirmacao, setNomeConfirmacao] = useState("");
  const [deixarEmBrancoConfirmacao, setDeixarEmBrancoConfirmacao] = useState(false);

  // Filtra apenas registros com o formato novo (status explicitamente igual a "pendente")
  const pendentesFiltrados = saidasPendentes.filter(
    (saida) => String(saida.status || "").toLowerCase() === "pendente"
  );

  const indiceUltimoItem = paginaAtual * itensPorPagina;
  const indicePrimeiroItem = indiceUltimoItem - itensPorPagina;
  const itensPaginados = itensEstoque.slice(indicePrimeiroItem, indiceUltimoItem);
  const totalPaginas = Math.ceil(itensEstoque.length / itensPorPagina);

  const handleAbrirConfirmacao = (saida) => {
    setSaidaParaConfirmar(saida);
    setNomeConfirmacao(saida.responsavelRecebimento || "");
    setDeixarEmBrancoConfirmacao(false);
  };

  const handleExecutarConfirmacao = () => {
    if (!saidaParaConfirmar) return;
    const responsavelFinal = deixarEmBrancoConfirmacao ? "" : nomeConfirmacao.trim();
    confirmarSaidaPendente(saidaParaConfirmar, responsavelFinal);
    setSaidaParaConfirmar(null);
    setNomeConfirmacao("");
    setDeixarEmBrancoConfirmacao(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans print:bg-white print:p-0">
      <div className="print:hidden">
        <Header />
      </div>

      <main className="flex-grow p-4 md:p-8">
        <div className="print:hidden">
          <header className="max-w-7xl mx-auto mb-8">
            <button
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-2 text-slate-500 hover:text-blue-600 font-bold text-sm transition-colors mb-4 group cursor-pointer"
            >
              <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
              voltar ao dashboard
            </button>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2 uppercase tracking-tight">
                  <Box className="text-blue-600" size={28} /> central do estoque e distribuição
                </h1>
              </div>
              <button
                onClick={carregarEstoque}
                className="bg-white border border-slate-200 text-slate-600 px-5 py-2.5 rounded-xl flex items-center gap-2 text-sm font-bold hover:bg-slate-50 transition-all shadow-sm cursor-pointer"
              >
                <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                atualizar estoque
              </button>
            </div>
          </header>

          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            {/* Tabela de Itens Disponíveis */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                  <h2 className="font-black text-slate-700 uppercase text-xs tracking-wider">disponíveis no estoque</h2>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <th className="p-4">tipo de item</th>
                        <th className="p-4">patrimônio base</th>
                        <th className="p-4">detalhe / nome</th>
                        <th className="p-4">conservação</th>
                        <th className="p-4">qtd. disp.</th>
                        <th className="p-4">ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {loading ? (
                        <tr>
                          <td colSpan="6" className="p-10 text-center text-slate-400 font-bold">carregando...</td>
                        </tr>
                      ) : itensPaginados.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="p-10 text-center text-slate-400 font-bold">nenhum item encontrado no estoque.</td>
                        </tr>
                      ) : (
                        itensPaginados.map((item) => (
                          <tr key={item._id || item.id} className="hover:bg-blue-50/40 transition-colors">
                            <td className="p-4 font-bold text-blue-600 text-xs">
                              {item.tipoItem || item.tipo || item.categoria || "Não informado"}
                            </td>
                            <td className="p-4">
                              <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-lg font-mono text-xs font-bold">
                                {item.patrimonio || "S/P"}
                              </span>
                            </td>
                            <td className="p-4 text-xs font-bold text-slate-700">
                              {item.nome || ""}
                            </td>
                            <td className="p-4 text-xs">
                              <span className={`px-2.5 py-1 rounded-full text-[9px] font-black ${
                                String(item.estadoConservacao || item.conservacao || item.estado || "").toLowerCase() === 'novo'
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                  : 'bg-slate-100 text-slate-700 border border-slate-200'
                              }`}>
                                {item.estadoConservacao || item.conservacao || item.estado || "Não informado"}
                              </span>
                            </td>
                            <td className="p-4 font-black text-slate-600">{item.quantidade || 1}</td>
                            <td className="p-4">
                              <button
                                onClick={() => {
                                  setItemParaAdicionar(item);
                                  setQtdInput(1);
                                  const pat = item.patrimonio || "";
                                  setPatrimonioInput(pat.toLowerCase() === "s/p" || pat.toLowerCase() === "sp" ? "" : pat);
                                }}
                                className="bg-slate-100 text-slate-700 hover:bg-blue-600 hover:text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                              >
                                <Plus size={14} /> preparar saída
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {totalPaginas > 1 && (
                  <div className="p-4 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500">
                      página {paginaAtual} de {totalPaginas} (total: {itensEstoque.length} itens)
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setPaginaAtual((prev) => Math.max(prev - 1, 1))}
                        disabled={paginaAtual === 1}
                        className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                      >
                        anterior
                      </button>
                      <button
                        onClick={() => setPaginaAtual((prev) => Math.min(prev + 1, totalPaginas))}
                        disabled={paginaAtual === totalPaginas}
                        className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                      >
                        próxima
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Lote de Distribuição */}
            <div className="space-y-6">
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <h2 className="font-black text-slate-800 uppercase text-sm tracking-tight flex items-center gap-2">
                    <Truck size={18} className="text-blue-600" /> lote de distribuição
                  </h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">unidade destino</label>
                    <select
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-sm font-bold text-slate-700 outline-none"
                      value={dadosSaida.novaUnidade}
                      onChange={(e) => {
                        const selecionado = e.target.value;
                        setDigitarSetorManual(false);
                        setDadosSaida({ 
                          ...dadosSaida, 
                          novaUnidade: selecionado,
                          novoSetor: "" 
                        });
                      }}
                    >
                      <option value="">selecione a unidade...</option>
                      {unidades.map((u) => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        {isEstoque ? "classificação no estoque" : "setor destino"}
                      </label>
                      {dadosSaida.novaUnidade && !isEstoque && (
                        <button
                          type="button"
                          onClick={() => {
                            setDigitarSetorManual(!digitarSetorManual);
                            setDadosSaida({ ...dadosSaida, novoSetor: "" });
                          }}
                          className="text-[10px] font-bold text-blue-600 hover:underline cursor-pointer"
                        >
                          {digitarSetorManual ? "escolher da lista" : "não achou? digitar setor"}
                        </button>
                      )}
                    </div>

                    {digitarSetorManual || isEstoque ? (
                      <input
                        type="text"
                        placeholder={isEstoque ? "ex: equipamento usado, reserva" : "digite o nome do setor manualmente..."}
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-sm font-bold text-slate-700 outline-none border-l-4 border-l-amber-500"
                        value={dadosSaida.novoSetor}
                        onChange={(e) => setDadosSaida({ ...dadosSaida, novoSetor: e.target.value })}
                      />
                    ) : (
                      <select
                        disabled={!dadosSaida.novaUnidade}
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-sm font-bold text-slate-700 outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                        value={dadosSaida.novoSetor}
                        onChange={(e) => {
                          if (e.target.value === "OUTRO_MANUAL") {
                            setDigitarSetorManual(true);
                            setDadosSaida({ ...dadosSaida, novoSetor: "" });
                          } else {
                            setDadosSaida({ ...dadosSaida, novoSetor: e.target.value });
                          }
                        }}
                      >
                        <option value="">
                          {dadosSaida.novaUnidade ? "selecione o setor oficial..." : "selecione uma unidade primeiro..."}
                        </option>
                        {dadosSaida.novaUnidade && (
                          <>
                            {setoresPorUnidade[dadosSaida.novaUnidade]?.map((setor) => (
                              <option key={setor} value={setor}>
                                {setor}
                              </option>
                            ))}
                            <option value="OUTRO_MANUAL" className="text-blue-600 font-bold">
                              ➕ outro (digitar manualmente...)
                            </option>
                          </>
                        )}
                      </select>
                    )}
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">responsável pelo recebimento</label>
                      <label className="flex items-center gap-1 text-[10px] font-bold text-blue-600 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          className="rounded border-slate-300 focus:ring-blue-500"
                          checked={naoSabeResponsavel}
                          onChange={(e) => {
                            setNaoSabeResponsavel(e.target.checked);
                            if (e.target.checked) {
                              setDadosSaida(prev => ({ ...prev, responsavelRecebimento: "" }));
                            }
                          }}
                        />
                        deixar em branco
                      </label>
                    </div>
                    <input
                      type="text"
                      disabled={naoSabeResponsavel}
                      placeholder={naoSabeResponsavel ? "será preenchido ao confirmar a entrega" : "quem vai assinar o documento"}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-sm font-bold text-slate-700 outline-none disabled:opacity-60 disabled:bg-slate-100 disabled:cursor-not-allowed"
                      value={dadosSaida.responsavelRecebimento}
                      onChange={(e) => setDadosSaida({ ...dadosSaida, responsavelRecebimento: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                      motivo da saída / troca
                    </label>
                    <select
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-sm font-bold text-slate-700 outline-none border-l-4 border-l-blue-500"
                      value={dadosSaida.motivo}
                      onChange={(e) => setDadosSaida({ ...dadosSaida, motivo: e.target.value })}
                    >
                      {motivosSaida.map((m) => (
                        <option key={m.value} value={m.value}>{m.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <hr className="border-slate-100" />

                <div>
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">equipamentos no lote ({loteSaida.length})</h3>
                  {loteSaida.length === 0 ? (
                    <div className="text-center p-6 bg-slate-50 rounded-2xl text-xs font-bold text-slate-400 border border-dashed border-slate-200">
                      nenhum item adicionado ao lote.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="max-h-60 overflow-y-auto pr-1 space-y-2">
                        {loteSaida.map((item, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                            <div>
                              <p className="text-xs font-bold text-slate-700">{item.nome || item.nomeEquipamento || ""}</p>
                              <p className="text-[10px] font-mono font-bold text-blue-600">pat: {item.patrimonioMapeado || item.patrimonio || ""}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="bg-blue-100 text-blue-700 font-black px-2 py-0.5 rounded-md text-xs">x{item.quantidadeMovimentada || item.quantidadeRetirada || 1}</span>
                              <button onClick={() => removerDoLote(index)} className="text-red-500 hover:text-red-700 p-1 cursor-pointer">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      <button
                        type="button"
                        disabled={!dadosSaida.novaUnidade || !dadosSaida.novoSetor}
                        onClick={() => setMostrarPreview(true)}
                        className="w-full bg-slate-800 text-white font-bold py-3 rounded-2xl hover:bg-slate-900 transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-wider mt-4 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                      >
                        <FileText size={16} /> salvar saída como pendente
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* SEÇÃO DE SAÍDAS PENDENTES COM BOTÕES DE CONFIRMAR E EXCLUIR */}
          <div className="max-w-7xl mx-auto mt-8">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-amber-100 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-amber-50 rounded-xl text-amber-600">
                    <Clock size={20} />
                  </div>
                  <div>
                    <h2 className="font-black text-slate-800 uppercase text-sm tracking-tight">
                      saídas pendentes de confirmação
                    </h2>
                    <p className="text-xs text-slate-400">
                      registros salvos com status "pendente". você pode confirmar a entrega ou excluir o registro pendente.
                    </p>
                  </div>
                </div>
                <span className="bg-amber-100 text-amber-800 text-xs font-black px-3 py-1 rounded-full">
                  {pendentesFiltrados.length} pendente(s)
                </span>
              </div>

              {pendentesFiltrados.length === 0 ? (
                <div className="text-center p-8 bg-slate-50/50 rounded-2xl text-xs font-bold text-slate-400 border border-dashed border-slate-200">
                  nenhuma saída pendente encontrada na base de dados.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pendentesFiltrados.map((saida) => (
                    <div
                      key={saida._id || saida.id}
                      className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col justify-between space-y-3 hover:border-amber-300 transition-all"
                    >
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-start">
                          <span className="text-[10px] font-mono font-bold text-slate-400">
                            {saida.dataSaida ? new Date(saida.dataSaida).toLocaleDateString("pt-BR") : "sem data"}
                          </span>
                          <span className="bg-amber-100 text-amber-800 text-[9px] font-black uppercase px-2 py-0.5 rounded">
                            {saida.status || "pendente"}
                          </span>
                        </div>
                        
                        <p className="text-xs font-black text-slate-800">
                          {saida.unidadeDestino} - {saida.setorDestino}
                        </p>
                        
                        <div className="bg-white p-2.5 rounded-xl border border-slate-200 space-y-1">
                          <p className="text-xs font-bold text-blue-700">
                            {saida.nomeEquipamento || "equipamento sem nome"}
                          </p>
                          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                            <span>patrimônio: {saida.patrimonio || "sp"}</span>
                            <span>qtd: {saida.quantidadeRetirada || 1}</span>
                          </div>
                        </div>

                        <p className="text-[11px] font-medium text-slate-500">
                          motivo: {saida.motivo || "não informado"}
                        </p>
                        <p className="text-[10px] font-medium text-slate-400">
                          responsável: {saida.responsavelRecebimento || "não informado"}
                        </p>
                      </div>

                      {/* AÇÕES: CONFIRMAR OU EXCLUIR */}
                      <div className="flex gap-2 pt-2 border-t border-slate-200/60">
                        {recusarTermoPendente && (
                          <button
                            onClick={() => {
                              if (window.confirm("deseja realmente excluir/cancelar esta saída pendente?")) {
                                recusarTermoPendente(saida);
                              }
                            }}
                            className="bg-red-50 hover:bg-red-100 text-red-600 font-bold px-3 py-2 rounded-xl text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer border border-red-200"
                            title="excluir / cancelar saída"
                          >
                            <Trash2 size={14} /> excluir
                          </button>
                        )}

                        {confirmarSaidaPendente && (
                          <button
                            onClick={() => handleAbrirConfirmacao(saida)}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                          >
                            <CheckCircle size={14} /> confirmar
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* MODAL PERSONALIZADO DE CONFIRMAÇÃO DE BAIXA */}
        {saidaParaConfirmar && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
            <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 border border-slate-100">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="font-black text-slate-800 uppercase text-xs tracking-wider flex items-center gap-2">
                  <CheckCircle size={18} className="text-emerald-600" /> confirmar baixa no estoque
                </h3>
                <button
                  onClick={() => setSaidaParaConfirmar(null)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3">
                <p className="text-xs text-slate-600 font-medium">
                  digite o nome do responsável pelo recebimento para dar baixa definitiva:
                </p>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      responsável pelo recebimento
                    </label>
                    <label className="flex items-center gap-1.5 text-[10px] font-bold text-blue-600 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        checked={deixarEmBrancoConfirmacao}
                        onChange={(e) => {
                          setDeixarEmBrancoConfirmacao(e.target.checked);
                          if (e.target.checked) {
                            setNomeConfirmacao("");
                          }
                        }}
                      />
                      deixar em branco
                    </label>
                  </div>

                  <input
                    type="text"
                    disabled={deixarEmBrancoConfirmacao}
                    placeholder={deixarEmBrancoConfirmacao ? "ficará sem responsável" : "nome do responsável..."}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold text-slate-700 outline-none focus:border-blue-500 disabled:opacity-60 disabled:bg-slate-100 disabled:cursor-not-allowed transition-all"
                    value={nomeConfirmacao}
                    onChange={(e) => setNomeConfirmacao(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSaidaParaConfirmar(null)}
                  className="w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
                >
                  cancelar
                </button>
                <button
                  type="button"
                  onClick={handleExecutarConfirmacao}
                  className="w-1/2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <CheckCircle size={16} /> confirmar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modais Extraídos */}
        <ModalPatrimonio 
          itemParaAdicionar={itemParaAdicionar}
          setItemParaAdicionar={setItemParaAdicionar}
          patrimonioInput={patrimonioInput}
          setPatrimonioInput={setPatrimonioInput}
          qtdInput={qtdInput}
          setQtdInput={setQtdInput}
          adicionarAoLote={adicionarAoLote}
        />

        <ModalPreviewTermo 
          mostrarPreview={mostrarPreview}
          setMostrarPreview={setMostrarPreview}
          efetivarTransferenciaESalvar={efetivarTransferenciaESalvar}
          processando={processando}
          dadosSaida={dadosSaida}
          isEstoque={isEstoque}
          naoSabeResponsavel={naoSabeResponsavel}
          loteSaida={loteSaida}
        />
      </main>

      <div className="print:hidden">
        <Footer />
      </div>
    </div>
  );
};

export default Estoque;