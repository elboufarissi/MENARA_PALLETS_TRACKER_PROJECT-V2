import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { Navbar } from "react-bootstrap";
import {
  FaCalendarAlt,
  FaQuestionCircle,
  FaRegStar,
  FaCaretDown,
  FaCompass,
  FaSearch,
} from "react-icons/fa";
import "./Header.css";

const Header = () => {
  return (
    <Navbar bg="light" className="header">
      <div className="d-flex align-items-center">
        <span
          className="fw-bold text-success me-2"
          style={{ fontSize: "19px" }}
        >
          Palette Track
        </span>
        <span className="me-3 fw-medium">X3</span>
        <FaCalendarAlt className="text-muted" />
      </div>

      <div className="d-flex align-items-center">
        <span className="me-3 text-muted">Super administrator</span>
        <span className="me-3 text-muted">Super administrator</span>
        <span className="me-3 fw-bold">PLT</span>

        <FaQuestionCircle className="me-3 text-muted" />
        <FaRegStar className="me-1 text-muted" />
        <FaCaretDown className="me-3 text-muted" />
        <FaCompass className="me-3 text-muted" />
        <FaSearch className="text-muted" />
      </div>
    </Navbar>
  );
};

export default Header;
