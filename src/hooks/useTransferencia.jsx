import { useState, useEffect, useRef } from "react";
import { auth } from "../services/firebase";
import { toast } from "react-toastify";
import { abrirVisualizacaoTermo } from "../components/ImpressaoTransferencia";
import { MAPA_SETORES_POR_UNIDADE } from "../components/constants/setores"; 

const API_URL = "http://IP_DA_SUA_VPS:3000/api";

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

  const [dadosSaida, setDadosSaida] = useState({
    novaUnidade: "",
    novoSetor: "",
    motivo: "Transferência",
    responsavelRecebimento: "",
    pacienteEndereco: "",
    pacienteTelefone: "",
    pacienteIdentidade: "",
    pacienteCpf: "",
    quantidadeRetirada: 1,
  });

  const unidades = [
    "Estoque Patrimônio",
    "Hospital Conde",
    "UPA INOÃ",
    "UPA SANTA RITA",
    "SAMU BARROCO",
    "SAMU PONTA NEGRA",
    "SAMU CENTRO",
    "Residência do Paciente",
  ];

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

    const chaveUnidade = Object.keys(MAPA_SETORES_POR_UNIDADE).find(
      (key) => normalizarParaComparacao(key) === normalizarParaComparacao(unidadeFiltro)
    );

    const setoresDaUnidade = chaveUnidade ? MAPA_SETORES_POR_UNIDADE[chaveUnidade] : [];
    
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
      const currentUser = auth.currentUser;
      const token = currentUser ? await currentUser.getIdToken() : "";
      const headers = { Authorization: `Bearer ${token}` };

      const unidadeFiltroNorm = normalizarParaComparacao(unidadeFiltro);
      const ehOrigemResidencial = unidadeFiltroNorm.includes("residencia") || unidadeFiltroNorm.includes("paciente");

      let listaGeral = [];

      if (tipo === "patrimonio" && termoOriginal.trim() !== "") {
        const termoBuscaExato = termoOriginal.trim();
        
        const [resAtivos, resPac] = await Promise.all([
          fetch(`${API_URL}/ativos?patrimonio=${encodeURIComponent(termoBuscaExato)}`, { headers }),
          fetch(`${API_URL}/equipamento_com_paciente?patrimonio=${encodeURIComponent(termoBuscaExato)}`, { headers })
        ]);

        const dadosAtivos = resAtivos.ok ? await resAtivos.json() : [];
        const dadosPac = resPac.ok ? await resPac.json() : [];

        if (dadosAtivos.length > 0) {
          listaGeral = dadosAtivos.map((item) => ({
            ...item,
            id: item.id || item._id,
            _colecaoOrigem: "ativos",
          }));
        } else if (dadosPac.length > 0) {
          listaGeral = dadosPac.map((item) => {
            return {
              id: item.equipamentoId || item.id || item._id,
              _docPacienteId: item.id || item._id,
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
          const resPacientes = await fetch(`${API_URL}/equipamento_com_paciente`, { headers });
          const dadosPacientes = resPacientes.ok ? await resPacientes.json() : [];
          listaGeral = dadosPacientes.map((item) => {
            return {
              id: item.equipamentoId || item.id || item._id,
              _docPacienteId: item.id || item._id,
              nome: item.equipamentoNome || item.nome,
              patrimonio: item.patrimonio,
              unidade: "Residência do Paciente",
              setor: item.paciente?.nome ? `Residência do Paciente - ${item.paciente.nome}` : "Residência",
              status: "em_uso_residencial",
              _colecaoOrigem: "ativos",
            };
          });
        } else {
          const resGeral = await fetch(`${API_URL}/ativos`, { headers });
          const dadosGeral = resGeral.ok ? await resGeral.json() : [];
          listaGeral = dadosGeral.map((item) => ({
            ...item,
            id: item.id || item._id,
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
          statusItemNorm !== "operante"
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

    if (!dadosSaida.novaUnidade || !dadosSaida.novoSetor || !dadosSaida.responsavelRecebimento) {
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
        ? novoPatrimonioParaSP
        : itemSelecionado.patrimonio;

    if (isVindoDeResidencial) {
      setDadosParaImpressaoRetirada({
        patrimonio: patrimonioFinal,
        nomeEquipamento: itemSelecionado.nome,
        unidadeOrigem: itemSelecionado.unidade,
        setorOrigem: itemSelecionado.setor,
        nomePaciente: itemSelecionado.setor,
        unidadeDestino: dadosSaida.novaUnidade,
        setorDestino: dadosSaida.novoSetor,
        responsavelRecebimento: dadosSaida.responsavelRecebimento,
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
      ativoId: itemSelecionado.id,
      patrimonio: patrimonioFinal,
      nomeEquipamento: itemSelecionado.nome,
      unidadeOrigem: itemSelecionado.unidade,
      setorOrigem: itemSelecionado.setor,
      unidadeDestino: dadosSaida.novaUnidade,
      setorDestino: dadosSaida.novoSetor,
      responsavelRecebimento: dadosSaida.responsavelRecebimento,
      motivo: isResidencial ? "Internação Domiciliar (Home Care)" : dadosSaida.motivo,
      pacienteEndereco: dadosSaida.pacienteEndereco,
      pacienteTelefone: dadosSaida.pacienteTelefone,
      pacienteIdentidade: dadosSaida.pacienteIdentidade,
      pacienteCpf: dadosSaida.pacienteCpf,
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
    const destinoEhEstoque = normalizarParaComparacao(dadosSaida.novaUnidade).includes("estoque");

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("Usuário não autenticado");
      const token = await currentUser.getIdToken();
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      };

      const patrimonioFinal =
        normalizarParaComparacao(itemSelecionado.patrimonio) === "sp" &&
        novoPatrimonioParaSP
          ? novoPatrimonioParaSP
          : itemSelecionado.patrimonio;

      // Se o item estava em uso residencial, removemos o vínculo do paciente
      if (itemSelecionado.status === "em_uso_residencial" || itemSelecionado._docPacienteId) {
        if (itemSelecionado._docPacienteId) {
          await fetch(`${API_URL}/equipamento_com_paciente/${itemSelecionado._docPacienteId}`, {
            method: "DELETE",
            headers
          });
        } else {
          const resPac = await fetch(`${API_URL}/equipamento_com_paciente`, { headers: { Authorization: `Bearer ${token}` } });
          const listaPac = resPac.ok ? await resPac.json() : [];
          const pacsEncontrados = listaPac.filter(p => p.equipamentoId === itemSelecionado.id);
          for (const docP of pacsEncontrados) {
            await fetch(`${API_URL}/equipamento_com_paciente/${docP.id || docP._id}`, {
              method: "DELETE",
              headers
            });
          }
        }
      }

      // Atualiza o registro principal na coleção "ativos"
      const resItem = await fetch(`${API_URL}/ativos/${itemSelecionado.id}`, { headers: { Authorization: `Bearer ${token}` } });
      const itemExiste = resItem.ok;

      const atualizacaoPayload = {
        unidade: dadosSaida.novaUnidade.toLowerCase().trim(),
        setor: dadosSaida.novoSetor.toLowerCase().trim(),
        patrimonio: patrimonioFinal,
        status: "ativo",
        ultimaMovimentacao: new Date().toISOString(),
      };

      if (itemExiste) {
        await fetch(`${API_URL}/ativos/${itemSelecionado.id}`, {
          method: "PUT",
          headers,
          body: JSON.stringify(atualizacaoPayload)
        });
      } else {
        await fetch(`${API_URL}/ativos`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            nome: itemSelecionado.nome.toLowerCase().trim(),
            patrimonio: patrimonioFinal,
            unidade: dadosSaida.novaUnidade.toLowerCase().trim(),
            setor: dadosSaida.novoSetor.toLowerCase().trim(),
            status: "ativo",
            ultimaMovimentacao: new Date().toISOString(),
          })
        });
      }

      // Se o destino for o estoque, adiciona/registra também na coleção "estoque" para aparecer na Central do Estoque
      if (destinoEhEstoque) {
        const resEstoque = await fetch(`${API_URL}/estoque`, { headers: { Authorization: `Bearer ${token}` } });
        const listaEstoque = resEstoque.ok ? await resEstoque.json() : [];
        const estoqueExistente = listaEstoque.find(e => String(e.patrimonio).trim() === String(patrimonioFinal).trim());

        const estoquePayload = {
          nome: itemSelecionado.nome.toLowerCase().trim(),
          patrimonio: patrimonioFinal,
          unidade: dadosSaida.novaUnidade.toLowerCase().trim(),
          setor: dadosSaida.novoSetor.toLowerCase().trim(),
          status: "ativo",
          quantidade: 1,
          ultimaMovimentacao: new Date().toISOString(),
        };

        if (estoqueExistente) {
          await fetch(`${API_URL}/estoque/${estoqueExistente.id || estoqueExistente._id}`, {
            method: "PUT",
            headers,
            body: JSON.stringify(estoquePayload)
          });
        } else {
          await fetch(`${API_URL}/estoque`, {
            method: "POST",
            headers,
            body: JSON.stringify(estoquePayload)
          });
        }
      }

      // Registra o histórico da movimentação de saída
      const payloadSaida = {
        ativoId: itemSelecionado.id,
        patrimonio: patrimonioFinal,
        nomeEquipamento: itemSelecionado.nome.toLowerCase().trim(),
        unidadeOrigem: itemSelecionado.unidade.toLowerCase().trim(),
        setorOrigem: itemSelecionado.setor.toLowerCase().trim(),
        unidadeDestino: dadosSaida.novaUnidade.toLowerCase().trim(),
        setorDestino: dadosSaida.novoSetor.toLowerCase().trim(),
        responsavelRecebimento: dadosSaida.responsavelRecebimento.toLowerCase().trim(),
        motivo: isResidencial ? "home care" : dadosSaida.motivo.toLowerCase().trim(),
        quantidadeTransferida: Number(dadosSaida.quantidadeRetirada) || 1,
        dataSaida: new Date().toISOString(),
      };

      if (isResidencial) {
        payloadSaida.pacienteDetails = {
          endereco: dadosSaida.pacienteEndereco.toLowerCase().trim(),
          telefone: dadosSaida.pacienteTelefone.trim(),
          identity: dadosSaida.pacienteIdentidade.trim(),
          cpf: dadosSaida.pacienteCpf.trim(),
        };

        await fetch(`${API_URL}/equipamento_com_paciente`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            equipamentoId: itemSelecionado.id,
            equipamentoNome: itemSelecionado.nome.toLowerCase().trim(),
            patrimonio: patrimonioFinal,
            unidadeOrigem: itemSelecionado.unidade.toLowerCase().trim(),
            setorOrigem: itemSelecionado.setor.toLowerCase().trim(),
            dataEntrega: new Date().toISOString(),
            statusVinculo: "ativo",
            paciente: {
              nome: dadosSaida.novoSetor.toLowerCase().trim(),
              endereco: dadosSaida.pacienteEndereco.toLowerCase().trim(),
              telefone: dadosSaida.pacienteTelefone.trim(),
              identidade: dadosSaida.pacienteIdentidade.trim(),
              cpf: dadosSaida.pacienteCpf.trim(),
              responsavelRecebimento: dadosSaida.responsavelRecebimento.toLowerCase().trim()
            }
          })
        });
      }

      await fetch(`${API_URL}/saidaEquipamento`, {
        method: "POST",
        headers,
        body: JSON.stringify(payloadSaida)
      });

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
        motivo: "Transferência",
        responsavelRecebimento: "",
        pacienteEndereco: "",
        pacienteTelefone: "",
        pacienteIdentidade: "",
        pacienteCpf: "",
        quantidadeRetirada: 1,
      });
    } catch (error) {
      console.error(error);
      toast.error("Erro ao concluir a transferência.");
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
    loading,
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