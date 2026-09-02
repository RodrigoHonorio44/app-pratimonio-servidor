import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMotoristas } from '../hooks/useMotoristas';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function CadastrarMotoristaPage() {
  const navigate = useNavigate();
  const { motoristas, salvarMotorista, atualizarMotorista, excluirMotorista, loading } = useMotoristas();

  const [nome, setNome] = useState('');
  const [matricula, setMatricula] = useState('');
  const [telefone, setTelefone] = useState('');
  const [idEditando, setIdEditando] = useState(null);

  // Estados para gerenciar Toast e Modal de Confirmação
  const [toast, setToast] = useState({ exibe: false, mensagem: '', tipo: 'sucesso' });
  const [confirmModal, setConfirmModal] = useState({ exibe: false, id: null, nome: '' });

  const listaMotoristas = Array.isArray(motoristas) ? motoristas : [];

  const mostrarToast = (mensagem, tipo = 'sucesso') => {
    setToast({ exibe: true, mensagem, tipo });
    setTimeout(() => {
      setToast({ exibe: false, mensagem: '', tipo: 'sucesso' });
    }, 3500);
  };

  const aplicarMascaraTelefone = (valor) => {
    const apenasNumeros = String(valor || '').replace(/\D/g, '').slice(0, 11);
    if (apenasNumeros.length <= 2) return apenasNumeros ? `(${apenasNumeros}` : '';
    if (apenasNumeros.length <= 7) return `(${apenasNumeros.slice(0, 2)}) ${apenasNumeros.slice(2)}`;
    return `(${apenasNumeros.slice(0, 2)}) ${apenasNumeros.slice(2, 7)}-${apenasNumeros.slice(7)}`;
  };

  const handleTelefoneChange = (e) => {
    setTelefone(aplicarMascaraTelefone(e.target.value));
  };

  const formatarNomeExibicao = (str) => {
    if (!str) return '';
    return str
      .toLowerCase()
      .split(' ')
      .map((palavra) => palavra.charAt(0).toUpperCase() + palavra.slice(1))
      .join(' ');
  };

  const formatarTelefoneExibicao = (tel) => {
    if (!tel) return '';
    const num = String(tel).replace(/\D/g, '');
    if (num.length === 11) {
      return `(${num.slice(0, 2)}) ${num.slice(2, 7)}-${num.slice(7)}`;
    }
    return tel;
  };

  const resetFormulario = () => {
    setNome('');
    setMatricula('');
    setTelefone('');
    setIdEditando(null);
  };

  const handleEditar = (m) => {
    const id = m._id?.$oid || m._id || m.id;
    setIdEditando(id);
    setNome(m.nome || '');
    setMatricula(m.matricula || '');
    setTelefone(m.telefone ? aplicarMascaraTelefone(m.telefone) : '');
  };

  // Abre o modal customizado em vez do window.confirm
  const solicitarExclusao = (id, nomeMotorista) => {
    setConfirmModal({
      exibe: true,
      id,
      nome: formatarNomeExibicao(nomeMotorista)
    });
  };

  const confirmarExclusao = async () => {
    const { id } = confirmModal;
    setConfirmModal({ exibe: false, id: null, nome: '' });

    const sucesso = await excluirMotorista(id);
    if (sucesso) {
      mostrarToast('Motorista excluído com sucesso!', 'sucesso');
      if (idEditando === id) resetFormulario();
    } else {
      mostrarToast('Erro ao excluir motorista.', 'erro');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nome.trim()) return;

    const digitosTelefone = telefone.replace(/\D/g, '');
    if (digitosTelefone && digitosTelefone.length !== 11) {
      mostrarToast('O telefone deve conter exatamente 11 dígitos no padrão (XX) XXXXX-XXXX', 'erro');
      return;
    }

    const dados = {
      nome: nome.trim().toLowerCase(),
      matricula: matricula.trim().toLowerCase(),
      telefone: digitosTelefone
    };

    let sucesso = false;
    if (idEditando) {
      sucesso = await atualizarMotorista(idEditando, dados);
      if (sucesso) mostrarToast('Motorista atualizado com sucesso!', 'sucesso');
    } else {
      sucesso = await salvarMotorista(dados);
      if (sucesso) mostrarToast('Motorista cadastrado com sucesso!', 'sucesso');
    }

    if (sucesso) {
      resetFormulario();
    } else {
      mostrarToast('Erro ao processar solicitação.', 'erro');
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#f8fafc] relative">
      <Header />

      {/* Componente Toast Flutuante */}
      {toast.exibe && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-white text-sm font-semibold transition-all transform duration-300 ${
            toast.tipo === 'sucesso' ? 'bg-emerald-600' : 'bg-rose-600'
          }`}
        >
          {toast.tipo === 'sucesso' ? (
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          <span>{toast.mensagem}</span>
        </div>
      )}

      {/* Modal Customizado de Confirmação de Exclusão */}
      {confirmModal.exibe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 text-center animate-in fade-in zoom-in duration-200">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-slate-800 mb-1">Confirmar Exclusão</h3>
            <p className="text-xs text-slate-500 mb-6">
              Deseja realmente remover o motorista <strong className="text-slate-700">{confirmModal.nome}</strong>?
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmModal({ exibe: false, id: null, nome: '' })}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmarExclusao}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition shadow-md shadow-rose-500/20"
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}

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
                  {idEditando ? 'Editar Motorista' : 'Cadastro de Motoristas'}
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
                placeholder="ex: caio bom carvalho"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
                className="w-full bg-[#f8fafc] border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition placeholder:text-slate-400"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold tracking-wider text-slate-500 uppercase mb-1.5">
                  Matrícula do Colaborador
                </label>
                <input
                  type="text"
                  placeholder="ex: mat-12345"
                  value={matricula}
                  onChange={(e) => setMatricula(e.target.value)}
                  className="w-full bg-[#f8fafc] border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold tracking-wider text-slate-500 uppercase mb-1.5">
                  Telefone (Celular)
                </label>
                <input
                  type="text"
                  placeholder="(21) 99999-8888"
                  value={telefone}
                  onChange={handleTelefoneChange}
                  maxLength={15}
                  className="w-full bg-[#f8fafc] border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition placeholder:text-slate-400"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 text-white py-3 rounded-xl text-sm font-bold hover:bg-blue-700 shadow-md shadow-blue-500/20 transition disabled:opacity-50"
              >
                {loading ? 'Processando...' : idEditando ? 'Salvar Alterações' : 'Cadastrar Motorista'}
              </button>

              {idEditando && (
                <button
                  type="button"
                  onClick={resetFormulario}
                  className="px-5 bg-slate-200 text-slate-700 py-3 rounded-xl text-sm font-bold hover:bg-slate-300 transition"
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>

          {/* Lista de Motoristas */}
          <div className="p-6 bg-[#f8fafc] border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-500 uppercase mb-3">
              Motoristas Cadastrados ({listaMotoristas.length})
            </h3>
            {listaMotoristas.length === 0 ? (
              <p className="text-xs text-slate-400">Nenhum motorista cadastrado ainda.</p>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {listaMotoristas.map((m) => {
                  const id = m._id?.$oid || m._id || m.id;
                  return (
                    <div key={id} className="bg-white p-3.5 rounded-xl border border-slate-200 flex justify-between items-center text-xs font-semibold text-slate-700 hover:border-slate-300 transition">
                      <div>
                        <div className="font-bold text-slate-800 text-sm">
                          {formatarNomeExibicao(m.nome)}
                        </div>
                        <div className="flex gap-3 text-[11px] text-slate-500 mt-0.5 font-normal">
                          {m.matricula && <span>Matrícula: {m.matricula}</span>}
                          {m.telefone && <span>Tel: {formatarTelefoneExibicao(m.telefone)}</span>}
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleEditar(m)}
                          title="Editar motorista"
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>

                        <button
                          type="button"
                          onClick={() => solicitarExclusao(id, m.nome)}
                          title="Excluir motorista"
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
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