import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import api from "../utils/api";
import { FaEye, FaEyeSlash, FaTimes } from "react-icons/fa";
import "./ChangePasswordModal.css";

// Validation schema
const validationSchema = yup.object().shape({
  current_password: yup.string().required("Mot de passe actuel obligatoire"),
  new_password: yup
    .string()
    .required("Nouveau mot de passe obligatoire")
    .min(6, "Le mot de passe doit contenir au moins 6 caractères"),
  new_password_confirmation: yup
    .string()
    .required("Confirmation du mot de passe obligatoire")
    .oneOf([yup.ref("new_password")], "Les mots de passe ne correspondent pas"),
});

const ChangePasswordModal = ({ isOpen, onClose, onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    setError,
  } = useForm({
    resolver: yupResolver(validationSchema),
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      await api.post("/auth/change-password", data);

      // Show success message
      alert(
        "Mot de passe changé avec succès! Vous devrez vous reconnecter lors de votre prochaine session."
      );

      reset();
      onSuccess();
      onClose();
    } catch (error) {
      if (error.response?.data?.errors) {
        // Handle validation errors
        Object.keys(error.response.data.errors).forEach((key) => {
          setError(key, {
            type: "manual",
            message: error.response.data.errors[key][0],
          });
        });
      } else if (error.response?.data?.message) {
        // Handle specific error messages like "Current password is incorrect"
        if (error.response.data.message.includes("Current password")) {
          setError("current_password", {
            type: "manual",
            message: error.response.data.message,
          });
        } else {
          alert(error.response.data.message);
        }
      } else {
        alert("Erreur lors du changement de mot de passe. Veuillez réessayer.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
      }}
      onClick={handleClose}
    >
      <div
        style={{
          backgroundColor: "#252D4B",
          borderRadius: "12px",
          padding: "32px",
          width: "90%",
          maxWidth: "500px",
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.3)",
          position: "relative",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "24px",
            borderBottom: "2px solid #404962",
            paddingBottom: "16px",
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: "24px",
              fontWeight: "600",
              color: "#fff",
            }}
          >
            Changer le mot de passe
          </h2>
          <button
            onClick={handleClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "20px",
              color: "#bbb",
              cursor: "pointer",
              padding: "8px",
              borderRadius: "50%",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.1)";
              e.currentTarget.style.color = "#fff";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = "#bbb";
            }}
          >
            <FaTimes />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Current Password */}
          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontSize: "14px",
                fontWeight: "600",
                color: "#fff",
              }}
            >
              Mot de passe actuel *
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showCurrentPassword ? "text" : "password"}
                {...register("current_password")}
                style={{
                  width: "100%",
                  padding: "12px 40px 12px 12px",
                  border: errors.current_password
                    ? "2px solid #ff6b6b"
                    : "2px solid #404962",
                  borderRadius: "8px",
                  fontSize: "16px",
                  outline: "none",
                  transition: "border-color 0.2s ease",
                  boxSizing: "border-box",
                  backgroundColor: "#353d56",
                  color: "#fff",
                }}
                onFocus={(e) => {
                  if (!errors.current_password) {
                    e.currentTarget.style.borderColor = "#6c7adb";
                  }
                }}
                onBlur={(e) => {
                  if (!errors.current_password) {
                    e.currentTarget.style.borderColor = "#404962";
                  }
                }}
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#bbb",
                  fontSize: "16px",
                }}
              >
                {showCurrentPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            {errors.current_password && (
              <span
                style={{
                  color: "#ff6b6b",
                  fontSize: "12px",
                  marginTop: "4px",
                  display: "block",
                }}
              >
                {errors.current_password.message}
              </span>
            )}
          </div>

          {/* New Password */}
          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontSize: "14px",
                fontWeight: "600",
                color: "#fff",
              }}
            >
              Nouveau mot de passe *
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showNewPassword ? "text" : "password"}
                {...register("new_password")}
                style={{
                  width: "100%",
                  padding: "12px 40px 12px 12px",
                  border: errors.new_password
                    ? "2px solid #ff6b6b"
                    : "2px solid #404962",
                  borderRadius: "8px",
                  fontSize: "16px",
                  outline: "none",
                  transition: "border-color 0.2s ease",
                  boxSizing: "border-box",
                  backgroundColor: "#353d56",
                  color: "#fff",
                }}
                onFocus={(e) => {
                  if (!errors.new_password) {
                    e.currentTarget.style.borderColor = "#6c7adb";
                  }
                }}
                onBlur={(e) => {
                  if (!errors.new_password) {
                    e.currentTarget.style.borderColor = "#404962";
                  }
                }}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#bbb",
                  fontSize: "16px",
                }}
              >
                {showNewPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            <div
              style={{
                fontSize: "12px",
                color: "#bbb",
                marginTop: "4px",
                marginBottom: "4px",
              }}
            >
              Le mot de passe doit contenir au moins 6 caractères
            </div>
            {errors.new_password && (
              <span
                style={{
                  color: "#ff6b6b",
                  fontSize: "12px",
                  marginTop: "4px",
                  display: "block",
                }}
              >
                {errors.new_password.message}
              </span>
            )}
          </div>

          {/* Confirm New Password */}
          <div style={{ marginBottom: "24px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontSize: "14px",
                fontWeight: "600",
                color: "#fff",
              }}
            >
              Confirmer le nouveau mot de passe *
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showConfirmPassword ? "text" : "password"}
                {...register("new_password_confirmation")}
                style={{
                  width: "100%",
                  padding: "12px 40px 12px 12px",
                  border: errors.new_password_confirmation
                    ? "2px solid #ff6b6b"
                    : "2px solid #404962",
                  borderRadius: "8px",
                  fontSize: "16px",
                  outline: "none",
                  transition: "border-color 0.2s ease",
                  boxSizing: "border-box",
                  backgroundColor: "#353d56",
                  color: "#fff",
                }}
                onFocus={(e) => {
                  if (!errors.new_password_confirmation) {
                    e.currentTarget.style.borderColor = "#6c7adb";
                  }
                }}
                onBlur={(e) => {
                  if (!errors.new_password_confirmation) {
                    e.currentTarget.style.borderColor = "#404962";
                  }
                }}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#bbb",
                  fontSize: "16px",
                }}
              >
                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            {errors.new_password_confirmation && (
              <span
                style={{
                  color: "#ff6b6b",
                  fontSize: "12px",
                  marginTop: "4px",
                  display: "block",
                }}
              >
                {errors.new_password_confirmation.message}
              </span>
            )}
          </div>

          {/* Buttons */}
          <div
            style={{
              display: "flex",
              gap: "12px",
              justifyContent: "flex-end",
            }}
          >
            <button
              type="button"
              onClick={handleClose}
              style={{
                padding: "12px 24px",
                border: "2px solid #6c7adb",
                borderRadius: "8px",
                backgroundColor: "transparent",
                color: "#6c7adb",
                fontSize: "16px",
                fontWeight: "600",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#8a96e6";
                e.currentTarget.style.color = "#8a96e6";
                e.currentTarget.style.backgroundColor =
                  "rgba(108, 122, 219, 0.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#6c7adb";
                e.currentTarget.style.color = "#6c7adb";
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isLoading}
              style={{
                padding: "12px 24px",
                border: "none",
                borderRadius: "8px",
                backgroundColor: isLoading ? "#4a5568" : "#6c7adb",
                color: "#fff",
                fontSize: "16px",
                fontWeight: "600",
                cursor: isLoading ? "not-allowed" : "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.backgroundColor = "#5a69c7";
                }
              }}
              onMouseLeave={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.backgroundColor = "#6c7adb";
                }
              }}
            >
              {isLoading ? "Changement..." : "Changer le mot de passe"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePasswordModal;
