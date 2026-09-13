import React, { useState, useEffect } from "react";
import { Printer, Trash2, X } from "lucide-react";

export default function GestaoVistorias() {
  // ---------------------------------------------------------------------------
  // ESTADOS PRINCIPAIS
  // ---------------------------------------------------------------------------
  const [modalVistoriasDiaAberto, setModalVistoriasDiaAberto] = useState(true);

  // Lista de vistorias com exemplo de dados (tudo armazenado em lowercase)
  const [vistoriasDoDiaSelected, setVistoriasDoDiaSelected] = useState([
    {
      id: "1",
      placa: "qxr3d16",
      modelo: "spin 1.8 at premier",
      motorista: "emanoel",
      condutor: "emanoel",
      tipoResponsavel: "motorista", // "motorista" ou "avaliador"
      km: "112346",
      data: "12/09/2026",
      hora: "21:00",
      obs: "para-choque dianteiro: fixação comprometida devido a presilhas quebradas, apresentando folga e risco de desprendimento. transmissão / câmbio: falha na troca de marchas (atraso nas trocas), ocasionando rotação elevada do motor (giro alto) e engasgos intermitentes durante a condução. painel de instrumentos: códigos de erro ativos exibidos no visor (35, 24 e 23). sinalização luminosa: lâmpada da luz de ré (lado esquerdo) queimada. carroçaria / lataria: vistoria da lataria impossibilitada devido ao acúmulo de sujeira na superfície do veículo.",
      detalhamentoAvarias: "• front_parachoque: [5] quebrado",
      acessorios: {
        "bagagito": "n",
        "calota": "n",
        "chave de roda": "s",
        "triângulo": "s",
        "macaco": "s",
        "farol auxiliar": "s",
        "manual": "n",
        "extintor": "n",
        "tapetes": "s",
        "chave principal": "s",
        "chave reserva": "n",
        "kit multimídia": "s"
      }
    },
    {
      id: "2",
      placa: "xyz-9876",
      modelo: "renault sandero",
      motorista: "rafaele",
      condutor: "rafaele",
      tipoResponsavel: "avaliador",
      km: "31800",
      data: "12/09/2026",
      hora: "14:15",
      obs: "veículo entregue limpo e sem avarias.",
      detalhamentoAvarias: "• nenhuma avaria crítica registrada",
      acessorios: {
        "chave de roda": "s",
        "triângulo": "s",
        "macaco": "s"
      }
    }
  ]);

  // ID da vistoria em impressão no momento
  const [idVistoriaImprimindo, setIdVistoriaImprimindo] = useState(null);

  // ---------------------------------------------------------------------------
  // HANDLERS E IMPRESSÃO
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const handleAfterPrint = () => {
      setIdVistoriaImprimindo(null);
    };
    window.addEventListener("afterprint", handleAfterPrint);
    return () => window.removeEventListener("afterprint", handleAfterPrint);
  }, []);

  const handleImprimirVistoriaDoDia = (id) => {
    setIdVistoriaImprimindo(id);

    setTimeout(() => {
      window.print();
      // Fallback para restaurar o estado da interface caso o afterprint falhe no navegador
      setTimeout(() => {
        setIdVistoriaImprimindo(null);
      }, 500);
    }, 300);
  };

  const handleExcluir = (item) => {
    setVistoriasDoDiaSelected((prev) => prev.filter((v) => v.id !== item.id));
  };

  return (
    <div className="min-h-screen bg-slate-100 p-6">

      {/* ----------------------------------------------------------------------- */}
      {/* MODAL: VISTORIAS DO DIA                                                 */}
      {/* ----------------------------------------------------------------------- */}
      {modalVistoriasDiaAberto && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:hidden">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl max-h-[85vh] flex flex-col">
            
            {/* Cabeçalho do Modal */}
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 mb-4">
              <h2 className="text-base font-black text-slate-800 lowercase flex items-center gap-2">
                <span className="text-blue-600">📄</span> vistorias do dia ({vistoriasDoDiaSelected.length})
              </h2>
              <button
                onClick={() => setModalVistoriasDiaAberto(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Lista de Vistorias */}
            <div className="overflow-y-auto flex-1 space-y-4 pr-1">
              {vistoriasDoDiaSelected.map((item, index) => (
                <div
                  key={item.id || index}
                  className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-5 relative"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-sm font-black text-blue-900 lowercase">
                        {item.modelo} - placa: {item.placa?.toLowerCase()}
                      </h3>
                      <p className="text-xs font-bold text-slate-500 lowercase">
                        motorista: {item.condutor || item.motorista || 'não informado'} | km: {item.km}
                      </p>
                    </div>
                    <span className="text-[10px] font-black text-blue-600 bg-blue-100 px-2 py-0.5 rounded-md">
                      #{index + 1}
                    </span>
                  </div>

                  {item.obs && (
                    <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-3 mb-4">
                      <p className="text-xs font-bold text-amber-900 leading-relaxed lowercase">
                        <strong>observações:</strong> {item.obs?.toLowerCase()}
                      </p>
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-200/60">
                    <button
                      onClick={() => handleExcluir(item)}
                      className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl transition-all cursor-pointer"
                    >
                      <Trash2 size={14} /> Excluir
                    </button>
                    <button
                      onClick={() => handleImprimirVistoriaDoDia(item.id)}
                      className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-black text-xs rounded-xl transition-all cursor-pointer shadow-md"
                    >
                      <Printer size={14} /> Imprimir
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-100 mt-2 text-right">
              <button
                onClick={() => setModalVistoriasDiaAberto(false)}
                className="px-5 py-2 bg-slate-100 text-slate-600 font-bold text-xs rounded-xl hover:bg-slate-200 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------------------- */}
      {/* IMPRESSÃO A4 OFICIAL                                                    */}
      {/* ----------------------------------------------------------------------- */}
      {vistoriasDoDiaSelected.map((item) => {
        const estaImprimindoEste = idVistoriaImprimindo === item.id;

        const eAvaliador = item.tipoResponsavel === "avaliador" || item.tipo_responsavel === "avaliador";
        const nomeResponsavel = item.condutor || item.motorista || "responsável";

        return (
          <div
            key={`print-${item.id}`}
            id={`secao-laudo-${item.id}`}
            className={`bg-white w-full max-w-[800px] mx-auto p-3 font-sans text-slate-900 ${
              estaImprimindoEste ? "bloco-ativo-impressao" : "hidden"
            }`}
          >
            {/* CABEÇALHO */}
            <div className="flex items-center justify-between border-b pb-1.5 mb-1.5">
              <img src="/Imagem1.png" alt="Hospital Conde Modesto Leal" className="h-8 object-contain" />
              <img src="/Imagem2.png" alt="Avante Social" className="h-8 object-contain" />
              <img src="/Imagem3.png" alt="Secretaria de Saúde" className="h-8 object-contain" />
              <img src="/Imagem4.png" alt="Prefeitura de Maricá" className="h-8 object-contain" />
            </div>

            {/* TÍTULO */}
            <div className="text-center mb-2">
              <h1 className="text-xs font-black lowercase tracking-wider">
                checklist veicular e relatório de frota
              </h1>
              <p className="text-[8px] font-bold text-slate-600 lowercase">
                data e hora da inspeção: {item.data} às {item.hora || "00:00"} • rodhon system
              </p>
            </div>

            {/* 1. IDENTIFICAÇÃO DO VEÍCULO E CONDUTOR */}
            <div className="border border-slate-900 rounded mb-1.5 text-[8.5px]">
              <div className="bg-slate-100 font-black px-2 py-0.5 border-b border-slate-900 lowercase">
                1. identificação do veículo e condutor
              </div>
              <div className="grid grid-cols-4 gap-1 p-1.5 lowercase">
                <div><span className="font-bold">placa:</span> <br /> <strong>{item.placa}</strong></div>
                <div><span className="font-bold">modelo:</span> <br /> <strong>{item.modelo}</strong></div>
                <div><span className="font-bold">ano:</span> <br /> <strong>{item.ano || "2019/2020"}</strong></div>
                <div><span className="font-bold">cor:</span> <br /> <strong>{item.cor || "azul"}</strong></div>
                <div><span className="font-bold">condutor:</span> <br /> <strong>{item.condutor || item.motorista}</strong></div>
                <div><span className="font-bold">km atual:</span> <br /> <strong>{item.km}</strong></div>
                <div><span className="font-bold">combustível:</span> <br /> <strong>{item.combustivel || "1/2"}</strong></div>
                <div><span className="font-bold">crlv / exercício:</span> <br /> <strong>{item.crlv || "sim (2026)"}</strong></div>
              </div>
            </div>

            {/* 2. MAPEAMENTO DE AVARIAS E ESTADO GERAL */}
            <div className="border border-slate-900 rounded mb-1.5 text-[8.5px]">
              <div className="bg-slate-100 font-black px-2 py-0.5 border-b border-slate-900 lowercase">
                2. mapeamento de avarias e estado geral
              </div>
              <div className="p-1.5">
                <div className="flex justify-between mb-1 lowercase text-[7.5px] font-bold">
                  <span>pneu dianteiro: <strong>{item.pneuDianteiro || "b"}</strong></span>
                  <span>pneu traseiro: <strong>{item.pneuTraseiro || "b"}</strong></span>
                  <span>pneu estepe: <strong>{item.pneuEstepe || "b"}</strong></span>
                </div>

                <div className="text-center my-1">
                  <img src="/diagrama-carro-avarias.png" alt="Mapeamento de Avarias" className="max-h-36 mx-auto object-contain" />
                </div>

                <div className="border-t pt-1 mt-1">
                  <span className="font-black text-[7.5px] lowercase block mb-0.5">detalhamento das avarias mapeadas:</span>
                  <p className="text-[7.5px] text-rose-700 font-bold lowercase">
                    {item.detalhamentoAvarias || "• nenhuma avaria crítica registrada"}
                  </p>
                </div>
              </div>
            </div>

            {/* 3. ACESSÓRIOS E EQUIPAMENTOS */}
            <div className="border border-slate-900 rounded mb-1.5 text-[7.5px]">
              <div className="bg-slate-100 font-black px-2 py-0.5 border-b border-slate-900 lowercase text-[8.5px]">
                3. acessórios e equipamentos [ (s) sim | (n) não | (a) avariado ]
              </div>
              <div className="grid grid-cols-3 gap-x-3 p-1.5 lowercase">
                {Object.entries(item.acessorios || {}).map(([acessorio, status]) => (
                  <div key={acessorio} className="flex justify-between border-b border-slate-200 py-0.5">
                    <span>{acessorio}</span>
                    <strong className="font-black">{status}</strong>
                  </div>
                ))}
              </div>
            </div>

            {/* 4. OBSERVAÇÕES E AVARIAS IDENTIFICADAS */}
            <div className="border border-slate-900 rounded mb-4 text-[7.5px] p-1.5">
              <span className="font-black lowercase block mb-0.5">4. observações e avarias identificadas</span>
              <p className="font-bold text-slate-800 lowercase leading-tight">
                {item.obs?.toLowerCase() || "nenhuma observação registrada."}
              </p>
            </div>

            {/* BLOCO DE ASSINATURAS */}
            <div className="grid grid-cols-2 gap-12 text-center pt-8 text-[8.5px] lowercase">
              {/* ESQUERDA: MOTORISTA OU AVALIADOR */}
              <div>
                <div className="border-t border-slate-900 pt-1 font-black">
                  {eAvaliador ? "assinatura do avaliador" : "assinatura do motorista"}
                </div>
                <span className="text-[6.5px] text-slate-500 block font-bold mt-0.5">
                  {nomeResponsavel.toLowerCase()} ({eAvaliador ? "avaliador / vistoriador" : "motorista responsável"})
                </span>
              </div>

              {/* DIREITA: COORDENAÇÃO DE PATRIMÔNIO */}
              <div>
                <div className="border-t border-slate-900 pt-1 font-black">
                  coordenação de patrimônio
                </div>
                <span className="text-[6.5px] text-slate-500 block font-bold mt-0.5">
                  visto e recebimento
                </span>
              </div>
            </div>

          </div>
        );
      })}

      {/* REGRAS CSS DE IMPRESSÃO */}
      <style>{`
        @media screen {
          .bloco-ativo-impressao {
            display: block;
          }
        }

        @media print {
          @page {
            size: A4 portrait;
            margin: 5mm;
          }
          body {
            background: #ffffff !important;
            color: #000000 !important;
          }
          body * {
            visibility: hidden !important;
          }
          .bloco-ativo-impressao, 
          .bloco-ativo-impressao * {
            visibility: visible !important;
          }
          .bloco-ativo-impressao {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            display: block !important;
          }
        }
      `}</style>
    </div>
  );
}