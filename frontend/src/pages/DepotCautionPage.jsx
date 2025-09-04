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
  const [cautionsLoaded, setCautionsLoaded] = useState(false);
  const [sitesAndClientsLoaded, setSitesAndClientsLoaded] = useState(false);
  const [notificationsLoaded, setNotificationsLoaded] = useState(false);
  const formRef = useRef();
  const { xnum_0 } = useParams();
  const { user } = useAuth();

  // Cache for sites and clients data (5 minutes)
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  const getCachedData = useCallback(
    (key) => {
      const cached = localStorage.getItem(key);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_DURATION) {
          return data;
        }
        localStorage.removeItem(key);
      }
      return null;
    },
    [CACHE_DURATION]
  );

  const setCachedData = useCallback((key, data) => {
    localStorage.setItem(
      key,
      JSON.stringify({
        data,
        timestamp: Date.now(),
      })
    );
  }, []);

  // Optimized fetch function with retry logic
  const fetchWithRetry = useCallback(async (url, maxRetries = 2) => {
    for (let i = 0; i <= maxRetries; i++) {
      try {
        return await api.get(url);
      } catch (error) {
        if (i === maxRetries) throw error;
        console.warn(`Retry ${i + 1}/${maxRetries} for ${url}:`, error.message);
        await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1))); // Progressive delay
      }
    }
  }, []);

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
      setCautionsLoaded(true);
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

  // Sequential data loading: xcaution → sites → clients → notifications
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Step 1: Load xcaution data first
        const cautionPromises = [
          api.get("/xcaution"),
          ...(xnum_0 ? [api.get(`/xcaution/${xnum_0}`)] : []),
        ];

        const cautionResults = await Promise.all(cautionPromises);

        // Set all cautions from first result
        setAllCautions(cautionResults[0].data);
        setCautionsLoaded(true);

        // Set selected caution if URL parameter exists
        if (xnum_0 && cautionResults.length > 1) {
          setSelectedCaution(cautionResults[1].data);
          setIsEditMode(false);
        }

        // Step 2: Load sites data
        const cachedSites = getCachedData("sites_cache");
        const sitesResponse = cachedSites
          ? { data: cachedSites }
          : await fetchWithRetry("/sites");

        if (!cachedSites) setCachedData("sites_cache", sitesResponse.data);

        // Step 3: Load clients data
        const cachedClients = getCachedData("clients_cache");
        const clientsResponse = cachedClients
          ? { data: cachedClients }
          : await fetchWithRetry("/clients");

        if (!cachedClients)
          setCachedData("clients_cache", clientsResponse.data);

        setSitesAndClientsLoaded(true);

        // Step 4: Load notifications last
        await api.get("/notifications");

        setNotificationsLoaded(true);
      } catch (e) {
        console.error("Erreur lors du chargement :", e);
        setError("Erreur lors du chargement des données.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [xnum_0, getCachedData, setCachedData, fetchWithRetry]);

  // Prefetch data during idle time for better UX (sites and clients only)
  useEffect(() => {
    const prefetchData = () => {
      // Prefetch sites and clients if not in cache
      if (!getCachedData("sites_cache") || !getCachedData("clients_cache")) {
        console.log("Prefetching sites and clients data during idle time...");

        // Prefetch sites first, then clients
        const prefetchSequential = async () => {
          try {
            if (!getCachedData("sites_cache")) {
              const sitesResponse = await fetchWithRetry("/sites");
              setCachedData("sites_cache", sitesResponse.data);
            }
            if (!getCachedData("clients_cache")) {
              const clientsResponse = await fetchWithRetry("/clients");
              setCachedData("clients_cache", clientsResponse.data);
            }
          } catch (e) {
            console.warn("Prefetch failed:", e);
          }
        };

        prefetchSequential();
      }
    };

    // Use requestIdleCallback if available, otherwise setTimeout
    if (window.requestIdleCallback) {
      const idleCallbackId = window.requestIdleCallback(prefetchData, {
        timeout: 2000,
      });
      return () => window.cancelIdleCallback(idleCallbackId);
    } else {
      const timeoutId = setTimeout(prefetchData, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [getCachedData, setCachedData, fetchWithRetry]);

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
    const updatedCautions = allCautions.filter(
      (c) => c.xnum_0 !== caution.xnum_0
    );
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
    const updatedCautions = allCautions.map((c) =>
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
              height: "100%",
              boxSizing: "border-box",
            }}
          >
            {isLoading && (
              <div className="text-center mt-3" style={{ fontSize: "0.95rem" }}>
                <p>Chargement des données...</p>
                {cautionsLoaded}
                {sitesAndClientsLoaded}
                {notificationsLoaded}
              </div>
            )}
            {isRefreshing && !isLoading && (
              <p
                className="text-center mt-3"
                style={{ fontSize: "0.95rem", color: "#666" }}
              >
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
              boxSizing: "border-box",
            }}
          >
            <div style={{ flex: 1, padding: 0, margin: 0 }}>
              <NavigationMenu />
              <DepotCautionForm
                ref={formRef}
                onSuccess={handleFormSuccess}
                initialData={selectedCaution}
                isEditMode={isEditMode}
                shouldLoadDropdowns={cautionsLoaded}
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
