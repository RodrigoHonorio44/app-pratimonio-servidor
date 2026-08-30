import React, { useState } from 'react';
import { Printer, Car, Plus, X, Save, CheckCircle2, ArrowLeft, LogOut, User, RotateCcw } from 'lucide-react';
import { useChecklistFrota, listaItensInspecao, listaAcessorios, posicoesVistoria } from '../hooks/useChecklistFrota';
import ImpressaoChecklistFrota from '../components/ImpressaoChecklistFrota';
import toast from 'react-hot-toast';

export default function ChecklistFrota({ onVoltarDashboard }) {
  const [exibirImpressao, setExibirImpressao] = useState(false);

  const {
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
    handleLogout,
    handleLimparCompleto,
  } = useChecklistFrota();

  // Função intermediária para disparar o toast de limpeza
  const executarLimpeza = () => {
    if (typeof handleLimparCompleto === 'function') {
      handleLimparCompleto();
    }
    toast.success("Campos limpos com sucesso!");
  };

  return (
    <div className="bg-slate-100 min-h-screen font-sans flex flex-col">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; padding: 0 !important; }
          .print-container { border: 1px solid #ccc !important; box-shadow: none !important; margin: 0 !important; padding: 15px !important; }
          input, select, textarea { border: none !important; border-bottom: 1px solid #000 !important; border-radius: 0 !important; background: transparent !important; }
        }
      `}</style>

      {/* BARRA DE TOPO PADRÃO - RODHON SYSTEM */}
      <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between no-print shadow-xs">
        <div className="flex flex-col">
          <span className="text-[10px] font-black tracking-widest text-blue-600 uppercase">● Rodhon System</span>
          <h1 className="text-sm font-black italic text-slate-700 tracking-tight">Centro de <span className="font-normal text-slate-500">Operações</span></h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-full">
            <span className="text-[9px] font-bold bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">TI</span>
            <span className="text-xs font-black text-slate-700">{usuarioNome}</span>
            <div className="bg-blue-600 text-white p-1.5 rounded-full ml-1 shadow-sm">
              <User size={14} />
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Sair do Sistema"
            className="text-slate-400 hover:text-rose-600 transition cursor-pointer p-1.5"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="flex-1 p-4 sm:p-6 max-w-5xl mx-auto w-full space-y-6">
        
        {/* NAVEGAÇÃO DE RETORNO */}
        <div className="no-print">
          <button
            type="button"
            onClick={onVoltarDashboard || (() => window.history.back())}
            className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 transition cursor-pointer"
          >
            <ArrowLeft size={14} /> Voltar à Dashboard
          </button>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 print-container space-y-6">
          
          {/* CABEÇALHO DA TELA (MODO WEB) */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-50 border border-slate-200 p-4 rounded-xl gap-4 no-print">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 text-white p-2.5 rounded-xl">
                <Car size={24} />
              </div>
              <div>
                <h2 className="text-sm font-black uppercase text-slate-800 tracking-tight">Central de Vistoria de Frota Veicular</h2>
                <p className="text-xs text-slate-500">Selecione o veículo, avalie os itens e gere o relatório consolidado com data e hora.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setModalVeiculoAberto(true)}
              className="no-print flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm transition cursor-pointer"
            >
              <Plus size={16} /> Cadastrar Novo Veículo
            </button>
          </div>

          <form onSubmit={handleSalvarChecklist} className="space-y-6">
            
            {/* SEÇÃO: INFORMAÇÕES GERAIS E VEÍCULO (ATUALIZADA COM ANO E COR) */}
            <div className="bg-slate-50/50 border border-slate-200 p-4 rounded-xl space-y-4">
              <h3 className="text-xs font-black uppercase text-blue-900 tracking-wider flex items-center gap-2">
                <Car size={16} /> Informações Gerais e Veículo
              </h3>

              <div className="no-print">
                <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Selecione o Veículo Cadastrado (Preenchimento Rápido)</label>
                <select
                  value={formData.veiculoId}
                  onChange={(e) => handleSelecionarVeiculo(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="">-- Escolha um Veículo Cadastrado --</option>
                  {veiculos.map((v) => (
                    <option key={v.id || v._id} value={v.id || v._id}>
                      {v.modelo} {v.marca ? `(${v.marca})` : ""} - Placa: {v.placa}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-6 gap-3">
                <div className="sm:col-span-1">
                  <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Placa</label>
                  <input type="text" id="placa" required value={formData.placa} onChange={handleChange} placeholder="ABC-1234" className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs font-bold uppercase" />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Modelo</label>
                  <input type="text" id="modelo" required value={formData.modelo} onChange={handleChange} placeholder="Ex: Sandero 1.6" className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs" />
                </div>
                <div className="sm:col-span-1">
                  <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Ano</label>
                  <input type="text" id="ano" value={formData.ano || ''} onChange={handleChange} placeholder="Ex: 2022" className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs" />
                </div>
                <div className="sm:col-span-1">
                  <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Cor</label>
                  <input type="text" id="cor" value={formData.cor || ''} onChange={handleChange} placeholder="Ex: Branco" className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs" />
                </div>
                <div className="sm:col-span-1">
                  <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">KM Atual</label>
                  <input type="number" id="km" value={formData.km} onChange={handleChange} placeholder="Ex: 125000" className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-1 gap-3">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Motorista Responsável</label>
                  <input type="text" id="condutor" required value={formData.condutor} onChange={handleChange} placeholder="Nome do Condutor" className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs" />
                </div>
              </div>
            </div>

            {/* SEÇÃO: INSPEÇÃO DOS ITENS DA VISTORIA */}
            <div className="bg-slate-50/50 border border-slate-200 p-4 rounded-xl space-y-4">
              <h3 className="text-xs font-black uppercase text-blue-900 tracking-wider flex items-center gap-2">
                <CheckCircle2 size={16} /> Inspeção dos Itens da Vistoria
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {listaItensInspecao.map((item) => {
                  const atual = itensInspecao[item.id];
                  return (
                    <div key={item.id} className="bg-white border border-slate-200 p-3 rounded-xl flex flex-col justify-between shadow-xs">
                      <span className="text-xs font-bold text-slate-700 mb-2">{item.label}</span>
                      <div className="grid grid-cols-3 gap-1">
                        <button
                          type="button"
                          onClick={() => handleInspecaoChange(item.id, 'ok')}
                          className={`py-1.5 text-[10px] font-black rounded-lg transition cursor-pointer ${
                            atual === 'ok' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          OK
                        </button>
                        <button
                          type="button"
                          onClick={() => handleInspecaoChange(item.id, 'atencao')}
                          className={`py-1.5 text-[10px] font-black rounded-lg transition cursor-pointer ${
                            atual === 'atencao' ? 'bg-amber-500 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          ATENÇÃO
                        </button>
                        <button
                          type="button"
                          onClick={() => handleInspecaoChange(item.id, 'critico')}
                          className={`py-1.5 text-[10px] font-black rounded-lg transition cursor-pointer ${
                            atual === 'critico' ? 'bg-rose-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          CRÍTICO
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* SEÇÃO: DETALHES TÉCNICOS & DESENHO INTERATIVO */}
            <div className="bg-slate-50/50 border border-slate-200 p-4 rounded-xl space-y-4">
              <h3 className="text-xs font-black uppercase text-blue-900 tracking-wider">Mapeamento de Avarias e Estado Geral</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2">
                  <span className="font-bold block text-slate-700">PNEUS:</span>
                  <div className="flex justify-between items-center">
                    <span>Dianteiro:</span>
                    <select id="pneuDianteiro" value={formData.pneuDianteiro} onChange={handleChange} className="border rounded p-1">
                      <option value="b">Bom</option><option value="m">Médio</option><option value="r">Ruim</option>
                    </select>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Traseiro:</span>
                    <select id="pneuTraseiro" value={formData.pneuTraseiro} onChange={handleChange} className="border rounded p-1">
                      <option value="b">Bom</option><option value="m">Médio</option><option value="r">Ruim</option>
                    </select>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Estepe:</span>
                    <select id="pneuEstepe" value={formData.pneuEstepe} onChange={handleChange} className="border rounded p-1">
                      <option value="b">Bom</option><option value="m">Médio</option><option value="r">Ruim</option>
                    </select>
                  </div>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2">
                  <span className="font-bold block text-slate-700">DOCUMENTO (CRLV):</span>
                  <div className="flex gap-4">
                    <label className="cursor-pointer"><input type="radio" name="crlv" value="sim" checked={formData.crlv === 'sim'} onChange={() => setFormData(p => ({ ...p, crlv: 'sim' }))} /> SIM</label>
                    <label className="cursor-pointer"><input type="radio" name="crlv" value="nao" checked={formData.crlv === 'nao'} onChange={() => setFormData(p => ({ ...p, crlv: 'nao' }))} /> NÃO</label>
                  </div>
                  <div>
                    <label className="font-bold block mt-2">EXERCÍCIO:</label>
                    <input type="text" id="exercicio" value={formData.exercicio} onChange={handleChange} className="border p-1 w-full rounded" />
                  </div>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-col justify-between">
                  <span className="font-bold block text-slate-700">NÍVEL DE COMBUSTÍVEL:</span>
                  <select id="combustivel" value={formData.combustivel} onChange={handleChange} className="border p-2 rounded w-full font-bold text-center">
                    <option value="E">Vazio (E)</option>
                    <option value="1/4">1/4</option>
                    <option value="1/2">1/2</option>
                    <option value="3/4">3/4</option>
                    <option value="F">Cheio (F)</option>
                  </select>
                </div>
              </div>

              {/* Desenho do Carro / Mapeamento Responsivo */}
              <div className="bg-white border border-slate-200 p-3 rounded-xl space-y-4">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-700 text-xs">DIAGRAMA DE AVARIAS</span>
                  <span className="text-[10px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded font-medium sm:hidden">
                    Modo Celular (Lista Otimizada)
                  </span>
                </div>

                {/* VISÃO DESKTOP: Imagem com círculos posicionados */}
                <div className="hidden sm:block">
                  <div className="relative w-full max-w-3xl mx-auto flex justify-center items-center p-1 overflow-hidden">
                    <div className="relative inline-block w-full" style={{ minHeight: '260px' }}>
                      <img src="/carro.jpg" alt="Esquema do Veículo" className="w-full h-auto block mx-auto object-contain select-none pointer-events-none" />
                      
                      {posicoesVistoria.map((pos) => (
                        <input
                          key={pos.id}
                          type="text"
                          title={pos.label}
                          maxLength={1}
                          value={danos[pos.id] || ''}
                          onChange={(e) => handleDanoChange(pos.id, e.target.value)}
                          style={{ top: pos.top, left: pos.left }}
                          className="absolute w-6 h-6 -ml-3 -mt-3 border-2 border-blue-600 rounded-full text-center text-xs font-bold bg-white focus:bg-yellow-200 focus:outline-none shadow-sm z-10"
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* VISÃO MOBILE: Lista organizada por peças (Fácil toque no celular) */}
                <div className="block sm:hidden space-y-2">
                  <p className="text-[10px] text-slate-500">Selecione o tipo de avaria para cada parte listada abaixo:</p>
                  <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                    {posicoesVistoria.map((pos) => (
                      <div key={pos.id} className="flex items-center justify-between bg-slate-50 border border-slate-200 p-2 rounded-lg">
                        <span className="text-xs font-semibold text-slate-700 w-1/2">{pos.label}</span>
                        <select
                          value={danos[pos.id] || ''}
                          onChange={(e) => handleDanoChange(pos.id, e.target.value)}
                          className="bg-white border border-slate-300 rounded-md p-1.5 text-xs font-bold text-slate-800 w-1/2"
                        >
                          <option value="">Nenhum (Ok)</option>
                          <option value="1">1 - Arranhado</option>
                          <option value="2">2 - Amassado</option>
                          <option value="3">3 - Piques</option>
                          <option value="4">4 - Trincado</option>
                          <option value="5">5 - Quebrado</option>
                          <option value="6">6 - Falta</option>
                        </select>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Legenda Geral */}
                <div className="text-[10px] font-bold flex flex-wrap justify-between px-2 bg-slate-100 p-2 rounded text-slate-700 gap-1">
                  <span>LEGENDA:</span>
                  <span>1 - ARRANHADO</span>
                  <span>2 - AMASSADO</span>
                  <span>3 - PIQUES</span>
                  <span>4 - TRINCADO</span>
                  <span>5 - QUEBRADO</span>
                  <span>6 - FALTA</span>
                </div>
              </div>
            </div>

            {/* SEÇÃO: ACESSÓRIOS */}
            <div className="bg-slate-50/50 border border-slate-200 p-4 rounded-xl space-y-3">
              <span className="font-black text-xs block uppercase text-blue-900">Acessórios / Equipamentos [(S) SIM | (N) NÃO | (A) AVARIADO]</span>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-x-3 gap-y-1 text-[10px]">
                {listaAcessorios.map((item) => (
                  <div key={item} className="flex items-center justify-between border-b border-slate-200 py-1">
                    <span className="truncate pr-1 text-slate-700">{item}</span>
                    <div className="flex gap-1 font-mono">
                      {['S', 'N', 'A'].map((opt) => (
                        <label key={opt} className="cursor-pointer">
                          <input
                            type="radio"
                            name={`acess_${item}`}
                            checked={acessorios[item] === opt}
                            onChange={() => handleAcessorioChange(item, opt)}
                          /> {opt}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* SEÇÃO: OBSERVAÇÕES */}
            <div className="bg-slate-50/50 border border-slate-200 p-4 rounded-xl space-y-2">
              <label className="font-black text-xs uppercase block text-blue-900">Observações / Avarias Identificadas</label>
              <textarea
                id="obs"
                value={formData.obs}
                onChange={handleChange}
                rows={3}
                placeholder="Descreva arranhões, barulhos ou necessidade de manutenção..."
                className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* BOTÕES DE AÇÃO */}
            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2 no-print">
              <button
                type="button"
                onClick={executarLimpeza}
                className="flex items-center justify-center gap-2 bg-amber-500 text-white font-bold px-6 py-3 rounded-xl hover:bg-amber-600 transition cursor-pointer text-xs"
              >
                <RotateCcw size={16} /> Limpar Campos
              </button>
              <button
                type="button"
                onClick={() => setExibirImpressao(true)}
                className="flex items-center justify-center gap-2 bg-slate-600 text-white font-bold px-6 py-3 rounded-xl hover:bg-slate-700 transition cursor-pointer text-xs"
              >
                <Printer size={16} /> Imprimir Checklist
              </button>
              <button
                type="submit"
                disabled={salvandoChecklist}
                className="flex items-center justify-center gap-2 bg-emerald-600 text-white font-black px-6 py-3 rounded-xl hover:bg-emerald-700 transition cursor-pointer text-xs shadow-md"
              >
                <Save size={16} /> {salvandoChecklist ? "Salvando..." : "FINALIZAR E SALVAR CHECKLIST"}
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* MODAL DE CADASTRO DE VEÍCULO */}
      {modalVeiculoAberto && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-slate-800 flex items-center gap-2 text-sm">
                <Car className="text-blue-600" size={18} />
                Novo Veículo para a Frota
              </h3>
              <button onClick={() => setModalVeiculoAberto(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCadastrarVeiculo} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-600 uppercase mb-1">Placa *</label>
                <input
                  type="text"
                  required
                  value={novoVeiculo.placa}
                  onChange={(e) => setNovoVeiculo({ ...novoVeiculo, placa: e.target.value })}
                  placeholder="EX: KXX-9020"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold uppercase"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 uppercase mb-1">Modelo *</label>
                <input
                  type="text"
                  required
                  value={novoVeiculo.modelo}
                  onChange={(e) => setNovoVeiculo({ ...novoVeiculo, modelo: e.target.value })}
                  placeholder="Ex: Sandero Expression 1.6"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-600 uppercase mb-1">Marca</label>
                  <input
                    type="text"
                    value={novoVeiculo.marca}
                    onChange={(e) => setNovoVeiculo({ ...novoVeiculo, marca: e.target.value })}
                    placeholder="Ex: Renault"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 uppercase mb-1">Ano</label>
                  <input
                    type="text"
                    value={novoVeiculo.ano || novoVeiculo.anoVeiculo || ''}
                    onChange={(e) => setNovoVeiculo({ ...novoVeiculo, ano: e.target.value, anoVeiculo: e.target.value })}
                    placeholder="Ex: 2022/2023"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-600 uppercase mb-1">Cor</label>
                  <input
                    type="text"
                    value={novoVeiculo.cor || ''}
                    onChange={(e) => setNovoVeiculo({ ...novoVeiculo, cor: e.target.value })}
                    placeholder="Ex: Branco"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 uppercase mb-1">KM Inicial</label>
                  <input
                    type="number"
                    value={novoVeiculo.kmAtual}
                    onChange={(e) => setNovoVeiculo({ ...novoVeiculo, kmAtual: e.target.value })}
                    placeholder="120000"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalVeiculoAberto(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-2.5 rounded-xl uppercase transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvandoVeiculo}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl uppercase transition cursor-pointer shadow-sm"
                >
                  {salvandoVeiculo ? "Salvando..." : "Salvar Veículo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* COMPONENTE DE IMPRESSÃO EM NOVA ABA */}
      {exibirImpressao && (
        <ImpressaoChecklistFrota 
          formData={formData}
          danos={danos}
          acessorios={acessorios}
          posicoesVistoria={posicoesVistoria}
          listaAcessorios={listaAcessorios}
          onConcluido={() => setExibirImpressao(false)}
        />
      )}
    </div>
  );
}