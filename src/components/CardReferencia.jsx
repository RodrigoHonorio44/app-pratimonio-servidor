import React from 'react';

export function CardReferencia({ item, onSelecionar }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow">
      <div className="p-5 flex gap-4">
        <div className="w-1/3 flex items-center justify-center bg-slate-100 rounded-lg p-2">
          <img
            src={item.foto}
            alt={item.nomeModelo}
            className="max-h-36 object-contain"
          />
        </div>

        <div className="w-2/3">
          <span className="text-[10px] font-bold tracking-wider uppercase text-slate-400">
            categoria: {item.categoria}
          </span>
          <h3 className="text-base font-bold text-slate-900 leading-snug uppercase">
            {item.nomeModelo}
          </h3>
          <p className="text-xs text-slate-500 uppercase mb-3">
            {item.subtitulo}
          </p>

          <ul className="text-xs text-slate-600 space-y-1">
            {item.detalhes.map((detalhe, idx) => (
              <li key={idx} className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                {detalhe}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="p-4 pt-0">
        <button
          onClick={() => onSelecionar(item)}
          className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-semibold py-2.5 px-4 rounded-lg text-xs uppercase tracking-wider transition-colors"
        >
          usar este modelo no cadastro
        </button>
      </div>
    </div>
  );
}