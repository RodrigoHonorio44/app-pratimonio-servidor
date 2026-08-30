import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useReferencias } from '../hooks/useReferencias';
import { CardReferencia } from '../components/CardReferencia';
import Header from '../components/Header';
import Footer from '../components/Footer';

export function PaginaReferencias({ userData }) {
  const navigate = useNavigate();
  const { referencias, categoriaAtiva, setCategoriaAtiva, busca, setBusca } = useReferencias();

  const categorias = [
    { id: 'todos', label: 'todos' },
    { id: 'hospitalar', label: 'hospitalar' },
    { id: 'mobiliario', label: 'mobiliário' },
    { id: 'aco', label: 'aço & estantes' }
  ];

  const handleSelecionarModelo = (modelo) => {
    // Redireciona para a rota correta registrada no AppRoutes (/cadastro-equipamento)
    navigate('/cadastro-equipamento', { state: { modeloSelecionado: modelo } });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <div>
        {/* Componente Header */}
        <Header userData={userData} />

        <main className="p-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">
                catálogo de referência de patrimônios
              </h1>
              <p className="text-sm text-slate-500">
                clique em um item para usar no cadastro ou ver detalhes
              </p>
            </div>

            {/* CONTROLES */}
            <div className="flex flex-col gap-4 mb-8">
              <div className="flex flex-wrap gap-2">
                {categorias.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setCategoriaAtiva(cat.id)}
                    className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors cursor-pointer ${
                      categoriaAtiva === cat.id
                        ? 'bg-sky-600 text-white shadow-sm'
                        : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              <div className="w-full md:w-80">
                <input
                  type="text"
                  placeholder="buscar modelo..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            {/* LISTA DE CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {referencias.map((item) => (
                <CardReferencia
                  key={item.id}
                  item={item}
                  onSelecionar={handleSelecionarModelo}
                />
              ))}
            </div>
          </div>
        </main>
      </div>

      {/* Componente Footer */}
      <Footer />
    </div>
  );
}

export default PaginaReferencias;