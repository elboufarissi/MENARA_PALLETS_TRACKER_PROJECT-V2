import React from "react";
import { useAuth } from "../context/AuthContext";

const DebugUser = () => {
  const { user } = useAuth();

  return (
    <div
      style={{
        position: "fixed",
        top: "10px",
        right: "10px",
        background: "#f0f0f0",
        padding: "10px",
        border: "1px solid #ccc",
        borderRadius: "4px",
        fontSize: "12px",
        zIndex: 9999,
        maxWidth: "300px",
        overflow: "auto",
      }}
    >
      <h4>Debug User Info</h4>
      <pre>{JSON.stringify(user, null, 2)}</pre>
      <div>
        <strong>Token:</strong>{" "}
        {localStorage.getItem("token") ? "Present" : "Missing"}
      </div>
      <div>
        <strong>User from localStorage:</strong>
        <pre>
          {JSON.stringify(
            JSON.parse(localStorage.getItem("user") || "null"),
            null,
            2
          )}
        </pre>
      </div>
    </div>
  );
};

export default DebugUser;
