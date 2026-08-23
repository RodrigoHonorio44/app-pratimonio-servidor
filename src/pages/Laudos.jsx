import React, { useState } from "react";
import { useLaudos } from "../hooks/useLaudos";
import {
  Search,
  Wrench,
  RefreshCw,
  FileText,
  FilterX,
  MapPin,
  Layers,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Edit2,
  PlusCircle,
  PackagePlus,
} from "lucide-react";

import Header from "../components/Header";
import Footer from "../components/Footer";
import ModalLaudoTecnico from "../components/ModalLaudoTecnico";

const Laudos = () => {
  const {
    itensFiltrados,
    unidadesDisponiveis,
    setoresDaUnidadeAtual,
    loading,
    hasSearched,
    buscaPatrimonio,
    setBuscaPatrimonio,
    unidadeSelecionada,
    setUnidadeSelecionada,
    buscaSetor,
    setBuscaSetor,
    laudosPendentes,
    loadingLaudos,
    processandoAcao,
    modalAberto,
    setModalAberto,
    equipamentoSelecionado,
    setEquipamentoSelecionado,
    carregarLaudosPendentes,
    carregarDados,
    handleAprovarLaudo,
    handleCancelarLaudo,
    handleLimparBusca,
    abrirLaudo,
    handleSalvarEdicaoLaudo,
  } = useLaudos();

  // Estado para alternar entre Select e Input manual do setor
  const [isSetorManual, setIsSetorManual] = useState(false);

  // Estado para controlar a exibição do Card de Equipamento Manual
  const [mostrarCadastroManual, setMostrarCadastroManual] = useState(false);
  const [itemManual, setItemManual] = useState({
    patrimonio: "",
    nome: "",
    unidade: "",
    setor: "",
  });

  // Estados locais para controle do modal de edição do laudo emitido
  const [laudoEmEdicao, setLaudoEmEdicao] = useState(null);
  const [diagnosticoEdit, setDiagnosticoEdit] = useState("");
  const [justificativaEdit, setJustificativaEdit] = useState("");

  const handleAbrirEdicao = (laudo) => {
    setLaudoEmEdicao(laudo);
    setDiagnosticoEdit(laudo.diagnosticoDefeito || laudo.diagnosticoTecnico || "");
    setJustificativaEdit(laudo.justificativaSubstituicao || laudo.justificativa || "");
  };

  const handleConfirmarEdicao = async () => {
    if (!laudoEmEdicao) return;

    const laudoAtualizado = {
      ...laudoEmEdicao,
      diagnosticoDefeito: diagnosticoEdit.toLowerCase(),
      diagnosticoTecnico: diagnosticoEdit.toLowerCase(),
      justificativaSubstituicao: justificativaEdit.toLowerCase(),
    };

    if (handleSalvarEdicaoLaudo) {
      await handleSalvarEdicaoLaudo(laudoAtualizado);
    }

    setLaudoEmEdicao(null);
    carregarLaudosPendentes();
  };

  // Submeter o item cadastrado manualmente direto para a emissão do laudo
  const handleEmitirLaudoManual = (e) => {
    e.preventDefault();
    if (!itemManual.nome.trim()) {
      alert("Por favor, informe ao menos o nome do equipamento.");
      return;
    }

    const novoEquipamentoManual = {
      id: `manual_${Date.now()}`,
      patrimonio: itemManual.patrimonio.toLowerCase().trim() || "s/p",
      nome: itemManual.nome.toLowerCase().trim(),
      unidade: (itemManual.unidade || unidadeSelecionada || "não informada").toLowerCase().trim(),
      setor: (itemManual.setor || buscaSetor || "não informado").toLowerCase().trim(),
    };

    // Abre o modal de laudo para este novo item gerado manualmente
    abrirLaudo(novoEquipamentoManual);

    // Reseta formulário manual e fecha a aba
    setItemManual({ patrimonio: "", nome: "", unidade: "", setor: "" });
    setMostrarCadastroManual(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
      <Header />

      <main className="flex-grow p-4 md:p-8 max-w-7xl w-full mx-auto space-y-8">
        <header className="text-center md:text-left">
          <h1 className="text-2xl font-black text-slate-800 flex flex-col md:flex-row items-center gap-2 uppercase tracking-tight justify-center md:justify-start">
            <FileText className="text-blue-600 hidden md:block" size={28} />
            Painel de Controle e Emissão de Laudos
          </h1>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mt-1">
            Setor de Patrimônio
          </p>
        </header>

        {/* Bloco de Filtros Inteligentes */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 items-end">
          {/* 1º Filtro: Unidade Atual */}
          <div className="w-full md:w-56">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">
              <MapPin size={12} className="text-blue-500" /> Unidade Atual
            </label>
            <select
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none appearance-none cursor-pointer lowercase"
              value={unidadeSelecionada}
              onChange={(e) => {
                setUnidadeSelecionada(e.target.value.toLowerCase());
                setBuscaSetor("");
              }}
            >
              <option value="">Todas as Unidades...</option>
              {unidadesDisponiveis.map((unidade, index) => (
                <option key={index} value={unidade.toLowerCase()}>
                  {unidade.toLowerCase()}
                </option>
              ))}
            </select>
          </div>

          {/* 2º Filtro: Setor Comercial / Técnico + Opção Manual */}
          <div className="w-full md:w-56">
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                <Layers size={12} className="text-blue-500" /> Setor
              </label>
              <button
                type="button"
                onClick={() => setIsSetorManual(!isSetorManual)}
                className="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Edit2 size={10} />
                {isSetorManual ? "Selecionar da lista" : "Digitar setor manual"}
              </button>
            </div>

            {isSetorManual || !setoresDaUnidadeAtual || setoresDaUnidadeAtual.length === 0 ? (
              <input
                type="text"
                placeholder="digite o setor manual..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none lowercase"
                value={buscaSetor}
                onChange={(e) => setBuscaSetor(e.target.value.toLowerCase())}
              />
            ) : (
              <select
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none appearance-none cursor-pointer lowercase"
                value={buscaSetor}
                onChange={(e) => setBuscaSetor(e.target.value.toLowerCase())}
              >
                <option value="">Todos os Setores...</option>
                {setoresDaUnidadeAtual.map((setor, index) => (
                  <option key={index} value={setor.toLowerCase()}>
                    {setor.toLowerCase()}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* 3º Filtro: Buscar Equipamento */}
          <div className="flex-grow w-full md:w-auto">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">
              Buscar Equipamento (Patrimônio ou Nome)
            </label>
            <input
              type="text"
              placeholder="ex: monitor ou #105"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none lowercase"
              value={buscaPatrimonio}
              onChange={(e) => setBuscaPatrimonio(e.target.value.toLowerCase())}
            />
          </div>

          {/* Botões de Ação dos Filtros */}
          <div className="flex gap-2 w-full md:w-auto">
            <button
              type="button"
              onClick={() => {
                handleLimparBusca();
                setIsSetorManual(false);
              }}
              className="w-1/3 md:w-auto bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all cursor-pointer border border-slate-200"
              title="Limpar filtros"
            >
              <FilterX size={20} />
              <span className="md:hidden lg:inline">Limpar</span>
            </button>

            <button
              onClick={carregarDados}
              className="w-2/3 md:w-auto flex-grow bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-blue-100 whitespace-nowrap"
            >
              {loading ? <RefreshCw className="animate-spin" size={20} /> : <Search size={20} />}
              Consultar
            </button>
          </div>
        </div>

        {/* Tabela 1: Ativos Localizados + Botão "+ Item Não Encontrado" */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-4 bg-slate-50/60 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
            <h2 className="text-xs font-black uppercase text-slate-500 tracking-wider">
              Ativos Disponíveis para Emissão
            </h2>

            {/* BOTÃO PARA ITEM NÃO ENCONTRADO / MANUAL */}
            <button
              type="button"
              onClick={() => setMostrarCadastroManual(!mostrarCadastroManual)}
              className="bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 border border-blue-200 transition-colors cursor-pointer"
            >
              <PackagePlus size={16} />
              <span>+ Item Não Encontrado</span>
            </button>
          </div>

          {/* CARD DE ADICIONAR EQUIPAMENTO MANUALMENTE */}
          {mostrarCadastroManual && (
            <div className="p-5 bg-blue-50/40 border-b border-blue-100 m-4 rounded-2xl space-y-3">
              <div className="flex items-center justify-between border-b border-blue-200/60 pb-2">
                <span className="text-xs font-black text-blue-900 uppercase tracking-wide flex items-center gap-2">
                  <Wrench size={16} className="text-blue-600" /> Descrever Equipamento Manualmente
                </span>
                <button
                  type="button"
                  onClick={() => setMostrarCadastroManual(false)}
                  className="text-xs font-bold text-slate-400 hover:text-slate-600"
                >
                  Cancelar
                </button>
              </div>

              <form onSubmit={handleEmitirLaudoManual} className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">
                      Patrimônio (TAG)
                    </label>
                    <input
                      type="text"
                      placeholder="ex: 37031"
                      className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 lowercase"
                      value={itemManual.patrimonio}
                      onChange={(e) =>
                        setItemManual({ ...itemManual, patrimonio: e.target.value })
                      }
                    />
                  </div>

                  <div className="md:col-span-3">
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">
                      Descrição do Equipamento *
                    </label>
                    <input
                      type="text"
                      placeholder="ex: estante de aço 6 prateleiras"
                      required
                      className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 lowercase"
                      value={itemManual.nome}
                      onChange={(e) => setItemManual({ ...itemManual, nome: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">
                      Unidade de Origem
                    </label>
                    <input
                      type="text"
                      placeholder="ex: hospital conde"
                      className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 lowercase"
                      value={itemManual.unidade}
                      onChange={(e) => setItemManual({ ...itemManual, unidade: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">
                      Setor de Alocação
                    </label>
                    <input
                      type="text"
                      placeholder="ex: almoxarifado / arquivo"
                      className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 lowercase"
                      value={itemManual.setor}
                      onChange={(e) => setItemManual({ ...itemManual, setor: e.target.value })}
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-100 transition-all cursor-pointer"
                  >
                    <PlusCircle size={15} />
                    <span>Prosseguir para Emissão do Laudo</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {!hasSearched ? (
            <div className="h-[200px] flex flex-col items-center justify-center text-slate-300">
              <Wrench size={40} className="mb-2 opacity-20" />
              <p className="font-bold text-xs text-slate-400">
                Use os filtros acima ou clique em "+ Item Não Encontrado" para criar manualmente.
              </p>
            </div>
          ) : itensFiltrados.length === 0 ? (
            <div className="h-[200px] flex flex-col items-center justify-center text-slate-400">
              <FilterX size={40} className="mb-2 opacity-20" />
              <p className="font-bold text-xs">Nenhum equipamento localizado para esta pesquisa.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/40 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <th className="p-4">Patrimônio</th>
                    <th className="p-4">Equipamento</th>
                    <th className="p-4">Unidade / Setor</th>
                    <th className="p-4 text-center">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {itensFiltrados.map((item) => (
                    <tr key={item.id || item._id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="p-4 font-black text-blue-600">#{item.patrimonio || "s/p"}</td>
                      <td className="p-4 font-bold text-slate-700 lowercase text-xs">
                        {item.nome?.toLowerCase()}
                      </td>
                      <td className="p-4 text-xs font-bold text-slate-500">
                        <span className="lowercase">{item.unidade?.toLowerCase()}</span> <br />
                        <span className="font-normal opacity-70 lowercase text-[10px]">
                          {item.setor?.toLowerCase()}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => abrirLaudo(item)}
                          className="bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border border-blue-100"
                        >
                          Emitir Laudo
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Tabela 2: Seção de Laudos Gerados Aguardando Decisão / Baixa */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-4 bg-amber-50/50 border-b border-amber-100/60 flex items-center gap-2">
            <Clock size={16} className="text-amber-600" />
            <h2 className="text-xs font-black uppercase text-amber-800 tracking-wider">
              Laudos Técnicos Emitidos (Aguardando Decisão / Baixa)
            </h2>
          </div>

          {loadingLaudos ? (
            <div className="h-[180px] flex items-center justify-center text-slate-400 gap-2">
              <RefreshCw className="animate-spin text-amber-500" size={18} />
              <span className="text-xs font-bold uppercase tracking-wider">
                Carregando seus registros pendentes...
              </span>
            </div>
          ) : laudosPendentes.length === 0 ? (
            <div className="h-[180px] flex flex-col items-center justify-center text-slate-400">
              <AlertCircle size={36} className="mb-1 opacity-20" />
              <p className="font-bold text-xs">
                Nenhum laudo aguardando a sua aprovação ou decisão de baixa.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                    <th className="p-4">Patrimônio</th>
                    <th className="p-4">Equipamento</th>
                    <th className="p-4">Unidade / Setor</th>
                    <th className="p-4">Diagnóstico Curto</th>
                    <th className="p-4 text-center">Status Interno</th>
                    <th className="p-4 text-center">Decisão / Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {laudosPendentes.map((laudo) => {
                    const idLaudo = laudo.id || laudo._id;
                    const idAtivo = laudo.equipamentoId || laudo.ativoId || laudo.idAtivo;

                    return (
                      <tr key={idLaudo} className="hover:bg-amber-50/20 transition-colors">
                        <td className="p-4 font-mono font-bold text-slate-700 lowercase">
                          #{laudo.patrimonio || "s/p"}
                        </td>
                        <td className="p-4 font-bold text-slate-800 lowercase text-xs">
                          {laudo.nomeEquipamento?.toLowerCase()}
                        </td>
                        <td className="p-4 text-xs font-medium text-slate-500">
                          <span className="lowercase font-bold">
                            {laudo.unidade?.toLowerCase()}
                          </span>{" "}
                          <br />
                          <span className="lowercase text-[10px] opacity-70">
                            {laudo.setor?.toLowerCase()}
                          </span>
                        </td>
                        <td className="p-4 text-xs italic text-slate-600 max-w-xs truncate lowercase">
                          {laudo.diagnosticoDefeito?.toLowerCase() ||
                            laudo.diagnosticoTecnico?.toLowerCase()}
                        </td>
                        <td className="p-4 text-center">
                          <span className="bg-amber-100 text-amber-800 font-black text-[9px] lowercase tracking-widest px-2.5 py-1 rounded-full border border-amber-200">
                            {laudo.status?.toLowerCase()}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* BOTÃO EDITAR */}
                            <button
                              disabled={processandoAcao !== null}
                              onClick={() => handleAbrirEdicao(laudo)}
                              className="bg-slate-100 text-slate-700 hover:bg-slate-200 p-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border border-slate-200 flex items-center gap-1 disabled:opacity-50"
                              title="Editar Texto do Laudo"
                            >
                              <Edit2 size={14} />
                              <span className="hidden lg:inline">Editar</span>
                            </button>

                            {/* BOTÃO APROVAR */}
                            <button
                              disabled={processandoAcao !== null}
                              onClick={() => handleAprovarLaudo(idLaudo, idAtivo, laudo)}
                              className="bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white p-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border border-emerald-100 flex items-center gap-1 disabled:opacity-50"
                              title="Aprovar e Dar Baixa"
                            >
                              <CheckCircle size={14} />
                              <span className="hidden lg:inline">Aprovar</span>
                            </button>

                            {/* BOTÃO CANCELAR */}
                            <button
                              disabled={processandoAcao !== null}
                              onClick={() => handleCancelarLaudo(idLaudo, idAtivo, laudo)}
                              className="bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white p-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border border-rose-100 flex items-center gap-1 disabled:opacity-50"
                              title="Cancelar Laudo"
                            >
                              <XCircle size={14} />
                              <span className="hidden lg:inline">Cancelar</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* MODAL DE EDIÇÃO DO LAUDO */}
      {laudoEmEdicao && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-slate-200 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-slate-800 text-sm flex items-center gap-2 uppercase tracking-wide">
                <Edit2 size={16} className="text-amber-600" />
                Editar Laudo (#{laudoEmEdicao.patrimonio})
              </h3>
              <button
                onClick={() => setLaudoEmEdicao(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">
                  Diagnóstico Curto / Parecer Técnico
                </label>
                <textarea
                  value={diagnosticoEdit}
                  onChange={(e) => setDiagnosticoEdit(e.target.value)}
                  rows={3}
                  className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none lowercase text-slate-700 font-medium"
                  placeholder="digite o diagnóstico..."
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">
                  Justificativa de Substituição
                </label>
                <textarea
                  value={justificativaEdit}
                  onChange={(e) => setJustificativaEdit(e.target.value)}
                  rows={3}
                  className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none lowercase text-slate-700 font-medium"
                  placeholder="digite a justificativa..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setLaudoEmEdicao(null)}
                className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 font-bold rounded-xl"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmarEdicao}
                className="px-5 py-2 text-xs text-white bg-blue-600 hover:bg-blue-700 font-bold rounded-xl shadow-md shadow-blue-100"
              >
                Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />

      <ModalLaudoTecnico
        isOpen={modalAberto}
        equipamento={equipamentoSelecionado}
        onClose={() => {
          setModalAberto(false);
          setEquipamentoSelecionado(null);
          carregarLaudosPendentes();
        }}
        onAtualizar={carregarDados}
      />
    </div>
  );
};

export default Laudos;