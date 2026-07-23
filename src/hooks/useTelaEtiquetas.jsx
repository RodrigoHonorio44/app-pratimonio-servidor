import { useState, useEffect } from "react";
import { auth } from "../services/firebase";
import api from "../services/api"; // Importa a instância centralizada do axios
import { toast } from "react-toastify";

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

  // 1. BUSCA O MAIOR NÚMERO ABSOLUTO VIA API COM TETO DE SEGURANÇA
  const buscarUltimoPatrimonioGeral = async () => {
    try {
      const [resAtivos, resEtiquetas] = await Promise.all([
        api.get(`/ativos`).catch(() => ({ data: [] })),
        api.get(`/etiquetas_patrimonio`).catch(() => ({ data: [] }))
      ]);

      let dadosAtivos = Array.isArray(resAtivos.data) ? resAtivos.data : [];
      let dadosEtiquetas = Array.isArray(resEtiquetas.data) ? resEtiquetas.data : [];

      let maiorNumero = 0;
      
      [...dadosAtivos, ...dadosEtiquetas].forEach((item) => {
        const patStr = item.patrimonio;
        if (patStr && patStr !== "s/p") {
          const num = parseInt(String(patStr).replace(/\D/g, ""), 10);
          // Ignora números altos ou testes acima de 50000 para fixar na faixa correta
          if (!isNaN(num) && num > maiorNumero && num < 50000) {
            maiorNumero = num;
          }
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

      const [resAtivosCheck, resEtiquetasCheck] = await Promise.all([
        api.get(`/ativos`).catch(() => ({ data: [] })),
        api.get(`/etiquetas_patrimonio`).catch(() => ({ data: [] }))
      ]);

      const listaAtivos = Array.isArray(resAtivosCheck.data) ? resAtivosCheck.data : [];
      const listaEtiquetas = Array.isArray(resEtiquetasCheck.data) ? resEtiquetasCheck.data : [];

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
        await api.post(`/etiquetas_patrimonio`, novoRegistro);
        toast.success(`Etiqueta Avulsa #${proximoPatrimonio} criada!`);
      } else {
        await Promise.all([
          api.post(`/ativos`, novoRegistro),
          api.post(`/etiquetas_patrimonio`, novoRegistro)
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
      toast.error(error.response?.data?.message || "Erro ao registrar o patrimônio.");
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
    setUnidade: handleMudarUnidade,
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