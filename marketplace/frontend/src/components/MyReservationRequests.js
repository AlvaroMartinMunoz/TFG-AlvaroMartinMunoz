import { Box, Button, CircularProgress, Container, Paper, Typography, Accordion, AccordionDetails, AccordionSummary, MenuItem, InputLabel, FormControl, Select } from "@mui/material";
import { useState, useEffect, use } from "react";
import refreshAccessToken from "./RefreshToken";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";



const MyReservationRequests = () => {
    const [solicitudes, setSolicitudes] = useState([]);
    const [propiedades, setPropiedades] = useState([]);
    const [loading, setLoading] = useState(true);
    const [urls, setUrls] = useState([]);
    const [estado, setEstado] = useState("");
    const [ordenFechaLLegada, setOrdenFechaLLegada] = useState("asc");
    const [solicitudesFiltradas, setSolicitudesFiltradas] = useState([]);



    useEffect(() => {

        fetchSolicitudes();
        const intervalId = setInterval(fetchSolicitudes, 60000);
        return () => clearInterval(intervalId);
    }, []);

    useEffect(() => {
        if (solicitudes.length !== 0) {
            const filteredSolicitudes = solicitudes.filter((solicitud) => {
                return (!estado || solicitud.estado === estado);
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
    }, [estado, ordenFechaLLegada]);

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
            const response = await fetch("http://localhost:8000/api/propiedades/reservas/", {
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
                console.log(dataFiltered);
                console.log(JSON.parse(localStorage.getItem("additionalInfo")).usuarioId);
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
                console.log(dataFiltered);
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
                body: JSON.stringify({ estado: "Aceptada", fecha_aceptacion: new Date().toISOString() })
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
                body: JSON.stringify({ estado: "Cancelada" })
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



    return (
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", minHeight: "80vh", backgroundColor: "#f4f7fc", width: "100%" }}>
            {loading ? (
                <Container maxWidth={false} sx={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "80vh", flexDirection: "column", width: "100%" }}>
                    <CircularProgress />
                </Container>
            ) : (
                <Container maxWidth={false} sx={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "80vh", flexDirection: "column", width: "100%" }}>
                    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: "100%" }}>
                        <Typography variant="h4" sx={{ marginBottom: 2, mt: 2 }}>Solicitudes de reserva</Typography>
                    </Box>
                    {solicitudes?.length !== 0 ? (
                        <Accordion sx={{ width: "100%", mb: 2 }}>
                            <AccordionSummary
                                expandIcon={<ExpandMoreIcon />}>
                                <Typography variant="h6">Filtros</Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Box sx={{ display: "flex", flexDirection: "row", width: "100%" }}>
                                    <FormControl fullWidth sx={{ mb: 2 }} size="small">
                                        <InputLabel>Estado</InputLabel>
                                        <Select name="estado" value={estado} onChange={handleEstadoChange}>
                                            <MenuItem value=""><em>None</em></MenuItem>
                                            <MenuItem value="Pendiente">Pendiente</MenuItem>
                                            <MenuItem value="Confirmada">Confirmada</MenuItem>
                                            <MenuItem value="Cancelada">Cancelada</MenuItem>
                                        </Select>
                                    </FormControl>
                                    <FormControl fullWidth sx={{ mb: 2 }} size="small">
                                        <InputLabel>Ordenar por fecha de llegada</InputLabel>
                                        <Select
                                            value={ordenFechaLLegada}
                                            label="Ordenar por fecha de llegada"
                                            onChange={(e) => setOrdenFechaLLegada(e.target.value)}
                                        >
                                            <MenuItem value="asc">Ascendente</MenuItem>
                                            <MenuItem value="desc">Descendente</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Box>
                            </AccordionDetails>
                        </Accordion>
                    ) : null}
                    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: "100%" }}>
                        {solicitudes.length === 0 ? (
                            <Typography variant="h6">No tienes solicitudes de reserva</Typography>
                        ) : (
                            solicitudesFiltradas.map((solicitud) => {
                                const propiedad = propiedades.find((propiedad) => propiedad.id === solicitud.propiedad);
                                return (
                                    <Box key={solicitud.id} sx={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "center", width: "100%" }}>
                                        <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "center", width: "80%" }}>
                                            <Paper sx={{ width: "100%", padding: 2, marginBottom: 2, display: "flex", alignItems: "center", boxShadow: 3 }} elevation={3}>
                                                <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "flex-start", width: "100%" }}>
                                                    <Box sx={{ width: "150px", height: "150px", marginRight: 2 }}>
                                                        <img src={urls.find((url) => url.propiedad === solicitud.propiedad)?.foto || "ruta-a-imagen-por-defecto.jpg"} alt="propiedad" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "8px" }} />
                                                    </Box>
                                                    <Box sx={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
                                                        <Typography variant="h6" sx={{ fontWeight: "bold" }}>{propiedad ? propiedad.nombre : solicitud.propiedad}</Typography>
                                                        <Typography variant="body1"><strong>Fecha de inicio:</strong> {solicitud.fecha_llegada}</Typography>
                                                        <Typography variant="body1"><strong>Fecha de fin:</strong> {solicitud.fecha_salida}</Typography>
                                                        <Typography variant="body1"><strong>Estado:</strong> {solicitud.estado}</Typography>
                                                    </Box>
                                                    {solicitud.estado === "Aceptada" ? (
                                                        <Typography variant="body1" sx={{ fontWeight: "bold", color: "green", marginLeft: 2 }}>Aceptada</Typography>
                                                    ) : solicitud.estado === "Cancelada" ? (
                                                        <Typography variant="body1" sx={{ fontWeight: "bold", color: "red", marginLeft: 2 }}>Rechazada</Typography>
                                                    ) : (
                                                        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", marginLeft: 2, width: "150px" }}>
                                                            <Button variant="contained" sx={{ bgcolor: "green", marginBottom: 1, width: "100%" }} onClick={() => handleAccept(solicitud.id)}>Aceptar</Button>
                                                            <Button variant="contained" sx={{ bgcolor: "red", width: "100%" }} onClick={() => handleDecline(solicitud.id)}>Rechazar</Button>
                                                        </Box>
                                                    )}
                                                </Box>
                                            </Paper>
                                        </Box>
                                    </Box>
                                );
                            })
                        )}
                    </Box>
                </Container>
            )}
        </Box>
    );
}
export default MyReservationRequests;