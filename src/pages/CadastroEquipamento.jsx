import React, { useState, useEffect } from "react";
import { db, auth } from "../services/firebase";
import api from "../services/api";
import Header from "../components/Header";
import Footer from "../components/Footer";
import {
  doc,
  getDoc,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  FiPackage,
  FiArrowLeft,
  FiSave,
  FiHash,
  FiMapPin,
  FiInfo,
  FiActivity,
  FiFileText,
  FiLayers,
} from "react-icons/fi";

const CadastroEquipamento = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [verificandoAcesso, setVerificandoAcesso] = useState(true);
  const [nomeUsuario, setNomeUsuario] = useState("");

  const [formData, setFormData] = useState({
    patrimonio: "",
    nome: "",
    tipo: "Mobiliário",
    quantidade: 1,
    setor: "estoque patrimonio",
    unidade: "",
    estado: "Novo",
    observacoes: "",
  });

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

  const unidades = [
    "Hospital Conde",
    "Upa de Inoã",
    "Upa de Santa Rita",
    "Samu Barroco",
    "Samu Ponta Negra",
    "Samu Centro",
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const idToast = toast.loading("Registrando no estoque central via API...");

    try {
      const token = await auth.currentUser?.getIdToken();

      await api.post(
        "/estoque",
        {
          nome: formData.nome.toLowerCase().trim(),
          setor: "estoque patrimonio",
          observacoes: formData.observacoes.toLowerCase().trim(),
          patrimonio: formData.patrimonio.toUpperCase().trim(),
          unidade: formData.unidade,
          estado: formData.estado.toLowerCase().trim(),
          quantidade: Number(formData.quantidade),
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
        render: "Item adicionado ao estoque com sucesso!",
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });

      setFormData({ ...formData, patrimonio: "", nome: "", observacoes: "" });
    } catch (error) {
      console.error("Erro ao salvar no estoque:", error);
      toast.update(idToast, {
        render: error.response?.data?.message || "Erro ao comunicar com o servidor da API",
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
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Header />

      <main className="flex-grow p-4 md:p-8">
        <header className="max-w-4xl mx-auto mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-3 rounded-2xl text-white shadow-lg shadow-blue-200">
              <FiPackage size={26} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">
                Novo Item no Estoque
              </h1>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">
                Cadastro de entrada de ativos no estoque central
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 text-slate-600 hover:text-blue-600 font-bold text-sm bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-sm transition-all group"
          >
            <FiArrowLeft className="group-hover:-translate-x-1 transition-transform" />
            Voltar ao Dashboard
          </button>
        </header>

        <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <form onSubmit={handleSubmit} className="p-6 md:p-10 space-y-8">
            
            {/* Bloco 1: Localização e Patrimônio */}
            <div className="space-y-4">
              <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 border-b border-slate-100 pb-2">
                <FiMapPin className="text-blue-600" /> Origem & Identificação
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <FiHash className="text-blue-500" /> TAG do Patrimônio
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: HMC-1234 ou S/P"
                    className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-blue-500 focus:bg-white transition-all placeholder:font-normal"
                    value={formData.patrimonio}
                    onChange={(e) =>
                      setFormData({ ...formData, patrimonio: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <FiMapPin className="text-blue-500" /> Unidade Atual
                  </label>
                  <select
                    required
                    className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-blue-500 focus:bg-white transition-all cursor-pointer"
                    value={formData.unidade}
                    onChange={(e) =>
                      setFormData({ ...formData, unidade: e.target.value })
                    }
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

            {/* Bloco 2: Especificação do Item */}
            <div className="space-y-4">
              <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 border-b border-slate-100 pb-2">
                <FiInfo className="text-blue-600" /> Detalhes do Item
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <FiInfo className="text-blue-500" /> Tipo de Item
                  </label>
                  <select
                    className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-blue-500 focus:bg-white transition-all cursor-pointer"
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

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <FiMapPin className="text-blue-500" /> Setor / Sala
                  </label>
                  <div className="bg-slate-100 border border-slate-200 h-[46px] px-3.5 rounded-xl flex items-center gap-2 text-slate-600 text-xs font-bold uppercase">
                    <FiMapPin className="text-blue-500 shrink-0" />
                    <span>Setor Fixo: <strong className="text-slate-800">estoque patrimonio</strong></span>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <FiPackage className="text-blue-500" /> Descrição do Equipamento
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Cadeira de Rodas Motorizada"
                  className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-blue-500 focus:bg-white transition-all placeholder:font-normal"
                  value={formData.nome}
                  onChange={(e) =>
                    setFormData({ ...formData, nome: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <FiLayers className="text-blue-500" /> Quantidade
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-blue-500 focus:bg-white transition-all"
                    value={formData.quantidade}
                    onChange={(e) =>
                      setFormData({ ...formData, quantidade: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <FiActivity className="text-blue-500" /> Estado de Conservação
                  </label>
                  <select
                    className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-blue-500 focus:bg-white transition-all cursor-pointer"
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
            </div>

            {/* Bloco 3: Observações */}
            <div className="space-y-4">
              <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 border-b border-slate-100 pb-2">
                <FiFileText className="text-blue-600" /> Informações Adicionais
              </h2>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Observações / Notas Técnicas
                </label>
                <textarea
                  rows="3"
                  placeholder="Detalhes como marca, cor, número de série..."
                  className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-sm font-medium text-slate-700 outline-none focus:border-blue-500 focus:bg-white transition-all resize-none placeholder:font-normal"
                  value={formData.observacoes}
                  onChange={(e) =>
                    setFormData({ ...formData, observacoes: e.target.value })
                  }
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed uppercase tracking-wider text-sm"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <FiSave className="text-xl" /> Finalizar Registro no Estoque
                </>
              )}
            </button>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CadastroEquipamento;