import React, { useState, useRef, useEffect } from "react";
import {
  FaPlus,
  FaSave,
  FaCheck,
  FaTrash,
  FaTimes,
  FaRedo,
  FaPrint,
  FaPen,
  FaCommentDots,
  FaShareSquare,
  FaBan,
} from "react-icons/fa";
import "./SidebarBootstrap.css";

const SidebarBootstrap = ({
  selectedCaution,
  onEditCaution,
  onDeleteCaution,
  onValidate,
  onSave,
  onClearForm,
  apiType = "xcaution", // Default to xcaution for backward compatibility
  userRole, // Add userRole prop
}) => {
  const [showPrintDropdown, setShowPrintDropdown] = useState(false);
  const printDropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        printDropdownRef.current &&
        !printDropdownRef.current.contains(event.target)
      ) {
        setShowPrintDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handlePrintClick = async () => {
    if (!selectedCaution) {
      alert("Aucun élément sélectionné pour l'impression.");
      return;
    }

    let endpoint;

    // Special handling for deconsignations based on user role
    if (apiType === "deconsignations") {
      // For AGENT_ORDONNANCEMENT: only "demande" PDF for non-validated deconsignations
      if (userRole === "AGENT_ORDONNANCEMENT") {
        if (
          selectedCaution.xvalsta_0 === "1" ||
          selectedCaution.xvalsta_0 === 1
        ) {
          endpoint = `/deconsignation/demande/pdf/${selectedCaution.xnum_0}`;
        } else {
          alert(
            "Impression disponible uniquement pour les déconsignations non validées."
          );
          return;
        }
      }
      // For ADMIN: use "demande" PDF for non-validated, "bon" PDF for validated
      else if (userRole === "ADMIN") {
        if (
          selectedCaution.xvalsta_0 === "2" ||
          selectedCaution.xvalsta_0 === 2
        ) {
          // Validated: use "bon" PDF (like CAISSIER/CAISSIERE)
          endpoint = `/deconsignation/pdf/${selectedCaution.xnum_0}`;
        } else {
          // Non-validated: use "demande" PDF (like AGENT_ORDONNANCEMENT)
          endpoint = `/deconsignation/demande/pdf/${selectedCaution.xnum_0}`;
        }
      }
      // For CAISSIERE and CAISSIER: use "bon" PDF only if validated (Bon de déconsignation palettes)
      else if (userRole === "CAISSIERE" || userRole === "CAISSIER") {
        if (
          selectedCaution.xvalsta_0 === "2" ||
          selectedCaution.xvalsta_0 === 2
        ) {
          endpoint = `/deconsignation/pdf/${selectedCaution.xnum_0}`;
        } else {
          alert(
            "Impression disponible uniquement pour les déconsignations validées."
          );
          return;
        }
      }
      // For other roles: use the default logic based on validation status
      else {
        if (
          selectedCaution.xvalsta_0 === "2" ||
          selectedCaution.xvalsta_0 === 2
        ) {
          endpoint = `/deconsignation/pdf/${selectedCaution.xnum_0}`;
        } else {
          endpoint = `/deconsignation/demande/pdf/${selectedCaution.xnum_0}`;
        }
      }
    }
    // For other document types (non-deconsignations)
    else {
      // Si la déconsignation est validée
      if (
        selectedCaution.xvalsta_0 === "2" ||
        selectedCaution.xvalsta_0 === 2
      ) {
        if (apiType === "restitutions") {
          endpoint = `/restitutions/${selectedCaution.xnum_0}/preview-pdf`;
        } else if (apiType === "consignations") {
          endpoint = `/consignations/${selectedCaution.xnum_0}/preview-pdf`;
        } else {
          endpoint = `/xcaution/${selectedCaution.xnum_0}/preview-pdf`;
        }
      } else {
        alert("Impression pour ce type de document non validé non disponible.");
        return;
      }
    }

    try {
      // Get the token from localStorage
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Vous devez être connecté pour imprimer.");
        return;
      }

      // Make API request with authentication headers
      const response = await fetch(`http://localhost:8000/api${endpoint}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/pdf",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Create blob from response
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      // Open PDF in new window
      window.open(url, "_blank");

      // Clean up
      setTimeout(() => window.URL.revokeObjectURL(url), 1000);
    } catch (error) {
      console.error("Error generating PDF:", error);

      // More detailed error message
      let errorMessage = "Erreur lors de la génération du PDF.";
      if (error.message.includes("401")) {
        errorMessage = "Erreur d'authentification. Veuillez vous reconnecter.";
      } else if (error.message.includes("404")) {
        errorMessage = "PDF non trouvé. Vérifiez que l'élément existe.";
      } else if (error.message.includes("500")) {
        errorMessage = "Erreur serveur lors de la génération du PDF.";
      } else if (error.message.includes("Failed to fetch")) {
        errorMessage = "Erreur de connexion au serveur.";
      } else {
        errorMessage += ` Détails: ${error.message}`;
      }

      alert(errorMessage);
    }

    setShowPrintDropdown(false); // Fermer le menu déroulant après impression
  };

  const handleEtatCautionClick = () => {
    // Determine document type based on apiType
    let docType = "caution"; // default
    if (apiType === "consignations") docType = "consignation";
    else if (apiType === "deconsignations") docType = "deconsignation";
    else if (apiType === "restitutions") docType = "restitution";

    // Navigate to État interface with document type
    window.open(`http://localhost:3000/etat/${docType}`, "_blank");
    setShowPrintDropdown(false); // Close dropdown after action
  };

  const togglePrintDropdown = () => {
    setShowPrintDropdown(!showPrintDropdown);
  };

  // Only allow edit/delete if Validée == "Non" (xvalsta_0 === "1" or 1)
  const canEditOrDelete =
    selectedCaution &&
    (selectedCaution.xvalsta_0 === "1" || selectedCaution.xvalsta_0 === 1);

  // Only allow print if Validée == "Oui" (xvalsta_0 === "2" or 2)
  // EXCEPT for deconsignations with AGENT_ORDONNANCEMENT (can print "Demande" for non-validated only)
  let canPrint;
  if (apiType === "deconsignations" && userRole === "AGENT_ORDONNANCEMENT") {
    // AGENT_ORDONNANCEMENT can only print non-validated deconsignations (Demande de déconsignation)
    canPrint =
      selectedCaution &&
      (selectedCaution.xvalsta_0 === "1" || selectedCaution.xvalsta_0 === 1);
  } else if (apiType === "deconsignations" && userRole === "ADMIN") {
    // ADMIN can print both validated and non-validated deconsignations (different PDFs based on status)
    canPrint = selectedCaution ? true : false;
  } else {
    // Default logic: only validated documents can be printed
    canPrint =
      selectedCaution &&
      (selectedCaution.xvalsta_0 === "2" || selectedCaution.xvalsta_0 === 2);
  }

  // Role-based permissions - different for each interface type
  let canUserSave, canUserValidate, canUserEdit, canUserAdd;

  if (apiType === "consignations") {
    // For consignation interface: AGENT_ORDONNANCEMENT has full access
    canUserSave = userRole === "AGENT_ORDONNANCEMENT" || userRole === "ADMIN";
    canUserValidate =
      userRole === "AGENT_ORDONNANCEMENT" || userRole === "ADMIN";
    canUserEdit = userRole === "AGENT_ORDONNANCEMENT" || userRole === "ADMIN";
    canUserAdd = userRole === "AGENT_ORDONNANCEMENT" || userRole === "ADMIN";
  } else if (apiType === "xcaution" || apiType === "restitutions") {
    // For caution/depot-de-caution and restitution interfaces: CAISSIER/CAISSIERE have full access
    canUserSave =
      userRole === "CAISSIER" ||
      userRole === "CAISSIERE" ||
      userRole === "ADMIN";
    canUserValidate =
      userRole === "CAISSIER" ||
      userRole === "CAISSIERE" ||
      userRole === "ADMIN";
    canUserEdit =
      userRole === "CAISSIER" ||
      userRole === "CAISSIERE" ||
      userRole === "ADMIN";
    canUserAdd =
      userRole === "CAISSIER" ||
      userRole === "CAISSIERE" ||
      userRole === "ADMIN";
  } else {
    // For déconsignation interface: role-specific permissions
    // CHEF_PARC: only save and edit permissions, all others disabled
    canUserSave =
      userRole === "AGENT_ORDONNANCEMENT" ||
      userRole === "CHEF_PARC" ||
      userRole === "ADMIN";
    canUserValidate =
      userRole === "CAISSIER" ||
      userRole === "CAISSIERE" ||
      userRole === "ADMIN";
    canUserEdit =
      userRole === "AGENT_ORDONNANCEMENT" ||
      userRole === "CHEF_PARC" ||
      userRole === "ADMIN";
    canUserAdd = userRole === "AGENT_ORDONNANCEMENT" || userRole === "ADMIN";
  }

  // Additional permissions for CHEF_PARC - only save and edit allowed
  // For caution/restitution interfaces: CAISSIER/CAISSIERE can delete unvalidated documents
  let canUserDelete;
  if (apiType === "xcaution" || apiType === "restitutions") {
    // For caution/depot-de-caution and restitution interfaces: CAISSIER/CAISSIERE can delete
    canUserDelete =
      userRole === "CAISSIER" ||
      userRole === "CAISSIERE" ||
      userRole === "ADMIN";
  } else {
    // For other interfaces: existing logic (exclude CHEF_PARC)
    canUserDelete =
      userRole !== "CHEF_PARC" &&
      (userRole === "AGENT_ORDONNANCEMENT" || userRole === "ADMIN");
  }
  const canUserPrint = userRole !== "CHEF_PARC" && canPrint;
  const canUserCancel = userRole !== "CHEF_PARC";
  const canUserComment = userRole !== "CHEF_PARC";
  const canUserShare = userRole !== "CHEF_PARC";
  const canUserRefuse = userRole !== "CHEF_PARC";

  const handleEdit = () => {
    // Role-based edit permission check
    if (!canUserEdit) {
      alert("Vous n'avez pas la permission de modifier.");
      return;
    }

    if (selectedCaution && canEditOrDelete) {
      if (onEditCaution) {
        onEditCaution(selectedCaution); // This sets the form in edit mode
      }
    } else if (!selectedCaution) {
      alert("Veuillez sélectionner une caution à modifier.");
    } else {
      alert(
        "Vous ne pouvez pas modifier cette caution. Seules les cautions non validées peuvent être modifiées."
      );
    }
  };

  const handleAdd = () => {
    // Role-based add permission check
    if (!canUserAdd) {
      alert("Vous n'avez pas la permission d'ajouter.");
      return;
    }

    if (onClearForm) {
      onClearForm(); // Clear the form to add new data
    }
  };

  const handleSave = () => {
    // Role-based save permission check
    if (!canUserSave) {
      alert("Vous n'avez pas la permission de sauvegarder.");
      return;
    }

    // Save button triggers form submission (create new or edit existing)
    if (onSave) {
      onSave(); // This triggers the form submission
    }
  };

  const handleValidate = () => {
    // Role-based validation permission check
    if (!canUserValidate) {
      alert("Vous n'avez pas la permission de valider.");
      return;
    }

    // Validate button sets XVALSTA=2 to show "Validée: Oui"
    if (selectedCaution && onValidate) {
      onValidate(); // Call the validation handler with selected caution
    } else if (!selectedCaution) {
      alert("Veuillez sélectionner une caution à valider.");
    }
  };

  const handleDelete = () => {
    // Role-based delete permission check
    if (!canUserDelete) {
      alert("Vous n'avez pas la permission de supprimer.");
      return;
    }

    if (canEditOrDelete && onDeleteCaution) {
      onDeleteCaution(selectedCaution);
    } else {
      alert("Vous ne pouvez pas supprimer.");
    }
  };

  const handleRefresh = () => {
    // Refresh the page
    window.location.reload();
  };

  const handleCancel = () => {
    if (!canUserCancel) {
      alert("Vous n'avez pas la permission d'annuler.");
      return;
    }
    // Add cancel logic here if needed
  };

  const handleComment = () => {
    if (!canUserComment) {
      alert("Vous n'avez pas la permission de commenter.");
      return;
    }
    // Add comment logic here if needed
  };

  const handleShare = () => {
    if (!canUserShare) {
      alert("Vous n'avez pas la permission de partager.");
      return;
    }
    // Add share logic here if needed
  };

  const handleRefuse = () => {
    if (!canUserRefuse) {
      alert("Vous n'avez pas la permission de refuser.");
      return;
    }
    // Add refuse logic here if needed
  };

  return (
    <div className="sidebar-bootstrap sidebar-floating">
      <FaPlus
        className="sidebar-icon"
        title={canUserAdd ? "Ajouter" : "Ajouter (non autorisé)"}
        onClick={handleAdd}
        style={{
          cursor: canUserAdd ? "pointer" : "not-allowed",
          opacity: canUserAdd ? 1 : 0.5,
        }}
      />
      <FaSave
        className="sidebar-icon"
        title={canUserSave ? "Sauvegarder" : "Sauvegarder (non autorisé)"}
        onClick={handleSave}
        style={{
          cursor: canUserSave ? "pointer" : "not-allowed",
          opacity: canUserSave ? 1 : 0.5,
        }}
      />
      <FaCheck
        className="sidebar-icon"
        title={canUserValidate ? "Valider" : "Valider (non autorisé)"}
        onClick={handleValidate}
        style={{
          cursor: canUserValidate ? "pointer" : "not-allowed",
          opacity: canUserValidate ? 1 : 0.5,
        }}
      />
      <FaPen
        className="sidebar-icon"
        title={canUserEdit ? "Modifier" : "Modifier (non autorisé)"}
        onClick={handleEdit}
        style={{
          cursor: canUserEdit ? "pointer" : "not-allowed",
          opacity: canUserEdit ? 1 : 0.5,
        }}
      />
      <FaTrash
        className="sidebar-icon"
        title={canUserDelete ? "Supprimer" : "Supprimer (non autorisé)"}
        onClick={handleDelete}
        style={{
          cursor: canUserDelete ? "pointer" : "not-allowed",
          opacity: canUserDelete ? 1 : 0.5,
        }}
      />
      <div
        className="sidebar-print-dropdown"
        ref={printDropdownRef}
        style={{ position: "relative" }}
      >
        <div
          className="sidebar-icon"
          title={canUserPrint ? "Imprimer" : "Impression (non autorisé)"}
          onClick={
            canUserPrint
              ? togglePrintDropdown
              : () => alert("Vous n'avez pas la permission d'imprimer.")
          }
          style={{
            cursor: canUserPrint ? "pointer" : "not-allowed",
            opacity: canUserPrint ? 1 : 0.5,
          }}
        >
          <FaPrint />
        </div>
        {showPrintDropdown &&
          canUserPrint &&
          (canPrint || apiType === "deconsignations") && (
            <div
              className="print-dropdown-menu"
              style={{
                position: "absolute",
                top: "100%",
                right: "0",
                backgroundColor: "white",
                border: "1px solid #ccc",
                borderRadius: "4px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                zIndex: 1000,
                minWidth: "120px",
                padding: "4px 0",
              }}
            >
              <div
                onClick={handlePrintClick}
                style={{
                  padding: "8px 12px",
                  cursor: "pointer",
                  fontSize: "12px",
                  borderBottom: canPrint ? "1px solid #eee" : "none",
                }}
                onMouseEnter={(e) =>
                  (e.target.style.backgroundColor = "#f5f5f5")
                }
                onMouseLeave={(e) => (e.target.style.backgroundColor = "white")}
              >
                {canPrint ? "Imprimer" : "Demande de déconsignation"}
              </div>

              {canPrint && (
                <div
                  onClick={handleEtatCautionClick}
                  style={{
                    padding: "8px 12px",
                    cursor: "pointer",
                    fontSize: "12px",
                  }}
                  onMouseEnter={(e) =>
                    (e.target.style.backgroundColor = "#f5f5f5")
                  }
                  onMouseLeave={(e) =>
                    (e.target.style.backgroundColor = "white")
                  }
                >
                  État
                </div>
              )}
            </div>
          )}
      </div>
      <FaTimes
        className="sidebar-icon"
        title={canUserCancel ? "Annuler" : "Annuler (non autorisé)"}
        onClick={handleCancel}
        style={{
          cursor: canUserCancel ? "pointer" : "not-allowed",
          opacity: canUserCancel ? 1 : 0.5,
        }}
      />
      <FaRedo
        className="sidebar-icon"
        title="Rafraîchir"
        onClick={handleRefresh}
        style={{ cursor: "pointer" }}
      />
      <FaCommentDots
        className="sidebar-icon"
        title={canUserComment ? "Commentaire" : "Commentaire (non autorisé)"}
        onClick={handleComment}
        style={{
          cursor: canUserComment ? "pointer" : "not-allowed",
          opacity: canUserComment ? 1 : 0.5,
        }}
      />
      <FaShareSquare
        className="sidebar-icon"
        title={canUserShare ? "Partager" : "Partager (non autorisé)"}
        onClick={handleShare}
        style={{
          cursor: canUserShare ? "pointer" : "not-allowed",
          opacity: canUserShare ? 1 : 0.5,
        }}
      />
      <FaBan
        className="sidebar-icon"
        title={canUserRefuse ? "Refuser" : "Refuser (non autorisé)"}
        onClick={handleRefuse}
        style={{
          cursor: canUserRefuse ? "pointer" : "not-allowed",
          opacity: canUserRefuse ? 1 : 0.5,
        }}
      />
    </div>
  );
};

export default SidebarBootstrap;
