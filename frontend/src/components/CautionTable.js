import React, { useState, useEffect } from "react"
import "./CautionTable.css"
import { FaFilter, FaRegCalendarAlt } from "react-icons/fa"

const CautionTable = ({ onRowClick, onFilterIconClick, onDateFilterIconClick }) => {
  const [cautions, setCautions] = useState({
    data: [],
    current_page: 1,
    last_page: 1,
  })
  const [currentPage, setCurrentPage] = useState(1)

  const columns = [
    { key: "xnum_0", label: "Caution" },
    { key: "xsite_0", label: "Site" },
    { key: "customer", label: "Client" },
    { key: "xraison_0", label: "Raison" },
    { key: "xcin_0", label: "CIN" },
    { key: "xdate_0", label: "Date" },
    { key: "montant", label: "Montant" },
    { key: "xvalsta_0", label: "Validée" },
  ]

  useEffect(() => {
    const token = localStorage.getItem("token")

    if (!token) {
      console.error("⚠ Aucun token trouvé, impossible d’appeler l’API.")
      return
    }

    fetch(`http://127.0.0.1:8000/api/xcaution?page=${currentPage}`, {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`, // 🔑 toujours avec "Bearer"
      },
    })
      .then(async (res) => {
        if (!res.ok) {
          const errorText = await res.text()
          throw new Error(`Erreur API: ${res.status} - ${errorText}`)
        }
        return res.json()
      })
      .then((data) => {
        console.log("✅ API Response:", data) // 👉 vérifie la structure ici
        setCautions(data)
      })
      .catch((err) => console.error("Erreur API cautions:", err))
  }, [currentPage])

  const handleRowClick = (caution) => {
    if (onRowClick) onRowClick(caution)
  }

  return (
    <div style={{ padding: 0, margin: 0 }}>
      <h4>Dernières cautions</h4>
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
            {!cautions.data || cautions.data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="text-center">
                  Aucune caution trouvée
                </td>
              </tr>
            ) : (
              cautions.data.map((caution, idx) => (
                <tr
                  key={caution.xnum_0 || idx}
                  onClick={() => handleRowClick(caution)}
                  style={{ cursor: "pointer" }}
                >
                  <td>{caution.xnum_0}</td>
                  <td>{caution.facility ? caution.facility.fcynam_0 : caution.xsite_0 || "N/A"}</td>
                  <td>{caution.customer ? caution.customer.BPCNUM_0 : caution.xclient_0 || "N/A"}</td>
                  <td>{caution.xraison_0 || "N/A"}</td>
                  <td>{caution.xcin_0 || "N/A"}</td>
                  <td>{caution.xdate_0 ? new Date(caution.xdate_0).toLocaleDateString("fr-FR") : "N/A"}</td>
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

      {cautions.last_page > 1 && (
        <div className="pagination-controls mt-3 d-flex justify-content-center align-items-center gap-3">
          <button
            className="btn btn-sm btn-outline-primary px-3 py-1 rounded-pill shadow-sm"
            disabled={cautions.current_page === 1}
            onClick={() => setCurrentPage(cautions.current_page - 1)}
          >
            ◀ Précédent
          </button>

          <span className="fw-bold text-primary">
            Page <span className="text-dark">{cautions.current_page}</span> / {cautions.last_page}
          </span>

          <button
            className="btn btn-sm btn-outline-primary px-3 py-1 rounded-pill shadow-sm"
            disabled={cautions.current_page === cautions.last_page}
            onClick={() => setCurrentPage(cautions.current_page + 1)}
          >
            Suivant ▶
          </button>
        </div>
      )}
    </div>
  )
}

export default CautionTable
