import React, { useState, useEffect } from "react";
import { db, auth } from "../services/firebase";
import api from "../services/api";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate, Link } from "react-router-dom";
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
} from "react-icons/fi";

// IMPORTUE AQUI O SEU MAPA DE SETORES (ajuste o caminho se necessário, ex: "./constants/setores")
import { MAPA_SETORES_POR_UNIDADE } from "../components/constants/setores";

const CadastroRapido = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [verificandoAcesso, setVerificandoAcesso] = useState(true);
  const [nomeUsuario, setNomeUsuario] = useState("");

  // Estado para controlar se o setor é digitado manualmente ou via lista
  const [setorManual, setSetorManual] = useState(false);

  const [formData, setFormData] = useState({
    patrimonio: "",
    nome: "",
    tipo: "Mobiliário",
    setor: "",
    unidade: "",
    estado: "Novo",
    observacoes: "",
  });

  // Pega as unidades diretamente das chaves do arquivo de setores importado
  const unidades = Object.keys(MAPA_SETORES_POR_UNIDADE || {});

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
              navigate("/dashboard");
            }
          } else {
            toast.error("Perfil de usuário não encontrado.");
            navigate("/login");
          }
        } catch (error) {
          console.error("Erro ao validar acesso:", error);
          toast.error("Erro na verificação de segurança.");
          navigate("/dashboard");
        }
      } else {
        navigate("/login");
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const idToast = toast.loading("Registrando ativo diretamente via API...");

    try {
      const token = await auth.currentUser?.getIdToken();

      await api.post(
        "/ativos",
        {
          nome: formData.nome.toLowerCase().trim(),
          setor: formData.setor.toLowerCase().trim(),
          observacoes: formData.observacoes.toLowerCase().trim(),
          patrimonio: formData.patrimonio.toUpperCase().trim(),
          unidade: formData.unidade,
          estado: formData.estado.toLowerCase().trim(),
          tipo: "equipamento",
          tipoItem: formData.tipo,
          status: "ativo",
          cadastradoPor: nomeUsuario,
        },
        {
          headers: {
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        }
      );

      toast.update(idToast, {
        render: "Ativo registrado e alocado com sucesso!",
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });

      setFormData({
        ...formData,
        patrimonio: "",
        nome: "",
        setor: "",
        observacoes: "",
      });
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

  if (verificandoAcesso) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-600 border-r-4"></div>
        <p className="mt-4 text-blue-600 font-bold uppercase tracking-widest text-xs">
          Validando permissões...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans">
      {/* CABEÇALHO */}
      <div className="max-w-4xl mx-auto mb-8 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2.5 rounded-xl text-white shadow-lg shadow-blue-200">
            <FiBox size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              Cadastro Direto no Setor
            </h1>
            <p className="text-slate-500 text-sm">
              Registro e alocação imediata de ativo na unidade/setor
            </p>
          </div>
        </div>
        <Link
          to="/dashboard"
          className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-all font-medium bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm"
        >
          <FiArrowLeft /> Voltar
        </Link>
      </div>

      {/* FORMULÁRIO */}
      <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 md:p-10 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Patrimônio */}
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
                  required
                  placeholder="Ex: HMC-1234 ou S/P"
                  className="w-full bg-slate-50 border-2 border-slate-50 p-4 pl-12 rounded-2xl outline-none focus:border-blue-600 focus:bg-white transition-all text-sm font-bold text-slate-700"
                  value={formData.patrimonio}
                  onChange={(e) =>
                    setFormData({ ...formData, patrimonio: e.target.value })
                  }
                />
              </div>
            </div>

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
                  <option value="Equip. Médico">Equipamento Médico</option>
                  <option value="Ferramenta">Ferramenta</option>
                </select>
              </div>
            </div>

            {/* Setor puxando do arquivo de constantes externo */}
            <div className="space-y-1">
              <div className="flex justify-between items-center mb-1 px-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {setorManual ? "Digitar Setor" : "Setor / Sala"}
                </label>
                <button
                  type="button"
                  onClick={() => setSetorManual(!setorManual)}
                  className="text-[9px] font-black text-blue-600 hover:underline uppercase"
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
                    className="w-full bg-slate-50 border-2 border-slate-50 p-4 pl-12 rounded-2xl outline-none focus:border-blue-600 focus:bg-white transition-all text-sm font-bold text-slate-700 appearance-none disabled:opacity-50"
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
                    {MAPA_SETORES_POR_UNIDADE[formData.unidade]?.map((s) => (
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
                placeholder="Ex: Computador All-in-One, Impressora Laser..."
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
                <option value="Novo">Novo</option>
                <option value="Bom">Bom</option>
                <option value="Regular">Regular</option>
                <option value="Danificado">Danificado</option>
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
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl shadow-xl transition-all flex items-center justify-center gap-3 uppercase text-xs active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <FiSave size={16} /> Finalizar Cadastro Direto
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CadastroRapido;