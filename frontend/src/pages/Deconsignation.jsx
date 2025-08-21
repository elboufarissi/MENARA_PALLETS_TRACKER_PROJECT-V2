import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "react-router-dom";
import DeconsignationTable from "../components/DeconsignationTable";
import DECONSIGNForm from "../components/DECONSIGNForm";
import CautionHeader from "../components/CautionHeader";
import NavigationMenu from "../components/NavigationMenu";
import Split from "@uiw/react-split";
import api from "../utils/api";
import SidebarBootstrap from "../components/SidebarBootstrap";
import { useAuth } from "../context/AuthContext";

export default function Deconsignation() {
  const [allDeconsignations, setAllDeconsignations] = useState([]);
  const [selectedDeconsignation, setSelectedDeconsignation] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const formRef = useRef();
  const { xnum_0 } = useParams();
  const { user } = useAuth(); // Get user role for permissions

  const fetchDeconsignations = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get("/deconsignations");
      console.log("Fetched deconsignations:", response.data);
      setAllDeconsignations(response.data);
    } catch (e) {
      setError(e.message);
      console.error("Failed to fetch deconsignations:", e);
      setAllDeconsignations([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // 1. Charger la liste complète
        const allResponse = await api.get("/deconsignations");
        setAllDeconsignations(allResponse.data);

        // 2. Si on a un xnum_0 dans l'URL, charger cette déconsignation uniquement
        if (xnum_0) {
          const oneResponse = await api.get(`/deconsignations/${xnum_0}`);
          setSelectedDeconsignation(oneResponse.data);
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
    console.log("Form submission successful, refetching deconsignations...");
    fetchDeconsignations();
    setSelectedDeconsignation(null);
    setIsEditMode(false);
  };

  const handleDeconsignationRowSelect = (deconsignation) => {
    setSelectedDeconsignation(deconsignation);
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

  const handleEditDeconsignation = (deconsignation) => {
    setSelectedDeconsignation(deconsignation);
    setIsEditMode(true);
  };

  const handleDeleteDeconsignation = async (deconsignation) => {
    if (!deconsignation || !deconsignation.xnum_0) return;
    if (
      !window.confirm(
        "Voulez-vous vraiment supprimer cette déconsignation ? Cette action est irréversible."
      )
    )
      return;
    try {
      await api.delete(
        `/deconsignations/${encodeURIComponent(deconsignation.xnum_0)}`
      );
      fetchDeconsignations();
      setSelectedDeconsignation(null);
      alert("Déconsignation supprimée avec succès.");
    } catch (e) {
      let msg = "Erreur lors de la suppression.";
      if (e.response?.data?.message) {
        msg += "\n" + e.response.data.message;
      } else if (e.response?.status === 404) {
        msg += "\nLa route ou la déconsignation n'existe pas sur le serveur.";
      }
      alert(msg);
    }
  };

  const handleSidebarEdit = () => {
    if (formRef.current) {
      formRef.current();
    }
  };

  const handleSave = () => {
    // Trigger form submission using the form ref
    if (formRef.current) {
      formRef.current(); // This should trigger the form submission
    }
  };

  // Handler to clear form from sidebar (add new)
  const handleClearForm = () => {
    if (formRef.current && formRef.current.clear) {
      formRef.current.clear(); // Clear the form using the clear method
    }
    setSelectedDeconsignation(null); // Clear selected deconsignation
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
                Chargement des déconsignations...
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
              <DeconsignationTable
                deconsignations={allDeconsignations}
                onRowClick={handleDeconsignationRowSelect}
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
              <DECONSIGNForm
                ref={formRef}
                onSuccess={handleFormSuccess}
                initialData={selectedDeconsignation}
                isEditMode={isEditMode}
                userRole={user?.ROLE} // Pass user role for permissions
                key={
                  selectedDeconsignation
                    ? `${selectedDeconsignation.xnum_0}-${isEditMode}`
                    : "new-deconsign-form"
                }
              />
            </div>
            <SidebarBootstrap
              selectedCaution={selectedDeconsignation}
              onEditCaution={handleEditDeconsignation}
              onDeleteCaution={handleDeleteDeconsignation}
              onValidate={handleSidebarEdit}
              onSave={handleSave}
              onClearForm={handleClearForm}
              apiType="deconsignations"
              userRole={user?.ROLE} // Pass user role for sidebar permissions
            />
          </div>
        </Split>
      </div>
    </>
  );
}
