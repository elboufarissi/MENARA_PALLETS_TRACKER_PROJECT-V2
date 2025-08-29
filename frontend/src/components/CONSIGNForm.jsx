import React, {
  useEffect,
  useState,
  useMemo,
  forwardRef,
  useImperativeHandle,
} from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import axios from "axios";
import { FaArrowLeft, FaArrowRight, FaSignOutAlt } from "react-icons/fa";
import AutocompleteInput from "./AutocompleteInput";
import "./CautionForm.css";
import api from "../utils/api";
import LoadingOverlay from "../components/LoadingOverlay";


// Dynamic schema based on mode: create, view (read-only), or edit
const createValidationSchema = (isEditMode, isReadOnly) => {
  if (isReadOnly) {
    // Read-only mode: no validation needed
    return yup.object().shape({
      xnum_0: yup.string().nullable(),
      xsite_0: yup.string().nullable(),
      xclient_0: yup.string().nullable(),
      xraison_0: yup.string().nullable(),
      xbp_0: yup.string().nullable(),
      xcamion_0: yup.string().nullable(),
      xvalsta_0: yup.string().nullable(),
      palette_ramene: yup.string().nullable(),
      palette_a_consigner: yup.string().nullable(),
      palette_consignees: yup.string().nullable(),
    });
  }

  const baseSchema = {
    xnum_0: yup.string().nullable(),
  };
  if (isEditMode) {
    // Edit mode: only validate editable fields (adjust as needed)
    baseSchema.xbp_0 = yup.string().required("Bon de prélèvement obligatoire");
    baseSchema.xcamion_0 = yup.string().nullable(); // Not required, no error
    baseSchema.palette_ramene = yup
      .number()
      .typeError("Palettes ramenées doit être un nombre entier")
      .integer("Palettes ramenées doit être un nombre entier")
      .min(0, "Palettes ramenées doit être >= 0")
      .nullable();
    baseSchema.palette_a_consigner = yup
      .number()
      .typeError("Palettes à consigner doit être un nombre entier")
      .integer("Palettes à consigner doit être un nombre entier")
      .min(1, "Palettes à consigner doit être >= 1")
      .required("Palettes à consigner obligatoire");
    baseSchema.palette_consignees = yup
      .number()
      .typeError("Palettes consignées doit être un nombre entier")
      .integer("Palettes consignées doit être un nombre entier")
      .min(0, "Palettes consignées doit être >= 0")
      .nullable();
    // Make other fields nullable for edit mode
    baseSchema.xsite_0 = yup.string().nullable();
    baseSchema.xclient_0 = yup.string().nullable();
    baseSchema.xraison_0 = yup.string().nullable();
    baseSchema.xvalsta_0 = yup.string().nullable();
  } else {
    // Create mode: validate all required fields
    baseSchema.xsite_0 = yup.string().required("Site obligatoire");
    baseSchema.xclient_0 = yup
      .string()
      .matches(
        /^[A-Za-z]+\d+$/,
        "Client invalide (doit commencer par des lettres suivies de chiffres)"
      )
      .required("Client obligatoire");
    baseSchema.xraison_0 = yup.string().nullable();
    baseSchema.xbp_0 = yup.string().required("Bon de prélèvement obligatoire");
    baseSchema.xcamion_0 = yup.string().nullable(); // Not required, no error
    baseSchema.xvalsta_0 = yup
      .string()
      .required("Validation obligatoire")
      .default("1");
    baseSchema.palette_ramene = yup
      .number()
      .typeError("Palettes ramenées doit être un nombre entier")
      .integer("Palettes ramenées doit être un nombre entier")
      .min(0, "Palettes ramenées doit être >= 0")
      .required("Palettes ramenées obligatoire");
    baseSchema.palette_a_consigner = yup
      .number()
      .typeError("Palettes à consigner doit être un nombre entier")
      .integer("Palettes à consigner doit être un nombre entier")
      .min(1, "Palettes à consigner doit être >= 1")
      .required("Palettes à consigner obligatoire");
    baseSchema.palette_consignees = yup
      .number()
      .typeError("Palettes consignées doit être un nombre entier")
      .integer("Palettes consignées doit être un nombre entier")
      .min(0, "Palettes consignées doit être >= 0")
      .nullable();
  }

  return yup.object().shape(baseSchema);
};

