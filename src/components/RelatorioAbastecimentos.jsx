import React, { useState, useMemo } from 'react';

export function RelatorioAbastecimentos({ abastecimentos = [] }) {
  const [filtroMes, setFiltroMes] = useState(
    new Date().toISOString().slice(0, 7)
  );

  const dadosFiltrados = useMemo(() => {
    return abastecimentos.filter((item) => {
      const dataItem = item.dataAbastecimento || item.data || item.createdAt;
      if (!dataItem) return false;
      return dataItem.slice(0, 7) === filtroMes;
    });
  }, [abastecimentos, filtroMes]);

  const resumoCombustivel = useMemo(() => {
    const resumo = {
      etanol: { litros: 0, valor: 0 },
      gasolina: { litros: 0, valor: 0 },
      diesel: { litros: 0, valor: 0 },
      gnv: { litros: 0, valor: 0 }
    };

    dadosFiltrados.forEach((item) => {
      const tipo = (item.tipoCombustivel || item.combustivel || '').toLowerCase().trim();
      const litros = parseFloat(item.litros) || 0;
      const valor = parseFloat(item.valorTotal || item.valor) || 0;

      if (!resumo[tipo]) {
        resumo[tipo] = { litros: 0, valor: 0 };
      }

      resumo[tipo].litros += litros;
      resumo[tipo].valor += valor;
    });

    return resumo;
  }, [dadosFiltrados]);

  const totalGeral = useMemo(() => {
    return dadosFiltrados.reduce(
      (acc, item) => {
        acc.litros += parseFloat(item.litros) || 0;
        acc.valor += parseFloat(item.valorTotal || item.valor) || 0;
        return acc;
      },
      { litros: 0, valor: 0 }
    );
  }, [dadosFiltrados]);

  const handleImprimir = () => {
    window.print();
  };

  const handleExportarCSV = () => {
    let csv = 'Data;Veiculo;Placa;KM;Combustivel;Litros;Valor (RS)\n';

    dadosFiltrados.forEach((item) => {
      const dataRaw = item.dataAbastecimento || item.data || item.createdAt;
      const dataFormatada = dataRaw ? new Date(dataRaw).toLocaleString('pt-BR') : '';
      const modelo = (item.veiculoModelo || item.modelo || item.veiculo || '').toUpperCase();
      const placa = (item.veiculoPlaca || item.placa || '').toUpperCase();
      const km = item.kmAtual || item.km || 0;
      const combustivel = (item.tipoCombustivel || item.combustivel || '').toUpperCase();
      const litros = item.litros || 0;
      const valor = parseFloat(item.valorTotal || item.valor || 0).toFixed(2);

      csv += `${dataFormatada};${modelo};${placa};${km};${combustivel};${litros};${valor}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `relatorio_abastecimentos_${filtroMes}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mt-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 print:hidden">
        <div className="flex items-center gap-3">
          <label htmlFor="select-mes" className="text-sm font-semibold text-gray-700">
            Mês de Referência:
          </label>
          <input
            id="select-mes"
            type="month"
            value={filtroMes}
            onChange={(e) => setFiltroMes(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleExportarCSV}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg text-sm shadow-sm transition-colors flex items-center gap-2 cursor-pointer"
          >
            📊 Extrair Relatório (CSV)
          </button>
          <button
            type="button"
            onClick={handleImprimir}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm shadow-sm transition-colors flex items-center gap-2 cursor-pointer"
          >
            🖨️ Imprimir
          </button>
        </div>
      </div>

      <div className="print:p-0">
        <div className="border-b pb-4 mb-6">
          <h2 className="text-xl font-bold text-gray-800">
            Relatório de Gastos e Consumo de Combustível
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Mês selecionado: <span className="font-semibold text-gray-700">{filtroMes}</span>
          </p>
        </div>

        <div className="mb-8">
          <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-3">
            Totais por Combustível
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {Object.entries(resumoCombustivel).map(([tipo, dados]) => (
              <div key={tipo} className="p-3 border rounded-lg bg-gray-50">
                <p className="text-xs font-bold text-gray-500 uppercase">{tipo}</p>
                <p className="text-lg font-bold text-gray-800 mt-1">
                  R$ {dados.valor.toFixed(2)}
                </p>
                <p className="text-xs text-gray-600">{dados.litros.toFixed(1)} L</p>
              </div>
            ))}

            <div className="p-3 border border-blue-200 rounded-lg bg-blue-50">
              <p className="text-xs font-bold text-blue-600 uppercase">TOTAL GERAL</p>
              <p className="text-lg font-bold text-blue-900 mt-1">
                R$ {totalGeral.valor.toFixed(2)}
              </p>
              <p className="text-xs text-blue-700">{totalGeral.litros.toFixed(1)} L</p>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-3">
            Histórico Detalhado
          </h3>
          {dadosFiltrados.length === 0 ? (
            <p className="text-gray-500 text-sm italic py-4">
              Nenhum abastecimento encontrado para este mês.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-100 text-gray-700 border-b">
                    <th className="p-3">Data</th>
                    <th className="p-3">Veículo / Placa</th>
                    <th className="p-3">KM Atual</th>
                    <th className="p-3">Combustível</th>
                    <th className="p-3 text-right">Litros</th>
                    <th className="p-3 text-right">Valor Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y border-b">
                  {dadosFiltrados.map((item, index) => {
                    const id = item._id?.$oid || item._id || item.id || index;
                    const dataRaw = item.dataAbastecimento || item.data || item.createdAt;
                    return (
                      <tr key={id} className="hover:bg-gray-50">
                        <td className="p-3">
                          {dataRaw ? new Date(dataRaw).toLocaleDateString('pt-BR') : '-'}
                        </td>
                        <td className="p-3 font-medium uppercase">
                          {(item.veiculoModelo || item.modelo || item.veiculo || '')} - {(item.veiculoPlaca || item.placa || '')}
                        </td>
                        <td className="p-3 font-mono">{item.kmAtual || item.km} km</td>
                        <td className="p-3 uppercase">
                          <span className="px-2 py-0.5 text-xs font-semibold rounded bg-gray-100 text-gray-700 border">
                            {item.tipoCombustivel || item.combustivel}
                          </span>
                        </td>
                        <td className="p-3 text-right font-semibold">{item.litros} L</td>
                        <td className="p-3 text-right font-semibold text-emerald-700">
                          R$ {parseFloat(item.valorTotal || item.valor || 0).toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default RelatorioAbastecimentos;