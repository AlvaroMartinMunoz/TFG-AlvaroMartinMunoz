import React from "react";
import { AppBar, Toolbar, Typography } from "@mui/material";

const NavBar = () => {
  return (
    <AppBar
      position="static"
      sx={{ flexGrow: 1, backgroundColor: "transparent" }}
    >
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1, textAlign: "left" }}>
          <a href="/" sx={{ textDecoration: "none", color: "white" }}>
            Home
          </a>
        </Typography>
      </Toolbar>
    </AppBar>
  );
};

export default NavBar;
