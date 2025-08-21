import React from "react";
import "./CautionTable.css";
import { FaFilter, FaRegCalendarAlt } from "react-icons/fa";

const ConsignationTable = ({
  consignations = [],
  onRowClick,
  onFilterIconClick,
  onDateFilterIconClick,
}) => {
  if (!consignations) {
    consignations = [];
  }

  const handleRowClick = (consignation) => {
    if (onRowClick) {
      onRowClick(consignation);
    }
  };

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
  return (
    <div style={{ padding: 0, margin: 0 }}>
      <h4>Dernières consignations</h4>
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
            {consignations.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="text-center text-muted">
                  Aucune consignation trouvée
                </td>
              </tr>
            )}{" "}
            {consignations.map((consignation, index) => (
              <tr
                key={consignation.xnum_0 || index}
                onClick={() => handleRowClick(consignation)}
                className="data-row clickable-row"
              >
                <td>{consignation.xnum_0}</td>
                <td>
                  {consignation.facility
                    ? consignation.facility.fcynam_0
                    : consignation.xsite_0 || "N/A"}
                </td>
                <td>
                  {consignation.customer
                    ? `${consignation.customer.BPCNUM_0} `
                    : consignation.xclient_0 || "N/A"}
                </td>
                <td>{consignation.xbp_0 || "N/A"}</td>
                <td>{consignation.xcamion_0 || "N/A"}</td>
                <td>
                  {consignation.xdate_0
                    ? new Date(consignation.xdate_0).toLocaleDateString("fr-CA")
                    : "N/A"}
                </td>
                <td style={{ textAlign: "right" }}>
                  {consignation.palette_a_consigner != null
                    ? consignation.palette_a_consigner
                    : "N/A"}
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
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ConsignationTable;
