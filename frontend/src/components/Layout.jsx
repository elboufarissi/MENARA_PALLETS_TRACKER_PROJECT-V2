import React from "react";
import "./Layout.css";

const Layout = ({ children }) => {
  return (
    <div className="app-container">
      <main className="main-content">{children}</main>
    </div>
  );
};

export default Layout;
