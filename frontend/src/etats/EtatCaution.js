import React, { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import { Button, Form, Table, Card } from "react-bootstrap";
import api from "../utils/api";
import "./EtatCaution.css";

export default function EtatCaution() {
  const { documentType } = useParams();
  const currentDocType = documentType || "caution"; // fallback to caution
  const [codeEtat, setCodeEtat] = useState("");
  const [description, setDescription] = useState("");
  const [valeurDebut, setValeurDebut] = useState("");
  const [valeurFin, setValeurFin] = useState("");
  const [destination, setDestination] = useState("ACROBAT PDF");
  const [parameterTitle, setParameterTitle] = useState("");

  // New filtering states
  const [client, setClient] = useState("");
  const [site, setSite] = useState("");
  const [clientOptions, setClientOptions] = useState([]);
  const [siteOptions, setSiteOptions] = useState([]);

  // Configuration for different document types
  const getDocumentConfig = (type) => {
    const configs = {
      caution: {
        code: "PLTCAUTION",
        description: "Bon de caution",
        parameter: "Borne de caution",
        apiEndpoint: "xcaution",
      },
      consignation: {
        code: "PLTCONSIGN",
        description: "Bon de consignation",
        parameter: "Borne de consignation",
        apiEndpoint: "consignations",
      },
      deconsignation: {
        code: "PLTDECONS",
        description: "Bon de déconsignation",
        parameter: "Borne de déconsignation",
        apiEndpoint: "deconsignations",
      },
      restitution: {
        code: "PLTRCAUTION",
        description: "Bon de récupération caution",
        parameter: "Borne de récupération caution",
        apiEndpoint: "restitutions",
      },
    };
    return configs[type] || configs.caution;
  };

  // Fetch XNUM_0 range for all validated records
  const fetchAllValidatedRange = async (apiEndpoint) => {
    try {
      const response = await api.get(`/${apiEndpoint}`);
      const data = response.data;

      if (data && data.length > 0) {
        // Filter only validated records (xvalsta_0 = 2)
        let filtered = data.filter((item) => item.xvalsta_0 === 2);

        if (filtered.length > 0) {
          // Sort by xnum_0 chronologically (extract date from caution number)
          const sorted = filtered.sort((a, b) => {
            // Extract date part from caution number (e.g., CT20220729-0006 -> 20220729)
            const getDateFromCaution = (cautionNum) => {
              const match = cautionNum.match(/CT(\d{8})-/);
              return match ? match[1] : cautionNum;
            };

            const dateA = getDateFromCaution(a.xnum_0);
            const dateB = getDateFromCaution(b.xnum_0);

            // If dates are the same, compare the sequence number
            if (dateA === dateB) {
              return a.xnum_0.localeCompare(b.xnum_0);
            }

            // Otherwise compare dates chronologically
            return dateA.localeCompare(dateB);
          });
          setValeurDebut(sorted[0].xnum_0);
          setValeurFin(sorted[sorted.length - 1].xnum_0);
        } else {
          setValeurDebut("");
          setValeurFin("");
        }
      }
    } catch (error) {
      console.error(`Error fetching ${apiEndpoint} data:`, error);
      setValeurDebut("");
      setValeurFin("");
    }
  };

  useEffect(() => {
    const config = getDocumentConfig(currentDocType);
    setCodeEtat(config.code);
    setDescription(config.description);
    setParameterTitle(config.parameter);

    // Load all validated records by default
    fetchAllValidatedRange(config.apiEndpoint);

    // Load client and site options
    loadClientOptions();
    loadSiteOptions();
  }, [currentDocType]);

  // Load client options
  const loadClientOptions = async () => {
    try {
      const response = await api.get("/clients");
      if (response.data.success) {
        setClientOptions(response.data.data);
      }
    } catch (error) {
      console.error("Error loading clients:", error);
    }
  };

  // Load site options
  const loadSiteOptions = async () => {
    try {
      const response = await api.get("/sites");
      if (response.data.success) {
        setSiteOptions(response.data.data);
      }
    } catch (error) {
      console.error("Error loading sites:", error);
    }
  };

  // Fetch XNUM_0 range for specific client and site
  const fetchClientSiteRange = async (clientCode, siteCode, apiEndpoint) => {
    try {
      const response = await api.get(`/${apiEndpoint}`);
      const data = response.data;
      console.log("All data received:", data);

      if (data && data.length > 0) {
        // Filter by client and site, and only validated records (xvalsta_0 = 2)
        let filtered = data.filter((item) => {
          const validationMatch = item.xvalsta_0 === 2;
          const clientMatch = String(item.xclient_0) === String(clientCode);
          const siteMatch = String(item.xsite_0) === String(siteCode);

          console.log("Checking item:", {
            xnum_0: item.xnum_0,
            xclient_0: item.xclient_0,
            xsite_0: item.xsite_0,
            xvalsta_0: item.xvalsta_0,
            validationMatch,
            clientMatch,
            siteMatch,
            targetClient: clientCode,
            targetSite: siteCode,
          });

          return validationMatch && clientMatch && siteMatch;
        });

        console.log(
          "Filtered results for client",
          clientCode,
          "and site",
          siteCode,
          ":",
          filtered
        );

        if (filtered.length > 0) {
          // Sort by xnum_0 chronologically (extract date from caution number)
          const sorted = filtered.sort((a, b) => {
            // Extract date part from caution number (e.g., CT20220729-0006 -> 20220729)
            const getDateFromCaution = (cautionNum) => {
              const match = cautionNum.match(/CT(\d{8})-/);
              return match ? match[1] : cautionNum;
            };

            const dateA = getDateFromCaution(a.xnum_0);
            const dateB = getDateFromCaution(b.xnum_0);

            console.log(
              "Comparing:",
              a.xnum_0,
              "vs",
              b.xnum_0,
              "dates:",
              dateA,
              "vs",
              dateB
            );

            // If dates are the same, compare the sequence number
            if (dateA === dateB) {
              return a.xnum_0.localeCompare(b.xnum_0);
            }

            // Otherwise compare dates chronologically
            return dateA.localeCompare(dateB);
          });

          console.log(
            "Sorted results:",
            sorted.map((item) => item.xnum_0)
          );
          console.log(
            "Setting range from",
            sorted[0].xnum_0,
            "to",
            sorted[sorted.length - 1].xnum_0
          );

          setValeurDebut(sorted[0].xnum_0);
          setValeurFin(sorted[sorted.length - 1].xnum_0);
        } else {
          // No records found for this client/site
          setValeurDebut("");
          setValeurFin("");
        }
      }
    } catch (error) {
      console.error(
        `Error fetching ${apiEndpoint} data for client/site:`,
        error
      );
      setValeurDebut("");
      setValeurFin("");
    }
  };

  // Effect to update range based on filter selection
  useEffect(() => {
    const config = getDocumentConfig(currentDocType);

    if (site && client) {
      // Both site and client selected: show filtered data
      fetchClientSiteRange(client, site, config.apiEndpoint);
    } else if (!site && !client) {
      // Neither selected: show all validated records
      fetchAllValidatedRange(config.apiEndpoint);
    } else {
      // Only one selected: clear the range (no data)
      setValeurDebut("");
      setValeurFin("");
    }
  }, [site, client, currentDocType]);

  // Clear filters and reset to full range
  const handleClearFilters = () => {
    setSite("");
    setClient("");
    // Range will be updated by useEffect when site/client become empty
  };

  const handlePrint = async (e) => {
    e.preventDefault();

    // Validate range fields (always required)
    if (!valeurDebut || !valeurFin) {
      alert("Veuillez remplir les valeurs de début et de fin.");
      return;
    }

    // Check if only one filter is selected (not allowed)
    if ((site && !client) || (!site && client)) {
      alert(
        "Veuillez sélectionner les deux filtres (site et client) ou aucun des deux."
      );
      return;
    }

    try {
      const config = getDocumentConfig(currentDocType);
      const apiEndpoint = config.apiEndpoint;

      // Build URL parameters
      const params = new URLSearchParams({
        valeur_debut: valeurDebut,
        valeur_fin: valeurFin,
        code_etat: codeEtat,
        description: description,
      });

      // Add filters only if both are selected
      if (site && client) {
        params.append("filter_client_exact", client);
        params.append("filter_site_exact", site);
        params.append("filter_mode", "specific");
      }

      // Construct the direct PDF URL
      const pdfUrl = `http://localhost:8000/api/${apiEndpoint}/generate-range-pdf?${params.toString()}`;

      console.log("PDF URL:", pdfUrl);

      // Open PDF directly in new tab - much faster!
      window.open(pdfUrl, "_blank");
    } catch (error) {
      console.error("Error generating PDF URL:", error);
      alert("Erreur lors de la génération du PDF.");
    }
  };
  return (
    <div className="page-container">
      <div className="etat-form-wrapper">
        <Card className="etat-caution-card">
          <Card.Header>
            <div className="d-flex justify-content-between align-items-center">
              <h4>Saisie paramètres états</h4>
              <Button type="button" className="my-custom" onClick={handlePrint}>
                Imprimer
              </Button>
            </div>
          </Card.Header>
          <Card.Body>
            <Form>
              <div className="etat-form-grid">
                <div className="etat-form-row">
                  <Form.Label>Code état</Form.Label>
                  <Form.Control
                    type="text"
                    value={codeEtat}
                    onChange={(e) => setCodeEtat(e.target.value)}
                  />
                </div>
                <div className="etat-form-row">
                  <Form.Label>Description</Form.Label>
                  <Form.Control
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
              </div>

              {/* Site and Client filters - always visible */}
              <div className="parameter-section">
                <div className="parameter-title">
                  Filtres (optionnels - les deux ou aucun)
                  {site && client && (
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      onClick={handleClearFilters}
                      style={{ marginLeft: "10px" }}
                    >
                      Effacer filtres
                    </Button>
                  )}
                </div>
                <div className="parameter-divider"></div>

                <div
                  className="filter-grid"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "1rem",
                    marginBottom: "1rem",
                  }}
                >
                  <div>
                    <Form.Label>Site</Form.Label>
                    <Form.Select
                      value={site}
                      onChange={(e) => setSite(e.target.value)}
                      style={{
                        borderColor:
                          (site && !client) || (!site && client)
                            ? "#dc3545"
                            : "",
                        backgroundColor:
                          (site && !client) || (!site && client)
                            ? "#ffeaee"
                            : "",
                      }}
                    >
                      <option value="">Sélectionner un site...</option>
                      {siteOptions.map((s) => (
                        <option key={s.id} value={s.site_code}>
                          {s.site_code} - {s.site_name}
                        </option>
                      ))}
                    </Form.Select>
                  </div>

                  <div>
                    <Form.Label>Client</Form.Label>
                    <Form.Select
                      value={client}
                      onChange={(e) => setClient(e.target.value)}
                      style={{
                        borderColor:
                          (site && !client) || (!site && client)
                            ? "#dc3545"
                            : "",
                        backgroundColor:
                          (site && !client) || (!site && client)
                            ? "#ffeaee"
                            : "",
                      }}
                    >
                      <option value="">Sélectionner un client...</option>
                      {clientOptions.map((c) => (
                        <option key={c.id} value={c.client_code}>
                          {c.client_code} - {c.client_name}
                        </option>
                      ))}
                    </Form.Select>
                  </div>
                </div>
              </div>

              {/* Parameter table - always visible */}
              <div className="parameter-section">
                <div className="parameter-title">Paramètre</div>
                <div className="parameter-divider"></div>
                <Table bordered hover className="etat-table">
                  <thead>
                    <tr>
                      <th> </th>
                      <th>Intitulé paramètre</th>
                      <th>Type paramètre</th>
                      <th>Valeur début</th>
                      <th>Valeur fin</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>1</td>
                      <td>{parameterTitle}</td>
                      <td>Unique</td>
                      <td>
                        <Form.Control
                          type="text"
                          value={valeurDebut}
                          onChange={(e) => setValeurDebut(e.target.value)}
                          size="sm"
                        />
                      </td>
                      <td>
                        <Form.Control
                          type="text"
                          value={valeurFin}
                          onChange={(e) => setValeurFin(e.target.value)}
                          size="sm"
                        />
                      </td>
                    </tr>
                  </tbody>
                </Table>
              </div>

              <div className="destination-section">
                <div className="etat-form-row">
                  <Form.Label>Destination de l'état</Form.Label>
                  <Form.Select
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                  >
                    <option>ACROBAT PDF</option>
                    <option>EXCEL</option>
                  </Form.Select>
                </div>
              </div>
              <div className="d-flex gap-2 mt-3">
                <Button className="btn-annuler">Annuler la modification</Button>
              </div>
            </Form>
          </Card.Body>
        </Card>
      </div>
    </div>
  );
}
