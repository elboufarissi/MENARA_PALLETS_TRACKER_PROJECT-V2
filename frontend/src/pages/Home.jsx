import React from "react";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import ptHomeBg from "../assets/pt_home_bg.png";

const roleColors = {
  ADMIN: "#d32f2f",
  CAISSIER: "#1976d2",
  CAISSIERE: "#1976d2",
  AGENT_ORDONNANCEMENT: "#ff9800",
  CHEF_PARC: "#388e3c",
};

export default function Home() {
  const { user, logout } = useAuth();
  const role = user?.ROLE;

  const roleLabel =
    role === "ADMIN"
      ? "Admin"
      : role === "CAISSIER"
      ? "Caissier"
      : role === "CAISSIERE"
      ? "Caissiere"
      : role === "AGENT_ORDONNANCEMENT"
      ? "Agent_ordonnancement"
      : role === "CHEF_PARC"
      ? "Chef_parc"
      : role;

  return (
    <div
      className="home-bg"
      style={{
        minHeight: "100vh",
        width: "100vw",
        background: `url(${ptHomeBg}) center center/cover no-repeat`,
        position: "fixed",
        top: 0,
        left: 0,
        overflow: "hidden",
      }}
    >
      <div
        className="container mt-4"
        style={{ position: "relative", zIndex: 2 }}
      >
        <h2>Accueil - Palette Track</h2>
        {user && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "#eaf6fb",
              borderRadius: 8,
              padding: "16px 28px",
              marginBottom: 28,
              boxShadow: "0 1px 4px #e0e0e0",
            }}
          >
            <div
              style={{
                fontSize: 19,
                fontWeight: 500,
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              Bonjour, {user.FULL_NAME || user.USERNAME}{" "}
              <span style={{ fontSize: 22, marginLeft: 2 }}>👋</span>
              <span
                style={{
                  display: "inline-block",
                  marginLeft: 10,
                  padding: "2px 12px",
                  borderRadius: 12,
                  fontSize: 15,
                  fontWeight: 600,
                  color: "#fff",
                  background: roleColors[role] || "#757575",
                  textTransform: "capitalize",
                  letterSpacing: "0.5px",
                  boxShadow: "0 1px 4px #e0e0e0",
                }}
              >
                {roleLabel}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
              <button
                onClick={logout}
                title="Déconnexion"
                style={{
                  background: "#d32f2f",
                  color: "#fff",
                  border: "none",
                  borderRadius: 4,
                  padding: "7px 14px",
                  fontSize: 18,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <span style={{ fontSize: 15, marginLeft: 4 }}>Déconnexion</span>
              </button>
            </div>
          </div>
        )}
        {/* Button grid with two rows */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 32,
            marginTop: 40,
          }}
        >
          {/* First row */}
          <div style={{ display: "flex", gap: 32 }}>
            {(role === "ADMIN" ||
              role === "CAISSIER" ||
              role === "CAISSIERE") && (
              <Link
                to="/depot-de-caution"
                className="btn btn-primary"
                style={{ minWidth: 160, fontSize: 18 }}
              >
                Dépôt Caution
              </Link>
            )}
            {(role === "ADMIN" || role === "AGENT_ORDONNANCEMENT") && (
              <Link
                to="/flux-interne/consignation"
                className="btn btn-primary"
                style={{ minWidth: 160, fontSize: 18 }}
              >
                Consignation
              </Link>
            )}
            {(role === "ADMIN" ||
              role === "CAISSIER" ||
              role === "CAISSIERE" ||
              role === "AGENT_ORDONNANCEMENT" ||
              role === "CHEF_PARC") && (
              <Link
                to="/flux-interne/deconsignation"
                className="btn btn-primary"
                style={{ minWidth: 160, fontSize: 18 }}
              >
                Déconsignation
              </Link>
            )}
            {(role === "ADMIN" ||
              role === "CAISSIER" ||
              role === "CAISSIERE") && (
              <Link
                to="/recuperation"
                className="btn btn-primary"
                style={{ minWidth: 160, fontSize: 18 }}
              >
                Récupération
              </Link>
            )}
          </div>
          {/* Second row */}
          <div style={{ display: "flex", gap: 32 }}>
            {(role === "ADMIN" ||
              role === "CAISSIER" ||
              role === "CAISSIERE") && (
              <Link
                to="/flux-interne/situation-client"
                className="btn btn-success"
                style={{ minWidth: 160, fontSize: 18 }}
              >
                Situation Client
              </Link>
            )}
            {role === 'ADMIN' && (
  <div className="d-flex gap-2">
    <Link
      to="/create-user"
      className="btn btn-secondary"
      style={{ minWidth: 160, fontSize: 18, background: '#6c757d', color: '#fff' }}
      onClick={() => {
        console.log('Gestion Utilisateurs button clicked!');
        console.log('Navigating to: /create-user');
        console.log('Current user role:', role);
      }}
    >
      Gestion Utilisateurs
    </Link>

    <Link
      to="/audit"
      className="btn btn-primary"
      style={{ minWidth: 160, fontSize: 18 }}
      onClick={() => {
        console.log('Audit button clicked!');
        console.log('Navigating to: /audit');
        console.log('Current user role:', role);
      }}
    >
      Audit
    </Link>
  </div>
)}
          </div>
        </div>
      </div>
    </div>
  );
}
