import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "react-router-dom";
import ConsignationTable from "../components/ConsignationTable";
import CONSIGNForm from "../components/CONSIGNForm";
import CautionHeader from "../components/CautionHeader";
import NavigationMenu from "../components/NavigationMenu";
import Split from "@uiw/react-split";
import api from "../utils/api";
import SidebarBootstrap from "../components/SidebarBootstrap";
import { useAuth } from "../context/AuthContext";

export default function Consignation() {
  const [allConsignations, setAllConsignations] = useState([]);
  const [selectedConsignation, setSelectedConsignation] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const formRef = useRef();
  const { xnum_0 } = useParams();
  const { user } = useAuth(); // Get user role for permissions
  const fetchConsignations = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get("/consignations");
      console.log("Fetched consignations:", response.data);
      setAllConsignations(response.data);
    } catch (e) {
      setError(e.message);
      console.error("Failed to fetch consignations:", e);
      setAllConsignations([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // 1. Charger la liste complète pour la table
        const allResponse = await api.get("/consignations");
        setAllConsignations(allResponse.data);

        // 2. Charger la consignation sélectionnée s'il y a un xnum_0 dans l'URL
        if (xnum_0) {
          const oneResponse = await api.get(`/consignations/${xnum_0}`);
          setSelectedConsignation(oneResponse.data);
          setIsEditMode(false);
        }
      } catch (e) {
        console.error("Erreur lors du chargement :", e);
        setError("Erreur lors du chargement des données.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [xnum_0]);

  const handleFormSuccess = () => {
    console.log("Form submission successful, refetching consignations...");
    fetchConsignations();
    setSelectedConsignation(null);
    setIsEditMode(false);
  };

  const handleConsignationRowSelect = (consignation) => {
    setSelectedConsignation(consignation);
    setIsEditMode(false);
  };

  const handleFilterIconClick = useCallback((columnKey) => {
    console.log(
      `Filter icon clicked for: ${columnKey}. Filter UI not implemented yet.`
    );
  }, []);

  const handleDateFilterIconClick = useCallback((columnKey) => {
    console.log(
      `Calendar icon clicked for date filter: ${columnKey}. Date picker not implemented yet.`
    );
  }, []);

  const handleEditConsignation = (consignation) => {
    setSelectedConsignation(consignation);
    setIsEditMode(true);
  };

  const handleDeleteConsignation = async (consignation) => {
    if (!consignation || !consignation.xnum_0) return;
    if (
      !window.confirm(
        "Voulez-vous vraiment supprimer cette consignation ? Cette action est irréversible."
      )
    )
      return;
    try {
      await api.delete(
        `/consignations/${encodeURIComponent(consignation.xnum_0)}`
      );
      fetchConsignations();
      setSelectedConsignation(null);
      alert("Consignation supprimée avec succès.");
    } catch (e) {
      let msg = "Erreur lors de la suppression.";
      if (e.response?.data?.message) {
        msg += "\n" + e.response.data.message;
      } else if (e.response?.status === 404) {
        msg += "\nLa route ou la consignation n'existe pas sur le serveur.";
      }
      alert(msg);
    }
  };

  // Handler to trigger form submit from sidebar (save/edit)
  const handleSaveForm = () => {
    if (formRef.current) {
      formRef.current();
    }
  };

  const handleSidebarEdit = () => {
    if (formRef.current) {
      formRef.current();
    }
  };

  // Handler to clear form from sidebar (add new)
  const handleClearForm = () => {
    if (formRef.current && formRef.current.clear) {
      formRef.current.clear(); // Clear the form using the clear method
    }
    setSelectedConsignation(null); // Clear selected consignation
    setIsEditMode(false); // Set to create mode
  };

  // Removed unused splitViewHeight variable

  return (
    <>
      <CautionHeader user={user} />
      <div
        style={{
          background: "#f4f6f8",
          minHeight: "calc(100vh - 48px)",
          padding: 0,
          margin: 0,
          marginTop: "48px" /* Match the header height */,
        }}
      >
        <Split
          mode="horizontal"
          style={{
            height:
              "calc(100vh - 48px)" /* Using direct calculation instead of variable */,
            width: "100vw",
            margin: 0,
            padding: 0,
          }}
        >
          <div
            style={{
              width: "65%",
              minWidth: 0,
              overflow: "auto",
              background: "#f8f9fa",
              padding: 0,
              margin: 0,
            }}
          >
            {/* Removed duplicate CautionHeader */}
            {isLoading && (
              <p style={{ padding: "1rem", textAlign: "center" }}>
                Chargement des consignations...
              </p>
            )}
            {error && (
              <p
                style={{
                  padding: "1rem",
                  textAlign: "center",
                  color: "red",
                }}
              >
                Erreur: {error}
              </p>
            )}
            {!isLoading && (
              <ConsignationTable
                consignations={allConsignations}
                onRowClick={handleConsignationRowSelect}
                onFilterIconClick={handleFilterIconClick}
                onDateFilterIconClick={handleDateFilterIconClick}
              />
            )}
          </div>
          <div
            style={{
              width: "35%",
              minWidth: 0,
              overflow: "auto",
              background: "#fff",
              boxShadow: "0 0 4px #e0e0e0",
              padding: 0,
              margin: 0,
              fontSize: "0.93rem",
              display: "flex",
              flexDirection: "row",
              alignItems: "flex-start",
              height: "100%",
            }}
          >
            <div style={{ flex: 1, padding: 0, margin: 0 }}>
              <NavigationMenu />
              <CONSIGNForm
                ref={formRef}
                onSuccess={handleFormSuccess}
                initialData={selectedConsignation}
                isEditMode={isEditMode}
                key={
                  selectedConsignation
                    ? `${selectedConsignation.xnum_0}-${isEditMode}`
                    : "new-consign-form"
                }
              />
            </div>
            <SidebarBootstrap
              selectedCaution={selectedConsignation}
              onEditCaution={handleEditConsignation}
              onDeleteCaution={handleDeleteConsignation}
              onValidate={handleSidebarEdit}
              onSave={handleSaveForm}
              onClearForm={handleClearForm}
              apiType="consignations"
              userRole={user?.ROLE} // Pass user role for sidebar permissions
            />
          </div>
        </Split>
      </div>
    </>
  );
}
