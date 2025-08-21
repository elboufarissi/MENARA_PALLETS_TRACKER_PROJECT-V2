import React from "react";
import { useNavigate } from "react-router-dom";

export default function Unauthorized() {
  const navigate = useNavigate();
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      height: "80vh",
      color: "#333"
    }}>
      <div style={{ fontSize: 60, color: "#d32f2f", marginBottom: 16 }}>
        <span role="img" aria-label="warning">&#9888;</span>
      </div>
      <h2 style={{ marginBottom: 12, fontWeight: 500, textAlign: "center" }}>
        Vous n'avez pas la permission d'accéder à cette page
      </h2>
      <div style={{ color: "#607d8b", fontSize: 16, textAlign: "center" }}>
        Veuillez revenir à la page précédente ou vous connecter avec un autre compte.
      </div>
      <button
        onClick={() => navigate("/")}
        style={{
          marginTop: 32,
          padding: "10px 24px",
          background: "#1976d2",
          color: "#fff",
          border: "none",
          borderRadius: 4,
          fontSize: 16,
          cursor: "pointer",
          fontWeight: 500,
          boxShadow: "0 2px 8px #e0e0e0"
        }}
      >
        Revenir à la page d'Accueil
      </button>
    </div>
  );
}
