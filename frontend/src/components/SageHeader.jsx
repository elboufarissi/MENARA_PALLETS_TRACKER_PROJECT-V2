import React from "react";
import {
  FaHome,
  FaQuestionCircle,
  FaStar,
  FaSearch,
  FaSignOutAlt,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "./CautionHeader.css";

const CautionHeader = ({ user }) => {
  const navigate = useNavigate();

  const handleHomeClick = () => {
    navigate("/");
  };

  return (
    <header className="caution-header">
      <div className="caution-header-left">
        <span className="caution-logo caution-logo-black">
          Dépôt de caution
        </span>
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
        <FaSignOutAlt className="caution-header-icon" />
      </div>
    </header>
  );
};

export default CautionHeader;
