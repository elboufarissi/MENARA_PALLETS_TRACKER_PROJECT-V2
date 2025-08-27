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
  const [isRefreshing, setIsRefreshing] = useState(false); // Separate state for refresh operations
  const [error, setError] = useState(null);
  const formRef = useRef();
  const { xnum_0 } = useParams();
  const { user } = useAuth();

  // Optimized fetch function with parallel API calls
  const fetchCautions = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setIsRefreshing(true);
    }
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
      if (showLoading) {
        setIsRefreshing(false);
      }
    }
  }, []);

  // Optimized initial data loading with parallel requests
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Make parallel API calls instead of sequential
        const promises = [
          api.get("/xcaution"),
          ...(xnum_0 ? [api.get(`/xcaution/${xnum_0}`)] : [])
        ];

        const results = await Promise.all(promises);
        
        // Set all cautions from first result
        setAllCautions(results[0].data);
        
        // Set selected caution if URL parameter exists
        if (xnum_0 && results.length > 1) {
          setSelectedCaution(results[1].data);
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
    // Use refresh loading instead of full loading
    fetchCautions(true);
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

  // Optimized delete with optimistic update
  const handleDeleteCaution = async (caution) => {
    if (!caution || !caution.xnum_0) return;
    if (
      !window.confirm(
        "Voulez-vous vraiment supprimer cette caution ? Cette action est irréversible."
      )
    )
      return;

    // Optimistic update - remove from UI immediately
    const originalCautions = [...allCautions];
    const updatedCautions = allCautions.filter(c => c.xnum_0 !== caution.xnum_0);
    setAllCautions(updatedCautions);
    
    if (selectedCaution?.xnum_0 === caution.xnum_0) {
      setSelectedCaution(null);
    }

    try {
      await api.delete(`/xcaution/${encodeURIComponent(caution.xnum_0)}`);
      alert("Caution supprimée avec succès.");
    } catch (e) {
      // Rollback on error
      setAllCautions(originalCautions);
      if (selectedCaution?.xnum_0 === caution.xnum_0) {
        setSelectedCaution(caution);
      }
      
      let msg = "Erreur lors de la suppression.";
      if (e.response?.data?.message) {
        msg += "\n" + e.response.data.message;
      } else if (e.response?.status === 404) {
        msg += "\nLa route ou la caution n'existe pas sur le serveur.";
      }
      alert(msg);
    }
  };

  // Optimized validation with optimistic update
  const handleValidateCaution = async (caution) => {
    if (!caution || !caution.xnum_0) {
      alert("Veuillez sélectionner une caution à valider.");
      return;
    }

    if (caution.xvalsta_0 === 2) {
      alert("Cette caution est déjà validée.");
      return;
    }

    // Optimistic update - update UI immediately
    const updatedCaution = { ...caution, xvalsta_0: 2 };
    setSelectedCaution(updatedCaution);
    
    const originalCautions = [...allCautions];
    const updatedCautions = allCautions.map(c => 
      c.xnum_0 === caution.xnum_0 ? updatedCaution : c
    );
    setAllCautions(updatedCautions);

    try {
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
    } catch (e) {
      // Rollback on error
      setSelectedCaution(caution);
      setAllCautions(originalCautions);
      
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
            {isRefreshing && !isLoading && (
              <p className="text-center mt-3" style={{ fontSize: "0.95rem", color: "#666" }}>
                Actualisation...
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
