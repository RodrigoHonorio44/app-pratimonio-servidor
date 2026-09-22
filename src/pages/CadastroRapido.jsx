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
  FiRefreshCw
} from "react-icons/fi";

import { useSetores } from "../components/constants/setores";

const CadastroRapido = ({ isOpen, onClose, onSuccess, initialData, isEditing }) => {
  const [loading, setLoading] = useState(false);
  const [verificandoAcesso, setVerificandoAcesso] = useState(true);
  const [nomeUsuario, setNomeUsuario] = useState("");
  const [setorManual, setSetorManual] = useState(false);
  
  // Consome o hook dinâmico de setores
  const { unidades, mapaSetores } = useSetores();

  // Opção para manter Unidade e Setor para o próximo cadastro
  const [manterSetor, setManterSetor] = useState(true);

  // Modo lote (itens iguais)
  const [modoLote, setModoLote] = useState(false);
  const [quantidade, setQuantidade] = useState(1);
  const [patrimoniosLote, setPatrimoniosLote] = useState([""]);

  const estadoInicialForm = {
    patrimonio: "",
    nome: "",
    tipo: "mobiliário",
    setor: "",
    unidade: "",
    estado: "novo",
    observacoes: "",
  };

  const [formData, setFormData] = useState(estadoInicialForm);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const docRef = doc(db, "usuarios", user.uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const data = docSnap.data();
            const role = data.role?.toLowerCase().trim() || "";
            const cargosAutorizados = ["root", "adm", "admin", "analista", "ti"];

            if (cargosAutorizados.includes(role)) {
              setNomeUsuario(data.nome || "Usuário");
              setVerificandoAcesso(false);
            } else {
              toast.error("acesso negado: você não tem permissão de nível técnico.");
              if (onClose) onClose();
            }
          } else {
            toast.error("perfil de usuário não encontrado.");
            if (onClose) onClose();
          }
        } catch (error) {
          console.error("erro ao validar acesso:", error);
          toast.error("erro na verificação de segurança.");
          if (onClose) onClose();
        }
      } else {
        if (onClose) onClose();
      }
    });
    return () => unsubscribe();
  }, [onClose]);

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

  useEffect(() => {
    if (isEditing && initialData) {
      setModoLote(false);
      const unidadeBruta = initialData.unidade || initialData.unidadeAtual || initialData.local || "";
      const unidadeEncontrada = unidades.find(
        (u) => u.toLowerCase().trim() === unidadeBruta.toLowerCase().trim()
      ) || unidadeBruta;

      const setorAtual = initialData.setor || "";
      const setoresUnidade = mapaSetores[unidadeEncontrada] || [];
      const existeNaLista = setoresUnidade.some(
        (s) => s.toLowerCase().trim() === setorAtual.toLowerCase().trim()
      );

      setSetorManual(Boolean(setorAtual && !existeNaLista));

      setFormData({
        patrimonio: initialData.patrimonio ? String(initialData.patrimonio).trim().toLowerCase() : "",
        nome: (initialData.nome || "").toLowerCase(),
        tipo: (initialData.tipoItem || initialData.tipo || "mobiliário").toLowerCase(),
        unidade: unidadeEncontrada.toLowerCase(),
        setor: setorAtual.toLowerCase(),
        estado: (initialData.estado || "novo").toLowerCase(),
        observacoes: (initialData.observacoes || "").toLowerCase(),
      });
    } else {
      setFormData(estadoInicialForm);
      setSetorManual(false);
      setModoLote(false);
      setQuantidade(1);
      setPatrimoniosLote([""]);
    }
  }, [isEditing, initialData, isOpen, unidades, mapaSetores]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const acaoTexto = isEditing
      ? "atualizando ativo..."
      : modoLote && quantidade > 1
      ? `registrando ${quantidade} ativos em lote...`
      : "registrando ativo...";

    const idToast = toast.loading(acaoTexto);

    try {
      const token = await auth.currentUser?.getIdToken();
      const headers = { ...(token && { Authorization: `Bearer ${token}` }) };

      if (isEditing && initialData) {
        const idItem = initialData.firebaseId || initialData._id || initialData.id || initialData.equipamentoId || initialData.uid;

        if (!idItem) {
          toast.update(idToast, {
            render: "erro: id do equipamento não foi encontrado para edição.",
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
            patrimonio: formData.patrimonio.toLowerCase().trim(),
            unidade: formData.unidade.toLowerCase().trim(),
            estado: formData.estado.toLowerCase().trim(),
            tipo: "equipamento",
            tipoItem: formData.tipo.toLowerCase().trim(),
            status: "ativo",
          },
          { headers }
        );

        toast.update(idToast, {
          render: "ativo atualizado com sucesso!",
          type: "success",
          isLoading: false,
          autoClose: 3000,
        });

        if (onSuccess) onSuccess();
        if (onClose) onClose();
      } else if (modoLote && quantidade > 1) {
        for (let i = 0; i < quantidade; i++) {
          const patrimonioAtual = patrimoniosLote[i] ? patrimoniosLote[i].toLowerCase().trim() : `s/p-${i + 1}`;
          await api.post(
            "/ativos",
            {
              nome: formData.nome.toLowerCase().trim(),
              setor: formData.setor.toLowerCase().trim(),
              observacoes: formData.observacoes.toLowerCase().trim(),
              patrimonio: patrimonioAtual,
              unidade: formData.unidade.toLowerCase().trim(),
              estado: formData.estado.toLowerCase().trim(),
              tipo: "equipamento",
              tipoItem: formData.tipo.toLowerCase().trim(),
              status: "ativo",
              cadastradoPor: nomeUsuario.toLowerCase(),
            },
            { headers }
          );
        }

        toast.update(idToast, {
          render: `${quantidade} ativos registrados com sucesso!`,
          type: "success",
          isLoading: false,
          autoClose: 3000,
        });

        if (manterSetor) {
          setFormData((prev) => ({
            ...estadoInicialForm,
            unidade: prev.unidade,
            setor: prev.setor,
          }));
        } else {
          setFormData(estadoInicialForm);
        }

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
            patrimonio: formData.patrimonio.toLowerCase().trim(),
            unidade: formData.unidade.toLowerCase().trim(),
            estado: formData.estado.toLowerCase().trim(),
            tipo: "equipamento",
            tipoItem: formData.tipo.toLowerCase().trim(),
            status: "ativo",
            cadastradoPor: nomeUsuario.toLowerCase(),
          },
          { headers }
        );

        toast.update(idToast, {
          render: "ativo registrado com sucesso!",
          type: "success",
          isLoading: false,
          autoClose: 3000,
        });

        if (manterSetor) {
          setFormData((prev) => ({
            ...estadoInicialForm,
            unidade: prev.unidade,
            setor: prev.setor,
          }));
        } else {
          setFormData(estadoInicialForm);
        }

        if (onSuccess) onSuccess();
      }
    } catch (error) {
      console.error("erro ao salvar ativo:", error);
      toast.update(idToast, {
        render: error.response?.data?.message || "erro ao comunicar com o servidor da api",
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
            validando permissões...
          </p>
        </div>
      </div>
    );
  }

  // Obtém lista de setores baseada na unidade atualmente selecionada
  const setoresMapeados = mapaSetores[formData.unidade] || [];

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
                {isEditing ? "editar equipamento" : "cadastro direto no setor"}
              </h1>
              <p className="text-slate-500 text-xs">
                registro e alocação imediata de ativo na unidade/setor
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
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
                <FiLayers size={14} /> {modoLote ? "modo lote ativo" : "cadastrar vários iguais"}
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-all font-medium bg-slate-50 hover:bg-slate-100 px-4 py-2 rounded-xl border border-slate-200 text-sm cursor-pointer"
            >
              <FiArrowLeft /> voltar
            </button>
          </div>
        </div>

        {/* FORMULÁRIO */}
        <div className="overflow-y-auto p-6 md:p-10 flex-1">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Opção para manter local ao cadastrar itens sequenciais */}
            {!isEditing && (
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FiRefreshCw className="text-blue-600" size={18} />
                  <div>
                    <p className="text-xs font-bold text-blue-900">modo de cadastro sequencial</p>
                    <p className="text-[11px] text-blue-700">mantém a unidade e o setor preenchidos ao salvar para cadastrar o próximo item.</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={manterSetor} 
                    onChange={(e) => setManterSetor(e.target.checked)} 
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            )}

            {/* SE MODO LOTE ESTIVER ATIVADO */}
            {!isEditing && modoLote && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black text-amber-800 uppercase tracking-wider">
                    configuração de cadastro em lote (itens idênticos)
                  </span>
                  <span className="text-xs font-bold text-amber-700">
                    total: {quantidade} {quantidade === 1 ? "item" : "itens"}
                  </span>
                </div>
                
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-amber-700 uppercase tracking-widest ml-1 block">
                    quantidade de itens idênticos a gerar
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
              
              {/* Patrimônio */}
              {(!modoLote || isEditing) && (
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 block">
                    tag do patrimônio
                  </label>
                  <div className="relative">
                    <FiHash
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                      size={18}
                    />
                    <input
                      type="text"
                      required={!modoLote}
                      placeholder="ex: hmc-1234 ou s/p"
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
                  unidade atual
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
                    <option value="">selecione a unidade...</option>
                    {unidades.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Patrimônios no modo lote */}
            {!isEditing && modoLote && quantidade > 1 && (
              <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                  patrimônios individuais
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-48 overflow-y-auto pr-2">
                  {Array.from({ length: quantidade }).map((_, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-500 w-16">#{index + 1}:</span>
                      <input
                        type="text"
                        placeholder={`patrimônio ${index + 1} (opcional)`}
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
                  tipo de item
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
                    <option value="mobiliário">mobiliário</option>
                    <option value="bem durável">bem durável</option>
                    <option value="refrigeração">refrigeração</option>
                    <option value="informática">informática</option>
                    <option value="eletrodoméstico/eletrônico">eletrodoméstico/eletrônico</option>
                    <option value="equipamento médico">equipamento médico</option>
                    <option value="ferramenta">ferramenta</option>
                  </select>
                </div>
              </div>

              {/* Setor */}
              <div className="space-y-1">
                <div className="flex justify-between items-center mb-1 px-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {setorManual ? "digitar setor" : "setor / sala"}
                  </label>
                  <button
                    type="button"
                    onClick={() => setSetorManual(!setorManual)}
                    className="text-[9px] font-black text-blue-600 hover:underline uppercase cursor-pointer"
                  >
                    {setorManual ? "lista" : "não achou? digitar"}
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
                      placeholder="digite o setor..."
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
                          ? "selecione o setor..."
                          : "escolha a unidade primeiro"}
                      </option>
                      {setoresMapeados.map((s) => (
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
                descrição do equipamento
              </label>
              <div className="relative">
                <FiPackage
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  size={18}
                />
                <input
                  type="text"
                  required
                  placeholder="ex: cadeira de escritório, suporte de soro, mesa..."
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
                estado de conservação
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
                  <option value="novo">novo</option>
                  <option value="bom">bom</option>
                  <option value="regular">regular</option>
                  <option value="péssimo">péssimo</option>
                  <option value="danificado">danificado</option>
                </select>
              </div>
            </div>

            {/* Observações */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 block">
                observações adicionais
              </label>
              <textarea
                rows="3"
                placeholder="detalhes como marca, cor, número de série..."
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
                    ? "atualizar equipamento" 
                    : modoLote && quantidade > 1 
                    ? `registrar ${quantidade} itens em lote` 
                    : "salvar e cadastrar próximo"}
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