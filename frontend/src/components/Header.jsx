import React from "react";
import { Link } from "react-router-dom";
import "./Header.css"; // Assuming you have some CSS for the header

export default function Header() {
  return (
    <header className="header">
      <div className="logo">Mon Application</div>
      <nav>
        <Link to="/">Accueil</Link>
        <Link to="/flux-interne">Flux Interne</Link>
        <Link to="/flux-interne/consignation">Consignation</Link>
        <Link to="/flux-interne/deconsignation">Déconsignation</Link>
        <Link to="/depot-de-caution">Dépôt de Caution</Link>
        <Link to="/etat/caution">Etat</Link>
        <Link to="/recuperation">Récupération</Link>
        <Link to="/consign">Consign Form</Link>
      </nav>
    </header>
  );
}
