import React, { useState, useEffect } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  IconButton,
  MenuItem,
  Menu,
  Avatar,
  Container,
  Button,
  Drawer,
  List,
  ListItem,
  ListItemText,
  useMediaQuery,
  useTheme,
  Badge,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import logo from "../assets/logo.png";
import PersonIcon from "@mui/icons-material/Person";
import { jwtDecode } from "jwt-decode";
import { Link, useNavigate } from "react-router-dom";
import FavoriteIcon from "@mui/icons-material/Favorite";

const NavBar = () => {
  const usuarioId = JSON.parse(localStorage.getItem("additionalInfo"))?.usuarioId;
  const [anchorEl, setAnchorEl] = useState(null);
  const [username, setUsername] = useState("");
  const [favoritosNavbar, setFavoritosNavbar] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("accessToken");

    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        console.log(jwtDecode)
        if (decodedToken && decodedToken.user_id) {
          fetchAllUsers(decodedToken.user_id);
        } else {
          console.log("Token inválido, cerrando sesión...");
          handleLogOut();
        }
      } catch (error) {
        console.error("Error al decodificar el token:", error);
        handleLogOut();
      }
    }

    if (isAuthenticated()) {
      const intervalId = setInterval(() => {
        fetchFavoritosNavbar();
      }, 2000);
      return () => clearInterval(intervalId);
    }
  }, []);


  const fetchFavoritosNavbar = async (retried = false) => {
    if (!isAuthenticated()) return;
    try {
      const response = await fetch(`http://localhost:8000/api/propiedades/favoritos-por-usuario/${usuarioId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        // const dataFiltered = data.filter((favorito) =>
        //   favorito.usuario === JSON.parse(localStorage.getItem("additionalInfo")).usuarioId
        // );
        setFavoritosNavbar(data.length);
      }
      if (response.status === 401 && !retried) {
        console.log("Token expirado");
        const token = await refreshAccessToken();
        if (token) {
          fetchFavoritosNavbar(true);
        }
      }
    } catch (error) {
      console.error("Error al obtener los favoritos:", error);
    }
  };

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
        console.log(userId);
        console.log(data);
        const user = data.find((user) => user?.usuario?.id === userId);
        const usuarioId = user?.id;

        const additionalInfo = {
          usuarioId: usuarioId,
        };

        localStorage.setItem("additionalInfo", JSON.stringify(additionalInfo));

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
    localStorage.removeItem("additionalInfo");
    handleClose();
    navigate("/");
  };

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMobileMenuToggle = () => {
    setMobileOpen(!mobileOpen);
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

  const navLinks = [
    { title: "Explorar", path: "/explorar" },
    { title: "Eventos", path: "/eventos" },
    { title: "Clima", path: "/pronostico-clima" },
  ];

  const userMenuItems = isAuthenticated()
    ? [
      { title: "Perfil", path: "/perfil" },
      { title: "Mis propiedades", path: "/mis-propiedades" },
      { title: "Mis reservas", path: "/mis-reservas" },
      { title: "Recomendaciones para ti", path: "/recomendaciones" },
      { title: "Cerrar Sesión", action: handleLogOut },
    ]
    : [
      { title: "Iniciar Sesión", path: "/inicio-de-sesion" },
      { title: "Registrarse", path: "/registro" },
    ];

  const renderNavLinks = (isMobileMenu = false) => (
    <>
      {navLinks.map((link) => (
        isMobileMenu ? (
          <ListItem
            key={link.title}
            onClick={() => {
              navigate(link.path);
              handleMobileMenuToggle();
            }}
            sx={{ width: '100%' }}
          >
            <ListItemText primary={link.title} />
          </ListItem>
        ) : (
          <Button
            key={link.title}
            component={Link}
            to={link.path}
            sx={{
              color: "text.primary",
              display: "block",
              textTransform: "none",
              fontSize: "0.95rem",
              fontWeight: 500,
              padding: "6px 10px",
              "&:hover": {
                backgroundColor: "transparent",
                color: "primary.main",
              },
            }}
          >
            {link.title}
          </Button>
        )
      ))}
    </>
  );

  const renderUserMenu = (isMobileMenu = false) => (
    <>
      {userMenuItems.map((item) => (
        isMobileMenu ? (
          <ListItem
            key={item.title}
            onClick={() => {
              handleMobileMenuToggle();
              if (item.action) {
                item.action();
              } else if (item.path) {
                navigate(item.path);
              }
            }}
            sx={{ width: '100%' }}
          >
            <ListItemText primary={item.title} />
          </ListItem>
        ) : (
          <MenuItem
            key={item.title}
            onClick={() => {
              handleClose();
              if (item.action) {
                item.action();
              } else if (item.path) {
                navigate(item.path);
              }
            }}
            sx={{
              "&:hover": { backgroundColor: "action.hover" },
            }}
          >
            {item.title}
          </MenuItem>
        )
      ))}
    </>
  );

  return (
    <>
      <AppBar
        position="sticky"
        elevation={1}
        sx={{
          backgroundColor: "white",
          height: "70px",
          justifyContent: "center",
        }}
      >
        <Container maxWidth="xl">
          <Toolbar disableGutters sx={{ justifyContent: "space-between", alignItems: "center" }}>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Avatar
                src={logo}
                alt="logo"
                sx={{
                  width: 40,
                  height: 40,
                  marginRight: 2,
                  backgroundColor: "transparent",
                }}
              />
              <Typography
                variant="h6"
                component="a"
                href="/"
                sx={{
                  fontWeight: 600,
                  color: "black",
                  textDecoration: "none",
                  letterSpacing: ".1rem",
                  transition: "color 0.3s ease",
                  "&:hover": {
                    color: "primary.main",
                  },
                  marginRight: 4,
                  display: { xs: 'none', sm: 'block' }
                }}
              >
                Hostsy
              </Typography>
            </Box>

            {!isMobile ? (
              <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
                <Box sx={{ display: "flex", gap: 3 }}>
                  {renderNavLinks()}
                </Box>

                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  {isAuthenticated() && (
                    <Typography
                      variant="body1"
                      sx={{
                        color: "text.primary",
                        fontWeight: 500,
                      }}
                    >
                      Bienvenido, {username}
                    </Typography>
                  )}

                  {isAuthenticated() && (
                    <IconButton
                      component={Link}
                      to="/favoritos"
                      color="primary"
                      aria-label="Favoritos"
                      sx={{
                        transition: "transform 0.2s",
                        "&:hover": {
                          transform: "scale(1.1)",
                          color: "error.main",
                        },
                      }}
                    >
                      <Badge badgeContent={favoritosNavbar || 0} color="error">
                        <FavoriteIcon />
                      </Badge>
                    </IconButton>
                  )}

                  <Avatar
                    sx={{
                      width: 40,
                      height: 40,
                      border: "2px solid",
                      borderColor: "divider",
                      backgroundColor: "action.hover",
                      cursor: "pointer",
                      transition: "transform 0.2s, box-shadow 0.2s",
                      "&:hover": {
                        transform: "scale(1.05)",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                        borderColor: "primary.light",
                      },
                    }}
                    onClick={handleClick}
                  >
                    <PersonIcon color="action" />
                  </Avatar>

                  <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleClose}
                    PaperProps={{
                      elevation: 3,
                      sx: {
                        minWidth: 180,
                        borderRadius: 2,
                        mt: 1.5,
                        "& .MuiMenuItem-root": {
                          px: 2,
                          py: 1.5,
                          fontSize: "0.9rem",
                        },
                      },
                    }}
                    transformOrigin={{ horizontal: "right", vertical: "top" }}
                    anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
                  >
                    {renderUserMenu()}
                  </Menu>
                </Box>
              </Box>
            ) : (
              <IconButton
                color="inherit"
                aria-label="open drawer"
                edge="start"
                onClick={handleMobileMenuToggle}
                sx={{ marginLeft: 'auto' }}
              >
                <MenuIcon sx={{ color: "black" }} />
              </IconButton>
            )}
          </Toolbar>
        </Container>
      </AppBar>

      <Drawer
        anchor="right"
        open={mobileOpen}
        onClose={handleMobileMenuToggle}
        sx={{
          '& .MuiDrawer-paper': {
            width: '250px',
            boxSizing: 'border-box',
            padding: 2,
          },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 2,
          }}
        >
          <Typography variant="h6">Menú</Typography>
          <IconButton onClick={handleMobileMenuToggle}>
            <CloseIcon sx={{ color: "black" }} />
          </IconButton>
        </Box>

        {isAuthenticated() && (
          <Box sx={{ marginBottom: 2, textAlign: 'center' }}>
            <Typography variant="body1">
              Bienvenido, {username}
            </Typography>
            {favoritosNavbar > 0 && (
              <Button
                component={Link}
                to="/favoritos"
                startIcon={<FavoriteIcon color="error" />}
                sx={{ marginTop: 1 }}
              >
                Favoritos ({favoritosNavbar})
              </Button>
            )}
          </Box>
        )}

        <List>
          {renderNavLinks(true)}
          {renderUserMenu(true)}
        </List>
      </Drawer>
    </>
  );
};

export default NavBar;