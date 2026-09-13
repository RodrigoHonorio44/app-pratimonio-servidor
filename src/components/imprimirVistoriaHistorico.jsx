/**
 * Utilitário isolado para gerar e disparar a impressão de uma vistoria 
 * resgatada diretamente do histórico do calendário.
 * 
 * @param {Object} vistoria - Objeto completo da vistoria vindo do banco (checklistFrota).
 */
export function imprimirVistoriaHistorico(vistoria) {
  if (!vistoria) {
    alert("Nenhuma vistoria selecionada para impressão.");
    return;
  }

  const janelaImpressao = window.open("", "_blank", "width=900,height=1000");

  if (!janelaImpressao) {
    alert("Por favor, permita pop-ups neste navegador para conseguir realizar a impressão.");
    return;
  }

  // Mapeamento dos tipos de avaria
  const TIPOS_AVARIA = {
    1: "arranhado",
    2: "amassado",
    3: "piques",
    4: "trincado",
    5: "quebrado",
    6: "falta"
  };

  // Tratamento de dados (padronização em caixa baixa)
  const placa = (vistoria.placa || vistoria.veiculo?.placa || "---").toLowerCase();
  const modelo = (vistoria.modelo || vistoria.veiculo?.modelo || "---").toLowerCase();
  const ano = vistoria.ano || vistoria.anoModelo || vistoria.veiculo?.ano || "2019/2020";
  const cor = (vistoria.cor || vistoria.veiculo?.cor || "não informada").toLowerCase();
  const condutor = (vistoria.condutor || vistoria.motorista || vistoria.responsavel || "não informado").toLowerCase();
  const km = vistoria.km || vistoria.quilometragem || vistoria.kmAtual || "---";
  const combustivel = (vistoria.combustivel || "1/2").toLowerCase();
  const crlvStatus = (vistoria.crlv ? `${vistoria.crlv} (${vistoria.exercicio || '2026'})` : "sim (2026)").toLowerCase();

  const dataInspecao = vistoria.data || (vistoria.dataHoraInicio ? vistoria.dataHoraInicio.split("T")[0] : "");
  const horaInspecao = vistoria.hora || (vistoria.dataHoraInicio ? new Date(vistoria.dataHoraInicio).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "00:00");

  const pneuDianteiro = (vistoria.pneus?.dianteiro || vistoria.pneuDianteiro || "b").toLowerCase();
  const pneuTraseiro = (vistoria.pneus?.traseiro || vistoria.pneuTraseiro || "b").toLowerCase();
  const pneuEstepe = (vistoria.pneus?.estepe || vistoria.pneuEstepe || "b").toLowerCase();

  const obs = (vistoria.obs || vistoria.observacoes || "nenhuma observação registrada nesta vistoria.").toLowerCase();

  // Mapeamento exato entre a chave gravada no banco (danos) e as posições X/Y (%) da imagem
  const posicoesBolinhas = {
    "sup_capo": { x: 19.5, y: 81.0, label: "capô" },
    "sup_teto": { x: 17.5, y: 44.5, label: "teto" },
    "sup_parabrisa": { x: 14.0, y: 64.0, label: "para-brisa" },
    "sup_porta_malas": { x: 26.5, y: 22.0, label: "porta-malas superior" },
    "front_parachoque": { x: 45.0, y: 84.0, label: "para-choque dianteiro" },
    "front_grade": { x: 45.0, y: 61.5, label: "grade dianteira" },
    "front_farol_dir": { x: 47.0, y: 30.5, label: "farol direito" },
    "front_retrovisores": { x: 14.5, y: 19.5, label: "retrovisor esquerdo" },
    "front_retrovisor_dir": { x: 28.5, y: 47.0, label: "retrovisor direito" },
    "tras_parachoque": { x: 35.5, y: 52.0, label: "para-choque traseiro" },
    "tras_vidro": { x: 33.0, y: 27.5, label: "vidro traseiro" },
    "tras_lanterna_esq": { x: 32.5, y: 35.5, label: "lanterna traseira esquerda" },
    "tras_lanterna_dir": { x: 38.0, y: 35.5, label: "lanterna traseira direita" },
    "lat_esq_frente": { x: 59.5, y: 70.0, label: "lateral dianteira esquerda" },
    "lat_esq_roda_front": { x: 60.5, y: 89.5, label: "roda dianteira esquerda" },
    "lat_esq_porta_front": { x: 70.0, y: 90.0, label: "porta dianteira esquerda" },
    "lat_esq_porta_tras": { x: 76.5, y: 89.0, label: "porta traseira esquerda" },
    "lat_esq_roda_tras": { x: 83.5, y: 82.5, label: "roda traseira esquerda" },
    "lat_esq_tras": { x: 89.5, y: 73.0, label: "lateral traseira esquerda" },
    "lat_dir_frente": { x: 81.5, y: 22.5, label: "lateral dianteira direita" },
    "lat_dir_roda_front": { x: 80.5, y: 50.5, label: "roda dianteira direita" },
    "lat_dir_porta_front": { x: 67.5, y: 50.0, label: "porta dianteira direita" },
    "lat_dir_porta_tras": { x: 74.0, y: 19.0, label: "porta traseira direita" },
    "lat_dir_roda_tras": { x: 59.8, y: 51.5, label: "roda traseira direita" },
    "lat_dir_tras": { x: 57.5, y: 24.5, label: "lateral traseira direita" }
  };

  const danosBanco = vistoria.danos || vistoria.avarias || vistoria.mapeamentoAvarias || {};
  let marcadoresHTML = "";
  let detalhamentoHTML = "";

  Object.entries(danosBanco).forEach(([chave, valor]) => {
    if (valor === undefined || valor === null || valor === "" || valor === "0" || valor === 0) return;

    const codAvaria = String(valor).trim();
    const pos = posicoesBolinhas[chave];
    
    const nomeLocal = pos?.label || chave.replace(/_/g, " ").toLowerCase();
    const nomeTipo = (TIPOS_AVARIA[codAvaria] || `tipo ${codAvaria}`).toLowerCase();

    detalhamentoHTML += `<div>• <b>${nomeLocal}:</b> <span style="color: #dc2626; font-weight: bold;">[${codAvaria}] ${nomeTipo}</span></div>`;

    if (pos) {
      marcadoresHTML += `
        <div style="
          position: absolute;
          left: ${pos.x}%;
          top: ${pos.y}%;
          transform: translate(-50%, -50%);
          width: 16px;
          height: 16px;
          background-color: #dc2626;
          color: #ffffff;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 9px;
          font-weight: bold;
          border: 1.5px solid #ffffff;
          box-shadow: 0 0 2px rgba(0,0,0,0.5);
          z-index: 10;
        ">
          ${codAvaria}
        </div>
      `;
    }
  });

  if (!detalhamentoHTML) {
    detalhamentoHTML = `<div style="color: #64748b;">nenhuma avaria mapeada na lataria.</div>`;
  }

  // Lista dos 36 acessórios
  const listaAcessorios = [
    { nome: "BAGAGITO", chave: "bagagito" },
    { nome: "CALOTA", chave: "calota" },
    { nome: "CHAVE DE RODA", chave: "chaveRoda" },
    { nome: "TRIÂNGULO", chave: "triangulo" },
    { nome: "MACACO", chave: "macaco" },
    { nome: "FAROL AUXILIAR", chave: "farolAuxiliar" },
    { nome: "MANUAL", chave: "manual" },
    { nome: "EXTINTOR", chave: "extintor" },
    { nome: "ALARME", chave: "alarme" },
    { nome: "CHAVE PRINCIPAL", chave: "chavePrincipal" },
    { nome: "CHAVE RESERVA", chave: "chaveReserva" },
    { nome: "TAPETES", chave: "tapetes" },
    { nome: "RÁDIO AM/FM", chave: "radio" },
    { nome: "CD PLAYER", chave: "cdPlayer" },
    { nome: "KIT MULTIMÍDIA", chave: "multimidia" },
    { nome: "AUTO FALANTE", chave: "autoFalante" },
    { nome: "GIROFLEX", chave: "giroflex" },
    { nome: "CARTÃO GPS", chave: "cartaoGps" },
    { nome: "TAGÓGRAFO", chave: "tagografo" },
    { nome: "ANTENA", chave: "antena" },
    { nome: "SANTO ANTÔNIO", chave: "santoAntonio" },
    { nome: "CAPOTA FIBRA", chave: "capotaFibra" },
    { nome: "CAPOTA MARÍTIMA", chave: "capotaMaritima" },
    { nome: "CHAVE SEG. ESTEPE", chave: "chaveSegEstepe" },
    { nome: "PORTA ESCADA", chave: "portaEscada" },
    { nome: "QUEBRA SOL", chave: "quebraSol" },
    { nome: "RETROVISOR INTERNO", chave: "retrovisorInterno" },
    { nome: "FORRO DE PORTA", chave: "forroPorta" },
    { nome: "FORRO DE TETO", chave: "forroTeto" },
    { nome: "FORRO DO PORTA MALAS", chave: "forroPortaMalas" },
    { nome: "BANCO DIANTEIRO", chave: "bancoDianteiro" },
    { nome: "BANCO TRASEIRO", chave: "bancoTraseiro" },
    { nome: "ENCOSTO BANCO TRAS.", chave: "encostoBancoTras" },
    { nome: "PROTETOR DE CARTER", chave: "protetorCarter" },
    { nome: "PLACA VEICULAR", chave: "placaVeicular" },
    { nome: "DIFUSOR DE AR", chave: "difusorAr" }
  ];

  const acs = vistoria.acessorios || {};
  const getSta = (chave, nomeItem) => {
    const val = acs[nomeItem] !== undefined ? acs[nomeItem] : acs[chave];
    if (val === true || val === "S" || val === "s" || val === "sim") return "s";
    if (val === false || val === "N" || val === "n" || val === "nao") return "n";
    return val ? String(val).toLowerCase() : "n";
  };

  let linhasAcessoriosHTML = "";
  for (let i = 0; i < listaAcessorios.length; i += 3) {
    const item1 = listaAcessorios[i];
    const item2 = listaAcessorios[i + 1];
    const item3 = listaAcessorios[i + 2];

    linhasAcessoriosHTML += `
      <tr>
        <td class="bold bg-light" width="23%">${item1 ? item1.nome : ""}</td>
        <td class="center bold uppercase" width="10%">${item1 ? getSta(item1.chave, item1.nome) : ""}</td>
        <td class="bold bg-light" width="23%">${item2 ? item2.nome : ""}</td>
        <td class="center bold uppercase" width="10%">${item2 ? getSta(item2.chave, item2.nome) : ""}</td>
        <td class="bold bg-light" width="24%">${item3 ? item3.nome : ""}</td>
        <td class="center bold uppercase" width="10%">${item3 ? getSta(item3.chave, item3.nome) : ""}</td>
      </tr>
    `;
  }

  const conteudoHtml = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>Checklist Veicular e Relatório de Frota</title>
      <style>
        @page { size: A4 portrait; margin: 5mm; }
        body { font-family: Arial, Helvetica, sans-serif; font-size: 8px; color: #000; margin: 0; padding: 10px; }
        
        .header-images { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #000; padding-bottom: 4px; margin-bottom: 6px; }
        .header-images img { height: 32px; object-fit: contain; }

        .title-block { text-align: center; margin-bottom: 6px; }
        .title-block h1 { font-size: 11px; font-weight: 900; margin: 0; text-transform: uppercase; color: #000; }
        .title-block p { font-size: 8px; font-weight: bold; margin: 2px 0 0 0; color: #333; }

        .section-header { background: #f1f5f9; color: #000; font-weight: 900; padding: 3px 5px; font-size: 8.5px; text-transform: uppercase; border: 1px solid #000; margin-top: 5px; }
        
        table { width: 100%; border-collapse: collapse; margin-bottom: 0px; }
        th, td { border: 1px solid #000; padding: 2px 4px; font-size: 8px; }
        .bg-light { background-color: #f8fafc; }
        .bold { font-weight: bold; }
        .uppercase { text-transform: lowercase; }
        .center { text-align: center; }

        .diagram-container { position: relative; text-align: center; padding: 4px 0; border: 1px solid #000; border-top: none; }
        .car-image { max-width: 100%; height: 135px; object-fit: contain; display: block; margin: 0 auto; }
        
        .avarias-legend { border: 1px solid #000; border-top: none; padding: 3px; font-weight: bold; font-size: 7.5px; text-align: center; background: #fff; }

        .detalhamento-box { border: 1px solid #000; border-top: none; padding: 4px 6px; background: #ffffff; font-size: 8.5px; line-height: 1.4; }
        .detalhamento-title { font-weight: 900; text-transform: uppercase; font-size: 8px; margin-bottom: 2px; color: #1e293b; }

        .signatures { display: flex; justify-content: space-between; margin-top: 25px; padding: 0 30px; }
        .sig-block { text-align: center; width: 42%; border-top: 1px solid #000; padding-top: 2px; font-size: 8px; font-weight: bold; }
      </style>
    </head>
    <body>

      <div class="header-images">
        <img src="/Imagem1.png" alt="Hospital Conde Modesto Leal" />
        <img src="/Imagem2.png" alt="Avante Social" />
        <img src="/Imagem3.png" alt="Secretaria de Saúde" />
        <img src="/Imagem4.png" alt="Prefeitura de Maricá" />
      </div>

      <div class="title-block">
        <h1>CHECKLIST VEICULAR E RELATÓRIO DE FROTA</h1>
        <p>DATA E HORA DA INSPEÇÃO: ${dataInspecao} ÀS ${horaInspecao} • RODHON SYSTEM</p>
      </div>

      <div class="section-header">1. IDENTIFICAÇÃO DO VEÍCULO E CONDUTOR</div>
      <table>
        <tr>
          <td class="bold bg-light" width="12%">PLACA</td>
          <td class="bold uppercase" width="21%">${placa}</td>
          <td class="bold bg-light" width="12%">MODELO</td>
          <td class="bold uppercase" width="21%">${modelo}</td>
          <td class="bold bg-light" width="12%">ANO</td>
          <td class="bold uppercase" width="22%">${ano}</td>
        </tr>
        <tr>
          <td class="bold bg-light">COR</td>
          <td class="bold uppercase">${cor}</td>
          <td class="bold bg-light">CONDUTOR</td>
          <td class="bold uppercase">${condutor}</td>
          <td class="bold bg-light">KM ATUAL</td>
          <td class="bold uppercase">${km}</td>
        </tr>
        <tr>
          <td class="bold bg-light">COMBUSTÍVEL</td>
          <td class="bold uppercase">${combustivel}</td>
          <td class="bold bg-light">CRLV / EXERCÍCIO</td>
          <td class="bold uppercase" colspan="3">${crlvStatus}</td>
        </tr>
      </table>

      <div class="section-header">2. MAPEAMENTO DE AVARIAS E ESTADO GERAL</div>
      <table>
        <tr>
          <td class="bold bg-light" width="20%">PNEU DIANTEIRO</td>
          <td class="bold uppercase center" width="13%">${pneuDianteiro}</td>
          <td class="bold bg-light" width="20%">PNEU TRASEIRO</td>
          <td class="bold uppercase center" width="13%">${pneuTraseiro}</td>
          <td class="bold bg-light" width="20%">PNEU ESTEPE</td>
          <td class="bold uppercase center" width="14%">${pneuEstepe}</td>
        </tr>
      </table>

      <div class="diagram-container">
        <img id="diagrama-carro" src="/carro.jpg" alt="Diagrama Veicular" class="car-image" />
        ${marcadoresHTML}
      </div>

      <div class="avarias-legend">
        1 - ARRANHADO &nbsp;&nbsp;&nbsp;&nbsp; 2 - AMASSADO &nbsp;&nbsp;&nbsp;&nbsp; 3 - PIQUES &nbsp;&nbsp;&nbsp;&nbsp; 4 - TRINCADO &nbsp;&nbsp;&nbsp;&nbsp; 5 - QUEBRADO &nbsp;&nbsp;&nbsp;&nbsp; 6 - FALTA
      </div>

      <div class="detalhamento-box">
        <div class="detalhamento-title">DETALHAMENTO DAS AVARIAS MAPEADAS:</div>
        ${detalhamentoHTML}
      </div>

      <div class="section-header">3. ACESSÓRIOS E EQUIPAMENTOS [ (S) SIM | (N) NÃO | (A) AVARIADO ]</div>
      <table>
        <thead>
          <tr class="bg-light">
            <th width="23%" style="text-align: left;">ITEM</th>
            <th width="10%">STA</th>
            <th width="23%" style="text-align: left;">ITEM</th>
            <th width="10%">STA</th>
            <th width="24%" style="text-align: left;">ITEM</th>
            <th width="10%">STA</th>
          </tr>
        </thead>
        <tbody>
          ${linhasAcessoriosHTML}
        </tbody>
      </table>

      <div class="section-header">4. OBSERVAÇÕES E AVARIAS IDENTIFICADAS</div>
      <table>
        <tr>
          <td style="min-height: 50px; vertical-align: top; padding: 6px; font-size: 10px; line-height: 1.4; font-weight: bold;" class="uppercase">
            ${obs}
          </td>
        </tr>
      </table>

      <div class="signatures">
        <div class="sig-block">
          RESPONSÁVEL PELA FROTA / TI<br>
          <span style="font-size: 7px; font-weight: normal; color: #444;">rodhon system</span>
        </div>
        <div class="sig-block">
          <span class="uppercase">${condutor}</span><br>
          <span style="font-size: 7px; font-weight: normal; color: #444;">motorista responsável</span>
        </div>
      </div>

      <script>
        window.onload = function() {
          var img = document.getElementById('diagrama-carro');
          var dispararImpressao = function() {
            setTimeout(function() {
              window.print();
              window.close();
            }, 300);
          };

          if (img && !img.complete) {
            img.onload = dispararImpressao;
            img.onerror = dispararImpressao;
          } else {
            dispararImpressao();
          }
        };
      </script>
    </body>
    </html>
  `;

  janelaImpressao.document.open();
  janelaImpressao.document.write(conteudoHtml);
  janelaImpressao.document.close();
}