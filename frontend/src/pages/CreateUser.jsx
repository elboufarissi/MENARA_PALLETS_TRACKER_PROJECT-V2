import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { Navigate } from "react-router-dom";
import api from "../utils/api";
import UserForm from "../components/UserForm";
import UserTable from "../components/UserTable";
import CautionHeader from "../components/CautionHeader";
import "./CreateUser.css";

const CreateUser = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get("/users");
      setUsers(response.data.data || response.data);
    } catch (e) {
      setError(e.message);
      console.error("Failed to fetch users:", e);
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Only allow admin users
  if (!user || user.ROLE?.toLowerCase() !== "admin") {
    return <Navigate to="/home" replace />;
  }

  const handleFormSuccess = () => {
    fetchUsers();
    setSelectedUser(null);
    setIsEditMode(false);
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setIsEditMode(true);
  };

  const handleDeleteUser = async (userToDelete) => {
    if (!userToDelete || !userToDelete.USER_ID) return;

    if (
      !window.confirm(
        "Voulez-vous vraiment supprimer cet utilisateur ? Cette action est irréversible."
      )
    ) {
      return;
    }

    try {
      await api.delete(`/users/${userToDelete.USER_ID}`);
      fetchUsers();
      setSelectedUser(null);
      alert("Utilisateur supprimé avec succès.");
    } catch (e) {
      let msg = "Erreur lors de la suppression.";
      if (e.response?.data?.message) {
        msg += "\n" + e.response.data.message;
      } else if (e.response?.status === 404) {
        msg += "\nL'utilisateur n'existe pas sur le serveur.";
      }
      alert(msg);
    }
  };

  const handleClearForm = () => {
    setSelectedUser(null);
    setIsEditMode(false);
  };

  return (
    <>
      <CautionHeader user={user} />
      <div className="create-user-page">
        <div className="page-header">
          <h2>Gestion des Utilisateurs</h2>
          <p>Créer et gérer les comptes utilisateur du système</p>
        </div>

        <div className="content-container">
          <div className="form-section">
            <div className="form-header">
              <h3>
                {isEditMode
                  ? "Modifier l'utilisateur"
                  : "Créer un nouvel utilisateur"}
              </h3>
            </div>
            <UserForm
              onSuccess={handleFormSuccess}
              initialData={selectedUser}
              isEditMode={isEditMode}
              onClear={handleClearForm}
            />
          </div>

          <div className="users-section">
            <div className="users-header">
              <h3>Utilisateurs du système</h3>
            </div>
            {isLoading && (
              <p className="text-center">Chargement des utilisateurs...</p>
            )}
            {error && (
              <p className="text-danger text-center">
                Erreur de chargement: {error}
              </p>
            )}
            {!isLoading && (
              <UserTable
                users={users}
                onEditUser={handleEditUser}
                onDeleteUser={handleDeleteUser}
                currentUserId={user?.USER_ID}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default CreateUser;
