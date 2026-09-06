import React, { useState } from 'react';
import { X, Check, AlertCircle, AlertTriangle, FileText, RefreshCw, Printer } from 'lucide-react';

export function ModalPatrimonio({ 
  itemParaAdicionar, 
  setItemParaAdicionar, 
  patrimonioInput, 
  setPatrimonioInput, 
  qtdInput, 
  setQtdInput, 
  adicionarAoLote 
}) {
  if (!itemParaAdicionar) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 print:hidden">
      <div className="bg-white rounded-[32px] p-6 max-w-md w-full shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-black text-slate-800 uppercase text-sm">configurar patrimônio</h3>
          <button onClick={() => setItemParaAdicionar(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={adicionarAoLote} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">tag patrimônio final</label>
              {String(itemParaAdicionar.patrimonio || "").toLowerCase() === "s/p" || String(itemParaAdicionar.patrimonio || "").toLowerCase() === "sp" ? (
                <input
                  type="text"
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                  value={patrimonioInput}
                  onChange={(e) => setPatrimonioInput(e.target.value)}
                  required
                  placeholder="insira a tag"
                />
              ) : (
                <input
                  type="text"
                  disabled
                  className="w-full bg-slate-100 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-500 cursor-not-allowed"
                  value={itemParaAdicionar.patrimonio || ""}
                />
              )}
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">qtd</label>
              <input
                type="number"
                min="1"
                max={itemParaAdicionar.quantidade || 1}
                className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-bold outline-none"
                value={qtdInput}
                onChange={(e) => setQtdInput(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => setItemParaAdicionar(null)}
              className="flex-1 bg-slate-100 text-slate-600 font-bold py-2.5 rounded-xl text-xs cursor-pointer"
            >
              cancelar
            </button>
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white font-bold py-2.5 rounded-xl text-xs hover:bg-blue-700 shadow-md cursor-pointer"
            >
              confirmar no lote
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function ModalPreviewTermo({ 
  mostrarPreview, 
  setMostrarPreview, 
  efetivarTransferenciaESalvar, 
  processando, 
  dadosSaida, 
  isEstoque, 
  naoSabeResponsavel, 
  loteSaida 
}) {
  if (!mostrarPreview) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex justify-center z-50 p-0 md:p-4 overflow-y-auto print:overflow-visible items-start print:static print:bg-white print:p-0 print:shadow-none">
      <div className="w-full max-w-[840px] flex flex-col my-0 md:my-4 print:my-0 print:max-w-full">
        <div className="sticky top-0 z-50 flex flex-col sm:flex-row justify-between items-center bg-slate-900 text-white p-4 rounded-b-xl md:rounded-t-3xl border-b border-slate-800 font-sans print:hidden gap-3 shadow-lg">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
            <AlertTriangle size={16} className="shrink-0" /> modo de conferência prévia (pendente)
          </div>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={() => window.print()}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
            >
              <Printer size={14} />
              imprimir termo
            </button>
            <button
              onClick={() => setMostrarPreview(false)}
              className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              voltar e editar
            </button>
            <button
              onClick={efetivarTransferenciaESalvar}
              disabled={processando}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              {processando ? <RefreshCw className="animate-spin" size={14} /> : <FileText size={14} />}
              salvar como pendente
            </button>
          </div>
        </div>

        <div className="bg-white w-full min-h-[1050px] print:min-h-0 print:h-auto shadow-2xl p-6 md:p-12 flex flex-col justify-between font-serif text-slate-900 rounded-b-3xl print:rounded-none print:shadow-none print:p-0 print:overflow-visible">
          <div>
            <div className="flex items-center justify-between gap-2 mb-6 pb-4 border-b border-slate-200 w-full">
              <img src="/Imagem1.png" alt="Logo 1" className="h-12 w-auto max-w-[22%] object-contain" />
              <img src="/Imagem2.png" alt="Logo 2" className="h-12 w-auto max-w-[22%] object-contain" />
              <img src="/Imagem3.png" alt="Logo 3" className="h-12 w-auto max-w-[22%] object-contain" />
              <img src="/Imagem4.png" alt="Logo 4" className="h-12 w-auto max-w-[22%] object-contain" />
            </div>

            <div className="text-center space-y-2 border-b-2 border-slate-800 pb-6 mb-8 font-sans">
              <h2 className="text-xl font-black uppercase tracking-wide">termo de transferência e responsabilidade patrimonial</h2>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">controle de distribuição de insumos e ativos</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-4 text-sm mb-8 font-sans border border-slate-200 p-4 rounded-xl bg-slate-50/50">
              <div><strong>unidade de origem:</strong> <span>almoxarifado central / patrimônio</span></div>
              <div><strong>unidade de destino:</strong> <span>{dadosSaida?.novaUnidade || ''}</span></div>
              <div><strong>{isEstoque ? "classificação no estoque:" : "setor de destino:"}</strong> <span>{dadosSaida?.novoSetor || ''}</span></div>
              <div><strong>data de emissão:</strong> {new Date().toLocaleDateString("pt-BR")}</div>
              <div className="sm:col-span-2 border-t border-dashed border-slate-200 pt-2 text-slate-700">
                <strong>motivo do fornecimento:</strong> <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-bold text-xs font-sans">{dadosSaida?.motivo || ''}</span>
              </div>
              <div className="sm:col-span-2 border-t border-slate-200 pt-2">
                <strong>responsável pelo recebimento:</strong> <span>{naoSabeResponsavel ? "a definir na confirmação da entrega" : (dadosSaida?.responsavelRecebimento || '')}</span>
              </div>
            </div>

            <div className="text-sm leading-relaxed text-justify mb-8 space-y-4">
              <p>
                declaramos para os devidos fins de controle técnico e administrativo que os itens listados abaixo foram selecionados para transferência da central de estoque para o respectivo setor de destino indicado neste documento.
              </p>
            </div>

            <table className="w-full text-left border-collapse border border-slate-300 text-xs font-sans">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 font-bold text-slate-800 uppercase">
                  <th className="p-3 border border-slate-300">item / equipamento</th>
                  <th className="p-3 border border-slate-300 text-center">nº patrimônio (tag)</th>
                  <th className="p-3 border border-slate-300 text-center">estado</th>
                  <th className="p-3 border border-slate-300 text-center">qtd.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {(loteSaida || []).map((item, index) => (
                  <tr key={index}>
                    <td className="p-3 border border-slate-300 font-medium">{item.nome || item.nomeEquipamento || ""}</td>
                    <td className="p-3 border border-slate-300 font-mono text-center">{item.patrimonioMapeado || item.patrimonio || ""}</td>
                    <td className="p-3 border border-slate-300 text-center">{item.estado || item.conservacao || "bom"}</td>
                    <td className="p-3 border border-slate-300 text-center font-bold">{item.quantidadeMovimentada || item.quantidadeRetirada || 1}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-20 pt-12 font-sans">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-12 text-center text-xs">
              <div className="space-y-1">
                <div className="border-t border-slate-400 w-full mx-auto pt-2"></div>
                <p className="font-bold text-slate-700">responsável pelo envio</p>
                <p className="text-[10px] text-slate-400 uppercase">setor de patrimônio / estoque</p>
              </div>
              <div className="space-y-1">
                <div className="border-t border-slate-400 w-full mx-auto pt-2"></div>
                <p className="font-bold text-slate-700">
                  {naoSabeResponsavel ? "a definir" : (dadosSaida?.responsavelRecebimento || '')}
                </p>
                <p className="text-[10px] text-slate-400 uppercase">
                  {naoSabeResponsavel ? "recebedor (pendente de confirmação)" : "assinatura e carimbo"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ModalConfirmarSaidaPendente({
  pendenteSelecionado,
  setPendenteSelecionado,
  aoConfirmarBaixa,
  setToast
}) {
  const [responsavelInput, setResponsavelInput] = useState("");

  if (!pendenteSelecionado) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (setToast) {
      setToast({ mensagem: "Baixa definitiva realizada com sucesso!", tipo: "sucesso" });
    }

    // A conversão para minúsculas é feita estritamente ao disparar a confirmação/salvamento no banco
    const valorParaSalvar = responsavelInput.trim().toLowerCase();
    aoConfirmarBaixa(pendenteSelecionado.id, valorParaSalvar);
    setPendenteSelecionado(null);
    setResponsavelInput("");
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 print:hidden">
      <div className="bg-white rounded-[32px] p-6 max-w-md w-full shadow-2xl space-y-4 font-sans">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-800">
            <AlertCircle size={20} className="text-blue-600 shrink-0" />
            <h3 className="font-black uppercase text-sm">confirmar baixa definitiva</h3>
          </div>
          <button 
            onClick={() => setPendenteSelecionado(null)} 
            className="text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed">
          digite o nome do responsável pelo recebimento ou deixe em branco para prosseguir sem definição inicial.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">
              responsável pelo setor (opcional)
            </label>
            <input
              type="text"
              className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none text-slate-700"
              value={responsavelInput}
              onChange={(e) => setResponsavelInput(e.target.value)} // Permite digitar letras maiúsculas livremente na tela
              placeholder="deixe em branco se preferir"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => setPendenteSelecionado(null)}
              className="flex-1 bg-slate-100 text-slate-600 font-bold py-2.5 rounded-xl text-xs cursor-pointer hover:bg-slate-200 transition-all"
            >
              cancelar
            </button>
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white font-bold py-2.5 rounded-xl text-xs hover:bg-blue-700 shadow-md cursor-pointer transition-all flex items-center justify-center gap-1.5"
            >
              <Check size={14} />
              confirmar baixa
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}