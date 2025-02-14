import React, { useState, useEffect } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  IconButton,
  MenuItem,
  Menu,
} from "@mui/material";
import logo from "../assets/logo.png";
import PersonIcon from "@mui/icons-material/Person";
import { jwtDecode } from "jwt-decode";

const NavBar = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [username, setUsername] = useState("");

  useEffect(() => {
    if (isAuthenticated()) {
      const token = localStorage.getItem("accessToken");
      const decodedToken = jwtDecode(token);
      const userId = decodedToken.user_id;
      console.log(userId);
      fetchAllUsers(userId);
    }
  }, []);

  const isAuthenticated = () => {
    return !!localStorage.getItem("accessToken");
  };

  const fetchAllUsers = async (userId) => {
    try {
      let response = await fetch("http://localhost:8000/api/usuarios/", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });

      if (response.status === 401) {
        console.log("Token expirado");
        const token = await refreshAccessToken();
        if (token) {
          response = await fetch("http://localhost:8000/api/usuarios/", {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
        }
      }

      if (response.ok) {
        const data = await response.json();
        const user = data.find((user) => user.usuario.id === userId);
        console.log(user);
        if (user) {
          setUsername(user.usuario.username);
        } else {
          console.log("Usuario no encontrado");
        }
      }
    } catch (error) {
      console.error("Hubo un error al obtener los usuarios", error);
    }
  };

  const handleLogOut = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    handleClose();
    window.location.reload();
  };

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const refreshAccessToken = async () => {
    try {
      const refreshToken = localStorage.getItem("refreshToken");

      if (!refreshToken) {
        console.log("No hay token de refresco");
        handleLogOut();
        return null;
      }

      const response = await fetch("http://localhost:8000/api/token/refresh/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refresh: refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem("accessToken", data.access);
        return data.access;
      } else {
        console.log("Error al refrescar el token");
        handleLogOut();
        return null;
      }
    } catch (error) {
      console.error("Error al refrescar el token", error);
      return null;
    }
  };

  return (
    <AppBar
      position="static"
      sx={{
        flexGrow: 1,
        // backgroundColor: "transparent",
        backgroundColor: "white",
        maxHeight: "8vh",
        zIndex: 2,
      }}
    >
      <Toolbar>
        <Box sx={{ display: "flex", alignItems: "center", flexGrow: 1 }}>
          <img
            src={logo}
            alt="logo"
            style={{ width: "40px", height: "40px", marginLeft: "2.5rem" }}
          />
          <Typography variant="h6" sx={{ flexGrow: 1, textAlign: "left" }}>
            <a
              href="/"
              style={{
                textDecoration: "none",
                color: "black",
                marginLeft: "1rem",
                fontSize: "1.5rem",
              }}
            >
              Marketplace
            </a>
          </Typography>
        </Box>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",

            justifyContent: "center",
            width: "150px",
            height: "50px",
            borderRadius: "50%",
            marginRight: "-5px",
            backgroundColor: "white",
          }}
        >
          {isAuthenticated() && (
            <Typography
              variant="body1"
              sx={{ color: "black", marginRight: "1rem", width: "200px" }}
            >
              Bienvenido, {username}
            </Typography>
          )}
        </Box>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "50px",
            height: "50px",
            borderRadius: "50%",
            border: "2px solid grey",
            marginRight: "1.5rem",
          }}
        >
          <IconButton onClick={handleClick}>
            <PersonIcon />
          </IconButton>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleClose}
          >
            {!isAuthenticated() ? (
              <>
                <MenuItem
                  onClick={() => {
                    handleClose();
                    window.location.href = "/inicio-de-sesion";
                  }}
                >
                  Iniciar Sesion
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    handleClose();
                    window.location.href = "/registro";
                  }}
                >
                  Registrarse
                </MenuItem>
              </>
            ) : (
              <MenuItem onClick={handleLogOut}>Cerrar Sesion</MenuItem>
            )}
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default NavBar;
