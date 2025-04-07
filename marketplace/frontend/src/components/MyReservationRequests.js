import {
    Box,
    Button,
    CircularProgress,
    Container,
    Paper,
    Typography,
    Accordion,
    AccordionDetails,
    AccordionSummary,
    MenuItem,
    InputLabel,
    FormControl,
    Select,
    Stack,
    Chip,
    Divider,
    Card,
    CardMedia,
    CardContent,
    CardActions,
    Alert,
    useTheme,
    useMediaQuery
} from "@mui/material";
import { useState, useEffect } from "react";
import refreshAccessToken from "./RefreshToken";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import PendingIcon from "@mui/icons-material/Pending";
import SortIcon from "@mui/icons-material/Sort";
import FilterListIcon from "@mui/icons-material/FilterList";

const MyReservationRequests = () => {
    const usuarioId = JSON.parse(localStorage.getItem("additionalInfo")).usuarioId;
    const [solicitudes, setSolicitudes] = useState([]);
    const [propiedades, setPropiedades] = useState([]);
    const [loading, setLoading] = useState(true);
    const [urls, setUrls] = useState([]);
    const [estado, setEstado] = useState("");
    const [ordenFechaLLegada, setOrdenFechaLLegada] = useState("asc");
    const [solicitudesFiltradas, setSolicitudesFiltradas] = useState([]);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    useEffect(() => {
        fetchSolicitudes();
        const intervalId = setInterval(fetchSolicitudes, 60000);
        return () => clearInterval(intervalId);
    }, []);

    useEffect(() => {
        if (solicitudes.length !== 0) {
            const filteredSolicitudes = solicitudes.filter((solicitud) => {
                return (estado === "" || solicitud.estado === estado);
            });
            const sortedSolicitudes = filteredSolicitudes.sort((a, b) => {
                if (ordenFechaLLegada === "asc") {
                    return new Date(a.fecha_llegada) - new Date(b.fecha_llegada);
                } else {
                    return new Date(b.fecha_llegada) - new Date(a.fecha_llegada);
                }
            });
            setSolicitudesFiltradas(sortedSolicitudes);
        }
    }, [estado, ordenFechaLLegada, solicitudes]);

    const handleLogOut = () => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        window.location.reload();
    }

    const handleEstadoChange = (e) => {
        setEstado(e.target.value);
    }

    const fetchSolicitudes = async (retried = false) => {
        try {
            const response = await fetch(`http://localhost:8000/api/propiedades/solicitudes-reserva-anfitrion/${usuarioId}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("accessToken")}`
                }
            });
            if (response.status === 401 && !retried) {
                console.log("Token expirado");
                const token = await refreshAccessToken();
                if (token) {
                    fetchSolicitudes(true);
                } else {
                    console.log("Token inválido, cerrando sesión...");
                    handleLogOut();
                }
            } else if (response.ok) {
                const data = await response.json();
                const dataFiltered = data.filter((solicitud) => solicitud.anfitrion === JSON.parse(localStorage.getItem("additionalInfo")).usuarioId);
                setSolicitudes(dataFiltered);
                setLoading(false);
                if (dataFiltered.length > 0) {
                    fetchPropiedades(dataFiltered);
                } else {
                    setLoading(false);
                }
            } else {
                console.log("Error al obtener las solicitudes de reserva");
            }
        } catch (error) {
            console.error("Error al obtener las solicitudes de reserva", error);
        }
    }

    const fetchPropiedades = async (solicitudes) => {
        const propiedadIds = solicitudes.map((solicitud) => solicitud.propiedad);
        const uniquePropiedadIds = [...new Set(propiedadIds)];
        try {
            const PropiedadesPromises = uniquePropiedadIds.map((propiedadId) =>
                fetch(`http://localhost:8000/api/propiedades/propiedades/${propiedadId}/`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localStorage.getItem("accessToken")}`
                    }
                }).then((response) => response.json())
            );
            const propiedadesData = await Promise.all(PropiedadesPromises);
            setPropiedades(propiedadesData);
            fetchFotosPropiedades(propiedadesData);
        } catch (error) {
            console.error("Error al obtener las propiedades", error);
        }
    }

    const fetchFotosPropiedades = async (propiedades) => {
        try {
            const response = await fetch("http://localhost:8000/api/propiedades/fotos-propiedades/", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("accessToken")}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                const dataFiltered = data.filter(foto => propiedades.some(propiedad => propiedad.id === foto.propiedad) && foto.es_portada);
                setUrls(dataFiltered);
            }
        } catch (error) {
            console.error("Error al obtener las fotos de las propiedades", error);
        }
    }

    const handleAccept = async (solicitudId) => {
        try {
            const response = await fetch(`http://localhost:8000/api/propiedades/reservas/${solicitudId}/`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("accessToken")}`
                },
                body: JSON.stringify({ estado: "Aceptada", fecha_aceptacion_rechazo: new Date() })
            });
            if (response.ok) {
                const updatedSolicitud = response.json();
                setSolicitudes(solicitudes.map(solicitud => solicitud.id === solicitudId ? updatedSolicitud : solicitud));
                window.location.reload();
            } else {
                console.log("Error al aceptar la solicitud de reserva con id", solicitudId);
            }
        } catch (error) {
            console.error("Error al aceptar la solicitud de reserva con id", solicitudId, error);
        }
    }

    const handleDecline = async (solicitudId) => {
        try {
            const response = await fetch(`http://localhost:8000/api/propiedades/reservas/${solicitudId}/`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("accessToken")}`
                },
                body: JSON.stringify({ estado: "Cancelada", fecha_aceptacion_rechazo: new Date() })
            });
            if (response.ok) {
                const updatedSolicitud = response.json();
                setSolicitudes(solicitudes.map(solicitud => solicitud.id === solicitudId ? updatedSolicitud : solicitud));
                window.location.reload();
            } else {
                console.log("Error al rechazar la solicitud de reserva con id", solicitudId);
            }
        } catch (error) {
            console.error("Error al rechazar la solicitud de reserva con id", solicitudId, error);
        }
    }

    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('es-ES', options);
    };

    const getStatusChip = (status) => {
        switch (status) {
            case "Pendiente":
                return <Chip icon={<PendingIcon />} label="Pendiente" color="warning" size="small" />;
            case "Aceptada":
                return <Chip icon={<CheckCircleIcon />} label="Confirmada" color="success" size="small" />;
            case "Cancelada":
                return <Chip icon={<CancelIcon />} label="Cancelada" color="error" size="small" />;
            default:
                return <Chip label={status} size="small" />;
        }
    };

    return (
        <Box sx={{
            display: "flex",
            flexDirection: "column",
            bgcolor: theme.palette.background.default,
            width: "100%",
            minHeight: "80vh",
            px: isMobile ? 1 : 3,
            py: 3
        }}>
            {loading ? (
                <Box sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: "70vh"
                }}>
                    <CircularProgress />
                </Box>
            ) : (
                <Container maxWidth="lg" disableGutters>
                    <Stack spacing={3} width="100%">
                        <Typography variant="h4" component="h1" sx={{
                            fontWeight: 600,
                            textAlign: "center",
                            color: theme.palette.text.primary,
                            mb: 2
                        }}>
                            Solicitudes de Reserva
                        </Typography>

                        {solicitudes?.length !== 0 && (
                            <Accordion
                                elevation={2}
                                sx={{
                                    borderRadius: 1,
                                    overflow: 'hidden',
                                    '&:before': { display: 'none' },
                                }}
                            >
                                <AccordionSummary
                                    expandIcon={<ExpandMoreIcon />}
                                    sx={{
                                        backgroundColor: theme.palette.primary.light,
                                        color: theme.palette.primary.contrastText
                                    }}
                                >
                                    <Stack direction="row" spacing={1} alignItems="center">
                                        <FilterListIcon />
                                        <Typography variant="subtitle1" fontWeight={500}>Filtros y Ordenación</Typography>
                                    </Stack>
                                </AccordionSummary>
                                <AccordionDetails>
                                    <Stack
                                        direction={isMobile ? "column" : "row"}
                                        spacing={2}
                                        sx={{ width: "100%" }}
                                    >
                                        <FormControl fullWidth size="small">
                                            <InputLabel>Estado de la reserva</InputLabel>
                                            <Select
                                                value={estado}
                                                label="Estado de la reserva"
                                                onChange={handleEstadoChange}
                                            >
                                                <MenuItem value=""><em>Todos</em></MenuItem>
                                                <MenuItem value="Pendiente">Pendiente</MenuItem>
                                                <MenuItem value="Aceptada">Confirmada</MenuItem>
                                                <MenuItem value="Cancelada">Cancelada</MenuItem>
                                            </Select>
                                        </FormControl>
                                        <FormControl fullWidth size="small">
                                            <InputLabel>Ordenar por fecha</InputLabel>
                                            <Select
                                                value={ordenFechaLLegada}
                                                label="Ordenar por fecha"
                                                onChange={(e) => setOrdenFechaLLegada(e.target.value)}
                                                startAdornment={<SortIcon sx={{ mr: 1, color: theme.palette.text.secondary }} />}
                                            >
                                                <MenuItem value="asc">Próximas primero</MenuItem>
                                                <MenuItem value="desc">Antiguas primero</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Stack>
                                </AccordionDetails>
                            </Accordion>
                        )}

                        {solicitudes.length === 0 ? (
                            <Paper
                                sx={{
                                    p: 4,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    borderRadius: 2,
                                    boxShadow: '0 2px 10px rgba(0,0,0,0.08)'
                                }}
                            >
                                <Typography
                                    variant="h6"
                                    sx={{
                                        color: '#718096',
                                        textAlign: 'center'
                                    }}
                                >
                                    No tienes solicitudes de reserva
                                </Typography>
                            </Paper>
                        ) : (
                            solicitudesFiltradas.length === 0 ? (
                                <Alert severity="info" sx={{ mt: 2 }}>
                                    No hay solicitudes que coincidan con los filtros aplicados
                                </Alert>
                            ) : (
                                <Stack spacing={2}>
                                    {solicitudesFiltradas.map((solicitud) => {
                                        const propiedad = propiedades.find((propiedad) => propiedad.id === solicitud.propiedad);
                                        const imagenUrl = urls.find((url) => url.propiedad === solicitud.propiedad)?.foto || "https://via.placeholder.com/150";

                                        return (
                                            <Card key={solicitud.id} sx={{
                                                width: "100%",
                                                overflow: "hidden",
                                                transition: "transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
                                                '&:hover': {
                                                    boxShadow: 6,
                                                    transform: 'translateY(-2px)'
                                                }
                                            }}>
                                                <Stack direction={isMobile ? "column" : "row"}>
                                                    <CardMedia
                                                        component="img"
                                                        image={imagenUrl}
                                                        alt={propiedad?.nombre || "Propiedad"}
                                                        sx={{
                                                            width: isMobile ? "100%" : 200,
                                                            height: isMobile ? 140 : 200,
                                                            objectFit: "cover"
                                                        }}
                                                    />
                                                    <Box sx={{ display: "flex", flexDirection: "column", width: "100%" }}>
                                                        <CardContent sx={{ flex: "1 0 auto", pb: 1 }}>
                                                            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                                                                <Typography variant="h6" component="div" sx={{
                                                                    fontWeight: 600,
                                                                    color: theme.palette.primary.main
                                                                }}>
                                                                    <a style={{
                                                                        textDecoration: "none",
                                                                        color: "inherit",
                                                                        transition: "color 0.2s",
                                                                        '&:hover': {
                                                                            color: theme.palette.primary.dark
                                                                        }
                                                                    }} href={`/detalles/${propiedad?.id}`}>
                                                                        {propiedad ? propiedad.nombre : `Propiedad #${solicitud.propiedad}`}
                                                                    </a>
                                                                </Typography>
                                                                {getStatusChip(solicitud.estado)}
                                                            </Stack>

                                                            <Divider sx={{ my: 1 }} />

                                                            <Stack spacing={1} sx={{ mt: 1 }}>
                                                                <Typography variant="body2" color="text.secondary">
                                                                    <strong>Llegada:</strong> {formatDate(solicitud.fecha_llegada)}
                                                                </Typography>
                                                                <Typography variant="body2" color="text.secondary">
                                                                    <strong>Salida:</strong> {formatDate(solicitud.fecha_salida)}
                                                                </Typography>
                                                            </Stack>
                                                        </CardContent>

                                                        {solicitud.estado === "Pendiente" ? (
                                                            <CardActions sx={{
                                                                justifyContent: isMobile ? "center" : "flex-end",
                                                                px: 2,
                                                                pb: 2
                                                            }}>
                                                                <Button
                                                                    variant="contained"
                                                                    color="primary"
                                                                    href={`/informacion-reserva/${solicitud.id}`}
                                                                    startIcon={<SortIcon />}
                                                                    size="small"
                                                                >Ver Detalles</Button>
                                                                <Button
                                                                    variant="contained"
                                                                    color="error"
                                                                    onClick={() => handleDecline(solicitud.id)}
                                                                    startIcon={<CancelIcon />}
                                                                    size="small"
                                                                >
                                                                    Rechazar
                                                                </Button>
                                                                <Button
                                                                    variant="contained"
                                                                    color="success"
                                                                    onClick={() => handleAccept(solicitud.id)}
                                                                    startIcon={<CheckCircleIcon />}
                                                                    size="small"
                                                                    sx={{ ml: 1 }}
                                                                >
                                                                    Aceptar
                                                                </Button>
                                                            </CardActions>
                                                        ) : (
                                                            <CardActions sx={{
                                                                justifyContent: isMobile ? "center" : "flex-end",
                                                                px: 2,
                                                                pb: 2
                                                            }}>
                                                                <Button
                                                                    variant="contained"
                                                                    color="primary"
                                                                    href={`/informacion-reserva/${solicitud.id}`}
                                                                    startIcon={<SortIcon />}
                                                                    size="small"
                                                                >Ver Detalles</Button>
                                                            </CardActions>
                                                        )}
                                                    </Box>
                                                </Stack>
                                            </Card>
                                        );
                                    })}
                                </Stack>
                            )
                        )}
                    </Stack>
                </Container>
            )}
        </Box>
    );
}

export default MyReservationRequests;