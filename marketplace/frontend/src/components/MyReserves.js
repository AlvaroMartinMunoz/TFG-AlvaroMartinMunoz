import {
    Accordion,
    Box,
    CircularProgress,
    Container,
    Paper,
    Typography,
    AccordionSummary,
    Button,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Chip,
    Stack,
    Alert
} from "@mui/material";
import { useState, useEffect } from "react";
import refreshAccessToken from "./RefreshToken";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import FilterListIcon from "@mui/icons-material/FilterList";
import { AccordionDetails } from "@mui/material";
import { useLocation } from "react-router-dom";

const MyReserves = () => {
    const usuarioId = JSON.parse(localStorage.getItem("additionalInfo")).usuarioId;
    const [misReservas, setMisReservas] = useState([]);
    const [propiedades, setPropiedades] = useState([]);
    const [url, setUrl] = useState([]);
    const [imageLoading, setImageLoading] = useState({});
    const [loading, setLoading] = useState(true);
    const [misReservasFiltradas, setMisReservasFiltradas] = useState([]);
    const [estado, setEstado] = useState("");
    const [ordenFechaLLegada, setOrdenFechaLLegada] = useState("asc");
    const [notification, setNotification] = useState(null);
    const location = useLocation();

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
        const checkPayment = async () => {
            const params = new URLSearchParams(location.search);
            const sessionId = params.get("session_id");

            if (sessionId) {
                try {
                    const response = await fetch(`http://localhost:8000/api/propiedades/confirmar-pago/${sessionId}`);

                    if (response.ok) {
                        const data = await response.json();
                        if (data.status === 'success') {
                            fetchReservas();
                            window.history.replaceState({}, '', '/mis-reservas');
                            setNotification({
                                type: 'success',
                                message: '¡Reserva confirmada exitosamente!'
                            });
                            setTimeout(() => setNotification(null), 5000);
                        }
                    }
                } catch (error) {
                    console.error('Error verificando pago:', error);
                    setNotification({
                        type: 'error',
                        message: 'Error al verificar el pago'
                    });
                    setTimeout(() => setNotification(null), 5000);
                }
            }
        };
        checkPayment();
    }, [location.search]);

    useEffect(() => {
        const procesarPagoPaypal = async () => {
            const params = new URLSearchParams(location.search);
            const orderID = params.get("token");

            if (!orderID) {
                console.log("No se detectó orden de PayPal");
                return;
            }
            if (localStorage.getItem("processingOrder") === orderID) {
                console.warn("⚠️ Orden ya en proceso");
                return;
            }

            localStorage.setItem("processingOrder", orderID);



            try {
                const reservaAlmacenada = localStorage.getItem(`reservation_${orderID}`);
                if (!reservaAlmacenada) {
                    alert("Sesión expirada. Por favor realiza la reserva nuevamente");
                    return;
                }

                window.history.replaceState({}, document.title, window.location.pathname);

                const response = await fetch(
                    "http://localhost:8000/api/propiedades/confirmar-pago-paypal/",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                        },
                        body: JSON.stringify({
                            orderID,
                            reservationData: JSON.parse(reservaAlmacenada),
                        }),
                    }
                );

                localStorage.removeItem(`reservation_${orderID}`);
                localStorage.removeItem("processingOrder");


                if (!response.ok) {
                    const errorData = await response.json();
                    const errorMessage = errorData.error || "Error en el pago";

                    if (errorMessage.includes("ya existe")) {
                        alert("Esta reserva ya fue confirmada anteriormente");
                        window.location.href = "/mis-reservas";
                        return;
                    }
                    throw new Error(errorMessage);
                } setNotification({
                    type: "success",
                    message: "¡Pago completado con éxito!",
                });

                window.history.replaceState({ paymentCompleted: true }, "");
                setTimeout(() => window.location.href = "/mis-reservas", 1500);

            } catch (error) {
                console.error("Error en el pago:", error);
                alert(`Error: ${error.message}`);
                localStorage.removeItem("processingOrder");
            }
        };

        let isMounted = true;
        if (isMounted && location.search.includes("token")) {
            procesarPagoPaypal();
        }

        return () => {
            isMounted = false;
        };
    }, [location.search]);


    useEffect(() => {
        fetchReservas();
        const intervalId = setInterval(fetchReservas, 60000);
        return () => clearInterval(intervalId);
    }, []);

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
                setNotification({
                    type: 'success',
                    message: 'Reserva cancelada con éxito'
                });
                setTimeout(() => setNotification(null), 5000);
                fetchReservas();
            } else {
                setNotification({
                    type: 'error',
                    message: 'Error al cancelar la reserva'
                });
                setTimeout(() => setNotification(null), 5000);
            }
        } catch (error) {
            console.error("Error al cancelar la reserva", error);
            setNotification({
                type: 'error',
                message: 'Error al cancelar la reserva'
            });
            setTimeout(() => setNotification(null), 5000);
        }
    };

    const fetchReservas = async (retried = false) => {
        try {
            const response = await fetch(`http://localhost:8000/api/propiedades/solicitudes-reserva-usuario/${usuarioId}`, {
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
                    fetchReservas(true);
                } else {
                    console.log("Token inválido, cerrando sesión...");
                    handleLogOut();
                }
            } else if (response.ok) {
                const data = await response.json();
                // const dataFiltered = data.filter(reserva => reserva.usuario === JSON.parse(localStorage.getItem("additionalInfo")).usuarioId);
                setMisReservas(data);
                fetchProperties(data);
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

    const getStatusColor = (status) => {
        switch (status) {
            case "Pendiente":
                return { bg: "#FFF7E6", text: "#FF9800", border: "#FFB74D" };
            case "Aceptada":
                return { bg: "#E8F5E9", text: "#4CAF50", border: "#81C784" };
            case "Cancelada":
                return { bg: "#FFEBEE", text: "#F44336", border: "#E57373" };
            default:
                return { bg: "#E0E0E0", text: "#757575", border: "#BDBDBD" };
        }
    };

    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('es-ES', options);
    };

    return (
        <Box sx={{
            display: 'flex',
            minHeight: '80vh',
            flexDirection: 'column',
            backgroundColor: '#f8fafc',
            width: '100%',
            py: 4
        }}>
            <Container maxWidth="lg">
                {notification && (
                    <Alert
                        severity={notification.type}
                        sx={{
                            mb: 3,
                            borderRadius: 2,
                            boxShadow: '0 2px 10px rgba(0,0,0,0.08)'
                        }}
                        onClose={() => setNotification(null)}
                    >
                        {notification.message}
                    </Alert>
                )}

                <Typography
                    variant="h4"
                    sx={{
                        mb: 4,
                        fontWeight: 600,
                        color: '#1a365d',
                        textAlign: 'center'
                    }}
                >
                    Mis Reservas
                </Typography>

                {misReservas?.length !== 0 && (
                    <Paper
                        elevation={0}
                        sx={{
                            mb: 4,
                            overflow: 'hidden',
                            borderRadius: 2,
                            boxShadow: '0 2px 10px rgba(0,0,0,0.08)'
                        }}
                    >
                        <Accordion
                            disableGutters
                            elevation={0}
                            sx={{
                                '&:before': { display: 'none' }
                            }}
                        >
                            <AccordionSummary
                                expandIcon={<ExpandMoreIcon />}
                                sx={{
                                    backgroundColor: 'rgba(0, 0, 0, 0.02)',
                                    borderBottom: '1px solid rgba(0, 0, 0, 0.08)'
                                }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <FilterListIcon sx={{ mr: 1, color: '#4a5568' }} />
                                    <Typography variant="h6" sx={{ fontWeight: 500, color: '#2d3748' }}>
                                        Filtros
                                    </Typography>
                                </Box>
                            </AccordionSummary>
                            <AccordionDetails sx={{ p: 3 }}>
                                <Box sx={{
                                    display: "flex",
                                    flexDirection: { xs: 'column', sm: 'row' },
                                    gap: 2
                                }}>
                                    <FormControl
                                        fullWidth
                                        size="small"
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: 2
                                            }
                                        }}
                                    >
                                        <InputLabel>Estado</InputLabel>
                                        <Select
                                            name="estado"
                                            value={estado}
                                            onChange={handleEstadoChange}
                                            label="Estado"
                                        >
                                            <MenuItem value=""><em>Todos</em></MenuItem>
                                            <MenuItem value="Pendiente">Pendiente</MenuItem>
                                            <MenuItem value="Aceptada">Confirmada</MenuItem>
                                            <MenuItem value="Cancelada">Cancelada</MenuItem>
                                        </Select>
                                    </FormControl>
                                    <FormControl
                                        fullWidth
                                        size="small"
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: 2
                                            }
                                        }}
                                    >
                                        <InputLabel>Ordenar por fecha de llegada</InputLabel>
                                        <Select
                                            value={ordenFechaLLegada}
                                            label="Ordenar por fecha de llegada"
                                            onChange={(e) => setOrdenFechaLLegada(e.target.value)}
                                        >
                                            <MenuItem value="asc">Más próximas primero</MenuItem>
                                            <MenuItem value="desc">Más lejanas primero</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Box>
                            </AccordionDetails>
                        </Accordion>
                    </Paper>
                )}

                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', my: 8 }}>
                        <CircularProgress />
                    </Box>
                ) : misReservas.length === 0 ? (
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
                            No tienes reservas
                        </Typography>
                    </Paper>
                ) : misReservasFiltradas.length === 0 ? (
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
                            No hay reservas que cumplan los filtros seleccionados
                        </Typography>
                    </Paper>
                ) : (
                    <Box sx={{
                        display: "flex",
                        flexDirection: "row",
                        flexWrap: "wrap",
                        gap: 3,
                        justifyContent: { xs: 'center', md: 'flex-start' }
                    }}>
                        {misReservasFiltradas?.map((reserva, index) => {
                            const propiedad = propiedades[reserva.propiedad];
                            const statusColor = getStatusColor(reserva?.estado);

                            return (
                                <Paper
                                    key={index}
                                    elevation={0}
                                    sx={{
                                        display: "flex",
                                        flexDirection: "column",
                                        width: { xs: '100%', sm: 'calc(50% - 16px)', md: 'calc(33.333% - 16px)' },
                                        borderRadius: 2,
                                        overflow: "hidden",
                                        transition: 'transform 0.2s, box-shadow 0.2s',
                                        boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
                                        '&:hover': {
                                            transform: 'translateY(-4px)',
                                            boxShadow: '0 10px 20px rgba(0,0,0,0.12)'
                                        }
                                    }}
                                >
                                    <Box sx={{
                                        position: 'relative',
                                        width: "100%",
                                        height: "200px",
                                        backgroundColor: '#e2e8f0'
                                    }}>
                                        {imageLoading[propiedad?.id] ? (
                                            <Box sx={{
                                                display: 'flex',
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                                height: '100%'
                                            }}>
                                                <CircularProgress size={40} />
                                            </Box>
                                        ) : (
                                            <>
                                                <img
                                                    src={url[propiedad?.id]}
                                                    alt={propiedad?.nombre || 'Propiedad'}
                                                    style={{
                                                        width: "100%",
                                                        height: "200px",
                                                        objectFit: "cover"
                                                    }}
                                                />
                                                <Chip
                                                    label={reserva?.estado}
                                                    sx={{
                                                        position: 'absolute',
                                                        top: 12,
                                                        right: 12,
                                                        backgroundColor: statusColor.bg,
                                                        color: statusColor.text,
                                                        border: `1px solid ${statusColor.border}`,
                                                        fontWeight: 600,
                                                        fontSize: '0.75rem'
                                                    }}
                                                />
                                            </>
                                        )}
                                    </Box>

                                    <Box sx={{
                                        p: 3,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        flexGrow: 1
                                    }}>
                                        <Typography
                                            variant="h6"
                                            gutterBottom
                                            sx={{
                                                fontWeight: 600,
                                                color: '#2d3748',
                                                mb: 1
                                            }}
                                        >
                                            <a
                                                href={`/detalles/${propiedad?.id}`}
                                                style={{
                                                    textDecoration: "none",
                                                    color: "inherit",
                                                    transition: 'color 0.2s'
                                                }}
                                                onMouseOver={(e) => e.target.style.color = '#3182ce'}
                                                onMouseOut={(e) => e.target.style.color = '#2d3748'}
                                            >
                                                {propiedad?.nombre || 'Propiedad'}
                                            </a>
                                        </Typography>

                                        <Stack spacing={1} sx={{ mb: 2 }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <Typography variant="body2" color="text.secondary">
                                                    Entrada:
                                                </Typography>
                                                <Typography variant="body2" fontWeight={500}>
                                                    {formatDate(reserva?.fecha_llegada)}
                                                </Typography>
                                            </Box>

                                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <Typography variant="body2" color="text.secondary">
                                                    Salida:
                                                </Typography>
                                                <Typography variant="body2" fontWeight={500}>
                                                    {formatDate(reserva?.fecha_salida)}
                                                </Typography>
                                            </Box>

                                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <Typography variant="body2" color="text.secondary">
                                                    Pago:
                                                </Typography>
                                                <Typography variant="body2" fontWeight={500}>
                                                    {reserva?.metodo_pago || 'No especificado'}
                                                </Typography>
                                            </Box>

                                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <Typography variant="body2" color="text.secondary">
                                                    Precio:
                                                </Typography>
                                                <Typography variant="body2" fontWeight={600} color="primary">
                                                    {reserva?.precio_total}€
                                                </Typography>
                                            </Box>
                                        </Stack>

                                        <Box sx={{ mt: 'auto', pt: 2 }}>
                                            {reserva?.estado === "Pendiente" && (
                                                <Button
                                                    variant="outlined"
                                                    color="error"
                                                    onClick={() => cancelarReserva(reserva.id)}
                                                    fullWidth
                                                    sx={{
                                                        borderRadius: 2,
                                                        textTransform: 'none',
                                                        py: 1
                                                    }}
                                                >
                                                    Cancelar Reserva
                                                </Button>

                                            )}
                                            <Button variant="outlined" color="primary" href={`/informacion-reserva/${reserva.id}`} fullWidth sx={{ borderRadius: 2, textTransform: 'none', py: 1, mt: 1 }}>
                                                Ver Detalles
                                            </Button>

                                        </Box>
                                    </Box>
                                </Paper>
                            );
                        })}
                    </Box>
                )}
            </Container>
        </Box>
    );
};

export default MyReserves;