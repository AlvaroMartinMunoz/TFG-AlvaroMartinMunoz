import "./App.css";
import Navbar from "./components/NavBar";
import Footer from "./components/Footer";
import Register from "./components/Register";
import Login from "./components/Login";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useState } from "react";
import { DatePicker } from "@mui/x-date-pickers";
import { Box, Button, TextField, Container, Typography } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { es } from "date-fns/locale";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import Explorer from "./components/Explorer";
import Profile from "./components/Profile";
import MyProperties from "./components/MyProperties";
import PrivateRoute from "./components/PrivateRoute";
import CreateProperty from "./components/CreateProperty";
import PropertyDetails from "./components/PropertyDetails";

function App() {
  const [fechaLlegada, setFechaLlegada] = useState(null);
  const [fechaSalida, setFechaSalida] = useState(null);
  const [numPersonas, setNumPersonas] = useState(1);

  const handleIncrement = () => {
    if (numPersonas < 15) setNumPersonas(numPersonas + 1);
  };

  const handleDecrement = () => {
    if (numPersonas > 1) {
      setNumPersonas(numPersonas - 1);
    }
  };


  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
      <Router>
        <Routes>
          <Route
            path="/"
            element={
              <Box sx={{ flexDirection: "column", display: "flex", minHeight: "100vh", backgroundColor: "#f4f7fc" }}>
                <Box sx={{ flexGrow: 1, mb: 0 }}>
                  <Navbar />
                </Box>
                <Container maxWidth={false} sx={{ minHeight: "80vh", display: "flex", justifyContent: "center", alignItems: "center", mt: 0 }}>
                  <Box className="contenedor-centrado" sx={{ display: "flex", flexDirection: "column", gap: 2, minHeight: "80vh" }}>
                    <Typography variant="h4" align="center" gutterBottom sx={{ fontWeight: "bold", marginTop: 2 }}>
                      Descubre las mejores playas
                    </Typography>
                    <Typography variant="h6" align="center" gutterBottom>
                      Vive tus sueños frente al mar, en los mejores pisos y al mejor precio
                    </Typography>
                    <Box className="filtro-inicio" sx={{ display: "flex", flexDirection: "row", gap: 2, justifyContent: "center", alignItems: "center" }}>
                      <DatePicker
                        label="Llegada"
                        value={fechaLlegada}
                        onChange={setFechaLlegada}
                        renderInput={(params) => <TextField {...params} />}
                        disablePast
                      />
                      <DatePicker
                        label="Salida"
                        value={fechaSalida}
                        onChange={setFechaSalida}
                        renderInput={(params) => <TextField {...params} />}
                        disablePast
                        minDate={fechaLlegada}
                      />
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <Button className="circular-button" onClick={handleDecrement}>
                          <RemoveIcon style={{ color: "black" }} />
                        </Button>
                        <Typography variant="body1" sx={{ mx: 2 }}>{numPersonas}</Typography>
                        <Button className="circular-button" onClick={handleIncrement}>
                          <AddIcon style={{ color: "black" }} />
                        </Button>
                      </Box>
                      <Typography variant="body1">Personas</Typography>
                      <Button color="primary">
                        <SearchIcon
                          style={{
                            borderRadius: 100,
                            backgroundColor: "091630",
                            color: "white",
                            fontSize: "3rem",
                            marginLeft: "30px",
                          }}
                        />
                      </Button>
                    </Box>
                  </Box>
                </Container>
                <Box sx={{ mt: "auto" }}>
                  <Footer />
                </Box>
              </Box>
            }
          />
          <Route path="/inicio-de-sesion" element={<Login />} />
          <Route path="/registro" element={<Register />} />
          <Route path="/explorar" element={<Explorer />} />
          <Route path="/perfil" element={<PrivateRoute component={Profile} />} />
          <Route path="/mis-propiedades" element={<PrivateRoute component={MyProperties} />} />
          <Route path="/crear-propiedad" element={<PrivateRoute component={CreateProperty} />} />
          <Route path="/detalles/:propiedadId" element={<PropertyDetails />} />
        </Routes>
      </Router >
    </LocalizationProvider >
  );
}

export default App;
