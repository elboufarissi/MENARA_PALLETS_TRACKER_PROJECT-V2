import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Dropdown } from "react-bootstrap";
import "./NavigationMenu.css";
import { useAuth } from "../context/AuthContext";

const NavigationMenu = () => {
  const [showPalettesDropdown, setShowPalettesDropdown] = useState(false);
  const [showCautionSubmenu, setShowCautionSubmenu] = useState(false);
  const [showFluxInternesSubmenu, setShowFluxInternesSubmenu] = useState(false);
  const location = useLocation();
  const { user } = useAuth();
  const role = user?.ROLE;

  const togglePalettesDropdown = () => {
    setShowPalettesDropdown(!showPalettesDropdown);
  };

  const toggleCautionSubmenu = () => {
    setShowCautionSubmenu(!showCautionSubmenu);
  };

  const toggleFluxInternesSubmenu = () => {
    setShowFluxInternesSubmenu(!showFluxInternesSubmenu);
  };

  // Function to determine the current section based on route
  const getCurrentSection = () => {
    const path = location.pathname;

    // Check if we're in any flux internes related routes
    if (path.includes("/flux-interne")) {
      return "Flux internes";
    }

    // Check if we're in caution related routes
    if (path.includes("/depot-de-caution") || path.includes("/recuperation")) {
      return "Caution";
    }

    // Default to Caution for other routes
    return "Caution";
  };

  return (
    <div className="sage-double-menu-container">
      {" "}
      {/* Top breadcrumb bar with dropdown positioned to the right */}
      <div style={{ padding: 0, margin: 0 }}>
        <div
          className="sage-breadcrumb"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <span style={{ color: "#0066cc", cursor: "pointer" }}>Tous</span>
            <span className="sage-breadcrumb-sep">›</span>
            <span
              style={{ color: "#0066cc", cursor: "pointer" }}
              onClick={togglePalettesDropdown}
            >
              Palettes-Track
            </span>
            <span className="sage-breadcrumb-sep">›</span>
            <span style={{ color: "#333", fontWeight: "normal" }}>
              {getCurrentSection()}
            </span>
          </div>
          
        </div>
      </div>
      {/* Palettes-Track Dropdown Menu */}
      {showPalettesDropdown && (
        <div className="sage-palettes-dropdown">
          <div className="sage-dropdown-content">
            {/* Flux internes section - now clickable like Caution */}
            <div className="sage-dropdown-section-with-icon">
              <div className="sage-caution-section">
                <div className="sage-caution-menu">
                  <div
                    className="sage-caution-header"
                    onClick={toggleFluxInternesSubmenu}
                  >
                    <span className="sage-dropdown-arrow">⌄</span>
                    <span className="sage-caution-title">Flux internes</span>
                  </div>
                  {showFluxInternesSubmenu && (
                    <div className="sage-caution-submenu">
                      {["ADMIN", "AGENT_ORDONNANCEMENT"].includes(role) && (
                        <Link
                          to="/flux-interne/consignation"
                          className="sage-submenu-link"
                        >
                          Consignation
                        </Link>
                      )}
                      {[
                        "ADMIN",
                        "CAISSIER",
                        "CAISSIERE",
                        "AGENT_ORDONNANCEMENT",
                        "CHEF_PARC",
                      ].includes(role) && (
                        <Link
                          to="/flux-interne/deconsignation"
                          className="sage-submenu-link"
                        >
                          Déconsignation
                        </Link>
                      )}
                      {["ADMIN", "CAISSIER", "CAISSIERE"].includes(role) && (
                        <Link
                          to="/flux-interne/situation-client"
                          className="sage-submenu-link"
                        >
                          Situation client
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Caution section */}
            <div className="sage-dropdown-section-with-icon">
              <div className="sage-caution-section">
                <div className="sage-caution-menu">
                  <div
                    className="sage-caution-header"
                    onClick={toggleCautionSubmenu}
                  >
                    <span className="sage-dropdown-arrow">⌄</span>
                    <span className="sage-caution-title">Caution</span>
                  </div>
                  {showCautionSubmenu && (
                    <div className="sage-caution-submenu">
                      {["ADMIN", "CAISSIER", "CAISSIERE"].includes(role) && (
                        <Link
                          to="/depot-de-caution"
                          className="sage-submenu-link"
                        >
                          Dépôt de Caution
                        </Link>
                      )}
                      {["ADMIN", "CAISSIER", "CAISSIERE"].includes(role) && (
                        <Link
                          to="/recuperation"
                          className="sage-submenu-link"
                        >
                          Récupération de Caution
                        </Link>
                      )}
                      {["ADMIN", "CAISSIER", "CAISSIERE"].includes(role) && (
                        <Link to="/etat/caution" className="sage-submenu-link">
                          État
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NavigationMenu;
