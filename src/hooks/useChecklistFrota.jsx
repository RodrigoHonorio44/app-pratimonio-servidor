import { useState, useEffect } from 'react';
import { getAuth, signOut, onAuthStateChanged } from 'firebase/auth';

export const listaItensInspecao = [
  { id: 'pneus', label: 'Pneus / Calibragem' },
  { id: 'oleo', label: 'Nível do Óleo do Motor' },
  { id: 'fluidoFreio', label: 'Fluido de Freio' },
  { id: 'aguaRadiador', label: 'Água do Radiador' },
  { id: 'farois', label: 'Faróis e Lanternas' },
  { id: 'setas', label: 'Luzes de Seta / Alerta' },
  { id: 'limpadores', label: 'Limpadores de Para-brisa' },
  { id: 'cintos', label: 'Cintos de Segurança' },
  { id: 'estepeFerramentas', label: 'Estepe, Macaco e Chave Roda' },
  { id: 'extintor', label: 'Extintor de Incêndio' },
  { id: 'lataria', label: 'Estado da Lataria / Pintura' },
];

export const listaAcessorios = [
  "BAGAGITO", "CALOTA", "CHAVE DE RODA", "TRIÂNGULO", "MACACO", "FAROL AUXILIAR", "MANUAL", "EXTINTOR", "ALARME",
  "CHAVE PRINCIPAL", "CHAVE RESERVA", "TAPETES", "RÁDIO AM/FM", "CD PLAYER", "KIT MULTIMÍDIA", "AUTO FALANTE", "GIROFLEX", "CARTÃO GPS",
  "TAGÓGRAFO", "ANTENA", "SANTO ANTÔNIO", "CAPOTA FIBRA", "CAPOTA MARÍTIMA", "CHAVE SEG. ESTEPE", "PORTA ESCADA", "QUEBRA SOL", "RETROVISOR INTERNO",
  "FORRO DE PORTA", "FORRO DE TETO", "FORRO DO PORTA MALAS", "BANCO DIANTEIRO", "BANCO TRASEIRO", "ENCOSTO BANCO TRAS.", "PROTETOR DE CARTER", "PLACA VEICULAR", "DIFUSOR DE AR"
];

export const posicoesVistoria = [
  { id: 'sup_traseira', top: '10%', left: '19.5%', label: 'Teto / Traseira' },
  { id: 'sup_vidro_tras', top: '23%', left: '10.5%', label: 'Vidro Traseiro' },
  { id: 'sup_teto', top: '42%', left: '21.5%', label: 'Teto Central' },
  { id: 'sup_parabrisa', top: '56%', left: '10.5%', label: 'Para-brisa' },
  { id: 'sup_capo', top: '78%', left: '21.5%', label: 'Capô' },
  { id: 'tras_vidro', top: '10%', left: '30.5%', label: 'Vidro Traseiro' },
  { id: 'tras_lanterna_esq', top: '30%', left: '27.5%', label: 'Lanterna Traseira Esquerda' },
  { id: 'tras_lanterna_dir', top: '30%', left: '46%', label: 'Lanterna Traseira Direita' },
  { id: 'tras_parachoque', top: '42%', left: '30.5%', label: 'Para-choque Traseiro' },
  { id: 'front_retrovisores', top: '56%', left: '30.5%', label: 'Retrovisor Esquerdo' },
  { id: 'front_farol_esq', top: '76%', left: '30.5%', label: 'Farol Esquerdo' },
  { id: 'front_retrovisor_dir', top: '56%', left: '46%', label: 'Retrovisor Direito' },
  { id: 'front_farol_dir', top: '72%', left: '46%', label: 'Farol Direito' },
  { id: 'front_parachoque', top: '88%', left: '46%', label: 'Para-choque Dianteiro' },
  { id: 'lat_dir_tanque', top: '22%', left: '56.5%', label: 'Bocal do Tanque' },
  { id: 'lat_dir_teto', top: '10%', left: '62.5%', label: 'Coluna / Teto Lado Dir.' },
  { id: 'lat_dir_vidro_tras', top: '10%', left: '74.5%', label: 'Vidro Traseiro Lado Dir.' },
  { id: 'lat_dir_vidro_front', top: '10%', left: '81.5%', label: 'Vidro Dianteiro Lado Dir.' },
  { id: 'lat_dir_capo', top: '22%', left: '88.5%', label: 'Capô / Paralama Lado Dir.' },
  { id: 'lat_dir_roda_tras', top: '44%', left: '60.5%', label: 'Roda Traseira Direita' },
  { id: 'lat_dir_porta_tras', top: '44%', left: '70.5%', label: 'Porta Traseira Direita' },
  { id: 'lat_dir_porta_front', top: '44%', left: '77.5%', label: 'Porta Dianteira Direita' },
  { id: 'lat_dir_roda_front', top: '44%', left: '88.5%', label: 'Roda Dianteira Direita' },
  { id: 'lat_esq_frente', top: '68%', left: '58.5%', label: 'Para-choque Dianteiro Lado Esq.' },
  { id: 'lat_esq_vidro_front', top: '56%', left: '65.5%', label: 'Vidro Dianteiro Lado Esq.' },
  { id: 'lat_esq_vidro_tras', top: '56%', left: '77.5%', label: 'Vidro Traseiro Lado Esq.' },
  { id: 'lat_esq_traseira', top: '68%', left: '88.5%', label: 'Lanterna / Traseira Lado Esq.' },
  { id: 'lat_esq_roda_front', top: '90%', left: '60.5%', label: 'Roda Dianteira Esquerda' },
  { id: 'lat_esq_porta_front', top: '90%', left: '70.5%', label: 'Porta Dianteira Esquerda' },
  { id: 'lat_esq_porta_tras', top: '90%', left: '77.5%', label: 'Porta Traseira Esquerda' },
  { id: 'lat_esq_roda_tras', top: '90%', left: '88.5%', label: 'Roda Traseira Esquerda' },
];

