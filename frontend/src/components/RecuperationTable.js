import React, { useState, useEffect } from "react";
import "./CautionTable.css";
import { FaFilter, FaRegCalendarAlt } from "react-icons/fa";

const RecuperationTable = ({
  onRowClick,
  onFilterIconClick,
  onDateFilterIconClick,
}) => {
  const [recuperations, setRecuperations] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const columns = [
    { key: "xnum_0", label: "Récupération" },
    { key: "xsite_0", label: "Site" },
    { key: "xclient_0", label: "Client" },
    { key: "xraison_0", label: "Raison" },
    { key: "xcin_0", label: "CIN" },
    { key: "xdate_0", label: "Date" },
    { key: "montant", label: "Montant" },
    { key: "xvalsta_0", label: "Validée" },
  ];

  // 🔹 Charger les données depuis Laravel avec pagination
  useEffect(() => {
    fetch(`http://127.0.0.1:8000/api/restitutions?page=${currentPage}`)
      .then((res) => res.json())
      .then((data) => {
        setRecuperations(data.data);   // Laravel renvoie les enregistrements dans "data"
        setTotalPages(data.last_page); // Laravel renvoie le nombre de pages
      })
      .catch((err) => console.error("Erreur API:", err));
  }, [currentPage]);

  const handleRowClick = (recuperation) => {
    if (onRowClick) onRowClick(recuperation);
  };

  return (
    <div style={{ padding: 0, margin: 0 }}>
      <h4>Derniers lus</h4>
      <div className="table-responsive">
        <table className="table table-striped table-hover table-sm table-bordered custom-table-style">
          <thead>
            <tr className="main-header-row">
              {columns.map((col) => (
                <th key={col.key}>{col.label}</th>
              ))}
            </tr>
            <tr className="filter-icon-row">
              {columns.map((col) => (
                <th key={`${col.key}-filter-icon`} className="filter-cell">
                  {col.key === "xdate_0" ? (
                    <button
                      type="button"
                      className="calendar-icon-button"
                      onClick={() =>
                        onDateFilterIconClick && onDateFilterIconClick(col.key)
                      }
                    >
                      <FaRegCalendarAlt />
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="filter-icon-button"
                      onClick={() =>
                        onFilterIconClick && onFilterIconClick(col.key)
                      }
                    >
                      <FaFilter />
                    </button>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {recuperations.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="text-center">
                  Aucune récupération trouvée
                </td>
              </tr>
            ) : (
              recuperations.map((recuperation) => (
                <tr
                  key={recuperation.xnum_0}
                  onClick={() => handleRowClick(recuperation)}
                  style={{ cursor: "pointer" }}
                >
                  <td>{recuperation.xnum_0}</td>
                  <td>{recuperation.xsite_0}</td>
                  <td>{recuperation.xclient_0}</td>
                  <td>{recuperation.xraison_0}</td>
                  <td>{recuperation.xcin_0}</td>
                  <td>
                    {recuperation.xdate_0
                      ? new Date(recuperation.xdate_0).toLocaleDateString("fr-FR")
                      : ""}
                  </td>
                  <td>
                    {recuperation.montant
                      ? parseFloat(recuperation.montant).toLocaleString("fr-FR", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })
                      : "0,00"}
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        recuperation.xvalsta_0 === "2" ||
                        recuperation.xvalsta_0 === 2
                          ? "bg-success"
                          : "bg-warning"
                      }`}
                    >
                      {recuperation.xvalsta_0 === "2" ||
                      recuperation.xvalsta_0 === 2
                        ? "Oui"
                        : "Non"}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 🔹 Pagination controls */}
      {totalPages > 1 && (
        <div className="pagination-controls mt-3 d-flex justify-content-center align-items-center gap-3">
          <button
            className="btn btn-sm btn-outline-primary px-3 py-1 rounded-pill shadow-sm"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
          >
            ◀ Précédent
          </button>

          <span className="fw-bold text-primary">
            Page <span className="text-dark">{currentPage}</span> / {totalPages}
          </span>

          <button
            className="btn btn-sm btn-outline-primary px-3 py-1 rounded-pill shadow-sm"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(currentPage + 1)}
          >
            Suivant ▶
          </button>
        </div>
      )}
    </div>
  );
};

export default RecuperationTable;
