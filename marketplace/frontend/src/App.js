import "./App.css";
import Navbar from "./components/NavBar";
import { useState } from "react";
import { DatePicker } from "@mui/x-date-pickers";
import { Button, TextField } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { es } from "date-fns/locale";
import SearchIcon from "@mui/icons-material/Search";
import Footer from "./components/Footer";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";

function App() {
  const [fechaLlegada, setFechaLlegada] = useState(null);
  const [fechaSalida, setFechaSalida] = useState(null);
  const [numnPersonas, setNumPersonas] = useState(1);

  const handleIncrement = () => {
    setNumPersonas(numnPersonas + 1);
  };

  const handleDecrement = () => {
    if (numnPersonas > 1) {
      setNumPersonas(numnPersonas - 1);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
      <div className="navbar">
        <Navbar />
        <div className="contenedor-centrado">
          <div className="texto-central">Descubre las mejores playas</div>
          <div className="texto-central-pequeño">
            Vive tus sueños frente al mar, en los mejores pisos y al mejor
            precio
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
              <Button className="circular-button" onClick={handleDecrement}>
                <RemoveIcon style={{ color: "black" }} />
              </Button>
              <span>{numnPersonas}</span>
              <Button className="circular-button" onClick={handleIncrement}>
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
      <Footer />
    </LocalizationProvider>
  );
}

export default App;
