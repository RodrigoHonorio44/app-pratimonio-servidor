import React, { useState, useEffect, useRef } from "react";
import { auth } from "../services/firebase";
import api from "../services/api";
import { toast } from "react-toastify";
import { 
  X, 
  Printer, 
  Eye, 
  FileText, 
  CheckCircle,
  Wrench,
  Clock,
  AlertTriangle,
  Camera,
  Upload,
  Trash2,
  Image as ImageIcon
} from "lucide-react";
import ImpressaoLaudoTecnico from "./ImpressaoLaudoTecnico";

const ModalLaudoTecnico = ({ equipamento, isOpen, onClose, onAtualizar }) => {
  const [etapa, setEtapa] = useState("formulario"); 
  const [diagnosticoTecnico, setDiagnosticoTecnico] = useState("");
  const [justificativaSubstituicao, setJustificativaSubstituicao] = useState("");
  const [fotoUrl, setFotoUrl] = useState(null);
  const [processando, setProcessando] = useState(false);

  // Estados para o Histórico de Manutenções
  const [historicoManutencoes, setHistoricoManutencoes] = useState([]);
  const [loadingHistorico, setLoadingHistorico] = useState(false);

  // Refs para acionar os inputs de arquivo/câmera
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  useEffect(() => {
    if (isOpen && equipamento) {
      buscarHistoricoChamados();
    }
  }, [isOpen, equipamento]);

  const fecharELimpar = () => {
    setEtapa("formulario");
    setDiagnosticoTecnico("");
    setJustificativaSubstituicao("");
    setFotoUrl(null);
    setHistoricoManutencoes([]);
    onClose();
  };

  // Trata o carregamento/conversão de imagem para base64
  const handleFotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFotoUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removerFoto = () => {
    setFotoUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  // Função para obter token Firebase atualizado
  const getAuthHeader = async () => {
    const user = auth.currentUser;
    if (user) {
      const token = await user.getIdToken();
      return { Authorization: `Bearer ${token}` };
    }
    return {};
  };

  // Busca histórico de chamados flexível (por patrimônio ou por ID do equipamento)
  const buscarHistoricoChamados = async () => {
    setLoadingHistorico(true);
    try {
      const headers = await getAuthHeader();
      
      const patrimonioAtual = equipamento.patrimonio 
        ? String(equipamento.patrimonio).trim().toLowerCase().replace(/^0+/, "") 
        : "";
      
      const idAtivoAtual = String(
        equipamento.idAtivo || equipamento.ativoId || equipamento.id || equipamento._id || ""
      ).trim();

      const resposta = await api.get("/chamados", { headers });
      const dados = resposta.data;

      const listaChamados = Array.isArray(dados) 
        ? dados 
        : (dados?.chamados || dados?.dados || []);
      
      const chamadosDoAtivo = listaChamados.filter((ch) => {
        const patChamado = ch.patrimonio || ch.patrimonioId || ch.codigoPatrimonio || "";
        const patChamadoLimpo = String(patChamado).trim().toLowerCase().replace(/^0+/, "");
        
        const equipIdChamado = String(
          ch.equipamentoId || ch.ativoId || ch.idEquipamento || ""
        ).trim();

        const matchPatrimonio = patrimonioAtual !== "" && patChamadoLimpo === patrimonioAtual;
        const matchId = idAtivoAtual !== "" && equipIdChamado === idAtivoAtual;

        return matchPatrimonio || matchId;
      });

      setHistoricoManutencoes(chamadosDoAtivo);
    } catch (error) {
      console.error("Erro ao buscar histórico de chamados:", error);
      toast.error("Não foi possível carregar o histórico de manutenções.");
    } finally {
      setLoadingHistorico(false);
    }
  };

  // Grava o laudo e atualiza o estado do ativo usando 'api'
  const emitirLaudoDefinitivo = async () => {
    if (!diagnosticoTecnico.trim() || !justificativaSubstituicao.trim()) {
      toast.error("Por favor, preencha todos os campos do laudo técnico.");
      return;
    }

    setProcessando(true);
    try {
      const headers = await getAuthHeader();
      const idAtivo = equipamento.idAtivo || equipamento.ativoId || equipamento.id || equipamento._id;

      if (!idAtivo) {
        toast.error("ID do equipamento não encontrado para atualização.");
        return;
      }

      const historicoTratado = historicoManutencoes.map((os) => {
        const osId = os.id || os._id;
        return {
          id: osId,
          numeroOs: os.numeroOs || (osId ? String(osId).substring(0, 6) : "s/n"),
          dataAbertura: os.dataAbertura || "n/i",
          defeito: (os.descricaoDefeito || os.descricaoProblema || "").toLowerCase().trim(),
          solucao: (os.solucaoTecnica || "").toLowerCase().trim()
        };
      });

      // 1. Cadastra o laudo na rota POST /laudos (mantendo o texto original sem forçar lowercase)
      const payloadLaudo = {
        equipamentoId: idAtivo,
        nomeEquipamento: (equipamento.nome || "").toLowerCase().trim(),
        patrimonio: equipamento.patrimonio ? String(equipamento.patrimonio).toLowerCase().trim() : "s/p",
        unidade: (equipamento.unidade || "").toLowerCase().trim(),
        setor: (equipamento.setor || "").toLowerCase().trim(),
        diagnosticoDefeito: diagnosticoTecnico.trim(),
        justificativaLaudo: justificativaSubstituicao.trim(),
        fotoUrl: fotoUrl || null,
        status: "pendente",
        totalManutencoesAnteriores: historicoManutencoes.length,
        historicoAnexo: historicoTratado
      };

      await api.post("/laudos", payloadLaudo, { headers });

      // 2. Atualiza o status do ativo na rota PUT /ativos/:id
      const payloadAtivo = {
        status: "laudo pendente",
        diagnosticoDefeito: diagnosticoTecnico.trim(),
        justificativaLaudo: justificativaSubstituicao.trim(),
        fotoUrl: fotoUrl || null,
        dataLaudoTecnico: new Date().toISOString(),
        ultimaMovimentacao: new Date().toISOString()
      };

      await api.put(`/ativos/${idAtivo}`, payloadAtivo, { headers });

      toast.success("Laudo técnico emitido com sucesso! Aguardando homologação final.");
      fecharELimpar();
      if (onAtualizar) onAtualizar();
    } catch (error) {
      console.error("Erro ao emitir laudo:", error);
      toast.error(
        error.response?.data?.error || 
        error.response?.data?.message || 
        "Erro ao registrar o laudo técnico."
      );
    } finally {
      setProcessando(false);
    }
  };

  if (!isOpen || !equipamento) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto print-container">
      
      {/* ETAPA 1: FORMULÁRIO */}
      {etapa === "formulario" && (
        <div className="bg-white rounded-[24px] w-full max-w-5xl shadow-2xl border border-slate-100 flex flex-col md:flex-row overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90vh]">
          
          {/* PAINEL ESQUERDO: HISTÓRICO DE MANUTENÇÕES */}
          <div className="w-full md:w-5/12 bg-slate-50 p-4 md:p-6 border-b md:border-b-0 md:border-r border-slate-200/60 flex flex-col overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-black text-slate-700 uppercase text-[11px] tracking-wider flex items-center gap-1.5">
                <Clock size={14} className="text-red-500" /> Histórico de Chamados
              </h4>
              <span className="bg-red-50 text-red-600 border border-red-100 text-[10px] font-black uppercase px-2 py-0.5 rounded-md">
                {historicoManutencoes.length} Ocorrência(s)
              </span>
            </div>

            {loadingHistorico ? (
              <div className="flex-grow flex items-center justify-center py-12">
                <p className="text-xs font-black text-slate-400 animate-pulse uppercase">Buscando histórico...</p>
              </div>
            ) : historicoManutencoes.length === 0 ? (
              <div className="flex-grow flex flex-col items-center justify-center text-slate-400 p-6 text-center border border-dashed border-slate-200 rounded-2xl bg-white/50">
                <AlertTriangle size={28} className="opacity-30 mb-2 text-slate-500" />
                <p className="text-[11px] font-bold uppercase tracking-wide">Nenhuma manutenção anterior localizada para este patrimônio.</p>
              </div>
            ) : (
              <div className="space-y-3 overflow-y-auto pr-1 flex-grow max-h-[50vh] md:max-h-none">
                {historicoManutencoes.map((os) => {
                  const keyId = os.id || os._id;
                  return (
                    <div key={keyId} className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm border-l-4 border-l-red-500 text-xs">
                      <div className="flex justify-between font-black text-slate-400 text-[9px] uppercase mb-1">
                        <span>OS #{os.numeroOs || String(keyId).substring(0, 6)}</span>
                        <span className="font-mono">{os.dataAbertura || "Data N/I"}</span>
                      </div>
                      <p className="font-bold text-slate-800 uppercase mb-1">
                        <span className="text-slate-400 font-medium">Reclamação:</span> {os.descricaoDefeito || os.descricaoProblema}
                      </p>
                      {os.solucaoTecnica && (
                        <p className="bg-emerald-50/60 text-emerald-800 p-2 rounded-lg font-medium mt-1 uppercase text-[11px] border border-emerald-100/40">
                          <span className="font-black">Ação Aplicada:</span> {os.solucaoTecnica}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* PAINEL DIREITO: FORMULÁRIO */}
          <div className="w-full md:w-7/12 p-4 md:p-6 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-black text-slate-800 uppercase text-xs tracking-wider flex items-center gap-2">
                  <Wrench size={16} className="text-blue-600" /> Emitir Laudo de Inviabilidade Técnica
                </h3>
                <button onClick={fecharELimpar} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                  <X size={18} />
                </button>
              </div>

              <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 space-y-1.5 text-xs font-sans">
                <div className="grid grid-cols-2 gap-2">
                  <div className="capitalize"><strong>Equipamento:</strong> <span className="text-slate-700">{equipamento.nome}</span></div>
                  <div><strong>Nº Patrimônio:</strong> <span className="text-blue-600 font-mono uppercase">#{equipamento.patrimonio || "S/P"}</span></div>
                </div>
                <div className="grid grid-cols-2 gap-2 border-t border-slate-200/60 pt-1.5">
                  <div><strong>Unidade:</strong> <span className="text-slate-700 capitalize">{equipamento.unidade}</span></div>
                  <div className="capitalize"><strong>Setor Atual:</strong> <span className="text-slate-700">{equipamento.setor}</span></div>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                    Diagnóstico Técnico / Situação do Ativo
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Descreva detalhadamente os defeitos encontrados..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"
                    value={diagnosticoTecnico}
                    onChange={(e) => setDiagnosticoTecnico(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                    Justificativa para Substituição Imediata
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Justifique o impacto da falta deste equipamento na unidade..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"
                    value={justificativaSubstituicao}
                    onChange={(e) => setJustificativaSubstituicao(e.target.value)}
                  />
                </div>

                {/* BLOCO DE CAPTURA E UPLOAD DE FOTO */}
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1 flex items-center gap-1">
                    <ImageIcon size={12} className="text-blue-600" /> Anexo Fotográfico
                  </label>

                  {/* Inputs Ocultos */}
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleFotoChange}
                    className="hidden"
                  />
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    ref={cameraInputRef}
                    onChange={handleFotoChange}
                    className="hidden"
                  />

                  {!fotoUrl ? (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => cameraInputRef.current?.click()}
                        className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl p-2.5 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer uppercase"
                      >
                        <Camera size={15} className="text-blue-600" /> Tirar Foto
                      </button>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl p-2.5 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer uppercase"
                      >
                        <Upload size={15} className="text-slate-600" /> Upload Foto
                      </button>
                    </div>
                  ) : (
                    <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-50 h-28 flex items-center justify-center">
                      <img
                        src={fotoUrl}
                        alt="Preview do Equipamento"
                        className="h-full w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={removerFoto}
                        className="absolute top-2 right-2 bg-red-600 text-white p-1.5 rounded-lg shadow-md hover:bg-red-700 transition-all cursor-pointer"
                        title="Remover Imagem"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>

              </div>
            </div>

            <div className="flex gap-2 border-t border-slate-100 pt-3 mt-4">
              <button
                type="button"
                onClick={fecharELimpar}
                className="flex-1 bg-slate-100 text-slate-600 font-bold py-2 rounded-xl text-xs uppercase tracking-wider cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={!diagnosticoTecnico.trim() || !justificativaSubstituicao.trim()}
                onClick={() => setEtapa("preview")}
                className="flex-1 bg-slate-800 text-white font-bold py-2 rounded-xl text-xs hover:bg-slate-900 flex items-center justify-center gap-1.5 shadow-md uppercase tracking-wider disabled:opacity-50 cursor-pointer"
              >
                <Eye size={14} /> Pré-visualizar Laudo
              </button>
            </div>
          </div>

        </div>
      )}

      {/* ETAPA 2: PREVIEW E IMPRESSÃO VIA COMPONENTE SEPARADO */}
      {etapa === "preview" && (
        <div className="bg-white w-full max-w-[850px] shadow-2xl p-5 sm:p-6 flex flex-col justify-between font-sans text-slate-900 mx-auto rounded-[20px] animate-in fade-in duration-200 overflow-y-auto max-h-[92vh]">
          
          {/* BARRA DE AÇÕES SUPERIOR (NÃO IMPRESSA) */}
          <div className="flex justify-between items-center bg-slate-100 border border-slate-200 p-3 rounded-xl mb-3 barra-botoes-preview print:hidden">
            <div className="flex items-center gap-2 text-blue-600 font-bold text-xs uppercase tracking-tight">
              <FileText size={16} /> Conferência do Laudo de Inviabilidade
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setEtapa("formulario")}
                className="bg-white border border-slate-300 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-50 uppercase tracking-wider cursor-pointer"
              >
                Editar
              </button>
              <button
                onClick={() => window.print()}
                className="bg-slate-800 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-900 flex items-center gap-1 shadow-md uppercase tracking-wider cursor-pointer"
              >
                <Printer size={14} /> Imprimir Laudo
              </button>
              <button
                onClick={emitirLaudoDefinitivo}
                disabled={processando}
                className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-700 flex items-center gap-1 shadow-md uppercase tracking-wider disabled:opacity-50 cursor-pointer"
              >
                <CheckCircle size={14} /> {processando ? "Salvando..." : "Homologar Laudo"}
              </button>
            </div>
          </div>

          {/* COMPONENTE EXCLUSIVO DE IMPRESSÃO */}
          <ImpressaoLaudoTecnico
            equipamento={equipamento}
            diagnosticoTecnico={diagnosticoTecnico}
            justificativaSubstituicao={justificativaSubstituicao}
            fotoUrl={fotoUrl}
            historicoManutencoes={historicoManutencoes}
          />

        </div>
      )}

    </div>
  );
};

export default ModalLaudoTecnico;