export function useChecklistFrota() {
  const [veiculos, setVeiculos] = useState([]);
  const [modalVeiculoAberto, setModalVeiculoAberto] = useState(false);
  const [salvandoVeiculo, setSalvandoVeiculo] = useState(false);
  const [salvandoChecklist, setSalvandoChecklist] = useState(false);
  const [usuarioNome, setUsuarioNome] = useState('analyst ti');
  
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const dispararToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 4000);
  };

  const [novoVeiculo, setNovoVeiculo] = useState({
    placa: "",
    modelo: "",
    marca: "",
    kmAtual: "",
  });

  const getInitialFormData = () => ({
    tipoVeiculo: 'usado',
    veiculoId: '',
    placa: '',
    km: '',
    data: new Date().toISOString().split('T')[0],
    hora: new Date().toTimeString().slice(0, 5),
    modelo: '',
    marca: '',
    cor: '',
    cidade: '',
    pneuDianteiro: 'b',
    pneuTraseiro: 'b',
    pneuEstepe: 'b',
    crlv: 'sim',
    exercicio: new Date().getFullYear().toString(),
    combustivel: 'F',
    obs: '',
    condutor: '',
    rg: '',
    telefone: '',
    email: '',
    responsavel: ''
  });

  const [formData, setFormData] = useState(getInitialFormData());

  const [itensInspecao, setItensInspecao] = useState(
    listaItensInspecao.reduce((acc, item) => ({ ...acc, [item.id]: 'ok' }), {})
  );

  const [danos, setDanos] = useState({});
  const [acessorios, setAcessorios] = useState(
    listaAcessorios.reduce((acc, item) => ({ ...acc, [item]: 'N' }), {})
  );

  const apiFetch = async (url, options = {}) => {
    // Configura a URL base para produção caso não esteja no localhost
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const baseURL = isLocal ? '' : 'http://192.168.0.232:3000'; // Substitua pelo IP/Domínio correto da sua API se necessário
    
    const urlCompleta = url.startsWith('http') ? url : `${baseURL}${url}`;
    const urlFormatada = encodeURI(urlCompleta.trim().replace(/\s+/g, '_'));

    const auth = getAuth();
    let user = auth.currentUser;

    if (!user) {
      await new Promise((resolve) => {
        const unsubscribe = onAuthStateChanged(auth, (u) => {
          user = u;
          unsubscribe();
          resolve();
        });
      });
    }

    let token = '';
    if (user) {
      token = await user.getIdToken();
    }

    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...(options.headers || {})
    };

    const response = await fetch(urlFormatada, { ...options, headers });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `Erro HTTP ${response.status} na comunicação com o servidor`);
    }
    return response.json();
  };

  const carregarVeiculos = async () => {
    try {
      const lista = await apiFetch('/api/veiculos_frota');
      if (Array.isArray(lista)) {
        lista.sort((a, b) => (a.modelo || '').localeCompare(b.modelo || ''));
        setVeiculos(lista);
      }
    } catch (error) {
      console.error("Erro ao carregar veículos:", error);
    }
  };

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        if (user.displayName) {
          setUsuarioNome(user.displayName);
        } else if (user.email) {
          setUsuarioNome(user.email.split('@')[0]);
        }
        carregarVeiculos();
      }
    });
    return () => unsubscribe();
  }, []);

  const handleSelecionarVeiculo = async (veiculoId) => {
    if (!veiculoId) {
      setFormData(getInitialFormData());
      setItensInspecao(listaItensInspecao.reduce((acc, item) => ({ ...acc, [item.id]: 'ok' }), {}));
      setDanos({});
      setAcessorios(listaAcessorios.reduce((acc, item) => ({ ...acc, [item]: 'N' }), {}));
      return;
    }

    const veiculoEncontrado = veiculos.find((v) => String(v.id) === String(veiculoId) || String(v._id) === String(veiculoId));
    
    if (veiculoEncontrado) {
      try {
        const historico = await apiFetch(`/api/checklist-frota`).catch(() => []);
        
        let ultimoChecklist = null;
        if (Array.isArray(historico) && historico.length > 0) {
          const checklistsDoVeiculo = historico.filter(item => 
            String(item.veiculoId) === String(veiculoEncontrado.id || veiculoEncontrado._id) ||
            (item.placa && item.placa.toLowerCase() === veiculoEncontrado.placa.toLowerCase())
          );

          if (checklistsDoVeiculo.length > 0) {
            checklistsDoVeiculo.sort((a, b) => {
              const dataA = new Date(a.criadoEm?.$date || a.criadoEm || a.data || 0);
              const dataB = new Date(b.criadoEm?.$date || b.criadoEm || b.data || 0);
              return dataA - dataB;
            });
            ultimoChecklist = checklistsDoVeiculo[checklistsDoVeiculo.length - 1];
          }
        }

        if (ultimoChecklist) {
          setFormData({
            ...ultimoChecklist,
            veiculoId: veiculoEncontrado.id || veiculoEncontrado._id,
            data: new Date().toISOString().split('T')[0],
            hora: new Date().toTimeString().slice(0, 5),
          });

          if (ultimoChecklist.itensInspecao) setItensInspecao(ultimoChecklist.itensInspecao);
          if (ultimoChecklist.danos) setDanos(ultimoChecklist.danos);
          if (ultimoChecklist.acessorios) setAcessorios(ultimoChecklist.acessorios);

          dispararToast("Dados do último checklist carregados com sucesso!");
        } else {
          setFormData((prev) => ({
            ...prev,
            veiculoId: veiculoEncontrado.id || veiculoEncontrado._id,
            placa: veiculoEncontrado.placa || "",
            modelo: veiculoEncontrado.modelo || "",
            marca: veiculoEncontrado.marca || "",
            km: veiculoEncontrado.kmAtual || "",
            data: new Date().toISOString().split('T')[0],
            hora: new Date().toTimeString().slice(0, 5),
          }));
          dispararToast("Veículo selecionado. Nenhum checklist anterior encontrado.");
        }
      } catch (e) {
        setFormData((prev) => ({
          ...prev,
          veiculoId: veiculoEncontrado.id || veiculoEncontrado._id,
          placa: veiculoEncontrado.placa || "",
          modelo: veiculoEncontrado.modelo || "",
          marca: veiculoEncontrado.marca || "",
          km: veiculoEncontrado.kmAtual || "",
          data: new Date().toISOString().split('T')[0],
          hora: new Date().toTimeString().slice(0, 5),
        }));
      }
    }
  };

  const handleLimparTudo = () => {
    setFormData(getInitialFormData());
    setItensInspecao(listaItensInspecao.reduce((acc, item) => ({ ...acc, [item.id]: 'ok' }), {}));
    setDanos({});
    setAcessorios(listaAcessorios.reduce((acc, item) => ({ ...acc, [item]: 'N' }), {}));
    dispararToast("Formulário limpo com sucesso!");
  };

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleInspecaoChange = (id, status) => {
    setItensInspecao((prev) => ({ ...prev, [id]: status }));
  };

  const handleDanoChange = (id, value) => {
    setDanos((prev) => ({ ...prev, [id]: value }));
  };

  const handleAcessorioChange = (item, status) => {
    setAcessorios((prev) => ({ ...prev, [item]: status }));
  };

  const normalizarParaLowercase = (obj) => {
    const formatado = {};
    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        formatado[key] = obj[key].toLowerCase();
      } else {
        formatado[key] = obj[key];
      }
    }
    return formatado;
  };

  const handleCadastrarVeiculo = async (e) => {
    e.preventDefault();
    if (!novoVeiculo.placa || !novoVeiculo.modelo) {
      dispararToast("Informe a placa e o modelo do veículo.", "error");
      return;
    }

    setSalvandoVeiculo(true);
    try {
      const payload = {
        placa: novoVeiculo.placa.toLowerCase(),
        modelo: novoVeiculo.modelo.toLowerCase(),
        marca: (novoVeiculo.marca || "").toLowerCase(),
        kmAtual: novoVeiculo.kmAtual,
      };

      const resultado = await apiFetch('/api/veiculos_frota', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      const veiculoCadastrado = { id: resultado.id || resultado._id, ...payload };
      setVeiculos((prev) => [...prev, veiculoCadastrado]);

      handleSelecionarVeiculo(veiculoCadastrado.id);
      setNovoVeiculo({ placa: "", modelo: "", marca: "", kmAtual: "" });
      setModalVeiculoAberto(false);
      dispararToast("Veículo cadastrado com sucesso no banco!");
    } catch (error) {
      console.error("Erro ao cadastrar veículo:", error);
      dispararToast("Erro ao cadastrar veículo: " + error.message, "error");
    } finally {
      setSalvandoVeiculo(false);
    }
  };

  const handleSalvarChecklist = async (e) => {
    e.preventDefault();
    if (!formData.placa || !formData.condutor) {
      dispararToast("Por favor, preencha a placa e o nome do motorista/condutor.", "error");
      return;
    }

    setSalvandoChecklist(true);
    try {
      const { veiculoId, ...dadosChecklist } = formData;
      
      const payload = {
        ...normalizarParaLowercase(dadosChecklist),
        veiculoId: veiculoId, 
        data: new Date().toISOString().split('T')[0],
        hora: new Date().toTimeString().slice(0, 5),
        itensInspecao,
        danos,
        acessorios,
      };

      await apiFetch('/api/checklist-frota', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      dispararToast("Checklist salvo com sucesso! Novo registro gerado.");
      
      setFormData(getInitialFormData());
      setItensInspecao(listaItensInspecao.reduce((acc, item) => ({ ...acc, [item.id]: 'ok' }), {}));
      setDanos({});
      setAcessorios(listaAcessorios.reduce((acc, item) => ({ ...acc, [item]: 'N' }), {}));

    } catch (error) {
      console.error("Erro ao salvar checklist:", error);
      dispararToast("Falha ao salvar a vistoria: " + error.message, "error");
    } finally {
      setSalvandoChecklist(false);
    }
  };

  const handleImprimir = () => {
    window.print();
    dispararToast("Abrindo painel de impressão do navegador!");
  };

  const handleLogout = async () => {
    try {
      const auth = getAuth();
      await signOut(auth);
      window.location.reload();
    } catch (e) {
      console.error("Erro ao sair:", e);
    }
  };

  return {
    veiculos,
    modalVeiculoAberto,
    setModalVeiculoAberto,
    salvandoVeiculo,
    salvandoChecklist,
    usuarioNome,
    novoVeiculo,
    setNovoVeiculo,
    formData,
    setFormData,
    itensInspecao,
    danos,
    acessorios,
    toast,
    handleSelecionarVeiculo,
    handleLimparTudo,
    handleLimparCompleto: handleLimparTudo,
    handleChange,
    handleInspecaoChange,
    handleDanoChange,
    handleAcessorioChange,
    handleCadastrarVeiculo,
    handleSalvarChecklist,
    handleImprimir,
    handleLogout,
  };
}