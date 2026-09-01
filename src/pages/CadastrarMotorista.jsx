import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMotoristas } from '../hooks/useMotoristas';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function CadastrarMotoristaPage() {
  const navigate = useNavigate();
  const { motoristas, salvarMotorista, loading } = useMotoristas();

  const [nome, setNome] = useState('');
  const [cnh, setCnh] = useState('');
  const [telefone, setTelefone] = useState('');

  const listaMotoristas = Array.isArray(motoristas) ? motoristas : [];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nome.trim()) return;

    const sucesso = await salvarMotorista({
      nome: nome.toLowerCase().trim(),
      cnh: cnh.trim(),
      telefone: telefone.trim()
    });

    if (sucesso) {
      alert('motorista cadastrado com sucesso!');
      setNome('');
      setCnh('');
      setTelefone('');
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#f8fafc]">
      <Header />

      <main className="flex-grow container mx-auto px-4 py-8 flex flex-col items-center">
        <div className="w-full max-w-2xl mb-4 flex justify-start">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-800 transition"
          >
            ← Voltar à Dashboard
          </button>
        </div>

        <div className="w-full max-w-2xl bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
          <div className="p-6 pb-4 flex items-center justify-between border-b border-slate-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center shadow-md text-white">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-black text-slate-800 uppercase tracking-wide">
                  Cadastro de Motoristas
                </h1>
                <p className="text-xs font-bold text-slate-400 tracking-wider uppercase">
                  Gestão da Equipe de Condutores
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="px-4 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition border border-slate-200 flex items-center gap-1"
            >
              ✕ Fechar
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-[11px] font-bold tracking-wider text-slate-500 uppercase mb-1.5">
                Nome do Motorista <span className="text-blue-600">*</span>
              </label>
              <input
                type="text"
                placeholder="ex: joão da silva"
                value={nome}
                onChange={(e) => setNome(e.target.value.toLowerCase())}
                required
                className="w-full bg-[#f8fafc] border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition placeholder:text-slate-400"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold tracking-wider text-slate-500 uppercase mb-1.5">
                  Nº CNH
                </label>
                <input
                  type="text"
                  placeholder="ex: 12345678900"
                  value={cnh}
                  onChange={(e) => setCnh(e.target.value)}
                  className="w-full bg-[#f8fafc] border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold tracking-wider text-slate-500 uppercase mb-1.5">
                  Telefone
                </label>
                <input
                  type="text"
                  placeholder="ex: 21999998888"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  className="w-full bg-[#f8fafc] border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition placeholder:text-slate-400"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-xl text-sm font-bold hover:bg-blue-700 shadow-md shadow-blue-500/20 transition disabled:opacity-50 mt-2"
            >
              {loading ? 'Cadastrando...' : 'Cadastrar Motorista'}
            </button>
          </form>

          {/* Lista de Motoristas Já Cadastrados */}
          <div className="p-6 bg-[#f8fafc] border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-500 uppercase mb-3">
              Motoristas Cadastrados ({listaMotoristas.length})
            </h3>
            {listaMotoristas.length === 0 ? (
              <p className="text-xs text-slate-400">Nenhum motorista cadastrado ainda.</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {listaMotoristas.map((m) => {
                  const id = m._id?.$oid || m._id || m.id;
                  return (
                    <div key={id} className="bg-white p-3 rounded-xl border border-slate-200 flex justify-between items-center text-xs font-semibold text-slate-700">
                      <span className="capitalize">{m.nome}</span>
                      {m.cnh && <span className="text-slate-400">CNH: {m.cnh}</span>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}