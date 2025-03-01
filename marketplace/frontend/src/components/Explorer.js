import React, { useEffect } from "react";
import NavBar from "./NavBar";
import Footer from "./Footer";
import { Box, Container, FormControl, InputLabel, MenuItem, Select, Slider, Typography, Accordion, AccordionSummary, AccordionDetails } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";
import { Button, TextField } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import { useState } from "react";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { es } from "date-fns/locale";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";


const Explorer = () => {
  const [fechaLlegada, setFechaLlegada] = useState(null);
  const [fechaSalida, setFechaSalida] = useState(null);
  const [numPersonas, setNumPersonas] = useState(1);
  const [propiedades, setPropiedades] = useState([]);
  const [propiedadesFiltradas, setPropiedadesFiltradas] = useState([]);
  const [url, setUrl] = useState("https://source.unsplash.com/1600x900/?house");

  // FILTROS AVANZADOS
  const [precioRango, setPrecioRango] = useState([0, 5000]);
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

  const fetchPropertyPhotos = async (propiedadId) => {
    try {
      const response = await fetch("http://localhost:8000/api/propiedades/fotos-propiedades/");
      if (response.ok) {
        const data = await response.json();
        const filteredData = data.filter((foto) => foto.propiedad === parseInt(propiedadId));
        const portadaFoto = filteredData.find((foto) => foto.es_portada);
        const url = await portadaFoto ? portadaFoto.foto : "https://source.unsplash.com/1600x900/?house";
        console.log(url);

        return url;
      }
    } catch (error) {
      console.log(error);
    }
  };

  const fetchAllProperties = async () => {

    try {

      const response = await fetch("http://localhost:8000/api/propiedades/propiedades/", {
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
          maxWidth={false}
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

          <Accordion
            sx={{
              width: { xs: '100%', md: '74%' },
              marginBottom: 3,
              marginTop: 3,
              borderRadius: '8px',
              boxShadow: 3,
              transition: 'all 0.3s ease',
              '&:hover': {
                boxShadow: 5
              }
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon sx={{ color: 'primary.main' }} />}
              aria-controls="panel1a-content"
              id="panel1a-header"
              sx={{
                backgroundColor: (theme) => theme.palette.grey[100],
                '&:hover': {
                  backgroundColor: (theme) => theme.palette.grey[200]
                }
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
                Filtros
              </Typography>
            </AccordionSummary>

            <AccordionDetails sx={{ padding: 3 }}>
              <Box
                sx={{
                  display: 'flex',
                  gap: 3,
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'center',
                  alignContent: 'center',


                }}
              >
                <Box sx={{ flex: '1 1 300px', minWidth: 280 }}>
                  <Typography variant="body1" gutterBottom sx={{ fontWeight: 500 }}>
                    Rango de precio (€)
                  </Typography>
                  <Slider
                    value={precioRango}
                    onChange={(e, newValue) => setPrecioRango(newValue)}
                    valueLabelDisplay="auto"
                    min={0}
                    max={5000}
                    sx={{ marginTop: 2 }}
                    color="primary"
                  />
                </Box>

                <FormControl sx={{ minWidth: 200, flex: '0 1 auto' }}>
                  <InputLabel id="filtro-tipo-propiedad-label">Tipo de Propiedad</InputLabel>
                  <Select
                    labelId="filtro-tipo-propiedad-label"
                    value={tipoPropiedad}
                    label="Tipo de Propiedad"
                    onChange={(e) => setTipoPropiedad(e.target.value)}
                    variant="outlined"
                    size="medium"
                  >
                    <MenuItem value="">Todos</MenuItem>
                    <MenuItem value="Apartamento">Apartamento</MenuItem>
                    <MenuItem value="Casa">Casa</MenuItem>
                    <MenuItem value="Villa">Villa</MenuItem>
                  </Select>
                </FormControl>

                {[
                  { label: 'Habitaciones', value: habitaciones, setter: setHabitaciones },
                  { label: 'Camas', value: camas, setter: setCamas }
                ].map((counter, index) => (
                  <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, borderRadius: 1, border: 1, borderColor: 'grey.300', padding: 1.5 }}>
                    <Typography variant="body1" sx={{ minWidth: 90, fontWeight: 500 }}>
                      {counter.label}
                    </Typography>
                    <Button
                      onClick={() => counter.setter(Math.max(0, counter.value - 1))}
                      disabled={counter.value === 0}
                      sx={{
                        minWidth: 40,
                        minHeight: 40,
                        borderRadius: '50%',
                        backgroundColor: (theme) => theme.palette.grey[100],
                        color: (theme) => theme.palette.text.primary,
                        '&:hover': {
                          backgroundColor: (theme) => theme.palette.grey[300]
                        },
                        '&:disabled': {
                          backgroundColor: (theme) => theme.palette.grey[50],
                          color: (theme) => theme.palette.grey[500]
                        }
                      }}
                    >
                      <RemoveIcon />
                    </Button>
                    <Typography variant="body1" sx={{ minWidth: 30, textAlign: 'center' }}>
                      {counter.value}
                    </Typography>
                    <Button
                      onClick={() => counter.setter(Math.min(15, counter.value + 1))}
                      disabled={counter.value === 15}
                      sx={{
                        minWidth: 40,
                        minHeight: 40,
                        borderRadius: '50%',
                        backgroundColor: (theme) => theme.palette.grey[100],
                        color: (theme) => theme.palette.text.primary,
                        '&:hover': {
                          backgroundColor: (theme) => theme.palette.grey[300]
                        },
                        '&:disabled': {
                          backgroundColor: (theme) => theme.palette.grey[50],
                          color: (theme) => theme.palette.grey[500]
                        }
                      }}
                    >
                      <AddIcon />
                    </Button>
                  </Box>
                ))}

                <FormControl sx={{ minWidth: 200 }}>
                  <InputLabel id="orden-precio-label">Ordenar por precio</InputLabel>
                  <Select
                    labelId="orden-precio-label"
                    value={ordenPrecio}
                    label="Ordenar por precio"
                    onChange={(e) => setOrdenPrecio(e.target.value)}
                    variant="outlined"
                    size="small"
                  >
                    <MenuItem value="asc">Ascendente</MenuItem>
                    <MenuItem value="desc">Descendente</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </AccordionDetails>
          </Accordion>




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
                  mb: "20px"
                }}
              > <img src={fetchPropertyPhotos(propiedad.id)} alt={propiedad.nombre} style={{ width: "100%", height: "auto", borderRadius: "8px" }} />
                <Typography variant="h9" sx={{ marginTop: 1, fontSize: 15 }} > <a href={`/detalles/${propiedad.id}`} style={{ textDecoration: "none", color: "inherit", fontWeight: "bold" }}>{propiedad.nombre}</a> </Typography>
                <Typography variant="body2" style={{ fontWeight: "bold", marginTop: 1 }}>   {propiedad.precio_por_noche}€/noche </Typography>
                {/* <Typography variant="body2"> {propiedad.valoraciones} </Typography> */}
              </Box>
            ))}
          </Box>
        </Container>
        <Box sx={{ mt: "auto" }}>
          <Footer />
        </Box>
      </div>
    </LocalizationProvider >
  );
};

export default Explorer;
