import React, { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid
} from "recharts";
import {
  FiRefreshCw, FiFilter, FiCalendar, FiCheckCircle,
  FiClock, FiAlertTriangle, FiLayers, FiFileText, FiTrendingUp,
  FiShield, FiActivity, FiDatabase, FiChevronLeft, FiChevronRight
} from "react-icons/fi";
import { useDashboardBI } from "../hooks/useDashboardBI";
// COMPONENTE DE EXPORTAÇÃO EXCEL
import ExportExcelButton from "../components/ExportExcelButton";

export default function PainelAnalyticsBI() {
  const {
    navigate,
    stats,
    dadosSetores,
    dadosEvolucao,
    dadosSlaEquipes,
    listaLaudos,
    listaSaidas,
    listaBaixas,
    top10Baixas,
    unidadesDisponiveis,
    filtroUnidade,
    setFiltroUnidade,
    dataInicio,
    setDataInicio,
    dataFim,
    setDataFim,
    loading,
    carregarDadosDoBanco,
    distribuicaoStatus,
    kpisAvancados,
    chamados,
  } = useDashboardBI();

  const [abaAtiva, setAbaAtiva] = useState("visaoGeral");

  // ESTADOS DE PAGINAÇÃO (10 itens por página por padrão)
  const ITENS_POR_PAGINA = 10;
  const [paginaBaixas, setPaginaBaixas] = useState(1);
  const [paginaLaudos, setPaginaLaudos] = useState(1);
  const [paginaSaidas, setPaginaSaidas] = useState(1);

  // Função interna resiliente para formatar timestamps/datas do Firestore
  const formatarData = (val) => {
    if (!val) return "N/A";
    if (typeof val === "string") return val;
    if (val?.toDate && typeof val.toDate === "function") {
      return val.toDate().toLocaleDateString("pt-BR");
    }
    if (val?.seconds) {
      return new Date(val.seconds * 1000).toLocaleDateString("pt-BR");
    }
    if (val instanceof Date) {
      return val.toLocaleDateString("pt-BR");
    }
    return "N/A";
  };

  // HELPER PARA CALCULAR PAGINAÇÃO DE ARRAYS
  const paginar = (lista = [], paginaAtual = 1) => {
    const inicio = (paginaAtual - 1) * ITENS_POR_PAGINA;
    const fim = inicio + ITENS_POR_PAGINA;
    return {
      dadosPaginados: lista.slice(inicio, fim),
      totalPaginas: Math.ceil(lista.length / ITENS_POR_PAGINA) || 1,
      totalItens: lista.length,
    };
  };

  // DADOS PAGINADOS
  const { dadosPaginados: baixasPaginadas, totalPaginas: totalPaginasBaixas } = paginar(listaBaixas, paginaBaixas);
  const { dadosPaginados: laudosPaginados, totalPaginas: totalPaginasLaudos } = paginar(listaLaudos, paginaLaudos);
  const { dadosPaginados: saidasPaginadas, totalPaginas: totalPaginasSaidas } = paginar(listaSaidas, paginaSaidas);

  // CONTROLES DE PAGINAÇÃO (COMPONENTE REUTILIZÁVEL UI)
  const ControlesPaginacao = ({ paginaAtual, setPagina, totalPaginas, totalItens }) => {
    if (totalItens <= ITENS_POR_PAGINA) return null;

    return (
      <div className="flex items-center justify-between mt-4 px-2 py-3 bg-gray-50 rounded-xl border border-gray-100 text-xs">
        <span className="text-gray-500">
          Mostrando <strong className="text-gray-800">{(paginaAtual - 1) * ITENS_POR_PAGINA + 1}</strong> até{" "}
          <strong className="text-gray-800">{Math.min(paginaAtual * ITENS_POR_PAGINA, totalItens)}</strong> de{" "}
          <strong className="text-gray-800">{totalItens}</strong> registros
        </span>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setPagina((p) => Math.max(p - 1, 1))}
            disabled={paginaAtual === 1}
            className="p-1.5 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            title="Página Anterior"
          >
            <FiChevronLeft className="text-base" />
          </button>

          <span className="font-bold text-gray-700 px-2">
            Página {paginaAtual} de {totalPaginas}
          </span>

          <button
            onClick={() => setPagina((p) => Math.min(p + 1, totalPaginas))}
            disabled={paginaAtual === totalPaginas}
            className="p-1.5 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            title="Próxima Página"
          >
            <FiChevronRight className="text-base" />
          </button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50 text-gray-800">
        <div className="flex flex-col items-center gap-4">
          <FiRefreshCw className="animate-spin text-4xl text-blue-600" />
          <p className="text-sm font-medium tracking-wider text-gray-500">
            CARREGANDO INTELIGÊNCIA DE DADOS...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 p-4 md:p-8 font-sans selection:bg-blue-600 selection:text-white">
      
      {/* HEADER EXECUTIVO */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-blue-600 text-xs font-bold tracking-widest uppercase mb-1">
            <FiShield className="text-base" /> BI Corporativo & Analytics Avançado
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-gray-900 flex items-center gap-3">
            Painel Executivo Hospitalar
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Monitoramento em tempo real de ativos, chamados, laudos técnicos e manutenções preventivas/corretivas.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => carregarDadosDoBanco()}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-xl border border-gray-300 transition-all shadow-sm active:scale-95 cursor-pointer"
            title="Sincronizar Dados"
          >
            <FiRefreshCw className="text-blue-600" /> Sincronizar
          </button>

          {/* COMPONENTE DE EXPORTAÇÃO EXCEL ATUALIZADO COM TODAS AS MOVIMENTAÇÕES */}
          <ExportExcelButton
            idGraficoContainer="area-grafico-bi"
            estatisticas={stats}
            chamados={chamados}
            baixas={listaBaixas}
            saidas={listaSaidas}
            laudos={listaLaudos}
            unidade={filtroUnidade}
          />

          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-xl border border-gray-300 transition-all cursor-pointer"
          >
            Voltar
          </button>
        </div>
      </header>

      {/* BARRA DE FILTROS AVANÇADOS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-8 bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
        <div className="lg:col-span-4 flex flex-col gap-1">
          <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
            <FiFilter className="text-blue-600" /> Unidade Operacional
          </label>
          <select
            value={filtroUnidade}
            onChange={(e) => setFiltroUnidade(e.target.value)}
            className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 text-xs text-gray-900 font-medium focus:outline-none focus:border-blue-600 transition-all"
          >
            {unidadesDisponiveis?.map((uni, idx) => (
              <option key={idx} value={uni}>{uni}</option>
            ))}
          </select>
        </div>

        <div className="lg:col-span-3 flex flex-col gap-1">
          <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
            <FiCalendar className="text-blue-600" /> Data Inicial
          </label>
          <input
            type="date"
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
            className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2 text-xs text-gray-900 font-medium focus:outline-none focus:border-blue-600 transition-all"
          />
        </div>

        <div className="lg:col-span-3 flex flex-col gap-1">
          <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
            <FiCalendar className="text-blue-600" /> Data Final
          </label>
          <input
            type="date"
            value={dataFim}
            onChange={(e) => setDataFim(e.target.value)}
            className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2 text-xs text-gray-900 font-medium focus:outline-none focus:border-blue-600 transition-all"
          />
        </div>

        <div className="lg:col-span-2 flex items-end">
          <button
            onClick={() => { setDataInicio(""); setDataFim(""); setFiltroUnidade("TODAS"); }}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold py-2.5 px-4 rounded-xl border border-gray-300 transition-all cursor-pointer"
          >
            Limpar Filtros
          </button>
        </div>
      </div>

      {/* ABAS DE NAVEGAÇÃO INTERNA */}
      <div className="flex items-center gap-2 border-b border-gray-200 mb-8 pb-2 overflow-x-auto">
        {[
          { id: "visaoGeral", label: "Visão Geral & KPIs", icon: FiActivity },
          { id: "chamadosSla", label: "Chamados & SLA", icon: FiClock },
          { id: "ativosBaixas", label: "Ativos & Baixas / Inutilizados", icon: FiAlertTriangle },
          { id: "laudosSaidas", label: "Laudos & Saídas de Equipamentos", icon: FiFileText },
        ].map((aba) => {
          const Icon = aba.icon;
          const ativo = abaAtiva === aba.id;
          return (
            <button
              key={aba.id}
              onClick={() => setAbaAtiva(aba.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                ativo 
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/20" 
                  : "bg-white text-gray-600 hover:bg-gray-100 hover:text-gray-900 border border-gray-200"
              }`}
            >
              <Icon className="text-sm" /> {aba.label}
            </button>
          );
        })}
      </div>

      {/* CONTEÚDO DA ABA: VISÃO GERAL & KPIS */}
      {abaAtiva === "visaoGeral" && (
        <div className="space-y-8 animate-fadeIn">
          {/* CARDS DE ESTATÍSTICAS PRINCIPAIS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden group">
              <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-all"></div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Total de Chamados</span>
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><FiLayers className="text-lg" /></div>
              </div>
              <div className="text-3xl font-extrabold text-gray-900 tracking-tight mb-1">{stats?.total || 0}</div>
              <div className="text-[11px] text-blue-600 font-semibold flex items-center gap-1">
                <FiTrendingUp /> {stats?.abertos || 0} abertos no momento
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden group">
              <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all"></div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Taxa de Conclusão</span>
                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl"><FiCheckCircle className="text-lg" /></div>
              </div>
              <div className="text-3xl font-extrabold text-gray-900 tracking-tight mb-1">{stats?.taxaConclusao || "0%"}</div>
              <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                <FiTrendingUp /> {stats?.fechados || 0} chamados concluídos
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden group">
              <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-all"></div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Média SLA Geral</span>
                <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl"><FiClock className="text-lg" /></div>
              </div>
              <div className="text-3xl font-extrabold text-gray-900 tracking-tight mb-1">{stats?.slaMedio || "0h"}</div>
              <div className="text-[11px] text-amber-600 font-semibold">Tempo médio de atendimento</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden group">
              <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl group-hover:bg-rose-500/10 transition-all"></div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Itens Inutilizados / Baixas</span>
                <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl"><FiAlertTriangle className="text-lg" /></div>
              </div>
              <div className="text-3xl font-extrabold text-gray-900 tracking-tight mb-1">{stats?.baixas || 0}</div>
              <div className="text-[11px] text-rose-600 font-semibold">Taxa de inutilização: {kpisAvancados?.taxaInutilizacao || 0}%</div>
            </div>
          </div>

          {/* GRÁFICOS PRINCIPAIS */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div id="area-grafico-bi" className="lg:col-span-8 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <FiLayers className="text-blue-600" /> Volume de Chamados por Unidade
                  </h3>
                  <p className="text-xs text-gray-500">Distribuição analítica de chamados por hospital/unidade</p>
                </div>
              </div>
              <div className="h-80 w-full">
                {dadosSetores && dadosSetores.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={100}>
                    <BarChart data={dadosSetores} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} interval={0} angle={-15} textAnchor="end" />
                      <YAxis stroke="#94a3b8" fontSize={11} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0", borderRadius: "12px", color: "#1e293b", fontSize: "12px", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }} 
                      />
                      <Bar dataKey="total" fill="#2563eb" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-400 text-xs">Nenhum dado disponível para o filtro selecionado</div>
                )}
              </div>
            </div>

            {/* GRÁFICO DE STATUS DOS CHAMADOS */}
            <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2 mb-1">
                  <FiActivity className="text-blue-600" /> Status Operacional
                </h3>
                <p className="text-xs text-gray-500">Proporção atual de atendimento</p>
              </div>
              <div className="h-56 w-full my-4">
                {distribuicaoStatus && distribuicaoStatus.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={100}>
                    <PieChart>
                      <Pie
                        data={distribuicaoStatus}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={85}
                        paddingAngle={6}
                        dataKey="value"
                      >
                        {distribuicaoStatus.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0", borderRadius: "12px", color: "#1e293b", fontSize: "12px", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-400 text-xs">Sem dados de status</div>
                )}
              </div>
              <div className="space-y-2">
                {distribuicaoStatus?.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 text-gray-600">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                      {item.name}
                    </span>
                    <span className="font-bold text-gray-900">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* FLUXO DIÁRIO DE CHAMADOS */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <FiTrendingUp className="text-blue-600" /> Fluxo Diário de Atendimentos (Últimos dias)
                </h3>
                <p className="text-xs text-gray-500">Tendência temporal de abertura de chamados</p>
              </div>
            </div>
            <div className="h-72 w-full">
              {dadosEvolucao && dadosEvolucao.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={100}>
                  <LineChart data={dadosEvolucao} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="data" stroke="#94a3b8" fontSize={11} />
                    <YAxis stroke="#94a3b8" fontSize={11} />
                    <Tooltip contentStyle={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0", borderRadius: "12px", color: "#1e293b", fontSize: "12px", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }} />
                    <Line type="monotone" dataKey="qtd" stroke="#2563eb" strokeWidth={3} dot={{ fill: "#2563eb", r: 4 }} activeDot={{ r: 7 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400 text-xs">Sem dados temporais suficientes</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CONTEÚDO DA ABA: CHAMADOS & SLA */}
      {abaAtiva === "chamadosSla" && (
        <div className="space-y-8 animate-fadeIn">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-12 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2 mb-1">
                <FiClock className="text-blue-600" /> Desempenho de SLA por Equipe (Horas Médias)
              </h3>
              <p className="text-xs text-gray-500 mb-6">Análise detalhada do tempo de resposta e solução por equipe técnica</p>
              
              <div className="h-80 w-full">
                {dadosSlaEquipes && dadosSlaEquipes.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={100}>
                    <BarChart data={dadosSlaEquipes} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                      <YAxis stroke="#94a3b8" fontSize={11} />
                      <Tooltip contentStyle={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0", borderRadius: "12px", color: "#1e293b", fontSize: "12px", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }} />
                      <Bar dataKey="mediaSLA" fill="#10b981" radius={[6, 6, 0, 0]} name="Média SLA (Horas)" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-400 text-xs">Nenhum registro de SLA por equipe encontrado</div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <h3 className="text-base font-bold text-gray-900 mb-4">Métricas Consolidadas por Equipe Técnica</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-600">
                <thead className="bg-gray-50 text-gray-500 uppercase font-bold border-b border-gray-200">
                  <tr>
                    <th className="p-3.5">Equipe Técnica</th>
                    <th className="p-3.5">Chamados Atendidos</th>
                    <th className="p-3.5">Média de SLA</th>
                    <th className="p-3.5">Performance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {dadosSlaEquipes && dadosSlaEquipes.length > 0 ? (
                    dadosSlaEquipes.map((eq, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 transition-all">
                        <td className="p-3.5 font-bold text-gray-900">{eq.name}</td>
                        <td className="p-3.5">{eq.total} chamados</td>
                        <td className="p-3.5 font-semibold text-blue-600">{eq.mediaSLA} horas</td>
                        <td className="p-3.5">
                          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-bold">
                            Dentro do Padrão
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="p-6 text-center text-gray-400">Nenhum registro encontrado.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* CONTEÚDO DA ABA: ATIVOS & BAIXAS */}
      {abaAtiva === "ativosBaixas" && (
        <div className="space-y-8 animate-fadeIn">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <FiAlertTriangle className="text-rose-500" /> Top 10 Equipamentos Inutilizados / Baixados
                </h3>
                <p className="text-xs text-gray-500">Ranking analítico dos equipamentos com maior incidência de descarte ou baixa técnica</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-600">
                <thead className="bg-gray-50 text-gray-500 uppercase font-bold border-b border-gray-200">
                  <tr>
                    <th className="p-3.5">#</th>
                    <th className="p-3.5">Equipamento</th>
                    <th className="p-3.5">Unidade</th>
                    <th className="p-3.5">Setor</th>
                    <th className="p-3.5">Total de Baixas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {top10Baixas && top10Baixas.length > 0 ? (
                    top10Baixas.map((item, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 transition-all">
                        <td className="p-3.5 font-bold text-blue-600">#{idx + 1}</td>
                        <td className="p-3.5 font-bold text-gray-900">{item.nome}</td>
                        <td className="p-3.5">{item.unidade}</td>
                        <td className="p-3.5">{item.setor}</td>
                        <td className="p-3.5">
                          <span className="px-2.5 py-1 bg-rose-50 text-rose-600 rounded-lg text-xs font-bold">
                            {item.total} baixas
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="p-6 text-center text-gray-400">Nenhum equipamento registrado como baixado/inutilizado.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <h3 className="text-base font-bold text-gray-900 mb-4">Relatório Detalhado de Baixas e Pareceres Técnicos</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-600">
                <thead className="bg-gray-50 text-gray-500 uppercase font-bold border-b border-gray-200">
                  <tr>
                    <th className="p-3.5">Equipamento</th>
                    <th className="p-3.5">Patrimônio</th>
                    <th className="p-3.5">Unidade / Setor</th>
                    <th className="p-3.5">Data da Baixa</th>
                    <th className="p-3.5">Parecer Técnico</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {baixasPaginadas && baixasPaginadas.length > 0 ? (
                    baixasPaginadas.map((b, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 transition-all">
                        <td className="p-3.5 font-bold text-gray-900">{b.equipamento}</td>
                        <td className="p-3.5 text-blue-600 font-mono">{b.patrimonio}</td>
                        <td className="p-3.5">{b.unidade} — {b.setor}</td>
                        <td className="p-3.5">{b.data}</td>
                        <td className="p-3.5 text-gray-500 italic">{b.parecerTecnico}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="p-6 text-center text-gray-400">Nenhum registro encontrado.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* CONTROLE DE PAGINAÇÃO DE BAIXAS */}
            <ControlesPaginacao
              paginaAtual={paginaBaixas}
              setPagina={setPaginaBaixas}
              totalPaginas={totalPaginasBaixas}
              totalItens={listaBaixas?.length || 0}
            />
          </div>
        </div>
      )}

      {/* CONTEÚDO DA ABA: LAUDOS & SAÍDAS */}
      {abaAtiva === "laudosSaidas" && (
        <div className="space-y-8 animate-fadeIn">
          {/* TABELA DE LAUDOS */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <h3 className="text-base font-bold text-gray-900 mb-2 flex items-center gap-2">
              <FiFileText className="text-blue-600" /> Laudos Técnicos Emitidos ({listaLaudos?.length || 0})
            </h3>
            <p className="text-xs text-gray-500 mb-6">Histórico de avaliações técnicas e laudos periciais de equipamentos</p>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-600">
                <thead className="bg-gray-50 text-gray-500 uppercase font-bold border-b border-gray-200">
                  <tr>
                    <th className="p-3.5">ID / Ref</th>
                    <th className="p-3.5">Equipamento</th>
                    <th className="p-3.5">Unidade</th>
                    <th className="p-3.5">Decisão</th>
                    <th className="p-3.5">Data</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {laudosPaginados && laudosPaginados.length > 0 ? (
                    laudosPaginados.map((l, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 transition-all">
                        <td className="p-3.5 font-mono text-blue-600">{l.id || `#${idx + 1}`}</td>
                        <td className="p-3.5 font-bold text-gray-900">{l.equipamento || l.nomeEquipamento || "N/A"}</td>
                        <td className="p-3.5">{l.unidade || "N/A"}</td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md font-bold">
                            {l.decisao || l.status || "Emitido"}
                          </span>
                        </td>
                        <td className="p-3.5">{l.criadoEmStr || formatarData(l.criadoEm || l.data || l.dataCriacao)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="p-6 text-center text-gray-400">Nenhum laudo técnico encontrado.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* CONTROLE DE PAGINAÇÃO DE LAUDOS */}
            <ControlesPaginacao
              paginaAtual={paginaLaudos}
              setPagina={setPaginaLaudos}
              totalPaginas={totalPaginasLaudos}
              totalItens={listaLaudos?.length || 0}
            />
          </div>

          {/* TABELA DE SAÍDAS DE EQUIPAMENTOS */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <h3 className="text-base font-bold text-gray-900 mb-2 flex items-center gap-2">
              <FiDatabase className="text-blue-600" /> Saídas / Transferências de Equipamentos ({listaSaidas?.length || 0})
            </h3>
            <p className="text-xs text-gray-500 mb-6">Controle de movimentação, envio para manutenção externa ou transferência entre unidades</p>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-600">
                <thead className="bg-gray-50 text-gray-500 uppercase font-bold border-b border-gray-200">
                  <tr>
                    <th className="p-3.5">Equipamento</th>
                    <th className="p-3.5">Patrimônio</th>
                    <th className="p-3.5">Origem</th>
                    <th className="p-3.5">Destino</th>
                    <th className="p-3.5">Motivo</th>
                    <th className="p-3.5">Data da Saída</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {saidasPaginadas && saidasPaginadas.length > 0 ? (
                    saidasPaginadas.map((s, idx) => {
                      const nomeEquip = s.nomeEquipamento || s.equipamento || "N/A";
                      const pat = s.patrimonio || "S/P";
                      
                      const orig = s.unidadeOrigem 
                        ? `${s.unidadeOrigem}${s.setorOrigem ? ` (${s.setorOrigem})` : ""}`
                        : "N/A";

                      const dest = s.unidadeDestino 
                        ? `${s.unidadeDestino}${s.setorDestino ? ` (${s.setorDestino})` : ""}`
                        : "Externa / Manutenção";

                      const dataExibicao = s.dataSaidaStr || formatarData(s.dataSaida);

                      return (
                        <tr key={s.id || idx} className="hover:bg-gray-50 transition-all">
                          <td className="p-3.5 font-bold text-gray-900">{nomeEquip}</td>
                          <td className="p-3.5 text-blue-600 font-mono">{pat}</td>
                          <td className="p-3.5">{orig}</td>
                          <td className="p-3.5">{dest}</td>
                          <td className="p-3.5 text-gray-500">{s.motivo || s.observacoes || "Transferência"}</td>
                          <td className="p-3.5">{dataExibicao}</td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="6" className="p-6 text-center text-gray-400">Nenhuma saída de equipamento registrada.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* CONTROLE DE PAGINAÇÃO DE SAÍDAS / MOVIMENTAÇÕES */}
            <ControlesPaginacao
              paginaAtual={paginaSaidas}
              setPagina={setPaginaSaidas}
              totalPaginas={totalPaginasSaidas}
              totalItens={listaSaidas?.length || 0}
            />
          </div>
        </div>
      )}

    </div>
  );
}