import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// COMPONENTES E PAGES
import GuardiaoSessao from "../components/GuardiaoSessao";
import LicencaExpirada from "../pages/LicencaExpirada";
import MensagemBloqueio from "../pages/MensagemBloqueio";

// Importação das Páginas
import Login from "../pages/Login";
import Dashboard from "../pages/Dashboard";
import DashboardBI from "../pages/DashboardBI";
import PainelAnalista from "../pages/PainelAnalista";
import Home from "../pages/Home";
import CadastroEquipamento from "../pages/CadastroEquipamento";
import Transferencia from "../pages/Transferencia";
import Inventario from "../pages/Inventario";
import Estoque from "../pages/Estoque";
import Usuarios from "../pages/Usuarios";
import TrocarSenha from "../pages/TrocarSenha";
import AdminLicencas from "../pages/AdminLicencas";
import PainelCoordenacao from "../pages/PainelCoordenacao";
import Laudos from "../pages/Laudos";
import TelaEtiquetas from "../pages/TelaEtiquetas";

// Importando componentes
import CadastroChamado from "../components/CadastroChamado";
import GestaoChefia from "../pages/GestaoeChefia";
import PainelGestao from "../pages/PainelGestao";
import FormRemanejamento from "../components/FormRemanejamento";
import ConsultaPatrimonio from "../pages/ConsultaPatrimonio"; 
import SaidaEquipamento from "../pages/SaidaEquipamento"; 

export default function AppRoutes({
  user,
  role,
  isBlocked,
  isLicenseValid,
  precisaTrocarSenha,
  getHomePath,
  isTiOrAdmin,
  isGestao,
  isUsuarioComum,
  temAcesso,
}) {
  const ProtectedRoute = ({ children, condition }) => {
    if (precisaTrocarSenha) return <Navigate to="/trocar-senha" replace />;
    return condition ? children : <Navigate to={getHomePath()} replace />;
  };

  return (
    <Routes>
      {isBlocked ? (
        <>
          <Route path="/bloqueado" element={<MensagemBloqueio />} />
          <Route path="*" element={<Navigate to="/bloqueado" replace />} />
        </>
      ) : !isLicenseValid && !["admin", "root"].includes(role) ? (
        <>
          <Route path="/expirado" element={<LicencaExpirada />} />
          <Route path="*" element={<Navigate to="/expirado" replace />} />
        </>
      ) : (
        <>
          <Route
            path="/login"
            element={!user ? <Login /> : <Navigate to={getHomePath()} replace />}
          />

          {user ? (
            precisaTrocarSenha ? (
              <>
                <Route path="/trocar-senha" element={<TrocarSenha />} />
                <Route path="*" element={<Navigate to="/trocar-senha" replace />} />
              </>
            ) : (
              <Route element={<GuardiaoSessao />}>
                <Route path="/" element={<Navigate to={getHomePath()} replace />} />

                {/* --- TI / ADMIN --- */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute condition={isTiOrAdmin}>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/painel-analista"
                  element={
                    <ProtectedRoute condition={isTiOrAdmin || temAcesso("chamados")}>
                      <PainelAnalista />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/cadastro-equipamento"
                  element={
                    <ProtectedRoute condition={isTiOrAdmin || temAcesso("inventario")}>
                      <CadastroEquipamento />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/estoque"
                  element={
                    <ProtectedRoute condition={isTiOrAdmin || temAcesso("inventario")}>
                      <Estoque />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/inventario"
                  element={
                    <ProtectedRoute condition={isTiOrAdmin || temAcesso("inventario")}>
                      <Inventario />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/transferencia"
                  element={
                    <ProtectedRoute condition={isTiOrAdmin || temAcesso("inventario")}>
                      <Transferencia />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/saida-equipamento"
                  element={
                    <ProtectedRoute condition={isTiOrAdmin || temAcesso("inventario")}>
                      <SaidaEquipamento />
                    </ProtectedRoute>
                  }
                />
                
                <Route
                  path="/laudo-inviabilidade"
                  element={
                    <ProtectedRoute condition={role === "root" || temAcesso("laudos")}>
                      <Laudos />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/emissao-etiquetas"
                  element={
                    <ProtectedRoute condition={role === "root" || temAcesso("etiquetas")}>
                      <TelaEtiquetas />
                    </ProtectedRoute>
                  }
                />

                {/* --- PAINEL DE COORDENAÇÃO --- */}
                <Route
                  path="/coordenacao"
                  element={
                    <ProtectedRoute condition={role === "coordenador" || role === "admin" || role === "root"}>
                      <PainelCoordenacao />
                    </ProtectedRoute>
                  }
                />

                {/* --- GESTÃO COM ROTAS ANINHADAS --- */}
                <Route
                  path="/gestao-chefia"
                  element={
                    <ProtectedRoute condition={isGestao || role === "root"}>
                      <GestaoChefia />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<PainelGestao />} />
                  <Route path="painel-gestao" element={<PainelGestao />} />
                </Route>

                {/* --- COMUNS / COMPARTILHADAS --- */}
                <Route
                  path="/home"
                  element={
                    <ProtectedRoute condition={isUsuarioComum || isTiOrAdmin || isGestao}>
                      <Home />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/bi"
                  element={
                    <ProtectedRoute condition={temAcesso("dashboard_bi")}>
                      <DashboardBI />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/remanejamento"
                  element={
                    <ProtectedRoute condition={isTiOrAdmin || temAcesso("remanejamento")}>
                      <FormRemanejamento />
                    </ProtectedRoute>
                  }
                />
                
                <Route
                  path="/consulta-patrimonio"
                  element={
                    <ProtectedRoute condition={isTiOrAdmin || temAcesso("inventario")}>
                      <ConsultaPatrimonio />
                    </ProtectedRoute>
                  }
                />
                
                <Route
                  path="/usuarios"
                  element={
                    <ProtectedRoute condition={role === "admin" || role === "root"}>
                      <Usuarios />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/licencas"
                  element={
                    <ProtectedRoute condition={role === "root"}>
                      <AdminLicencas />
                    </ProtectedRoute>
                  }
                />
                <Route path="/trocar-senha" element={<TrocarSenha />} />
                <Route path="/cadastro-chamado" element={<CadastroChamado />} />

                <Route path="*" element={<Navigate to={getHomePath()} replace />} />
              </Route>
            )
          ) : (
            <Route path="*" element={<Navigate to="/login" replace />} />
          )}
        </>
      )}
    </Routes>
  );
}