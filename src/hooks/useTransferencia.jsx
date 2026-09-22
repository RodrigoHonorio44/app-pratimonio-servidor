import { useState, useEffect, useRef } from "react";
import { auth } from "../services/firebase";
import api from "../services/api";
import { toast } from "react-toastify";
import { abrirVisualizacaoTermo } from "../components/ImpressaoTransferencia";
import { useSetores } from "../components/constants/setores"; // Hook integrado do MongoDB

export const useTransferencia = () => {
  const [patrimonioBusca, setPatrimonioBusca] = useState("");
  const [nomeBusca, setNomeBusca] = useState("");
  const [setorBusca, setSetorBusca] = useState("");
  const [unidadeFiltro, setUnidadeFiltro] = useState("");
  const [itensEncontrados, setItensEncontrados] = useState([]);
  const [itemSelecionado, setItemSelecionado] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [novoPatrimonioParaSP, setNovoPatrimonioParaSP] = useState("");

  const [mostrarDropdown, setMostrarDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const [termoVisualizado, setTermoVisualizado] = useState(false);
  const [dadosParaImpressaoRetirada, setDadosParaImpressaoRetirada] = useState(null);

  const [paginaAtual, setPaginaAtual] = useState(1);
  const itensPorPagina = 12;

  // Consome os setores e unidades dinâmicos do MongoDB
  const { mapaSetores, loading: loadingSetores } = useSetores();

  const [dadosSaida, setDadosSaida] = useState({
    novaUnidade: "",
    novoSetor: "",
    motivo: "transferência",
    responsavelRecebimento: "",
    pacienteEndereco: "",
    pacienteTelefone: "",
    pacienteIdentidade: "",
    pacienteCpf: "",
    quantidadeRetirada: 1,
  });

  // Monta dinamicamente a lista de unidades combinando os dados do MongoDB com unidades especiais
  const unidadesDinamicas = Object.keys(mapaSetores || {});
  const unidadesEspeciais = ["Estoque Patrimônio", "Residência do Paciente"];
  
  // Lista final consolidada sem duplicidades
  const unidades = Array.from(new Set([...unidadesEspeciais, ...unidadesDinamicas]));

  const normalizarParaComparacao = (texto) => {
    if (!texto) return "";
    return texto
      .toString()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[/\s._-]/g, "")
      .trim();
  };

  useEffect(() => {
    const clicarFora = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setMostrarDropdown(false);
      }
    };
    document.addEventListener("mousedown", clicarFora);
    return () => document.removeEventListener("mousedown", clicarFora);
  }, []);

  const limparBusca = () => {
    setPatrimonioBusca("");
    setNomeBusca("");
    setSetorBusca("");
    setUnidadeFiltro("");
    setItensEncontrados([]);
    setPaginaAtual(1);
    toast.info("Busca resetada");
  };

  const obterSetoresFiltrados = () => {
    if (!unidadeFiltro) return [];

    const chaveUnidade = Object.keys(mapaSetores || {}).find(
      (key) => normalizarParaComparacao(key) === normalizarParaComparacao(unidadeFiltro)
    );

    const setoresDaUnidade = chaveUnidade ? mapaSetores[chaveUnidade] : [];
    
    if (!setorBusca.trim()) return setoresDaUnidade;

    const buscaNorm = normalizarParaComparacao(setorBusca);
    return setoresDaUnidade.filter((setor) =>
      normalizarParaComparacao(setor).includes(buscaNorm)
    );
  };

  const ejecutarBusca = async (tipo, valorForcadoSetor = null) => {
    let termoOriginal = "";
    if (tipo === "patrimonio") termoOriginal = patrimonioBusca;
    else if (tipo === "setor") termoOriginal = valorForcadoSetor || setorBusca;
    else termoOriginal = nomeBusca;

    if (!termoOriginal.trim() && !unidadeFiltro && tipo !== "setor") {
      toast.warn("Por favor, selecione um filtro ou preencha um campo de busca.");
      return;
    }

    setLoading(true);
    setMostrarDropdown(false);
    try {
      const unidadeFiltroNorm = normalizarParaComparacao(unidadeFiltro);
      const ehOrigemResidencial = unidadeFiltroNorm.includes("residencia") || unidadeFiltroNorm.includes("paciente");

      let listaGeral = [];

      if (tipo === "patrimonio" && termoOriginal.trim() !== "") {
        const termoBuscaExato = termoOriginal.trim();
        
        const [resAtivos, resEstoque, resPac] = await Promise.all([
          api.get(`/ativos`, { params: { patrimonio: termoBuscaExato } }).catch(() => ({ data: [] })),
          api.get(`/estoque`, { params: { patrimonio: termoBuscaExato } }).catch(() => ({ data: [] })),
          api.get(`/equipamento_com_paciente`, { params: { patrimonio: termoBuscaExato } }).catch(() => ({ data: [] }))
        ]);

        const dadosAtivos = Array.isArray(resAtivos.data) ? resAtivos.data : [];
        const dadosEstoque = Array.isArray(resEstoque.data) ? resEstoque.data : [];
        const dadosPac = Array.isArray(resPac.data) ? resPac.data : [];

        if (dadosAtivos.length > 0) {
          listaGeral = dadosAtivos.map((item) => ({
            ...item,
            id: item._id || item.id,
            _colecaoOrigem: "ativos",
          }));
        } else if (dadosEstoque.length > 0) {
          listaGeral = dadosEstoque.map((item) => ({
            ...item,
            id: item._id || item.id,
            _colecaoOrigem: "estoque",
          }));
        } else if (dadosPac.length > 0) {
          listaGeral = dadosPac.map((item) => {
            return {
              id: item.equipamentoId || item._id || item.id,
              _docPacienteId: item._id || item.id,
              nome: item.equipamentoNome || item.nome,
              patrimonio: item.patrimonio,
              unidade: "Residência do Paciente",
              setor: item.paciente?.nome ? `Residência do Paciente - ${item.paciente.nome}` : "Residência",
              status: "em_uso_residencial",
              _colecaoOrigem: "ativos",
            };
          });
        }
      } else {
        if (ehOrigemResidencial) {
          const resPacientes = await api.get(`/equipamento_com_paciente`).catch(() => ({ data: [] }));
          const dadosPacientes = Array.isArray(resPacientes.data) ? resPacientes.data : [];
          listaGeral = dadosPacientes.map((item) => {
            return {
              id: item.equipamentoId || item._id || item.id,
              _docPacienteId: item._id || item.id,
              nome: item.equipamentoNome || item.nome,
              patrimonio: item.patrimonio,
              unidade: "Residência do Paciente",
              setor: item.paciente?.nome ? `Residência do Paciente - ${item.paciente.nome}` : "Residência",
              status: "em_uso_residencial",
              _colecaoOrigem: "ativos",
            };
          });
        } else if (unidadeFiltroNorm.includes("estoque")) {
          const resEstoque = await api.get(`/estoque`).catch(() => ({ data: [] }));
          const dadosEstoque = Array.isArray(resEstoque.data) ? resEstoque.data : [];
          listaGeral = dadosEstoque.map((item) => ({
            ...item,
            id: item._id || item.id,
            _colecaoOrigem: "estoque",
          }));
        } else {
          const resGeral = await api.get(`/ativos`).catch(() => ({ data: [] }));
          const dadosGeral = Array.isArray(resGeral.data) ? resGeral.data : [];
          listaGeral = dadosGeral.map((item) => ({
            ...item,
            id: item._id || item.id,
            _colecaoOrigem: "ativos",
          }));
        }
      }

      const termoNorm = normalizarParaComparacao(termoOriginal);
      const setorBuscaNorm = normalizarParaComparacao(setorBusca);

      const filtrados = listaGeral.filter((item) => {
        const statusItemNorm = String(item.status || "ativo").toLowerCase().trim();
        if (
          statusItemNorm !== "ativo" && 
          statusItemNorm !== "em_uso_residencial" && 
          statusItemNorm !== "operante" &&
          statusItemNorm !== "movimentado"
        ) {
          return false;
        }

        const itemUnidadeNorm = normalizarParaComparacao(item.unidade || "");
        const itemPatrimonioNorm = normalizarParaComparacao(item.patrimonio || "");
        const itemNomeNorm = normalizarParaComparacao(item.nome || "");
        const itemSetorNorm = normalizarParaComparacao(item.setor || "");

        if (tipo === "patrimonio" && termoNorm !== "") {
          return itemPatrimonioNorm.includes(termoNorm);
        }

        const matchUnidade = !unidadeFiltro || ehOrigemResidencial || itemUnidadeNorm.includes(unidadeFiltroNorm);
        if (!matchUnidade) return false;

        if (setorBusca && setorBusca.trim() !== "") {
          const matchSetor = itemSetorNorm === setorBuscaNorm || itemSetorNorm.includes(setorBuscaNorm);
          if (!matchSetor) return false;
        }

        if (tipo === "setor") {
          if (!termoNorm) return true;
          return itemSetorNorm.includes(termoNorm);
        } else if (tipo === "nome") {
          return itemNomeNorm.includes(termoNorm);
        }
        return true;
      });

      filtrados.sort((a, b) => {
        const setorA = (a.setor || "").toLowerCase();
        const setorB = (b.setor || "").toLowerCase();
        
        if (setorA !== setorB) {
          return setorA.localeCompare(setorB);
        }

        const nomeA = (a.nome || "").toLowerCase();
        const nomeB = (b.nome || "").toLowerCase();
        return nomeA.localeCompare(nomeB);
      });

      setItensEncontrados(filtrados);
      setPaginaAtual(1);
      
      if (filtrados.length === 0) {
        toast.error("Nenhum item encontrado com os filtros informados.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Erro na busca.");
    } finally {
      setLoading(false);
    }
  };

  const totalPaginas = Math.ceil(itensEncontrados.length / itensPorPagina);
  const itensExibidos = itensEncontrados.slice(
    (paginaAtual - 1) * itensPorPagina,
    paginaAtual * itensPorPagina
  );

  const lidarComVisualizacao = () => {
    const isResidencial = dadosSaida.novaUnidade === "Residência do Paciente";
    const isVindoDeResidencial = itemSelecionado?.status === "em_uso_residencial" || itemSelecionado?.unidade === "Residência do Paciente";

    if (!dadosSaida.novaUnidade || (!isResidencial && !normalizarParaComparacao(dadosSaida.novaUnidade).includes("estoque") && !dadosSaida.novoSetor) || !dadosSaida.responsavelRecebimento) {
      toast.warn("Por favor, preencha todos os campos obrigatórios antes de visualizar.");
      return;
    }

    if (isResidencial && (!dadosSaida.pacienteEndereco || !dadosSaida.pacienteCpf)) {
      toast.warn("Endereço e CPF do paciente são obrigatórios para uso residencial.");
      return;
    }

    if (normalizarParaComparacao(itemSelecionado.patrimonio) === "sp" && !novoPatrimonioParaSP) {
      toast.warn("Por favor, atribua um novo número de patrimônio.");
      return;
    }

    const patrimonioFinal =
      normalizarParaComparacao(itemSelecionado.patrimonio) === "sp" && novoPatrimonioParaSP
        ? novoPatrimonioParaSP.trim().toLowerCase()
        : String(itemSelecionado.patrimonio || "").toLowerCase();

    if (isVindoDeResidencial) {
      setDadosParaImpressaoRetirada({
        patrimonio: patrimonioFinal,
        nomeEquipamento: (itemSelecionado.nome || "").toLowerCase(),
        unidadeOrigem: (itemSelecionado.unidade || "").toLowerCase(),
        setorOrigem: (itemSelecionado.setor || "").toLowerCase(),
        nomePaciente: (itemSelecionado.setor || "").toLowerCase(),
        unidadeDestino: dadosSaida.novaUnidade.toLowerCase(),
        setorDestino: (dadosSaida.novoSetor || "Estoque Patrimônio").toLowerCase(),
        responsavelRecebimento: dadosSaida.responsavelRecebimento.toLowerCase(),
      });

      setTimeout(() => {
        const areaPrint = document.getElementById("area-impressao-retirada");
        if (areaPrint) {
          areaPrint.classList.remove("hidden");
          window.print();
          areaPrint.classList.add("hidden");
          setTermoVisualizado(true);
          toast.success("Termo de Retirada enviado para a impressora!");
        }
      }, 250);
      return;
    }

    const dadosCompletosParaTermo = {
      ativoId: itemSelecionado._id || itemSelecionado.id,
      patrimonio: patrimonioFinal,
      nomeEquipamento: (itemSelecionado.nome || "").toLowerCase(),
      unidadeOrigem: (itemSelecionado.unidade || "").toLowerCase(),
      setorOrigem: (itemSelecionado.setor || "").toLowerCase(),
      unidadeDestino: dadosSaida.novaUnidade.toLowerCase(),
      setorDestino: (dadosSaida.novoSetor || "Estoque Patrimônio").toLowerCase(),
      responsavelRecebimento: dadosSaida.responsavelRecebimento.toLowerCase(),
      motivo: isResidencial ? "internação domiciliar (home care)" : dadosSaida.motivo.toLowerCase(),
      pacienteEndereco: dadosSaida.pacienteEndereco.toLowerCase(),
      pacienteTelefone: dadosSaida.pacienteTelefone.toLowerCase(),
      pacienteIdentidade: dadosSaida.pacienteIdentidade.toLowerCase(),
      pacienteCpf: dadosSaida.pacienteCpf.toLowerCase(),
      isResidencial: isResidencial
    };

    abrirVisualizacaoTermo(dadosCompletosParaTermo);
    setTermoVisualizado(true);
    toast.info("Documento de transferência aberto na nova aba!");
  };

  const handleSaida = async (e) => {
    e.preventDefault();
    setLoading(true);

    const isResidencial = dadosSaida.novaUnidade === "Residência do Paciente";
    
    const destinoEhEstoque = 
      normalizarParaComparacao(dadosSaida.novaUnidade).includes("estoque") || 
      normalizarParaComparacao(dadosSaida.novoSetor).includes("estoque");

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("Usuário não autenticado");

      const idOriginal = itemSelecionado._id || itemSelecionado.id;
      const patrimonioFinal =
        normalizarParaComparacao(itemSelecionado.patrimonio) === "sp" && novoPatrimonioParaSP
          ? novoPatrimonioParaSP.trim().toLowerCase()
          : String(itemSelecionado.patrimonio || "").trim().toLowerCase();

      const ehSemPatrimonio = 
        !patrimonioFinal || 
        normalizarParaComparacao(patrimonioFinal) === "sp" || 
        normalizarParaComparacao(patrimonioFinal) === "s/p";

      if (itemSelecionado.status === "em_uso_residencial" || itemSelecionado._docPacienteId) {
        if (itemSelecionado._docPacienteId) {
          await api.delete(`/equipamento_com_paciente/${itemSelecionado._docPacienteId}`).catch(() => {});
        } else {
          const resPac = await api.get(`/equipamento_com_paciente`).catch(() => ({ data: [] }));
          const listaPac = Array.isArray(resPac.data) ? resPac.data : [];
          const pacsEncontrados = listaPac.filter(p => String(p.equipamentoId) === String(idOriginal));
          for (const docP of pacsEncontrados) {
            await api.delete(`/equipamento_com_paciente/${docP._id || docP.id}`).catch(() => {});
          }
        }
      }

      const basePayload = {
        ...itemSelecionado,
        nome: itemSelecionado.nome ? itemSelecionado.nome.trim().toLowerCase() : "",
        patrimonio: patrimonioFinal,
        unidade: dadosSaida.novaUnidade.toLowerCase(),
        setor: dadosSaida.novoSetor.trim().toLowerCase(),
        status: "ativo",
        quantidade: 1,
        ultimaMovimentacao: new Date().toISOString(),
      };

      delete basePayload._colecaoOrigem;
      delete basePayload._docPacienteId;
      delete basePayload.id;
      delete basePayload._id;

      if (destinoEhEstoque) {
        if (idOriginal) {
          await api.delete(`/ativos/${idOriginal}`).catch((err) => {
            console.warn("Falha ao deletar ativo por ID:", err);
          });
        }

        if (!ehSemPatrimonio) {
          const resAtivos = await api.get(`/ativos`).catch(() => ({ data: [] }));
          const listaAtivos = Array.isArray(resAtivos.data) ? resAtivos.data : [];
          const duplicados = listaAtivos.filter(
            (atv) => normalizarParaComparacao(atv.patrimonio) === normalizarParaComparacao(patrimonioFinal)
          );
          for (const atv of duplicados) {
            const targetAtivoId = atv._id || atv.id;
            if (targetAtivoId) {
              await api.delete(`/ativos/${targetAtivoId}`).catch(() => {});
            }
          }
        }

        if (!ehSemPatrimonio) {
          const resEstoque = await api.get(`/estoque`).catch(() => ({ data: [] }));
          const listaEstoque = Array.isArray(resEstoque.data) ? resEstoque.data : [];
          const estoqueExistente = listaEstoque.find(
            (e) => normalizarParaComparacao(e.patrimonio) === normalizarParaComparacao(patrimonioFinal)
          );

          if (estoqueExistente) {
            const targetId = estoqueExistente._id || estoqueExistente.id;
            await api.put(`/estoque/${targetId}`, {
              ...basePayload,
              quantidade: Number(estoqueExistente.quantidade || 0) + 1,
            });
          } else {
            await api.post(`/estoque`, basePayload);
          }
        } else {
          await api.post(`/estoque`, basePayload);
        }

      } else {
        if (idOriginal) {
          await api.delete(`/estoque/${idOriginal}`).catch(() => {});
        }

        if (!ehSemPatrimonio) {
          const resEstoque = await api.get(`/estoque`).catch(() => ({ data: [] }));
          const listaEstoque = Array.isArray(resEstoque.data) ? resEstoque.data : [];
          const duplicados = listaEstoque.filter(
            (est) => normalizarParaComparacao(est.patrimonio) === normalizarParaComparacao(patrimonioFinal)
          );
          for (const est of duplicados) {
            const targetEstId = est._id || est.id;
            if (targetEstId) {
              await api.delete(`/estoque/${targetEstId}`).catch(() => {});
            }
          }
        }

        if (!ehSemPatrimonio) {
          const resAtivosGeral = await api.get(`/ativos`, { params: { patrimonio: patrimonioFinal } }).catch(() => ({ data: [] }));
          const ativosArray = Array.isArray(resAtivosGeral.data) ? resAtivosGeral.data : [];
          const ativoExistente = ativosArray.find(
            (a) => normalizarParaComparacao(a.patrimonio) === normalizarParaComparacao(patrimonioFinal)
          );

          if (ativoExistente) {
            const targetId = ativoExistente._id || ativoExistente.id;
            await api.put(`/ativos/${targetId}`, basePayload);
          } else {
            await api.post(`/ativos`, basePayload);
          }
        } else {
          await api.post(`/ativos`, basePayload);
        }
      }

      const payloadSaida = {
        ativoId: idOriginal,
        patrimonio: patrimonioFinal,
        nomeEquipamento: String(itemSelecionado.nome || "").trim().toLowerCase(),
        unidadeOrigem: String(itemSelecionado.unidade || "").trim().toLowerCase(),
        setorOrigem: String(itemSelecionado.setor || "").trim().toLowerCase(),
        unidadeDestino: dadosSaida.novaUnidade.toLowerCase(),
        setorDestino: dadosSaida.novoSetor.trim().toLowerCase(),
        responsavelRecebimento: dadosSaida.responsavelRecebimento.trim().toLowerCase(),
        motivo: isResidencial ? "home care" : dadosSaida.motivo.trim().toLowerCase(),
        quantidadeTransferida: Number(dadosSaida.quantidadeRetirada) || 1,
        dataSaida: new Date().toISOString(),
      };

      if (isResidencial) {
        payloadSaida.pacienteDetails = {
          endereco: dadosSaida.pacienteEndereco.trim().toLowerCase(),
          telefone: dadosSaida.pacienteTelefone.trim().toLowerCase(),
          identity: dadosSaida.pacienteIdentidade.trim().toLowerCase(),
          cpf: dadosSaida.pacienteCpf.trim().toLowerCase(),
        };

        await api.post(`/equipamento_com_paciente`, {
          equipamentoId: idOriginal,
          equipamentoNome: String(itemSelecionado.nome || "").trim().toLowerCase(),
          patrimonio: patrimonioFinal,
          unidadeOrigem: String(itemSelecionado.unidade || "").trim().toLowerCase(),
          setorOrigem: String(itemSelecionado.setor || "").trim().toLowerCase(),
          dataEntrega: new Date().toISOString(),
          statusVinculo: "ativo",
          paciente: {
            nome: dadosSaida.novoSetor.trim().toLowerCase(),
            endereco: dadosSaida.pacienteEndereco.trim().toLowerCase(),
            telefone: dadosSaida.pacienteTelefone.trim().toLowerCase(),
            identidade: dadosSaida.pacienteIdentidade.trim().toLowerCase(),
            cpf: dadosSaida.pacienteCpf.trim().toLowerCase(),
            responsavelRecebimento: dadosSaida.responsavelRecebimento.trim().toLowerCase()
          }
        });
      }

      await api.post(`/saidaEquipamento`, payloadSaida);

      toast.success("Transferência realizada com sucesso!");
      setShowModal(false);
      setTermoVisualizado(false);
      setItensEncontrados([]);
      setPatrimonioBusca("");
      setNomeBusca("");
      setSetorBusca("");
      setNovoPatrimonioParaSP("");
      setDadosParaImpressaoRetirada(null);
      setDadosSaida({
        novaUnidade: "",
        novoSetor: "",
        motivo: "transferência",
        responsavelRecebimento: "",
        pacienteEndereco: "",
        pacienteTelefone: "",
        pacienteIdentidade: "",
        pacienteCpf: "",
        quantidadeRetirada: 1,
      });
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Erro ao concluir a transferência.");
    } finally {
      setLoading(false);
    }
  };

  return {
    patrimonioBusca,
    setPatrimonioBusca,
    nomeBusca,
    setNomeBusca,
    setorBusca,
    setSetorBusca,
    unidadeFiltro,
    setUnidadeFiltro,
    itensEncontrados,
    itemSelecionado,
    setItemSelecionado,
    showModal,
    setShowModal,
    loading: loading || loadingSetores,
    novoPatrimonioParaSP,
    setNovoPatrimonioParaSP,
    mostrarDropdown,
    setMostrarDropdown,
    dropdownRef,
    termoVisualizado,
    setTermoVisualizado,
    dadosParaImpressaoRetirada,
    paginaAtual,
    setPaginaAtual,
    itensPorPagina,
    dadosSaida,
    setDadosSaida,
    unidades,
    normalizarParaComparacao,
    limparBusca,
    obterSetoresFiltrados,
    ejecutarBusca,
    totalPaginas,
    itensExibidos,
    lidarComVisualizacao,
    handleSaida,
  };
};