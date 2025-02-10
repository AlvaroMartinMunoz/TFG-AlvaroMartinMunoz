import React, { useState } from "react";
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

const NavBar = () => {
  const [anchorEl, setAnchorEl] = useState(null);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <AppBar
      position="static"
      sx={{
        flexGrow: 1,
        // backgroundColor: "transparent",
        backgroundColor: "#2d2c38",
        maxHeight: "8vh",
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
                color: "white",
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
            width: "50px",
            height: "50px",
            borderRadius: "50%",
            border: "2px solid grey",
            marginRight: "1.5rem",
            backgroundColor: "white",
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
            <MenuItem onClick={handleClose}>Iniciar Sesion</MenuItem>
            <MenuItem onClick={handleClose}>Registrarse</MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default NavBar;
