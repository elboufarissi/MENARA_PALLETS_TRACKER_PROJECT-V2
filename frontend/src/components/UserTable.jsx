import React from "react";
import { FaEdit, FaTrash } from "react-icons/fa";
import "./UserTable.css";

const UserTable = ({ users, onEditUser, onDeleteUser, currentUserId }) => {
  const formatDate = (dateString) => {
    if (!dateString) return "";
    try {
      return new Date(dateString).toLocaleDateString("fr-FR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      return dateString;
    }
  };

  const getRoleLabel = (role) => {
    const roleLabels = {
      ADMIN: "Administrateur",
      CAISSIERE: "Caissière",
      CAISSIER: "Caissier",
      AGENT_ORDONNANCEMENT: "Agent d'Ordonnancement",
      CHEF_PARC: "Chef de Parc",
    };
    return roleLabels[role] || role;
  };

  if (!users || users.length === 0) {
    return (
      <div className="user-table-container">
        <div className="no-data">
          <p>Aucun utilisateur trouvé.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="user-table-container">
      <div className="table-responsive">
        <table className="user-table">
          <thead>
            <tr>
              <th>Nom complet</th>
              <th>Nom d'utilisateur</th>
              <th>Rôle</th>
              <th>Date de création</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.USER_ID || user.id}>
                <td className="user-name">{user.FULL_NAME}</td>
                <td className="username">{user.USERNAME}</td>
                <td className="role">
                  <span className={`role-badge ${user.ROLE?.toLowerCase()}`}>
                    {getRoleLabel(user.ROLE)}
                  </span>
                </td>
                <td className="date">
                  {formatDate(user.DATE_CREATION || user.created_at)}
                </td>
                <td className="actions">
                  <button
                    type="button"
                    className="btn-action btn-edit"
                    onClick={() => onEditUser(user)}
                    title="Modifier l'utilisateur"
                  >
                    <FaEdit />
                  </button>
                  {user.USER_ID !== currentUserId && (
                    <button
                      type="button"
                      className="btn-action btn-delete"
                      onClick={() => onDeleteUser(user)}
                      title="Supprimer l'utilisateur"
                    >
                      <FaTrash />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserTable;
