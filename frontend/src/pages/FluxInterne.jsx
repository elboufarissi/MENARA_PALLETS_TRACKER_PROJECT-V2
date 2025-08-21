import React from "react";
import { Link } from "react-router-dom";
import Breadcrumb from "../components/Breadcrumb";

export default function FluxInterne() {
  const breadcrumbItems = [
    { label: "Palette Track", href: "/" },
    { label: "Flux interne" },
  ];

  return (
    <div className="container mt-3">
      <Breadcrumb items={breadcrumbItems} />

      <h3>Flux Interne</h3>
      <p>Gestion des consignations et déconsignations</p>

      <div className="row mt-4">
        <div className="col-md-6 mb-3">
          <div className="card">
            <div className="card-body">
              <h5>Consignation</h5>
              <p>Enregistrer l'entrée de palettes en consignation</p>
              <Link to="/flux-interne/consignation" className="btn btn-success">
                Accéder à la Consignation
              </Link>
            </div>
          </div>
        </div>

        <div className="col-md-6 mb-3">
          <div className="card">
            <div className="card-body">
              <h5>Déconsignation</h5>
              <p>Enregistrer la sortie de palettes de consignation</p>
              <Link
                to="/flux-interne/deconsignation"
                className="btn btn-warning"
              >
                Accéder à la Déconsignation
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
