import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import api from "../utils/api";
import "./UserForm.css";

// Validation schema
const validationSchema = yup.object().shape({
  prenom: yup
    .string()
    .required("Prénom obligatoire")
    .min(2, "Prénom trop court"),
  nom: yup.string().required("Nom obligatoire").min(2, "Nom trop court"),
  role: yup.string().required("Rôle obligatoire"),
  password: yup
    .string()
    .required("Mot de passe obligatoire")
    .min(6, "Le mot de passe doit contenir au moins 6 caractères"),
  confirmPassword: yup
    .string()
    .required("Confirmation du mot de passe obligatoire")
    .oneOf([yup.ref("password")], "Les mots de passe ne correspondent pas"),
});

const editValidationSchema = yup.object().shape({
  prenom: yup
    .string()
    .required("Prénom obligatoire")
    .min(2, "Prénom trop court"),
  nom: yup.string().required("Nom obligatoire").min(2, "Nom trop court"),
  role: yup.string().required("Rôle obligatoire"),
  password: yup
    .string()
    .min(6, "Le mot de passe doit contenir au moins 6 caractères"),
  confirmPassword: yup
    .string()
    .test(
      "passwords-match",
      "Les mots de passe ne correspondent pas",
      function (value) {
        const { password } = this.parent;
        if (password && value && password !== value) {
          return false;
        }
        return true;
      }
    ),
});

const UserForm = ({ onSuccess, initialData, isEditMode, onClear }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedUsername, setGeneratedUsername] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = useForm({
    resolver: yupResolver(isEditMode ? editValidationSchema : validationSchema),
    defaultValues: {
      prenom: "",
      nom: "",
      role: "",
      password: "",
      confirmPassword: "",
    },
  });

  const watchedPrenom = watch("prenom");
  const watchedNom = watch("nom");

  // Generate username automatically based on prenom and nom
  useEffect(() => {
    if (watchedPrenom && watchedNom && !isEditMode) {
      // Remove accents and special characters, convert to lowercase
      const cleanPrenom = watchedPrenom
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z]/g, "");
      const cleanNom = watchedNom
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z]/g, "");

      const username = `${cleanPrenom.charAt(0)}${cleanNom}`;
      setGeneratedUsername(username);
    }
  }, [watchedPrenom, watchedNom, isEditMode]);

  // Load initial data when in edit mode
  useEffect(() => {
    if (isEditMode && initialData) {
      // Parse full name to get prenom and nom
      const fullName = initialData.FULL_NAME || "";
      const names = fullName.split(" ");
      const prenom = names[0] || "";
      const nom = names.slice(1).join(" ") || "";

      reset({
        prenom: prenom,
        nom: nom,
        role: initialData.ROLE || "",
        password: "",
        confirmPassword: "",
      });
      setGeneratedUsername(initialData.USERNAME || "");
    } else if (!isEditMode) {
      reset({
        prenom: "",
        nom: "",
        role: "",
        password: "",
        confirmPassword: "",
      });
      setGeneratedUsername("");
    }
  }, [initialData, isEditMode, reset]);

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const submitData = {
        FULL_NAME: `${data.prenom.trim()} ${data.nom.trim()}`,
        ROLE: data.role.trim().toUpperCase(),
        USERNAME: isEditMode ? initialData.USERNAME : generatedUsername,
      };

      // Only include password if it's provided
      if (data.password) {
        submitData.password = data.password;
      }
      console.log("Submitting user:", submitData); // Debug log

      if (isEditMode && initialData?.USER_ID) {
        await api.put(`/users/${initialData.USER_ID}`, submitData);
        alert("Utilisateur modifié avec succès!");
      } else {
        submitData.password = data.password; // Always required for new users
        await api.post("/users", submitData);
        alert("Utilisateur créé avec succès!");
      }

      if (onSuccess) onSuccess();

      if (!isEditMode) {
        reset();
        setGeneratedUsername("");
      }
    } catch (error) {
      console.error("Error submitting user:", error);
      let errorMessage = "Erreur lors de l'enregistrement: ";

      if (error.response?.data?.errors) {
        errorMessage += Object.entries(error.response.data.errors)
          .map(([field, messages]) => `${field}: ${messages.join(", ")}`)
          .join("\n");
      } else if (error.response?.data?.message) {
        errorMessage += error.response.data.message;
      } else {
        errorMessage += error.message;
      }

      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClear = () => {
    reset();
    setGeneratedUsername("");
    if (onClear) onClear();
  };

  const roles = [
    { value: "ADMIN", label: "Administrateur" },
    { value: "CAISSIERE", label: "Caissière" },
    { value: "CAISSIER", label: "Caissier" },
    { value: "AGENT_ORDONNANCEMENT", label: "Agent d'Ordonnancement" },
    { value: "CHEF_PARC", label: "Chef de Parc" },
  ];

  return (
    <div className="user-form-container">
      <form onSubmit={handleSubmit(onSubmit)} className="user-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="prenom" className="form-label">
                Prénom <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                id="prenom"
                className={`form-control ${errors.prenom ? "is-invalid" : ""}`}
                {...register("prenom")}
                disabled={isSubmitting}
              />
              {errors.prenom && (
                <div className="invalid-feedback">{errors.prenom.message}</div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="nom" className="form-label">
                Nom <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                id="nom"
                className={`form-control ${errors.nom ? "is-invalid" : ""}`}
                {...register("nom")}
                disabled={isSubmitting}
              />
              {errors.nom && (
                <div className="invalid-feedback">{errors.nom.message}</div>
              )}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="username" className="form-label">
              Nom d'utilisateur
            </label>
            <input
              type="text"
              id="username"
              className="form-control"
              value={generatedUsername}
              disabled
              readOnly
            />
            <small className="form-text text-muted">
              {isEditMode
                ? "Le nom d'utilisateur ne peut pas être modifié"
                : "Généré automatiquement à partir du prénom et nom"}
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="role" className="form-label">
              Rôle <span className="text-danger">*</span>
            </label>
            <select
              id="role"
              className={`form-control ${errors.role ? "is-invalid" : ""}`}
              {...register("role")}
              disabled={isSubmitting}
            >
              <option value="">Sélectionner un rôle</option>
              {roles.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
            {errors.role && (
              <div className="invalid-feedback">{errors.role.message}</div>
            )}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Mot de passe{" "}
                {!isEditMode && <span className="text-danger">*</span>}
              </label>
              <input
                type="password"
                id="password"
                className={`form-control ${errors.password ? "is-invalid" : ""}`}
                {...register("password")}
                disabled={isSubmitting}
                placeholder={isEditMode ? "Laisser vide pour ne pas changer" : ""}
              />
              {errors.password && (
                <div className="invalid-feedback">{errors.password.message}</div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword" className="form-label">
                Confirmer le mot de passe{" "}
                {!isEditMode && <span className="text-danger">*</span>}
              </label>
              <input
                type="password"
                id="confirmPassword"
                className={`form-control ${
                  errors.confirmPassword ? "is-invalid" : ""
                }`}
                {...register("confirmPassword")}
                disabled={isSubmitting}
                placeholder={isEditMode ? "Laisser vide pour ne pas changer" : ""}
              />
              {errors.confirmPassword && (
                <div className="invalid-feedback">
                  {errors.confirmPassword.message}
                </div>
              )}
            </div>
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? "Enregistrement..."
                : isEditMode
                ? "Modifier"
                : "Créer"}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleClear}
              disabled={isSubmitting}
            >
              {isEditMode ? "Annuler" : "Vider"}
            </button>
          </div>

        </form>
      </div>
  );
};

export default UserForm;
