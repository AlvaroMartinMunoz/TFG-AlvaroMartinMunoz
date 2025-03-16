import { Accordion, Box, CircularProgress, Container, Paper, Typography, AccordionSummary, Button, TextField, Select, MenuItem, FormControl, InputLabel } from "@mui/material";
import { useState, useEffect, use } from "react";
import refreshAccessToken from "./RefreshToken";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { AccordionDetails } from "@mui/material";



const MyReserves = () => {

    const [misReservas, setMisReservas] = useState([]);
    const [propiedades, setPropiedades] = useState([]);
    const [url, setUrl] = useState([]);
    const [imageLoading, setImageLoading] = useState({});
    const [loading, setLoading] = useState(true);
    const [misReservasFiltradas, setMisReservasFiltradas] = useState([]);
    const [estado, setEstado] = useState("");
    const [ordenFechaLLegada, setOrdenFechaLLegada] = useState("asc");

    useEffect(() => {
        if (misReservas.length !== 0) {
            const filteredReserves = misReservas.filter((reserva) => {
                return (!estado || reserva.estado === estado);
            });
            const sortedReserves = filteredReserves.sort((a, b) => {
                const dateA = new Date(a.fecha_llegada);
                const dateB = new Date(b.fecha_llegada);
                if (isNaN(dateA) || isNaN(dateB)) {
                    return 0;
                }
                if (ordenFechaLLegada === "asc") {
                    return dateA - dateB;
                } else {
                    return dateB - dateA;
                }
            });
            setMisReservasFiltradas(sortedReserves);
        }
    }, [estado, misReservas, ordenFechaLLegada]);

    const handleEstadoChange = (e) => {
        setEstado(e.target.value);
    };




    useEffect(() => {
        fethReservas();
        const intervalId = setInterval(fethReservas, 60000);
        return () => clearInterval(intervalId);
    }

        , []);

    useEffect(() => {

        const fetchData = async () => {
            const photoPromises = misReservas.map((reserva) => fetchPropertyPhotos(reserva.propiedad));
            await Promise.all(photoPromises);
            setLoading(false);
        }
        fetchData();

    }, [propiedades]);

    const handleLogOut = () => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        window.location.reload();
    }

    const cancelarReserva = async (reservaId) => {
        try {
            const response = await fetch(`http://localhost:8000/api/propiedades/reservas/${reservaId}/`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("accessToken")}`
                },
                body: JSON.stringify({ estado: "Cancelada", fecha_aceptacion_rechazo: new Date() })
            });
            if (response.ok) {
                console.log("Reserva cancelada");
                fethReservas();
            } else {
                console.log("Error al cancelar la reserva");
            }
        } catch (error) {
            console.error("Error al cancelar la reserva", error);
        }
    };

    const fethReservas = async (retried = false) => {
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
                    fethReservas(true);
                } else {
                    console.log("Token inválido, cerrando sesión...");
                    handleLogOut();
                }
            } else if (response.ok) {
                const data = await response.json();
                const dataFiltered = data.filter(reserva => reserva.usuario === JSON.parse(localStorage.getItem("additionalInfo")).usuarioId);
                setMisReservas(dataFiltered);
                fetchProperties(dataFiltered);
                console.log(dataFiltered);

            } else {
                console.log("Error al obtener las reservas");
            }
        }
        catch (error) {
            console.error("Error al obtener las reservas", error);
        }
    };

    const fetchProperties = async (reservas, retried = false) => {
        const propiedadesData = {};
        for (const reserva of reservas) {
            try {
                const response = await fetch(`http://localhost:8000/api/propiedades/propiedades/${reserva.propiedad}/`, {
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
                        fetchProperties(reservas, true);
                    } else {
                        console.log("Token inválido, cerrando sesión...");
                        handleLogOut();
                    }
                } else if (response.ok) {
                    const data = await response.json();

                    propiedadesData[reserva.propiedad] = data;
                } else {
                    console.log("Error al obtener las propiedades");
                }
            }
            catch (error) {
                console.error("Error al obtener las propiedades", error);
            }
        }
        setPropiedades(propiedadesData);
    };

    const fetchPropertyPhotos = async (propiedadId) => {
        setImageLoading((prev) => ({ ...prev, [propiedadId]: true }));
        try {
            const response = await fetch("http://localhost:8000/api/propiedades/fotos-propiedades/");
            if (response.ok) {
                const data = await response.json();
                const filteredData = data.filter((foto) => foto.propiedad === parseInt(propiedadId));
                const portadaFoto = filteredData.find((foto) => foto.es_portada);
                const url = await portadaFoto ? portadaFoto.foto : "https://source.unsplash.com/1600x900/?house";
                setUrl((prev) => ({ ...prev, [propiedadId]: url }));
                setImageLoading((prev) => ({ ...prev, [propiedadId]: false }));
            }
        } catch (error) {
            console.log(error);
        }
    };


    return (
        <Box sx={{ display: 'flex', minHeight: '80vh', flexDirection: 'column', backgroundColor: '#f4f7fc', width: '100%' }}>
            <Container sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', flexDirection: 'column', width: '100%' }}>
                <Typography variant="h4" sx={{ mt: 2, mb: 2 }}>Mis Reservas</Typography>
                {misReservas?.length !== 0 ? (
                    <Accordion sx={{ width: "100%" }}>
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
                                        <MenuItem value="Aceptada">Confirmada</MenuItem>
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

                {misReservas.length === 0 ? (
                    <Typography variant="h6" sx={{ mt: 4, color: "red" }}>No tienes reservas</Typography>
                ) : (
                    misReservasFiltradas.length === 0 ? (
                        <Typography variant="h6" sx={{ mt: 4, color: "red" }}>No hay reservas que cumplan los filtros seleccionados</Typography>
                    ) : (
                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", flexWrap: "wrap", width: "100%", padding: "20px", borderRadius: "10px", overflow: "auto", }}>
                            {misReservasFiltradas?.map((reserva, index) => {
                                const propiedad = propiedades[reserva.propiedad];
                                return (
                                    <Paper key={index}
                                        elevation={3}
                                        sx={{
                                            backgroundColor: "white",
                                            flex: "0 0 calc(27.333% - 16px)",
                                            display: "flex",
                                            flexDirection: "column",
                                            justifyContent: "center",
                                            alignItems: "center",
                                            borderRadius: 2,
                                            overflow: "hidden",
                                            mt: 2,
                                            mr: 2,
                                            ml: 2,
                                        }}>
                                        {imageLoading[propiedad?.id] ? (
                                            <CircularProgress />
                                        ) : (
                                            <img src={url[propiedad?.id]} alt="propiedad" style={{ width: "100%", height: "200px", objectFit: "cover", borderRadius: "8px" }} />

                                        )}
                                        <Box sx={{ p: 2, width: "100%" }}>
                                            <Typography variant="h6" gutterBottom> <a
                                                href={`/detalles/${propiedad?.id}`}
                                                style={{ textDecoration: "none", color: "inherit" }}><strong>{propiedad?.nombre}</strong></a></Typography>
                                            <Typography variant="body2" gutterBottom><strong>Fecha de inicio:</strong> {reserva?.fecha_llegada}</Typography>
                                            <Typography variant="body2" gutterBottom><strong>Fecha de fin: </strong>{reserva?.fecha_salida}</Typography>
                                            <Typography variant="body2" gutterBottom><strong>Método de Pago: </strong>{reserva?.metodo_pago}</Typography>
                                            <Typography variant="body2" gutterBottom><strong>Precio total: </strong> {reserva?.precio_total}€</Typography>
                                            <Typography variant="body2" gutterBottom><strong>Estado: </strong>{reserva?.estado}</Typography>
                                            {reserva.estado === "Pendiente" && (
                                                <Button variant="contained" color="secondary" onClick={() => cancelarReserva(reserva.id)} disabled={reserva.estado !== "Pendiente"}>Cancelar Reserva</Button>
                                            )}
                                        </Box>


                                    </Paper>
                                );
                            })}
                        </Box>
                    )
                )}
            </Container>
        </Box>
    );
};


export default MyReserves;