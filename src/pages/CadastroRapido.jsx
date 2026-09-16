import React, { useState, useEffect } from "react";
import { db, auth } from "../services/firebase";
import api from "../services/api";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { toast } from "react-toastify";
import {
  FiBox,
  FiArrowLeft,
  FiSave,
  FiHash,
  FiMapPin,
  FiInfo,
  FiActivity,
  FiPackage,
  FiLayers,
  FiUser
} from "react-icons/fi";

import { MAPA_SETORES_POR_UNIDADE } from "../components/constants/setores";

const CadastroRapido = ({ isOpen, onClose, onSuccess, initialData, isEditing }) => {
  const [loading, setLoading] = useState(false);
  const [verificandoAcesso, setVerificandoAcesso] = useState(true);
  const [nomeUsuario, setNomeUsuario] = useState("");
  const [setorManual, setSetorManual] = useState(false);
  
  // Novos estados para o modo lote
  const [modoLote, setModoLote] = useState(false);
  const [quantidade, setQuantidade] = useState(1);
  const [patrimoniosLote, setPatrimoniosLote] = useState([""]);

  const estadoInicialForm = {
    patrimonio: "",
    nome: "",
    tipo: "Mobiliário",
    setor: "",
    unidade: "",
    estado: "novo",
    observacoes: "",
  };

  const [formData, setFormData] = useState(estadoInicialForm);

  const unidades = Object.keys(MAPA_SETORES_POR_UNIDADE || {});

  // Validação de permissão e autenticação
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const docRef = doc(db, "usuarios", user.uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const data = docSnap.data();
            const role = data.role?.toLowerCase().trim() || "";

            const cargosAutorizados = [
              "root",
              "adm",
              "admin",
              "analista",
              "ti",
            ];

            if (cargosAutorizados.includes(role)) {
              setNomeUsuario(data.nome || "Usuário");
              setVerificandoAcesso(false);
            } else {
              toast.error(
                "Acesso negado: Você não tem permissão de nível técnico."
              );
              if (onClose) onClose();
            }
          } else {
            toast.error("Perfil de usuário não encontrado.");
            if (onClose) onClose();
          }
        } catch (error) {
          console.error("Erro ao validar acesso:", error);
          toast.error("Erro na verificação de segurança.");
          if (onClose) onClose();
        }
      } else {
        if (onClose) onClose();
      }
    });
    return () => unsubscribe();
  }, [onClose]);

  // Atualiza a lista de inputs de patrimônio quando a quantidade muda
  useEffect(() => {
    if (modoLote && quantidade > 1) {
      setPatrimoniosLote((prev) => {
        const novaLista = [...prev];
        if (quantidade > novaLista.length) {
          for (let i = novaLista.length; i < quantidade; i++) {
            novaLista.push("");
          }
        } else {
          novaLista.length = quantidade;
        }
        return novaLista;
      });
    }
  }, [quantidade, modoLote]);

  // Carrega dados para edição ou limpa para novo cadastro
  useEffect(() => {
    if (isEditing && initialData) {
      setModoLote(false); // Edição é sempre unitária
      const unidadeBruta = 
        initialData.unidade || 
        initialData.unidadeAtual || 
        initialData.local || 
        "";

      const unidadeEncontrada = unidades.find(
        (u) => u.toLowerCase().trim() === unidadeBruta.toLowerCase().trim()
      ) || unidadeBruta;

      const setorAtual = initialData.setor || "";

      const setoresUnidade = MAPA_SETORES_POR_UNIDADE[unidadeEncontrada] || [];
      const existeNaLista = setoresUnidade.some(
        (s) => s.toLowerCase().trim() === setorAtual.toLowerCase().trim()
      );

      if (setorAtual && !existeNaLista) {
        setSetorManual(true);
      } else {
        setSetorManual(false);
      }

      setFormData({
        patrimonio: initialData.patrimonio ? String(initialData.patrimonio).trim() : "",
        nome: initialData.nome || "",
        tipo: initialData.tipoItem || initialData.tipo || "Mobiliário",
        unidade: unidadeEncontrada,
        setor: setorAtual,
        estado: (initialData.estado || "novo").toLowerCase(),
        observacoes: initialData.observacoes || "",
      });
    } else {
      setFormData(estadoInicialForm);
      setSetorManual(false);
      setModoLote(false);
      setQuantidade(1);
      setPatrimoniosLote([""]);
    }
  }, [isEditing, initialData, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const acaoTexto = isEditing
      ? "Atualizando ativo..."
      : modoLote && quantidade > 1
      ? `Registrando ${quantidade} ativos em lote...`
      : "Registrando ativo diretamente via API...";

    const idToast = toast.loading(acaoTexto);

    try {
      const token = await auth.currentUser?.getIdToken();
      const headers = { ...(token && { Authorization: `Bearer ${token}` }) };

      if (isEditing && initialData) {
        const idItem = 
          initialData.firebaseId || 
          initialData._id || 
          initialData.id || 
          initialData.equipamentoId || 
          initialData.uid;

        if (!idItem) {
          toast.update(idToast, {
            render: "Erro: ID do equipamento não foi encontrado para edição.",
            type: "error",
            isLoading: false,
            autoClose: 3000,
          });
          setLoading(false);
          return;
        }

        await api.put(
          `/ativos/${idItem}`,
          {
            nome: formData.nome.toLowerCase().trim(),
            setor: formData.setor.toLowerCase().trim(),
            observacoes: formData.observacoes.toLowerCase().trim(),
            patrimonio: formData.patrimonio.trim(),
            unidade: formData.unidade,
            estado: formData.estado.toLowerCase().trim(),
            tipo: "equipamento",
            tipoItem: formData.tipo,
            status: "ativo",
          },
          { headers }
        );

        toast.update(idToast, {
          render: "Ativo atualizado com sucesso!",
          type: "success",
          isLoading: false,
          autoClose: 3000,
        });

        if (onSuccess) onSuccess();
        if (onClose) onClose();
      } else if (modoLote && quantidade > 1) {
        // Envio em lote usando Promise.all ou chamadas sequenciais
        for (let i = 0; i < quantidade; i++) {
          const patrimonioAtual = patrimoniosLote[i] ? patrimoniosLote[i].trim() : `S/P-${i + 1}`;
          await api.post(
            "/ativos",
            {
              nome: formData.nome.toLowerCase().trim(),
              setor: formData.setor.toLowerCase().trim(),
              observacoes: formData.observacoes.toLowerCase().trim(),
              patrimonio: patrimonioAtual,
              unidade: formData.unidade,
              estado: formData.estado.toLowerCase().trim(),
              tipo: "equipamento",
              tipoItem: formData.tipo,
              status: "ativo",
              cadastradoPor: nomeUsuario,
            },
            { headers }
          );
        }

        toast.update(idToast, {
          render: `${quantidade} ativos registrados e alocados com sucesso!`,
          type: "success",
          isLoading: false,
          autoClose: 3000,
        });

        setFormData(estadoInicialForm);
        setSetorManual(false);
        setModoLote(false);
        setQuantidade(1);

        if (onSuccess) onSuccess();
      } else {
        await api.post(
          "/ativos",
          {
            nome: formData.nome.toLowerCase().trim(),
            setor: formData.setor.toLowerCase().trim(),
            observacoes: formData.observacoes.toLowerCase().trim(),
            patrimonio: formData.patrimonio.trim(),
            unidade: formData.unidade,
            estado: formData.estado.toLowerCase().trim(),
            tipo: "equipamento",
            tipoItem: formData.tipo,
            status: "ativo",
            cadastradoPor: nomeUsuario,
          },
          { headers }
        );

        toast.update(idToast, {
          render: "Ativo registrado e alocado com sucesso!",
          type: "success",
          isLoading: false,
          autoClose: 3000,
        });

        setFormData(estadoInicialForm);
        setSetorManual(false);

        if (onSuccess) onSuccess();
      }
    } catch (error) {
      console.error("Erro ao salvar o ativo:", error);
      toast.update(idToast, {
        render:
          error.response?.data?.message ||
          "Erro ao comunicar com o servidor da API",
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  if (verificandoAcesso) {
    return (
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 flex flex-col items-center shadow-2xl">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-600 border-r-4"></div>
          <p className="mt-4 text-blue-600 font-bold uppercase tracking-widest text-xs">
            Validando permissões...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-100 overflow-hidden my-8 max-h-[90vh] flex flex-col">
        
        {/* CABEÇALHO */}
        <div className="p-6 md:p-8 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2.5 rounded-xl text-white shadow-lg shadow-blue-200">
              <FiBox size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">
                {isEditing ? "Editar Equipamento" : "Cadastro Direto no Setor"}
              </h1>
              <p className="text-slate-500 text-xs">
                Registro e alocação imediata de ativo na unidade/setor
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Botão de Alternância para Modo Lote (Apenas em novo cadastro) */}
            {!isEditing && (
              <button
                type="button"
                onClick={() => setModoLote(!modoLote)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  modoLote 
                    ? "bg-amber-50 text-amber-700 border-amber-200" 
                    : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                }`}
              >
                <FiLayers size={14} /> {modoLote ? "Modo Lote Ativo" : "Cadastrar Vários"}
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-all font-medium bg-slate-50 hover:bg-slate-100 px-4 py-2 rounded-xl border border-slate-200 text-sm cursor-pointer"
            >
              <FiArrowLeft /> Voltar
            </button>
          </div>
        </div>

        {/* FORMULÁRIO */}
        <div className="overflow-y-auto p-6 md:p-10 flex-1">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* SE MODO LOTE ESTIVER ATIVADO */}
            {!isEditing && modoLote && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black text-amber-800 uppercase tracking-wider">
                    Configuração de Cadastro em Lote
                  </span>
                  <span className="text-xs font-bold text-amber-700">
                    Total: {quantidade} {quantidade === 1 ? "item" : "itens"}
                  </span>
                </div>
                
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-amber-700 uppercase tracking-widest ml-1 block">
                    Quantidade de itens idênticos a gerar
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={quantidade}
                    onChange={(e) => setQuantidade(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full bg-white border border-amber-300 p-3 rounded-xl outline-none focus:border-amber-600 text-sm font-bold text-slate-700"
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Patrimônio (Aparece se for edição ou cadastro unitário) */}
              {(!modoLote || isEditing) && (
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 block">
                    TAG do Patrimônio
                  </label>
                  <div className="relative">
                    <FiHash
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                      size={18}
                    />
                    <input
                      type="text"
                      required={!modoLote}
                      placeholder="Ex: HMC-1234 ou S/P"
                      className="w-full bg-slate-50 border-2 border-slate-50 p-4 pl-12 rounded-2xl outline-none focus:border-blue-600 focus:bg-white transition-all text-sm font-bold text-slate-700"
                      value={formData.patrimonio}
                      onChange={(e) =>
                        setFormData({ ...formData, patrimonio: e.target.value })
                      }
                    />
                  </div>
                </div>
              )}

              {/* Unidade */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 block">
                  Unidade Atual
                </label>
                <div className="relative">
                  <FiMapPin
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    size={18}
                  />
                  <select
                    required
                    className="w-full bg-slate-50 border-2 border-slate-50 p-4 pl-12 rounded-2xl outline-none focus:border-blue-600 focus:bg-white transition-all cursor-pointer text-sm font-bold text-slate-700 appearance-none"
                    value={formData.unidade}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        unidade: e.target.value,
                        setor: "",
                      });
                    }}
                  >
                    <option value="">Selecione a Unidade...</option>
                    {unidades.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* SEÇÃO DE PATRIMÔNIOS MÚLTIPLOS NO MODO LOTE */}
            {!isEditing && modoLote && quantidade > 1 && (
              <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                  Patrimônios Individuais (Deixe em branco para preencher como S/P automático)
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-48 overflow-y-auto pr-2">
                  {Array.from({ length: quantidade }).map((_, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-500 w-16">#{index + 1}:</span>
                      <input
                        type="text"
                        placeholder={`Patrimônio ${index + 1} (Opcional)`}
                        value={patrimoniosLote[index] || ""}
                        onChange={(e) => {
                          const novaLista = [...patrimoniosLote];
                          novaLista[index] = e.target.value;
                          setPatrimoniosLote(novaLista);
                        }}
                        className="w-full bg-white border border-slate-200 p-2.5 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-blue-600"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Tipo de Item */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 block">
                  Tipo de Item
                </label>
                <div className="relative">
                  <FiInfo
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    size={18}
                  />
                  <select
                    className="w-full bg-slate-50 border-2 border-slate-50 p-4 pl-12 rounded-2xl outline-none focus:border-blue-600 focus:bg-white transition-all cursor-pointer text-sm font-bold text-slate-700 appearance-none"
                    value={formData.tipo}
                    onChange={(e) =>
                      setFormData({ ...formData, tipo: e.target.value })
                    }
                  >
                    <option value="Mobiliário">Mobiliário</option>
                    <option value="Bem durável">Bem durável</option>
                    <option value="Refrigeração">Refrigeração</option>
                    <option value="Informática">Informática</option>
                    <option value="Eletrodoméstico/Eletrônico">Eletrodoméstico/Eletrônico</option>
                    <option value="Equip. Médico">Equipamento Médico</option>
                    <option value="Ferramenta">Ferramenta</option>
                  </select>
                </div>
              </div>

              {/* Setor */}
              <div className="space-y-1">
                <div className="flex justify-between items-center mb-1 px-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {setorManual ? "Digitar Setor" : "Setor / Sala"}
                  </label>
                  <button
                    type="button"
                    onClick={() => setSetorManual(!setorManual)}
                    className="text-[9px] font-black text-blue-600 hover:underline uppercase cursor-pointer"
                  >
                    {setorManual ? "Lista" : "Não achou? Digitar"}
                  </button>
                </div>
                <div className="relative">
                  <FiMapPin
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    size={18}
                  />
                  {setorManual ? (
                    <input
                      type="text"
                      required
                      placeholder="Digite o setor..."
                      className="w-full bg-slate-50 border-2 border-slate-50 p-4 pl-12 rounded-2xl outline-none focus:border-blue-600 focus:bg-white transition-all text-sm font-bold text-slate-700"
                      value={formData.setor}
                      onChange={(e) =>
                        setFormData({ ...formData, setor: e.target.value })
                      }
                    />
                  ) : (
                    <select
                      required
                      disabled={!formData.unidade}
                      className="w-full bg-slate-50 border-2 border-slate-50 p-4 pl-12 rounded-2xl outline-none focus:border-blue-600 focus:bg-white transition-all text-sm font-bold text-slate-700 appearance-none disabled:opacity-50 cursor-pointer"
                      value={formData.setor}
                      onChange={(e) =>
                        setFormData({ ...formData, setor: e.target.value })
                      }
                    >
                      <option value="">
                        {formData.unidade
                          ? "Selecione o setor..."
                          : "Escolha a unidade primeiro"}
                      </option>
                      {(MAPA_SETORES_POR_UNIDADE[formData.unidade] || []).map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            </div>

            {/* Descrição do Equipamento */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 block">
                Descrição do Equipamento
              </label>
              <div className="relative">
                <FiPackage
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  size={18}
                />
                <input
                  type="text"
                  required
                  placeholder="Ex: Cadeira de Escritório, Suporte de Soro..."
                  className="w-full bg-slate-50 border-2 border-slate-50 p-4 pl-12 rounded-2xl outline-none focus:border-blue-600 focus:bg-white transition-all text-sm font-bold text-slate-700"
                  value={formData.nome}
                  onChange={(e) =>
                    setFormData({ ...formData, nome: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Estado de Conservação */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 block">
                Estado de Conservação
              </label>
              <div className="relative">
                <FiActivity
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  size={18}
                />
                <select
                  className="w-full bg-slate-50 border-2 border-slate-50 p-4 pl-12 rounded-2xl outline-none focus:border-blue-600 focus:bg-white transition-all cursor-pointer text-sm font-bold text-slate-700 appearance-none"
                  value={formData.estado}
                  onChange={(e) =>
                    setFormData({ ...formData, estado: e.target.value })
                  }
                >
                  <option value="novo">Novo</option>
                  <option value="bom">Bom</option>
                  <option value="regular">Regular</option>
                  <option value="pessimo">Péssimo</option>
                  <option value="danificado">Danificado</option>
                </select>
              </div>
            </div>

            {/* Observações */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 block">
                Observações Adicionais
              </label>
              <textarea
                rows="3"
                placeholder="Detalhes como marca, cor, número de série..."
                className="w-full bg-slate-50 border-2 border-slate-50 p-4 rounded-2xl outline-none focus:border-blue-600 focus:bg-white transition-all resize-none text-sm font-medium text-slate-700"
                value={formData.observacoes}
                onChange={(e) =>
                  setFormData({ ...formData, observacoes: e.target.value })
                }
              />
            </div>

            {/* Botão de Envio */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl shadow-xl transition-all flex items-center justify-center gap-3 uppercase text-xs active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <FiSave size={16} /> 
                  {isEditing 
                    ? "Atualizar Equipamento" 
                    : modoLote && quantidade > 1 
                    ? `Registrar ${quantidade} Itens em Lote` 
                    : "Finalizar Cadastro Direto"}
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CadastroRapido;