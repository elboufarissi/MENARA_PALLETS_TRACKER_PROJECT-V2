import React, { useState, useEffect, useMemo } from "react";
import api from "../utils/api";
import CautionHeader from "../components/CautionHeader";
import NavigationMenu from "../components/NavigationMenu";
import AutocompleteInput from "../components/AutocompleteInput";
import DetailsClientOperations from "../components/DetailsClientOperations";
import "../components/SituationClient.css";
import "../components/CautionTable.css";
import { useAuth } from "../context/AuthContext";
import LoadingOverlay from "../components/LoadingOverlay";


export default function SituationClient() {
  const { user } = useAuth();

  const [client, setClient] = useState("");
  const [site, setSite] = useState("");
  const [raison, setRaison] = useState("");
  const [clientOptions, setClientOptions] = useState([]);
  const [siteOptions, setSiteOptions] = useState([]);
  const [resultat, setResultat] = useState({
    cautionPalettes: 0,
    palettesConsignees: 0,
    cautionDh: 0,
    palettesDeconsignees: 0,
    soldePalettes: 0,
    soldeDh: 0,
    sumrestitutions: 0,
  });
  const [operations, setOperations] = useState([]);
  const [showDetails, setShowDetails] = useState(false);
  const [error, setError] = useState(null);

  const [isClientValid, setIsClientValid] = useState(true);
  const [clientTouched, setClientTouched] = useState(false);
   const [isLoading, setIsLoading] = useState(false); 

  // Memoize options to prevent infinite re-renders
  const clientOptionsFormatted = useMemo(() => {
    return clientOptions.map((c) => ({
      id: c.id?.toString() || "",
      code: c.client_code || "",
      name: c.client_name || "",
    }));
  }, [clientOptions]);
   // Fast lookup: CLIENT_CODE (uppercased) -> { id, code, name }
const clientsByCode = useMemo(() => {
  const map = {};
  for (const c of clientOptions) {
    const code = String(c.client_code || "").trim().toUpperCase();
    const name = c.client_name || c.raison_sociale || "";
    if (code) map[code] = { code, name };
  }
  return map;
}, [clientOptions]);

  const siteOptionsFormatted = useMemo(() => {
    return siteOptions.map((s) => ({
      id: s.id?.toString() || "",
      code: s.site_code || "",
      name: s.site_name || "",
    }));
  }, [siteOptions]);

  useEffect(() => {
    api
      .get("/clients")
      .then((res) => {
        if (res.data.success) {
          setClientOptions(res.data.data);
        }
      })
      .catch((err) => console.error("Erreur chargement clients", err));
  }, []);

  useEffect(() => {
    api
      .get("/sites")
      .then((res) => {
        if (res.data.success) {
          setSiteOptions(res.data.data);
        }
      })
      .catch((err) => console.error("Erreur chargement sites", err));
  }, []);

  const handleFetchSituation = async () => {
  if (!client || !site) {
    alert("Veuillez remplir les champs Client et Site.");
    return;
  }
  if (!isClientKnown) {
    setClientTouched(true);
    setIsClientValid(false);
    alert("Client introuvable. Veuillez saisir un code client valide.");
    return;
  }
  try {
    const response = await api.get("/flux-interne/situation-client", {
      params: { client: client.trim().toUpperCase(), site },
    });
    const data = response.data;
    if (data.raison) setRaison(data.raison);
    setResultat({
      cautionPalettes: data.cautionPalettes || 0,
      palettesConsignees: data.palettesConsignees || 0,
      cautionDh: data.cautionDh || 0,
      palettesDeconsignees: data.palettesDeconsignees || 0,
      sumrestitutions: data.sumrestitutions || 0,
      soldePalettes: Math.floor(data.soldePalettes || 0),
      soldeDh: data.soldeDh || 0,
    });
    setOperations(data.operations || []);
    setShowDetails(true);
    setError(null);
  } catch (err) {
    setError(
      `Erreur lors de la récupération de la situation client: ${
        err.response?.data?.message || err.message
      }`
    );
  }
};

  const isClientKnown = useMemo(() => {
  const code = (client || "").trim().toUpperCase();
  return !!clientsByCode[code];
}, [client, clientsByCode]);


  return (
    <div style={{overflowY: 'auto', maxHeight: '100vh'}}>
      <CautionHeader user={user} />
      <div className="situation-container">
        <div className="situation-main">
          <NavigationMenu />

          <div className="card">
            <LoadingOverlay show={isLoading} text="Chargement en cours..." />
            <h3>Critères</h3>
            <div className="form-row">
              <label>
                Site <span className="required">*</span>
              </label>
              <div className="input-wrapper">
                <AutocompleteInput
                  value={site}
                  onChange={(e) => setSite(e.target.value)}
                  onSelect={(option) => setSite(option.code)}
                  options={siteOptionsFormatted}
                  displayKeys={["code", "name"]}
                  primaryKey="code"
                />
              </div>
            </div>
            <div className="form-row">
  <label>
    Client <span className="required">*</span>
  </label>

  <div className="input-wrapper">
    <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
      <input
        value={client}
        onChange={(e) => {
          const value = (e?.target?.value ?? "")
            .toString()
            .toUpperCase()
            .trim();

          setClient(value);

          // Raison auto
          const hit = clientsByCode[value];
          setRaison(hit ? hit.name : "");

          // Reset valid pendant la saisie
          setIsClientValid(true);

          // Validation différée (1s)
          if (window.clientTimeout) clearTimeout(window.clientTimeout);
          setIsLoading(true); // active blur

          window.clientTimeout = setTimeout(() => {
            const code = (value || "").trim().toUpperCase();
            setClientTouched(true);
            setIsClientValid(code === "" ? true : !!clientsByCode[code]);
            setIsLoading(false); // désactive blur
          }, 1000);
        }}
        onBlur={() => {
          setClientTouched(true);
          const code = (client || "").trim().toUpperCase();
          setIsClientValid(code === "" ? true : !!clientsByCode[code]);
        }}
        autoComplete="off"
        className={`input ${
          clientTouched && !isClientValid ? "sage-input-error" : ""
        }`}
        placeholder="Ex: CGP78810"
      />

      {clientTouched && !isClientValid && (
        <span className="sage-input-error-text">Client introuvable</span>
      )}
    </div>
  </div>
</div>

            <div className="form-row">
              <label>Raison sociale</label>
              <div className="input-wrapper">
                <input value={raison} readOnly className="readonly" />
              </div>
            </div>

            

            <div className="form-row">
              <button onClick={handleFetchSituation}>OK</button>
            </div>
          </div>

          <div className="card">
            <h3>Résultat</h3>
            {error && <p className="error">{error}</p>}
            <div className="form-row">
              <label>Caution (Palettes)</label>
              <input value={resultat.cautionPalettes} readOnly />
            </div>
            <div className="form-row">
              <label>Palettes Consignées</label>
              <input value={resultat.palettesConsignees} readOnly />
            </div>
            <div className="form-row">
              <label>Caution (DH)</label>
              <input value={resultat.cautionDh} readOnly />
            </div>
            <div className="form-row">
              <label>Palettes Déconsignées</label>
              <input value={resultat.palettesDeconsignees} readOnly />
            </div>
            <div className="form-row">
              <label>Caution récupérée (DH)</label>
              <input value={resultat.sumrestitutions} readOnly />
            </div>
            <div className="form-row">
              <label>Solde (Palettes)</label>
              <input value={resultat.soldePalettes} readOnly />
            </div>
            <div className="form-row">
              <label>Solde (DH)</label>
              <input value={resultat.soldeDh} readOnly />
            </div>
            {operations.length > 0 && (
              <div className="form-row">
                <button onClick={() => setShowDetails(!showDetails)}>
                  {showDetails ? "Masquer les détails" : "Plus de détails"}
                </button>
              </div>
            )}
          </div>

          {showDetails && operations.length > 0 && (
            <div className="card">
              <h3>Opérations du client</h3>
              <DetailsClientOperations operations={operations} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
