import toast from 'react-hot-toast';

export default function gerarEImprimirChecklist({
  formData = {},
  danos = {},
  acessorios = {},
  posicoesVistoria = [],
  listaAcessorios = [],
  onConcluido
}) {
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

  const dataBruta = formData.created_at || formData.data;
  let dataFormatada = '';

  if (dataBruta) {
    const dataObj = new Date(dataBruta);
    if (!isNaN(dataObj)) {
      const dia = String(dataObj.getDate()).padStart(2, '0');
      const mes = String(dataObj.getMonth() + 1).padStart(2, '0');
      const ano = dataObj.getFullYear();
      const hora = dataObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      dataFormatada = `${dia}/${mes}/${ano} às ${hora}`;
    }
  }

  if (!dataFormatada) {
    const dataAtualObj = new Date();
    const dia = String(dataAtualObj.getDate()).padStart(2, '0');
    const mes = String(dataAtualObj.getMonth() + 1).padStart(2, '0');
    const ano = dataAtualObj.getFullYear();
    const hora = dataAtualObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    dataFormatada = `${dia}/${mes}/${ano} às ${hora}`;
  }

  const baseUrl = window.location.origin;

  const motoristaNome = (formData.motorista || formData.condutor || '').toLowerCase();
  const avaliadorNome = (formData.avaliador || formData.vistoriador || '').toLowerCase();
  const responsavelNome = (formData.nomeResponsavel || '').toLowerCase();
  const tipoResponsavel = (formData.tipoResponsavel || formData.cargoResponsavel || '').toLowerCase();

  let nomeAssinaturaEsquerda = '';
  let cargoAssinaturaEsquerda = 'avaliador / vistoriador';
  const assinaturaDinamicaUrl = formData.assinatura || formData.assinaturaDinamica || formData.assinaturaMotorista || formData.assinaturaAvaliador || '';

  if (responsavelNome) {
    nomeAssinaturaEsquerda = responsavelNome;
    if (tipoResponsavel.includes('motorista')) {
      cargoAssinaturaEsquerda = 'motorista responsável';
    } else if (tipoResponsavel.includes('avaliador') || tipoResponsavel.includes('vistoriador')) {
      cargoAssinaturaEsquerda = 'avaliador / vistoriador';
    } else if (tipoResponsavel) {
      cargoAssinaturaEsquerda = tipoResponsavel;
    }
  } else if (avaliadorNome) {
    nomeAssinaturaEsquerda = avaliadorNome;
    cargoAssinaturaEsquerda = 'avaliador / vistoriador';
  } else if (motoristaNome) {
    nomeAssinaturaEsquerda = motoristaNome;
    cargoAssinaturaEsquerda = 'motorista responsável';
  }

  let assinaturaDinamicaHtml = '';
  if (assinaturaDinamicaUrl) {
    assinaturaDinamicaHtml = `<img src="${assinaturaDinamicaUrl}" alt="Assinatura" style="max-height: 48px; max-width: 180px; object-fit: contain; margin-bottom: 2px;" />`;
  } else {
    assinaturaDinamicaHtml = `<div style="height: 48px;"></div>`;
  }

  const itensGrid = listaAcessorios.length > 0 ? listaAcessorios : [
    "BAGAGITO", "CALOTA", "CHAVE DE RODA", "TRIÂNGULO", "MACACO", "FAROL AUXILIAR",
    "MANUAL", "EXTINTOR", "ALARME", "CHAVE PRINCIPAL", "CHAVE RESERVA", "TAPETES",
    "RÁDIO AM/FM", "CD PLAYER", "KIT MULTIMÍDIA", "AUTO FALANTE", "GIROFLEX", "CARTÃO GPS",
    "TAGÓGRAFO", "ANTENA", "SANTO ANTÔNIO", "CAPOTA FIBRA", "CAPOTA MARÍTIMA", "CHAVE SEG. ESTEPE",
    "PORTA ESCADA", "QUEBRA SOL", "RETROVISOR INTERNO", "FORRO DE PORTA", "FORRO DE TETO", "FORRO DO PORTA MALAS",
    "BANCO DIANTEIRO", "BANCO TRASEIRO", "ENCOSTO BANCO TRAS.", "PROTETOR DE CARTER", "PLACA VEICULAR", "DIFUSOR DE AR"
  ];

  let linhasAcessoriosHtml = '';
  for (let i = 0; i < itensGrid.length; i += 3) {
    const item1 = typeof itensGrid[i] === 'object' ? itensGrid[i].nome : itensGrid[i];
    const item2 = typeof itensGrid[i + 1] === 'object' ? itensGrid[i + 1].nome : itensGrid[i + 1];
    const item3 = typeof itensGrid[i + 2] === 'object' ? itensGrid[i + 2].nome : itensGrid[i + 2];

    const key1 = typeof itensGrid[i] === 'object' ? itensGrid[i].chave : item1;
    const key2 = typeof itensGrid[i + 1] === 'object' ? itensGrid[i + 1].chave : item2;
    const key3 = typeof itensGrid[i + 2] === 'object' ? itensGrid[i + 2].chave : item3;

    const getSta = (chave, nome) => {
      if (!chave && !nome) return '';
      const val = acessorios[nome] !== undefined ? acessorios[nome] : acessorios[chave];
      if (val === true || val === "S" || val === "s" || val === "sim") return "s";
      if (val === false || val === "N" || val === "n" || val === "nao") return "n";
      return val ? String(val).toLowerCase() : "n";
    };

    linhasAcessoriosHtml += `
      <tr>
        <td class="bold bg-light" style="width: 28%; font-size: 8px;">${item1 ? String(item1).toLowerCase() : ''}</td>
        <td class="center bold uppercase" style="width: 5%; font-size: 8px;">${item1 ? getSta(key1, item1) : ''}</td>
        <td class="bold bg-light" style="width: 28%; font-size: 8px;">${item2 ? String(item2).toLowerCase() : ''}</td>
        <td class="center bold uppercase" style="width: 5%; font-size: 8px;">${item2 ? getSta(key2, item2) : ''}</td>
        <td class="bold bg-light" style="width: 28%; font-size: 8px;">${item3 ? String(item3).toLowerCase() : ''}</td>
        <td class="center bold uppercase" style="width: 6%; font-size: 8px;">${item3 ? getSta(key3, item3) : ''}</td>
      </tr>
    `;
  }

  const descricoesDanos = {
    '1': 'arranhado',
    '2': 'amassado',
    '3': 'piques',
    '4': 'trincado',
    '5': 'quebrado',
    '6': 'falta'
  };

  let marcadoresAvariasHtml = '';
  let itensAvariasDetalhesHtml = '';

  Object.entries(danos).forEach(([chave, valor]) => {
    if (valor === undefined || valor === null || valor === "" || valor === "0" || valor === 0) return;

    const tipoDano = String(valor).trim();
    let posTop = null;
    let posLeft = null;
    let nomeLocal = chave.replace(/_/g, " ").toLowerCase();

    const posArray = Array.isArray(posicoesVistoria) ? posicoesVistoria.find(p => String(p.id) === String(chave)) : null;

    if (posArray) {
      posTop = posArray.top;
      posLeft = posArray.left;
      if (posArray.label) nomeLocal = posArray.label.toLowerCase();
    } else if (posicoesBolinhas[chave]) {
      posTop = `${posicoesBolinhas[chave].y}%`;
      posLeft = `${posicoesBolinhas[chave].x}%`;
      if (posicoesBolinhas[chave].label) nomeLocal = posicoesBolinhas[chave].label.toLowerCase();
    }

    const nomeDano = descricoesDanos[tipoDano] || `tipo ${tipoDano}`;

    itensAvariasDetalhesHtml += `
      <div style="font-size: 8.5px; font-weight: bold; width: 31%;">
        • <span style="color: #0f172a;">${nomeLocal}</span>: <span style="color: #ef4444;">[${tipoDano}] ${nomeDano}</span>
      </div>
    `;

    if (posTop && posLeft) {
      marcadoresAvariasHtml += `
        <div style="
          position: absolute;
          top: ${posTop};
          left: ${posLeft};
          transform: translate(-50%, -50%);
          background-color: #ef4444;
          color: #ffffff;
          font-size: 9px;
          font-weight: bold;
          width: 15px;
          height: 15px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #ffffff;
          box-shadow: 0 1px 2px rgba(0,0,0,0.4);
          z-index: 10;
        ">
          ${tipoDano}
        </div>
      `;
    }
  });

  let listaAvariasTextoHtml = '';
  if (itensAvariasDetalhesHtml) {
    listaAvariasTextoHtml = `
      <div class="detalhamento-box" style="border-top: none;">
        <div class="detalhamento-title">detalhamento das avarias mapeadas:</div>
        <div style="display: flex; flex-wrap: wrap; gap: 3px 8px;">
          ${itensAvariasDetalhesHtml}
        </div>
      </div>
    `;
  } else {
    listaAvariasTextoHtml = `
      <div class="detalhamento-box" style="border-top: none; color: #64748b;">
        nenhuma avaria mapeada na lataria.
      </div>
    `;
  }

  const termoResponsabilidadeTexto = `declaro para os devidos fins de direito e controle patrimonial que as informações prestadas neste checklist conferem exatidão com o estado físico e operacional apurado no veículo no ato da vistoria. assumo integral responsabilidade pelas condições declaradas.`;

  const conteudoHtml = `
      <!DOCTYPE html>
      <html lang="pt-BR">
          <head>
              <meta charset="UTF-8">
              <title>Checklist Veicular e Relatório de Frota - Rodhon System</title>
              <style>
                  @page { size: A4 portrait; margin: 6mm 8mm; }
                  body { font-family: Arial, Helvetica, sans-serif; margin: 0; padding: 0; color: #000000; font-size: 8px; line-height: 1.2; -webkit-print-color-adjust: exact; print-color-adjust: exact; background: #ffffff; }
                  .documento-container { max-width: 800px; margin: 0 auto; background: #ffffff; }

                  .header-images {
                      width: 100%;
                      display: flex;
                      justify-content: space-between;
                      align-items: center;
                      padding-bottom: 4px;
                      margin-bottom: 5px;
                      border-bottom: 2px solid #000;
                  }
                  .header-images img { height: 30px; object-fit: contain; display: block; }
                  .header-images img.h-menor { height: 22px; }

                  .title-block { text-align: center; border-bottom: 1.5px solid #000; padding-bottom: 3px; margin-bottom: 4px; }
                  .title-block h1 { margin: 0; font-size: 10.5px; font-weight: 900; text-transform: uppercase; color: #000; }
                  .title-block p { margin: 2px 0 0 0; font-size: 8px; color: #333; text-transform: lowercase; font-weight: bold; }

                  .section-header { background: #f1f5f9; color: #000; font-weight: 900; padding: 2.5px 5px; font-size: 8px; text-transform: uppercase; border: 1px solid #000; margin-top: 4px; }

                  table { width: 100%; border-collapse: collapse; margin-bottom: 0; }
                  th, td { border: 1px solid #000; padding: 2px 4px; font-size: 8px; }
                  .bg-light { background-color: #f8fafc; }
                  .bold { font-weight: bold; }
                  .uppercase { text-transform: lowercase; }
                  .center { text-align: center; }

                  .diagram-container { 
                      position: relative; 
                      text-align: center; 
                      padding: 4px 0; 
                      border: 1px solid #000; 
                      border-top: none; 
                      background: #ffffff;
                  }
                  .car-image { max-height: 125px; width: auto; max-width: 100%; object-fit: contain; display: block; margin: 0 auto; }

                  .avarias-legend { border: 1px solid #000; border-top: none; padding: 2px; font-weight: bold; font-size: 7.5px; text-align: center; background: #fff; text-transform: uppercase; }

                  .detalhamento-box { border: 1px solid #000; border-top: none; padding: 3px 5px; background: #ffffff; font-size: 8.5px; }
                  .detalhamento-title { font-weight: 900; text-transform: uppercase; font-size: 7.5px; margin-bottom: 2px; color: #1e293b; }

                  .termo-box { border: 1px solid #000; background: #f8fafc; padding: 4px 6px; margin-top: 4px; margin-bottom: 6px; text-align: justify; font-size: 8px; color: #333; line-height: 1.25; }

                  .signatures { margin-top: 10px; display: flex; justify-content: space-between; page-break-inside: avoid; padding: 0 20px; }
                  .sig-block { width: 42%; text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; border-top: 1px solid #000; padding-top: 2px; font-size: 8px; font-weight: bold; }
              </style>
          </head>
          <body>
              <div class="documento-container">

                  <div class="header-images">
                      <img src="${baseUrl}/Imagem1.png" alt="Hospital" onerror="this.style.display='none'" />
                      <img src="${baseUrl}/Imagem2.png" alt="Avante" onerror="this.style.display='none'" />
                      <img src="${baseUrl}/Imagem3.png" alt="Saúde" class="h-menor" onerror="this.style.display='none'" />
                      <img src="${baseUrl}/Imagem4.png" alt="Maricá" onerror="this.style.display='none'" />
                  </div>

                  <div class="title-block">
                      <h1>checklist veicular e relatório de frota</h1>
                      <p>data e hora da inspeção: ${dataFormatada} • rodhon system</p>
                  </div>

                  <div class="section-header">1. identificação do veículo e condutor</div>
                  <table>
                      <tr>
                          <td class="bold bg-light" style="width: 12%;">placa</td>
                          <td class="bold uppercase" style="width: 21%;">${formData.placa ? formData.placa.toLowerCase() : '---'}</td>
                          <td class="bold bg-light" style="width: 12%;">modelo</td>
                          <td class="bold uppercase" style="width: 21%;">${formData.modelo ? formData.modelo.toLowerCase() : '---'}</td>
                          <td class="bold bg-light" style="width: 12%;">ano</td>
                          <td class="bold uppercase" style="width: 22%;">${formData.ano ? String(formData.ano).toLowerCase() : '---'}</td>
                      </tr>
                      <tr>
                          <td class="bold bg-light">cor</td>
                          <td class="bold uppercase">${formData.cor ? formData.cor.toLowerCase() : '---'}</td>
                          <td class="bold bg-light">condutor</td>
                          <td class="bold uppercase">${formData.condutor ? formData.condutor.toLowerCase() : '---'}</td>
                          <td class="bold bg-light">km atual</td>
                          <td class="bold uppercase">${formData.km || '---'}</td>
                      </tr>
                      <tr>
                          <td class="bold bg-light">combustível</td>
                          <td class="bold uppercase">${formData.combustivel ? formData.combustivel.toLowerCase() : '---'}</td>
                          <td class="bold bg-light">crlv / exercício</td>
                          <td class="bold uppercase" colspan="3">sim (${formData.exercicio || '2026'})</td>
                      </tr>
                  </table>

                  <div class="section-header">2. mapeamento de avarias e estado geral</div>
                  <table>
                      <tr>
                          <td class="bold bg-light" style="width: 20%;">pneu dianteiro</td>
                          <td class="bold uppercase center" style="width: 13%;">${(formData.pneuDianteiro || 'bom').toLowerCase()}</td>
                          <td class="bold bg-light" style="width: 20%;">pneu traseiro</td>
                          <td class="bold uppercase center" style="width: 13%;">${(formData.pneuTraseiro || 'bom').toLowerCase()}</td>
                          <td class="bold bg-light" style="width: 20%;">pneu estepe</td>
                          <td class="bold uppercase center" style="width: 14%;">${(formData.pneuEstepe || 'bom').toLowerCase()}</td>
                      </tr>
                  </table>

                  <div class="diagram-container">
                      <img id="diagrama-carro" src="${baseUrl}/carro.jpg" alt="Esquema de Avarias do Veículo" class="car-image" onerror="this.style.display='none'" />
                      ${marcadoresAvariasHtml}
                  </div>

                  <div class="avarias-legend">
                      1 - ARRANHADO &nbsp;&nbsp;&nbsp;&nbsp; 2 - AMASSADO &nbsp;&nbsp;&nbsp;&nbsp; 3 - PIQUES &nbsp;&nbsp;&nbsp;&nbsp; 4 - TRINCADO &nbsp;&nbsp;&nbsp;&nbsp; 5 - QUEBRADO &nbsp;&nbsp;&nbsp;&nbsp; 6 - FALTA
                  </div>

                  ${listaAvariasTextoHtml}

                  <div class="section-header">3. acessórios e equipamentos [ (s) sim | (n) não | (a) avariado ]</div>
                  <table>
                      <thead>
                          <tr class="bg-light">
                              <th style="width: 28%; text-align: left;">item</th>
                              <th style="width: 5%;">sta</th>
                              <th style="width: 28%; text-align: left;">item</th>
                              <th style="width: 5%;">sta</th>
                              <th style="width: 28%; text-align: left;">item</th>
                              <th style="width: 6%;">sta</th>
                          </tr>
                      </thead>
                      <tbody>
                          ${linhasAcessoriosHtml}
                      </tbody>
                  </table>

                  <div class="section-header">4. observações e avarias identificadas</div>
                  <table>
                      <tr>
                          <td style="min-height: 35px; vertical-align: top; padding: 4px; font-size: 8.5px; line-height: 1.3; font-weight: bold;" class="uppercase">
                              ${formData.obs ? formData.obs.toLowerCase() : 'nenhuma observação ou avaria registrada.'}
                          </td>
                      </tr>
                  </table>

                  <div class="termo-box">
                      <strong>termo de responsabilidade:</strong> ${termoResponsabilidadeTexto}
                  </div>

                  <div class="signatures">
                      <div class="sig-block">
                          ${assinaturaDinamicaHtml}
                          <span class="uppercase">${nomeAssinaturaEsquerda || '---'}</span><br>
                          <span style="font-size: 7px; font-weight: normal; color: #444; text-transform: lowercase;">${cargoAssinaturaEsquerda}</span>
                      </div>
                      <div class="sig-block">
                          <div style="height: 48px;"></div>
                          <span>coordenação de patrimônio</span><br>
                          <span style="font-size: 7px; font-weight: normal; color: #444; text-transform: lowercase;">visto e recebimento</span>
                      </div>
                  </div>

              </div>

              <script>
                  window.addEventListener('DOMContentLoaded', function() {
                      var img = document.getElementById('diagrama-carro');
                      
                      function dispararImpressao() {
                          setTimeout(function() {
                              window.print();
                              
                              window.addEventListener('focus', function() {
                                  setTimeout(function() {
                                      try { window.close(); } catch(e) {}
                                  }, 500);
                              }, { once: true });
                          }, 500);
                      }

                      if (img && !img.complete) {
                          img.onload = dispararImpressao;
                          img.onerror = dispararImpressao;
                      } else {
                          dispararImpressao();
                      }
                  });
              </script>
          </body>
      </html>
  `;

  const janelaImpressao = window.open('', '_blank', 'width=900,height=650');
  
  if (janelaImpressao) {
    janelaImpressao.document.open();
    janelaImpressao.document.write(conteudoHtml);
    janelaImpressao.document.close();
    janelaImpressao.focus();
  } else {
    toast.error('o navegador bloqueou a janela de impressão. permita pop-ups para este site.');
  }

  if (onConcluido) onConcluido();
}