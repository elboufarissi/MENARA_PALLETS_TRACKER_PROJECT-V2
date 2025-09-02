import React from "react";
import "./LoadingSpinner.css";

const LoadingSpinner = ({ show = false, text = "Chargement..." }) => {
  // Only render the loading overlay when show is true
  if (!show) {
    return null;
  }

  return (
    <div className="loading-overlay">
      <div className="loading-spinner"></div>
      {text && <div className="loading-text">{text}</div>}
    </div>
  );
};

export default LoadingSpinner;
