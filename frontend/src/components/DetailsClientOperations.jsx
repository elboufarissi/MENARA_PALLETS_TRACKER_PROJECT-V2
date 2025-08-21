import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; // <-- import
import "./CautionTable.css";

export default function DetailsClientOperations({ operations }) {
  const [filterDate, setFilterDate] = useState("");
  const navigate = useNavigate(); // <-- initialisation
  const [printMenuIndex, setPrintMenuIndex] = useState(null);


  if (!operations || operations.length === 0) {
    console.log("Aucune opération à afficher.");
    return null;
  }

  // Utiliser created_at pour afficher date + heure
  const formatDateTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return (
      date.toLocaleDateString() +
      " " +
      date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  };

  // Fonction pour naviguer vers la page détail
 const handleConsult = (op) => {
  if (!op || !op.code || !op.type) return;

  const code = op.code;
  const type = op.type.toLowerCase();

  if (type === "déconsignation") {
    navigate(`/flux-interne/deconsignation/${code}`);
  } else if (type === "consignation") {
    navigate(`/flux-interne/consignation/${code}`);
  } else if (type === "caution") {
    navigate(`/depot-de-caution/${code}`);
  } else if (type === "restitution") {
  navigate(`/recuperation/${code}`); 
  }else {
    console.warn("Type d'opération non reconnu :", type);
  }
};
const handleEtatClick = (op) => {
  if (!op || !op.code || !op.type || op.statut !== 2) {
    alert("Impossible d'ouvrir l'état. Vérifie que l'opération est validée.");
    return;
  }

 
  const type = op.type.toLowerCase();

  if (type === "caution" || type === "restitution") {
    window.open(`http://localhost:3000/etat/${type}`, "_blank");
    setPrintMenuIndex(null); // si tu utilises un dropdown
  } else {
    alert("Type d'opération non pris en charge pour l'état.");
  }
};



  const renderCell = (header, op, index) => {
    switch (header) {
      case "Type":
  if (op.type === "Restitution") return "Récupération";
  return op.type || "";

      case "Code":
        return op.code || "";
      case "Date":
        return formatDateTime(op.created_at);
      case "Client":
        return op.client || "";
      case "Site":
        return op.site || "";
      case "Montant":
        if (op.type === "Consignation" && op.palette_a_consigner != null) {
          return (op.palette_a_consigner * 100).toFixed(2);
        }
        if (op.type === "Déconsignation" && op.palette_deconsignees != null) {
          return (op.palette_deconsignees * 100).toFixed(2);
        }
        return typeof op.montant === "number"
          ? op.montant.toFixed(2)
          : !isNaN(Number(op.montant))
          ? Number(op.montant).toFixed(2)
          : "";
      case "Quantité":
        if (op.type === "Consignation") {
          return op.palette_a_consigner ?? "";
        }
        if (op.type === "Déconsignation") {
          return op.palette_deconsignees ?? "";
        }
        if (op.type === "Caution" || op.type === "Restitution") {
  return op.montant !== undefined && !isNaN(op.montant)
    ? Math.floor(Number(op.montant) / 100)
    : "";
}

        return "";
      case "Solde":
        return op.solde !== undefined ? op.solde.toFixed(2) : "";
      case "Consulter":
        return (
          <button
            className="btn-consulter"
            onClick={() => handleConsult(op)} 
          >
            Consulter
          </button>
        );
      case "Imprimer":
  if (op.type === "Caution" || op.type === "Restitution") {
    return (
      <div style={{ position: "relative", display: "inline-block" }}>
        <button
          className="btn-imprimer"
          onClick={() =>
            setPrintMenuIndex(printMenuIndex === index ? null : index)
          }
        >
          Imprimer
        </button>

        {printMenuIndex === index && (
          <div
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              backgroundColor: "#fff",
              border: "1px solid #ccc",
              boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
              zIndex: 10,
            }}
          >
            <div
              onClick={() => {
                handlePrintClick(op);
                setPrintMenuIndex(null);
              }}
              style={{
                padding: "8px 12px",
                cursor: "pointer",
                fontSize: "12px",
                borderBottom: "1px solid #eee",
              }}
              onMouseEnter={(e) =>
                (e.target.style.backgroundColor = "#f5f5f5")
              }
              onMouseLeave={(e) => (e.target.style.backgroundColor = "white")}
            >
              Bon
            </div>
            <div
              onClick={() => {
                handleEtatClick(op);
                setPrintMenuIndex(null);
              }}
              style={{
                padding: "8px 12px",
                cursor: "pointer",
                fontSize: "12px",
              }}
              onMouseEnter={(e) =>
                (e.target.style.backgroundColor = "#f5f5f5")
              }
              onMouseLeave={(e) => (e.target.style.backgroundColor = "white")}
            >
              État
            </div>
          </div>
        )}
      </div>
    );
  } else {
    return (
      <button className="btn-imprimer" onClick={() => handlePrintClick(op)}>
        Imprimer
      </button>
    );
  }


      default:
        return "";
    }
  };

  const headers = [
    "Type",
    "Code",
    "Date",
    "Client",
    "Site",
    "Montant",
    "Quantité",
    "Solde",
    "Consulter",
    "Imprimer",
  ];

  console.log("Opérations initiales reçues:", operations.length);

  // Filtrer uniquement les opérations validées
  const validatedOperations = operations.filter((op) => op.statut === 2);
  console.log("Opérations validées (statut=2):", validatedOperations.length);

  // Filtrer par date si défini (en utilisant created_at)
  const filterTimestamp = filterDate ? new Date(filterDate).getTime() : null;
  const filteredOperations = filterTimestamp
    ? validatedOperations.filter((op) => {
        const createdDate = new Date(op.created_at);
        return createdDate.getTime() <= filterTimestamp;
      })
    : validatedOperations;
  console.log(
    filterTimestamp
      ? `Opérations filtrées jusqu'à ${filterDate} : ${filteredOperations.length}`
      : "Pas de filtre date appliqué"
  );

  // Trier par created_at croissante (du plus ancien au plus récent)
  const sortedAscOperations = [...filteredOperations].sort(
    (a, b) => new Date(a.created_at) - new Date(b.created_at)
  );
  console.log("Opérations triées par date croissante.");

  // Calcul solde cumulé en DH
  let cumulCaution = 0;
  let cumulConsignees = 0;
  let cumulDeconsignees = 0;
  let cumulRestitution = 0;

  sortedAscOperations.forEach((op, index) => {
    console.log(`--- Opération #${index + 1} ---`);
    console.log("Avant calcul solde :", {
      type: op.type,
      montant: op.montant,
      palette_a_consigner: op.palette_a_consigner,
      palette_deconsignees: op.palette_deconsignees,
      cumulCaution,
      cumulConsignees,
      cumulDeconsignees,
    });

    if (op.type === "Caution") {
      const montantValue = op.montant ? Number(op.montant) : 0;
      cumulCaution += montantValue;
      console.log(`Ajout Caution: +${montantValue} DH`);
    } else if (op.type === "Consignation") {
      const palettes = Number(op.palette_a_consigner) || 0;
      cumulConsignees += palettes * 100;
      console.log(`Ajout Consignation: +${palettes} palettes -> +${palettes * 100} DH`);
    } else if (op.type === "Déconsignation") {
      const palettes = Number(op.palette_deconsignees) || 0;
      cumulDeconsignees += palettes * 100;
      console.log(`Ajout Déconsignation: +${palettes} palettes -> +${palettes * 100} DH`);
    } else if (op.type === "Restitution") {
    const montantValue = op.montant ? Number(op.montant) : 0;
    cumulRestitution += montantValue; 
  }

    op.solde = cumulCaution - cumulConsignees + cumulDeconsignees- cumulRestitution;

    console.log("Après calcul solde:", op.solde);
    console.log("--------------------------");
  });

  // Trier en ordre décroissant pour affichage
  const sortedOperations = [...sortedAscOperations].sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  );
  console.log("Opérations triées pour affichage (date décroissante).");
  console.log("Nombre d'opérations affichées :", sortedOperations.length);

  const handlePrintClick = (op) => {
  if (!op || !op.code || !op.type || op.statut !== 2) {
    alert("Impossible d'imprimer. Vérifie que l'opération est validée.");
    return;
  }

  const code = op.code;
  const type = op.type.toLowerCase();
  let endpoint = "";

  if (type === "déconsignation") {
    endpoint = `http://localhost:8000/api/deconsignation/pdf/${code}`;
  } else if (type === "consignation") {
    endpoint = `http://localhost:8000/api/consignations/${code}/preview-pdf`;
  } else if (type === "caution") {
    endpoint = `http://localhost:8000/api/xcaution/${code}/preview-pdf`;
  } else if (type === "restitution") {
    endpoint = `http://localhost:8000/api/restitutions/${code}/preview-pdf`;
  } else {
    alert("Type d'opération non pris en charge pour l'impression.");
    return;
  }

  window.open(endpoint, "_blank");
};

  return (
    <div className="card">
      <h3>Plus de Détails des Opérations</h3>

      {/* Filtre date */}
      <div style={{ marginBottom: "1rem" }}>
        <label>
          Filtrer jusqu'à la date :{" "}
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          />
        </label>
      </div>

      {/* Tableau */}
      <div className="table-responsive">
        <table className="table table-striped table-hover table-sm table-bordered custom-table-style">
          <thead>
            <tr className="main-header-row">
              {headers.map((header, idx) => (
                <th key={idx}>{header}</th>
              ))}
            </tr>
          </thead>
         <tbody>
  {sortedOperations.map((op, index) => (
    <tr key={index}>
      {headers.map((header, colIndex) => (
        <td
          key={colIndex}
          style={{
            textAlign:
              header.includes("Quantité") ||
              header === "Montant" ||
              header === "Solde"
                ? "right"
                : "center",
          }}
        >
          {renderCell(header, op, index)} {/* 👈 ajoute `index` ici */}
        </td>
      ))}
    </tr>
  ))}
</tbody>

        </table>
      </div>
    </div>
  );
}
