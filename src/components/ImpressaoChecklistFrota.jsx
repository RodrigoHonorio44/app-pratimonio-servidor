import React, { useEffect } from 'react';
import toast from 'react-hot-toast';

export default function ImpressaoChecklistFrota({ formData = {}, danos = {}, acessorios = {}, posicoesVistoria = [], listaAcessorios = [], onConcluido }) {
  
  useEffect(() => {
    const janelaVisualizacao = window.open('', '_blank');
    
    if (!janelaVisualizacao) {
      toast.error('O bloqueador de pop-ups impediu a abertura da janela de impressão. Permita pop-ups para este site.');
      if (onConcluido) onConcluido();
      return;
    }

    // Tratamento para exibir a data e hora originais da vistoria ou a atual do sistema
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

    const marcadoresAvariasHtml = posicoesVistoria.map(pos => {
      const tipoDano = danos[pos.id];
      if (!tipoDano) return '';
      return `
        <div style="
            position: absolute;
            top: ${pos.top};
            left: ${pos.left};
            transform: translate(-50%, -50%);
            background-color: #ef4444;
            color: #ffffff;
            font-size: 8px;
            font-weight: bold;
            width: 14px;
            height: 14px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 1px solid #ffffff;
            box-shadow: 0 1px 2px rgba(0,0,0,0.3);
        ">
            ${tipoDano}
        </div>
      `;
    }).join('');

    const descricoesDanos = {
      '1': 'ARRANHADO',
      '2': 'AMASSADO',
      '3': 'PIQUES',
      '4': 'TRINCADO',
      '5': 'QUEBRADO',
      '6': 'FALTA'
    };

    let listaAvariasTextoHtml = '';
    const danosRegistrados = Object.entries(danos).filter(([id, tipo]) => tipo);
    if (danosRegistrados.length > 0) {
      listaAvariasTextoHtml = `
        <div style="margin-top: 4px; margin-bottom: 6px; border: 1px solid #cbd5e1; background: #f8fafc; padding: 4px 6px;">
          <div style="font-weight: bold; font-size: 8px; text-transform: uppercase; margin-bottom: 3px; color: #1e293b;">Detalhamento das Avarias Mapeadas:</div>
          <div style="display: flex; flex-wrap: wrap; gap: 3px 10px;">
            ${danosRegistrados.map(([id, tipo]) => {
              const posicaoObj = posicoesVistoria.find(p => p.id === id);
              const nomeLocal = posicaoObj ? posicaoObj.label.toUpperCase() : id.toUpperCase();
              const nomeDano = descricoesDanos[tipo] || `TIPO ${tipo}`;
              return `
                <div style="font-size: 7.5px; font-weight: bold; width: 31%;">
                  • <span style="color: #0f172a;">${nomeLocal}</span>: <span style="color: #ef4444;">[${tipo}] ${nomeDano}</span>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }

    const conteudoHtml = `
        <!DOCTYPE html>
        <html>
            <head>
                <meta charset="UTF-8">
                <title>Checklist Veicular e Relatório de Frota - Rodhon System</title>
                <style>
                    @page { size: A4; margin: 8mm 10mm; }
                    body { font-family: Arial, sans-serif; margin: 0; padding: 0; color: #000000; line-height: 1.15; font-size: 8.5px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    .documento-container { max-width: 800px; margin: 0 auto; }
                    
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

                    .header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 3px; margin-bottom: 5px; }
                    .header h1 { margin: 0; font-size: 11px; font-weight: 900; text-transform: uppercase; }
                    .header p { margin: 1px 0 0 0; font-size: 7.5px; color: #64748b; text-transform: uppercase; font-weight: bold; letter-spacing: 0.1em; }

                    .table-dados { width: 100%; border-collapse: collapse; margin-bottom: 3px; }
                    .table-dados th, .table-dados td { border: 1px solid #cbd5e1; padding: 2px 4px; font-size: 8.5px; }
                    .table-dados th { background-color: #f8fafc; font-weight: bold; text-transform: uppercase; text-align: left; color: #475569; }
                    .table-dados td { font-weight: bold; }

                    .section-title { font-weight: bold; font-size: 8.5px; text-transform: uppercase; background: #e2e8f0; padding: 2px 4px; margin: 5px 0 3px 0; border-left: 3px solid #2563eb; }

                    .diagrama-box { border: 1px solid #cbd5e1; padding: 6px; background: #ffffff; text-align: center; margin-bottom: 3px; position: relative; display: inline-block; width: 100%; box-sizing: border-box; }
                    .diagrama-img { max-height: 160px; width: auto; max-width: 100%; object-fit: contain; display: inline-block; }
                    .legenda-grid { display: flex; justify-content: space-between; font-size: 7.5px; font-weight: bold; background: #f8fafc; border: 1px solid #cbd5e1; padding: 3px 6px; margin-top: 4px; color: #1e293b; text-transform: uppercase; }

                    .assinaturas { margin-top: 25px; display: flex; justify-content: space-between; page-break-inside: avoid; }
                    .campo-assinatura { width: 45%; text-align: center; }
                    .linha { border-top: 1px solid #0f172a; margin-bottom: 4px; }
                </style>
            </head>
            <body>
                <div class="documento-container">
                    
                    <div class="faixa-logos">
                        <div class="logo-box justify-start">
                            <img src="${baseUrl}/Imagem1.png" alt="Hospital" class="logo-img" onerror="this.style.display='none'" />
                        </div>
                        <div class="logo-box justify-center">
                            <img src="${baseUrl}/Imagem2.png" alt="Avante" class="logo-img" onerror="this.style.display='none'" />
                        </div>
                        <div class="logo-box justify-center">
                            <img src="${baseUrl}/Imagem3.png" alt="Saúde" class="logo-img-h8" onerror="this.style.display='none'" />
                        </div>
                        <div class="logo-box justify-end">
                            <img src="${baseUrl}/Imagem4.png" alt="Maricá" class="logo-img" onerror="this.style.display='none'" />
                        </div>
                    </div>

                    <div class="header">
                        <h1>Checklist Veicular e Relatório de Frota</h1>
                        <p>Data e Hora da Inspeção: ${dataFormatada} • Rodhon System</p>
                    </div>

                    <div class="section-title">1. Identificação do Veículo e Condutor</div>
                    <table class="table-dados">
                        <tr>
                            <th style="width: 12%;">Placa</th>
                            <td style="width: 21%;">${formData.placa ? formData.placa.toUpperCase() : ''}</td>
                            <th style="width: 12%;">Modelo</th>
                            <td style="width: 22%;">${formData.modelo ? formData.modelo.toLowerCase() : ''}</td>
                            <th style="width: 10%;">Ano</th>
                            <td style="width: 23%;">${formData.ano ? formData.ano.toLowerCase() : ''}</td>
                        </tr>
                        <tr>
                            <th>Cor</th>
                            <td>${formData.cor ? formData.cor.toLowerCase() : ''}</td>
                            <th>Condutor</th>
                            <td>${formData.condutor ? formData.condutor.toLowerCase() : ''}</td>
                            <th>KM Atual</th>
                            <td>${formData.km || ''}</td>
                        </tr>
                        <tr>
                            <th>Combustível</th>
                            <td>${formData.combustivel ? formData.combustivel.toLowerCase() : ''}</td>
                            <th>CRLV / Exercício</th>
                            <td colspan="3">SIM (${formData.exercicio || 'N/I'})</td>
                        </tr>
                    </table>

                    <div class="section-title">2. Mapeamento de Avarias e Estado Geral</div>
                    <table class="table-dados" style="margin-bottom: 4px;">
                        <tr>
                            <th style="width: 16%;">Pneu Dianteiro</th>
                            <td style="width: 17%;">${(formData.pneuDianteiro || 'bom').toLowerCase()}</td>
                            <th style="width: 16%;">Pneu Traseiro</th>
                            <td style="width: 17%;">${(formData.pneuTraseiro || 'bom').toLowerCase()}</td>
                            <th style="width: 16%;">Pneu Estepe</th>
                            <td style="width: 18%;">${(formData.pneuEstepe || 'bom').toLowerCase()}</td>
                        </tr>
                    </table>

                    <div class="diagrama-box">
                        <img src="${baseUrl}/carro.jpg" alt="Esquema de Avarias do Veículo" class="diagrama-img" onerror="this.style.display='none'" />
                        ${marcadoresAvariasHtml}
                        <div class="legenda-grid">
                            <span>1 - ARRANHADO</span>
                            <span>2 - AMASSADO</span>
                            <span>3 - PIQUES</span>
                            <span>4 - TRINCADO</span>
                            <span>5 - QUEBRADO</span>
                            <span>6 - FALTA</span>
                        </div>
                    </div>

                    ${listaAvariasTextoHtml}

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

                    <div class="section-title">4. Observações e Avarias Identificadas</div>
                    <div style="border: 1px solid #cbd5e1; padding: 5px; min-height: 25px; font-size: 8.5px; margin-bottom: 6px; background: #f8fafc; font-weight: bold;">
                        ${formData.obs ? formData.obs.toLowerCase() : 'nenhuma observação ou avaria registrada.'}
                    </div>

                    <div class="assinaturas">
                        <div class="campo-assinatura">
                            <div class="linha"></div>
                            <p style="font-weight: bold; text-transform: uppercase; font-size: 7.5px; margin: 0;">Responsável pela Frota / TI</p>
                            <p style="font-size: 6.5px; color: #64748b; margin: 1px 0 0 0;">Rodhon System</p>
                        </div>
                        <div class="campo-assinatura">
                            <div class="linha"></div>
                            <p style="font-weight: bold; font-size: 7.5px; margin: 0;">${formData.condutor ? formData.condutor.toLowerCase() : 'condutor'}</p>
                            <p style="font-size: 6.5px; color: #64748b; margin: 1px 0 0 0;">Motorista Responsável</p>
                        </div>
                    </div>

                </div>
                <script>
                    window.addEventListener('load', function() {
                        setTimeout(function() {
                            window.print();
                        }, 500);
                    });
                </script>
            </body>
        </html>
    `;

    janelaVisualizacao.document.open();
    janelaVisualizacao.document.write(conteudoHtml);
    janelaVisualizacao.document.close();

    if (onConcluido) onConcluido();
  }, []);

  return null;
}