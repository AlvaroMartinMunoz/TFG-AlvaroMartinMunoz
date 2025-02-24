import "./App.css";
import Navbar from "./components/NavBar";
import Footer from "./components/Footer";
import Register from "./components/Register";
import Login from "./components/Login";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useState } from "react";
import { DatePicker } from "@mui/x-date-pickers";
import { Button, TextField } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { es } from "date-fns/locale";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import Explorer from "./components/Explorer";
import Profile from "./components/Profile";

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
              <div style={{ flexDirection: "column", display: "flex" }}>
                <div className="navbar" >
                  <Navbar />
                  <div className="overlay"></div>
                  <div className="contenedor-centrado">
                    <div className="texto-central">
                      Descubre las mejores playas
                    </div>
                    <div className="texto-central-pequeño">
                      Vive tus sueños frente al mar, en los mejores pisos y al
                      mejor precio
                    </div>
                    <div className="filtro-inicio">
                      <DatePicker
                        label="Llegada"
                        value={fechaLlegada}
                        onChange={setFechaLlegada}
                        renderInput={(params) => <TextField {...params} />}
                        disablePast
                      />
                      <div className="separador"></div>
                      <DatePicker
                        label="Salida"
                        value={fechaSalida}
                        onChange={setFechaSalida}
                        renderInput={(params) => <TextField {...params} />}
                        disablePast
                        minDate={fechaLlegada}
                      />
                      <div className="separador"></div>
                      <div>
                        <Button
                          className="circular-button"
                          onClick={handleDecrement}
                        >
                          <RemoveIcon style={{ color: "black" }} />
                        </Button>
                        <span>{numPersonas}</span>
                        <Button
                          className="circular-button"
                          onClick={handleIncrement}
                        >
                          <AddIcon style={{ color: "black" }} />
                        </Button>
                      </div>
                      <div>Personas</div>
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
                    </div>
                  </div>
                </div>
                <div style={{ mt: " auto" }}>
                  <Footer />
                </div>
              </div>
            }
          />
          <Route path="/inicio-de-sesion" element={<Login />} />
          <Route path="/registro" element={<Register />} />
          <Route path="/explorar" element={<Explorer />} />
          <Route path="/perfil" element={<Profile />} />
        </Routes>
      </Router>
    </LocalizationProvider>
  );
}

export default App;
