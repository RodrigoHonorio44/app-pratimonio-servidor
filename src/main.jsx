import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css"; 
// Importamos o AuthProvider configurado no Firebase
import { AuthProvider } from "./services/firebase";
// Importamos o SetoresProvider para disponibilizar o contexto de setores globalmente
import { SetoresProvider } from "./components/constants/setores";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {/* O AuthProvider fornece os dados de autenticação */}
    <AuthProvider>
      {/* O SetoresProvider busca e provê a lista de unidades e setores do banco */}
      <SetoresProvider>
        <App />
      </SetoresProvider>
    </AuthProvider>
  </React.StrictMode>
);