import React, { useState, useEffect } from "react";
import "./CautionTable.css";
import { FaFilter, FaRegCalendarAlt } from "react-icons/fa";

const DeconsignationTable = ({
  onRowClick,
  onFilterIconClick,
  onDateFilterIconClick,
}) => {
  const [deconsignations, setDeconsignations] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const columns = [
    { key: "xnum_0", label: "Numéro" },
    { key: "xsite_0", label: "Site" },
    { key: "xclient_0", label: "Client" },
    { key: "xmatricule_0", label: "Matricule" },
    { key: "xdate_0", label: "Date" },
    { key: "palette_a_deconsigner", label: "Palettes à déconsigner" },
    { key: "xvalsta_0", label: "Validée" },
  ];

  // 🔹 Charger les données depuis Laravel avec pagination et token
  useEffect(() => {
    const token = localStorage.getItem("token"); // ton token stocké au login

    fetch(`http://127.0.0.1:8000/api/deconsignations?page=${currentPage}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    })
      .then((res) => res.json())
      .then((data) => {
        setDeconsignations(data.data || []);
        setTotalPages(data.last_page || 1);
      })
      .catch((err) => console.error("Erreur API:", err));
  }, [currentPage]);

  const handleRowClick = (deconsignation) => {
    if (onRowClick) onRowClick(deconsignation);
  };

  return (
    <div style={{ padding: 0, margin: 0 }}>
      <h4>Dernières déconsignations</h4>
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
            {deconsignations.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="text-center">
                  Aucune déconsignation trouvée
                </td>
              </tr>
            ) : (
              deconsignations.map((deconsignation) => (
                <tr
                  key={deconsignation.xnum_0}
                  onClick={() => handleRowClick(deconsignation)}
                  style={{ cursor: "pointer" }}
                >
                  <td>{deconsignation.xnum_0}</td>
                  <td>{deconsignation.xsite_0 || "N/A"}</td>
                  <td>{deconsignation.xclient_0 || "N/A"}</td>
                  <td>{deconsignation.xmatricule_0 || "N/A"}</td>
                  <td>
                    {deconsignation.xdate_0
                      ? new Date(deconsignation.xdate_0).toLocaleDateString("fr-FR")
                      : ""}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    {deconsignation.palette_a_deconsigner ?? "N/A"}
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        deconsignation.xvalsta_0 === "2" ||
                        deconsignation.xvalsta_0 === 2
                          ? "bg-success"
                          : "bg-warning"
                      }`}
                    >
                      {deconsignation.xvalsta_0 === "2" ||
                      deconsignation.xvalsta_0 === 2
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

export default DeconsignationTable;
