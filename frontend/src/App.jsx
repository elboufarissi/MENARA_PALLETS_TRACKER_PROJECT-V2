import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import DepotCautionPage from "./pages/DepotCautionPage";
import FluxInterne from "./pages/FluxInterne";
import CreateUser from "./pages/CreateUser";
import Login from "./pages/Login";
import "bootstrap/dist/css/bootstrap.min.css";

function App() {
  const isAuthenticated = !!localStorage.getItem("token"); // Or use your auth context

  return (
    <Router>
      <Layout>
        <Routes>
          <Route
            path="/"
            element={isAuthenticated ? <Navigate to="/Home" /> : <Login />}
          />
          <Route
            path="/Home"
            element={isAuthenticated ? <Home /> : <Navigate to="/" />}
          />
          <Route
            path="/depot-de-caution"
            element={
              isAuthenticated ? <DepotCautionPage /> : <Navigate to="/" />
            }
          />
          <Route
            path="/flux-interne"
            element={isAuthenticated ? <FluxInterne /> : <Navigate to="/" />}
          />
          <Route
            path="/create-user"
            element={isAuthenticated ? <CreateUser /> : <Navigate to="/" />}
          />
          {/* Add other protected routes here */}
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
