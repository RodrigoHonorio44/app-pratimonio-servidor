import { useState } from 'react';
import { toast } from 'react-toastify';
import api from '../services/api';

export const useSaidaEquipamento = () => {
    const [patrimonioBusca, setPatrimonioBusca] = useState('');
    const [nomeBusca, setNomeBusca] = useState('');
    const [itensEncontrados, setItensEncontrados] = useState([]);
    const [itemSelecionado, setItemSelecionado] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [novoPatrimonioParaSP, setNovoPatrimonioParaSP] = useState('');

    const [dadosSaida, setDadosSaida] = useState({
        novaUnidade: '',
        novoSetor: '',
        motivo: 'Transferência',
        responsavelRecebimento: ''
    });

    const unidades = ["Hospital Conde", "Upa de Inoã", "Upa de Santa Rita", "Samu Barroco", "Samu Ponta Negra"];

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

    const executarBusca = async (tipo) => {
        const termoOriginal = tipo === 'patrimonio' ? patrimonioBusca : nomeBusca;
        if (!termoOriginal.trim()) {
            toast.warn(`Digite um ${tipo === 'patrimonio' ? 'patrimônio' : 'nome ou setor'}.`);
            return;
        }

        setLoading(true);
        setItensEncontrados([]);

        try {
            const response = await api.get('/ativos');
            const ativosSalvos = response.data || [];
            const termoNorm = normalizarParaComparacao(termoOriginal);

            const filtrados = ativosSalvos.filter(item => {
                const statusItemNorm = String(item.status || "ativo").toLowerCase().trim();
                if (statusItemNorm !== "ativo") return false;

                const itemPatrimonioNorm = normalizarParaComparacao(item.patrimonio);
                const itemNomeNorm = normalizarParaComparacao(item.nome);
                const itemSetorNorm = normalizarParaComparacao(item.setor);

                if (tipo === 'patrimonio') {
                    if (termoNorm === 'sp' || termoNorm === 'spatrimonio') {
                        toast.info("Para itens S/P, use a busca por NOME ou SETOR.");
                        return false;
                    }
                    return itemPatrimonioNorm === termoNorm;
                } else {
                    return (
                        itemNomeNorm.includes(termoNorm) ||
                        itemSetorNorm.includes(termoNorm) ||
                        itemPatrimonioNorm === termoNorm
                    );
                }
            });

            if (filtrados.length > 0) {
                setItensEncontrados(filtrados);
            } else {
                toast.error("Nenhum item ativo encontrado.");
            }
        } catch (error) {
            console.error("Erro ao buscar ativos:", error);
            toast.error("Erro ao buscar na base de dados.");
        } finally {
            setLoading(false);
        }
    };

    const selecionarItemParaSaida = (item) => {
        setItemSelecionado(item);
        setShowModal(true);
    };

    const fecharModal = () => {
        setShowModal(false);
        setItemSelecionado(null);
        setNovoPatrimonioParaSP('');
    };

    const handleSaida = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const patrimonioFinal = (normalizarParaComparacao(itemSelecionado.patrimonio) === 'sp' && novoPatrimonioParaSP)
                ? novoPatrimonioParaSP
                : itemSelecionado.patrimonio;

            // Gera a data e hora exata local/UTC padronizada no formato ISO 8601
            const agora = new Date();
            const dataAtualISO = agora.toISOString(); // Ex: 2026-07-30T21:39:00.000Z

            const itemId = itemSelecionado.id || itemSelecionado._id;

            // 1. Atualiza o ativo informando a movimentação
            await api.put(`/ativos/${itemId}`, {
                unidade: dadosSaida.novaUnidade,
                setor: dadosSaida.novoSetor,
                patrimonio: patrimonioFinal,
                ultimaMovimentacao: dataAtualISO
            });

            // 2. Salva o registro no endpoint /saidas-equipamentos
            await api.post('/saidas-equipamentos', {
                ativoId: itemId,
                patrimonio: patrimonioFinal,
                equipamento: itemSelecionado.nome || itemSelecionado.nomeEquipamento,
                nomeEquipamento: itemSelecionado.nome || itemSelecionado.nomeEquipamento,
                unidadeOrigem: itemSelecionado.unidade,
                setorOrigem: itemSelecionado.setor,
                unidadeDestino: dadosSaida.novaUnidade,
                setorDestino: dadosSaida.novoSetor,
                responsavelRecebimento: dadosSaida.responsavelRecebimento,
                motivo: dadosSaida.motivo,
                // Redundância de datas para retrocompatibilidade com parsers
                dataSaida: dataAtualISO,
                criadoEm: dataAtualISO,
                createdAt: dataAtualISO
            });

            toast.success("Transferência realizada com sucesso!");
            fecharModal();
            setItensEncontrados([]);
            setPatrimonioBusca('');
            setNomeBusca('');
        } catch (error) {
            console.error("Erro ao processar transferência:", error);
            toast.error("Erro ao processar transferência no servidor.");
        } finally {
            setLoading(false);
        }
    };

    return {
        patrimonioBusca,
        setPatrimonioBusca,
        nomeBusca,
        setNomeBusca,
        itensEncontrados,
        itemSelecionado,
        showModal,
        loading,
        novoPatrimonioParaSP,
        setNovoPatrimonioParaSP,
        dadosSaida,
        setDadosSaida,
        unidades,
        executarBusca,
        selecionarItemParaSaida,
        fecharModal,
        handleSaida,
        normalizarParaComparacao
    };
};