import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "react-router-dom";
import CautionTable from "../components/CautionTable";
import DepotCautionForm from "../components/CautionForm";
import CautionHeader from "../components/CautionHeader";
import NavigationMenu from "../components/NavigationMenu";
import Split from "@uiw/react-split";
import api from "../utils/api";
import SidebarBootstrap from "../components/SidebarBootstrap";
import { useAuth } from "../context/AuthContext";

const DepotCautionPage = () => {
  const [allCautions, setAllCautions] = useState([]);
  const [selectedCaution, setSelectedCaution] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const formRef = useRef();
  const { xnum_0 } = useParams();
  const { user } = useAuth();

  const fetchCautions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get("/xcaution");
      console.log("Fetched cautions:", response.data);
      setAllCautions(response.data);
    } catch (e) {
      setError(e.message);
      console.error("Failed to fetch cautions:", e);
      setAllCautions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // 1. Charger toutes les cautions pour la table
        const allResponse = await api.get("/xcaution");
        setAllCautions(allResponse.data);

        // 2. Si un code est dans l'URL, charger cette caution
        if (xnum_0) {
          const oneResponse = await api.get(`/xcaution/${xnum_0}`);
          setSelectedCaution(oneResponse.data);
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
    console.log("Form submission successful, refetching cautions...");
    fetchCautions();
    setSelectedCaution(null);
    setIsEditMode(false);
  };

  const handleCautionRowSelect = (caution) => {
    setSelectedCaution(caution);
    setIsEditMode(false); // Just viewing, not editing
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

  // Handler for edit (set the selected caution in edit mode)
  const handleEditCaution = (caution) => {
    setSelectedCaution(caution);
    setIsEditMode(true);
  };

  // Handler for delete (remove from backend and refresh)
  const handleDeleteCaution = async (caution) => {
    if (!caution || !caution.xnum_0) return;
    if (
      !window.confirm(
        "Voulez-vous vraiment supprimer cette caution ? Cette action est irréversible."
      )
    )
      return;
    try {
      await api.delete(`/xcaution/${encodeURIComponent(caution.xnum_0)}`);
      fetchCautions();
      setSelectedCaution(null);
      alert("Caution supprimée avec succès.");
    } catch (e) {
      let msg = "Erreur lors de la suppression.";
      if (e.response?.data?.message) {
        msg += "\n" + e.response.data.message;
      } else if (e.response?.status === 404) {
        msg += "\nLa route ou la caution n'existe pas sur le serveur.";
      }
      alert(msg);
    }
  };

  // Handler to validate caution (change xvalsta_0 from 1 to 2)
  const handleValidateCaution = async (caution) => {
    if (!caution || !caution.xnum_0) {
      alert("Veuillez sélectionner une caution à valider.");
      return;
    }

    if (caution.xvalsta_0 === 2) {
      alert("Cette caution est déjà validée.");
      return;
    }

    try {
      // Make PUT request to validate the caution
      const response = await api.put(
        `/xcaution/${encodeURIComponent(caution.xnum_0)}`,
        {
          xvalsta_0: 2,
          xcin_0: caution.xcin_0,
          montant: caution.montant,
        }
      );

      console.log("Caution validation successful:", response.data);
      alert("Caution validée avec succès!");

      // Refresh the cautions list
      fetchCautions();

      // Update the selected caution to show it's validated
      setSelectedCaution({
        ...caution,
        xvalsta_0: 2,
      });
    } catch (e) {
      console.error("Failed to validate caution:", e);
      let msg = "Erreur lors de la validation de la caution.";
      if (e.response?.data?.errors) {
        const errors = Object.values(e.response.data.errors).flat();
        msg += "\n" + errors.join("\n");
      } else if (e.response?.data?.message) {
        msg += "\n" + e.response.data.message;
      } else if (e.response?.status === 404) {
        msg += "\nLa route ou la caution n'existe pas sur le serveur.";
      }
      alert(msg);
    }
  };

  // Handler to trigger form submit from sidebar (save/edit)
  const handleSaveForm = () => {
    if (formRef.current) {
      formRef.current.submit();
    }
  };

  // Handler to clear form from sidebar (add new)
  const handleClearForm = () => {
    setSelectedCaution(null); // Clear selected caution
    setIsEditMode(false); // Set to create mode
  };

  return (
    <>
      <CautionHeader user={user} />
      <div
        style={{
          background: "#f4f6f8",
          minHeight: "calc(100vh - 48px)" /* Adjust for header height */,
          padding: 0,
          margin: 0,
          marginTop: "48px" /* Match the header height */,
        }}
      >
        <Split
          mode="horizontal"
          style={{
            height: "calc(100vh - 48px)" /* Adjust for header height */,
            borderTop: "1px solid #d6d6d6",
            background: "#f4f6f8",
            padding: 0,
            margin: 0,
          }}
        >
          <div
            style={{
              width: "65%",
              minWidth: 0,
              overflow: "hidden",
              padding: 0,
              margin: 0,
              background: "#f4f6f8",
              borderRight: "1px solid #e0e0e0",
              fontSize: "0.93rem",
              height: '100%',
              boxSizing: 'border-box',
            }}
          >
            {isLoading && (
              <p className="text-center mt-3" style={{ fontSize: "0.95rem" }}>
                Chargement des cautions...
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
              <CautionTable
                cautions={allCautions}
                onRowClick={handleCautionRowSelect}
                onFilterIconClick={handleFilterIconClick}
                onDateFilterIconClick={handleDateFilterIconClick}
              />
            )}
          </div>
          <div
            style={{
              width: "35%",
              minWidth: 0,
              overflow: "hidden",
              background: "#fff",
              boxShadow: "0 0 4px #e0e0e0",
              padding: 0,
              margin: 0,
              fontSize: "0.93rem",
              display: "flex",
              flexDirection: "row",
              alignItems: "flex-start",
              height: "100%",
              boxSizing: 'border-box',
            }}
          >
            <div style={{ flex: 1, padding: 0, margin: 0 }}>
              <NavigationMenu />
              <DepotCautionForm
                ref={formRef}
                onSuccess={handleFormSuccess}
                initialData={selectedCaution}
                isEditMode={isEditMode}
                key={
                  selectedCaution
                    ? `${selectedCaution.xnum_0}-${isEditMode}`
                    : "new-caution-form"
                }
              />
            </div>
            <SidebarBootstrap
              selectedCaution={selectedCaution}
              onEditCaution={handleEditCaution}
              onDeleteCaution={handleDeleteCaution}
              onSave={handleSaveForm} // For saving new cautions or editing existing ones
              onValidate={() => handleValidateCaution(selectedCaution)} // For validating existing cautions
              onClearForm={handleClearForm}
              userRole={user?.ROLE} // Pass user role for sidebar permissions
            />
          </div>
        </Split>
      </div>
    </>
  );
};

export default DepotCautionPage;
