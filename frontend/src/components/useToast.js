import { useState, useCallback } from "react";

// Toast manager hook
export const useToast = () => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((toast) => {
    const id = Date.now() + Math.random();
    const newToast = {
      id,
      type: "info",
      duration: 5000, // 5 seconds default
      ...toast,
    };

    setToasts((prevToasts) => [...prevToasts, newToast]);
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  }, []);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  // Helper methods for different toast types
  const showSuccess = useCallback(
    (message, options = {}) => {
      return addToast({
        type: "success",
        message,
        title: options.title || "Succès",
        duration: options.duration || 4000,
        ...options,
      });
    },
    [addToast]
  );

  const showError = useCallback(
    (message, options = {}) => {
      return addToast({
        type: "error",
        message,
        title: options.title || "Erreur",
        duration: options.duration || 6000,
        ...options,
      });
    },
    [addToast]
  );

  const showWarning = useCallback(
    (message, options = {}) => {
      return addToast({
        type: "warning",
        message,
        title: options.title || "Attention",
        duration: options.duration || 5000,
        ...options,
      });
    },
    [addToast]
  );

  const showInfo = useCallback(
    (message, options = {}) => {
      return addToast({
        type: "info",
        message,
        title: options.title || "Information",
        duration: options.duration || 4000,
        ...options,
      });
    },
    [addToast]
  );

  return {
    toasts,
    addToast,
    removeToast,
    clearAllToasts,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };
};

export default useToast;
