import React, { useState, useEffect, useRef } from "react";
import { RefreshCw } from "lucide-react";

const AvisoAtualizacao = () => {
  const [temNovaVersao, setTemNovaVersao] = useState(false);
  
  // Armazena a versão inicial entregue pelo servidor quando o app carregou
  const versaoInicialRef = useRef(null);

  const verificarVersaoServidor = async () => {
    try {
      // Usa a origem absoluta para garantir que vá direto à raiz do domínio na Vercel
      const urlVersion = `${window.location.origin}/version.json?t=${Date.now()}`;

      // Busca a versão no servidor forçando a ignorar qualquer cache de proxy/navegador
      const resposta = await fetch(urlVersion, {
        method: "GET",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Pragma": "no-cache",
          "Expires": "0"
        },
        cache: "no-store",
      });

      if (!resposta.ok) {
        console.warn("Não foi possível carregar o version.json. Status:", resposta.status);
        return;
      }

      const dados = await resposta.json();
      const versaoServidor = dados.version;

      if (!versaoServidor) return;

      // Na primeira checagem, grava a versão atual em execução
      if (!versaoInicialRef.current) {
        versaoInicialRef.current = versaoServidor;
        console.log("Versão inicial registrada no app:", versaoServidor);
        return;
      }

      // Se a versão do servidor for diferente da versão gravada na inicialização do app
      if (versaoServidor !== versaoInicialRef.current) {
        console.log(`Nova versão detectada! Servidor: ${versaoServidor} | Inicial: ${versaoInicialRef.current}`);
        setTemNovaVersao(true);
      }
    } catch (erro) {
      console.error("Erro ao verificar atualizações do sistema:", erro);
    }
  };

  useEffect(() => {
    verificarVersaoServidor();

    // Checa por atualizações a cada 60 segundos
    const intervalo = setInterval(verificarVersaoServidor, 60000);

    // Checa quando o usuário retorna para a aba do navegador
    const handleFocus = () => verificarVersaoServidor();
    window.addEventListener("focus", handleFocus);

    return () => {
      clearInterval(intervalo);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  const handleAtualizarAgora = () => {
    // Oculta o aviso na hora para evitar travamento na tela
    setTemNovaVersao(false);
    
    // Recarrega a página limpando qualquer resquício de cache do navegador
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