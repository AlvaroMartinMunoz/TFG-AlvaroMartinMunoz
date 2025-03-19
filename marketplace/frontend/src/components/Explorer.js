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
  Badge,
  Chip,
  Button,
  Divider,
  Tooltip,
  Skeleton,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { es } from "date-fns/locale";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import SortIcon from "@mui/icons-material/Sort";
import FilterListIcon from "@mui/icons-material/FilterList";
import BedIcon from "@mui/icons-material/Bed";
import HotelIcon from "@mui/icons-material/Hotel";
import HomeIcon from "@mui/icons-material/Home";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import WifiIcon from "@mui/icons-material/Wifi";
import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";

const Explorer = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.between("sm", "md"));

  const [fechaLlegada, setFechaLlegada] = useState(null);
  const [fechaSalida, setFechaSalida] = useState(null);
  const [numPersonas, setNumPersonas] = useState(0);
  const [propiedades, setPropiedades] = useState([]);
  const [propiedadesFiltradas, setPropiedadesFiltradas] = useState([]);
  const [url, setUrl] = useState({});
  const [imageLoading, setImageLoading] = useState({});
  const [mediaValoraciones, setMediaValoraciones] = useState({});
  const [favoritos, setFavoritos] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  // Filtros avanzados
  const [precioRango, setPrecioRango] = useState([0, 1000]);
  const [tipoPropiedad, setTipoPropiedad] = useState("");
  const [habitaciones, setHabitaciones] = useState(0);
  const [camas, setCamas] = useState(1);
  const [ordenPrecio, setOrdenPrecio] = useState("asc");
  const [filtersOpen, setFiltersOpen] = useState(false);

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
    setIsLoading(true);
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
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFavorito = (propiedadId) => {
    setFavoritos((prev) => ({
      ...prev,
      [propiedadId]: !prev[propiedadId]
    }));
  };

  const getTipoIcon = (tipo) => {
    switch (tipo) {
      case "Apartamento":
        return <HomeIcon />;
      case "Casa":
        return <HomeIcon />;
      case "Villa":
        return <HomeIcon />;
      default:
        return <HomeIcon />;
    }
  };

  const getPrecioLabel = (precio) => {
    if (precio < 100) return "Económico";
    if (precio < 300) return "Estándar";
    return "Premium";
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
      <Box
        sx={{
          backgroundColor: "#f8f9fa",
          minHeight: "80vh",
          display: "flex",
          flexDirection: "column",
          minWidth: "95vw",
        }}
      >
        <Container maxWidth="lg" sx={{ py: 4 }}>
          {/* Barra de búsqueda */}
          <Paper
            elevation={3}
            sx={{
              p: 3,
              mb: 4,
              width: { xs: "95%", md: "80%" },
              ml: "auto",
              mr: "auto",
              borderRadius: "16px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
              transition: "all 0.3s ease",
              "&:hover": {
                boxShadow: "0 6px 24px rgba(0,0,0,0.12)",
              }
            }}
          >
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              alignItems="center"
              divider={isMobile ? null : <Divider orientation="vertical" flexItem />}
            >
              <Box sx={{ width: { xs: "100%", sm: "40%" }, mb: { xs: 2, sm: 0 } }}>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1} width="100%">
                  <DatePicker
                    label="Llegada"
                    value={fechaLlegada}
                    onChange={setFechaLlegada}
                    renderInput={(params) => (
                      <TextField {...params} fullWidth variant="outlined" />
                    )}
                    disablePast
                    sx={{ width: { xs: "100%", sm: "50%" } }}
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
                    sx={{ width: { xs: "100%", sm: "50%" } }}
                  />
                </Stack>
              </Box>

              <Box sx={{
                display: "flex",
                alignItems: "center",
                border: "1px solid",
                borderColor: "grey.300",
                borderRadius: 2,
                p: 1,
                width: { xs: "100%", sm: "auto" },
                justifyContent: "center"
              }}>
                <Typography sx={{ mr: 1 }}>Personas:</Typography>
                <IconButton
                  onClick={handleDecrement}
                  sx={{
                    color: "primary.main",
                    bgcolor: "grey.100",
                    "&:hover": { bgcolor: "grey.200" }
                  }}
                >
                  <RemoveIcon />
                </IconButton>
                <Typography
                  sx={{
                    mx: 2,
                    fontWeight: "bold",
                    minWidth: "24px",
                    textAlign: "center"
                  }}
                >
                  {numPersonas}
                </Typography>
                <IconButton
                  onClick={handleIncrement}
                  sx={{
                    color: "primary.main",
                    bgcolor: "grey.100",
                    "&:hover": { bgcolor: "grey.200" }
                  }}
                >
                  <AddIcon />
                </IconButton>
              </Box>

              <Button
                variant="contained"
                startIcon={<SearchIcon />}
                sx={{
                  bgcolor: "#091630",
                  borderRadius: "30px",
                  px: 3,
                  py: 1.5,
                  fontWeight: "bold",
                  "&:hover": {
                    bgcolor: "#152a5a",
                  },
                  width: { xs: "100%", sm: "auto" }
                }}
              >
                Buscar
              </Button>
            </Stack>
          </Paper>

          {/* Contenedor principal */}
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              gap: 2,

            }}
          >
            {/* Filtros */}
            <Box sx={{
              width: { xs: "100%", md: "25%" },
              transition: "all 0.3s ease",
              maxHeight: { md: "calc(100vh - 150px)" },
              position: { md: "sticky" },
              top: { md: "20px" },
              mb: 2,
              zIndex: 1,
            }}>
              <Paper
                elevation={2}
                sx={{
                  borderRadius: "16px",
                  overflow: "hidden",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
                }}
              >
                <Box
                  sx={{
                    bgcolor: "#091630",
                    py: 2,
                    px: 3,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between"
                  }}
                >
                  <Typography variant="h6" sx={{ fontWeight: "bold", color: "white" }}>
                    Filtros Avanzados
                  </Typography>
                  <FilterListIcon sx={{ color: "white" }} />
                </Box>
                <Box sx={{ p: 3 }}>
                  <Stack spacing={3}>
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 1 }}>
                        Rango de precio (€)
                      </Typography>
                      <Box sx={{ px: 1 }}>
                        <Slider
                          value={precioRango}
                          onChange={(e, newValue) => setPrecioRango(newValue)}
                          valueLabelDisplay="auto"
                          min={0}
                          max={1000}
                          sx={{
                            color: "#091630",
                            '& .MuiSlider-thumb': {
                              height: 24,
                              width: 24,
                              backgroundColor: '#fff',
                              border: '2px solid #091630',
                              '&:hover, &.Mui-focusVisible': {
                                boxShadow: `0px 0px 0px 8px rgba(9, 22, 48, 0.16)`
                              }
                            },
                            '& .MuiSlider-valueLabel': {
                              backgroundColor: "#091630"
                            }
                          }}
                        />
                      </Box>
                      <Box sx={{ display: "flex", justifyContent: "space-between", mt: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          {precioRango[0]}€
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {precioRango[1]}€
                        </Typography>
                      </Box>
                    </Box>

                    <FormControl fullWidth>
                      <InputLabel>Tipo de Propiedad</InputLabel>
                      <Select
                        value={tipoPropiedad}
                        label="Tipo de Propiedad"
                        onChange={(e) => setTipoPropiedad(e.target.value)}
                        sx={{ '& .MuiOutlinedInput-notchedOutline': { borderRadius: "12px" } }}
                      >
                        <MenuItem value="">Todos</MenuItem>
                        <MenuItem value="Apartamento">
                          <Box sx={{ display: "flex", alignItems: "center" }}>
                            <HomeIcon sx={{ mr: 1, color: "#091630" }} />
                            Apartamento
                          </Box>
                        </MenuItem>
                        <MenuItem value="Casa">
                          <Box sx={{ display: "flex", alignItems: "center" }}>
                            <HomeIcon sx={{ mr: 1, color: "#091630" }} />
                            Casa
                          </Box>
                        </MenuItem>
                        <MenuItem value="Villa">
                          <Box sx={{ display: "flex", alignItems: "center" }}>
                            <HomeIcon sx={{ mr: 1, color: "#091630" }} />
                            Villa
                          </Box>
                        </MenuItem>
                      </Select>
                    </FormControl>

                    <Stack spacing={2}>
                      {[
                        {
                          label: "Habitaciones",
                          value: habitaciones,
                          setter: setHabitaciones,
                          icon: <BedIcon sx={{ color: "#091630" }} />
                        },
                        {
                          label: "Camas",
                          value: camas,
                          setter: setCamas,
                          icon: <HotelIcon sx={{ color: "#091630" }} />
                        },
                      ].map((counter, index) => (
                        <Box
                          key={index}
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1.5,
                            border: "1px solid",
                            borderColor: "grey.300",
                            borderRadius: "12px",
                            p: 1.5,
                            transition: "all 0.2s ease",
                            '&:hover': {
                              borderColor: "primary.main",
                              boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
                            }
                          }}
                        >
                          {counter.icon}
                          <Typography sx={{ minWidth: 90, fontWeight: 500 }}>
                            {counter.label}
                          </Typography>
                          <Box sx={{ display: "flex", alignItems: "center", ml: "auto" }}>
                            <IconButton
                              onClick={() =>
                                counter.setter(Math.max(0, counter.value - 1))
                              }
                              disabled={counter.value === 0}
                              sx={{
                                bgcolor: "grey.100",
                                "&:hover": { bgcolor: "grey.200" },
                              }}
                            >
                              <RemoveIcon />
                            </IconButton>
                            <Typography
                              sx={{
                                width: 30,
                                textAlign: "center",
                                fontWeight: "bold"
                              }}
                            >
                              {counter.value}
                            </Typography>
                            <IconButton
                              onClick={() =>
                                counter.setter(Math.min(15, counter.value + 1))
                              }
                              disabled={counter.value === 15}
                              sx={{
                                bgcolor: "grey.100",
                                "&:hover": { bgcolor: "grey.200" }
                              }}
                            >
                              <AddIcon />
                            </IconButton>
                          </Box>
                        </Box>
                      ))}
                    </Stack>

                    <FormControl fullWidth>
                      <InputLabel>Ordenar por precio</InputLabel>
                      <Select
                        value={ordenPrecio}
                        label="Ordenar por precio"
                        onChange={(e) => setOrdenPrecio(e.target.value)}
                        IconComponent={SortIcon}
                        sx={{ '& .MuiOutlinedInput-notchedOutline': { borderRadius: "12px" } }}
                      >
                        <MenuItem value="asc">De menor a mayor precio</MenuItem>
                        <MenuItem value="desc">De mayor a menor precio</MenuItem>
                      </Select>
                    </FormControl>

                    <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
                      <Button
                        variant="outlined"
                        sx={{
                          borderRadius: "30px",
                          borderColor: "#091630",
                          color: "#091630",
                          fontSize: "0.9rem",
                          px: 3,
                          '&:hover': {
                            bgcolor: 'rgba(9, 22, 48, 0.04)',
                            borderColor: "#091630",
                          }
                        }}
                      >
                        Limpiar filtros
                      </Button>
                    </Box>
                  </Stack>
                </Box>
              </Paper>
            </Box>

            {/* Lista de propiedades */}
            <Box
              sx={{
                width: { xs: "100%", md: "75%" },
              }}
            >
              {/* Resumen de resultados */}
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 2,
                  px: 1
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                  {propiedadesFiltradas.length} propiedades encontradas
                </Typography>
                <FormControl sx={{ width: 200 }}>
                  <Select
                    value={ordenPrecio}
                    onChange={(e) => setOrdenPrecio(e.target.value)}
                    displayEmpty
                    size="small"
                    sx={{ borderRadius: "30px" }}
                    startAdornment={<SortIcon sx={{ mr: 1 }} />}
                  >
                    <MenuItem value="asc">Precio: Menor a mayor</MenuItem>
                    <MenuItem value="desc">Precio: Mayor a menor</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              {/* Grid de propiedades */}
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "repeat(2, 1fr)",
                    md: "repeat(2, 1fr)",
                    lg: "repeat(3, 1fr)"
                  },
                  gap: 3,
                }}
              >
                {isLoading ? (
                  // Skeletons durante la carga
                  Array.from(new Array(6)).map((_, index) => (
                    <Box
                      key={index}
                      sx={{
                        borderRadius: "16px",
                        overflow: "hidden",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                        bgcolor: "white",
                      }}
                    >
                      <Skeleton variant="rectangular" height={200} />
                      <Box sx={{ p: 2 }}>
                        <Skeleton variant="text" height={28} width="80%" />
                        <Skeleton variant="text" height={24} width="40%" />
                        <Skeleton variant="text" height={22} width="60%" />
                      </Box>
                    </Box>
                  ))
                ) : (
                  propiedadesFiltradas.map((propiedad, index) => (
                    <Box
                      key={index}
                      sx={{
                        borderRadius: "16px",
                        overflow: "hidden",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                        bgcolor: "white",
                        transition: "transform 0.3s ease, box-shadow 0.3s ease",
                        "&:hover": {
                          transform: "translateY(-5px)",
                          boxShadow: "0 10px 20px rgba(0,0,0,0.12)",
                        },
                        display: "flex",
                        flexDirection: "column",
                      }}
                    >
                      {/* Imagen con badges */}
                      <Box sx={{ position: "relative" }}>
                        {imageLoading[propiedad.id] ? (
                          <Skeleton variant="rectangular" height={200} />
                        ) : (
                          <Box
                            component="img"
                            src={url[propiedad.id]}
                            alt={propiedad.nombre}
                            sx={{
                              width: "100%",
                              height: "200px",
                              objectFit: "cover",
                              transition: "transform 0.5s ease",
                              "&:hover": {
                                transform: "scale(1.05)",
                              },
                            }}
                          />
                        )}

                        {/* Chip de tipo de propiedad */}
                        <Chip
                          icon={getTipoIcon(propiedad.tipo_de_propiedad)}
                          label={propiedad.tipo_de_propiedad}
                          sx={{
                            position: "absolute",
                            top: 10,
                            left: 10,
                            bgcolor: "rgba(255, 255, 255, 0.9)",
                            fontWeight: "bold",
                            '& .MuiChip-icon': { color: "#091630" }
                          }}
                          size="small"
                        />

                        {/* Botón de favorito */}
                        <IconButton
                          onClick={() => toggleFavorito(propiedad.id)}
                          sx={{
                            position: "absolute",
                            top: 10,
                            right: 10,
                            bgcolor: "rgba(255, 255, 255, 0.9)",
                            "&:hover": {
                              bgcolor: "rgba(255, 255, 255, 0.95)",
                            },
                          }}
                          size="small"
                        >
                          {favoritos[propiedad.id] ? (
                            <FavoriteIcon sx={{ color: "#e91e63" }} />
                          ) : (
                            <FavoriteBorderIcon sx={{ color: "#091630" }} />
                          )}
                        </IconButton>

                        {/* Badge de precio */}
                        <Chip
                          label={getPrecioLabel(propiedad.precio_por_noche)}
                          color={propiedad.precio_por_noche > 300 ? "error" : propiedad.precio_por_noche > 100 ? "warning" : "success"}
                          sx={{
                            position: "absolute",
                            bottom: 10,
                            right: 10,
                            fontWeight: "bold",
                            boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
                          }}
                          size="small"
                        />
                      </Box>

                      {/* Información de la propiedad */}
                      <Box sx={{ p: 2, flexGrow: 1, display: "flex", flexDirection: "column" }}>
                        <Typography variant="subtitle1" sx={{
                          fontWeight: "bold",
                          mb: 1,
                          fontSize: "1.1rem",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap"
                        }}>
                          <a
                            href={`/detalles/${propiedad.id}`}
                            style={{
                              textDecoration: "none",
                              color: "#091630",
                              transition: "color 0.2s ease",
                              "&:hover": {
                                color: "#2a4a8d"
                              }
                            }}
                          >
                            {propiedad.nombre}
                          </a>
                        </Typography>

                        {/* Chip de ubicación */}
                        <Box sx={{ mb: 1 }}>
                          <Chip
                            icon={<LocationOnIcon />}
                            label={propiedad.ubicacion || "España"}
                            size="small"
                            sx={{
                              bgcolor: "#f0f4f8",
                              fontSize: "0.75rem",
                              height: 24
                            }}
                          />
                        </Box>

                        {/* Características */}
                        <Box sx={{
                          display: "flex",
                          gap: 1,
                          mb: 2,
                          flexWrap: "wrap"
                        }}>
                          <Tooltip title="Habitaciones">
                            <Chip
                              icon={<BedIcon fontSize="small" />}
                              label={propiedad.numero_de_habitaciones}
                              size="small"
                              variant="outlined"
                              sx={{ borderRadius: "4px", height: 24 }}
                            />
                          </Tooltip>
                          <Tooltip title="Camas">
                            <Chip
                              icon={<HotelIcon fontSize="small" />}
                              label={propiedad.numero_de_camas}
                              size="small"
                              variant="outlined"
                              sx={{ borderRadius: "4px", height: 24 }}
                            />
                          </Tooltip>
                          {propiedad.wifi && (
                            <Tooltip title="WiFi disponible">
                              <Chip
                                icon={<WifiIcon fontSize="small" />}
                                size="small"
                                variant="outlined"
                                sx={{ borderRadius: "4px", height: 24 }}
                              />
                            </Tooltip>
                          )}
                        </Box>

                        {/* Franja inferior */}
                        <Box sx={{
                          mt: "auto",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          pt: 1,
                          borderTop: "1px solid",
                          borderColor: "grey.200"
                        }}>
                          <Box>
                            <Typography
                              variant="body2"
                              sx={{ color: "text.secondary" }}
                            >
                              Precio por noche
                            </Typography>
                            <Typography
                              variant="h6"
                              sx={{
                                fontWeight: "bold",
                                color: "#091630"
                              }}
                            >
                              {propiedad.precio_por_noche}€
                            </Typography>
                          </Box>
                          <Box sx={{ display: "flex", alignItems: "center" }}>
                            <Rating
                              value={mediaValoraciones[propiedad.id] !== undefined ? mediaValoraciones[propiedad.id] : 0}
                              precision={0.5}
                              readOnly
                              size="small"
                            />
                            {mediaValoraciones[propiedad.id] && (
                              <Typography
                                variant="body2"
                                sx={{ ml: 0.5, fontWeight: "bold" }}
                              >
                                {mediaValoraciones[propiedad.id].toFixed(1)}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </Box>
                    </Box>
                  ))
                )}
              </Box>

              {/* Paginación o "Cargar más" */}
              {propiedadesFiltradas.length > 0 && !isLoading && (
                <Box sx={{
                  display: "flex",
                  justifyContent: "center",
                  mt: 4,
                  mb: 2
                }}>
                  <Button
                    variant="contained"
                    sx={{
                      bgcolor: "#091630",
                      borderRadius: "30px",
                      px: 4,
                      py: 1,
                      "&:hover": {
                        bgcolor: "#152a5a",
                      }
                    }}
                  >
                    Cargar más propiedades
                  </Button>
                </Box>
              )}

              {/* Mensaje cuando no hay resultados */}
              {propiedadesFiltradas.length === 0 && !isLoading && (
                <Paper
                  elevation={1}
                  sx={{
                    p: 4,
                    textAlign: "center",
                    borderRadius: "16px",
                    mt: 2,
                  }}
                >
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    No se encontraron propiedades
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Intenta ajustar los filtros para encontrar más opciones
                  </Typography>
                  <Button
                    variant="outlined"
                    sx={{
                      mt: 3,
                      borderRadius: "30px",
                      borderColor: "#091630",
                      color: "#091630",
                      "&:hover": {
                        borderColor: "#091630",
                        bgcolor: "rgba(9, 22, 48, 0.04)",
                      },
                    }}
                    onClick={() => {
                      setPrecioRango([0, 1000]);
                      setTipoPropiedad("");
                      setHabitaciones(0);
                      setCamas(0);
                      setOrdenPrecio("asc");
                    }}
                  >
                    Limpiar filtros
                  </Button>
                </Paper>
              )}
            </Box>
          </Box>
        </Container>
      </Box>
    </LocalizationProvider>
  );
};

export default Explorer;