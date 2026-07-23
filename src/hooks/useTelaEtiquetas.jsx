import { useState, useEffect } from "react";
import { auth } from "../services/firebase";
import { toast } from "react-toastify";

const API_URL = "http://IP_DA_SUA_VPS:3000/api";

export const useTelaEtiquetas = () => {
  const [loading, setLoading] = useState(false);
  const [proximoPatrimonio, setProximoPatrimonio] = useState("");
  
  // true = Apenas Etiqueta Avulsa, false = Cadastro Completo
  const [isAvulsa, setIsAvulsa] = useState(false);
  
  // Estados do formulário
  const [nome, setNome] = useState("");
  const [unidade, setUnidade] = useState("Hospital Conde");
  const [setor, setSetor] = useState("");
  const [estado, setEstado] = useState("regular");
  const [observacoes, setObservacoes] = useState("");

  // Estados para a inteligência do Setor
  const [modoEdicaoSetor, setModoEdicaoSetor] = useState(false);
  const [etiquetaPronta, setEtiquetaPronta] = useState(null);

  // 1. BUSCA O MAIOR NÚMERO ABSOLUTO VIA API
  const buscarUltimoPatrimonioGeral = async () => {
    try {
      const currentUser = auth.currentUser;
      const token = currentUser ? await currentUser.getIdToken() : "";

      const headers = { Authorization: `Bearer ${token}` };

      const [resAtivos, resEtiquetas] = await Promise.all([
        fetch(`${API_URL}/ativos`, { headers }),
        fetch(`${API_URL}/etiquetas_patrimonio`, { headers })
      ]);

      let dadosAtivos = resAtivos.ok ? await resAtivos.json() : [];
      let dadosEtiquetas = resEtiquetas.ok ? await resEtiquetas.json() : [];

      let maiorNumero = 0;
      
      [...dadosAtivos, ...dadosEtiquetas].forEach((item) => {
        const patStr = item.patrimonio;
        if (patStr && patStr !== "s/p") {
          const num = parseInt(patStr.replace(/\D/g, ""), 10);
          if (!isNaN(num) && num > maiorNumero) maiorNumero = num;
        }
      });

      const proximo = maiorNumero > 0 ? maiorNumero + 1 : 10001;
      setProximoPatrimonio(String(proximo));
    } catch (error) {
      console.error("Erro ao buscar sequencial unificado:", error);
      setProximoPatrimonio("10001");
    }
  };

  useEffect(() => {
    buscarUltimoPatrimonioGeral();
  }, []);

  // Função para mudar unidade e resetar setor
  const handleMudarUnidade = (novaUnidade) => {
    setUnidade(novaUnidade);
    setSetor("");
    setModoEdicaoSetor(false);
  };

  // 2. SALVA O ATIVO VIA API
  const handleCriarAtivoEEtiqueta = async (e) => {
    e.preventDefault();
    if (!nome.trim()) return toast.error("Por favor, digite o nome do equipamento.");
    if (!proximoPatrimonio) return toast.error("Erro ao gerar número de patrimônio.");

    setLoading(true);

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("Usuário não autenticado");
      const token = await currentUser.getIdToken();
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      };

      const [resAtivosCheck, resEtiquetasCheck] = await Promise.all([
        fetch(`${API_URL}/ativos`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/etiquetas_patrimonio`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      const listaAtivos = resAtivosCheck.ok ? await resAtivosCheck.json() : [];
      const listaEtiquetas = resEtiquetasCheck.ok ? await resEtiquetasCheck.json() : [];

      const existe = [...listaAtivos, ...listaEtiquetas].some(
        item => String(item.patrimonio).trim() === String(proximoPatrimonio).trim()
      );

      if (existe) {
        toast.warn("Esse número acabou de ser ocupado. Atualizando...");
        await buscarUltimoPatrimonioGeral();
        setLoading(false);
        return;
      }

      const novoRegistro = {
        criadoEm: new Date().toISOString(),
        estado: estado.toLowerCase().trim(),
        nome: nome.toLowerCase().trim(),
        observacoes: observacoes.toLowerCase().trim() || (isAvulsa ? "etiqueta avulsa gerada" : ""),
        patrimonio: String(proximoPatrimonio).trim(),
        quantidade: 1,
        setor: setor.toLowerCase().trim() || "nao informado",
        status: "ativo",
        tipo: "equipamento",
        unidade: unidade.toLowerCase().trim(),
        modoEmissao: isAvulsa ? "avulsa" : "cadastro_completo"
      };

      if (isAvulsa) {
        await fetch(`${API_URL}/etiquetas_patrimonio`, {
          method: "POST",
          headers,
          body: JSON.stringify(novoRegistro)
        });
        toast.success(`Etiqueta Avulsa #${proximoPatrimonio} criada!`);
      } else {
        await Promise.all([
          fetch(`${API_URL}/ativos`, {
            method: "POST",
            headers,
            body: JSON.stringify(novoRegistro)
          }),
          fetch(`${API_URL}/etiquetas_patrimonio`, {
            method: "POST",
            headers,
            body: JSON.stringify(novoRegistro)
          })
        ]);
        toast.success(`Patrimônio #${proximoPatrimonio} cadastrado!`);
      }
      
      setEtiquetaPronta({
        patrimonio: proximoPatrimonio,
        nome: nome.toUpperCase(),
        unidade: unidade.toUpperCase()
      });

      setNome("");
      setSetor("");
      setObservacoes("");
      buscarUltimoPatrimonioGeral();
    } catch (error) {
      console.error("Erro ao salvar:", error);
      toast.error("Erro ao registrar o patrimônio.");
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    proximoPatrimonio,
    isAvulsa,
    setIsAvulsa,
    nome,
    setNome,
    unidade,
    setUnidade: handleMudarUnidade, // Use este no onChange do select de unidade
    setSetor,
    setor,
    estado,
    setEstado,
    observacoes,
    setObservacoes,
    etiquetaPronta,
    setEtiquetaPronta,
    handleCriarAtivoEEtiqueta,
    dispararImpressao: () => window.print(),
    buscarUltimoPatrimonioGeral,
    modoEdicaoSetor,
    setModoEdicaoSetor
  };
};