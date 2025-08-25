import React from "react";
import "./LoadingOverlay.css";

export default function LoadingOverlay({ show, text = "Chargement..." }) {
  if (!show) return null;

  return (
    <div className="loading-overlay">
      <div className="loading-box">
        <div className="spinner"></div>
        <span>{text}</span>
      </div>
    </div>
  );
}
