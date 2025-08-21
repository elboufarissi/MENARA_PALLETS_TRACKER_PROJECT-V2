import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Navbar, Nav, NavDropdown, Container } from "react-bootstrap";

const MainNavigation = () => {
  const location = useLocation();

  return (
    <Navbar bg="dark" variant="dark" expand="lg" className="mb-3">
      <Container fluid>
        <Navbar.Brand as={Link} to="/">
          <img
            src="/logo.png"
            alt="Logo"
            width="30"
            height="30"
            className="d-inline-block align-top me-2"
          />
          Palette Track
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/" active={location.pathname === "/"}>
              Accueil
            </Nav.Link>{" "}
            <Nav.Link
              as={Link}
              to="/depot-de-caution"
              active={location.pathname === "/depot-de-caution"}
            >
              Dépôt Caution
            </Nav.Link>
            <NavDropdown title="Flux Interne" id="flux-interne-dropdown">
              <NavDropdown.Item as={Link} to="/flux-interne">
                Vue d'ensemble
              </NavDropdown.Item>
              <NavDropdown.Divider />
              <NavDropdown.Item as={Link} to="/flux-interne/consignation">
                Consignation
              </NavDropdown.Item>
              <NavDropdown.Item as={Link} to="/flux-interne/deconsignation">
                Déconsignation
              </NavDropdown.Item>
            </NavDropdown>
            <Nav.Link
              as={Link}
              to="/etat/caution"
              active={location.pathname.startsWith("/etat")}
            >
              État
            </Nav.Link>
            <Nav.Link
              as={Link}
              to="/fichiers"
              active={location.pathname === "/fichiers"}
            >
              Fichiers
            </Nav.Link>
            <Nav.Link
              as={Link}
              to="/recuperation"
              active={location.pathname === "/recuperation"}
            >
              Récupération
            </Nav.Link>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default MainNavigation;
