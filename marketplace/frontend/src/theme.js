import { createTheme } from "@mui/material/styles";
import "@fontsource/ubuntu/400.css"; // Regular weight
import "@fontsource/ubuntu/700.css"; // Bold weight

const theme = createTheme({
  typography: {
    fontFamily: "'Ubuntu', sans-serif",
  },
});

export default theme;
