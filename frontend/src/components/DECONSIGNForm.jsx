import React, {
  useEffect,
  useState,
  forwardRef,
  useImperativeHandle,
} from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import api from "../utils/api";
import { FaArrowLeft, FaArrowRight, FaSignOutAlt } from "react-icons/fa";
import AutocompleteInput from "./AutocompleteInput";
import "./CautionForm.css";
import { useMemo } from "react"; // you already import React, but ensure useMemo is available

// Dynamic schema based on mode: create, view (read-only), or edit, and user role
const createValidationSchema = (isEditMode, isReadOnly, userRole) => {
  if (isReadOnly) {
    // Read-only mode: no validation needed
    return yup.object().shape({
      xnum_0: yup.string().nullable(),
      xsite_0: yup.string().nullable(),
      xclient_0: yup.string().nullable(),
      xraison_0: yup.string().nullable(),
      xcamion_0: yup.string().nullable(),
      xvalsta_0: yup.string().nullable(),
      palette_ramene: yup.string().nullable(),
      palette_a_deconsigner: yup.string().nullable(),
      palette_deconsignees: yup.string().nullable(),
    });
  }

  const baseSchema = {
    xnum_0: yup.string().nullable(),
  };
  if (isEditMode) {
    // Edit mode: only validate editable fields (adjust as needed)
    baseSchema.xcamion_0 = yup.string().nullable(); // Not required, no error
    baseSchema.palette_ramene = yup
      .number()
      .typeError("Palettes ramenées doit être un nombre entier")
      .integer("Palettes ramenées doit être un nombre entier")
      .min(0, "Palettes ramenées doit être >= 0")
      .nullable();
    baseSchema.palette_a_deconsigner = yup
      .number()
      .typeError("Palettes à déconsigner doit être un nombre entier")
      .integer("Palettes à déconsigner doit être un nombre entier")
      .min(1, "Palettes à déconsigner doit être >= 1")
      .required("Palettes à déconsigner obligatoire");
    baseSchema.palette_deconsignees = yup
      .number()
      .typeError("Palettes déconsignées doit être un nombre entier")
      .integer("Palettes déconsignées doit être un nombre entier")
      .min(0, "Palettes déconsignées doit être >= 0")
      .test(
        "max-deconsignees",
        "Le nombre de palettes déconsignées ne doit pas dépasser le nombre de palettes à déconsigner",
        function (value) {
          const { palette_a_deconsigner } = this.parent;
          if (!value || !palette_a_deconsigner) return true; // Allow empty values
          return Number(value) <= Number(palette_a_deconsigner);
        }
      )
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
    baseSchema.xcamion_0 = yup.string().nullable(); // Not required, no error
    baseSchema.xvalsta_0 = yup
      .string()
      .required("Validation obligatoire")
      .default("1");
    baseSchema.palette_ramene = yup
      .number()
      .typeError("Palettes ramenées doit être un nombre entier")
      .integer("Palettes ramenées doit être un nombre entier")
      .min(0, "Le nombre de palettes ramenées doit être supérieur à zéro")
      .required("Palettes ramenées obligatoire");
    baseSchema.palette_a_deconsigner = yup
      .number()
      .typeError("Palettes à déconsigner doit être un nombre entier")
      .integer("Palettes à déconsigner doit être un nombre entier")
      .min(1, "Palettes à déconsigner doit être >= 1")
      .required("Palettes à déconsigner obligatoire");
    // For create mode, handle palette_deconsignees based on user role
    if (userRole === "AGENT_ORDONNANCEMENT") {
      // AGENT_ORDONNANCEMENT: Optional field
      baseSchema.palette_deconsignees = yup
        .number()
        .transform((value, originalValue) => {
          // Transform empty string to undefined for optional field
          return originalValue === "" ? undefined : value;
        })
        .typeError("Palettes déconsignées doit être un nombre entier")
        .integer("Palettes déconsignées doit être un nombre entier")
        .min(0, "Palettes déconsignées doit être >= 0")
        .test(
          "max-deconsignees",
          "Le nombre de palettes déconsignées ne doit pas dépasser le nombre de palettes à déconsigner",
          function (value) {
            const { palette_a_deconsigner } = this.parent;
            if (!value || !palette_a_deconsigner) return true; // Allow empty values
            return Number(value) <= Number(palette_a_deconsigner);
          }
        )
        .nullable();
    } else {
      // Other roles: Required field
      baseSchema.palette_deconsignees = yup
        .number()
        .typeError("Palettes déconsignées doit être un nombre entier")
        .integer("Palettes déconsignées doit être un nombre entier")
        .min(0, "Palettes déconsignées doit être >= 0")
        .test(
          "max-deconsignees",
          "Le nombre de palettes déconsignées ne doit pas dépasser le nombre de palettes à déconsigner",
          function (value) {
            const { palette_a_deconsigner } = this.parent;
            if (!value || !palette_a_deconsigner) return true; // Allow empty values
            return Number(value) <= Number(palette_a_deconsigner);
          }
        )
        .required("Palettes déconsignées obligatoire");
    }
  }

  return yup.object().shape(baseSchema);
};

