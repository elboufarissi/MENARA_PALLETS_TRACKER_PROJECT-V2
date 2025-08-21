// frontend/src/pages/DepotCautionPage.jsx
import React, { useState, useEffect, useCallback } from "react";
import CautionTable from "../components/CautionTable";
import DepotCautionForm from "../components/CautionForm";
import Split from "@uiw/react-split";
// import { Container } from 'react-bootstrap'; // Container is not strictly needed here if App.js has one
import NavigationBar from "../components/NavigationBar"; // <-- IMPORT IT

const DepotCautionPage = () => {
  const [cautions, setCautions] = useState([]);
  const [selectedCaution, setSelectedCaution] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const pageBreadcrumbItems = [
    // For react-bootstrap Breadcrumb, href is used.
    // If you want to use react-router-dom Link, you might need to customize Breadcrumb.Item using 'linkAs' prop.
    { href: "/", label: "Palette Track" }, // Assuming '/' is your home/Tous
    { label: "Dépôt de caution" }, // Active item
  ];

  // ... (fetchCautions, handleFormSuccess, handleCautionRowSelect functions remain the same) ...
  const fetchCautions = useCallback(async () => {
    /* ...your existing fetchCautions ... */
  }, []);
  useEffect(() => {
    fetchCautions();
  }, [fetchCautions]);
  const handleFormSuccess = () => {
    fetchCautions();
    setSelectedCaution(null);
  };
  const handleCautionRowSelect = (caution) => {
    setSelectedCaution(caution);
  };

  return (
    <>
      {" "}
      {/* Using Fragment to avoid extra div */}
      <NavigationBar
        pageTitle="Dépôt de Caution"
        breadcrumbItems={pageBreadcrumbItems}
      />
      {isLoading && cautions.length === 0 && (
        <p className="px-3">Chargement des cautions...</p>
      )}
      {error && (
        <p className="text-danger px-3">
          Erreur de chargement des cautions: {error}
        </p>
      )}
      {/* Adjust height to account for the NavigationBar and main AppNavbar */}
      <Split
        mode="horizontal"
        style={{ height: "calc(100vh - 200px)", border: "1px solid #ddd" }}
      >
        <div style={{ width: "60%", overflow: "auto", padding: "10px" }}>
          <CautionTable
            cautions={cautions}
            onRowClick={handleCautionRowSelect}
          />
        </div>
        <div style={{ flexGrow: 1, overflow: "auto", padding: "10px" }}>
          <DepotCautionForm
            onSuccess={handleFormSuccess}
            initialData={selectedCaution}
            key={selectedCaution ? selectedCaution.xnum_0 : "new-caution-form"}
          />
        </div>
      </Split>
    </>
  );
};

export default DepotCautionPage;
