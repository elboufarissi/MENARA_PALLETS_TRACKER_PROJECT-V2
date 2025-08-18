import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import DepotCautionPage from "./pages/DepotCautionPage";
import FluxInterne from "./pages/FluxInterne";
import Consignation from "./pages/Consignation";
import Deconsignation from "./pages/Deconsignation";
import EtatCautionPage from "./pages/EtatCautionPage";
import Fichiers from "./pages/Fichiers";
import Recuperation from "./pages/Recuperation";
import SituationClient from "./pages/SituationClient";
import CreateUser from "./pages/CreateUser";
import "./App.css";
import "bootstrap/dist/css/bootstrap.min.css";
import LoginPage from "./pages/Login";
import HomePage from "./pages/Home";
import { useAuth } from "./context/AuthContext";
import Unauthorized from "./pages/Unauthorized";

function ProtectedRoute({ allowedRoles, children }) {
  const { user, loading } = useAuth();

  // Show loading while auth context is initializing
  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) return <Navigate to="/login" />;
  if (!allowedRoles.includes(user.ROLE)) return <Unauthorized />;
  return children;
}

function App() {
  const { user, loading } = useAuth();
  const isAuthenticated = !!localStorage.getItem("token") && !!user;

  // Show loading screen while auth is initializing
  if (loading) {
    return (
      <Layout>
        <div>Loading...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={isAuthenticated ? <Navigate to="/home" /> : <LoginPage />}
        />
        <Route
          path="/home"
          element={isAuthenticated ? <HomePage /> : <Navigate to="/login" />}
        />
        {/* Redirect uppercase to lowercase for consistency */}
        <Route path="/Home" element={<Navigate to="/home" />} />
        <Route
          path="/depot-de-caution"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "CAISSIER", "CAISSIERE"]}>
              <DepotCautionPage />
            </ProtectedRoute>
          }
        />
        <Route path="/flux-interne" element={<FluxInterne />} />
        <Route
          path="/flux-interne/consignation"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "AGENT_ORDONNANCEMENT"]}>
              <Consignation />
            </ProtectedRoute>
          }
        />
        <Route
          path="/flux-interne/situation-client"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "CAISSIER", "CAISSIERE"]}>
              <SituationClient />
            </ProtectedRoute>
          }
        />
        <Route
          path="/flux-interne/deconsignation"
          element={
            <ProtectedRoute
              allowedRoles={[
                "ADMIN",
                "CAISSIER",
                "CAISSIERE",
                "AGENT_ORDONNANCEMENT",
                "CHEF_PARC",
              ]}
            >
              <Deconsignation />
            </ProtectedRoute>
          }
        />
        <Route
          path="/etat-caution"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "CAISSIER", "CAISSIERE"]}>
              <EtatCautionPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/etat/:documentType"
          element={
            <ProtectedRoute
              allowedRoles={[
                "ADMIN",
                "CAISSIER",
                "CAISSIERE",
                "AGENT_ORDONNANCEMENT",
              ]}
            >
              <EtatCautionPage />
            </ProtectedRoute>
          }
        />
        <Route path="/fichiers" element={<Fichiers />} />
        <Route
          path="/recuperation"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "CAISSIER", "CAISSIERE"]}>
              <Recuperation />
            </ProtectedRoute>
          }
        />
        <Route
          path="/flux-interne/deconsignation/:xnum_0"
          element={
            <ProtectedRoute
              allowedRoles={[
                "ADMIN",
                "CAISSIER",
                "CAISSIERE",
                "AGENT_ORDONNANCEMENT",
                "CHEF_PARC",
              ]}
            >
              <Deconsignation />
            </ProtectedRoute>
          }
        />
        <Route
          path="/flux-interne/consignation/:xnum_0"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "AGENT_ORDONNANCEMENT"]}>
              <Consignation />
            </ProtectedRoute>
          }
        />
        <Route
          path="/depot-de-caution/:xnum_0"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "CAISSIER", "CAISSIERE"]}>
              <DepotCautionPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/recuperation/:xnum_0"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "CAISSIER", "CAISSIERE"]}>
              <Recuperation />
            </ProtectedRoute>
          }
        />
        <Route
          path="/create-user"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <CreateUser />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Layout>
  );
}

export default App;
