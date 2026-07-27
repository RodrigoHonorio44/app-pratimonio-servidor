import React, { useState, useMemo } from "react";
import { 
  ArrowLeft, ClipboardCheck, CheckCircle2, AlertTriangle, RefreshCw, XCircle, 
  Search, Plus, Trash2, Printer, Check, PackagePlus, Clock, RotateCcw, Camera, Image as ImageIcon
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import imageCompression from "browser-image-compression"; // Importação para compressão
import Header from "../components/Header";
import Footer from "../components/Footer";
import { MAPA_SETORES_POR_UNIDADE } from "../components/constants/setores";
import { useTelaVistoriaPatrimonio } from "../hooks/useTelaVistoriaPatrimonio";

const OPCOES_ESTADO = [
  { id: "bom", label: "Bom", icon: CheckCircle2, color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
  { id: "ocioso", label: "Ocioso", icon: AlertTriangle, color: "text-amber-600 bg-amber-50 border-amber-200" },
  { id: "recuperavel", label: "Recuperável", icon: RefreshCw, color: "text-blue-600 bg-blue-50 border-blue-200" },
  { id: "irrecuperavel", label: "Irrecuperável", icon: XCircle, color: "text-rose-600 bg-rose-50 border-rose-200" },
];

const TelaVistoriaPatrimonio = () => {
  const navigate = useNavigate();

  const {
    unidadeSelecionada,
    setUnidadeSelecionada,
    setorSelecionado,
    setSetorSelecionado,
    ativosDoSetor = [],
    loadingAtivos,
    loading,
    limparFiltros,
    handleFinalizarVistoriaLote,
  } = useTelaVistoriaPatrimonio();

  // Estados locais da sessão
  const [busca, setBusca] = useState("");
  const [itensAvaliados, setItensAvaliados] = useState([]);

  // Item selecionado para avaliação
  const [itemEmEdicao, setItemEmEdicao] = useState(null);
  const [estadoModal, setEstadoModal] = useState("bom");
  const [obsModal, setObsModal] = useState("");
  const [fotoModal, setFotoModal] = useState(null); // Estado para guardar a foto compactada
  const [compactandoFoto, setCompactandoFoto] = useState(false);

  // Cadastro de item manual
  const [modoManual, setModoManual] = useState(false);
  const [manualNome, setManualNome] = useState("");
  const [manualPatrimonio, setManualPatrimonio] = useState("");

  const dataHoraVistoria = useMemo(
    () => new Date().toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }),
    [unidadeSelecionada, setorSelecionado]
  );

  const handleLimparTudo = () => {
    limparFiltros();
    setBusca("");
    setItemEmEdicao(null);
    setModoManual(false);
    setFotoModal(null);
  };

  // Funcao para compactar a imagem no navegador
  const handleCapturarFoto = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setCompactandoFoto(true);

    const opcoesCompressao = {
      maxSizeMB: 0.15, // Reduz para no máximo ~150KB
      maxWidthOrHeight: 1024, // Limita resolução máxima
      useWebWorker: true,
    };

    try {
      const arquivoCompactado = await imageCompression(file, opcoesCompressao);
      
      // Converter para Base64 leve para incluir diretamente no JSON salvo em 'vistorias'
      const reader = new FileReader();
      reader.readAsDataURL(arquivoCompactado);
      reader.onloadend = () => {
        setFotoModal(reader.result);
        setCompactandoFoto(false);
      };
    } catch (error) {
      console.error("Erro ao compactar imagem:", error);
      setCompactandoFoto(false);
    }
  };

  const equipamentosFiltrados = useMemo(() => {
    if (!busca.trim()) return ativosDoSetor;
    const termo = busca.toLowerCase();
    return ativosDoSetor.filter(
      (item) =>
        (item.descricao || item.equipamento || item.nome || "").toLowerCase().includes(termo) ||
        (item.patrimonio || "").toLowerCase().includes(termo)
    );
  }, [ativosDoSetor, busca]);

  const handleAbrirAvaliacao = (item) => {
    setItemEmEdicao(item);
    setEstadoModal("bom");
    setObsModal("");
    setFotoModal(null);
  };

  const handleAdicionarAoLote = () => {
    if (!itemEmEdicao) return;

    const novoItem = {
      idTemp: Date.now(),
      patrimonio: itemEmEdicao.patrimonio || "S/P",
      equipamento: itemEmEdicao.descricao || itemEmEdicao.equipamento || itemEmEdicao.nome || "Equipamento",
      estado: estadoModal,
      observacao: obsModal.trim(),
      foto: fotoModal, // Inclui a foto no item
      dataHora: new Date().toLocaleString("pt-BR")
    };

    setItensAvaliados((prev) => [...prev, novoItem]);
    setItemEmEdicao(null);
    setObsModal("");
    setFotoModal(null);
  };

  const handleAdicionarManual = (e) => {
    e.preventDefault();
    if (!manualNome.trim()) return;

    const itemManual = {
      idTemp: Date.now(),
      patrimonio: manualPatrimonio.trim() || "S/P",
      equipamento: manualNome.trim(),
      estado: estadoModal,
      observacao: obsModal.trim(),
      foto: fotoModal,
      dataHora: new Date().toLocaleString("pt-BR")
    };

    setItensAvaliados((prev) => [...prev, itemManual]);
    setModoManual(false);
    setManualNome("");
    setManualPatrimonio("");
    setObsModal("");
    setFotoModal(null);
  };

  const handleRemoverItem = (idTemp) => {
    setItensAvaliados((prev) => prev.filter((i) => i.idTemp !== idTemp));
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
      <Header />

      <main className="flex-grow p-4 md:p-8 max-w-7xl w-full mx-auto">
        <header className="mb-6 no-print">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-slate-500 hover:text-blue-600 font-bold text-sm transition-colors mb-4 group cursor-pointer"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            Voltar à Dashboard
          </button>
          
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2 uppercase tracking-tight">
            <ClipboardCheck className="text-blue-600" size={28} /> Central de Vistoria de Patrimônio
          </h1>
          <p className="text-slate-500 text-sm font-medium">
            Selecione a unidade e o setor, avalie os equipamentos do local e gere o relatório consolidado com data e hora.
          </p>
        </header>

        {/* FILTROS DE UNIDADE E SETOR */}
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200 mb-6 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-2">
            <span className="text-xs font-black text-slate-600 uppercase tracking-wider">Filtros da Vistoria</span>
            {(unidadeSelecionada || setorSelecionado || busca) && (
              <button
                type="button"
                onClick={handleLimparTudo}
                className="flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-xl transition-all cursor-pointer border border-rose-200"
              >
                <RotateCcw size={14} /> Limpar Pesquisa
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">1. Unidade Destino/Vistoria</label>
              <select 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                value={unidadeSelecionada} 
                onChange={(e) => { 
                  setUnidadeSelecionada(e.target.value); 
                  setSetorSelecionado(""); 
                  setItensAvaliados([]);
                }}
              >
                <option value="">Selecione a Unidade...</option>
                {Object.keys(MAPA_SETORES_POR_UNIDADE).map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">2. Setor Interno</label>
              <select 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                value={setorSelecionado} 
                onChange={(e) => {
                  setSetorSelecionado(e.target.value);
                  setItensAvaliados([]);
                }}
                disabled={!unidadeSelecionada}
              >
                <option value="">Selecione o Setor...</option>
                {(MAPA_SETORES_POR_UNIDADE[unidadeSelecionada] || []).map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* LAYOUT PRINCIPAL */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* COLUNA ESQUERDA: LISTA DE ATIVOS DO BANCO */}
          <div className="lg:col-span-7 bg-white p-6 rounded-3xl shadow-sm border border-slate-200 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 pb-3 border-b border-slate-100">
              <div>
                <h2 className="font-black text-slate-800 text-base uppercase tracking-tight">Equipamentos Cadastrados no Setor</h2>
                <p className="text-xs text-slate-400 font-semibold">Selecione os itens para avaliar</p>
              </div>
              <button
                type="button"
                onClick={() => { setModoManual(true); setFotoModal(null); }}
                className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3 py-2 rounded-xl transition-all cursor-pointer"
              >
                <PackagePlus size={16} className="text-blue-600" /> + Item Não Encontrado
              </button>
            </div>

            <div className="relative flex items-center">
              <Search className="absolute left-3.5 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Buscar por patrimônio ou descrição..." 
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
              {busca && (
                <button type="button" onClick={() => setBusca("")} className="absolute right-3.5 text-slate-400 hover:text-slate-600 font-bold text-xs">✕</button>
              )}
            </div>

            {/* FORMULÁRIO DE ITEM MANUAL COM UPLOAD DE FOTO */}
            {modoManual && (
              <form onSubmit={handleAdicionarManual} className="p-4 bg-blue-50/60 border border-blue-200 rounded-2xl space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black text-blue-800 uppercase tracking-wider">Descrever Equipamento Manualmente</span>
                  <button type="button" onClick={() => setModoManual(false)} className="text-xs font-bold text-slate-400 hover:text-slate-600">Cancelar</button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input 
                    type="text" 
                    placeholder="Patrimônio (Ex: 37031)" 
                    className="sm:col-span-1 bg-white border border-slate-200 p-2.5 rounded-xl text-xs font-bold text-slate-800 outline-none"
                    value={manualPatrimonio}
                    onChange={(e) => setManualPatrimonio(e.target.value)}
                  />
                  <input 
                    type="text" 
                    placeholder="Descrição do Equipamento" 
                    className="sm:col-span-2 bg-white border border-slate-200 p-2.5 rounded-xl text-xs font-bold text-slate-800 outline-none"
                    value={manualNome}
                    onChange={(e) => setManualNome(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Estado de Conservação</label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {OPCOES_ESTADO.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setEstadoModal(opt.id)}
                        className={`p-2 rounded-lg text-[11px] font-bold border transition-all text-center ${
                          estadoModal === opt.id ? opt.color : 'bg-white border-slate-200 text-slate-600'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* CAMPO DE UPLOAD DE FOTO DA AVARIA */}
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Anexar Foto da Avaria / Item (Opcional)</label>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 bg-white border border-slate-300 hover:border-blue-500 text-slate-700 text-xs font-bold px-3 py-2 rounded-xl cursor-pointer transition-all">
                      <Camera size={16} className="text-blue-600" />
                      <span>{compactandoFoto ? "Processando Foto..." : "Tirar / Escolher Foto"}</span>
                      <input type="file" accept="image/*" capture="environment" onChange={handleCapturarFoto} className="hidden" />
                    </label>
                    {fotoModal && (
                      <div className="relative group">
                        <img src={fotoModal} alt="Preview" className="w-10 h-10 object-cover rounded-lg border border-slate-300" />
                        <button type="button" onClick={() => setFotoModal(null)} className="absolute -top-2 -right-2 bg-rose-600 text-white rounded-full p-0.5 text-[10px]">✕</button>
                      </div>
                    )}
                  </div>
                </div>

                <input 
                  type="text" 
                  placeholder="Observação (Ex: Gabinete amassado...)" 
                  className="w-full bg-white border border-slate-200 p-2 rounded-xl text-xs font-medium outline-none"
                  value={obsModal}
                  onChange={(e) => setObsModal(e.target.value)}
                />
                <button type="submit" disabled={compactandoFoto} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold p-2.5 rounded-xl text-xs transition-all cursor-pointer">
                  + Adicionar à Vistoria
                </button>
              </form>
            )}

            {/* LISTA DOS ATIVOS OBTIDOS DE /api/ativos */}
            {!setorSelecionado ? (
              <div className="p-8 text-center text-slate-400 text-sm font-semibold border-2 border-dashed border-slate-100 rounded-2xl">
                Selecione a Unidade e o Setor acima para carregar a lista de patrimônios.
              </div>
            ) : loadingAtivos ? (
              <div className="p-8 text-center text-slate-400 font-bold animate-pulse">Buscando equipamentos no setor...</div>
            ) : equipamentosFiltrados.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm font-medium border-2 border-dashed border-slate-100 rounded-2xl space-y-2">
                <p>Nenhum equipamento cadastrado foi encontrado para este setor.</p>
                <button type="button" onClick={() => { setModoManual(true); setFotoModal(null); }} className="text-xs font-bold text-blue-600 hover:underline">
                  Clique para descrever o item manualmente
                </button>
              </div>
            ) : (
              <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
                {equipamentosFiltrados.map((item) => {
                  const pat = item.patrimonio || "S/P";
                  const nomeItem = item.descricao || item.equipamento || item.nome;
                  const jaAvaliado = itensAvaliados.some((i) => i.patrimonio === pat && i.equipamento === nomeItem);

                  return (
                    <div 
                      key={item.id || item._id || pat + nomeItem} 
                      className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                        jaAvaliado ? 'bg-slate-50 border-slate-200 opacity-60' : 'bg-slate-50/50 hover:bg-slate-100/80 border-slate-200/80'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-blue-100 text-blue-700 font-mono">
                          #{pat}
                        </span>
                        <div>
                          <p className="font-bold text-slate-800 text-sm uppercase">{nomeItem}</p>
                          <p className="text-[11px] text-slate-400 font-medium">{unidadeSelecionada} • {setorSelecionado}</p>
                        </div>
                      </div>

                      {jaAvaliado ? (
                        <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                          <Check size={14} /> Avaliado
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleAbrirAvaliacao(item)}
                          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all shadow-sm cursor-pointer"
                        >
                          <Plus size={14} /> Avaliar
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* COLUNA DIREITA: SESSÃO DE AVALIAÇÃO DA VISTORIA */}
          <div className="lg:col-span-5 bg-white p-6 rounded-3xl shadow-sm border border-slate-200 space-y-5">
            <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
              <div>
                <h3 className="font-black text-slate-800 text-base uppercase tracking-tight">Sessão de Vistoria</h3>
                <p className="text-xs text-slate-400 font-medium flex items-center gap-1">
                  <Clock size={12} /> {dataHoraVistoria}
                </p>
              </div>
              <span className="bg-blue-50 text-blue-700 font-black text-xs px-2.5 py-1 rounded-full border border-blue-200">
                {itensAvaliados.length} {itensAvaliados.length === 1 ? 'item' : 'itens'}
              </span>
            </div>

            {/* AVALIAÇÃO DO ITEM SELECIONADO DA LISTA */}
            {itemEmEdicao && (
              <div className="p-4 bg-slate-50 border border-blue-200 rounded-2xl space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest block">Avaliando Item</span>
                    <h4 className="font-extrabold text-slate-800 text-sm uppercase">
                      {itemEmEdicao.descricao || itemEmEdicao.equipamento || itemEmEdicao.nome}
                    </h4>
                    <span className="text-xs font-mono font-bold text-slate-500">Patrimônio: #{itemEmEdicao.patrimonio || "S/P"}</span>
                  </div>
                  <button type="button" onClick={() => setItemEmEdicao(null)} className="text-slate-400 hover:text-slate-600 text-xs font-bold">Cancelar</button>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Classificação de Conservação</label>
                  <div className="grid grid-cols-2 gap-2">
                    {OPCOES_ESTADO.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setEstadoModal(opt.id)}
                        className={`p-2.5 rounded-xl text-xs font-bold border flex items-center justify-center gap-2 transition-all ${
                          estadoModal === opt.id ? opt.color : 'bg-white border-slate-200 text-slate-600'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* UPLOAD DE FOTO DURANTE A AVALIAÇÃO DO ITEM */}
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Foto da Avaria (Opcional)</label>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 bg-white border border-slate-300 hover:border-blue-500 text-slate-700 text-xs font-bold px-3 py-2 rounded-xl cursor-pointer transition-all">
                      <Camera size={16} className="text-blue-600" />
                      <span>{compactandoFoto ? "Processando..." : "Anexar Foto"}</span>
                      <input type="file" accept="image/*" capture="environment" onChange={handleCapturarFoto} className="hidden" />
                    </label>
                    {fotoModal && (
                      <div className="relative">
                        <img src={fotoModal} alt="Preview Avaria" className="w-10 h-10 object-cover rounded-lg border border-slate-300" />
                        <button type="button" onClick={() => setFotoModal(null)} className="absolute -top-2 -right-2 bg-rose-600 text-white rounded-full p-0.5 text-[10px]">✕</button>
                      </div>
                    )}
                  </div>
                </div>

                <textarea
                  rows={2}
                  placeholder="Observações técnicas ou motivo do estado..."
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-700 outline-none resize-none"
                  value={obsModal}
                  onChange={(e) => setObsModal(e.target.value)}
                />

                <button
                  type="button"
                  disabled={compactandoFoto}
                  onClick={handleAdicionarAoLote}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold p-2.5 rounded-xl text-xs transition-all cursor-pointer shadow-md shadow-emerald-100 flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 size={16} /> Confirmar Avaliação do Item
                </button>
              </div>
            )}

            {/* LISTA DOS ITENS AVALIADOS NO LOTE ATUAL */}
            <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
              {itensAvaliados.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs font-semibold border-2 border-dashed border-slate-100 rounded-2xl">
                  Nenhum item adicionado à vistoria até o momento. Selecione itens da lista para avaliar.
                </div>
              ) : (
                itensAvaliados.map((item) => {
                  const estInfo = OPCOES_ESTADO.find((e) => e.id === item.estado);
                  return (
                    <div key={item.idTemp} className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        {item.foto && (
                          <img src={item.foto} alt="Avaria" className="w-12 h-12 object-cover rounded-xl border border-slate-200" />
                        )}
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                              #{item.patrimonio}
                            </span>
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase border ${estInfo?.color}`}>
                              {estInfo?.label}
                            </span>
                          </div>
                          <p className="font-bold text-slate-800 text-xs uppercase">{item.equipamento}</p>
                          {item.observacao && <p className="text-[11px] text-slate-500 italic">"{item.observacao}"</p>}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoverItem(item.idTemp)}
                        className="text-slate-400 hover:text-rose-600 p-1.5 transition-colors cursor-pointer"
                        title="Remover item da vistoria"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* SALVA DIRETAMENTE NA SUA COLEÇÃO DE VISTORIAS JÁ EXISTENTE */}
            <button
              type="button"
              disabled={loading || itensAvaliados.length === 0 || !unidadeSelecionada || !setorSelecionado}
              onClick={() => handleFinalizarVistoriaLote({
                unidade: unidadeSelecionada,
                setor: setorSelecionado,
                dataHora: dataHoraVistoria,
                itens: itensAvaliados
              })}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white p-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-100 cursor-pointer text-sm"
            >
              <Printer size={18} />
              {loading ? "Salvando Vistoria..." : `Fechar Vistoria e Gerar Relatório (${itensAvaliados.length})`}
            </button>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
};

export default TelaVistoriaPatrimonio;