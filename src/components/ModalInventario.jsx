import React, { useState, useEffect } from "react";
import { auth } from "../services/firebase";
import api from "../services/api";
import { toast } from "react-toastify";
import { 
  X, 
  Printer, 
  Eye, 
  AlertTriangle, 
  CheckCircle,
  Archive
} from "lucide-react";

const ModalInventario = ({ equipamento, isOpen, onClose, onAtualizar }) => {
  const [etapa, setEtapa] = useState("confirmacao");
  const [localArmazenamento, setLocalArmazenamento] = useState("");
  const [motivoBaixa, setMotivoBaixa] = useState("inservivel");
  const [estadoConservacao, setEstadoConservacao] = useState("sucata");
  
  // Já inicia pré-preenchido com o número automático gerado
  const [referenciaExterna, setReferenciaExterna] = useState("");
  
  const [parecerTecnico, setParecerTecnico] = useState("");
  const [processando, setProcessando] = useState(false);

  // Gera a referência automática assim que o modal abre ou o equipamento muda
  useEffect(() => {
    if (isOpen) {
      const codigoAuto = `LAUDO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      setReferenciaExterna(codigoAuto);
    }
  }, [isOpen, equipamento]);

  if (!isOpen || !equipamento) return null;

  const fecharELimpar = () => {
    setEtapa("confirmacao");
    setLocalArmazenamento("");
    setMotivoBaixa("inservivel");
    setEstadoConservacao("sucata");
    setReferenciaExterna("");
    setParecerTecnico("");
    onClose();
  };

  const executarBaixaDefinitiva = async () => {
    if (!localArmazenamento.trim()) {
      toast.error("Por favor, informe o local onde o patrimônio será guardado.");
      return;
    }

    const idAtivo = equipamento.idAtivo || equipamento.ativoId || equipamento.id || equipamento._id;

    if (!idAtivo) {
      toast.error("Não foi possível identificar o código do patrimônio no banco.");
      return;
    }

    setProcessando(true);
    try {
      const currentUser = auth.currentUser;
      const token = currentUser ? await currentUser.getIdToken() : "";

      const dataHoraAtual = new Date().toISOString();
      const refFinal = referenciaExterna.trim() || `LAUDO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

      await api.put(
        `/ativos/${idAtivo}`,
        {
          status: "inutilizado",
          localArmazenamentoAcervo: localArmazenamento.trim(),
          destino: localArmazenamento.trim(),
          motivoBaixa: motivoBaixa,
          estadoConservacao: estadoConservacao,
          numeroProcesso: refFinal,
          parecerTecnico: parecerTecnico.trim(),
          dataBaixa: dataHoraAtual,
          observacoes: `Baixa Definitiva realizada em ${new Date(dataHoraAtual).toLocaleString("pt-BR")}. Ref/OS: ${refFinal}. Destino: ${localArmazenamento.trim()}`
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      toast.success("Baixa de patrimônio realizada com sucesso!");
      fecharELimpar();
      if (onAtualizar) onAtualizar();
    } catch (error) {
      console.error("Erro ao processar baixa:", error);
      toast.error(
        error.response?.data?.message || "Erro ao processar a baixa do patrimônio no banco de dados."
      );
    } finally {
      setProcessando(false);
    }
  };

  return (
    <>
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #termo-baixa-imprimir, #termo-baixa-imprimir * {
            visibility: visible !important;
          }
          #termo-baixa-imprimir {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 15mm !important;
            box-shadow: none !important;
            border: none !important;
            background: white !important;
          }
          @page {
            size: A4 portrait;
            margin: 0;
          }
        }
      `}</style>

      <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
        
        {/* ETAPA 1: CONFIRMAÇÃO INICIAL */}
        {etapa === "confirmacao" && (
          <div className="bg-white rounded-[24px] p-6 max-w-sm w-full shadow-2xl text-center space-y-4 border border-slate-100 my-auto">
            <div className="bg-red-50 text-red-600 w-12 h-12 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle size={24} />
            </div>
            <div>
              <h3 className="font-black text-slate-800 text-base uppercase">Confirmar Processo de Baixa?</h3>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Você está prestes a iniciar o termo de baixa do patrimônio <span className="font-bold text-slate-700 font-mono uppercase">{equipamento.patrimonio || "S/P"}</span>. Deseja prosseguir?
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={fecharELimpar}
                className="flex-1 bg-slate-100 text-slate-600 font-bold py-2.5 rounded-xl text-xs uppercase tracking-wider hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Não
              </button>
              <button
                onClick={() => setEtapa("formulario")}
                className="flex-1 bg-red-600 text-white font-bold py-2.5 rounded-xl text-xs hover:bg-red-700 shadow-md uppercase tracking-wider transition-colors cursor-pointer"
              >
                Sim
              </button>
            </div>
          </div>
        )}

        {/* ETAPA 2: FORMULÁRIO COM CAMPO JÁ PRÉ-PREENCHIDO */}
        {etapa === "formulario" && (
          <div className="bg-white rounded-[32px] p-6 max-w-xl w-full shadow-2xl space-y-5 border border-slate-100 my-auto max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-slate-800 uppercase text-xs tracking-wider flex items-center gap-2">
                <Archive size={16} className="text-red-600" /> Detalhes e Laudo da Baixa Patrimonial
              </h3>
              <button onClick={fecharELimpar} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-2.5 text-xs font-sans">
              <div className="grid grid-cols-2 gap-2">
                <div><span className="text-slate-400 font-bold block uppercase text-[10px]">Equipamento:</span> <strong className="text-slate-700 capitalize">{equipamento.nome}</strong></div>
                <div><span className="text-slate-400 font-bold block uppercase text-[10px]">Nº Patrimônio:</span> <strong className="text-blue-600 font-mono uppercase">{equipamento.patrimonio || "S/P"}</strong></div>
              </div>
              <div className="grid grid-cols-2 gap-2 border-t border-slate-200/60 pt-2">
                <div><span className="text-slate-400 font-bold block uppercase text-[10px]">Unidade Atual:</span> <strong className="text-slate-700">{equipamento.unidade}</strong></div>
                <div><span className="text-slate-400 font-bold block uppercase text-[10px]">Setor Atual:</span> <strong className="text-slate-700 capitalize">{equipamento.setor}</strong></div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                  Motivo Principal da Baixa *
                </label>
                <select
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-red-500 cursor-pointer"
                  value={motivoBaixa}
                  onChange={(e) => setMotivoBaixa(e.target.value)}
                >
                  <option value="inservivel">Inservível / Recuperação Inviável</option>
                  <option value="obsoleto">Obsoleto Tecnologicamente</option>
                  <option value="avariado">Avaria Irrecuperável / Sinistro</option>
                  <option value="exturgo">Exturgo / Desaparecimento</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                  Estado Físico / Conservação *
                </label>
                <select
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-red-500 cursor-pointer"
                  value={estadoConservacao}
                  onChange={(e) => setEstadoConservacao(e.target.value)}
                >
                  <option value="sucata">Sucata / Irrecuperável</option>
                  <option value="mau">Mau Estado (Estrutura Comprometida)</option>
                  <option value="parcial">Danificado Parcialmente</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                  Local de Armazenamento / Destino *
                </label>
                <input
                  type="text"
                  placeholder="Ex: Depósito de Inservíveis / Galpão Central"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-red-500 uppercase"
                  value={localArmazenamento}
                  onChange={(e) => setLocalArmazenamento(e.target.value)}
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Nº OS / Chamado ou Processo SEI
                  </label>
                  <span className="text-[9px] font-bold text-blue-600">Editável (Apague para mudar)</span>
                </div>
                <input
                  type="text"
                  placeholder="Ex: OS #4829"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-red-500"
                  value={referenciaExterna}
                  onChange={(e) => setReferenciaExterna(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                Parecer / Justificativa Técnica do Analista
              </label>
              <textarea
                rows={3}
                placeholder="Descreva detalhadamente o estado do bem e o motivo técnico..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-red-500 resize-none"
                value={parecerTecnico}
                onChange={(e) => setParecerTecnico(e.target.value)}
              />
            </div>

            <div className="flex gap-2 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={fecharELimpar}
                className="flex-1 bg-slate-100 text-slate-600 font-bold py-2.5 rounded-xl text-xs uppercase tracking-wider hover:bg-slate-200 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={!localArmazenamento.trim()}
                onClick={() => setEtapa("preview")}
                className="flex-1 bg-slate-800 text-white font-bold py-2.5 rounded-xl text-xs hover:bg-slate-900 flex items-center justify-center gap-1.5 shadow-md uppercase tracking-wider disabled:opacity-50 cursor-pointer"
              >
                <Eye size={14} /> Visualizar Termo
              </button>
            </div>
          </div>
        )}

        {/* ETAPA 3: LAUDO OFICIAL EM FORMATO A4 */}
        {etapa === "preview" && (
          <div className="bg-white w-full max-w-[800px] max-h-[92vh] overflow-y-auto shadow-2xl p-6 sm:p-8 flex flex-col justify-between font-serif text-slate-900 mx-auto rounded-[24px] my-auto">
            
            <div>
              <div className="sticky top-0 z-20 bg-slate-100/95 backdrop-blur-md border border-slate-200 p-3 rounded-xl mb-4 flex flex-wrap justify-between items-center gap-3 shadow-sm">
                <div className="flex items-center gap-2 text-red-600 font-bold text-xs uppercase tracking-tight">
                  <AlertTriangle size={16} /> Conferência do Laudo de Baixa
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => setEtapa("formulario")}
                    className="bg-white border border-slate-300 text-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-slate-50 uppercase tracking-wider cursor-pointer"
                  >
                    Voltar
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="bg-slate-800 text-white px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-slate-900 flex items-center gap-1.5 shadow-md uppercase tracking-wider cursor-pointer"
                  >
                    <Printer size={14} /> Imprimir
                  </button>
                  <button
                    onClick={executarBaixaDefinitiva}
                    disabled={processando}
                    className="bg-red-600 text-white px-4 py-1.5 rounded-xl text-xs font-bold hover:bg-red-700 flex items-center gap-1.5 shadow-md uppercase tracking-wider cursor-pointer disabled:opacity-50"
                  >
                    <CheckCircle size={14} /> {processando ? "Salvando..." : "Confirmar Baixa"}
                  </button>
                </div>
              </div>

              <div id="termo-baixa-imprimir" className="bg-white">
                <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-200 w-full">
                  <img src="/Imagem1.png" alt="Logo 1" className="h-8 sm:h-10 w-auto max-w-[22%] object-contain" />
                  <img src="/Imagem2.png" alt="Logo 2" className="h-8 sm:h-10 w-auto max-w-[22%] object-contain" />
                  <img src="/Imagem3.png" alt="Logo 3" className="h-8 sm:h-10 w-auto max-w-[22%] object-contain" />
                  <img src="/Imagem4.png" alt="Logo 4" className="h-8 sm:h-10 w-auto max-w-[22%] object-contain" />
                </div>

                <div className="text-center space-y-1 border-b-2 border-slate-800 pb-3 mb-4 font-sans">
                  <h2 className="text-base sm:text-lg font-black uppercase tracking-wide">Termo de Baixa Definitiva de Bem Patrimonial</h2>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Setor de Patrimônio e Inventário Central</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 text-xs mb-4 font-sans border border-slate-200 p-3 rounded-lg bg-slate-50/50">
                  <div className="capitalize"><strong>Equipamento / Ativo:</strong> {equipamento.nome}</div>
                  <div><strong>Nº de Patrimônio (TAG):</strong> <span className="font-mono font-bold uppercase">{equipamento.patrimonio || "S/P"}</span></div>
                  <div><strong>Unidade de Origem:</strong> {equipamento.unidade}</div>
                  <div className="capitalize"><strong>Setor de Origem:</strong> {equipamento.setor}</div>
                  <div className="capitalize"><strong>Motivo da Baixa:</strong> {motivoBaixa}</div>
                  <div className="capitalize"><strong>Estado Físico:</strong> {estadoConservacao}</div>
                  
                  <div className="col-span-1 sm:col-span-2">
                    <strong>Referência (OS / Chamado / Processo):</strong> <span className="font-mono text-blue-700">{referenciaExterna.trim() || "N/A"}</span>
                  </div>

                  <div className="col-span-1 sm:col-span-2 border-t border-slate-200 pt-1.5 uppercase text-red-700">
                    <strong>Destino / Local de Armazenamento:</strong> {localArmazenamento}
                  </div>
                  <div className="col-span-1 sm:col-span-2 text-slate-700 font-semibold">
                    <strong>Data e Hora da Emissão:</strong> {new Date().toLocaleString("pt-BR")}
                  </div>
                </div>

                {parecerTecnico && (
                  <div className="text-xs mb-4 font-sans border border-slate-200 p-3 rounded-lg bg-slate-50">
                    <strong className="block text-slate-700 uppercase text-[10px] mb-1">Parecer Técnico:</strong>
                    <p className="italic text-slate-600">{parecerTecnico}</p>
                  </div>
                )}

                <div className="text-xs leading-relaxed text-justify mb-6 space-y-2.5">
                  <p>
                    Pelo presente termo técnico de controle de acervo, atesta-se que o equipamento acima discriminado foi retirado de suas atividades operacionais na respectiva unidade de saúde física, passando pelo processo de desativação patrimonial permanente.
                  </p>
                  <p>
                    O bem foi devidamente conferido por número de tombamento individualizado e encaminhado para o local de destinação/armazenamento final especificado neste documento, ficando proibida sua reutilização ou movimentação interna sem prévia abertura de processo administrativo de reversão.
                  </p>
                </div>

                <div className="mt-6 pt-4 font-sans">
                  <div className="grid grid-cols-2 gap-8 text-center text-xs">
                    <div className="space-y-1">
                      <div className="border-t border-slate-400 w-full mx-auto pt-2"></div>
                      <p className="font-bold text-slate-700">Técnico de Patrimônio</p>
                      <p className="text-[10px] text-slate-400 uppercase">Setor de Patrimônio / Matrícula</p>
                    </div>
                    <div className="space-y-1">
                      <div className="border-t border-slate-400 w-full mx-auto pt-2"></div>
                      <p className="font-bold text-slate-700">Direção / Supervisão Hospitalar</p>
                      <p className="text-[10px] text-slate-400 uppercase">Assinatura e Carimbo</p>
                    </div>
                  </div>
                </div>
              </div>

            </div>

          </div>
        )}

      </div>
    </>
  );
};

export default ModalInventario;