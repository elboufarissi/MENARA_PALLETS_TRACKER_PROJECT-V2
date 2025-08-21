import React from "react";
import {
  FaHome,
  FaQuestionCircle,
  FaStar,
  FaSearch,
  // FaSignOutAlt, // TODO: Use when logout functionality is needed
  // FaBell, // Replaced with NotificationBell component
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import NotificationBell from "./NotificationBell";
import "./CautionHeader.css";

const CautionHeader = ({ onValidationClick, user }) => {
  const navigate = useNavigate();

  const handleHomeClick = () => {
    navigate("/");
  };

  return (
    <header className="caution-header">
      {" "}
      <div className="caution-header-left">
        <span className="caution-logo caution-logo-black">Palettes-Track</span>
        <FaHome
          className="caution-header-icon"
          onClick={handleHomeClick}
          style={{ cursor: "pointer" }}
          title="Retour à l'accueil"
        />
      </div>
      <div className="caution-header-right">
        <span className="caution-header-user">
          {user?.FULL_NAME || "Super administrator"}
        </span>
        <span className="caution-header-user">
          {user?.ROLE || "Super administrateur"}
        </span>
        <span className="caution-header-user">PLT</span>
        <FaQuestionCircle className="caution-header-icon" />
        <FaStar className="caution-header-icon" />
        <FaSearch className="caution-header-icon" />
        <NotificationBell userRole={user?.ROLE} />
      </div>
    </header>
  );
};

export default CautionHeader;
