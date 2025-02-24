import React, { useEffect } from "react";
import NavBar from "./NavBar";
import Footer from "./Footer";
import { Box, Container, FormControl, InputLabel, MenuItem, Select, Slider, Typography } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";
import { Button, TextField } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import { useState } from "react";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { es } from "date-fns/locale";


const Explorer = () => {
  const [fechaLlegada, setFechaLlegada] = useState(null);
  const [fechaSalida, setFechaSalida] = useState(null);
  const [numPersonas, setNumPersonas] = useState(1);
  const [propiedades, setPropiedades] = useState([]);
  const [propiedadesFiltradas, setPropiedadesFiltradas] = useState([]);

  // FILTROS AVANZADOS
  const [precioRango, setPrecioRango] = useState([0, 1000]);
  const [tipoPropiedad, setTipoPropiedad] = useState("");
  const [habitaciones, setHabitaciones] = useState(0);
  const [camas, setCamas] = useState(0);
  const [ordenPrecio, setOrdenPrecio] = useState("asc");

  useEffect(() => {
    fetchAllProperties();
  }, []);

  useEffect(() => {

    const filtered = propiedades.filter((propiedad) => {
      return (
        (!tipoPropiedad || propiedad.tipo_de_propiedad === tipoPropiedad) &&
        (precioRango[0] <= propiedad.precio_por_noche && propiedad.precio_por_noche <= precioRango[1]) &&
        (habitaciones === 0 || propiedad.numero_de_habitaciones >= habitaciones) &&
        (camas === 0 || propiedad.numero_de_camas >= camas)
      );
    });

    const sorted = filtered.sort((a, b) => {
      if (ordenPrecio === "asc") {
        return a.precio_por_noche - b.precio_por_noche;
      } else {
        return b.precio_por_noche - a.precio_por_noche;
      }
    });

    setPropiedadesFiltradas(sorted);

  }, [tipoPropiedad, precioRango, habitaciones, camas, propiedades, ordenPrecio]);


  const handleIncrement = () => {
    if (numPersonas < 15) setNumPersonas(numPersonas + 1);
  };

  const handleDecrement = () => {
    if (numPersonas > 1) {
      setNumPersonas(numPersonas - 1);
    }
  };



  const fetchAllProperties = async () => {

    try {

      const response = await fetch("http://localhost:8000/api/propiedades/", {
        method: "GET",

      });

      if (!response.ok) {

        throw new Error("Error al obtener las propiedades");

      }
      const data = await response.json();
      setPropiedades(data);
      setPropiedadesFiltradas(data);

    } catch (error) {
      console.log('Error al obtener las propiedades:', error);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
      <div style={{ backgroundColor: "#f4f7fc", minHeight: "100vh" }}>
        <NavBar />
        <Container
          maxWidth="xl"
          sx={{
            minHeight: "80vh",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            paddingTop: 4,
            width: "100%",
          }}
        >
          <Box
            sx={{
              textAlign: "center",
              width: "100%",
              marginBottom: 4,
            }}
          >
            <Typography variant="h4" gutterBottom>
              Explorar
            </Typography>
          </Box>

          <Box
            sx={{
              bgcolor: "white",
              width: "74%",
              display: "flex",
              alignContent: "center",
              justifyContent: "center",
              padding: "20px",
              borderRadius: "50px",
              maxHeight: "45px",
            }}
          >
            <DatePicker
              label="Llegada"
              value={fechaLlegada}
              onChange={setFechaLlegada}
              slotProps={{ textField: { fullWidth: true } }}
              disablePast
            />
            <div className="separador"></div>
            <DatePicker
              label="Salida"
              value={fechaSalida}
              onChange={setFechaSalida}
              slotProps={{ textField: { fullWidth: true } }}
              disablePast
              minDate={fechaLlegada}
            />
            <div className="separador"></div>
            <div style={{ alignContent: "center", justifyContent: "center", display: "flex", alignItems: "center" }}>
              <Button className="circular-button" onClick={handleDecrement}>
                <RemoveIcon style={{ color: "black" }} />
              </Button>
              <span>{numPersonas}</span>
              <Button className="circular-button" onClick={handleIncrement}>
                <AddIcon
                  style={{
                    color: "black",
                    alignContent: "center",
                    justifyContent: "center",
                  }}
                />
              </Button>
            </div>
            <div style={{ alignContent: "center", justifyContent: "center" }}>
              Personas
            </div>
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

          <Box sx={{ bgcolor: "white", width: "74% ", padding: 2, marginBottom: 0, marginTop: 3, borderRadius: "8px", }}>
            <Typography variant="h8" gutterBottom>Filtros</Typography>
            <Box style={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center", justifyContent: "center" }}>
              <Box >
                <Typography> Rango de precio (€) </Typography>
                <Slider value={precioRango} onChange={(e, newValue) => setPrecioRango(newValue)} valueLabelDisplay="auto" min={0} max={1000} />
              </Box>
              <FormControl sx={{ minWidth: 120, marginRight: 2, marginLeft: 2 }}>
                <InputLabel id="filtro-tipo-propiedad-label"> Tipo de Propiedad</InputLabel>
                <Select
                  labelId="filtro-tipo-propiedad-label"
                  id="filtro-tipo-propiedad"
                  value={tipoPropiedad}
                  label="Tipo de Propiedad"
                  onChange={(e) => setTipoPropiedad(e.target.value)}
                >
                  <MenuItem value="">
                    Todos
                  </MenuItem>
                  <MenuItem value="Apartamento">Apartamento</MenuItem>
                  <MenuItem value="Casa">Casa</MenuItem>
                  <MenuItem value="Villa">Villa</MenuItem>
                </Select>
              </FormControl>

              <TextField style={{ maxWidth: 100, marginRight: 2 }}
                id="habitaciones"
                label="Habitaciones"
                type="number"
                value={habitaciones}
                onChange={(e) => setHabitaciones(parseInt(e.target.value) || 0)}
              />
              <TextField style={{ maxWidth: 60, marginLeft: 10 }}
                id="camas"
                label="Camas"
                type="number"
                value={camas}
                onChange={(e) => setCamas(parseInt(e.target.value) || 0)}
              />
              <FormControl sx={{ minWidth: 120, marginRight: 2, marginLeft: 2 }}>
                <InputLabel id="orden-precio-label">Ordenar por precio</InputLabel>
                <Select
                  labelId="orden-precio-label"
                  id="orden-precio"
                  value={ordenPrecio}
                  label="Ordenar por precio"
                  onChange={(e) => setOrdenPrecio(e.target.value)}
                >
                  <MenuItem value="asc">Ascendente</MenuItem>
                  <MenuItem value="desc">Descendente</MenuItem>
                </Select>
              </FormControl>

            </Box>
          </Box>

          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 2,
              justifyContent: "center",
              width: "100%",
              overflow: "auto",
              marginTop: 4,
            }}
          >
            {propiedadesFiltradas.map((propiedad, index) => (
              <Box
                key={index}
                sx={{
                  backgroundColor: "white",
                  border: "1px solid #ccc",
                  padding: 2,
                  width: "calc( 20vw - 16px)",
                  boxSizing: "border-box",
                  aspectRatio: "1/1",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  borderRadius: "8px",
                }}
              > <img src={require("../assets/Designer.jpeg")} alt={propiedad.nombre} style={{ width: "100%", height: "auto", borderRadius: "8px" }} />
                <Typography variant="h9" sx={{ marginTop: 1, fontSize: 15 }} > <a href="/explorar" style={{ textDecoration: "none", color: "inherit", fontWeight: "bold" }}>{propiedad.nombre}</a> </Typography>
                <Typography variant="body2" style={{ fontWeight: "bold", marginTop: 1 }}>   {propiedad.precio_por_noche}€/noche </Typography>
                {/* <Typography variant="body2"> {propiedad.valoraciones} </Typography> */}
              </Box>
            ))}
          </Box>
        </Container>
        <Box sx={{ marginTop: "20px" }}>
          <Footer />
        </Box>
      </div>
    </LocalizationProvider>
  );
};

export default Explorer;
