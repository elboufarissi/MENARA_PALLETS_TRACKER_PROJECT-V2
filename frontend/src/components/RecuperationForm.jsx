import React, {
  useEffect,
  useState,
  forwardRef,
  useImperativeHandle,
} from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import axios from "axios";
import api from "../utils/api";
import { FaArrowLeft, FaArrowRight, FaSignOutAlt } from "react-icons/fa";
import AutocompleteInput from "./AutocompleteInput";
import "./CautionForm.css";

// Dynamic schema based on mode: create, view (read-only), or edit
const createValidationSchema = (isEditMode, isReadOnly) => {
  if (isReadOnly) {
    // Read-only mode: no validation needed
    return yup.object().shape({
      xnum_0: yup.string().nullable(),
      xsite_0: yup.string().nullable(),
      xclient_0: yup.string().nullable(),
      xraison_0: yup.string().nullable(),
      xcin_0: yup.string().nullable(),
      xvalsta_0: yup.string().nullable(),
      montant: yup.string().nullable(),
    });
  }

  const baseSchema = {
    xnum_0: yup.string().nullable(),
  };

  if (isEditMode) {
    // Edit mode: only validate editable fields (CIN and Montant)
    // More lenient CIN validation in edit mode to handle existing data
    baseSchema.xcin_0 = yup
      .string()
      .test("cin-format", "CIN invalide!", function (value) {
        if (!value) return false; // Still require CIN

        // Clean the value (trim and uppercase)
        const cleanValue = value.trim().toUpperCase();

        // Test against the regex
        const isValid = /^[A-Za-z]{1,2}\d{4,8}$/.test(cleanValue);

        // Log for debugging
        if (!isValid) {
          console.log("CIN validation failed:", {
            original: value,
            cleaned: cleanValue,
            length: cleanValue.length,
            regex_test: /^[A-Za-z]{1,2}\d{4,8}$/.test(cleanValue),
          });
        }

        return isValid;
      })
      .required("CIN obligatoire");
    baseSchema.montant = yup
      .number()
      .transform((value, originalValue) => {
        // Convert empty string to undefined to avoid NaN
        return originalValue === "" ? undefined : value;
      })
      .positive()
      .required();
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
    baseSchema.xcin_0 = yup
      .string()
      .matches(/^[A-Za-z]{1,2}\d{4,8}$/, "CIN invalide!")
      .required("CIN obligatoire");
    baseSchema.xvalsta_0 = yup.string().required("Validation obligatoire");
    baseSchema.montant = yup
      .number()
      .transform((value, originalValue) => {
        // Convert empty string to undefined to avoid NaN
        return originalValue === "" ? undefined : value;
      })
      .positive()
      .required();
  }

  return yup.object().shape(baseSchema);
};

