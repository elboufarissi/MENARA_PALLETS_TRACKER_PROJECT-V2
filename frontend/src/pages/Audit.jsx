// src/pages/Audit.jsx
import React, { useEffect, useRef, useState } from 'react'
import axios from 'axios'
import {
  CCard, CCardBody, CCardHeader,
  CButton, CTable, CTableHead, CTableRow, CTableHeaderCell,
  CTableBody, CTableDataCell, CModal, CModalHeader, CModalTitle,
  CModalBody, CSpinner, CBadge
} from '@coreui/react'
import { FaFilter, FaCalendarAlt, FaSearch } from 'react-icons/fa'
import CautionHeader from '../components/CautionHeader'

// ==================== Axios ====================
const api = axios.create({ baseURL: 'http://127.0.0.1:8000/api' })
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ==================== Helpers ====================
const lastToken = (s = '') => String(s).toLowerCase().split('_').pop()
const actionLabelFr = (desc = '') => {
  const a = lastToken(desc)
  const map = {
    created: 'Création',
    updated: 'Modification',
    deupdated: 'Annulation modif',
    deleted: 'Suppression',
    validated: 'Validation',
    devalidated: 'Dévalidation',
    restored: 'Restauration',
    printed: 'Impression',
  }
  return map[a] || (desc || '—')
}
const actionColor = (desc = '') => {
  const a = lastToken(desc)
  if (a === 'deleted') return 'danger'
  if (a === 'created') return 'success'
  if (a === 'updated' || a === 'deupdated') return 'warning'
  if (a === 'validated') return 'primary'
  if (a === 'devalidated') return 'secondary'
  return 'dark'
}
const renderModel = (log) =>
  log.subject_model || (log.subject_type ? log.subject_type.split('\\').pop() : '')
const showVal = (v) =>
  v === null || v === undefined || v === ''
    ? '—'
    : typeof v === 'object'
    ? JSON.stringify(v, null, 2)
    : String(v)

