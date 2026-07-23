import React, { useEffect, useState, useMemo } from "react";
import { BrowserRouter } from "react-router-dom";
import { auth, db } from "./services/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { useLicenseGuard } from "./hooks/useLicenseGuard";
import AppRoutes from "./routes/AppRoutes";

function App() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isBlocked, setIsBlocked] = useState(
    !!sessionStorage.getItem("app_blocked")
  );

  const { isLicenseValid, loadingLicense } = useLicenseGuard();

  // --- DERRUBADA DE CONEXÃO EM TEMPO REAL ---
  useEffect(() => {
    if (!user) return;
    const userDocRef = doc(db, "usuarios", user.uid);
    const unsubscribeSessao = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const localSessionId = localStorage.getItem("current_session_id");
        if (data.currentSessionId && data.currentSessionId !== localSessionId) {
          toast.error(
            "Acesso detectado em outro dispositivo. Encerrando sessão...",
            { autoClose: 5000, theme: "dark" }
          );
          setTimeout(() => {
            signOut(auth);
            localStorage.removeItem("current_session_id");
            window.location.href = "/login";
          }, 4000);
        }
      }
    });
    return () => unsubscribeSessao();
  }, [user]);

  // --- OBSERVAÇÃO DE ESTADO DE AUTENTICAÇÃO E BLOQUEIO ---
  useEffect(() => {
    const handleBlockEvent = () => {
      sessionStorage.setItem("app_blocked", "true");
      setIsBlocked(true);
    };
    window.addEventListener("force-block", handleBlockEvent);

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true);
      if (currentUser) {
        try {
          const docRef = doc(db, "usuarios", currentUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            const bloqueado =
              data.status === "Bloqueado" || data.statusLicenca === "bloqueada";

            if (bloqueado) {
              sessionStorage.setItem("app_blocked", "true");
              setIsBlocked(true);
              setUser(null);
              await signOut(auth);
            } else {
              sessionStorage.removeItem("app_blocked");
              setIsBlocked(false);
              setUserData(data);
              setRole(data.role?.toLowerCase().trim() || "usuario");
              setUser(currentUser);
            }
          }
        } catch (error) {
          console.error(error);
        }
      } else {
        setUser(null);
        if (!sessionStorage.getItem("app_blocked")) setIsBlocked(false);
      }
      setLoading(false);
    });

    return () => {
      unsubscribe();
      window.removeEventListener("force-block", handleBlockEvent);
    };
  }, []);

  // --- LÓGICA DE PERMISSÕES ---
  const temAcesso = (moduloId) => {
    if (role === "root") return true;
    if (!userData) return false;
    const permissoes = userData.permissoesExtras || {};
    return (
      permissoes[moduloId] === true ||
      permissoes[moduloId.toLowerCase()] === true
    );
  };

  const isTiOrAdmin = useMemo(
    () => ["root", "admin", "analista", "ti"].includes(role),
    [role]
  );
  const isGestao = useMemo(
    () => ["chefia", "coordenador"].includes(role),
    [role]
  );
  const isUsuarioComum = useMemo(() => role === "usuario", [role]);

  const precisaTrocarSenha = useMemo(
    () => user && userData?.requiresPasswordChange === true,
    [user, userData]
  );

  const getHomePath = () => {
    if (precisaTrocarSenha) return "/trocar-senha";
    if (isTiOrAdmin) return "/dashboard";
    if (isGestao) return "/gestao-chefia";
    return "/home";
  };

  if (loading || loadingLicense) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-600"></div>
        <p className="mt-4 text-slate-400 font-black text-[10px]">
          VALIDANDO SEGURANÇA
        </p>
      </div>
    );
  }

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} theme="colored" />
      <BrowserRouter>
        <AppRoutes
          user={user}
          role={role}
          isBlocked={isBlocked}
          isLicenseValid={isLicenseValid}
          precisaTrocarSenha={precisaTrocarSenha}
          getHomePath={getHomePath}
          isTiOrAdmin={isTiOrAdmin}
          isGestao={isGestao}
          isUsuarioComum={isUsuarioComum}
          temAcesso={temAcesso}
        />
      </BrowserRouter>
    </>
  );
}

export default App;