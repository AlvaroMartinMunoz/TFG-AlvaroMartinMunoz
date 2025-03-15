import React, { useEffect, useState } from "react";
import {
  Box,
  Container,
  Paper,
  Typography,
  IconButton,
  Slider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CircularProgress,
  Rating,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { es } from "date-fns/locale";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

const Explorer = () => {
  const [fechaLlegada, setFechaLlegada] = useState(null);
  const [fechaSalida, setFechaSalida] = useState(null);
  const [numPersonas, setNumPersonas] = useState(1);
  const [propiedades, setPropiedades] = useState([]);
  const [propiedadesFiltradas, setPropiedadesFiltradas] = useState([]);
  const [url, setUrl] = useState({});
  const [imageLoading, setImageLoading] = useState({});
  const [mediaValoraciones, setMediaValoraciones] = useState({});

  // Filtros avanzados
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
        (precioRango[0] <= propiedad.precio_por_noche &&
          propiedad.precio_por_noche <= precioRango[1]) &&
        (habitaciones === 0 ||
          propiedad.numero_de_habitaciones >= habitaciones) &&
        (camas === 0 || propiedad.numero_de_camas >= camas)
      );
    });

    const sorted = filtered.sort((a, b) =>
      ordenPrecio === "asc"
        ? a.precio_por_noche - b.precio_por_noche
        : b.precio_por_noche - a.precio_por_noche
    );

    setPropiedadesFiltradas(sorted);
    sorted.forEach((propiedad) => {
      fetchPropertyPhotos(propiedad.id);
      fetchMediaValoraciones(propiedad.id);
    });
  }, [tipoPropiedad, precioRango, habitaciones, camas, propiedades, ordenPrecio]);


  const fetchMediaValoraciones = async (propiedadId) => {
    try {
      const response = await fetch(`http://localhost:8000/api/propiedades/valoraciones-propiedades/${propiedadId}/media_valoraciones/`);
      if (response.ok) {
        const data = await response.json();
        setMediaValoraciones((prev) => ({ ...prev, [propiedadId]: data.media }));
      } else {
        throw new Error("Error al obtener las valoraciones");
      }
    } catch (error) {
      console.error("Error al obtener las valoraciones:", error);
    }
  };

  const handleIncrement = () => {
    if (numPersonas < 15) setNumPersonas(numPersonas + 1);
  };

  const handleDecrement = () => {
    if (numPersonas > 1) setNumPersonas(numPersonas - 1);
  };

  const fetchPropertyPhotos = async (propiedadId) => {
    setImageLoading((prev) => ({ ...prev, [propiedadId]: true }));
    try {
      const response = await fetch(
        "http://localhost:8000/api/propiedades/fotos-propiedades/"
      );
      if (response.ok) {
        const data = await response.json();
        const filteredData = data.filter(
          (foto) => foto.propiedad === parseInt(propiedadId)
        );
        const portadaFoto = filteredData.find((foto) => foto.es_portada);
        const fotoUrl = portadaFoto
          ? portadaFoto.foto
          : "https://source.unsplash.com/1600x900/?house";
        setUrl((prev) => ({ ...prev, [propiedadId]: fotoUrl }));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setImageLoading((prev) => ({ ...prev, [propiedadId]: false }));
    }
  };

  const fetchAllProperties = async () => {
    try {
      const response = await fetch(
        "http://localhost:8000/api/propiedades/propiedades/"
      );
      if (!response.ok) {
        throw new Error("Error al obtener las propiedades");
      }
      const data = await response.json();
      setPropiedades(data);
      setPropiedadesFiltradas(data);
    } catch (error) {
      console.error("Error al obtener las propiedades:", error);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
      <Box
        sx={{
          backgroundColor: "#f4f7fc",
          minHeight: "80vh",
          display: "flex",
          flexDirection: "column",
          minWidth: "95vw",
        }}
      >
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Paper elevation={3} sx={{ p: 2, mb: 4, width: "75%", ml: "auto", mr: "auto" }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <DatePicker
                label="Llegada"
                value={fechaLlegada}
                onChange={setFechaLlegada}
                renderInput={(params) => (
                  <TextField {...params} fullWidth variant="outlined" />
                )}
                disablePast
              />
              <DatePicker
                label="Salida"
                value={fechaSalida}
                onChange={setFechaSalida}
                renderInput={(params) => (
                  <TextField {...params} fullWidth variant="outlined" />
                )}
                disablePast
                minDate={fechaLlegada}
              />
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <IconButton onClick={handleDecrement}>
                  <RemoveIcon />
                </IconButton>
                <Typography sx={{ mx: 1 }}>{numPersonas}</Typography>
                <IconButton onClick={handleIncrement}>
                  <AddIcon />
                </IconButton>
              </Box>
              <Typography variant="body1">Personas</Typography>
              <IconButton
                color="primary"
                sx={{
                  backgroundColor: "#091630",
                  p: 1,
                  borderRadius: "50%",
                }}
              >
                <SearchIcon sx={{ fontSize: "1.5rem", color: "white" }} />
              </IconButton>
            </Stack>
          </Paper>
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              gap: 2,
            }}
          >
            <Box sx={{ width: { xs: "100%", md: "25%" } }}>
              <Accordion>
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  aria-controls="filtros-avanzados-content"
                  id="filtros-avanzados-header"
                >
                  <Typography variant="h6">Filtros Avanzados</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Stack spacing={2}>
                    <Typography variant="body1">Rango de precio (€)</Typography>
                    <Slider
                      value={precioRango}
                      onChange={(e, newValue) => setPrecioRango(newValue)}
                      valueLabelDisplay="auto"
                      min={0}
                      max={1000}
                    />
                    <FormControl fullWidth>
                      <InputLabel>Tipo de Propiedad</InputLabel>
                      <Select
                        value={tipoPropiedad}
                        label="Tipo de Propiedad"
                        onChange={(e) => setTipoPropiedad(e.target.value)}
                      >
                        <MenuItem value="">Todos</MenuItem>
                        <MenuItem value="Apartamento">Apartamento</MenuItem>
                        <MenuItem value="Casa">Casa</MenuItem>
                        <MenuItem value="Villa">Villa</MenuItem>
                      </Select>
                    </FormControl>
                    <Stack spacing={1}>
                      {[
                        {
                          label: "Habitaciones",
                          value: habitaciones,
                          setter: setHabitaciones,
                        },
                        { label: "Camas", value: camas, setter: setCamas },
                      ].map((counter, index) => (
                        <Box
                          key={index}
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1.5,
                            border: "1px solid",
                            borderColor: "grey.300",
                            borderRadius: 1,
                            p: 1,
                          }}
                        >
                          <Typography sx={{ minWidth: 90, fontWeight: 500 }}>
                            {counter.label}
                          </Typography>
                          <IconButton
                            onClick={() =>
                              counter.setter(Math.max(0, counter.value - 1))
                            }
                            disabled={counter.value === 0}
                          >
                            <RemoveIcon />
                          </IconButton>
                          <Typography sx={{ minWidth: 30, textAlign: "center" }}>
                            {counter.value}
                          </Typography>
                          <IconButton
                            onClick={() =>
                              counter.setter(Math.min(15, counter.value + 1))
                            }
                            disabled={counter.value === 15}
                          >
                            <AddIcon />
                          </IconButton>
                        </Box>
                      ))}
                    </Stack>
                    <FormControl fullWidth>
                      <InputLabel>Ordenar por precio</InputLabel>
                      <Select
                        value={ordenPrecio}
                        label="Ordenar por precio"
                        onChange={(e) => setOrdenPrecio(e.target.value)}
                      >
                        <MenuItem value="asc">Ascendente</MenuItem>
                        <MenuItem value="desc">Descendente</MenuItem>
                      </Select>
                    </FormControl>

                  </Stack>
                </AccordionDetails>
              </Accordion>
            </Box>
            <Box
              sx={{
                width: { xs: "100%", md: "75%" },
                display: "flex",
                flexWrap: "wrap",
                gap: 2,
                justifyContent: "center",
              }}
            >
              {propiedadesFiltradas.map((propiedad, index) => (
                <Box
                  key={index}
                  sx={{
                    flex: "0 0 calc(33.33% - 16px)",
                    bgcolor: "white",
                    borderRadius: 2,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                    mb: 2,
                  }}
                >
                  {imageLoading[propiedad.id] ? (
                    <CircularProgress />
                  ) : (
                    <Box
                      component="img"
                      src={url[propiedad.id]}
                      alt={propiedad.nombre}
                      sx={{
                        width: "100%",
                        height: "200px",
                        objectFit: "cover",
                      }}
                    />
                  )}


                  <Box sx={{ p: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: "bold", mb: 1 }}>
                      <a
                        href={`/detalles/${propiedad.id}`}
                        style={{ textDecoration: "none", color: "inherit" }}
                      >
                        {propiedad.nombre}
                      </a>
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: "bold" }}>
                      {propiedad.precio_por_noche}€/noche
                    </Typography>
                    <Rating value={mediaValoraciones[propiedad.id] !== undefined ? mediaValoraciones[propiedad.id] : 0} precision={0.5} readOnly />
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        </Container>
      </Box>
    </LocalizationProvider>
  );
};

export default Explorer;
