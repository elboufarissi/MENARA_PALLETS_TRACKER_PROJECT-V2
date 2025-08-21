import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../utils/api";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      setUser(JSON.parse(stored));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    } else {
      localStorage.removeItem("user");
    }
  }, [user]);

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
    navigate("/login");
  };

  const login = async (username, password) => {
    const response = await api.post("/auth/login", { username, password });
    let user = response.data.user || response.data;
    // Don't normalize role - keep it as uppercase to match backend
    setUser(user);
    navigate("/");
    // Optionally store token if returned
    if (response.data.token) {
      localStorage.setItem("token", response.data.token);
    }
    return user;
  };

  return (
    <AuthContext.Provider value={{ user, setUser, logout, login, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
