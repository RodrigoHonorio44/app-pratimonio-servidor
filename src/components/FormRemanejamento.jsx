import React, { useState, useEffect } from "react";
import api from "../services/api";
import { auth } from "../services/firebase";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Header from "../components/Header";
import Footer from "../components/Footer";
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
  FiRefreshCw
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
    { value: "ti malta", label: "TI Malta" },
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
      const response = await api.get(
        `/ativos?patrimonio=${encodeURIComponent(nPatrimonio)}`
      );
      const data = response.data;
      const ativoEncontrado = Array.isArray(data) ? data[0] : data;

      if (ativoEncontrado) {
        const unidadeAtivo = (ativoEncontrado.unidade || "").toLowerCase();
        const unidadeCorrespondente =
          unidades.find((u) => u.toLowerCase() === unidadeAtivo) || ativoEncontrado.unidade || "";

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
      return "text-red-600 border-red-200 bg-red-50";
    if (formData.prioridade === "media")
      return "text-amber-600 border-amber-200 bg-amber-50";
    return "text-emerald-600 border-emerald-200 bg-emerald-50";
  };

  return (
    <div className="bg-slate-50 min-h-screen font-sans flex flex-col justify-between">
      {/* HEADER DA APLICAÇÃO */}
      <Header />

      {/* CONTEÚDO PRINCIPAL CENTRALIZADO */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-8 space-y-6">
        
        {/* CABEÇALHO DA PÁGINA */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-orange-500 text-white p-2.5 rounded-2xl shadow-sm">
              <FiRefreshCw size={22} />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-800 italic uppercase tracking-tight">
                remanejamento
              </h1>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">
                solicitação de mudança de equipamentos e setores
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleExit}
            className="px-3.5 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-100 transition-all font-bold text-xs flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <FiX size={16} /> fechar
          </button>
        </div>

        {/* CARTÃO DO FORMULÁRIO */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-8">
          {sucesso ? (
            <div className="flex flex-col items-center justify-center py-10 text-center animate-in fade-in zoom-in">
              <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mb-4">
                <FiCheckCircle size={44} className="text-orange-500" />
              </div>
              <h2 className="text-2xl font-black text-slate-800 uppercase italic mb-2 tracking-tight">
                solicitado com sucesso!
              </h2>
              <div className="bg-orange-50 border border-orange-200 rounded-2xl px-8 py-4 mb-6">
                <span className="text-2xl font-black text-orange-500 tracking-wider">
                  {osGerada}
                </span>
              </div>
              <button
                type="button"
                onClick={handleExit}
                className="w-full max-w-xs bg-slate-800 text-white py-3.5 rounded-xl font-black text-xs uppercase hover:bg-slate-900 transition-all cursor-pointer shadow-xs"
              >
                concluir e sair
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* MODO EQUIPAMENTO / SETOR INTEIRO */}
              <div className="bg-slate-100 p-1.5 rounded-2xl flex gap-1.5">
                <button
                  type="button"
                  onClick={() => modoSetor && alternarModoSetor()}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase transition-all cursor-pointer ${
                    !modoSetor
                      ? "bg-white text-orange-500 shadow-xs"
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  equipamento
                </button>
                <button
                  type="button"
                  onClick={() => !modoSetor && alternarModoSetor()}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase transition-all cursor-pointer ${
                    modoSetor
                      ? "bg-white text-orange-500 shadow-xs"
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  setor inteiro
                </button>
              </div>

              {/* PRIORIDADE E EQUIPE (LINHA DUPLA) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Prioridade */}
                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block">
                    prioridade
                  </label>
                  <div className="relative">
                    <FiAlertCircle
                      className={`absolute left-3.5 top-1/2 -translate-y-1/2 z-10 ${getPrioridadeColor()}`}
                      size={16}
                    />
                    <select
                      name="prioridade"
                      value={formData.prioridade}
                      onChange={handleChange}
                      className={`w-full py-2.5 pl-10 pr-3 border rounded-xl outline-none text-xs font-bold appearance-none transition-all cursor-pointer ${getPrioridadeColor()}`}
                    >
                      <option value="baixa">baixa (planejado)</option>
                      <option value="media">média (em breve)</option>
                      <option value="urgente">urgente (imediato)</option>
                    </select>
                  </div>
                </div>

                {/* Equipe Responsável */}
                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block">
                    equipe responsável
                  </label>
                  <div className="relative">
                    <FiUsers className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 z-10" size={16} />
                    <select
                      name="equipe"
                      required
                      value={formData.equipe}
                      onChange={handleChange}
                      className="w-full py-2.5 pl-10 pr-3 bg-slate-50/70 border border-slate-200/80 rounded-xl outline-none focus:bg-white focus:border-orange-500 appearance-none text-xs font-bold text-slate-700 transition-all cursor-pointer"
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
              </div>

              {/* UNIDADE DESTINO */}
              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block">
                  unidade destino
                </label>
                <div className="relative">
                  <FiHome className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 z-10" size={16} />
                  <select
                    name="unidade"
                    required
                    value={formData.unidade}
                    onChange={handleChange}
                    className="w-full py-2.5 pl-10 pr-3 bg-slate-50/70 border border-slate-200/80 rounded-xl outline-none focus:bg-white focus:border-orange-500 appearance-none text-xs font-bold text-slate-700 transition-all cursor-pointer"
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

              {/* PATRIMÔNIO E EQUIPAMENTO */}
              <div
                className={`grid gap-4 text-left ${
                  modoSetor ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2"
                }`}
              >
                {!modoSetor && (
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center px-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        patrimônio
                      </label>
                      <button
                        type="button"
                        onClick={handleNaoSeiPatrimonio}
                        className={`text-[9px] font-black px-2 py-0.5 rounded-lg transition-all cursor-pointer uppercase ${
                          naoSeiPatrimonio
                            ? "bg-orange-500 text-white"
                            : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                        }`}
                      >
                        {naoSeiPatrimonio ? "digitar" : "não sei"}
                      </button>
                    </div>
                    <div className="relative flex gap-2">
                      <div className="relative flex-1">
                        <FiHash
                          className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${
                            naoSeiPatrimonio ? "text-orange-500" : "text-slate-400"
                          }`}
                          size={16}
                        />
                        <input
                          name="patrimonio"
                          required
                          readOnly={naoSeiPatrimonio}
                          type="text"
                          value={formData.patrimonio}
                          onChange={handleChange}
                          placeholder={naoSeiPatrimonio ? "s/p" : "número"}
                          className={`w-full py-2.5 pl-10 pr-3 rounded-xl outline-none text-xs font-bold transition-all ${
                            naoSeiPatrimonio
                              ? "bg-orange-50 border border-orange-200 text-orange-600"
                              : "bg-slate-50/70 border border-slate-200/80 focus:bg-white focus:border-orange-500 text-slate-700"
                          }`}
                        />
                      </div>
                      {!naoSeiPatrimonio && (
                        <button
                          type="button"
                          disabled={loadingAtivo}
                          onClick={buscarAtivoNaApi}
                          className="bg-orange-500 hover:bg-orange-600 text-white px-3.5 rounded-xl transition-all flex items-center justify-center disabled:opacity-50 cursor-pointer shadow-xs"
                          title="buscar ativo"
                          aria-label="Buscar ativo"
                        >
                          {loadingAtivo ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <FiSearch size={16} />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block">
                    equipamento
                  </label>
                  <div className="relative">
                    <FiMonitor className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      name="equipamento"
                      required
                      readOnly={modoSetor}
                      value={formData.equipamento}
                      type="text"
                      placeholder="ex: monitor"
                      onChange={handleChange}
                      className={`w-full py-2.5 pl-10 pr-3 rounded-xl outline-none text-xs font-bold text-slate-700 transition-all ${
                        modoSetor
                          ? "bg-slate-100 italic"
                          : "bg-slate-50/70 border border-slate-200/80 focus:bg-white focus:border-orange-500"
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* ORIGEM E DESTINO */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-rose-500 uppercase tracking-widest ml-1 block">
                    de: (origem)
                  </label>
                  <div className="relative">
                    <FiMapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-rose-400" size={16} />
                    <input
                      name="setorOrigem"
                      required
                      value={formData.setorOrigem}
                      type="text"
                      placeholder="setor atual"
                      onChange={handleChange}
                      className="w-full py-2.5 pl-10 pr-3 bg-rose-50/30 border border-rose-200/80 rounded-xl outline-none focus:bg-white focus:border-rose-400 text-xs font-bold text-slate-700 transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest ml-1 block">
                    para: (destino)
                  </label>
                  <div className="relative">
                    <FiArrowRight className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-500" size={16} />
                    <input
                      name="setorDestino"
                      required
                      value={formData.setorDestino}
                      type="text"
                      placeholder="novo setor"
                      onChange={handleChange}
                      className="w-full py-2.5 pl-10 pr-3 bg-emerald-50/30 border border-emerald-200/80 rounded-xl outline-none focus:bg-white focus:border-emerald-500 text-xs font-bold text-slate-700 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* MOTIVO */}
              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block">
                  motivo
                </label>
                <div className="relative">
                  <FiFileText className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
                  <textarea
                    name="descricao"
                    required
                    rows="3"
                    value={formData.descricao}
                    placeholder="por que realizar essa mudança?"
                    onChange={handleChange}
                    className="w-full p-3 pl-10 bg-slate-50/70 border border-slate-200/80 rounded-xl outline-none focus:bg-white focus:border-orange-500 text-xs font-medium text-slate-700 resize-none transition-all"
                  />
                </div>
              </div>

              {/* BOTÃO ENVIAR */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-black py-3.5 rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 uppercase text-xs active:scale-98 disabled:opacity-70 cursor-pointer"
              >
                {loading ? (
                  "processando..."
                ) : (
                  <>
                    <FiSend size={15} /> enviar remanejamento
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </main>

      {/* FOOTER DA APLICAÇÃO */}
      <Footer />
    </div>
  );
};

export default FormRemanejamento;