import React, { useEffect } from "react";
import { X, Send, Loader2, Building2, Monitor, Hash, MapPin, FileText, BarChart, CheckCircle2, Users, Search, RotateCcw, Wrench } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCadastroChamado } from "../hooks/useCadastroChamado";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function CadastroChamado({ isOpen = true, onClose }) {
  const navigate = useNavigate();
  const hook = useCadastroChamado();

  // Garante que, se o setor for preenchido pela busca, ele fique editável
  useEffect(() => {
    if (hook.setor) {
      hook.setSetorManual(true);
    }
  }, [hook.setor]);

  if (onClose && !isOpen) return null;

  const handleFechar = () => {
    hook.setSucesso(false);
    if (onClose) onClose();
    else navigate(-1);
  };

  return (
    <div className="bg-slate-50 min-h-screen font-sans flex flex-col justify-between">
      {/* HEADER PRINCIPAL */}
      <Header />

      {/* CONTEÚDO DA PÁGINA CENTRALIZADO (MESMO PADRÃO DA TELA DE LAUDOS) */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-6 space-y-6">
        
        {/* TÍTULO DA PÁGINA */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 text-white p-2.5 rounded-2xl shadow-sm">
              <Wrench size={22} />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 italic uppercase tracking-tight">
                Painel de Abertura de Chamados
              </h1>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">
                Solicitação de Suporte Técnico e Manutenção
              </p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={handleFechar} 
            className="px-3.5 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-100 transition-all font-bold text-xs flex items-center gap-2 shadow-2xs cursor-pointer"
          >
            <X size={16} /> Fechar
          </button>
        </div>

        {/* CONTAINER DO FORMULÁRIO */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-8">
          {hook.sucesso ? (
            <div className="py-12 text-center flex flex-col items-center animate-in fade-in slide-in-from-bottom-6 max-w-md mx-auto">
              <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6 shadow-sm">
                <CheckCircle2 size={40} strokeWidth={3} />
              </div>
              <h2 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-tight">Protocolo Gerado!</h2>
              <p className="text-slate-500 mb-8 italic text-xl font-bold">#{hook.protocoloGerado}</p>
              <button 
                onClick={handleFechar} 
                className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl hover:bg-blue-600 transition-all uppercase text-xs cursor-pointer shadow-md"
              >
                Concluir e Voltar
              </button>
            </div>
          ) : (
            <form onSubmit={hook.handleNovoChamado} className="space-y-5">
              
              {/* BLOCO PATRIMÔNIO / TAG */}
              <div className="bg-slate-50/70 border border-slate-200/80 p-4 rounded-2xl space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Hash size={13} className="text-blue-600" /> Patrimônio / Tag
                  </label>
                  <button 
                    type="button" 
                    onClick={hook.toggleNaoSei} 
                    className={`text-[9px] font-black px-2.5 py-1 rounded-lg transition-all cursor-pointer uppercase ${hook.naoSeiPatrimonio ? "bg-amber-500 text-white" : "bg-slate-200/80 text-slate-600 hover:bg-slate-300"}`}
                  >
                    {hook.naoSeiPatrimonio ? "DIGITAR" : "NÃO SEI TAG"}
                  </button>
                </div>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-black text-xs">#</span>
                    <input 
                      required 
                      readOnly={hook.naoSeiPatrimonio} 
                      value={hook.patrimonio} 
                      onChange={(e) => hook.setPatrimonio(e.target.value)} 
                      placeholder="Ex: 25779" 
                      className={`w-full py-2.5 pl-8 pr-3 border rounded-xl outline-none text-xs font-bold transition-all ${hook.naoSeiPatrimonio ? "bg-amber-50 border-amber-200 text-slate-700" : "bg-white border-slate-200 focus:border-blue-600 text-slate-700"}`} 
                    />
                  </div>
                  <button 
                    type="button" 
                    disabled={hook.buscandoAtivo || hook.naoSeiPatrimonio} 
                    onClick={hook.handleBotaoBusca} 
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 rounded-xl flex items-center justify-center transition-all disabled:opacity-50 min-w-[46px] cursor-pointer shadow-2xs"
                  >
                    {hook.buscandoAtivo ? <Loader2 className="animate-spin" size={16} /> : <Search size={16} />}
                  </button>
                  <button 
                    type="button" 
                    onClick={hook.handleLimparCampos} 
                    className="bg-slate-200 hover:bg-slate-300 text-slate-600 px-4 rounded-xl flex items-center justify-center transition-all min-w-[46px] cursor-pointer"
                  >
                    <RotateCcw size={16} />
                  </button>
                </div>
              </div>

              {/* LINHA 1 DUPLA: UNIDADE E EQUIPE */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Unidade */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block">
                    Unidade
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <select 
                      required 
                      value={hook.unidade} 
                      onChange={(e) => hook.setUnidade(e.target.value)} 
                      className="w-full py-2.5 pl-10 pr-3 bg-slate-50/70 border border-slate-200/80 rounded-xl outline-none focus:bg-white focus:border-blue-600 appearance-none text-xs font-bold text-slate-700 transition-all cursor-pointer"
                    >
                      <option value="">Onde você está?</option>
                      {Object.keys(hook.MAPA_SETORES_POR_UNIDADE || {}).map((u) => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Equipe */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block">
                    Equipe Responsável
                  </label>
                  <div className="relative">
                    <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <select 
                      required 
                      value={hook.equipe} 
                      onChange={(e) => hook.setEquipe(e.target.value)} 
                      className="w-full py-2.5 pl-10 pr-3 bg-slate-50/70 border border-slate-200/80 rounded-xl outline-none focus:bg-white focus:border-blue-600 appearance-none text-xs font-bold text-slate-700 transition-all cursor-pointer"
                    >
                      <option value="">Para qual equipe é o chamado?</option>
                      <option value="refrigeracao">Refrigeração</option>
                      <option value="patrimonio">Patrimônio</option>
                      <option value="Manutencao patrimonial">Manutenção Patrimônial</option>
                      <option value="ti computadores impressoras">TI Computadores e Impressoras</option>
                      <option value="ti sistema e redes">TI Sistema e Redes</option>
                      <option value="manutencao predial">Manutenção Predial</option>
                      <option value="engenharia clinica">Engenharia Clínica</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* LINHA 2 DUPLA: EQUIPAMENTO E SETOR */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Equipamento */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block">
                    Equipamento
                  </label>
                  <div className="relative">
                    <Monitor className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                      required 
                      value={hook.equipamento} 
                      onChange={(e) => hook.setEquipamento(e.target.value)} 
                      placeholder="Ex: Frigobar" 
                      className="w-full py-2.5 pl-10 pr-3 bg-slate-50/70 border border-slate-200/80 rounded-xl outline-none focus:bg-white focus:border-blue-600 text-xs font-bold text-slate-700 transition-all" 
                    />
                  </div>
                </div>

                {/* Setor */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      {hook.setorManual ? "Digitar Setor" : "Setor"}
                    </label>
                    <button 
                      type="button" 
                      onClick={() => hook.setSetorManual(!hook.setorManual)} 
                      className="text-[9px] font-black text-blue-600 hover:underline uppercase cursor-pointer"
                    >
                      {hook.setorManual ? "Lista" : "Não achou? Digitar"}
                    </button>
                  </div>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    {hook.setorManual ? (
                      <input 
                        required 
                        value={hook.setor} 
                        onChange={(e) => hook.setSetor(e.target.value)} 
                        placeholder="Digite o setor..." 
                        className="w-full py-2.5 pl-10 pr-3 bg-slate-50/70 border border-slate-200/80 rounded-xl outline-none focus:bg-white focus:border-blue-600 text-xs font-bold text-slate-700 transition-all" 
                      />
                    ) : (
                      <select 
                        required 
                        disabled={!hook.unidade} 
                        value={hook.setor} 
                        onChange={(e) => hook.setSetor(e.target.value)} 
                        className="w-full py-2.5 pl-10 pr-3 bg-slate-50/70 border border-slate-200/80 rounded-xl outline-none focus:bg-white focus:border-blue-600 appearance-none text-xs font-bold text-slate-700 transition-all cursor-pointer"
                      >
                        <option value="">{hook.unidade ? "Selecione o setor..." : "Escolha a unidade primeiro"}</option>
                        {hook.MAPA_SETORES_POR_UNIDADE[hook.unidade]?.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              </div>

              {/* PRIORIDADE */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block">
                  Prioridade
                </label>
                <div className="relative">
                  <BarChart className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <select 
                    value={hook.prioridade} 
                    onChange={(e) => hook.setPrioridade(e.target.value)} 
                    className="w-full py-2.5 pl-10 pr-3 bg-slate-50/70 border border-slate-200/80 rounded-xl outline-none focus:border-blue-600 appearance-none text-xs font-bold text-slate-700 cursor-pointer"
                  >
                    <option value="baixa">Baixa</option>
                    <option value="média">Média</option>
                    <option value="alta">Alta</option>
                    <option value="urgente">Urgente</option>
                  </select>
                </div>
              </div>

              {/* DESCRIÇÃO */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block">
                  Descrição do Problema
                </label>
                <div className="relative">
                  <FileText className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
                  <textarea 
                    required 
                    value={hook.descricao} 
                    onChange={(e) => hook.setDescricao(e.target.value)} 
                    placeholder="Descreva o problema detalhadamente..." 
                    rows="3" 
                    className="w-full p-3 pl-10 bg-slate-50/70 border border-slate-200/80 rounded-xl outline-none focus:bg-white focus:border-blue-600 text-xs font-medium text-slate-700 resize-none transition-all" 
                  />
                </div>
              </div>

              {/* BOTÃO ENVIAR */}
              <button 
                disabled={hook.loading} 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-3.5 rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 uppercase text-xs active:scale-98 disabled:opacity-70 cursor-pointer"
              >
                {hook.loading ? <Loader2 className="animate-spin" size={16} /> : <><Send size={15} /> Enviar Chamado</>}
              </button>
            </form>
          )}
        </div>
      </main>

      {/* FOOTER PRINCIPAL */}
      <Footer />
    </div>
  );
}