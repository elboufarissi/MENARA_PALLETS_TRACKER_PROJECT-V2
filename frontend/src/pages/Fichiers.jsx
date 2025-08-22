import React from "react";
import Breadcrumb from "../components/Breadcrumb";

export default function Fichiers() {
  const breadcrumbItems = [
    { label: "Palette Track", href: "/" },
    { label: "Les fichiers" }
  ];

  return (
    <div className="container mt-3" style={{overflowY: 'auto', maxHeight: '100vh'}}>
      <Breadcrumb items={breadcrumbItems} />
      <h3>Page des fichiers</h3>
    </div>
  );
}