import React, { useState } from "react";
import "./Login.css";
import bgImage from "../assets/palette-bois-bg.jpg";
import { useAuth } from "../context/AuthContext.js";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(username, password);
      navigate("/dashboard"); // Redirige après login
    } catch (err) {
      setError(err.response?.data?.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{overflowY: 'auto', maxHeight: '100vh'}}>
      <div className="login-bg">
        <img src={bgImage} alt="background" />
      </div>
      <div className="login-container">
        <div className="login-left">
          <div className="login-panel">
            <div className="login-logo">Pallet Control</div>
            <div className="login-title">Connectez-vous à votre compte</div>
            <form className="login-form" onSubmit={handleSubmit}>
              <label htmlFor="username">Identifiant</label>
              <input
                id="username"
                type="text"
                placeholder="Entrez votre identifiant"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
              <label htmlFor="password">Password</label>
              <div className="login-password-wrapper">
                <input
                  id="password"
                  type="password"
                  placeholder="Entrez votre mot de passe"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <span className="login-password-asterisk">*</span>
              </div>
              <div className="login-remember">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  id="remember"
                />
                <label htmlFor="remember">Rester connecté</label>
              </div>
              {error && <div className="login-error">{error}</div>}
              <button type="submit" className="login-btn" disabled={loading}>
                {loading ? "Connexion..." : "Se connecter"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
