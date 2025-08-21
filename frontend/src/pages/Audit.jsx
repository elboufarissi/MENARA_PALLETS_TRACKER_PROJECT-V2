// src/pages/Audit.jsx
import React, { useEffect, useRef, useState } from 'react'
import axios from 'axios'
import {
  CCard, CCardHeader, CCardBody,
  CButton, CTable, CTableHead, CTableRow, CTableHeaderCell,
  CTableBody, CTableDataCell, CModal, CModalHeader, CModalTitle,
  CModalBody, CSpinner, CBadge
} from '@coreui/react'
import { FaFilter, FaCalendarAlt } from 'react-icons/fa'
import CautionHeader from '../components/CautionHeader'
import '../components/Audit.css'

// ---------------------- Axios (+ token) ----------------------
const api = axios.create({ baseURL: 'http://127.0.0.1:8000/api' })
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ---------------------- Helpers ----------------------
const lastToken = (s = '') => String(s).toLowerCase().split('_').pop()

const actionLabelFr = (desc = '') => {
  const a = lastToken(desc)
  const map = {
    created:     'Création',
    updated:     'Modification',
    deupdated:   'Modification annulée',
    deleted:     'Suppression',
    validated:   'Validation',
    devalidated: 'Dévalidation',
    restored:    'Restauration',
    printed:     'Impression',
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
  return 'secondary'
}

const renderModel = (log) =>
  log.subject_model || (log.subject_type ? log.subject_type.split('\\').pop() : '')

const showVal = (v) => {
  if (v === null || v === undefined || v === '') return '—'
  if (typeof v === 'object') {
    try { return JSON.stringify(v) } catch { return String(v) }
  }
  return String(v)
}

// ====================== Composant ======================
const Audit = () => {
  // Entête utilisateur
  const [user, setUser] = useState(null)
  const fetchUser = async () => {
    try {
      const { data } = await api.get('/auth/me')
      const u = data?.user ?? data
      setUser({
        FULL_NAME: u?.FULL_NAME ?? u?.name ?? null,
        ROLE: u?.ROLE ?? u?.role ?? null,
        USERNAME: u?.USERNAME ?? u?.username ?? null,
      })
    } catch {
      try {
        const { data } = await api.get('/auth/debug-token')
        setUser({
          FULL_NAME: data?.user_name ?? null,
          ROLE: data?.user_role ?? null,
          USERNAME: data?.user_username ?? null,
        })
      } catch {
        setUser(null)
      }
    }
  }

  // Tableau & filtres
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [perPage, setPerPage] = useState(25)
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1 })
  const [selectedLog, setSelectedLog] = useState(null)

  const [filters, setFilters] = useState({
    user: '', action: '', model: '', date: '', subject: '',
  })

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
    setLoading(true); setError(null)
    try {
      const params = {
        user:    filters.user || undefined,
        action:  filters.action || undefined,
        model:   filters.model || undefined,
        subject: filters.subject || undefined,
        date:    filters.date || undefined,
        page,
        per_page: perPage,
      }

      const { data } = await api.get('/logs', { params })
      setLogs(data.data || [])
      setPagination({
        current_page: data.current_page || 1,
        last_page: data.last_page || 1
      })
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Erreur lors du chargement des journaux')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchUser(); fetchLogs() }, []) // initial

  const renderUser = (log) =>
    log.user_full_name ||
    log.user_username ||
    log.causer?.FULL_NAME ||
    log.causer?.USERNAME ||
    'Système'

  return (
    <>
      <CautionHeader user={user} />

      <div className="form-wrapper">
        <div className="sage-form">
          <div className="sage-form-header">
            <div className="sage-form-header-left">
              <span className="sage-form-title">Journal d’audit</span>
            </div>
            <div className="d-flex align-items-center gap-2">
              <span className="me-2 small text-muted">Lignes&nbsp;:</span>
              <select
                className="form-select w-auto my-select"
                value={perPage}
                onChange={(e)=>{ setPerPage(Number(e.target.value)); fetchLogs(1) }}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          <div className="sage-section table-wrapper">
            <CCard className="card border-0 shadow-none bg-transparent m-0">
              <CCardHeader className="card-header d-none" />
              <CCardBody className="p-0">

                {error && <div className="alert alert-danger m-2">{error}</div>}

                {loading ? (
                  <div className="text-center p-4">
                    <CSpinner />
                  </div>
                ) : (
                  <div className="table-container">
                    <CTable
                      hover
                      responsive
                      className="table custom-table-style table-hover table-striped table-sm"
                    >
                      <CTableHead>
                        {/* En-têtes */}
                        <CTableRow className="main-header-row">
                          <CTableHeaderCell className="col-subject">Numéro</CTableHeaderCell>
                          <CTableHeaderCell className="col-user">Utilisateur</CTableHeaderCell>
                          <CTableHeaderCell className="col-action">Action</CTableHeaderCell>
                          <CTableHeaderCell className="col-model">Modèle</CTableHeaderCell>
                          <CTableHeaderCell className="col-date">Date</CTableHeaderCell>
                          <CTableHeaderCell className="col-details">Détails</CTableHeaderCell>
                        </CTableRow>

                        {/* Filtres */}
                        <CTableRow className="filter-icon-row">
                          <CTableHeaderCell className="filter-cell">
                            <div className="filter-cell">
                              <FaFilter className="filter-icon" />
                              <input
                                className="filter-input"
                                placeholder="Numéro"
                                value={filters.subject}
                                onChange={(e)=>handleHeaderFilter('subject', e.target.value)}
                              />
                            </div>
                          </CTableHeaderCell>

                          <CTableHeaderCell className="filter-cell">
                            <div className="filter-cell">
                              <FaFilter className="filter-icon" />
                              <input
                                className="filter-input"
                                placeholder="Utilisateur"
                                value={filters.user}
                                onChange={(e)=>handleHeaderFilter('user', e.target.value)}
                              />
                            </div>
                          </CTableHeaderCell>

                          <CTableHeaderCell className="filter-cell">
                            <div className="filter-cell">
                              <FaFilter className="filter-icon" />
                              <input
                                className="filter-input"
                                placeholder="Action"
                                value={filters.action}
                                onChange={(e)=>handleHeaderFilter('action', e.target.value)}
                              />
                            </div>
                          </CTableHeaderCell>

                          <CTableHeaderCell className="filter-cell">
                            <div className="filter-cell">
                              <FaFilter className="filter-icon" />
                              <input
                                className="filter-input"
                                placeholder="Modèle"
                                value={filters.model}
                                onChange={(e)=>handleHeaderFilter('model', e.target.value)}
                              />
                            </div>
                          </CTableHeaderCell>

                          <CTableHeaderCell className="filter-cell">
                            <div className="filter-cell">
                              <FaCalendarAlt className="filter-icon" />
                              <input
                                type="date"
                                className="filter-input"
                                value={filters.date}
                                onChange={(e)=>handleHeaderFilter('date', e.target.value)}
                              />
                            </div>
                          </CTableHeaderCell>

                          <CTableHeaderCell className="filter-cell">
                            <div className="filter-cell disabled">
                              <FaFilter className="filter-icon" />
                              <input className="filter-input" placeholder="—" disabled />
                            </div>
                          </CTableHeaderCell>
                        </CTableRow>
                      </CTableHead>

                      <CTableBody>
                        {logs.map((log) => (
                          <CTableRow key={log.id}>
                            <CTableDataCell className="text-truncate-1" title={log.subject_id}>
                              <strong>{log.subject_id}</strong>
                            </CTableDataCell>

                            <CTableDataCell className="text-truncate-1" title={renderUser(log)}>
                              {renderUser(log)}
                            </CTableDataCell>

                            <CTableDataCell>
                              <CBadge color={actionColor(log.description)} className="px-2 py-1">
                                {actionLabelFr(log.description)}
                              </CBadge>
                            </CTableDataCell>

                            <CTableDataCell>
                              <CBadge color="info" className="px-2 py-1">
                                {renderModel(log)}
                              </CBadge>
                            </CTableDataCell>

                            <CTableDataCell>
                              <small className="text-muted">
                                {new Date(log.created_at).toLocaleDateString('fr-FR')}
                              </small>
                            </CTableDataCell>

                            <CTableDataCell>
                              <CButton
                                size="sm"
                                variant="outline"
                                className="my-btn"
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

                <div className="d-flex justify-content-between align-items-center p-2">
                  <CButton
                    className="my-btn"
                    variant="outline"
                    disabled={pagination.current_page <= 1}
                    onClick={() => fetchLogs(pagination.current_page - 1)}
                  >
                    Précédent
                  </CButton>
                  <span className="small text-muted">
                    Page {pagination.current_page} sur {pagination.last_page}
                  </span>
                  <CButton
                    className="my-btn"
                    variant="outline"
                    disabled={pagination.current_page >= pagination.last_page}
                    onClick={() => fetchLogs(pagination.current_page + 1)}
                  >
                    Suivant
                  </CButton>
                </div>
              </CCardBody>
            </CCard>
          </div>
        </div>
      </div>

      <CModal visible={!!selectedLog} onClose={() => setSelectedLog(null)} size="lg">
        <CModalHeader><CModalTitle>Détails du journal</CModalTitle></CModalHeader>
        <CModalBody>
          {selectedLog && (() => {
            const oldVals = selectedLog.properties?.old ?? {}
            const newVals = selectedLog.properties?.attributes ?? selectedLog.properties?.new ?? {}
            const allKeys = Array.from(new Set([...Object.keys(oldVals), ...Object.keys(newVals)])).sort()

            return (
              <>
                <p className="mb-1"><strong>Date :</strong> {new Date(selectedLog.created_at).toLocaleString('fr-FR')}</p>
                <p className="mb-1"><strong>Utilisateur :</strong> {renderUser(selectedLog)}</p>
                <p className="mb-1"><strong>Action :</strong> {actionLabelFr(selectedLog.description)}</p>
                <p className="mb-1"><strong>Événement :</strong> {selectedLog.event || '—'}</p>
                <p className="mb-3">
                  <strong>Modèle :</strong> {renderModel(selectedLog)} &nbsp; | &nbsp;
                  <strong>Numéro :</strong> {selectedLog.subject_id}
                </p>

                <h6 className="mb-2">Modifications</h6>
                <CTable small responsive className="table custom-table-style table-sm">
                  <CTableHead>
                    <CTableRow className="main-header-row">
                      <CTableHeaderCell style={{width:'30%'}}>Champ</CTableHeaderCell>
                      <CTableHeaderCell style={{width:'35%'}}>Ancien</CTableHeaderCell>
                      <CTableHeaderCell style={{width:'35%'}}>Nouveau</CTableHeaderCell>
                    </CTableRow>
                  </CTableHead>
                  <CTableBody>
                    {allKeys.length === 0 && (
                      <CTableRow>
                        <CTableDataCell colSpan={3} className="text-center text-muted">Aucune différence.</CTableDataCell>
                      </CTableRow>
                    )}
                    {allKeys.map((k) => (
                      <CTableRow key={k}>
                        <CTableDataCell><code>{k}</code></CTableDataCell>
                        <CTableDataCell>{showVal(oldVals[k])}</CTableDataCell>
                        <CTableDataCell>{showVal(newVals[k])}</CTableDataCell>
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
