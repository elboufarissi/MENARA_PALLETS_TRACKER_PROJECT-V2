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
import Audit from "./pages/Audit.jsx";
import PageLoader from "./components/PageLoader";
import RouteLoader from "./components/RouteLoader";   // ← add this

function ProtectedRoute({ allowedRoles, children }) {
  const { user, loading } = useAuth();

  if (loading) {
    // keep the auth-initialization loader
    return <PageLoader active text="Chargement...>>" />;
  }

  if (!user) return <Navigate to="/login" />;
  if (!allowedRoles.includes(user.ROLE)) return <Unauthorized />;
  return children;
}

function App() {
  const { user, loading } = useAuth();
  const isAuthenticated = !!localStorage.getItem("token") && !!user;

  if (loading) {
    // global first-load auth overlay
    return (
      <>
        <Layout />
        <PageLoader active text="Chargement..." />
      </>
    );
  }

  return (
    <Layout>
      {/* Loader on every route change, except audit & create-user */}
  {/* RouteLoader removed: now only used above CONSIGNForm */}

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
        <Route
          path="/audit"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <Audit />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Layout>
  );
}

export default App;
