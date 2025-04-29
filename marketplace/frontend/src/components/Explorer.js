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
  Rating,
  Chip,
  Button,
  Tooltip,
  Skeleton,
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { es } from "date-fns/locale";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import SortIcon from "@mui/icons-material/Sort";
import FilterListIcon from "@mui/icons-material/FilterList";
import BedIcon from "@mui/icons-material/Bed";
import HotelIcon from "@mui/icons-material/Hotel";
import HomeIcon from "@mui/icons-material/Home";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import WifiIcon from "@mui/icons-material/Wifi";
import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import refreshAccessToken from "./RefreshToken";
import { useFavoritos } from "../context/FavoritosContext";

const Explorer = () => {

  const { actualizarFavoritosNavbar } = useFavoritos();
  const usuarioId = JSON.parse(localStorage.getItem('additionalInfo'))?.usuarioId;

  const [propiedades, setPropiedades] = useState([]);
  const [propiedadesFiltradas, setPropiedadesFiltradas] = useState([]);
  const [url, setUrl] = useState({});
  const [imageLoading, setImageLoading] = useState({});
  const [mediaValoraciones, setMediaValoraciones] = useState([]);
  const [favoritos, setFavoritos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filtros avanzados
  const [precioRango, setPrecioRango] = useState([0, 1000]);
  const [tipoPropiedad, setTipoPropiedad] = useState("");
  const [habitaciones, setHabitaciones] = useState(0);
  const [camas, setCamas] = useState(0);
  const [ordenPrecio, setOrdenPrecio] = useState("recomendaciones");
  const [ciudad, setCiudad] = useState("");
  const [recomendaciones, setRecomendaciones] = useState([]);

  const ciudadesEspana = [
    "Madrid",
    "Barcelona",
    "Valencia",
    "Sevilla",
    "Zaragoza",
    "Málaga",
    "Murcia",
    "Palma",
    "Bilbao",
    "Alicante",
    "Córdoba",
    "Valladolid",
    "Vigo",
    "Gijón",
    "Granada",
    "Elche",
    "Oviedo",
    "Badalona",
    "Cartagena",
    "Terrassa",
    "Jerez de la Frontera",
    "Sabadell",
    "Móstoles",
    "Santa Cruz de Tenerife",
    "Pamplona",
    "Almería",
    "Alcalá de Henares",
    "San Sebastián",
    "Donostia",
    "Leganés",
    "Santander",
    "Burgos",
    "Castellón de la Plana",
    "Alcorcón",
    "Albacete",
    "Getafe",
    "Salamanca",
    "Logroño",
    "Huelva",
    "Badajoz",
    "Tarragona",
    "Lleida",
    "Marbella",
    "León",
    "Cádiz",
    "Jaén",
    "Ourense",
    "Lugo",
    "Santiago de Compostela",
    "Cáceres",
    "Melilla",
    "Ceuta",
    "Ávila",
    "Segovia",
    "Guadalajara",
    "Cuenca",
    "Soria",
    "Zamora",
    "Palencia",
    "Toledo",
    "Ciudad Real",
    "Huesca",
  ];


  const isAuthenticated = () => {
    return !!localStorage.getItem("accessToken");
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const recResponse = await fetch("http://localhost:8000/api/propiedades/recomendaciones/", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        });

        if (recResponse.ok) {
          const recomendacionesData = await recResponse.json();
          setRecomendaciones(recomendacionesData);
          setPropiedadesFiltradas(recomendacionesData);
        }

        const allResponse = await fetch("http://localhost:8000/api/propiedades/propiedades/");
        if (allResponse.ok) {
          const allProperties = await allResponse.json();
          setPropiedades(allProperties);
        }

        fetchFavoritos();
        actualizarFavoritosNavbar();
      } catch (error) {
        console.error("Error al cargar datos iniciales:", error);
      }
    };

    fetchInitialData();
  }, []);

  useEffect(() => {
    const filterProperties = (props) => {
      return props.filter((propiedad) => {
        return (
          (!tipoPropiedad || propiedad.tipo_de_propiedad === tipoPropiedad) &&
          (precioRango[0] <= propiedad.precio_por_noche &&
            propiedad.precio_por_noche <= precioRango[1]) &&
          (habitaciones === 0 ||
            propiedad.numero_de_habitaciones >= habitaciones) &&
          (camas === 0 || propiedad.numero_de_camas >= camas) &&
          (ciudad === "" || propiedad.ciudad.toLowerCase() === ciudad.toLowerCase())
        );
      });
    };

    const sortProperties = (props) => {
      return props.sort((a, b) => {
        if (ordenPrecio === "recomendaciones") {
          return 0;
        } else if (ordenPrecio === "asc") {
          return a.precio_por_noche - b.precio_por_noche;
        } else if (ordenPrecio === "desc") {
          return b.precio_por_noche - a.precio_por_noche;
        } else if (ordenPrecio === "valoracion") {
          return (mediaValoraciones[b.id] || 0) - (mediaValoraciones[a.id] || 0);
        }
        return 0;
      });
    };

    const filteredRecs = sortProperties(filterProperties(recomendaciones));

    const filteredAll = sortProperties(filterProperties(propiedades.filter(
      p => !recomendaciones.some(r => r.id === p.id)
    )));

    const combined = [...filteredRecs, ...filteredAll];

    setPropiedadesFiltradas(combined);

    combined.forEach((propiedad) => {
      if (!url[propiedad.id]) fetchPropertyPhotos(propiedad.id);
      if (!mediaValoraciones[propiedad.id]) fetchMediaValoraciones(propiedad.id);
    });
  }, [tipoPropiedad, precioRango, habitaciones, camas, propiedades, recomendaciones, ordenPrecio, ciudad]);


  useEffect(() => {
    fetchAllProperties();
    fetchFavoritos();
    actualizarFavoritosNavbar();
  }, []);


  const fetchFavoritos = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/propiedades/favoritos-por-usuario/${usuarioId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setFavoritos(data);
        actualizarFavoritosNavbar();
      } else {
        throw new Error("Error al obtener los favoritos");
      }
    } catch (error) {
      console.error("Error al obtener los favoritos:", error);
    }
  };

  const toggleFavorito = async (propiedadId, retried = false) => {
    try {
      const propiedadIdNum = parseInt(propiedadId);
      const favorito = favoritos.find((favorito) => favorito.propiedad === propiedadId && favorito.usuario === JSON.parse(localStorage.getItem("additionalInfo"))?.usuarioId);
      const isFavorito = !!favorito;

      const favoritoId = favoritos.find((favorito) => favorito.propiedad === propiedadId)?.id;

      if (isFavorito) {
        const data = await fetch(`http://localhost:8000/api/propiedades/favoritos/${favoritoId}/`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        });
        if (data.status === 401 && !retried) {
          const token = await refreshAccessToken();
          if (token) {
            toggleFavorito(propiedadId, true);
          }
          else {
            throw new Error("Error al refrescar el token");
          }
        }
      } else if (!isFavorito) {
        const data = await fetch("http://localhost:8000/api/propiedades/favoritos/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
          body: JSON.stringify({ propiedad: propiedadIdNum, usuario: JSON.parse(localStorage.getItem("additionalInfo"))?.usuarioId }),
        });
        if (data.status === 401 && !retried) {
          const token = await refreshAccessToken();
          if (token) {
            toggleFavorito(propiedadId, true);
          } else {
            throw new Error("Error al refrescar el token");
          }
        }
      }
      fetchFavoritos();
      actualizarFavoritosNavbar();
    } catch (error) {
      console.error("Error al añadir a favoritos:", error);
    }
  };


  const fetchMediaValoraciones = async (propiedadId) => {
    try {
      const response = await fetch(`http://localhost:8000/api/propiedades/valoraciones-propiedades/${propiedadId}/media-valoraciones/`);
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

          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              gap: 2,

            }}
          >
            <Box sx={{
              width: { xs: "100%", md: "25%" },
              transition: "all 0.3s ease",
              maxHeight: { md: "calc(100vh - 180px)" },
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
                    py: 1.5,
                    px: 3,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between"
                  }}
                >
                  <Typography variant="subtitle1" sx={{ fontWeight: "bold", color: "white" }}>
                    Filtros Avanzados
                  </Typography>
                  <FilterListIcon sx={{ color: "white", fontSize: "1.2rem" }} />
                </Box>
                <Box sx={{ p: 2 }}>
                  <Stack spacing={2}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Ciudad</InputLabel>
                      <Select
                        value={ciudad}
                        label="Ciudad"
                        onChange={(e) => setCiudad(e.target.value)}
                        sx={{ '& .MuiOutlinedInput-notchedOutline': { borderRadius: "12px" } }}
                      >
                        <MenuItem value="">Todas</MenuItem>
                        {ciudadesEspana.map((ciudad, index) => (
                          <MenuItem key={index} value={ciudad}>
                            {ciudad}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: "bold", mb: 0.5 }}>
                        Rango de precio (€)
                      </Typography>
                      <Box sx={{ px: 1 }}>
                        <Slider
                          value={precioRango}
                          onChange={(e, newValue) => setPrecioRango(newValue)}
                          valueLabelDisplay="auto"
                          min={0}
                          max={1000}
                          size="small"
                          sx={{
                            color: "#091630",
                            '& .MuiSlider-thumb': {
                              height: 16,
                              width: 16,
                              backgroundColor: '#fff',
                              border: '2px solid #091630',
                              '&:hover, &.Mui-focusVisible': {
                                boxShadow: `0px 0px 0px 6px rgba(9, 22, 48, 0.16)`
                              }
                            },
                            '& .MuiSlider-valueLabel': {
                              backgroundColor: "#091630"
                            }
                          }}
                        />
                      </Box>
                      <Box sx={{ display: "flex", justifyContent: "space-between", mt: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">
                          {precioRango[0]}€
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {precioRango[1]}€
                        </Typography>
                      </Box>
                    </Box>

                    <FormControl fullWidth size="small">
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
                            <HomeIcon sx={{ mr: 1, color: "#091630", fontSize: "0.9rem" }} />
                            Apartamento
                          </Box>
                        </MenuItem>
                        <MenuItem value="Casa">
                          <Box sx={{ display: "flex", alignItems: "center" }}>
                            <HomeIcon sx={{ mr: 1, color: "#091630", fontSize: "0.9rem" }} />
                            Casa
                          </Box>
                        </MenuItem>
                        <MenuItem value="Villa">
                          <Box sx={{ display: "flex", alignItems: "center" }}>
                            <HomeIcon sx={{ mr: 1, color: "#091630", fontSize: "0.9rem" }} />
                            Villa
                          </Box>
                        </MenuItem>
                      </Select>
                    </FormControl>

                    <Box sx={{ display: "flex", gap: 1, }}>
                      {[
                        {
                          label: "Habitaciones",
                          value: habitaciones,
                          setter: setHabitaciones,
                          icon: <BedIcon sx={{ color: "#091630", fontSize: "0.9rem" }} />
                        },
                        {
                          label: "Camas",
                          value: camas,
                          setter: setCamas,
                          icon: <HotelIcon sx={{ color: "#091630", fontSize: "0.9rem" }} />
                        },
                      ].map((counter, index) => (
                        <Box
                          key={index}
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            border: "1px solid",
                            borderColor: "grey.300",
                            borderRadius: "12px",
                            p: 1,
                            flex: 1,
                            transition: "all 0.2s ease",
                            '&:hover': {
                              borderColor: "primary.main",
                              boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
                            }
                          }}
                        >
                          <Box sx={{ display: "flex", alignItems: "center", mb: 0.5 }}>
                            {counter.icon}
                            <Typography variant="caption" sx={{ ml: 0.5, fontWeight: 500 }}>
                              {counter.label}
                            </Typography>
                          </Box>
                          <Box sx={{ display: "flex", alignItems: "center" }}>
                            <IconButton
                              onClick={() => counter.setter(Math.max(0, counter.value - 1))}
                              disabled={counter.value === 0}
                              size="small"
                              sx={{
                                bgcolor: "grey.100",
                                "&:hover": { bgcolor: "grey.200" },
                                width: 16,
                                height: 16
                              }}
                            >
                              <RemoveIcon fontSize="small" />
                            </IconButton>
                            <Typography
                              sx={{
                                width: 24,
                                textAlign: "center",
                                fontWeight: "bold",
                                mx: 0.5
                              }}
                            >
                              {counter.value}
                            </Typography>
                            <IconButton
                              onClick={() => counter.setter(Math.min(15, counter.value + 1))}
                              disabled={counter.value === 15}
                              size="small"
                              sx={{
                                "&:hover": { bgcolor: "grey.200" },
                                width: 16,
                                height: 16
                              }}
                            >
                              <AddIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </Box>
                      ))}
                    </Box>

                    <FormControl fullWidth size="small">
                      <InputLabel>Ordenar por precio</InputLabel>
                      <Select
                        value={ordenPrecio}
                        label="Ordenar por precio"
                        onChange={(e) => setOrdenPrecio(e.target.value)}
                        IconComponent={SortIcon}
                        sx={{ '& .MuiOutlinedInput-notchedOutline': { borderRadius: "12px" } }}
                      >
                        <MenuItem value="recomendaciones">Recomendaciones</MenuItem>
                        <MenuItem value="asc">De menor a mayor precio</MenuItem>
                        <MenuItem value="desc">De mayor a menor precio</MenuItem>
                        <MenuItem value="valoracion">Por valoración</MenuItem>
                      </Select>
                    </FormControl>

                    <Box sx={{ display: "flex", justifyContent: "center" }}>
                      <Button
                        variant="outlined"
                        size="small"
                        sx={{
                          borderRadius: "30px",
                          borderColor: "#091630",
                          color: "#091630",
                          fontSize: "0.8rem",
                          px: 2,
                          py: 0.5,
                          '&:hover': {
                            bgcolor: 'rgba(9, 22, 48, 0.04)',
                            borderColor: "#091630",
                          }
                        }}
                        onClick={() => {
                          setPrecioRango([0, 1000]);
                          setTipoPropiedad("");
                          setHabitaciones(0);
                          setCamas(0);
                          setOrdenPrecio("recomendaciones");
                          setCiudad("");
                        }}
                      >
                        Limpiar filtros
                      </Button>
                    </Box>
                  </Stack>
                </Box>
              </Paper>
            </Box>

            <Box
              sx={{
                width: { xs: "100%", md: "75%" },
              }}
            >
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
                    <MenuItem value="recomendaciones">Recomendaciones</MenuItem>
                    <MenuItem value="asc">Precio: Menor a mayor</MenuItem>
                    <MenuItem value="desc">Precio: Mayor a menor</MenuItem>
                    <MenuItem value="valoracion">Por valoración</MenuItem>
                  </Select>
                </FormControl>
              </Box>

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


                        {isAuthenticated() ? (
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
                            {favoritos.filter(favorito => favorito.propiedad === propiedad.id && favorito.usuario === JSON.parse(localStorage.getItem("additionalInfo")).usuarioId).length > 0 ? (
                              <FavoriteIcon sx={{ color: "#e91e63" }} />
                            ) : (
                              <FavoriteBorderIcon sx={{ color: "#091630" }} />
                            )}
                          </IconButton>
                        ) : null}

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

                        <Box sx={{ mb: 1 }}>
                          <Chip
                            icon={<LocationOnIcon />}
                            label={propiedad.ciudad || "España"}
                            size="small"
                            sx={{
                              bgcolor: "#f0f4f8",
                              fontSize: "0.75rem",
                              height: 24
                            }}
                          />
                        </Box>

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
                      setOrdenPrecio("recomendaciones");
                      setCiudad("");
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