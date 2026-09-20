import React, { useState, useEffect } from "react";
import { RefreshCw } from "lucide-react";
import packageJson from "../../package.json";

// Importa automaticamente a versão definida no package.json
const VERSAO_ATUAL = packageJson.version;

const AvisoAtualizacao = () => {
  const [temNovaVersao, setTemNovaVersao] = useState(false);

  const verificarVersaoServidor = async () => {
    try {
      // Adiciona timestamp para desativar qualquer cache local do navegador
      const resposta = await fetch(`/version.json?t=${Date.now()}`);
      if (!resposta.ok) return;

      const dados = await resposta.json();

      if (dados.version && dados.version !== VERSAO_ATUAL) {
        setTemNovaVersao(true);
      }
    } catch (erro) {
      console.error("Erro ao verificar atualizações do sistema:", erro);
    }
  };

  useEffect(() => {
    // Checa assim que abre o app
    verificarVersaoServidor();

    // Checa a cada 60 segundos
    const intervalo = setInterval(verificarVersaoServidor, 60000);

    // Checa também quando o usuário volta para a aba do navegador
    const handleFocus = () => verificarVersaoServidor();
    window.addEventListener("focus", handleFocus);

    return () => {
      clearInterval(intervalo);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  const handleAtualizarAgora = () => {
    // Recarrega a página limpando o cache
    window.location.reload(true);
  };

  if (!temNovaVersao) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-4 animate-bounce">
      <div>
        <p className="font-bold text-sm">nova versão disponível! 🎉</p>
        <p className="text-xs text-slate-300">
          o sistema foi atualizado no servidor.
        </p>
      </div>
      <button
        onClick={handleAtualizarAgora}
        className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer transition-colors shadow-md"
      >
        <RefreshCw size={14} /> atualizar agora
      </button>
    </div>
  );
};

export default AvisoAtualizacao;