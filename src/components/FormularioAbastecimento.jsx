import React from 'react';

export default function FormularioAbastecimento({
  form,
  setForm,
  editandoId,
  loading,
  loadingVeiculos,
  loadingMotoristas,
  listaVeiculos = [],
  listaMotoristas = [],
  handleSelectVeiculo,
  handleSubmit,
  handleLimpar,
  formatarNomeExibicao
}) {
  return (
    <div className="w-full bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
      <div className="p-6 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center shadow-md text-white">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19.77 7.23l.01-.01-3.72-3.72L15 4.56l2.11 2.11C16.17 7 15.5 7.9 15.5 9c0 1.22.8 2.25 1.91 2.61l-.91 5.91c-.06.39.07.78.34 1.06.27.28.66.42 1.05.38l.11-.01c.71-.09 1.25-.69 1.25-1.41V11c1.1 0 2-.9 2-2 0-.55-.22-1.05-.58-1.41zM18.5 9.5c-.28 0-.5-.22-.5-.5s.22-.5.5-.5.5.22.5.5-.22.5-.5.5zM12 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h7c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 10H5V8h7v5z" />
            </svg>
          </div>
          <div>
            <h1 className="text-base font-black text-slate-800 uppercase tracking-wide">
              {editandoId ? 'Editar Abastecimento' : 'Novo Abastecimento'}
            </h1>
            <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
              Controle de Frota
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        {/* Veículo */}
        <div>
          <label className="block text-[11px] font-bold tracking-wider text-slate-500 uppercase mb-1">
            Selecione o Veículo <span className="text-blue-600">*</span>
          </label>
          <select
            value={form.veiculoId || ''}
            onChange={handleSelectVeiculo}
            required
            disabled={loadingVeiculos}
            className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition disabled:opacity-60"
          >
            <option value="">
              {loadingVeiculos ? 'Carregando veículos...' : 'Escolha um veículo...'}
            </option>
            {listaVeiculos.map((v) => {
              const id = v._id?.$oid || v._id || v.id;
              const marca = formatarNomeExibicao ? formatarNomeExibicao(v.marca) : v.marca;
              const modelo = formatarNomeExibicao ? formatarNomeExibicao(v.modelo) : v.modelo;
              
              return (
                <option key={id} value={id}>
                  {marca} {modelo} — PLACA: {v.placa?.toUpperCase()}
                </option>
              );
            })}
          </select>
        </div>

        {/* Motorista */}
        <div>
          <label className="block text-[11px] font-bold tracking-wider text-slate-500 uppercase mb-1">
            Nome do Motorista <span className="text-blue-600">*</span>
          </label>
          <select
            value={form.motorista || ''}
            onChange={(e) => setForm({ ...form, motorista: e.target.value.toLowerCase() })}
            required
            disabled={loadingMotoristas}
            className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition disabled:opacity-60"
          >
            <option value="">
              {loadingMotoristas ? 'Carregando motoristas...' : 'Selecione o motorista...'}
            </option>
            {listaMotoristas.map((m) => {
              const id = m._id?.$oid || m._id || m.id;
              const nome = formatarNomeExibicao ? formatarNomeExibicao(m.nome) : m.nome;

              return (
                <option key={id} value={m.nome ? m.nome.toLowerCase() : ''}>
                  {nome} {m.matricula ? `— Matrícula: ${m.matricula.toUpperCase()}` : ''}
                </option>
              );
            })}
          </select>
        </div>

        {/* Data e Hora */}
        <div>
          <label className="block text-[11px] font-bold tracking-wider text-slate-500 uppercase mb-1">
            Data e Hora do Abastecimento <span className="text-blue-600">*</span>
          </label>
          <input
            type="datetime-local"
            value={form.dataAbastecimento || ''}
            onChange={(e) => setForm({ ...form, dataAbastecimento: e.target.value })}
            required
            className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />
        </div>

        {/* KM Atual e Combustível */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold tracking-wider text-slate-500 uppercase mb-1">
              KM Atual <span className="text-blue-600">*</span>
            </label>
            <input
              type="number"
              placeholder="20000"
              value={form.kmAtual || ''}
              onChange={(e) => setForm({ ...form, kmAtual: e.target.value })}
              required
              className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition placeholder:text-slate-400"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold tracking-wider text-slate-500 uppercase mb-1">
              Combustível
            </label>
            <select
              value={form.tipoCombustivel || 'gasolina'}
              onChange={(e) => setForm({ ...form, tipoCombustivel: e.target.value.toLowerCase() })}
              className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            >
              <option value="gasolina">Gasolina</option>
              <option value="etanol">Etanol</option>
              <option value="diesel">Diesel</option>
              <option value="gnv">GNV</option>
            </select>
          </div>
        </div>

        {/* Litros e Valor Total */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold tracking-wider text-slate-500 uppercase mb-1">
              Litros <span className="text-blue-600">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={form.litros || ''}
              onChange={(e) => setForm({ ...form, litros: e.target.value })}
              required
              className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition placeholder:text-slate-400"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold tracking-wider text-slate-500 uppercase mb-1">
              Valor Total (R$) <span className="text-blue-600">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={form.valorTotal || ''}
              onChange={(e) => setForm({ ...form, valorTotal: e.target.value })}
              required
              className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Checkbox Tanque Cheio */}
        <div className="flex items-center bg-[#f8fafc] p-3 rounded-xl border border-slate-200">
          <input
            type="checkbox"
            id="tanqueCheio"
            checked={!!form.tanqueCheio}
            onChange={(e) => setForm({ ...form, tanqueCheio: e.target.checked })}
            className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
          />
          <label htmlFor="tanqueCheio" className="ml-2 text-[11px] font-bold text-slate-700 cursor-pointer select-none">
            Tanque Cheio (Cálculo preciso KM/L)
          </label>
        </div>

        {/* Botões de Ação */}
        <div className="flex items-center justify-end gap-2 pt-2">
          {editandoId && (
            <button
              type="button"
              onClick={handleLimpar}
              className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-600 font-bold text-xs hover:bg-slate-200 transition cursor-pointer"
            >
              Cancelar
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-5 py-3 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition shadow-md shadow-blue-600/20 disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Salvando...' : editandoId ? 'Atualizar Abastecimento' : 'Salvar Abastecimento'}
          </button>
        </div>
      </form>
    </div>
  );
}