import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "react-router-dom";
import RecuperationTable from "../components/RecuperationTable";
import RecuperationForm from "../components/RecuperationForm";
import CautionHeader from "../components/CautionHeader";
import NavigationMenu from "../components/NavigationMenu";
import Split from "@uiw/react-split";
import axios from "axios";
import api from "../utils/api";
import SidebarBootstrap from "../components/SidebarBootstrap";
import { useAuth } from "../context/AuthContext";

const Recuperation = () => {
  const [allRecuperations, setAllRecuperations] = useState([]);
  const [selectedRecuperation, setSelectedRecuperation] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const formRef = useRef();
  const { xnum_0 } = useParams();
  const { user } = useAuth();

  const fetchRecuperations = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get("/restitutions");
      console.log("Fetched recuperations:", response.data);
      setAllRecuperations(response.data);
    } catch (e) {
      setError(e.message);
      console.error("Failed to fetch recuperations:", e);
      setAllRecuperations([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const allResponse = await api.get("/restitutions");
        setAllRecuperations(allResponse.data);

        if (xnum_0) {
          const oneResponse = await api.get(`/restitutions/${xnum_0}`);
          setSelectedRecuperation(oneResponse.data);
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
    console.log("Form submission successful, refetching recuperations...");
    fetchRecuperations();
    setSelectedRecuperation(null);
    setIsEditMode(false);
  };

  const handleRecuperationRowSelect = (recuperation) => {
    setSelectedRecuperation(recuperation);
    setIsEditMode(false); // Just viewing, not editing
  };

  const handleFilterIconClick = useCallback((columnKey) => {
    console.log(`Filter clicked for column: ${columnKey}`);
  }, []);

  const handleDateFilterIconClick = useCallback((columnKey) => {
    console.log(`Date filter clicked for column: ${columnKey}`);
  }, []);

  const handleEditRecuperation = () => {
    console.log("Edit button clicked");
    setIsEditMode(true);
  };
  const handleDeleteRecuperation = async () => {
    if (!selectedRecuperation) return;

    const confirmDelete = window.confirm(
      `Êtes-vous sûr de vouloir supprimer la récupération ${selectedRecuperation.xnum_0} ?`
    );

    if (confirmDelete) {
      try {
        await api.delete(
          `/restitutions/${encodeURIComponent(selectedRecuperation.xnum_0)}`
        );
        alert("Récupération supprimée avec succès!");
        fetchRecuperations();
        setSelectedRecuperation(null);
        setIsEditMode(false);
      } catch (error) {
        console.error("Error deleting recuperation:", error);
        alert("Erreur lors de la suppression de la récupération");
      }
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
    setSelectedRecuperation(null); // Clear selected recuperation
    setIsEditMode(false); // Set to create mode
  };

  return (
    <>
      <CautionHeader user={user} />
      <div
        style={{
          height: "calc(100vh - 48px)",
          width: "100%",
          overflow: "hidden",
          marginTop: "48px" /* Match the header height */,
        }}
      >
        <Split
          style={{ height: "100%", width: "100%" }}
          split="vertical"
          sizes={[65, 35]}
          minSize={[300, 250]}
          maxSize={[Infinity, 600]}
          resizerStyle={{
            width: "6px",
            background: "#e0e0e0",
            cursor: "col-resize",
          }}
        >
          <div
            style={{
              width: "65%",
              minWidth: 0,
              overflow: "auto",
              background: "#fff",
              padding: "0.5rem",
              fontSize: "0.93rem",
              height: "100%",
            }}
          >
            {isLoading && (
              <p className="text-center mt-3" style={{ fontSize: "0.95rem" }}>
                Chargement des récupérations...
              </p>
            )}
            {error && (
              <p
                className="text-danger text-center mt-3"
                style={{ fontSize: "0.95rem" }}
              >
                Erreur de chargement: {error}
              </p>
            )}
            {!isLoading && (
              <RecuperationTable
                recuperations={allRecuperations}
                onRowClick={handleRecuperationRowSelect}
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
              <RecuperationForm
                ref={formRef}
                onSuccess={handleFormSuccess}
                initialData={selectedRecuperation}
                isEditMode={isEditMode}
                key={
                  selectedRecuperation
                    ? `${selectedRecuperation.xnum_0}-${isEditMode}`
                    : "new-recuperation-form"
                }
              />
            </div>{" "}
            <SidebarBootstrap
              selectedCaution={selectedRecuperation}
              onEditCaution={handleEditRecuperation}
              onDeleteCaution={handleDeleteRecuperation}
              onValidate={handleSidebarEdit}
              onSave={handleSidebarEdit} // Add onSave prop to handle sidebar save button
              onClearForm={handleClearForm}
              apiType="restitutions"
              userRole={user?.ROLE} // Pass user role for sidebar permissions
            />
          </div>
        </Split>
      </div>
    </>
  );
};

export default Recuperation;