// MODIFIED: Accept onSuccess, initialData, and isEditMode as props
const RecuperationForm = forwardRef(
  ({ onSuccess, initialData, isEditMode = false }, ref) => {
    const isReadOnly = initialData && !isEditMode; // Read-only when viewing existing data but not editing

    const {
      register,
      handleSubmit,
      reset,
      getValues,
      setValue,
      formState: { errors },
    } = useForm({
      resolver: yupResolver(createValidationSchema(isEditMode, isReadOnly)),
      defaultValues: {
        xvalsta_0: "1", // Default to 1 (Non)
        xnum_0: "",
        xsite_0: "",
        xclient_0: "",
        xraison_0: "",
        xcin_0: "",
        montant: "",
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
    const [isLoadingDropdowns, setIsLoadingDropdowns] = useState(true);
    const [siteInputError, setSiteInputError] = useState(false);

    // State for validation - track if all required fields have valid values
    const [isSiteValid, setIsSiteValid] = useState(true);
    const [isClientValid, setIsClientValid] = useState(true);
    const [isCinValid, setIsCinValid] = useState(true);
    const [isMontantValid, setIsMontantValid] = useState(true);

    // Track if user has interacted with fields (to show errors only after interaction)
    const [siteHasBeenTouched, setSiteHasBeenTouched] = useState(false);
    const [clientHasBeenTouched, setClientHasBeenTouched] = useState(false);
    const [cinHasBeenTouched, setCinHasBeenTouched] = useState(false);
    const [montantHasBeenTouched, setMontantHasBeenTouched] = useState(false);
    useEffect(() => {
      if (initialData) {
        // Update validation status
        setCurrentValidationStatus(initialData.xvalsta_0?.toString() || "1");

        // Initialize validation states - when editing existing data, assume valid
        setIsSiteValid(true);
        setIsClientValid(true);
        setIsCinValid(true);
        setIsMontantValid(true);

        // Clean the CIN value before setting it
        const cleanCin = initialData.xcin_0
          ? initialData.xcin_0.trim().toUpperCase()
          : "";

        // Reset form with all fields from initialData
        reset({
          xnum_0: initialData.xnum_0 || "",
          xsite_0: initialData.xsite_0 || "",
          xclient_0: initialData.xclient_0 || "",
          xraison_0: initialData.xraison_0 || "",
          xcin_0: cleanCin,
          xvalsta_0: initialData.xvalsta_0?.toString() || "2",
          montant: initialData.montant || "",
        });

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
        setIsCinValid(true);
        setIsMontantValid(true);
        setSiteHasBeenTouched(false);
        setClientHasBeenTouched(false);
        setCinHasBeenTouched(false);
        setMontantHasBeenTouched(false);

        const now = new Date();
        setCurrentDate(now.toLocaleDateString("fr-FR"));
        setCurrentTime(
          now.toLocaleTimeString("fr-FR", {
            hour: "2-digit",
            minute: "2-digit",
          })
        );
      }
    }, [initialData, reset]); // Remove sites and clients dependencies

    // Separate useEffect to handle form reset after dropdown data is loaded
    useEffect(() => {
      if (
        initialData &&
        !isLoadingDropdowns &&
        sites.length > 0 &&
        clients.length > 0
      ) {
        // Clean the CIN value before setting it
        const cleanCin = initialData.xcin_0
          ? initialData.xcin_0.trim().toUpperCase()
          : "";

        // Re-reset form values to ensure dropdown selections work
        reset({
          xnum_0: initialData.xnum_0 || "",
          xsite_0: initialData.xsite_0 || "",
          xclient_0: initialData.xclient_0 || "",
          xraison_0: initialData.xraison_0 || "",
          xcin_0: cleanCin,
          xvalsta_0: initialData.xvalsta_0?.toString() || "2",
          montant: initialData.montant || "",
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

      // Check CIN
      const cinValue = currentValues.xcin_0?.trim().toUpperCase() || "";
      const cinIsValid =
        cinValue !== "" &&
        /^[A-Za-z]{1,2}\d{4,8}$/.test(cinValue) &&
        isCinValid;
      if (!cinIsValid) invalidFields.push("CIN");

      // Check Montant
      const montantValue = currentValues.montant;
      const montantIsValid =
        montantValue !== "" &&
        !isNaN(parseInt(montantValue)) &&
        parseInt(montantValue) > 0 &&
        isMontantValid;
      if (!montantIsValid) invalidFields.push("Montant");

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

    const onSubmitForm = async (formData) => {
      console.log("onSubmitForm called with:", formData); // Debug log
      console.log("Current errors:", errors); // Debug log

      // Check if form can be saved (validate all required fields)
      if (!canSaveForm()) {
        const validation = validateAllRequiredFields();

        if (validation.invalidCount >= 2) {
          alert("Les données sont incorrectes.");
        } else if (validation.invalidFields.includes("Site")) {
          alert("Site invalide ! Veuillez sélectionner un site valide.");
        } else if (validation.invalidFields.includes("Client")) {
          alert("Client invalide ! Veuillez sélectionner un client valide.");
        } else if (validation.invalidFields.includes("CIN")) {
          alert("CIN Invalide!!");
        } else if (validation.invalidFields.includes("Montant")) {
          alert("Montant invalide ! Veuillez saisir un montant valide.");
        }
        return;
      }

      // Prevent submission in read-only mode
      if (isReadOnly) {
        alert(
          "Formulaire en lecture seule. Cliquez sur 'Modifier' pour éditer."
        );
        return;
      }

      // Prevent modification if the recuperation is validated (XVALSTA_0 = 2)
      if (initialData?.xvalsta_0 === "2") {
        alert("Modification interdite : cette récupération est déjà validée.");
        return;
      }

      // Check for CIN validation error specifically
      if (errors.xcin_0) {
        console.log("CIN error found in form errors"); // Debug log
        alert("CIN Invalide!!");
        return;
      }

      // Additional CIN validation check at submission time
      const currentCinValue = formData.xcin_0?.trim().toUpperCase() || "";
      console.log("Current CIN value for validation:", currentCinValue); // Debug log

      if (!currentCinValue || !/^[A-Za-z]{1,2}\d{4,8}$/.test(currentCinValue)) {
        console.log("CIN validation failed in manual check"); // Debug log
        alert("CIN Invalide!!");
        return;
      }

      let submissionData;
      try {
        const montantValue = parseInt(formData.montant) || 0;

        if (isEditMode) {
          // EDIT MODE: Send CIN, Montant, and xvalsta_0
          submissionData = {
            xcin_0: formData.xcin_0?.trim().toUpperCase() || "", // Clean and uppercase CIN
            montant: montantValue,
            xvalsta_0: Number(
              formData.xvalsta_0 ?? initialData?.xvalsta_0 ?? 1
            ), // Ensure number
          };
        } else {
          // CREATE MODE: Send all fields
          // Get current form values to ensure we have the latest data
          const currentFormValues = getValues();

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
            xcin_0: (
              (currentFormValues.xcin_0 &&
              typeof currentFormValues.xcin_0 === "string"
                ? currentFormValues.xcin_0
                : "") ||
              (formData.xcin_0 && typeof formData.xcin_0 === "string"
                ? formData.xcin_0
                : "")
            )
              .trim()
              .toUpperCase(),
            xvalsta_0: currentFormValues.xvalsta_0 || formData.xvalsta_0 || "2",
            montant: montantValue,
          };
        }
        if (initialData && initialData.xnum_0) {
          // EDIT MODE: send PUT to update
          await api.put(
            `/restitutions/${encodeURIComponent(initialData.xnum_0)}`,
            submissionData
          );
          alert("Récupération modifiée avec succès!");
        } else {
          // CREATE MODE: send POST to create (send xdate_0/xheure_0)
          await api.post("/restitutions", {
            ...submissionData,
            xdate_0: currentDate,
            xheure_0: currentTime,
          });
          alert("Récupération enregistrée avec succès!");
        }

        if (onSuccess) onSuccess();
        reset({
          xvalsta_0: "2",
          xnum_0: "",
          xsite_0: "",
          xclient_0: "",
          xraison_0: "",
          xcin_0: "",
          montant: "",
        });
      } catch (error) {
        console.error("Error details:", {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
          submittedData: submissionData, // Log the data that was attempted to be submitted
        });

        let errorMessage = "Erreur lors de l'enregistrement: ";

        if (error.response?.data?.errors) {
          // If we have validation errors
          errorMessage += Object.entries(error.response.data.errors)
            .map(([field, messages]) => `${field}: ${messages.join(", ")}`)
            .join("\n");
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
        alert("Veuillez sélectionner une récupération à valider.");
        return;
      }

      if (initialData?.xvalsta_0 === "2" || initialData?.xvalsta_0 === 2) {
        alert("Cette récupération est déjà validée.");
        return;
      }

      // Check for CIN validation error specifically
      if (errors.xcin_0) {
        console.log("CIN validation failed, showing alert"); // Debug log
        alert("CIN Invalide!!");
        return;
      }

      // Additional CIN validation check at submission time
      const currentValues = getValues();
      console.log("Current form values before validation:", currentValues); // Debug log
      const currentCinValue = currentValues.xcin_0?.trim().toUpperCase() || "";
      if (!currentCinValue || !/^[A-Za-z]{1,2}\d{4,8}$/.test(currentCinValue)) {
        alert("CIN Invalide!!");
        return;
      }

      try {
        // Send PUT request with all current data including XVALSTA set to 2
        const validationData = {
          xcin_0: currentValues.xcin_0 || initialData.xcin_0,
          montant: parseInt(currentValues.montant || initialData.montant),
          xvalsta_0: 2, // Set validation to "Oui" as number
        };

        console.log("Sending validation data:", validationData); // Debug log

        await api.put(
          `/restitutions/${encodeURIComponent(initialData.xnum_0)}`,
          validationData
        );

        console.log("Validation API call successful"); // Debug log

        alert("Récupération validée avec succès!");

        // Update the initialData to reflect the backend state (for validation checks)
        if (initialData) {
          initialData.xvalsta_0 = "2";
        }

        // Trigger parent refresh if callback exists
        if (onSuccess) onSuccess();
      } catch (error) {
        console.error("Error validating recuperation:", error);

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

    // Helper for focus border and edit mode styling
    const getInputClass = (name) => {
      let className = `sage-input ${
        focusField === name ? "sage-input-focus" : ""
      }`;
      if (isEditMode && (name === "xcin_0" || name === "montant")) {
        className += " editable-field";
      }
      // Add error styling if field has validation errors
      if (errors[name]) {
        className += " sage-input-error";
      }
      return className;
    };

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
        onSubmit={(e) => {
          console.log("Form submit event triggered"); // Debug log

          // Check if form can be saved (validate all required fields) - only in create mode
          if (!canSaveForm()) {
            e.preventDefault();
            const validation = validateAllRequiredFields();

            if (validation.invalidCount >= 2) {
              alert("Les données sont incorrectes.");
            } else if (validation.invalidFields.includes("Site")) {
              alert("Site invalide ! Veuillez sélectionner un site valide.");
            } else if (validation.invalidFields.includes("Client")) {
              alert(
                "Client invalide ! Veuillez sélectionner un client valide."
              );
            } else if (validation.invalidFields.includes("CIN")) {
              alert("CIN Invalide!!");
            } else if (validation.invalidFields.includes("Montant")) {
              alert("Montant invalide ! Veuillez saisir un montant valide.");
            }
            return false;
          }

          // Get current form values before validation
          const currentValues = getValues();
          console.log("Current form values:", currentValues); // Debug log

          // Check CIN manually before letting React Hook Form handle it
          const currentCinValue =
            currentValues.xcin_0?.trim().toUpperCase() || "";
          console.log("Manual CIN check:", currentCinValue); // Debug log

          if (
            !currentCinValue ||
            !/^[A-Za-z]{1,2}\d{4,8}$/.test(currentCinValue)
          ) {
            e.preventDefault(); // Prevent form submission
            console.log("CIN validation failed, showing alert"); // Debug log
            alert("CIN Invalide!!");
            return false;
          }

          // If CIN is valid, proceed with normal form submission
          return handleSubmit(onSubmitForm)(e);
        }}
        className={`sage-form ${
          isEditMode ? "edit-mode" : isReadOnly ? "view-mode" : "create-mode"
        }`}
        style={{
          position: "relative",
          height: "100%",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div className="sage-form-header">
          <div className="sage-form-header-left">
            <FaArrowLeft className="sage-nav-arrow" />
            <FaArrowRight className="sage-nav-arrow" />
            <span className="sage-form-title">
              {isEditMode
                ? "Modification de Récupération"
                : "Récupération de Caution"}
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
                (Seuls CIN et Montant modifiables)
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
              <label>Récupération</label>
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

                    setValue("xsite_0", numericValue, { shouldValidate: true });
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
              <AutocompleteInput
                options={clients.map((client) => ({
                  id: client.id?.toString() || "",
                  code: client.client_code || "",
                  name: client.client_name || client.raison_sociale || "",
                  // Store the original client data for auto-fill
                  originalClient: client,
                }))}
                value={getValues("xclient_0")}
                onChange={(e) => {
                  const selectedValue = e.target.value;
                  setClientHasBeenTouched(true);
                  setValue("xclient_0", selectedValue, {
                    shouldValidate: true,
                  });
                  // Validate if the entered value matches any client code
                  if (selectedValue === "") {
                    setIsClientValid(true); // Empty is not invalid, just not filled
                  } else {
                    const matchingClient = clients.find(
                      (client) => client.client_code === selectedValue
                    );
                    setIsClientValid(matchingClient !== undefined);
                  }
                  // Auto-populate raison sociale when client is selected (only in create mode)
                  if (!initialData) {
                    const selectedClient = clients.find(
                      (client) => client.client_code === selectedValue
                    );
                    if (selectedClient) {
                      setValue(
                        "xraison_0",
                        selectedClient.raison_sociale ||
                          selectedClient.client_name ||
                          ""
                      );
                      // Fetch CIN from backend using recuperation endpoint
                      api
                        .get(`/recuperation/cin-by-client/${selectedValue}`)
                        .then((res) => {
                          setValue("xcin_0", res.data.xcin_0 || "", {
                            shouldValidate: true,
                          });
                        })
                        .catch((error) => {
                          console.log(
                            "CIN not found for client:",
                            selectedValue
                          );
                          setValue("xcin_0", "", { shouldValidate: true });
                        });
                    } else {
                      setValue("xraison_0", "");
                      setValue("xcin_0", "", { shouldValidate: true });
                    }
                  }
                }}
                onSelect={(selectedOption) => {
                  setClientHasBeenTouched(true);
                  if (selectedOption && selectedOption.code) {
                    setValue("xclient_0", selectedOption.code, {
                      shouldValidate: true,
                    });
                    setIsClientValid(true);
                    setSiteInputError(false);
                    // Auto-populate raison sociale and fetch CIN
                    const selectedClient = clients.find(
                      (client) => client.client_code === selectedOption.code
                    );
                    if (selectedClient) {
                      setValue(
                        "xraison_0",
                        selectedClient.raison_sociale ||
                          selectedClient.client_name ||
                          ""
                      );
                      // Fetch CIN from backend using recuperation endpoint
                      api
                        .get(
                          `/recuperation/cin-by-client/${selectedOption.code}`
                        )
                        .then((res) => {
                          setValue("xcin_0", res.data.xcin_0 || "", {
                            shouldValidate: true,
                          });
                        })
                        .catch((error) => {
                          console.log(
                            "CIN not found for client:",
                            selectedOption.code
                          );
                          setValue("xcin_0", "", { shouldValidate: true });
                        });
                    } else {
                      setValue("xraison_0", "");
                      setValue("xcin_0", "", { shouldValidate: true });
                    }
                  }
                }}
                disabled={initialData || isLoadingDropdowns}
                className={
                  getInputClass("xclient_0") +
                  (clientHasBeenTouched &&
                  !isClientValid &&
                  !isEditMode &&
                  !isReadOnly
                    ? " sage-input-error"
                    : "")
                }
                onFocus={() => setFocusField("xclient_0")}
                onBlur={() => {
                  setFocusField("");
                  setClientHasBeenTouched(true);

                  // Validate client when field loses focus
                  const currentClientValue = getValues("xclient_0");
                  if (!isEditMode && !isReadOnly) {
                    if (currentClientValue === "") {
                      setIsClientValid(true); // Empty is not invalid, just not filled
                    } else {
                      const matchingClient = clients.find(
                        (client) => client.client_code === currentClientValue
                      );
                      setIsClientValid(matchingClient !== undefined);
                    }
                  }
                }}
                register={register("xclient_0")}
                searchKeys={["code", "name"]}
                displayKeys={["code", "name"]}
                primaryKey="code"
                noResultsText="Client introuvable"
              />
            </div>
            <div className="sage-row">
              <label>Raison sociale</label>
              <input
                type="text"
                {...register("xraison_0")}
                className={getInputClass("xraison_0")}
                onFocus={() => setFocusField("xraison_0")}
                onBlur={() => setFocusField("")}
                autoComplete="off"
                disabled={initialData} // Always disabled when viewing/editing existing data
              />
            </div>
            <div className="sage-row">
              <label>
                CIN <span className="sage-required">*</span>
              </label>
              <input
                type="text"
                {...register("xcin_0")}
                maxLength={10}
                className={
                  getInputClass("xcin_0") +
                  (cinHasBeenTouched &&
                  !isCinValid &&
                  !isEditMode &&
                  !isReadOnly
                    ? " sage-input-error"
                    : "")
                }
                onFocus={() => setFocusField("xcin_0")}
                onBlur={() => {
                  setFocusField("");
                  setCinHasBeenTouched(true);

                  // Validate CIN when field loses focus
                  const currentCinValue =
                    getValues("xcin_0")?.trim().toUpperCase() || "";
                  if (!isEditMode && !isReadOnly) {
                    if (currentCinValue === "") {
                      setIsCinValid(true); // Empty is not invalid, just not filled
                    } else {
                      const isValid = /^[A-Za-z]{1,2}\d{4,8}$/.test(
                        currentCinValue
                      );
                      setIsCinValid(isValid);
                    }
                  }
                }}
                onChange={() => {}}
                autoComplete="off"
                disabled={isReadOnly} // Only disabled in read-only mode
              />
            </div>{" "}
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
                  setValue("xvalsta_0", newValue, { shouldValidate: true });
                }}
                disabled={isReadOnly}
              >
                <option value="1">Non</option>
                <option value="2">Oui</option>
              </select>
            </div>
          </div>
        </div>
        <div className="sage-section">
          <div className="sage-section-title">Lignes</div>
          <div className="sage-fields">
            <div className="sage-row">
              <label>
                Montant <span className="sage-required">*</span>
              </label>
              <input
                type="text"
                {...register("montant")}
                className={
                  getInputClass("montant") +
                  (montantHasBeenTouched &&
                  !isMontantValid &&
                  !isEditMode &&
                  !isReadOnly
                    ? " sage-input-error"
                    : "")
                }
                onFocus={() => setFocusField("montant")}
                onBlur={() => {
                  setFocusField("");
                  setMontantHasBeenTouched(true);

                  // Validate Montant when field loses focus
                  const currentMontantValue = getValues("montant");
                  if (!isEditMode && !isReadOnly) {
                    if (currentMontantValue === "") {
                      setIsMontantValid(true); // Empty is not invalid, just not filled
                    } else {
                      const numericValue = parseInt(currentMontantValue);
                      const isValid = !isNaN(numericValue) && numericValue > 0;
                      setIsMontantValid(isValid);
                    }
                  }
                }}
                onChange={(e) => {
                  // Only allow integers (digits only)
                  const value = e.target.value.replace(/[^0-9]/g, "");
                  e.target.value = value;
                  setMontantHasBeenTouched(true);

                  setValue("montant", value, { shouldValidate: true });

                  // Validate Montant in real-time if not in edit mode
                  if (!isEditMode && !isReadOnly) {
                    if (value === "") {
                      setIsMontantValid(true); // Empty is not invalid, just not filled
                    } else {
                      const numericValue = parseInt(value);
                      const isValid = !isNaN(numericValue) && numericValue > 0;
                      setIsMontantValid(isValid);
                    }
                  }
                }}
                autoComplete="off"
                disabled={initialData && !isEditMode} // Editable in edit mode
              />
            </div>
          </div>
        </div>
      </form>
    );
  }
);

export default RecuperationForm;
