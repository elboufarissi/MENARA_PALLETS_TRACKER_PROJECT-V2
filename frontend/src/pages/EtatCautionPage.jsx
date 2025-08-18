import React from "react";
import EtatCaution from "../etats/EtatCaution";
import CautionHeader from "../components/CautionHeader";
import NavigationMenu from "../components/NavigationMenu";
import { useAuth } from "../context/AuthContext";

export default function EtatCautionPage() {
  const { user } = useAuth();

  return (
    <div
      style={{
        minHeight: "calc(100vh - 48px)",
        background: "#f4f6f8",
        margin: 0,
        marginTop: "48px" /* Match the header height */,
        padding: 0,
      }}
    >
      <CautionHeader user={user} />
      <NavigationMenu />
      <EtatCaution />
    </div>
  );
}