// MODIFIED: Accept onSuccess, initialData, isEditMode, and userRole as props
const DECONSIGNForm = forwardRef(
  ({ onSuccess, initialData, isEditMode = false, userRole }, ref) => {
    // Role-based permissions
    const canModifyBasicFields =
      userRole === "AGENT_ORDONNANCEMENT" || userRole === "ADMIN";
    const canModifyPalettesDeconsignees =
      userRole === "CHEF_PARC" || userRole === "ADMIN";
    const canOnlyValidate = userRole === "CAISSIER" || userRole === "CAISSIERE";
    const canUserValidate =
      userRole === "CAISSIER" ||
      userRole === "CAISSIERE" ||
      userRole === "ADMIN";
    const canSave = canModifyBasicFields || canModifyPalettesDeconsignees;

    // Modified read-only logic: CHEF_PARC can always edit palette_deconsignees field
    const isReadOnly =
      initialData && !isEditMode && !canModifyPalettesDeconsignees;

    // For CAISSIER/CAISSIERE, form is always read-only except validation
    const isFormReadOnly = isReadOnly || canOnlyValidate;

    const {
      register,
      handleSubmit,
      reset,
      getValues,
      setValue,
      setError, 
      clearErrors,
      watch,
      formState: { errors },
    } = useForm({
      resolver: yupResolver(
        createValidationSchema(isEditMode, isFormReadOnly, userRole)
      ),
      defaultValues: {
        xvalsta_0: "1", // Default to 1 (Non)
        xnum_0: "",
        xsite_0: "",
        xclient_0: "",
        xraison_0: "",
        xcamion_0: "",
        palette_ramene: "",
        palette_a_deconsigner: "",
        palette_deconsignees: "",
      },
      mode: "onChange", // Validate on change to catch issues early
    });
const watchedClient = watch("xclient_0");
 const watchedSite   = watch("xsite_0");

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
    const [trucks, setTrucks] = useState([]); // State for XCAMION_0 dropdown
    const [isLoadingDropdowns, setIsLoadingDropdowns] = useState(true);
    const [siteInputError, setSiteInputError] = useState(false);

    // State for external transporter toggle
    const [isExternalTransporter, setIsExternalTransporter] = useState(false);

    // State for validation - track if all required fields have valid values
    const [isSiteValid, setIsSiteValid] = useState(true);
    const [isClientValid, setIsClientValid] = useState(true);
    const [isPaletteRameneValid, setIsPaletteRameneValid] = useState(true);
    const [isMatriculeValid, setIsMatriculeValid] = useState(true); // For both Matricule Camion and Matricule client

    // Track if user has interacted with fields (to show errors only after interaction)
    const [siteHasBeenTouched, setSiteHasBeenTouched] = useState(false);
    const [clientHasBeenTouched, setClientHasBeenTouched] = useState(false);
    const [paletteRameneHasBeenTouched, setPaletteRameneHasBeenTouched] =
      useState(false);
    const [matriculeHasBeenTouched, setMatriculeHasBeenTouched] =
      useState(false); // For both Matricule fields

    // State for solde information
    const [currentSolde, setCurrentSolde] = useState(null);
    const [isLoadingSolde, setIsLoadingSolde] = useState(false);
// Map client code -> raison/name for quick lookups
const clientsByCode = useMemo(() => {
  const map = {};
  for (const c of (clients || [])) {
    const code = String(c.client_code || "").trim().toUpperCase();
    const raison = c.raison_sociale || c.client_name || "";
    if (code) map[code] = { ...c, raison };
  }
  return map;
}, [clients]);

// Keep xraison_0 in sync when xclient_0 changes
useEffect(() => {
  const code = String(watchedClient || "").trim().toUpperCase();
  const c = clientsByCode[code];
  const auto = c ? (c.raison_sociale || c.client_name || c.raison || "") : "";

  // Only write when we actually have a non-empty auto value
  if (auto) {
    const current = (getValues("xraison_0") || "").trim();
    if (current !== auto) {
      setValue("xraison_0", auto, { shouldValidate: false, shouldDirty: true });
    }
  }
}, [clientsByCode, watchedClient, setValue, getValues]);

    useEffect(() => {
      if (initialData) {
        console.log("DECONSIGNForm - initialData received:", initialData);

        // Initialize validation states - when editing existing data, assume valid
        setIsSiteValid(true);
        setIsClientValid(true);
        setIsMatriculeValid(true);

        // Reset form with all fields from initialData
        reset({
          xnum_0: initialData.xnum_0 || "",
          xsite_0: initialData.xsite_0 || "",
          xclient_0: initialData.xclient_0 || "",
          xraison_0: initialData.xraison_0 || "",
          xcamion_0: initialData.xcamion_0 || "",
          xvalsta_0: initialData.xvalsta_0?.toString() || "2",
          palette_ramene: initialData.palette_ramene || "",
          palette_a_deconsigner: initialData.palette_a_deconsigner || "",
          palette_deconsignees: initialData.palette_deconsignees || "",
        });

        // Update validation status
        setCurrentValidationStatus(initialData.xvalsta_0?.toString() || "1");

        // Set date and time from initialData
        if (initialData.xdate_0) {
          setCurrentDate(
            new Date(initialData.xdate_0).toLocaleDateString("fr-FR")
          );
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
        setIsMatriculeValid(true);
        setSiteHasBeenTouched(false);
        setClientHasBeenTouched(false);
        setPaletteRameneHasBeenTouched(false);
        setMatriculeHasBeenTouched(false);

        const now = new Date();
        setCurrentDate(now.toLocaleDateString("fr-FR"));
        setCurrentTime(
          now.toLocaleTimeString("fr-FR", {
            hour: "2-digit",
            minute: "2-digit",
          })
        );
      }
    }, [initialData, reset]);

    useEffect(() => {
  if (!initialData) return;
  const pre =
    initialData.xraison_0 ||
    initialData.customer?.raison_sociale ||
    "";
  if (pre) {
    setValue("xraison_0", pre, { shouldValidate: false, shouldDirty: true });
  }
}, [initialData, setValue]);

    // Separate useEffect to handle form reset after dropdown data is loaded
    useEffect(() => {
      if (
        initialData &&
        !isLoadingDropdowns &&
        sites.length > 0 &&
        clients.length > 0
      ) {
        // Re-reset form values to ensure dropdown selections work
        reset({
          xnum_0: initialData.xnum_0 || "",
          xsite_0: initialData.xsite_0 || "",
          xclient_0: initialData.xclient_0 || "",
          xraison_0: initialData.xraison_0 || "",
          xcamion_0: initialData.xcamion_0 || "",
          palette_ramene: initialData.palette_ramene || "",
          palette_a_deconsigner: initialData.palette_a_deconsigner || "",
          palette_deconsignees: initialData.palette_deconsignees || "",
          xvalsta_0: initialData.xvalsta_0?.toString() || "1",
        });
      }
    }, [initialData, isLoadingDropdowns, sites, clients, reset]);

    // Fetch dropdown data for sites and clients
    useEffect(() => {
      const fetchDropdownData = async () => {
        try {
          const [sitesResponse, clientsResponse] = await Promise.all([
            api.get("/sites"),
            api.get("/clients"),
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

    // Fetch trucks for XCAMION_0 dropdown
    useEffect(() => {
      const fetchTrucks = async () => {
        try {
          const response = await api.get("/xcamions");
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
        setIsLoadingSolde(false);
        return;
      }

      setIsLoadingSolde(true);
      setCurrentSolde(null);

      try {
        const response = await api.post("/consignations/solde", {
          codeClient,
          site,
        });

        console.log(`Response status: ${response.status}`);
        console.log(`Response data:`, response.data);

        if (response.data && response.data.success && response.data.data) {
          console.log(`Setting solde:`, response.data.data);
          setCurrentSolde(response.data.data);
        } else {
          console.log(`Invalid response format`);
          setCurrentSolde(null);
        }
      } catch (error) {
        console.error(`Fetch error:`, error);
        setCurrentSolde(null);
      } finally {
        setIsLoadingSolde(false);
      }
    };

    
    // Effect to fetch solde when client and site change
    useEffect(() => {
      if (watchedClient && watchedSite && !initialData) {
        console.log(`Fetching solde for: ${watchedClient}/${watchedSite}`);
        fetchSolde(watchedClient, watchedSite);
      } else if (!initialData) {
        setCurrentSolde(null);
        setIsLoadingSolde(false);
      }
    }, [watchedClient, watchedSite, initialData]);

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

      // Check Matricule (xcamion_0 - required field)
      const matriculeValue = currentValues.xcamion_0;
      const matriculeIsValid =
        matriculeValue !== "" &&
        matriculeValue.trim() !== "" &&
        isMatriculeValid;
      if (!matriculeIsValid) invalidFields.push("Matricule");

      // Check Palettes à déconsigner - use Yup validation results
      const paletteDeconsignerValue = currentValues.palette_a_deconsigner;
      const paletteDeconsignerHasError = errors.palette_a_deconsigner;
      const paletteDeconsignerIsValid =
        paletteDeconsignerValue !== "" &&
        !isNaN(parseFloat(paletteDeconsignerValue)) &&
        parseFloat(paletteDeconsignerValue) > 0 &&
        !paletteDeconsignerHasError;
      if (!paletteDeconsignerIsValid)
        invalidFields.push("Palettes à déconsigner");
      const deconsignees = parseFloat(currentValues.palette_deconsignees);
      const aDeconsigner = parseFloat(currentValues.palette_a_deconsigner);
      if (deconsignees > aDeconsigner) {
        invalidFields.push("Palettes déconsignées > autorisé");
      }

      // Check Palettes ramenées
      const paletteRameneValue = currentValues.palette_ramene;
      const paletteRameneIsValid =
        paletteRameneValue !== "" &&
        !isNaN(parseInt(paletteRameneValue)) &&
        parseInt(paletteRameneValue) >= 0 &&
        isPaletteRameneValid;
      if (!paletteRameneIsValid) invalidFields.push("Palettes ramenées");

      return {
        allValid: invalidFields.length === 0,
        invalidCount: invalidFields.length,
        invalidFields: invalidFields,
      };
    };

    // Helper function to check if form can be saved
    const canSaveForm = () => {
      // CAISSIER/CAISSIERE cannot save - only validate
      if (canOnlyValidate) {
        return false;
      }

      // In read-only mode, don't allow save
      if (isFormReadOnly && !canModifyPalettesDeconsignees) {
        return false;
      }

      // In edit mode, always allow if user has save permissions
      if (isEditMode && canSave) {
        return true;
      }

      // In create mode, check basic required fields based on role
      const currentValues = getValues();

      if (canModifyBasicFields) {
        // AGENT_ORDONNANCEMENT: needs basic fields
        const hasBasicFields =
          currentValues.xsite_0 &&
          currentValues.xclient_0 &&
          currentValues.palette_a_deconsigner &&
          parseFloat(currentValues.palette_a_deconsigner) > 0;

        return hasBasicFields;
      }

      if (canModifyPalettesDeconsignees) {
        // CHEF_PARC: can save if there's initial data (editing palettes_deconsignees)
        return !!initialData;
      }

      return false;
    };

    // Custom submit handler that prevents form submission on validation failure
    const handleFormSubmit = (e) => {
      e.preventDefault(); // Always prevent default form submission

      console.log("DECONSIGNForm handleFormSubmit called"); // Debug log
      console.log("Current errors:", errors); // Debug log
      console.log("Form values:", getValues()); // Debug the current form values

      // Check if form can be saved (validate all required fields)
      if (!canSaveForm()) {
        console.log("Form validation failed - canSaveForm returned false");
        alert(
          "Veuillez remplir tous les champs obligatoires (Site, Client, Palettes à déconsigner)"
        );
        return; // Stop execution
      }

      console.log("Validation passed, proceeding with submission"); // Debug log
      // If validation passes, proceed with actual form submission
      handleSubmit(onSubmitForm)(); // Call react-hook-form's handleSubmit manually
    };

    const onSubmitForm = async (formData) => {
      console.log("DECONSIGNForm onSubmitForm called"); // Debug log

      // Prevent submission in read-only mode
      if (isReadOnly) {
        alert(
          "Formulaire en lecture seule. Cliquez sur 'Modifier' pour éditer."
        );
        return;
      }

      // Prevent modification if the deconsignation is validated (XVALSTA_0 = 2)
      if (initialData?.xvalsta_0 === "2") {
        alert(
          "Modification interdite : cette déconsignation est déjà validée."
        );
        return;
      }

      let submissionData;
      try {
        // Get clean form values directly from form state to avoid circular references
        const currentFormValues = getValues();

        // Sanitize numeric values
        const paletteDeconsignerValue =
          parseFloat(currentFormValues.palette_a_deconsigner) || 0;
        const paletteRameneValue =
          parseFloat(currentFormValues.palette_ramene) || 0;
        const paletteDeconsigneValue =
          parseFloat(currentFormValues.palette_deconsignees) || 0;

        if (isEditMode) {
          // EDIT MODE: Only send editable fields, including xvalsta_0
          submissionData = {
            xcamion_0: String(currentFormValues.xcamion_0 || "").trim(),
            palette_ramene: paletteRameneValue,
            palette_a_deconsigner: paletteDeconsignerValue,
            palette_deconsignees: paletteDeconsigneValue,
            xvalsta_0: Number(
              currentFormValues.xvalsta_0 ?? initialData?.xvalsta_0 ?? 1
            ), // Ensure number
          };
        } else {
          // CREATE MODE: Send all fields
          submissionData = {
            xsite_0: String(currentFormValues.xsite_0 || "").trim(),
            xclient_0: String(currentFormValues.xclient_0 || "").trim(),
            xraison_0: String(currentFormValues.xraison_0 || "").trim(),
            xcamion_0: String(currentFormValues.xcamion_0 || "").trim(),
            xvalsta_0: Number(currentFormValues.xvalsta_0 || 1), // Ensure number, not string
            palette_ramene: paletteRameneValue,
            palette_a_deconsigner: paletteDeconsignerValue,
            palette_deconsignees: paletteDeconsigneValue,
          };
          console.log("Final submission data:", submissionData);
        }
        if (initialData && initialData.xnum_0) {
          // EDIT MODE: send PUT to update
          await api.put(
            `/deconsignations/${encodeURIComponent(initialData.xnum_0)}`,
            submissionData
          );
          alert("Déconsignation modifiée avec succès!");
        } else {
          // CREATE MODE: send POST to create (send xdate_0/xheure_0)
          console.log("Sending POST request with data:", {
            ...submissionData,
            xdate_0: currentDate,
            xheure_0: currentTime,
          });

          await api.post("/deconsignations", {
            ...submissionData,
            xdate_0: currentDate,
            xheure_0: currentTime,
          });
          alert("Déconsignation enregistrée avec succès!");
        }

        if (onSuccess) onSuccess();
        // Form is not reset after successful save - keep the entered data
      } catch (error) {
        console.error("Error details:", {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
          submittedData: submissionData,
        });
        // Erreur spécifique : palettes déconsignées > palettes à déconsigner
        if (
          error.response?.data?.error_type ===
          "palette_deconsignees_exceed_a_deconsigner"
        ) {
          const info = error.response.data.validation_info;
          const palettesDemandees = info.palette_a_deconsigner;
          const palettesSaisies = info.palette_deconsignees;

          alert(
            `❌ Erreur : Le nombre de palettes déconsignées (${palettesSaisies}) ne doit pas dépasser le nombre de palettes à déconsigner (${palettesDemandees}).\n\nVeuillez corriger votre saisie.`
          );
          return;
        }

        let errorMessage = "Erreur lors de l'enregistrement: ";

        if (error.response?.data?.errors) {
          // If we have validation errors
          errorMessage += Object.entries(error.response.data.errors)
            .map(([field, messages]) => `${field}: ${messages.join(", ")}`)
            .join("\n");
        } else if (error.response?.data?.message) {
          errorMessage += error.response.data.message;
          // Enhanced: show solde/validation info if available, styled like the screenshot
          const info =
            error.response.data.validation_info ||
            error.response.data.balance_info;
          if (info && typeof info === "object") {
            const available =
              info.available_to_deconsign ?? info.current_balance;
            if (available !== undefined) {
              errorMessage += `\n\nVotre solde validé est : ${Number(
                available
              ).toLocaleString("fr-FR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })} DH`;
            }
          }
        } else if (error.message) {
          errorMessage += error.message;
        }

        alert(errorMessage);
      }
    };

    // Handle validation button click - specifically for updating XVALSTA from 1 to 2
    const handleValidationClick = async (e) => {
      e.preventDefault(); // Prevent form submission

      console.log("Validation button clicked"); // Debug log

      // Prevent CHEF_PARC from validating
      if (userRole === "CHEF_PARC") {
        alert("Vous n'avez pas l'autorisation de valider les déconsignations.");
        return;
      }

      if (!initialData || !initialData.xnum_0) {
        alert("Veuillez sélectionner une déconsignation à valider.");
        return;
      }

      if (initialData?.xvalsta_0 === "2" || initialData?.xvalsta_0 === 2) {
        alert("Cette déconsignation est déjà validée.");
        return;
      }

      try {
        // Get current form values
        const currentValues = getValues();

        // Send PUT request with all current data including XVALSTA set to 2
        const validationData = {
          xcamion_0: currentValues.xcamion_0 || initialData.xcamion_0,
          palette_ramene:
            parseInt(
              currentValues.palette_ramene || initialData.palette_ramene
            ) || 0,
          palette_a_deconsigner:
            parseInt(
              currentValues.palette_a_deconsigner ||
                initialData.palette_a_deconsigner
            ) || 0,
          palette_deconsignees:
            parseInt(
              currentValues.palette_deconsignees ||
                initialData.palette_deconsignees
            ) || 0,
          xvalsta_0: 2, // Set validation to "Oui" as number
        };

        console.log("Sending validation data:", validationData); // Debug log

        await api.put(
          `/deconsignations/${encodeURIComponent(initialData.xnum_0)}`,
          validationData
        );

        console.log("Validation API call successful"); // Debug log

        alert("Déconsignation validée avec succès!");

        // Update the initialData to reflect the backend state (for validation checks)
        if (initialData) {
          initialData.xvalsta_0 = "2";
        }

        // Trigger parent refresh if callback exists
        if (onSuccess) onSuccess();
      } catch (error) {
        console.error("Error validating deconsignation:", error);

        let errorMessage = "Erreur lors de la validation: ";

        if (error.response?.data?.errors) {
          // If we have validation errors, show them
          const errorDetails = Object.entries(error.response.data.errors)
            .map(([field, messages]) => `${field}: ${messages.join(", ")}`)
            .join("\n");
          errorMessage += errorDetails;
        } else if (error.response?.data?.message) {
          errorMessage += error.response.data.message;
          // Enhanced: show solde/validation info if available
          const info =
            error.response.data.validation_info ||
            error.response.data.balance_info;
          if (info && typeof info === "object") {
            const available =
              info.available_to_deconsign ?? info.current_balance;
            const requested =
              info.palette_a_deconsigner ?? info.required_amount;
            const missing =
              requested && available !== undefined
                ? requested - available
                : undefined;
            errorMessage +=
              `\n\nSituation du solde:\n` +
              (available !== undefined
                ? `• Palettes disponibles à déconsigner: ${available}\n`
                : "") +
              (requested !== undefined
                ? `• Palettes demandées: ${requested}\n`
                : "") +
              (missing !== undefined && missing > 0
                ? `• Manque: ${missing}\n`
                : "");
          }
        } else if (error.message) {
          errorMessage += error.message;
        }

        alert(errorMessage);
      }
    };

    // Helper function to handle integer input (remove non-digits)
    const handleIntegerInput = (e) => e.target.value.replace(/[^\d]/g, "");

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
        (name === "xcamion_0" ||
          name === "palette_ramene" ||
          name === "palette_a_deconsigner" ||
          name === "palette_deconsignees")
      ) {
        className += " editable-field";
      }
      return className;
    };

    // Handle client selection to auto-populate raison sociale
    // Expose submit method to parent via ref
    useImperativeHandle(ref, () => () => {
      document
        .querySelector("form.sage-form")
        .dispatchEvent(
          new Event("submit", { cancelable: true, bubbles: true })
        );
    });

    return (
      <form
        onSubmit={handleFormSubmit}
        className={`sage-form ${
          isEditMode ? "edit-mode" : isReadOnly ? "view-mode" : "create-mode"
        }`}
      >
  <div className="form-scrollable" style={{minHeight: '60vh', overflowY: 'visible', paddingRight: 8}}>
          <div className="sage-form-header">
            <div className="sage-form-header-left">
              <FaArrowLeft className="sage-nav-arrow" />
              <FaArrowRight className="sage-nav-arrow" />
              <span className="sage-form-title">
                {isEditMode ? "Modification de Déconsignation" : "Déconsignation"}
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
                  (Seuls Matricule et Palettes modifiables)
                </span>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <button
                type="button"
                className="sage-validation-btn"
                onClick={handleValidationClick}
                style={
                  currentValidationStatus === "1" &&
                  canUserValidate &&
                  userRole !== "CHEF_PARC"
                    ? {
                        backgroundColor: "#0866ff",
                        color: "#fff",
                        cursor: "pointer",
                        opacity: 1,
                      }
                    : {
                        backgroundColor: "#d3d3d3", // Gray background
                        color: "#888", // Gray text
                        opacity: 0.6,
                        cursor: "not-allowed",
                      }
                }
                disabled={
                  currentValidationStatus === "2" ||
                  !canUserValidate ||
                  userRole === "CHEF_PARC"
                }
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
                    const isNonDigit = value.length > 0 && /[^0-9]/.test(value);
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

  <input
    type="text"
    {...register("xclient_0")}
    value={getValues("xclient_0")}
    onChange={(e) => {
      const v = e.target.value.trim().toUpperCase();
      setClientHasBeenTouched(true);
      setValue("xclient_0", v, { shouldValidate: true });

      if (!isEditMode && !isReadOnly) {
        if (v === "") {
          clearErrors("xclient_0"); // let Yup handle "required" on submit
        } else {
          const ok = !!clientsByCode[v];
          if (ok) clearErrors("xclient_0");
          else setError("xclient_0", { type: "manual", message: "Client introuvable" });
        }
      }
    }}
    onBlur={() => {
      setFocusField("");
      setClientHasBeenTouched(true);
      const v = (getValues("xclient_0") || "").trim().toUpperCase();
      if (!isEditMode && !isReadOnly && v !== "") {
        const ok = !!clientsByCode[v];
        if (ok) clearErrors("xclient_0");
        else setError("xclient_0", { type: "manual", message: "Client introuvable" });
      }
    }}
    onFocus={() => setFocusField("xclient_0")}
    autoComplete="off"
    disabled={isReadOnly || isEditMode}
    className={getInputClass("xclient_0")}
  />

  {errors.xclient_0 && (
    <span className="sage-input-error-text">{errors.xclient_0.message}</span>
  )}
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
                Transporteur externe ? <span className="sage-required">*</span>
              </label>
              <select
                value={isExternalTransporter ? "Oui" : "Non"}
                onChange={(e) => {
                  const isOui = e.target.value === "Oui";
                  setIsExternalTransporter(isOui);
                  // Always clear xcamion_0 when switching
                  setValue("xcamion_0", "", { shouldValidate: false });
                  // Reset matricule validation state when switching
                  setIsMatriculeValid(true);
                  setMatriculeHasBeenTouched(false);
                }}
                className="sage-input"
                disabled={isReadOnly || isEditMode || userRole === "CHEF_PARC"}
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
                      setIsMatriculeValid(value !== "" && value.trim() !== "");
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
                  disabled={isReadOnly || userRole === "CHEF_PARC"}
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
                      shouldValidate: false,
                    });

                    // Validate if the entered value matches any truck code
                    if (!isEditMode && !isReadOnly) {
                      if (selectedValue === "") {
                        setIsMatriculeValid(true); // Empty is not invalid, just not filled
                      } else {
                        const matchingTruck = trucks.find(
                          (truck) => truck.XMAT_0 === selectedValue
                        );
                        setIsMatriculeValid(matchingTruck !== undefined);
                      }
                    }
                  }}
                  disabled={
                    isReadOnly || isEditMode || userRole === "CHEF_PARC"
                  }
                  className={
                    "sage-input" +
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
                        setIsMatriculeValid(true); // Empty is not invalid, just not filled
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
                  noResultsText="Matricule introuvable"
                />
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
                  // Prevent AGENT_ORDONNANCEMENT from selecting "Oui" (value "2")
                  if (userRole === "AGENT_ORDONNANCEMENT" && newValue === "2") {
                    alert("Vous n'avez pas l'autorisation de valider directement. Utilisez le bouton 'Validation'.");
                    return;
                  }
                  setCurrentValidationStatus(newValue);
                  setValue("xvalsta_0", newValue, {
                    shouldValidate: true,
                  });
                }}
                disabled={isReadOnly || userRole === "CHEF_PARC"}
              >
                <option value="1">Non</option>
                {/* Only show "Oui" option if user is not AGENT_ORDONNANCEMENT */}
                {userRole !== "AGENT_ORDONNANCEMENT" && (
                  <option value="2">Oui</option>
                )}
              </select>
            </div>
          </div>
        </div>{" "}
        <div className="sage-section">
          <div className="sage-section-title">Lignes</div>
          <div className="sage-fields">
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
                autoComplete="off"
                disabled={
                  isFormReadOnly ||
                  (initialData && !isEditMode) ||
                  (!canModifyBasicFields && userRole !== "ADMIN")
                } // Role-based: AGENT_ORDONNANCEMENT can edit, others cannot
              />
            </div>
            <div className="sage-row">
              <label>
                Palettes à déconsigner <span className="sage-required">*</span>
              </label>
              <input
                type="text"
                {...register("palette_a_deconsigner")}
                className={getInputClass("palette_a_deconsigner")}
                onFocus={() => setFocusField("palette_a_deconsigner")}
                onBlur={() => {
                  setFocusField("");
                }}
                autoComplete="off"
                disabled={
                  isFormReadOnly ||
                  (initialData && !isEditMode) ||
                  (!canModifyBasicFields && userRole !== "ADMIN")
                } // Role-based: AGENT_ORDONNANCEMENT can edit, others cannot
              />
            </div>
            <div className="sage-row">
              <label>Palettes déconsignées (Conformes)</label>
              <input
                type="text"
                {...register("palette_deconsignees")}
                className={getInputClass("palette_deconsignees")}
                onFocus={() => setFocusField("palette_deconsignees")}
                onBlur={() => setFocusField("")}
                autoComplete="off"
                disabled={
                  canOnlyValidate ||
                  (!canModifyPalettesDeconsignees && userRole !== "ADMIN")
                } // Role-based: CHEF_PARC can always edit, CAISSIER/CAISSIERE cannot
              />
            </div>
          </div>
        </div> <br></br>  
        </div>
      </form>
    );
  }
);

export default DECONSIGNForm;

// Ajout CSS local pour le scroll si non déjà présent
// À placer dans le fichier CSS importé ou en style inline :
// .form-scrollable { max-height: 75vh; overflow-y: auto; padding-right: 8px; }

// Pour appliquer le scroll, entourez le contenu du formulaire par :
// <div className="form-scrollable"> ...formulaire... </div>