// MODIFIED: Accept onSuccess, initialData, and isEditMode as props
const CONSIGNForm = forwardRef(
  ({ onSuccess, initialData, isEditMode = false }, ref) => {
    const isReadOnly = initialData && !isEditMode; // Read-only when viewing existing data but not editing

    const {
      register,
      handleSubmit,
      reset,
      getValues,
      watch,
      setValue,
      setError, 
      clearErrors,
      formState: { errors },
    } = useForm({
      resolver: yupResolver(createValidationSchema(isEditMode, isReadOnly)),
      defaultValues: {
        xvalsta_0: "1", // Default to 1 (Non)
        xnum_0: "",
        xsite_0: "",
        xclient_0: "",
        xraison_0: "",
        xbp_0: "",
        xcamion_0: "",
        palette_ramene: "",
        palette_a_consigner: "",
        palette_consignees: "",
      },
    });

    // State for date and time
    const [currentDate, setCurrentDate] = useState("");
    const [currentTime, setCurrentTime] = useState("");
    const [focusField, setFocusField] = useState(""); // State to manage focus field for styling
    const [currentValidationStatus, setCurrentValidationStatus] = useState(
      initialData?.xvalsta_0 || "1"
    );

    // State for dropdown data
    const [sites, setSites] = useState([]);
    const [clients, setClients] = useState([]);
    const [deliveries, setDeliveries] = useState([]); // State for Bon de prélèvement dropdown
    const [trucks, setTrucks] = useState([]); // State for XCAMION_0 dropdown
    const [isLoadingDropdowns, setIsLoadingDropdowns] = useState(true);

    // State for external transporter toggle
    const [isExternalTransporter, setIsExternalTransporter] = useState(false);

    // State for site input error
    const [siteInputError, setSiteInputError] = useState(false);

    // State for validation - track if all required fields have valid values
    const [isSiteValid, setIsSiteValid] = useState(true);
    const [isClientValid, setIsClientValid] = useState(true);
    const [isBpValid, setIsBpValid] = useState(true);
    const [isCamionValid, setIsCamionValid] = useState(true);
    const [isPaletteRameneValid, setIsPaletteRameneValid] = useState(true);
    const [isPaletteAConsignerValid, setIsPaletteAConsignerValid] =
      useState(true);
    const [isMatriculeValid, setIsMatriculeValid] = useState(true); // For both Matricule Camion and Matricule client

    // Track if user has interacted with fields (to show errors only after interaction)
    const [siteHasBeenTouched, setSiteHasBeenTouched] = useState(false);
    const [clientHasBeenTouched, setClientHasBeenTouched] = useState(false);
    const [bpHasBeenTouched, setBpHasBeenTouched] = useState(false);
    const [camionHasBeenTouched, setCamionHasBeenTouched] = useState(false);
    const [paletteRameneHasBeenTouched, setPaletteRameneHasBeenTouched] =
      useState(false);
    const [
      paletteAConsignerHasBeenTouched,
      setPaletteAConsignerHasBeenTouched,
    ] = useState(false);
    const [matriculeHasBeenTouched, setMatriculeHasBeenTouched] =
      useState(false); // For both Matricule fields

    // State for solde information
    const [currentSolde, setCurrentSolde] = useState(null);
    const [isLoadingSolde, setIsLoadingSolde] = useState(false);
const watchedClient = watch("xclient_0");
const watchedSite   = watch("xsite_0");
// Quick map: client_code -> client object
const clientsByCode = useMemo(
  () =>
    Object.fromEntries(
      (clients || []).map((c) => [
        String(c.client_code || "").trim().toUpperCase(),
        c,
      ])
    ),
  [clients]
);

const watchedClientCode = watch("xclient_0");
const [isLoading, setIsLoading] = useState(false);

// Keep raison sociale auto from client code
useEffect(() => {
  const code = String(watchedClientCode || "").trim().toUpperCase();
  const c = clientsByCode[code];
  const auto = c ? (c.raison_sociale || c.client_name || "") : "";

  if (auto) {
    const current = getValues("xraison_0") || "";
    if (current !== auto) {
      setValue("xraison_0", auto, { shouldValidate: false, shouldDirty: true });
    }
  }
}, [watchedClientCode, clientsByCode, setValue, getValues]);


    // Process deliveries for dropdown
    const deliveryOptions = useMemo(() => {
  const g = (o,k) => o?.[k.toLowerCase()] ?? o?.[k.toUpperCase()] ?? "";
  const seen = new Set();
  return (deliveries ?? [])
    .map(d => {
      const code = g(d, "sdhnum_0");
      const name = g(d, "bpinam_0");
      const site = g(d, "stofcy_0");
      return { id: String(code || ""), code: code || "", name: `${code} • ${name} • ${site}` };
    })
    .filter(opt => opt.code && !seen.has(opt.code) && seen.add(opt.code));
}, [deliveries]);

    useEffect(() => {
      if (initialData) {
        console.log("CONSIGNForm - initialData received:", initialData);
        console.log("CONSIGNForm - xheure_0:", initialData.xheure_0);
        console.log(
          "CONSIGNForm - palette_ramene:",
          initialData.palette_ramene
        );
        console.log(
          "CONSIGNForm - palette_a_consigner:",
          initialData.palette_a_consigner
        );
        console.log(
          "CONSIGNForm - palette_consignees:",
          initialData.palette_consignees
        );
        console.log(
          "CONSIGNForm - palette_consigner (old):",
          initialData.palette_consigner
        );
        console.log(
          "CONSIGNForm - palette_consigne (old):",
          initialData.palette_consigne
        );

        // Initialize validation states - when editing existing data, assume valid
        setIsSiteValid(true);
        setIsClientValid(true);
        setIsBpValid(true);
        setIsPaletteRameneValid(true);
        setIsPaletteAConsignerValid(true);
        setIsMatriculeValid(true);

        // Reset form with all fields from initialData
        reset({
          xnum_0: initialData.xnum_0 || "",
          xsite_0: initialData.xsite_0 || "",
          xclient_0: initialData.xclient_0 || "",
          xraison_0: initialData.xraison_0 || initialData.customer?.raison_sociale || "",
          xbp_0: initialData.xbp_0 || "",
          xcamion_0: initialData.xcamion_0 || "",
          xvalsta_0: initialData.xvalsta_0?.toString() || "2",
          palette_ramene:
            initialData.palette_ramene?.toString() ||
            initialData.palette_ramene ||
            "",
          palette_a_consigner:
            initialData.palette_a_consigner?.toString() ||
            initialData.palette_consigner?.toString() ||
            "",
          palette_consignees:
            initialData.palette_consignees?.toString() ||
            initialData.palette_consigne?.toString() ||
            "",
        });

        // Update validation status
        setCurrentValidationStatus(initialData.xvalsta_0?.toString() || "1");
        // Set date and time from initialData
        if (initialData.xdate_0) {
          const date = new Date(initialData.xdate_0);
          setCurrentDate(date.toLocaleDateString("fr-FR")); // Format: DD/MM/YYYY
        }
        if (initialData.xheure_0) {
          setCurrentTime(initialData.xheure_0);
        }
      } else {
        // If no initialData, set current date and time
        setCurrentValidationStatus("1");

        // In create mode, fields start as valid until user interaction proves otherwise
        setIsSiteValid(true);
        setIsClientValid(true);
        setIsBpValid(true);
        setIsPaletteRameneValid(true);
        setIsPaletteAConsignerValid(true);
        setIsMatriculeValid(true);
        setSiteHasBeenTouched(false);
        setClientHasBeenTouched(false);
        setBpHasBeenTouched(false);
        setPaletteRameneHasBeenTouched(false);
        setPaletteAConsignerHasBeenTouched(false);
        setMatriculeHasBeenTouched(false);

        const now = new Date();
        setCurrentDate(now.toLocaleDateString("fr-FR")); // Format: DD/MM/YYYY
        setCurrentTime(
          now.toLocaleTimeString("fr-FR", {
            hour: "2-digit",
            minute: "2-digit",
          })
        );
      }
    }, [initialData, reset]); // Add sites and clients as dependencies

    useEffect(() => {
  if (
    initialData &&
    !isLoadingDropdowns &&
    (sites?.length ?? 0) > 0 &&
    (clients?.length ?? 0) > 0
  ) {
    // Re-apply values so AutocompleteInput sees proper options
    reset({
      xnum_0: initialData.xnum_0 || "",
      xsite_0: initialData.xsite_0 || "",
      xclient_0: initialData.xclient_0 || "",
      xraison_0:
        getValues("xraison_0") ||
        initialData.xraison_0 ||
        initialData.customer?.raison_sociale ||
        "",
      xbp_0: initialData.xbp_0 || "",
      xcamion_0: initialData.xcamion_0 || "",
      xvalsta_0: initialData.xvalsta_0?.toString() || "2",
      palette_ramene: getValues("palette_ramene") || "",
      palette_a_consigner: getValues("palette_a_consigner") || "",
      palette_consignees: getValues("palette_consignees") || "",
    });
  }
}, [initialData, isLoadingDropdowns, sites, clients, reset, getValues]);

    // Fetch dropdown data for sites and clients
    useEffect(() => {
      const fetchDropdownData = async () => {
        try {
          const [sitesResponse, clientsResponse] = await Promise.all([
            axios.get("http://localhost:8000/api/sites"),
            axios.get("http://localhost:8000/api/clients"),
          ]);

          if (sitesResponse.data.success) {
            setSites(sitesResponse.data.data);
          }

          if (clientsResponse.data.success) {
            setClients(clientsResponse.data.data);
          }
        } catch (error) {
          console.error("Error fetching dropdown data:", error);
        } finally {
          setIsLoadingDropdowns(false);
        }
      };

      fetchDropdownData();
    }, []);

    
    // Fetch deliveries for Bon de prélèvement dropdown
    
// fetch when BOTH are present
useEffect(() => {
  const fetchDeliveries = async () => {
    try {
      if (!watchedClient || !watchedSite) {
        setDeliveries([]);
        // Only clear xbp_0 if not in edit or read-only mode
        if (!isEditMode && !(initialData && !isEditMode)) {
          setValue("xbp_0", "");
        }
        return;
      }
      const res = await axios.get("http://localhost:8000/api/delivery-documents", {
        params: { client: watchedClient, site: watchedSite },
      });
      setDeliveries(res.data?.success ? (res.data.data ?? []) : []);
      // Only clear xbp_0 if not in edit or read-only mode
      if (!isEditMode && !(initialData && !isEditMode)) {
        setValue("xbp_0", "");
      }
    } catch (e) {
      console.error("Error fetching deliveries:", e);
      setDeliveries([]);
    }
  };

  fetchDeliveries();
}, [watchedClient, watchedSite, setValue, isEditMode, initialData]);

    // Fetch trucks for XCAMION_0 dropdown
    useEffect(() => {
      const fetchTrucks = async () => {
        try {
          const response = await axios.get(
            "http://localhost:8000/api/xcamions"
          );
          if (response.data.success) {
            setTrucks(response.data.data);
          }
        } catch (error) {
          console.error("Error fetching trucks:", error);
        }
      };

      fetchTrucks();
    }, []);

    // Function to fetch solde for current client and site
    const fetchSolde = async (codeClient, site) => {
      if (!codeClient || !site) {
        setCurrentSolde(null);
        return;
      }

      setIsLoadingSolde(true);
      try {
        const response = await axios.post(
          "http://localhost:8000/api/consignations/solde",
          {
            codeClient: codeClient,
            site: site,
          }
        );

        if (response.data.success) {
          setCurrentSolde(response.data.data);
        } else {
          setCurrentSolde(null);
        }
      } catch (error) {
        console.error("Error fetching solde:", error);
        setCurrentSolde(null);
      } finally {
        setIsLoadingSolde(false);
      }
    };

    // Watch for changes in client and site to fetch solde
   

    useEffect(() => {
      fetchSolde(watchedClient, watchedSite);
    }, [watchedClient, watchedSite]);

    // Auto-calculate "Palettes consignées" when "Palettes ramenées" or "Palettes à consigner" change
    const watchedValues = watch(["palette_ramene", "palette_a_consigner"]);

    useEffect(() => {
      const [paletteRamene, paletteAConsigner] = watchedValues;
      const ramene = parseInt(paletteRamene) || 0;
      const aConsigner = parseInt(paletteAConsigner) || 0;
      const total = ramene + aConsigner;

      setValue("palette_consignees", total);
    }, [watchedValues, setValue]);

    // Helper function to validate all required fields
    const validateAllRequiredFields = () => {
      if (isEditMode || isReadOnly) {
        return { allValid: true, invalidCount: 0, invalidFields: [] };
      }

      const currentValues = getValues();
      const invalidFields = [];

      // Check Site
      const siteValue = currentValues.xsite_0;
      const siteIsValid = siteValue !== "" && isSiteValid;
      if (!siteIsValid) invalidFields.push("Site");

      // Check Client
      const clientValue = currentValues.xclient_0;
      const clientIsValid = clientValue !== "" && isClientValid;
      if (!clientIsValid) invalidFields.push("Client");

      // Check Bon de prélèvement
      const bpValue = currentValues.xbp_0;
      const bpIsValid = bpValue !== "" && isBpValid;
      if (!bpIsValid) invalidFields.push("Bon de prélèvement");

      // Check Matricule (xcamion_0) - required field in create mode
      const matriculeValue = currentValues.xcamion_0;
      const matriculeIsValid =
        matriculeValue !== "" &&
        matriculeValue.trim() !== "" &&
        isMatriculeValid;
      if (!matriculeIsValid) invalidFields.push("Matricule");

      // Check Palettes ramenées
      const paletteRameneValue = currentValues.palette_ramene;
      const paletteRameneIsValid =
        paletteRameneValue !== "" &&
        !isNaN(parseInt(paletteRameneValue)) &&
        parseInt(paletteRameneValue) >= 0 &&
        isPaletteRameneValid;
      if (!paletteRameneIsValid) invalidFields.push("Palettes ramenées");

      // Check Palettes à consigner
      const paletteAConsignerValue = currentValues.palette_a_consigner;
      const paletteAConsignerIsValid =
        paletteAConsignerValue !== "" &&
        !isNaN(parseInt(paletteAConsignerValue)) &&
        parseInt(paletteAConsignerValue) >= 0 &&
        isPaletteAConsignerValid;
      if (!paletteAConsignerIsValid) invalidFields.push("Palettes à consigner");

      return {
        allValid: invalidFields.length === 0,
        invalidCount: invalidFields.length,
        invalidFields: invalidFields,
      };
    };

    // Helper function to check if form can be saved
    const canSaveForm = () => {
      // In create mode, check if required fields are properly filled
      if (!isEditMode && !isReadOnly) {
        const validation = validateAllRequiredFields();
        return validation.allValid;
      }
      // In edit mode or read-only mode, always allow (Site/Client are not editable)
      return true;
    };

    // Custom submit handler that prevents form submission on validation failure
    const handleFormSubmit = (e) => {
      e.preventDefault(); // Always prevent default form submission

      console.log("CONSIGNForm handleFormSubmit called"); // Debug log
      console.log("Current errors:", errors); // Debug log

      // Check if form can be saved (validate all required fields)
      if (!canSaveForm()) {
        const validation = validateAllRequiredFields();
        console.log("Validation result:", validation); // Debug log

        if (validation.invalidCount >= 2) {
          alert("Les données sont incorrectes.");
        } else if (validation.invalidFields.includes("Site")) {
          alert("Site invalide ! Veuillez sélectionner un site valide.");
        } else if (validation.invalidFields.includes("Client")) {
          alert("Client invalide ! Veuillez sélectionner un client valide.");
        } else if (validation.invalidFields.includes("Bon de prélèvement")) {
          alert(
            "Bon de prélèvement invalide ! Veuillez sélectionner un bon de prélèvement valide."
          );
        } else if (validation.invalidFields.includes("Matricule")) {
          alert("Matricule invalide ! Veuillez saisir un matricule valide.");
        } else if (validation.invalidFields.includes("Palettes ramenées")) {
          alert(
            "Palettes ramenées invalide ! Veuillez saisir un nombre valide."
          );
        } else if (validation.invalidFields.includes("Palettes à consigner")) {
          alert(
            "Palettes à consigner invalide ! Veuillez saisir un nombre valide."
          );
        }

        // Return early - don't proceed with submission
        return;
      }

      // If validation passes, proceed with actual form submission
      handleSubmit(onSubmitForm)(); // Call react-hook-form's handleSubmit manually
    };

    const onSubmitForm = async (formData) => {
      console.log("CONSIGNForm onSubmitForm called with:", formData); // Debug log

      // Prevent submission in read-only mode
      if (isReadOnly) {
        alert(
          "Formulaire en lecture seule. Cliquez sur 'Modifier' pour éditer."
        );
        return;
      }

      // Prevent modification if the consignation is validated (XVALSTA_0 = 2)
      if (initialData?.xvalsta_0 === "2") {
        alert("Modification interdite : cette consignation est déjà validée.");
        return;
      }

      let submissionData;
      try {
        const paletteAConsignerValue =
          parseInt(formData.palette_a_consigner) || 0;
        const paletteRameneValue = parseInt(formData.palette_ramene) || 0;
        const paletteConsigneesValue =
          parseInt(formData.palette_consignees) || 0;

        // Always use xcamion_0 for both fields
        let camionValue = formData.xcamion_0;

        if (isEditMode) {
          // EDIT MODE: Only send editable fields, including xvalsta_0
          submissionData = {
            xbp_0: formData.xbp_0?.trim() || "",
            xcamion_0: camionValue?.trim() || "",
            palette_ramene: paletteRameneValue,
            palette_a_consigner: paletteAConsignerValue,
            palette_consignees: paletteConsigneesValue,
            xvalsta_0: Number(
              formData.xvalsta_0 ?? initialData?.xvalsta_0 ?? 1
            ), // Ensure number
          };
        } else {
          // CREATE MODE: Send all fields
          // Get current form values to ensure we have the latest data
          const currentFormValues = getValues();
          console.log("Form data from handleSubmit:", formData);
          console.log("Current form values from getValues:", currentFormValues);

          submissionData = {
            xsite_0:
              (currentFormValues.xsite_0 &&
              typeof currentFormValues.xsite_0 === "string"
                ? currentFormValues.xsite_0.trim()
                : "") ||
              (formData.xsite_0 && typeof formData.xsite_0 === "string"
                ? formData.xsite_0.trim()
                : "") ||
              "",
            xclient_0:
              (currentFormValues.xclient_0 &&
              typeof currentFormValues.xclient_0 === "string"
                ? currentFormValues.xclient_0.trim()
                : "") ||
              (formData.xclient_0 && typeof formData.xclient_0 === "string"
                ? formData.xclient_0.trim()
                : "") ||
              "",
            xraison_0:
              (currentFormValues.xraison_0 &&
              typeof currentFormValues.xraison_0 === "string"
                ? currentFormValues.xraison_0.trim()
                : "") ||
              (formData.xraison_0 && typeof formData.xraison_0 === "string"
                ? formData.xraison_0.trim()
                : "") ||
              "",
            xbp_0:
              (currentFormValues.xbp_0 &&
              typeof currentFormValues.xbp_0 === "string"
                ? currentFormValues.xbp_0.trim()
                : "") ||
              (formData.xbp_0 && typeof formData.xbp_0 === "string"
                ? formData.xbp_0.trim()
                : "") ||
              "",
            xcamion_0: camionValue?.trim() || "",
            xvalsta_0: Number(
              currentFormValues.xvalsta_0 || formData.xvalsta_0 || 1
            ), // Ensure number
            palette_ramene: paletteRameneValue,
            palette_a_consigner: paletteAConsignerValue,
            palette_consignees: paletteConsigneesValue,
          };
          console.log("Final submission data:", submissionData);
        }
        if (initialData && initialData.xnum_0) {
          // EDIT MODE: send PUT to update
          await api.put(
   `/consignations/${encodeURIComponent(initialData.xnum_0)}`, 
   submissionData 
 );
          alert("Consignation modifiée avec succès!");
        } else {
          // CREATE MODE: send POST to create (send xdate_0 and xheure_0)
          const createData = {
            ...submissionData,
            xdate_0: currentDate, // Send DD/MM/YYYY format - backend will convert
            xheure_0: currentTime,
          };
          console.log("Sending create data:", createData); // Debug log
          await api.post("/consignations", createData);
          alert("Consignation enregistrée avec succès!");
        }

        if (onSuccess) onSuccess();
        
        // Reset form after successful save to prevent duplicate submissions
        if (!isEditMode) {
          reset({
            xvalsta_0: "1",
            xnum_0: "",
            xsite_0: "",
            xclient_0: "",
            xraison_0: "",
            xbp_0: "",
            xcamion_0: "",
            palette_ramene: "",
            palette_a_consigner: "",
            palette_consignees: "",
          });
          // Reset current date and time for new entries
          const now = new Date();
          setCurrentDate(now.toLocaleDateString("fr-FR"));
          setCurrentTime(now.toTimeString().slice(0, 8));
          // Reset validation states
          setIsSiteValid(true);
          setIsClientValid(true);
          setIsBpValid(true);
          setIsCamionValid(true);
          setIsPaletteRameneValid(true);
          setIsPaletteAConsignerValid(true);
          setSiteHasBeenTouched(false);
          setClientHasBeenTouched(false);
          setBpHasBeenTouched(false);
          setCamionHasBeenTouched(false);
          setPaletteRameneHasBeenTouched(false);
          setPaletteAConsignerHasBeenTouched(false);
        }
      } catch (error) {
        console.error("Error details:", {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
          submittedData: submissionData,
        });

        // Check if this is a balance insufficient error with detailed info
        if (
          error.response?.data?.message === "Solde insuffisant" &&
          error.response?.data?.balance_info
        ) {
          const balanceInfo = error.response.data.balance_info;
          const currentBalance = balanceInfo.current_balance || 0;
          const requiredAmount = balanceInfo.required_amount || 0;
          const missingAmount =
            balanceInfo.missing_amount || requiredAmount - currentBalance;
          const palettes = Math.round(requiredAmount / 100);
          const possiblePalettes = Math.floor(currentBalance / 100);
          if (currentBalance < 0) {
            alert(
              `Vous n'avez pas le droit de consigner des palettes, merci de déposer une caution.\n\nSolde actuel: ${currentBalance} DH`
            );
            return;
          }

          const detailedMessage = `⚠️Le nombre de palette à consigner dépasse votre solde actuel 

  Situation du solde:
• Solde actuel: ${currentBalance} DH
• Montant requis: ${requiredAmount} DH
• Montant manquant: ${missingAmount} DH
• Il vous reste ${possiblePalettes} palettes à consommer.

📋 Détails de la transaction:
• Client: ${balanceInfo.client || "N/A"}
• Site: ${balanceInfo.site || "N/A"}
• Palettes à consigner: ${palettes}

💡 Action requise:
Vous devez ajouter ${missingAmount} DH au solde pour effectuer cette consignation.`;

          alert(detailedMessage);
          return;
        }

        let errorMessage = "Erreur lors de l'enregistrement: ";

        if (error.response?.data?.errors) {
          // If we have validation errors
          errorMessage += Object.entries(error.response.data.errors)
            .map(([field, messages]) => `${field}: ${messages.join(", ")}`)
            .join("\n");
        } else if (error.response?.data?.error) {
          // If we have a specific error from backend
          errorMessage += error.response.data.error;
        } else if (error.response?.data?.message) {
          // If we have a specific error message
          errorMessage += error.response.data.message;
        } else if (error.message) {
          // If we have a general error message
          errorMessage += error.message;
        }

        alert(errorMessage);
      }
    };

    // Handle validation button click - specifically for updating XVALSTA from 1 to 2
    const handleValidationClick = async (e) => {
      e.preventDefault(); // Prevent form submission

      console.log("Validation button clicked"); // Debug log

      if (!initialData || !initialData.xnum_0) {
        alert("Veuillez sélectionner une consignation à valider.");
        return;
      }

      if (initialData?.xvalsta_0 === "2" || initialData?.xvalsta_0 === 2) {
        alert("Cette consignation est déjà validée.");
        return;
      }

      try {
        // Get current form values
        const currentValues = getValues();

        // Send PUT request with all current data including XVALSTA set to 2
        const validationData = {
          xbp_0: currentValues.xbp_0 || initialData.xbp_0,
          xcamion_0: currentValues.xcamion_0 || initialData.xcamion_0,
          palette_ramene:
            parseInt(
              currentValues.palette_ramene || initialData.palette_ramene
            ) || 0,
          palette_a_consigner:
            parseInt(
              currentValues.palette_a_consigner ||
                initialData.palette_a_consigner ||
                initialData.palette_consigner
            ) || 0,
          palette_consignees:
            parseInt(
              currentValues.palette_consignees ||
                initialData.palette_consignees ||
                initialData.palette_consigne
            ) || 0,
          xvalsta_0: 2, // Set validation to "Oui" as number
        };

        console.log("Sending validation data:", validationData); // Debug log

        await api.put(`/consignations/${encodeURIComponent(initialData.xnum_0)}`, validationData);

        console.log("Validation API call successful"); // Debug log

        alert("Consignation validée avec succès!");

        // Update the initialData to reflect the backend state (for validation checks)
        if (initialData) {
          initialData.xvalsta_0 = "2";
        }

        // Trigger parent refresh if callback exists
        if (onSuccess) onSuccess();
      } catch (error) {
        console.error("Error validating consignation:", error);

        let errorMessage = "Erreur lors de la validation: ";

        if (error.response?.data?.errors) {
          // If we have validation errors, show them
          const errorDetails = Object.entries(error.response.data.errors)
            .map(([field, messages]) => `${field}: ${messages.join(", ")}`)
            .join("\n");
          errorMessage += errorDetails;
        } else if (error.response?.data?.message) {
          errorMessage += error.response.data.message;
        } else if (error.message) {
          errorMessage += error.message;
        }

        alert(errorMessage);
      }
    };

    // Expose submit method to parent via ref
    useImperativeHandle(ref, () => ({
      submit: () => {
        document
          .querySelector("form.sage-form")
          .dispatchEvent(
            new Event("submit", { cancelable: true, bubbles: true })
          );
      }
    }));

    // Helper function to handle integer input (remove non-digits)
    const handleIntegerInput = (e) => {
      e.preventDefault();
      return e.target.value.replace(/[^\d]/g, "");
    };

    // Helper for focus border and edit mode styling
    const getInputClass = (name) => {
      let className = `sage-input ${
        focusField === name ? "sage-input-focus" : ""
      }`;
      if (errors && errors[name]) {
        className += " sage-input-error";
      }
      if (
        isEditMode &&
        (name === "xbp_0" ||
          name === "xcamion_0" ||
          name === "palette_ramene" ||
          name === "palette_a_consigner" ||
          name === "palette_consignees")
      ) {
        className += " editable-field";
      }
      return className;
    };

    return (
      <div style={{ position: "relative" }}>
        <form
          onSubmit={handleFormSubmit}
          className={`sage-form ${
            isEditMode ? "edit-mode" : isReadOnly ? "view-mode" : "create-mode"
          }`}
        >
          <div className="sage-form-header">
            <div className="sage-form-header-left">
              <FaArrowLeft className="sage-nav-arrow" />
              <FaArrowRight className="sage-nav-arrow" />
              <span className="sage-form-title">
                {isEditMode ? "Modification de Consignation" : "Consignation"}
              </span>
              {isEditMode && (
                <span
                  style={{
                    marginLeft: "10px",
                    fontSize: "0.65rem",
                    color: "#ff9800",
                    fontWeight: "normal",
                  }}
                >
                  (Seuls BP, Camion et Palettes modifiables)
                </span>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>

              <button
                type="button"
                className="sage-validation-btn"
                onClick={handleValidationClick}
                style={
                  currentValidationStatus === "1"
                    ? {
                        backgroundColor: "#0866ff",
                        color: "#fff",
                        cursor: "pointer",
                        opacity: 1,
                      }
                    : {
                        // Keep current color (default), but reduce opacity and disable
                        opacity: 0.6,
                        cursor: "not-allowed",
                      }
                }
                disabled={currentValidationStatus === "2"}
              >
                Validation
              </button>
              <FaSignOutAlt className="caution-header-icon" />
            </div>
          </div>
          <div className="sage-section">
            <div className="sage-section-title">
              <span className="sage-section-icon">&#8962;</span> Général
            </div>
            <div className="sage-fields">
              <div className="sage-row">
                <label>N° de Bon</label>
                <input
                  type="text"
                  {...register("xnum_0")}
                  disabled
                  className="sage-input"
                  value={initialData?.xnum_0 || ""}
                  tabIndex={-1}
                />
              </div>{" "}
              <div className="sage-row">
                <label>
                  Site <span className="sage-required">*</span>
                </label>
                <AutocompleteInput
                  options={sites.map((site) => ({
                    id: site.id?.toString() || "",
                    code: site.site_code || "",
                    name: site.site_name || "",
                  }))}
                  value={getValues("xsite_0")}
                  onChange={(e) => {
                    let value =
                      e && e.target && typeof e.target.value === "string"
                        ? e.target.value
                        : e;

                    // Mark site as touched when user starts typing
                    setSiteHasBeenTouched(true);

                    if (typeof value === "object" && value && value.code) {
                      // Save the full site code when a suggestion is selected
                      setValue("xsite_0", value.code, { shouldValidate: true });
                      setIsSiteValid(true);
                      setSiteInputError(false);
                    } else if (typeof value === "string") {
                      const numericValue = value.replace(/[^0-9]/g, "");
                      const isNonDigit =
                        value.length > 0 && /[^0-9]/.test(value);
                      const matchingSite = sites.find(
                        (site) => site.site_code === numericValue
                      );
                      const noSiteMatch =
                        numericValue.length > 0 && !matchingSite;

                      // Update validation states
                      const hasError = isNonDigit || noSiteMatch;
                      setSiteInputError(hasError);

                      // Only mark as invalid if user has entered something invalid
                      if (numericValue === "") {
                        setIsSiteValid(true); // Empty is not invalid, just not filled
                      } else {
                        setIsSiteValid(matchingSite !== undefined);
                      }

                      setValue("xsite_0", numericValue, {
                        shouldValidate: true,
                      });
                    }
                  }}
                  onSelect={(selectedOption) => {
                    setSiteHasBeenTouched(true);
                    if (selectedOption && selectedOption.code) {
                      setValue("xsite_0", selectedOption.code, {
                        shouldValidate: true,
                      });
                      setIsSiteValid(true);
                      setSiteInputError(false);
                    }
                  }}
                  onKeyPress={(e) => {
                    if (!/[0-9]/.test(e.key)) {
                      setSiteInputError(true);
                      e.preventDefault();
                    } else {
                      setSiteInputError(false);
                    }
                  }}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  disabled={initialData || isLoadingDropdowns}
                  className={
                    getInputClass("xsite_0") +
                    (siteInputError ||
                    (siteHasBeenTouched &&
                      !isSiteValid &&
                      !isEditMode &&
                      !isReadOnly)
                      ? " sage-input-error"
                      : "")
                  }
                  onFocus={() => setFocusField("xsite_0")}
                  onBlur={() => {
                    setFocusField("");
                    setSiteInputError(false);
                    setSiteHasBeenTouched(true);

                    // Validate site when field loses focus
                    const currentSiteValue = getValues("xsite_0");
                    if (!isEditMode && !isReadOnly) {
                      if (currentSiteValue === "") {
                        setIsSiteValid(true); // Empty is not invalid, just not filled
                      } else {
                        const matchingSite = sites.find(
                          (site) => site.site_code === currentSiteValue
                        );
                        setIsSiteValid(matchingSite !== undefined);
                      }
                    }
                  }}
                  register={register("xsite_0")}
                  searchKeys={["code", "name"]}
                  displayKeys={["code", "name"]}
                  primaryKey="code"
                  noResultsText="Site introuvable"
                />
              </div>{" "}
            <div className="sage-row">
  <label>
    Client <span className="sage-required">*</span>
  </label>
  <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
    <input
      type="text"
      {...register("xclient_0")}
      value={getValues("xclient_0")}
      onChange={(e) => {
        const v = e.target.value.trim().toUpperCase();
        setValue("xclient_0", v, { shouldValidate: false });

        if (window.clientTimeout) clearTimeout(window.clientTimeout);

        // 🚀 Active le loader pendant la recherche
        setIsLoading(true);

        window.clientTimeout = setTimeout(() => {
          const finalValue = (getValues("xclient_0") || "").trim().toUpperCase();
          if (finalValue && !clientsByCode[finalValue]) {
            setError("xclient_0", {
              type: "manual",
              message: "Client introuvable",
            });
          } else {
            clearErrors("xclient_0");
          }
          // ✅ Désactive le loader une fois terminé
          setIsLoading(false);
        }, 1000);
      }}
      autoComplete="off"
      disabled={!!initialData}
      className={
        getInputClass("xclient_0") +
        (errors.xclient_0 ? " sage-input-error" : "")
      }
    />

    {errors.xclient_0 && (
      <span className="client-autocomplete-no-results">
        {errors.xclient_0.message}
      </span>
    )}
  </div>
</div>


              <div className="sage-row">
  <label>Raison sociale</label>

  {/* Visible, read-only value (auto-filled by the effect) */}
  <input
    type="text"
    readOnly
    value={watch("xraison_0") || ""}
    className={getInputClass("xraison_0") + " read-only"}
    tabIndex={-1}
  />

  {/* Hidden to keep the value in RHF form state */}
  <input type="hidden" {...register("xraison_0")} />
</div>

              <div className="sage-row">
                <label>
                  Bon de prélèvement <span className="sage-required">*</span>
                </label>
                <AutocompleteInput
                  options={deliveryOptions}
                  value={getValues("xbp_0")}
                  onChange={(e) => {
                    const selectedValue = e.target.value;
                    setBpHasBeenTouched(true);

                    setValue("xbp_0", selectedValue, { shouldValidate: true });

                    // Validate if the entered value matches any delivery option
                    if (!isEditMode && !isReadOnly) {
                      if (selectedValue === "") {
                        setIsBpValid(true); // Empty is not invalid, just not filled
                      } else {
                        const matchingDelivery = deliveryOptions.find(
                          (delivery) => delivery.code === selectedValue
                        );
                        setIsBpValid(matchingDelivery !== undefined);
                      }
                    }
                  }}
                  disabled={initialData && !isEditMode}
                  className={
                    getInputClass("xbp_0") +
                    (bpHasBeenTouched &&
                    !isBpValid &&
                    !isEditMode &&
                    !isReadOnly
                      ? " sage-input-error"
                      : "")
                  }
                  onFocus={() => setFocusField("xbp_0")}
                  onBlur={() => {
                    setFocusField("");
                    setBpHasBeenTouched(true);

                    // Validate BP when field loses focus
                    const currentBpValue = getValues("xbp_0");
                    if (!isEditMode && !isReadOnly) {
                      if (currentBpValue === "") {
                        setIsBpValid(true); // Empty is not invalid, just not filled
                      } else {
                        const matchingDelivery = deliveryOptions.find(
                          (delivery) => delivery.code === currentBpValue
                        );
                        setIsBpValid(matchingDelivery !== undefined);
                      }
                    }
                  }}
                  register={register("xbp_0")}
                  searchKeys={["code", "name"]}
                  displayKeys={["code"]}
                  primaryKey="code"
                  noResultsText="Prélèvement introuvable pour ce client/site"
                />
              </div>
              <div className="sage-row">
                <label>
                  Transporteur externe ?{" "}
                  <span className="sage-required">*</span>
                </label>
                <select
                  value={isExternalTransporter ? "Oui" : "Non"}
                  onChange={(e) => {
                    const isOui = e.target.value === "Oui";
                    setIsExternalTransporter(isOui);
                    // Always clear xcamion_0 when switching
                    setValue("xcamion_0", "", { shouldValidate: true });
                    // Reset matricule validation state when switching
                    setIsMatriculeValid(true);
                    setMatriculeHasBeenTouched(false);
                  }}
                  className={getInputClass("isExternalTransporter")}
                  disabled={isReadOnly}
                >
                  <option value="Non">Non</option>
                  <option value="Oui">Oui</option>
                </select>
              </div>
              {isExternalTransporter ? (
                <div className="sage-row">
                  <label>
                    Matricule client <span className="sage-required">*</span>
                  </label>
                  <input
                    type="text"
                    value={getValues("xcamion_0")}
                    onChange={(e) => {
                      let value = e.target.value;

                      // Auto-add TC- prefix for external transporter matricule client
                      if (value && !value.startsWith("TC-")) {
                        value = "TC-" + value;
                      }

                      setValue("xcamion_0", value, {
                        shouldValidate: true,
                      });
                      setMatriculeHasBeenTouched(true);

                      // Validate real-time for matricule client
                      if (!isEditMode && !isReadOnly) {
                        setIsMatriculeValid(
                          value !== "" && value.trim() !== ""
                        );
                      }
                    }}
                    className={
                      getInputClass("xcamion_0") +
                      (matriculeHasBeenTouched &&
                      !isMatriculeValid &&
                      !isEditMode &&
                      !isReadOnly
                        ? " sage-input-error"
                        : "")
                    }
                    onFocus={() => setFocusField("xcamion_0")}
                    onBlur={() => {
                      setFocusField("");
                      setMatriculeHasBeenTouched(true);

                      // Validate matricule client when field loses focus
                      const currentValue = getValues("xcamion_0");
                      if (!isEditMode && !isReadOnly) {
                        setIsMatriculeValid(
                          currentValue !== "" && currentValue.trim() !== ""
                        );
                      }
                    }}
                    autoComplete="off"
                    disabled={isReadOnly}
                  />
                  {errors.xcamion_0 && (
                    <span className="sage-input-error-text">
                      {errors.xcamion_0.message}
                    </span>
                  )}
                </div>
              ) : (
                <div className="sage-row">
                  <label>
                    Matricule Camion <span className="sage-required">*</span>
                  </label>
                  <AutocompleteInput
                    options={trucks.map((truck) => ({
                      id: truck.XMAT_0?.toString() || "",
                      code: truck.XMAT_0 || "",
                      name: truck.XMAT_0 || "",
                    }))}
                    value={getValues("xcamion_0")}
                    onChange={(e) => {
                      const selectedValue = e.target.value;
                      setMatriculeHasBeenTouched(true);

                      setValue("xcamion_0", selectedValue, {
                        shouldValidate: true,
                      });

                      // Validate if the entered value matches any truck code
                      if (!isEditMode && !isReadOnly) {
                        if (selectedValue === "") {
                          setIsMatriculeValid(false); // Empty is invalid for required field
                        } else {
                          const matchingTruck = trucks.find(
                            (truck) => truck.XMAT_0 === selectedValue
                          );
                          setIsMatriculeValid(matchingTruck !== undefined);
                        }
                      }
                    }}
                    disabled={initialData && !isEditMode}
                    className={
                      getInputClass("xcamion_0") +
                      (matriculeHasBeenTouched &&
                      !isMatriculeValid &&
                      !isEditMode &&
                      !isReadOnly
                        ? " sage-input-error"
                        : "")
                    }
                    onFocus={() => setFocusField("xcamion_0")}
                    onBlur={() => {
                      setFocusField("");
                      setMatriculeHasBeenTouched(true);

                      // Validate matricule camion when field loses focus
                      const currentValue = getValues("xcamion_0");
                      if (!isEditMode && !isReadOnly) {
                        if (currentValue === "") {
                          setIsMatriculeValid(false); // Empty is invalid for required field
                        } else {
                          const matchingTruck = trucks.find(
                            (truck) => truck.XMAT_0 === currentValue
                          );
                          setIsMatriculeValid(matchingTruck !== undefined);
                        }
                      }
                    }}
                    register={register("xcamion_0")}
                    searchKeys={["code", "name"]}
                    displayKeys={["code"]}
                    primaryKey="code"
                    noResultsText="Matricule introuvable "
                  />
                  {errors.xcamion_0 && (
                    <span className="sage-input-error-text">
                      {errors.xcamion_0.message}
                    </span>
                  )}
                </div>
              )}
              <div className="sage-row">
                <label>Date</label>
                <input
                  type="text"
                  value={currentDate}
                  disabled
                  className="sage-input"
                  tabIndex={-1}
                />
              </div>
              <div className="sage-row">
                <label>Heure</label>
                <input
                  type="text"
                  value={currentTime}
                  disabled
                  className="sage-input"
                  tabIndex={-1}
                />
              </div>
              <div className="sage-row">
                <label>Validée</label>{" "}
                <select
                  {...register("xvalsta_0")}
                  className={getInputClass("xvalsta_0")}
                  onFocus={() => setFocusField("xvalsta_0")}
                  onBlur={() => setFocusField("")}
                  value={currentValidationStatus}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    setCurrentValidationStatus(newValue);
                    setValue("xvalsta_0", newValue, {
                      shouldValidate: true,
                    });
                  }}
                  disabled={isReadOnly}
                >
                  <option value="1">Non</option>
                  <option value="2">Oui</option>
                </select>
              </div>
            </div>
          </div>{" "}
          <div className="sage-section">
            <div className="sage-section-title">Lignes</div>
            <div className="sage-fields">
              {" "}
              <div className="sage-row">
                <label>Palettes ramenées</label>
                <input
                  type="text"
                  {...register("palette_ramene")}
                  className={
                    getInputClass("palette_ramene") +
                    (paletteRameneHasBeenTouched &&
                    !isPaletteRameneValid &&
                    !isEditMode &&
                    !isReadOnly
                      ? " sage-input-error"
                      : "")
                  }
                  onFocus={() => setFocusField("palette_ramene")}
                  onBlur={() => {
                    setFocusField("");
                    setPaletteRameneHasBeenTouched(true);

                    // Validate palette ramenée when field loses focus
                    const currentValue = getValues("palette_ramene");
                    if (!isEditMode && !isReadOnly) {
                      if (currentValue === "") {
                        setIsPaletteRameneValid(true); // Empty is not invalid, just not filled
                      } else {
                        const numValue = parseInt(currentValue);
                        setIsPaletteRameneValid(
                          !isNaN(numValue) && numValue >= 0
                        );
                      }
                    }
                  }}
                  onChange={(e) => {
                    const value = handleIntegerInput(e); // Clean the input first
                    setPaletteRameneHasBeenTouched(true);

                    // Update form state with cleaned value
                    setValue("palette_ramene", value, {
                      shouldValidate: true,
                    });

                    // Validate real-time for palette ramenée
                    if (!isEditMode && !isReadOnly) {
                      if (value === "") {
                        setIsPaletteRameneValid(true); // Empty is not invalid, just not filled
                      } else {
                        const numValue = parseInt(value);
                        setIsPaletteRameneValid(
                          !isNaN(numValue) && numValue >= 0
                        );
                      }
                    }
                  }}
                  onInput={(e) => {
                    e.target.value = handleIntegerInput(e);
                  }}
                  autoComplete="off"
                  disabled={initialData && !isEditMode} // Editable in edit mode
                />
              </div>
              <div className="sage-row">
                <label>
                  Palettes à consigner <span className="sage-required">*</span>
                </label>
                <input
                  type="text"
                  {...register("palette_a_consigner")}
                  className={
                    getInputClass("palette_a_consigner") +
                    (paletteAConsignerHasBeenTouched &&
                    !isPaletteAConsignerValid &&
                    !isEditMode &&
                    !isReadOnly
                      ? " sage-input-error"
                      : "")
                  }
                  onFocus={() => setFocusField("palette_a_consigner")}
                  onBlur={() => {
                    setFocusField("");
                    setPaletteAConsignerHasBeenTouched(true);

                    // Validate palette a consigner when field loses focus
                    const currentValue = getValues("palette_a_consigner");
                    if (!isEditMode && !isReadOnly) {
                      if (currentValue === "") {
                        setIsPaletteAConsignerValid(true); // Empty is not invalid, just not filled
                      } else {
                        const numValue = parseInt(currentValue);
                        setIsPaletteAConsignerValid(
                          !isNaN(numValue) && numValue >= 0
                        );
                      }
                    }
                  }}
                  onChange={(e) => {
                    const value = handleIntegerInput(e); // Clean the input first
                    setPaletteAConsignerHasBeenTouched(true);

                    // Update form state with cleaned value
                    setValue("palette_a_consigner", value, {
                      shouldValidate: true,
                    });

                    // Validate real-time for palette a consigner
                    if (!isEditMode && !isReadOnly) {
                      if (value === "") {
                        setIsPaletteAConsignerValid(true); // Empty is not invalid, just not filled
                      } else {
                        const numValue = parseInt(value);
                        setIsPaletteAConsignerValid(
                          !isNaN(numValue) && numValue >= 0
                        );
                      }
                    }
                  }}
                  onInput={(e) => {
                    e.target.value = handleIntegerInput(e);
                  }}
                  autoComplete="off"
                  disabled={initialData && !isEditMode} // Editable in edit mode
                />
              </div>{" "}
              <div className="sage-row">
                <label>Palettes consignées</label>
                <input
                  type="text"
                  {...register("palette_consignees")}
                  className={getInputClass("palette_consignees")}
                  onFocus={() => setFocusField("palette_consignees")}
                  onBlur={() => setFocusField("")}
                  autoComplete="off"
                  disabled={true} // Always disabled since it's auto-calculated
                  tabIndex={-1}
                />
              </div>
            </div>
          </div> <br></br>  
        </form>
        {/* 🔥 overlay on top of the form */}
    <LoadingOverlay show={isLoading} text="Chargement en cours..." />
      </div>
    );
  }
);

export default CONSIGNForm;