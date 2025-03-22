import { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { es } from "date-fns/locale";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { Box, Container, CssBaseline } from "@mui/material";

import Navbar from "./components/NavBar";
import Footer from "./components/Footer";
import SearchBar from "./components/SearchBar";
import PrivateRoute from "./components/PrivateRoute";

import Register from "./components/Register";
import Login from "./components/Login";
import Explorer from "./components/Explorer";
import Profile from "./components/Profile";
import MyProperties from "./components/MyProperties";
import CreateProperty from "./components/CreateProperty";
import PropertyDetails from "./components/PropertyDetails";
import MyReserves from "./components/MyReserves";
import EditProperty from "./components/EditProperty";
import MyReservationRequests from "./components/MyReservationRequests";
import Events from "./components/Events";
import EventDetails from "./components/EventDetails";
import Weather from "./components/Weather";
import Myfavorites from "./components/MyFavorites";

const theme = createTheme({
  palette: {
    primary: { main: "#091630" },
    background: { default: "#f4f7fc" },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
        <CssBaseline />
        <Router>
          <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
            <Navbar />
            <Container sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Routes>
                <Route path="/" element={<Explorer />} />
                <Route path="/inicio-de-sesion" element={<Login />} />
                <Route path="/registro" element={<Register />} />
                <Route path="/explorar" element={<Explorer />} />
                <Route path="/perfil" element={<PrivateRoute component={Profile} />} />
                <Route path="/mis-propiedades" element={<PrivateRoute component={MyProperties} />} />
                <Route path="/crear-propiedad" element={<PrivateRoute component={CreateProperty} />} />
                <Route path="/detalles/:propiedadId" element={<PropertyDetails />} />
                <Route path="/editar-propiedad/:propiedadId" element={<PrivateRoute component={EditProperty} />} />
                <Route path="/mis-reservas" element={<PrivateRoute component={MyReserves} />} />
                <Route path="/solicitudes-de-reserva" element={<PrivateRoute component={MyReservationRequests} />} />
                <Route path="/eventos" element={<Events />} />
                <Route path="/detalles-evento/:eventoId" element={<EventDetails />} />
                <Route path="/pronostico-clima" element={<Weather />} />
                <Route path="/favoritos" element={<PrivateRoute component={Myfavorites} />} />
              </Routes>
            </Container>
            <Footer />
          </Box>
        </Router>
      </LocalizationProvider>
    </ThemeProvider>
  );
}

export default App;