// ==================== Composant ====================
const Audit = () => {
  const [user, setUser] = useState(null)
  const fetchUser = async () => {
    try {
      const { data } = await api.get('/auth/me')
      const u = data?.user ?? data
      setUser({
        FULL_NAME: u?.FULL_NAME ?? u?.name,
        ROLE: u?.ROLE ?? u?.role,
        USERNAME: u?.USERNAME ?? u?.username,
      })
    } catch {
      setUser(null)
    }
  }

  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [perPage, setPerPage] = useState(25)
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1 })
  const [selectedLog, setSelectedLog] = useState(null)

  const [filters, setFilters] = useState({ user: '', action: '', model: '', date: '', subject: '' })
  const debRef = useRef(null)
  const triggerFetch = (page = 1) => {
    if (debRef.current) clearTimeout(debRef.current)
    debRef.current = setTimeout(() => fetchLogs(page), 400)
  }
  const handleHeaderFilter = (field, value) => {
    setFilters((f) => ({ ...f, [field]: value }))
    triggerFetch(1)
  }

  const fetchLogs = async (page = 1) => {
    setLoading(true)
    setError(null)
    try {
      const params = { ...filters, page, per_page: perPage }
      const { data } = await api.get('/logs', { params })
      setLogs(data.data || [])
      setPagination({ current_page: data.current_page || 1, last_page: data.last_page || 1 })
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUser()
    fetchLogs()
  }, [])

  const renderUser = (log) =>
    log.user_full_name || log.user_username || log.causer?.FULL_NAME || log.causer?.USERNAME || 'Système'

  return (
    <>
      {/* ✅ Styles améliorés */}
      <style>{`
        .audit-card { border-radius: 14px; box-shadow: 0 6px 16px rgba(0,0,0,0.08); margin-top: 20px; }
        .audit-table thead tr:first-child { position: sticky; top: 0; background: #f0f2f5; z-index: 5; }
        .audit-table thead th { font-weight: 600; color: #2c3e50; font-size: 0.92rem; white-space: nowrap; }
        .audit-table tbody tr:nth-child(even) { background: #fafafa; }
        .audit-table tbody tr:hover { background: #eaf3ff; transition: 0.2s; }
        .filters-row input {
          width: 85%; padding: 5px 6px; font-size: 0.82rem;
          border: 1px solid #ccc; border-radius: 6px; margin-left: 4px;
        }
        .btn-view { border-radius: 18px !important; font-size: 0.76rem; padding: 3px 12px; }
        .pagination-bar { display: flex; justify-content: center; align-items: center; gap: 15px; padding: 16px 0; font-size: 0.9rem; }
        .btn-nav { border-radius: 20px !important; padding: 6px 16px; font-size: 0.85rem; font-weight: 500; }
        .audit-badge { padding: 4px 10px; font-size: 0.8rem; border-radius: 8px; }
        .break-cell { white-space: normal; word-wrap: break-word; max-width: 250px; }
      `}</style>

      <CautionHeader user={user} />

      <CCard className="audit-card">
        {/* 🔹 Header de la carte avec select intégré */}
        <CCardHeader className="d-flex flex-wrap justify-content-between align-items-center gap-3">
          <h5 className="mb-0">📜 Journal d’audit</h5>
          <div>
            <label className="me-2 fw-bold">Lignes :</label>
            <select
              value={perPage}
              onChange={(e) => {
                setPerPage(Number(e.target.value))
                fetchLogs(1)
              }}
              style={{
                padding: '6px 10px',
                borderRadius: '8px',
                border: '1px solid #bbb',
                background: '#fff',
              }}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </CCardHeader>

        <CCardBody>
          {error && <div className="alert alert-danger">{error}</div>}
          {loading ? (
            <div className="text-center p-4">
              <CSpinner color="primary" />
            </div>
          ) : (
            <div style={{ maxHeight: 500, overflowY: 'auto' }}>
              <CTable hover responsive className="audit-table">
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell>Numéro</CTableHeaderCell>
                    <CTableHeaderCell>Utilisateur</CTableHeaderCell>
                    <CTableHeaderCell>Action</CTableHeaderCell>
                    <CTableHeaderCell>Modèle</CTableHeaderCell>
                    <CTableHeaderCell>Date</CTableHeaderCell>
                    <CTableHeaderCell>Détails</CTableHeaderCell>
                  </CTableRow>
                  <CTableRow className="filters-row">
                    <CTableHeaderCell>
                      <FaFilter />
                      <input
                        value={filters.subject}
                        onChange={(e) => handleHeaderFilter('subject', e.target.value)}
                        placeholder="Numéro"
                      />
                    </CTableHeaderCell>
                    <CTableHeaderCell>
                      <FaSearch />
                      <input
                        value={filters.user}
                        onChange={(e) => handleHeaderFilter('user', e.target.value)}
                        placeholder="Utilisateur"
                      />
                    </CTableHeaderCell>
                    <CTableHeaderCell>
                      <FaFilter />
                      <input
                        value={filters.action}
                        onChange={(e) => handleHeaderFilter('action', e.target.value)}
                        placeholder="Action"
                      />
                    </CTableHeaderCell>
                    <CTableHeaderCell>
                      <FaFilter />
                      <input
                        value={filters.model}
                        onChange={(e) => handleHeaderFilter('model', e.target.value)}
                        placeholder="Modèle"
                      />
                    </CTableHeaderCell>
                    <CTableHeaderCell>
                      <FaCalendarAlt />
                      <input
                        type="date"
                        value={filters.date}
                        onChange={(e) => handleHeaderFilter('date', e.target.value)}
                      />
                    </CTableHeaderCell>
                    <CTableHeaderCell />
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {logs.map((log) => (
                    <CTableRow key={log.id}>
                      <CTableDataCell className="break-cell">
                        <strong>{log.subject_id}</strong>
                      </CTableDataCell>
                      <CTableDataCell className="break-cell">{renderUser(log)}</CTableDataCell>
                      <CTableDataCell>
                        <CBadge className="audit-badge" color={actionColor(log.description)}>
                          {actionLabelFr(log.description)}
                        </CBadge>
                      </CTableDataCell>
                      <CTableDataCell>
                        <CBadge color="info" className="audit-badge">
                          {renderModel(log)}
                        </CBadge>
                      </CTableDataCell>
                      <CTableDataCell>
                        <small>{new Date(log.created_at).toLocaleDateString('fr-FR')}</small>
                      </CTableDataCell>
                      <CTableDataCell>
                        <CButton
                          size="sm"
                          variant="outline"
                          className="btn-view"
                          onClick={() => setSelectedLog(log)}
                        >
                          Voir
                        </CButton>
                      </CTableDataCell>
                    </CTableRow>
                  ))}
                  {logs.length === 0 && (
                    <CTableRow>
                      <CTableDataCell colSpan="6" className="text-center text-muted py-4">
                        Aucun journal trouvé.
                      </CTableDataCell>
                    </CTableRow>
                  )}
                </CTableBody>
              </CTable>
            </div>
          )}

          {/* 🔹 Pagination */}
          <div className="pagination-bar">
            <CButton
              className="btn-nav"
              variant="outline"
              disabled={pagination.current_page <= 1}
              onClick={() => fetchLogs(pagination.current_page - 1)}
            >
              ◀ Précédent
            </CButton>
            <span>
              Page {pagination.current_page} / {pagination.last_page}
            </span>
            <CButton
              className="btn-nav"
              variant="outline"
              disabled={pagination.current_page >= pagination.last_page}
              onClick={() => fetchLogs(pagination.current_page + 1)}
            >
              Suivant ▶
            </CButton>
          </div>
        </CCardBody>
      </CCard>

      {/* 🔹 Modal détails */}
      <CModal visible={!!selectedLog} onClose={() => setSelectedLog(null)} size="lg">
        <CModalHeader>
          <CModalTitle>Détails du journal</CModalTitle>
        </CModalHeader>
        <CModalBody>
          {selectedLog &&
            (() => {
              const oldVals = selectedLog.properties?.old ?? {}
              const newVals =
                selectedLog.properties?.attributes ?? selectedLog.properties?.new ?? {}
              const allKeys = Array.from(
                new Set([...Object.keys(oldVals), ...Object.keys(newVals)]),
              ).sort()
              return (
                <>
                  <p>
                    <strong>Date :</strong>{' '}
                    {new Date(selectedLog.created_at).toLocaleString('fr-FR')}
                  </p>
                  <p>
                    <strong>Utilisateur :</strong> {renderUser(selectedLog)}
                  </p>
                  <p>
                    <strong>Action :</strong> {actionLabelFr(selectedLog.description)}
                  </p>
                  <p>
                    <strong>Modèle :</strong> {renderModel(selectedLog)} |{' '}
                    <strong>Numéro :</strong> {selectedLog.subject_id}
                  </p>
                  <h6 className="mt-3">Modifications</h6>
                  <CTable small responsive>
                    <CTableHead>
                      <CTableRow>
                        <CTableHeaderCell>Champ</CTableHeaderCell>
                        <CTableHeaderCell>Ancien</CTableHeaderCell>
                        <CTableHeaderCell>Nouveau</CTableHeaderCell>
                      </CTableRow>
                    </CTableHead>
                    <CTableBody>
                      {allKeys.length === 0 && (
                        <CTableRow>
                          <CTableDataCell colSpan={3} className="text-center">
                            Aucune différence
                          </CTableDataCell>
                        </CTableRow>
                      )}
                      {allKeys.map((k) => (
                        <CTableRow key={k}>
                          <CTableDataCell>
                            <code>{k}</code>
                          </CTableDataCell>
                          <CTableDataCell className="break-cell">
                            {showVal(oldVals[k])}
                          </CTableDataCell>
                          <CTableDataCell className="break-cell">
                            {showVal(newVals[k])}
                          </CTableDataCell>
                        </CTableRow>
                      ))}
                    </CTableBody>
                  </CTable>
                </>
              )
            })()}
        </CModalBody>
      </CModal>
    </>
  )
}
export default Audit
