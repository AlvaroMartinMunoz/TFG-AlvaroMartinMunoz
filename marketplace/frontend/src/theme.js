import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: {
      main: "#1976d2",
    },
    secondary: {
      main: "#d32f2f",
    },
    background: {
      default: "#fafafa",
      paper: "#ffffff",
      text: {
        primary: "#333333",
        secondary: "#757575",
      },
    },
    typography: {
      fontFamily: "'Roboto', sans-serif",
      fontSize: "2.5rem",
      color: "#1976d2",
    },
    h2: {
      fontSize: "2rem",
      fontWeight: 500,
    },
    body1: {
      fontSize: "1rem",
      color: "#333333",
    },
  },
});

export default theme;
