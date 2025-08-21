import React from "react";
// import { Link } from "react-router-dom"; // TODO: Use when navigation is needed
import "./Breadcrumb.css";

export default function Breadcrumb({ items = [] }) {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <nav aria-label="breadcrumb" className="breadcrumb-nav">
      <ol className="breadcrumb">
        {items.map((item, index) => (
          <li
            key={index}
            className={`breadcrumb-item${
              index === items.length - 1 ? " active" : ""
            }`}
          >
            {index === items.length - 1 ? (
              item.label
            ) : (
              <span className="breadcrumb-link">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
