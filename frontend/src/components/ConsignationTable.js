import React, { useState, useEffect } from "react";
import "./CautionTable.css";
import { FaFilter, FaRegCalendarAlt } from "react-icons/fa";

const ConsignationTable = ({
  onRowClick,
  onFilterIconClick,
  onDateFilterIconClick,
}) => {
  const [consignations, setConsignations] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const columns = [
    { key: "xnum_0", label: "Numéro" },
    { key: "xsite_0", label: "Site" },
    { key: "xclient_0", label: "Client" },
    { key: "xbp_0", label: "Bon de prélèvement" },
    { key: "xcamion_0", label: "Matricule camion" },
    { key: "xdate_0", label: "Date" },
    { key: "palette_a_consigner", label: "Palettes à consigner" },
    { key: "xvalsta_0", label: "Validée" },
  ];

  // 🔹 Charger les consignations depuis Laravel avec pagination
  useEffect(() => {
    fetch(`http://127.0.0.1:8000/api/consignations?page=${currentPage}`)
      .then((res) => res.json())
      .then((data) => {
        setConsignations(data.data || []);   // Laravel renvoie "data"
        setTotalPages(data.last_page || 1);  // Nombre de pages
      })
      .catch((err) => console.error("Erreur API:", err));
  }, [currentPage]);

  const handleRowClick = (consignation) => {
    if (onRowClick) onRowClick(consignation);
  };

  return (
    <div style={{ padding: 0, margin: 0, width: "100%" }}>
      <h4>Dernières consignations</h4>
      <div
        className="table-responsive"
        style={{
          width: "100%",
          overflowX: "auto",
          overflowY: "hidden",
          maxWidth: "100vw",
          boxSizing: "border-box",
        }}
      >
        <table
          className="table table-striped table-hover table-sm table-bordered custom-table-style"
          style={{ minWidth: 700, width: "100%", tableLayout: "auto" }}
        >
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
                      <FaRegCalendarAlt className="calendar-icon" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="filter-icon-button"
                      onClick={() =>
                        onFilterIconClick && onFilterIconClick(col.key)
                      }
                    >
                      <FaFilter className="filter-icon" />
                    </button>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {consignations.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="text-center text-muted">
                  Aucune consignation trouvée
                </td>
              </tr>
            ) : (
              consignations.map((consignation, index) => (
                <tr
                  key={consignation.xnum_0 || index}
                  onClick={() => handleRowClick(consignation)}
                  className="data-row clickable-row"
                >
                  <td>{consignation.xnum_0}</td>
                  <td>
                    {consignation.facility && consignation.facility.fcynam_0
                      ? `${consignation.facility.fcynam_0}${
                          consignation.xsite_0
                            ? " (" + consignation.xsite_0 + ")"
                            : ""
                        }`
                      : consignation.xsite_0 || "N/A"}
                  </td>
                  <td>
                    {consignation.customer
                      ? `${consignation.customer.BPCNUM_0}`
                      : consignation.xclient_0 || "N/A"}
                  </td>
                  <td>{consignation.xbp_0 || "N/A"}</td>
                  <td>{consignation.xcamion_0 || "N/A"}</td>
                  <td>
                    {consignation.xdate_0
                      ? new Date(consignation.xdate_0).toLocaleDateString(
                          "fr-CA"
                        )
                      : "N/A"}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    {consignation.palette_a_consigner ?? "N/A"}
                  </td>
                  <td>
                    {consignation.xvalsta_0 === 2 ||
                    consignation.xvalsta_0 === "2" ? (
                      <span className="badge bg-success">Oui</span>
                    ) : consignation.xvalsta_0 === 1 ||
                      consignation.xvalsta_0 === "1" ? (
                      <span className="badge bg-warning">Non</span>
                    ) : (
                      <span className="badge bg-secondary">N/A</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 🔹 Pagination controls (backend) */}
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

export default ConsignationTable;
