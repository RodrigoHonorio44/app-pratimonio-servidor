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

  const [novoVeiculo, setNovoVeiculo] = useState({
    placa: "",
    modelo: "",
    marca: "",
    kmAtual: "",
  });

  const [formData, setFormData] = useState({
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
    pneuDianteiro: 'Bom',
    pneuTraseiro: 'Bom',
    pneuEstepe: 'Bom',
    crlv: 'sim',
    exercicio: new Date().getFullYear().toString(),
    combustivel: '1/2',
    obs: '',
    condutor: '',
    rg: '',
    telefone: '',
    email: '',
    responsavel: ''
  });

  const [itensInspecao, setItensInspecao] = useState(
    listaItensInspecao.reduce((acc, item) => ({ ...acc, [item.id]: 'ok' }), {})
  );

  const [danos, setDanos] = useState({});
  const [acessorios, setAcessorios] = useState(
    listaAcessorios.reduce((acc, item) => ({ ...acc, [item]: 'N' }), {})
  );

  const apiFetch = async (url, options = {}) => {
    const urlFormatada = encodeURI(url.trim().replace(/\s+/g, '_'));
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

  const handleSelecionarVeiculo = (veiculoId) => {
    if (!veiculoId) {
      setFormData((prev) => ({
        ...prev,
        veiculoId: "",
        placa: "",
        modelo: "",
        marca: "",
        km: "",
      }));
      return;
    }

    const veiculoEncontrado = veiculos.find((v) => String(v.id) === String(veiculoId) || String(v._id) === String(veiculoId));
    if (veiculoEncontrado) {
      setFormData((prev) => ({
        ...prev,
        veiculoId: veiculoEncontrado.id || veiculoEncontrado._id,
        placa: veiculoEncontrado.placa || "",
        modelo: veiculoEncontrado.modelo || "",
        marca: veiculoEncontrado.marca || "",
        km: veiculoEncontrado.kmAtual || "",
      }));
    }
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

  const handleCadastrarVeiculo = async (e) => {
    e.preventDefault();
    if (!novoVeiculo.placa || !novoVeiculo.modelo) {
      alert("Informe a placa e o modelo do veículo.");
      return;
    }

    setSalvandoVeiculo(true);
    try {
      const payload = {
        placa: novoVeiculo.placa,
        modelo: novoVeiculo.modelo,
        marca: novoVeiculo.marca || "",
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
      alert("Veículo cadastrado com sucesso no banco!");
    } catch (error) {
      console.error("Erro ao cadastrar veículo:", error);
      alert("Erro ao cadastrar veículo: " + error.message);
    } finally {
      setSalvandoVeiculo(false);
    }
  };

  const handleSalvarChecklist = async (e) => {
    e.preventDefault();
    if (!formData.placa || !formData.condutor) {
      alert("Por favor, preencha a placa e o nome do motorista/condutor.");
      return;
    }

    setSalvandoChecklist(true);
    try {
      const payload = {
        ...formData,
        itensInspecao,
        danos,
        acessorios,
      };

      await apiFetch('/api/checklist-frota', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      alert("Checklist salvo com sucesso no Banco de Dados!");
    } catch (error) {
      console.error("Erro ao salvar checklist:", error);
      alert("Falha ao salvar a vistoria: " + error.message);
    } finally {
      setSalvandoChecklist(false);
    }
  };

  const handleImprimir = () => {
    const janelaVisualizacao = window.open('', '_blank');
    const dataAtual = new Date().toLocaleDateString('pt-BR');
    const baseUrl = window.location.origin;

    let linhasAcessoriosHtml = '';
    for (let i = 0; i < listaAcessorios.length; i += 3) {
      const item1 = listaAcessorios[i];
      const item2 = listaAcessorios[i + 1];
      const item3 = listaAcessorios[i + 2];

      linhasAcessoriosHtml += `
        <tr>
          <td>${item1 || ''}</td>
          <td style="text-align: center; font-weight: bold;">${item1 ? (acessorios[item1] || 'N') : ''}</td>
          <td>${item2 || ''}</td>
          <td style="text-align: center; font-weight: bold;">${item2 ? (acessorios[item2] || 'N') : ''}</td>
          <td>${item3 || ''}</td>
          <td style="text-align: center; font-weight: bold;">${item3 ? (acessorios[item3] || 'N') : ''}</td>
        </tr>
      `;
    }

    janelaVisualizacao.document.write(`
        <html>
            <head>
                <title>Checklist Veicular e Relatório de Frota - Rodhon System</title>
                <style>
                    @page { size: A4; margin: 8mm 10mm; }
                    body { font-family: Arial, sans-serif; margin: 0; padding: 0; color: #000000; line-height: 1.15; font-size: 8.5px; }
                    .documento-container { max-width: 800px; margin: 0 auto; }
                    
                    /* FAIXA OFICIAL DE LOGOS COM MAIS ESPAÇO E LOGOS MAIORES */
                    .faixa-logos {
                        width: 100%;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding-top: 6px;
                        padding-bottom: 6px;
                        margin-bottom: 6px;
                        border-bottom: 2px solid rgba(0, 0, 0, 0.2);
                    }
                    .logo-box { flex: 1; display: flex; }
                    .justify-start { justify-content: flex-start; }
                    .justify-center { justify-content: center; }
                    .justify-end { justify-content: flex-end; }
                    .logo-img { height: 34px; object-fit: contain; display: block; }
                    .logo-img-h8 { height: 24px; object-fit: contain; display: block; }

                    /* CABEÇALHO */
                    .header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 3px; margin-bottom: 5px; }
                    .header h1 { margin: 0; font-size: 11px; font-weight: 900; text-transform: uppercase; }
                    .header p { margin: 1px 0 0 0; font-size: 7.5px; color: #64748b; text-transform: uppercase; font-weight: bold; letter-spacing: 0.1em; }

                    /* TABELAS */
                    .table-dados { width: 100%; border-collapse: collapse; margin-bottom: 3px; }
                    .table-dados th, .table-dados td { border: 1px solid #cbd5e1; padding: 2px 4px; font-size: 8.5px; }
                    .table-dados th { background-color: #f8fafc; font-weight: bold; text-transform: uppercase; text-align: left; color: #475569; }
                    .table-dados td { font-weight: bold; }

                    .section-title { font-weight: bold; font-size: 8.5px; text-transform: uppercase; background: #e2e8f0; padding: 2px 4px; margin: 5px 0 3px 0; border-left: 3px solid #2563eb; }

                    /* DIAGRAMA DE AVARIAS MAIOR */
                    .diagrama-box { border: 1px solid #cbd5e1; padding: 6px; background: #ffffff; text-align: center; margin-bottom: 6px; }
                    .diagrama-img { max-height: 165px; width: auto; max-width: 100%; object-fit: contain; display: inline-block; }
                    .legenda-grid { display: flex; justify-content: space-between; font-size: 7.5px; font-weight: bold; background: #f8fafc; border: 1px solid #cbd5e1; padding: 3px 6px; margin-top: 5px; color: #1e293b; text-transform: uppercase; }

                    /* ASSINATURAS COM ESPAÇAMENTO AMPLIADO */
                    .assinaturas { margin-top: 35px; display: flex; justify-content: space-between; page-break-inside: avoid; }
                    .campo-assinatura { width: 45%; text-align: center; }
                    .linha { border-top: 1px solid #0f172a; margin-bottom: 4px; }
                </style>
            </head>
            <body>
                <div class="documento-container">
                    
                    <!-- FAIXA DE LOGOS AUMENTADA E AFASTADA -->
                    <div class="faixa-logos">
                        <div class="logo-box justify-start">
                            <img src="${baseUrl}/Imagem1.png" alt="Hospital" class="logo-img" />
                        </div>
                        <div class="logo-box justify-center">
                            <img src="${baseUrl}/Imagem2.png" alt="Avante" class="logo-img" />
                        </div>
                        <div class="logo-box justify-center">
                            <img src="${baseUrl}/Imagem3.png" alt="Saúde" class="logo-img-h8" />
                        </div>
                        <div class="logo-box justify-end">
                            <img src="${baseUrl}/Imagem4.png" alt="Maricá" class="logo-img" />
                        </div>
                    </div>

                    <div class="header">
                        <h1>Checklist Veicular e Relatório de Frota</h1>
                        <p>Data da Inspeção: ${dataAtual} • Rodhon System</p>
                    </div>

                    <!-- DADOS DO VEÍCULO E CONDUTOR -->
                    <div class="section-title">1. Identificação do Veículo e Condutor</div>
                    <table class="table-dados">
                        <tr>
                            <th style="width: 15%;">Placa</th>
                            <td style="width: 35%;">${formData.placa ? formData.placa.toUpperCase() : ''}</td>
                            <th style="width: 15%;">Modelo</th>
                            <td style="width: 35%;">${formData.modelo ? formData.modelo.toUpperCase() : ''}</td>
                        </tr>
                        <tr>
                            <th>Condutor</th>
                            <td>${formData.condutor ? formData.condutor.toUpperCase() : ''}</td>
                            <th>KM Atual</th>
                            <td>${formData.km || ''}</td>
                        </tr>
                        <tr>
                            <th>Combustível</th>
                            <td>${formData.combustivel || ''}</td>
                            <th>CRLV / Exercício</th>
                            <td>SIM (${formData.exercicio || 'N/I'})</td>
                        </tr>
                    </table>

                    <!-- MAPEAMENTO DE AVARIAS E ESQUEMA DO CARRO -->
                    <div class="section-title">2. Mapeamento de Avarias e Estado Geral</div>
                    <table class="table-dados" style="margin-bottom: 4px;">
                        <tr>
                            <th style="width: 16%;">Pneu Dianteiro</th>
                            <td style="width: 17%;">${(formData.pneuDianteiro || 'BOM').toUpperCase()}</td>
                            <th style="width: 16%;">Pneu Traseiro</th>
                            <td style="width: 17%;">${(formData.pneuTraseiro || 'BOM').toUpperCase()}</td>
                            <th style="width: 16%;">Pneu Estepe</th>
                            <td style="width: 18%;">${(formData.pneuEstepe || 'BOM').toUpperCase()}</td>
                        </tr>
                    </table>

                    <div class="diagrama-box">
                        <!-- DIAGRAMA DO CARRO COM TAMANHO OTIMIZADO -->
                        <img src="${baseUrl}/carro.jpg" alt="Esquema de Avarias do Veículo" class="diagrama-img" onerror="this.style.display='none'" />
                        <div class="legenda-grid">
                            <span>1 - ARRANHADO</span>
                            <span>2 - AMASSADO</span>
                            <span>3 - PIQUES</span>
                            <span>4 - TRINCADO</span>
                            <span>5 - QUEBRADO</span>
                            <span>6 - FALTA</span>
                        </div>
                    </div>

                    <!-- ACESSÓRIOS / EQUIPAMENTOS -->
                    <div class="section-title">3. Acessórios e Equipamentos [ (S) Sim | (N) Não | (A) Avariado ]</div>
                    <table class="table-dados">
                        <tr>
                            <th style="width: 28%;">Item</th>
                            <th style="width: 5%; text-align: center;">Sta</th>
                            <th style="width: 28%;">Item</th>
                            <th style="width: 5%; text-align: center;">Sta</th>
                            <th style="width: 28%;">Item</th>
                            <th style="width: 6%; text-align: center;">Sta</th>
                        </tr>
                        ${linhasAcessoriosHtml}
                    </table>

                    <!-- OBSERVAÇÕES -->
                    <div class="section-title">4. Observações e Avarias Identificadas</div>
                    <div style="border: 1px solid #cbd5e1; padding: 5px; min-height: 25px; font-size: 8.5px; margin-bottom: 8px; background: #f8fafc; font-weight: bold;">
                        ${formData.obs ? formData.obs.toUpperCase() : 'NENHUMA OBSERVAÇÃO OU AVARIA REGISTRADA.'}
                    </div>

                    <!-- ASSINATURAS COM ESPAÇAMENTO AMPLIADO -->
                    <div class="assinaturas">
                        <div class="campo-assinatura">
                            <div class="linha"></div>
                            <p style="font-weight: bold; text-transform: uppercase; font-size: 7.5px; margin: 0;">Responsável pela Frota / TI</p>
                            <p style="font-size: 6.5px; color: #64748b; margin: 1px 0 0 0;">Rodhon System</p>
                        </div>
                        <div class="campo-assinatura">
                            <div class="linha"></div>
                            <p style="font-weight: bold; text-transform: uppercase; font-size: 7.5px; margin: 0;">${formData.condutor ? formData.condutor.toUpperCase() : 'CONDUTOR'}</p>
                            <p style="font-size: 6.5px; color: #64748b; margin: 1px 0 0 0;">Motorista Responsável</p>
                        </div>
                    </div>

                </div>
                <script>
                    window.onload = function() {
                        setTimeout(function() {
                            window.print();
                        }, 400);
                    }
                </script>
            </body>
        </html>
    `);
    janelaVisualizacao.document.close();
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
    handleSelecionarVeiculo,
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