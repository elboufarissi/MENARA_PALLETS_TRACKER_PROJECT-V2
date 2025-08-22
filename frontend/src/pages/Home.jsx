import React from "react";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import ptHomeBg from "../assets/pt_home_bg.png";
import { FaUserShield, FaCashRegister, FaBoxOpen, FaFileInvoice, FaUsers, FaClipboardCheck } from "react-icons/fa";

const roleColors = {
  ADMIN: "#d32f2f",
  CAISSIER: "#1976d2",
  CAISSIERE: "#1976d2",
  AGENT_ORDONNANCEMENT: "#ff9800",
  CHEF_PARC: "#388e3c",
};

const cardData = [
  { label: "Dépôt Caution", to: "/depot-de-caution", roles: ["ADMIN","CAISSIER","CAISSIERE"], icon: <FaCashRegister /> },
  { label: "Consignation", to: "/flux-interne/consignation", roles: ["ADMIN","AGENT_ORDONNANCEMENT"], icon: <FaBoxOpen /> },
  { label: "Déconsignation", to: "/flux-interne/deconsignation", roles: ["ADMIN","CAISSIER","CAISSIERE","AGENT_ORDONNANCEMENT","CHEF_PARC"], icon: <FaClipboardCheck /> },
  { label: "Récupération", to: "/recuperation", roles: ["ADMIN","CAISSIER","CAISSIERE"], icon: <FaFileInvoice /> },
  { label: "Situation Client", to: "/flux-interne/situation-client", roles: ["ADMIN","CAISSIER","CAISSIERE"], icon: <FaFileInvoice /> },
  { label: "Gestion Utilisateurs", to: "/create-user", roles: ["ADMIN"], icon: <FaUsers /> },
  { label: "Audit", to: "/audit", roles: ["ADMIN"], icon: <FaUserShield /> },
];

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
  style={{
    width: "100vw",
    minHeight: "100vh", // ✅ occupe toute la hauteur visible
    background: `url(${ptHomeBg}) center center/cover no-repeat`,
    position: "relative", // ✅ au lieu de fixed
    top: 0,
    left: 0,
    overflowX: "hidden",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    fontFamily: "Dax light",
  }}
>

    {/* Header Innovant */}
<div
  style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 32px",
    background: "linear-gradient(120deg, #252d4b, #6f6f6f, #252d4b)",
    backgroundSize: "300% 300%",
    animation: "gradientMove 15s ease infinite",
    color: "#fff",
    boxShadow: "0 10px 25px rgba(0,0,0,0.4)",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    position: "sticky",
    top: 0,
    zIndex: 10,
  }}
>
  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
    {/* Avatar circulaire */}
    <div
      style={{
        width: 50,
        height: 50,
        borderRadius: "50%",
        background: roleColors[role] || "#757575",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontSize: 22,
        fontWeight: 700,
        color: "#fff",
        boxShadow: "0 0 15px rgba(255,255,255,0.3)",
        animation: "pulse 2s infinite",
      }}
    >
      {user?.FULL_NAME ? user.FULL_NAME[0] : user?.USERNAME[0]}
    </div>
    <div style={{ display: "flex", flexDirection: "column" }}>
      <span style={{ fontSize: 20, fontWeight: 600 }}>Bonjour, {user?.FULL_NAME || user?.USERNAME}</span>
      <span
        style={{
          marginTop: 4,
          padding: "4px 14px",
          borderRadius: 16,
          fontSize: 14,
          fontWeight: 600,
          color: "#fff",
          background: roleColors[role] || "#757575",
          textTransform: "capitalize",
          boxShadow: "0 0 12px rgba(0,0,0,0.4)",
          animation: "glow 2s ease-in-out infinite alternate",
        }}
      >
        {roleLabel}
      </span>
    </div>
  </div>
  <button
    onClick={logout}
    style={{
      background: "#d32f2f",
      color: "#fff",
      border: "none",
      borderRadius: 12,
      padding: "10px 20px",
      fontSize: 16,
      fontWeight: 600,
      cursor: "pointer",
      boxShadow: "0 4px 15px rgba(0,0,0,0.5)",
      transition: "all 0.3s ease",
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = "scale(1.1)";
      e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.6)";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = "scale(1)";
      e.currentTarget.style.boxShadow = "0 4px 15px rgba(0,0,0,0.5)";
    }}
  >
    Déconnexion
  </button>

  {/* Keyframes pour animations */}
  <style>{`
    @keyframes gradientMove {
      0% {background-position: 0% 50%;}
      50% {background-position: 100% 50%;}
      100% {background-position: 0% 50%;}
    }
    @keyframes pulse {
      0% {box-shadow: 0 0 15px rgba(255,255,255,0.3);}
      50% {box-shadow: 0 0 25px rgba(255,255,255,0.6);}
      100% {box-shadow: 0 0 15px rgba(255,255,255,0.3);}
    }
    @keyframes glow {
      0% {box-shadow: 0 0 8px rgba(255,255,255,0.3);}
      100% {box-shadow: 0 0 20px rgba(255,255,255,0.6);}
    }
  `}</style>
</div>


      {/* Options Section */}
      <div
        style={{
          display: "flex",
          gap: 20,
          padding: "40px 32px",
          overflowX: "auto",
          scrollBehavior: "smooth",
        }}
      >
        {cardData
          .filter((card) => card.roles.includes(role))
          .map((card, index) => (
            <Link
              key={index}
              to={card.to}
              style={{
                minWidth: 180,
                minHeight: 140,
                background: "#252d4b",
                color: "#fff",
                borderRadius: 20,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
                fontWeight: 600,
                textDecoration: "none",
                boxShadow: "0 8px 20px rgba(0,0,0,0.4)",
                transition: "all 0.4s ease",
                flexShrink: 0,
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-10px) scale(1.05)";
                e.currentTarget.style.boxShadow = "0 12px 30px rgba(0,0,0,0.5)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0) scale(1)";
                e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.4)";
              }}
            >
              <div style={{ fontSize: 36, marginBottom: 12 }}>{card.icon}</div>
              {card.label}
            </Link>
          ))}
      </div>
    </div>
  );
}
