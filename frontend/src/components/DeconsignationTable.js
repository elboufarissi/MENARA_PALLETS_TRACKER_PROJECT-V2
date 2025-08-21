import React from "react";
import "./CautionTable.css";
import { FaFilter, FaRegCalendarAlt } from "react-icons/fa";

const DeconsignationTable = ({
  deconsignations = [],
  onRowClick,
  onFilterIconClick,
  onDateFilterIconClick,
}) => {
  if (!deconsignations) {
    deconsignations = [];
  }

  const handleRowClick = (deconsignation) => {
    if (onRowClick) {
      onRowClick(deconsignation);
    }
  };

  const columns = [
    { key: "xnum_0", label: "Numéro" },
    { key: "xsite_0", label: "Site" },
    { key: "xclient_0", label: "Client" },
    { key: "xmatricule_0", label: "Matricule" },
    { key: "xdate_0", label: "Date" },
    { key: "palette_deconsigner", label: "Palettes à déconsigner" },
    { key: "xvalsta_0", label: "Validée" },
  ];
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
            {deconsignations.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="text-center text-muted">
                  Aucune déconsignation trouvée
                </td>
              </tr>
            )}{" "}
            {deconsignations.map((deconsignation, index) => (
              <tr
                key={deconsignation.xnum_0 || index}
                onClick={() => handleRowClick(deconsignation)}
                className="data-row clickable-row"
              >
                <td>{deconsignation.xnum_0}</td>
                <td>
                  {deconsignation.facility
                    ? deconsignation.facility.fcynam_0
                    : deconsignation.xsite_0 || "N/A"}
                </td>
                <td>
                  {deconsignation.customer
                    ? `${deconsignation.customer.bpcnum_0} (${deconsignation.customer.bpcnam_0})`
                    : deconsignation.xclient_0 || "N/A"}
                </td>
                <td>{deconsignation.xcamion_0 || "N/A"}</td>
                <td>
                  {deconsignation.xdate_0
                    ? new Date(deconsignation.xdate_0).toLocaleDateString(
                        "fr-FR"
                      )
                    : "N/A"}
                </td>
                <td style={{ textAlign: "right" }}>
                  {deconsignation.palette_a_deconsigner != null
                    ? deconsignation.palette_a_deconsigner
                    : "N/A"}
                </td>
                <td>
                  {deconsignation.xvalsta_0 === 2 ||
                  deconsignation.xvalsta_0 === "2" ? (
                    <span className="badge bg-success">Oui</span>
                  ) : deconsignation.xvalsta_0 === 1 ||
                    deconsignation.xvalsta_0 === "1" ? (
                    <span className="badge bg-warning">Non</span>
                  ) : (
                    <span className="badge bg-secondary">N/A</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DeconsignationTable;
