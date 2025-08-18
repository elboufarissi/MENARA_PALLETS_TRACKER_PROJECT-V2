import React from "react";
import "./CautionTable.css";
import { FaFilter, FaRegCalendarAlt } from "react-icons/fa";

const CautionTable = ({
  cautions = [],
  onRowClick,
  onFilterIconClick,
  onDateFilterIconClick,
}) => {
  if (!cautions) {
    cautions = [];
  }

  const handleRowClick = (caution) => {
    if (onRowClick) {
      onRowClick(caution);
    }
  };

  const columns = [
    { key: "xnum_0", label: "Caution" },
    { key: "xsite_0", label: "Site" },
    { key: "customer", label: "Client" },
    { key: "xraison_0", label: "Raison" },
    { key: "xcin_0", label: "CIN" },
    { key: "xdate_0", label: "Date" },
    { key: "montant", label: "Montant" },
    { key: "xvalsta_0", label: "Validée" },
  ];
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
                      title={`Filtrer ${col.label}`}
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
                      title={`Filtrer ${col.label}`}
                    >
                      <FaFilter />
                    </button>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cautions.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  style={{ textAlign: "center" }}
                  className="py-3"
                >
                  Aucune donnée disponible.
                </td>
              </tr>
            ) : (
              cautions.map((caution) => (
                <tr
                  key={caution.xnum_0 || caution.id_placeholder || caution.id}
                  onClick={() => handleRowClick(caution)}
                >
                  <td>{caution.xnum_0}</td>
                  <td>
                    {caution.facility
                      ? caution.facility.fcynam_0
                      : caution.xsite_0 || "N/A"}
                  </td>
                  <td>
                    {caution.customer
                      ? `${caution.customer.BPCNUM_0}`
                      : caution.xclient_0 || "error"}
                  </td>
                  <td>{caution.xraison_0 || "N/A"}</td>
                  <td>{caution.xcin_0 || "N/A"}</td>
                  <td>
                    {caution.xdate_0
                      ? new Date(caution.xdate_0).toLocaleDateString("fr-FR")
                      : "N/A"}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    {caution.montant != null
                      ? parseFloat(caution.montant).toLocaleString("fr-FR", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })
                      : "N/A"}
                  </td>
                  <td>
                    {caution.xvalsta_0 === 2 || caution.xvalsta_0 === "2" ? (
                      <span className="badge bg-success">Oui</span>
                    ) : caution.xvalsta_0 === 1 || caution.xvalsta_0 === "1" ? (
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
    </div>
  );
};

export default CautionTable;
