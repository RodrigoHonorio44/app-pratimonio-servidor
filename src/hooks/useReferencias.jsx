import { useState } from 'react';

// dados dos modelos com caminhos para public/modelos/
const dadosReferencias = [
  {
    id: "ref_maca_fixa",
    categoria: "hospitalar",
    nomeModelo: "maca fixa tubular",
    subtitulo: "modelo padrao com leito estofado",
    foto: "/modelos/maca-fixa.jpg",
    detalhes: [
      "cabeceira articulavel",
      "estrutura tubular pintada",
      "estofado preto",
      "pes fixos com ponteiras"
    ]
  },
  {
    id: "ref_carro_padiola",
    categoria: "hospitalar",
    nomeModelo: "carro padiola com rodizios",
    subtitulo: "modelo de transporte",
    foto: "/modelos/carro-padiola.jpg",
    detalhes: [
      "com rodizio de 5 polegadas",
      "grade lateral de protecao",
      "suporte de soro"
    ]
  },
  {
    id: "ref_cadeira_pres",
    categoria: "mobiliario",
    nomeModelo: "cadeira presidente mesh",
    subtitulo: "modelo executivo alto com apoio de cabeca",
    foto: "/modelos/cadeira-presidente.jpg",
    detalhes: [
      "assento em tecido",
      "base giratoria",
      "regulagem de altura",
      "rodizios anti-risco"
    ]
  },
  {
    id: "ref_armario_aco",
    categoria: "aco",
    nomeModelo: "armario de aco 2 portas",
    subtitulo: "modelo escritorio ou hospitalar",
    foto: "/modelos/armario-aco.jpg",
    detalhes: [
      "tres prateleiras regulaveis",
      "pintura epoxi cinza",
      "fechadura com chave"
    ]
  }
];

export function useReferencias() {
  const [categoriaAtiva, setCategoriaAtiva] = useState('todos');
  const [busca, setBusca] = useState('');

  const referenciasFiltradas = dadosReferencias.filter((item) => {
    const bateCategoria = categoriaAtiva === 'todos' || item.categoria === categoriaAtiva;
    const bateBusca = item.nomeModelo.toLowerCase().includes(busca.toLowerCase()) ||
                      item.subtitulo.toLowerCase().includes(busca.toLowerCase());
    return bateCategoria && bateBusca;
  });

  return {
    referencias: referenciasFiltradas,
    categoriaAtiva,
    setCategoriaAtiva,
    busca,
    setBusca
  };
}