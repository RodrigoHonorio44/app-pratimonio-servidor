import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  Search, 
  Filter, 
  Layers3, 
  MapPin, 
  CheckSquare,
  FileText,
  Trash2,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import api from "../services/api";

const normalizarTexto = (texto) => {
  if (!texto) return "";
  return texto
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
};

const CORES_ESTADO = {
  bom: "bg-emerald-100 text-emerald-700 border-emerald-200",
  regular: "bg-amber-100 text-amber-700 border-amber-200",
  ocioso: "bg-blue-100 text-blue-700 border-blue-200",
  recuperavel: "bg-indigo-100 text-indigo-700 border-indigo-200",
  irrecuperavel: "bg-rose-100 text-rose-700 border-rose-200",
};

export default function ConsultaPatrimonio() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [ativos, setAtivos] = useState([]);
  
  // Estados dos Inputs do Filtro
  const [unidadeSelecionada, setUnidadeSelecionada] = useState("TODAS");
  const [setorSelecionado, setSetorSelecionado] = useState("TODOS");
  const [termoPesquisa, setTermoPesquisa] = useState("");

  // Estados dos Filtros Efetivados ao Clicar em Buscar
  const [filtrosAplicados, setFiltrosAplicados] = useState({
    unidade: "TODAS",
    setor: "TODOS",
    termo: ""
  });

  const [linhasExpandidas, setLinhasExpandidas] = useState({});
  const [paginaAtual, setPaginaAtual] = useState(1);
  const itensPorPagina = 10;

  // 1. BUSCA NA API
  useEffect(() => {
    const fetchAtivos = async () => {
      try {
        const response = await api.get("/ativos");
        const data = response.data;
        
        const lista = data.map((item) => {
          const nomeFinal = item.nome || item.equipamento || item.descricao || "Item sem nome";
          const estadoFinal = item.estado || item.estadoConservacao || "Não informado";
          const obsFinal = item.observacoes || item.observacao || "";

          return {
            id: item.id || item._id,
            patrimonio: item.patrimonio || "S/P",
            nome: String(nomeFinal).toLowerCase().trim(),
            tipo: item.tipo?.toLowerCase().trim() || item.tipoItem?.toLowerCase().trim() || "geral",
            setor: item.setor?.toLowerCase().trim() || "setor não informado",
            unidade: item.unidade?.toLowerCase().trim() || "",
            estado: estadoFinal,
            status: item.status || "ativo",
            observacoes: String(obsFinal).trim(),
            quantidade: Number(item.quantidade) || 1,
            criadoEm: item.criadoEm ? new Date(item.criadoEm) : null,
          };
        });

        setAtivos(lista);
      } catch (error) {
        console.error("Erro na requisição dos ativos:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAtivos();
  }, []);

  // 2. EXTRAI LISTA DE UNIDADES ÚNICAS
  const listaUnidades = useMemo(() => {
    const unidades = new Set(ativos.map((e) => e.unidade).filter(Boolean));
    return Array.from(unidades).sort();
  }, [ativos]);

  // 3. EXTRAI LISTA DE SETORES FILTRADOS PELA UNIDADE SELECIONADA
  const listaSetoresDisponiveis = useMemo(() => {
    const ativosFiltrados = unidadeSelecionada === "TODAS"
      ? ativos
      : ativos.filter((a) => a.unidade === unidadeSelecionada.toLowerCase().trim());
    
    const setores = new Set(ativosFiltrados.map((e) => e.setor).filter(Boolean));
    return Array.from(setores).sort();
  }, [ativos, unidadeSelecionada]);

  const handleUnidadeChange = (e) => {
    setUnidadeSelecionada(e.target.value);
    setSetorSelecionado("TODOS");
  };

  const handleBuscar = (e) => {
    if (e) e.preventDefault();
    setFiltrosAplicados({
      unidade: unidadeSelecionada,
      setor: setorSelecionado,
      termo: termoPesquisa
    });
    setLinhasExpandidas({});
    setPaginaAtual(1);
  };

  const handleLimpar = () => {
    setUnidadeSelecionada("TODAS");
    setSetorSelecionado("TODOS");
    setTermoPesquisa("");
    setFiltrosAplicados({ unidade: "TODAS", setor: "TODOS", termo: "" });
    setLinhasExpandidas({});
    setPaginaAtual(1);
  };

  const toggleLinha = (chave) => {
    setLinhasExpandidas((prev) => ({
      ...prev,
      [chave]: !prev[chave]
    }));
  };

  // 4. PROCESSA E AGRUPA OS DADOS POR NOME DO EQUIPAMENTO/ITEM
  const resultadoConsulta = useMemo(() => {
    const distribuicao = {};
    let totalGeral = 0;

    const temUnidade = filtrosAplicados.unidade !== "TODAS";
    const temSetor = filtrosAplicados.setor !== "TODOS";
    const termoBuscaNorm = normalizarTexto(filtrosAplicados.termo);

    if (!temUnidade && !temSetor && !termoBuscaNorm) {
      return { linhas: [], total: 0, modo: "vazio" };
    }

    ativos.forEach((item) => {
      if (item.status.toLowerCase() !== "ativo") return;

      const matchUnidade = !temUnidade || item.unidade === filtrosAplicados.unidade.toLowerCase().trim();
      const matchSetor = !temSetor || item.setor === filtrosAplicados.setor.toLowerCase().trim();

      const nomeNorm = normalizarTexto(item.nome);
      const tipoNorm = normalizarTexto(item.tipo);
      const patNorm = normalizarTexto(item.patrimonio);

      const matchTermo = !termoBuscaNorm || 
        nomeNorm.includes(termoBuscaNorm) || 
        tipoNorm.includes(termoBuscaNorm) ||
        patNorm.includes(termoBuscaNorm);

      if (matchUnidade && matchSetor && matchTermo) {
        // Chave de agrupamento por NOME do equipamento
        const chaveGrupo = item.nome;

        if (!distribuicao[chaveGrupo]) {
          distribuicao[chaveGrupo] = { qtd: 0, itens: [] };
        }

        distribuicao[chaveGrupo].qtd += item.quantidade;
        distribuicao[chaveGrupo].itens.push(item);
        totalGeral += item.quantidade;
      }
    });

    const dadosOrdenados = Object.entries(distribuicao).sort((a, b) => b[1].qtd - a[1].qtd);

    return {
      linhas: dadosOrdenados,
      total: totalGeral,
      modo: "ativo"
    };
  }, [ativos, filtrosAplicados]);

  // PAGINAÇÃO
  const totalPaginas = Math.ceil(resultadoConsulta.linhas.length / itensPorPagina) || 1;
  const linhasPaginadas = useMemo(() => {
    const inicio = (paginaAtual - 1) * itensPorPagina;
    return resultadoConsulta.linhas.slice(inicio, inicio + itensPorPagina);
  }, [resultadoConsulta.linhas, paginaAtual]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest italic">
            CONSUMINDO DADOS DA API...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-12 font-sans antialiased text-slate-900">
      <div className="max-w-4xl mx-auto">
        
        {/* TITULO */}
        <div className="flex items-center gap-4 mb-10">
          <button 
            onClick={() => navigate(-1)}
            className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-500 hover:text-blue-600 shadow-2xs cursor-pointer transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-[10px] font-black text-blue-600 uppercase tracking-widest">ESTRUTURA MESTRA</h2>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight italic uppercase">PAINEL DE CONSULTA</h1>
          </div>
        </div>

        {/* INPUTS DE FILTRO */}
        <form onSubmit={handleBuscar} className="bg-white border border-slate-200/80 rounded-4xl p-6 mb-8 shadow-xs space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* UNIDADE */}
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-1">
                Filtro 1: Escolha a Unidade
              </label>
              <div className="relative flex items-center">
                <Filter className="absolute left-4 text-slate-400" size={18} />
                <select
                  value={unidadeSelecionada}
                  onChange={handleUnidadeChange}
                  className="w-full bg-[#F1F5F9] border border-slate-200 text-slate-700 font-black text-[12px] uppercase tracking-wider pl-12 pr-4 py-4 rounded-2xl focus:outline-hidden focus:border-blue-500 focus:bg-white transition-all cursor-pointer"
                >
                  <option value="TODAS">🌍 TODAS AS UNIDADES</option>
                  {listaUnidades.map((u) => (
                    <option key={u} value={u}>
                      🏢 {u.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* SETOR */}
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-1">
                Filtro 2: Escolha o Setor
              </label>
              <div className="relative flex items-center">
                <MapPin className="absolute left-4 text-slate-400" size={18} />
                <select
                  value={setorSelecionado}
                  onChange={(e) => setSetorSelecionado(e.target.value)}
                  className="w-full bg-[#F1F5F9] border border-slate-200 text-slate-700 font-black text-[12px] uppercase tracking-wider pl-12 pr-4 py-4 rounded-2xl focus:outline-hidden focus:border-blue-500 focus:bg-white transition-all cursor-pointer"
                >
                  <option value="TODOS">📍 TODOS OS SETORES</option>
                  {listaSetoresDisponiveis.map((s) => (
                    <option key={s} value={s}>
                      {s.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* NOME DO ITEM / TERMO DE BUSCA */}
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-1">
              Filtro 3: Item Específico (Opcional)
            </label>
            <div className="relative flex items-center">
              <Search className="absolute left-4 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="EX: CADEIRA, MESA, MACA, IMPRESSORA..."
                value={termoPesquisa}
                onChange={(e) => setTermoPesquisa(e.target.value)}
                className="w-full bg-[#F1F5F9] border border-slate-200 text-slate-700 font-black text-[12px] uppercase tracking-wider pl-12 pr-4 py-4 rounded-2xl focus:outline-hidden focus:border-blue-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={handleLimpar}
              className="flex items-center gap-2 px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black text-[11px] uppercase tracking-wider rounded-xl transition-colors cursor-pointer"
            >
              <Trash2 size={14} /> Limpar
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-black text-[11px] uppercase tracking-wider rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Search size={14} /> Buscar
            </button>
          </div>
        </form>

        {/* MODO ESPERA */}
        {resultadoConsulta.modo === "vazio" ? (
          <div className="bg-white border border-slate-100 rounded-4xl p-12 text-center shadow-xs">
            <CheckSquare size={40} className="mx-auto text-blue-500/30 mb-3" />
            <p className="text-slate-400 font-black uppercase text-[11px] tracking-widest">
              Selecione uma unidade, um setor ou digite um item acima e clique em buscar.
            </p>
          </div>
        ) : (
          <>
            {/* TOTALIZADOR CENTRAL */}
            <div className="bg-slate-900 text-white rounded-4xl p-8 relative overflow-hidden shadow-lg mb-6">
              <div className="absolute right-6 bottom-4 opacity-5 text-white">
                <Layers3 size={140} />
              </div>
              <div className="flex justify-between items-start mb-2">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">
                    TOTAL DE ITENS LOCALIZADOS
                  </span>
                  <h2 className="text-xl font-black italic uppercase mt-1">
                    {filtrosAplicados.unidade !== "TODAS" ? filtrosAplicados.unidade.toUpperCase() : "TODAS AS UNIDADES"}
                    {filtrosAplicados.setor !== "TODOS" ? ` - ${filtrosAplicados.setor.toUpperCase()}` : ""}
                  </h2>
                </div>
              </div>
              <h3 className="text-6xl font-black tracking-tight">
                {resultadoConsulta.total.toString().padStart(3, "0")}
              </h3>
            </div>

            {/* LISTA VERTICAL DE CARDS (UM EMBAIXO DO OUTRO) */}
            <div className="bg-white border border-slate-100 rounded-4xl p-6 shadow-xs">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-100 pb-3 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <FileText size={14} className="text-blue-600" />
                  AGRUPAMENTO POR ITEM / EQUIPAMENTO
                </span>
                <span className="text-slate-400 lowercase text-[9px]">
                  página {paginaAtual} de {totalPaginas}
                </span>
              </p>

              {resultadoConsulta.linhas.length === 0 ? (
                <p className="text-center py-8 text-slate-400 font-bold text-xs uppercase">
                  Nenhum ativo correspondente localizado.
                </p>
              ) : (
                <div className="flex flex-col gap-3">
                  {linhasPaginadas.map(([nomeItem, container]) => {
                    const aberto = !!linhasExpandidas[nomeItem];

                    return (
                      <div key={nomeItem} className="border border-slate-200/70 rounded-2xl overflow-hidden bg-white shadow-3xs transition-all">
                        
                        {/* CARD DO ITEM (NOME + QUANTIDADE) */}
                        <div 
                          onClick={() => toggleLinha(nomeItem)}
                          className="flex items-center justify-between px-6 py-4 cursor-pointer select-none hover:bg-slate-50 transition-colors"
                        >
                          <span className="font-extrabold text-[13px] text-slate-800 capitalize tracking-tight">
                            {nomeItem}
                          </span>
                          
                          <div className="flex items-center gap-3">
                            <span className="bg-blue-50 text-blue-600 font-black text-[13px] px-3 py-1 rounded-xl border border-blue-100">
                              {container.qtd}
                            </span>
                            {aberto ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                          </div>
                        </div>

                        {/* CONTEÚDO EXPANDIDO (TABELA DETALHADA DOS PATRIMÔNIOS) */}
                        {aberto && (
                          <div className="p-4 bg-slate-50/60 border-t border-slate-100">
                            <div className="overflow-x-auto">
                              <table className="w-full text-left border-collapse text-[11px]">
                                <thead>
                                  <tr className="border-b border-slate-200 text-slate-400 font-black uppercase tracking-wider">
                                    <th className="pb-2 pr-4">Patrimônio</th>
                                    <th className="pb-2 pr-4">Equipamento / Nome</th>
                                    <th className="pb-2 pr-4">Tipo</th>
                                    <th className="pb-2 pr-4">Estado</th>
                                    <th className="pb-2">Observações</th>
                                  </tr>
                                </thead>
                                <tbody className="text-slate-600 font-bold uppercase">
                                  {container.itens.map((item) => {
                                    const estadoChave = normalizarTexto(item.estado);
                                    const badgeCor = CORES_ESTADO[estadoChave] || "bg-slate-100 text-slate-700 border-slate-200";

                                    return (
                                      <tr key={item.id} className="border-b border-slate-100 last:border-0 hover:bg-white transition-all">
                                        <td className="py-2.5 pr-4 text-blue-600 font-black whitespace-nowrap">
                                          {item.patrimonio}
                                        </td>
                                        <td className="py-2.5 pr-4 text-slate-800 font-extrabold capitalize">
                                          {item.nome || "—"}
                                        </td>
                                        <td className="py-2.5 pr-4 text-slate-500 font-semibold capitalize whitespace-nowrap">
                                          {item.tipo}
                                        </td>
                                        <td className="py-2.5 pr-4 whitespace-nowrap">
                                          <span className={`text-[10px] px-2 py-0.5 rounded-md font-black uppercase border ${badgeCor}`}>
                                            {item.estado}
                                          </span>
                                        </td>
                                        <td className="py-2.5 text-slate-400 text-[10px] normal-case max-w-xs truncate" title={item.observacoes || "—"}>
                                          {item.observacoes || "—"}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}

                      </div>
                    );
                  })}
                </div>
              )}

              {/* PAGINAÇÃO */}
              {totalPaginas > 1 && (
                <div className="flex items-center justify-between pt-6 mt-6 border-t border-slate-100">
                  <button
                    onClick={() => setPaginaAtual((prev) => Math.max(prev - 1, 1))}
                    disabled={paginaAtual === 1}
                    className="flex items-center gap-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 font-black text-[11px] uppercase tracking-wider rounded-xl transition-colors cursor-pointer"
                  >
                    <ChevronLeft size={14} /> Anterior
                  </button>

                  <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">
                    Página {paginaAtual} de {totalPaginas}
                  </span>

                  <button
                    onClick={() => setPaginaAtual((prev) => Math.min(prev + 1, totalPaginas))}
                    disabled={paginaAtual === totalPaginas}
                    className="flex items-center gap-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 font-black text-[11px] uppercase tracking-wider rounded-xl transition-colors cursor-pointer"
                  >
                    Próxima <ChevronRight size={14} />
                  </button>
                </div>
              )}

            </div>
          </>
        )}

      </div>
    </div>
  );
}