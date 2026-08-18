import React, { useState, useEffect } from "react";
import api from "../services/api"; // Import do serviço do Axios
import { auth } from "../services/firebase";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  FiX,
  FiSend,
  FiMonitor,
  FiHash,
  FiFileText,
  FiArrowRight,
  FiMapPin,
  FiHome,
  FiCheckCircle,
  FiAlertCircle,
  FiSearch,
  FiUsers,
} from "react-icons/fi";

const FormRemanejamento = ({ onClose }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loadingAtivo, setLoadingAtivo] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [osGerada, setOsGerada] = useState("");
  const [modoSetor, setModoSetor] = useState(false);
  const [naoSeiPatrimonio, setNaoSeiPatrimonio] = useState(false);
  const [userName, setUserName] = useState("usuário");

  const [formData, setFormData] = useState({
    unidade: "",
    equipamento: "",
    patrimonio: "",
    setorOrigem: "",
    setorDestino: "",
    descricao: "",
    prioridade: "baixa",
    equipe: "",
  });

  const unidades = [
    "Hospital Conde",
    "Upa Inoã",
    "Upa Santa Rita",
    "Samu Centro",
    "Samu Barroco",
    "Samu Ponta Negra",
  ];

  const equipesDisponiveis = [
    { value: "manutencao predial", label: "Manutenção Predial" },
    { value: "engenharia clinica", label: "Engenharia Clínica" },
    { value: "patrimonio", label: "Patrimônio" },
    { value: "manutencao patrimonial", label: "Manutenção Patrimonial" },
    { value: "ti malta", label: "Ti Malta" },
    { value: "sistema e redes", label: "Sistema e Redes" },
    { value: "refrigeracao", label: "Refrigeração" },
  ];

  const handleExit = () => {
    if (onClose) {
      onClose();
    } else {
      navigate("/dashboard");
    }
  };

  useEffect(() => {
    let isMounted = true;

    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (user) {
        try {
          // Atualizado para usar Axios (api.get)
          const response = await api.get(`/usuarios/${user.uid}`);
          const data = response.data;

          if (isMounted) {
            setUserName((data.nome || "usuário").toLowerCase());

            if (data.equipe) {
              const equipeUser = data.equipe.toLowerCase();
              const existeEquipe = equipesDisponiveis.some(
                (e) => e.value === equipeUser
              );
              if (existeEquipe) {
                setFormData((prev) => ({ ...prev, equipe: equipeUser }));
              }
            }
          }
        } catch (error) {
          console.error("Erro ao buscar dados do usuário:", error);
          if (isMounted) {
            setUserName(
              (user.displayName || user.email.split("@")[0]).toLowerCase()
            );
          }
        }
      }
    };

    fetchUserData();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleChange = (e) => {
    const value = e.target.value;
    const formattedValue =
      e.target.type === "text" || e.target.tagName === "TEXTAREA"
        ? value.toLowerCase()
        : value;

    setFormData((prev) => ({ ...prev, [e.target.name]: formattedValue }));
  };

  const handleNaoSeiPatrimonio = () => {
    const novoEstado = !naoSeiPatrimonio;
    setNaoSeiPatrimonio(novoEstado);
    setFormData((prev) => ({ ...prev, patrimonio: novoEstado ? "s/p" : "" }));
  };

  const alternarModoSetor = () => {
    const novoModo = !modoSetor;
    setModoSetor(novoModo);
    setFormData((prev) => ({
      ...prev,
      equipamento: novoModo ? "setor inteiro" : "",
      patrimonio: novoModo ? "s/p" : "",
    }));
    setNaoSeiPatrimonio(false);
  };

  const buscarAtivoNaApi = async () => {
    const nPatrimonio = formData.patrimonio.trim().toLowerCase();
    if (!nPatrimonio || nPatrimonio === "s/p") {
      toast.info("insira um número de patrimônio válido para buscar.");
      return;
    }

    setLoadingAtivo(true);
    try {
      // Atualizado para usar Axios (api.get)
      const response = await api.get(
        `/ativos?patrimonio=${encodeURIComponent(nPatrimonio)}`
      );
      const data = response.data;
      const ativoEncontrado = Array.isArray(data) ? data[0] : data;

      if (ativoEncontrado) {
        const unidadeAtivo = (ativoEncontrado.unidade || "").toLowerCase();
        const unidadeCorrespondente =
          unidades.find((u) => u.toLowerCase() === unidadeAtivo) || "";

        setFormData((prev) => ({
          ...prev,
          equipamento: (
            ativoEncontrado.nome ||
            ativoEncontrado.equipamento ||
            ""
          ).toLowerCase(),
          setorOrigem: (ativoEncontrado.setor || "").toLowerCase(),
          unidade: unidadeCorrespondente,
        }));

        toast.success("ativo localizado! campos preenchidos.");
      } else {
        toast.warning("nenhum ativo localizado com este patrimônio.");
      }
    } catch (error) {
      console.error("erro ao buscar ativo:", error);
      toast.error("erro ao realizar a busca de ativos.");
    } finally {
      setLoadingAtivo(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return toast.error("usuário não autenticado.");
    if (!formData.equipe) return toast.error("selecione a equipe responsável.");

    setLoading(true);
    try {
      const numeroOS = `#rem-${new Date().getFullYear()}-${Math.floor(
        1000 + Math.random() * 9000
      )}`;

      const novoRemanejamento = {
        numeroOs: numeroOS,
        tipo: modoSetor
          ? "remanejamento de setor"
          : "remanejamento de equipamento",
        status: "aberto",
        nome: userName,
        quemSolicitou: userName,
        userId: user.uid,
        userEmail: (user.email || "").toLowerCase(),
        ...formData,
      };

      // Atualizado para usar Axios (api.post)
      await api.post("/remanejamentos", novoRemanejamento);

      setOsGerada(numeroOS);
      setSucesso(true);
      toast.success("solicitação enviada e banco atualizado com sucesso!");
    } catch (error) {
      console.error("erro ao salvar:", error);
      toast.error("ocorreu um erro ao processar o envio.");
    } finally {
      setLoading(false);
    }
  };

  const getPrioridadeColor = () => {
    if (formData.prioridade === "urgente")
      return "text-red-500 border-red-200 bg-red-50";
    if (formData.prioridade === "media")
      return "text-amber-500 border-amber-200 bg-amber-50";
    return "text-emerald-500 border-emerald-200 bg-emerald-50";
  };

  return (
    <div className="fixed inset-0 z-10001 flex items-center justify-center p-2 sm:p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-137.5 rounded-[2.5rem] shadow-2xl relative p-6 sm:p-10 border-t-8 border-orange-400 overflow-y-auto max-h-[90vh]">
        {sucesso ? (
          <div className="flex flex-col items-center justify-center py-10 text-center animate-in fade-in zoom-in">
            <div className="w-24 h-24 bg-orange-50 rounded-full flex items-center justify-center mb-6 animate-bounce">
              <FiCheckCircle size={48} className="text-orange-400" />
            </div>
            <h2 className="text-3xl font-black text-slate-700 uppercase italic mb-2 tracking-tighter">
              solicitado!
            </h2>
            <div className="bg-orange-50 border-2 border-orange-100 rounded-3xl px-10 py-5 mb-8">
              <span className="text-3xl font-black text-orange-400 tracking-tighter">
                {osGerada}
              </span>
            </div>
            <button
              type="button"
              onClick={handleExit}
              className="w-full bg-slate-800 text-white py-5 rounded-2xl font-black text-xs uppercase hover:bg-slate-900 transition-all cursor-pointer"
            >
              concluir e sair
            </button>
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={handleExit}
              aria-label="Fechar formulário"
              className="absolute top-6 right-6 p-2 text-slate-300 hover:text-red-400 transition-all cursor-pointer"
            >
              <FiX size={20} />
            </button>

            <div className="mb-8 text-left">
              <h2 className="text-xl sm:text-2xl font-black text-slate-700 uppercase italic flex flex-col">
                remanejamento{" "}
                <span className="h-1.5 w-12 bg-orange-400 mt-1 rounded-full"></span>
              </h2>

              <div className="flex gap-2 mt-6 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                <button
                  type="button"
                  onClick={() => modoSetor && alternarModoSetor()}
                  className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all cursor-pointer ${
                    !modoSetor
                      ? "bg-white text-orange-400 shadow-sm border border-orange-100"
                      : "text-slate-400"
                  }`}
                >
                  equipamento
                </button>
                <button
                  type="button"
                  onClick={() => !modoSetor && alternarModoSetor()}
                  className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all cursor-pointer ${
                    modoSetor
                      ? "bg-white text-orange-400 shadow-sm border border-orange-100"
                      : "text-slate-400"
                  }`}
                >
                  setor inteiro
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  prioridade
                </label>
                <div className="relative">
                  <FiAlertCircle
                    className={`absolute left-4 top-1/2 -translate-y-1/2 z-10 ${getPrioridadeColor()}`}
                  />
                  <select
                    name="prioridade"
                    value={formData.prioridade}
                    onChange={handleChange}
                    className={`w-full border-2 rounded-2xl py-4 pl-12 pr-4 text-sm font-black appearance-none focus:outline-none transition-all cursor-pointer ${getPrioridadeColor()}`}
                  >
                    <option value="baixa">baixa (planejado)</option>
                    <option value="media">média (em breve)</option>
                    <option value="urgente">urgente (imediato)</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  equipe responsável
                </label>
                <div className="relative">
                  <FiUsers className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-300 z-10" />
                  <select
                    name="equipe"
                    required
                    value={formData.equipe}
                    onChange={handleChange}
                    className="w-full bg-slate-50 border-2 border-transparent focus:border-orange-200 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold appearance-none focus:outline-none transition-all cursor-pointer"
                  >
                    <option value="" disabled hidden>
                      selecione a equipe
                    </option>
                    {equipesDisponiveis.map((eq) => (
                      <option key={eq.value} value={eq.value}>
                        {eq.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  unidade destino
                </label>
                <div className="relative">
                  <FiHome className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-300 z-10" />
                  <select
                    name="unidade"
                    required
                    value={formData.unidade}
                    onChange={handleChange}
                    className="w-full bg-slate-50 border-2 border-transparent focus:border-orange-200 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold appearance-none focus:outline-none transition-all cursor-pointer"
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

              <div
                className={`grid gap-4 text-left ${
                  modoSetor ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2"
                }`}
              >
                {!modoSetor && (
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center px-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase">
                        patrimônio
                      </label>
                      <button
                        type="button"
                        onClick={handleNaoSeiPatrimonio}
                        className={`text-[9px] px-2 py-0.5 rounded font-black cursor-pointer ${
                          naoSeiPatrimonio
                            ? "bg-orange-400 text-white"
                            : "bg-slate-200"
                        }`}
                      >
                        {naoSeiPatrimonio ? "digitar" : "não sei"}
                      </button>
                    </div>
                    <div className="relative flex gap-2">
                      <div className="relative flex-1">
                        <FiHash
                          className={`absolute left-4 top-1/2 -translate-y-1/2 ${
                            naoSeiPatrimonio
                              ? "text-orange-400"
                              : "text-slate-300"
                          }`}
                        />
                        <input
                          name="patrimonio"
                          required
                          readOnly={naoSeiPatrimonio}
                          type="text"
                          value={formData.patrimonio}
                          onChange={handleChange}
                          placeholder={naoSeiPatrimonio ? "s/p" : "número"}
                          className={`w-full rounded-2xl py-4 pl-12 text-sm font-bold focus:outline-none ${
                            naoSeiPatrimonio
                              ? "bg-orange-50 border-2 border-orange-100 text-orange-400"
                              : "bg-slate-50 border-2 border-transparent focus:border-orange-200"
                          }`}
                        />
                      </div>
                      {!naoSeiPatrimonio && (
                        <button
                          type="button"
                          disabled={loadingAtivo}
                          onClick={buscarAtivoNaApi}
                          className="bg-orange-400 hover:bg-orange-500 text-white px-4 rounded-2xl active:scale-95 transition-all flex items-center justify-center disabled:opacity-50 cursor-pointer"
                          title="buscar ativo"
                          aria-label="Buscar ativo"
                        >
                          {loadingAtivo ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <FiSearch size={18} />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">
                    equipamento
                  </label>
                  <div className="relative">
                    <FiMonitor className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                    <input
                      name="equipamento"
                      required
                      readOnly={modoSetor}
                      value={formData.equipamento}
                      type="text"
                      placeholder="ex: monitor"
                      onChange={handleChange}
                      className={`w-full rounded-2xl py-4 pl-12 text-sm font-bold text-slate-600 focus:outline-none ${
                        modoSetor
                          ? "bg-slate-100 italic"
                          : "bg-slate-50 border-2 border-transparent focus:border-orange-200"
                      }`}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-red-400 uppercase ml-1">
                    de: (origem)
                  </label>
                  <div className="relative">
                    <FiMapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-red-300" />
                    <input
                      name="setorOrigem"
                      required
                      value={formData.setorOrigem}
                      type="text"
                      placeholder="setor atual"
                      onChange={handleChange}
                      className="w-full bg-red-50/20 border border-red-100 rounded-2xl py-4 pl-12 text-sm font-bold focus:outline-none"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-green-500 uppercase ml-1">
                    para: (destino)
                  </label>
                  <div className="relative">
                    <FiArrowRight className="absolute left-4 top-1/2 -translate-y-1/2 text-green-400" />
                    <input
                      name="setorDestino"
                      required
                      value={formData.setorDestino}
                      type="text"
                      placeholder="novo setor"
                      onChange={handleChange}
                      className="w-full bg-green-50/20 border border-green-100 rounded-2xl py-4 pl-12 text-sm font-bold focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">
                  motivo
                </label>
                <div className="relative">
                  <FiFileText className="absolute left-4 top-6 text-slate-300" />
                  <textarea
                    name="descricao"
                    required
                    rows="2"
                    value={formData.descricao}
                    placeholder="por que realizar essa mudança?"
                    onChange={handleChange}
                    className="w-full bg-slate-50 border-2 border-transparent focus:border-orange-100 rounded-3xl py-5 pl-12 pr-6 text-sm font-semibold focus:outline-none resize-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-orange-400 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-orange-500 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-orange-100 cursor-pointer"
              >
                {loading ? (
                  "processando..."
                ) : (
                  <>
                    <FiSend /> enviar remanejamento
                  </>
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default FormRemanejamento;