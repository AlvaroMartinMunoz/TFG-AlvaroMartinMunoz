import { Box, Card, CardMedia, Container, Paper, Typography, Divider, Chip, CircularProgress, Stack, alpha, Button, Alert, Rating } from "@mui/material";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import refreshAccessToken from "./RefreshToken";

const ReservationDetail = () => {
    const { reservaId } = useParams();
    const [reservation, setReservation] = useState(null);
    const [propiedad, setPropiedad] = useState(null);
    const [anfitrion, setAnfitrion] = useState(null);
    const [loading, setLoading] = useState(true);
    const [propertyPhoto, setPropertyPhoto] = useState(null);
    const [notification, setNotification] = useState(null);
    const [cliente, setCliente] = useState(null);
    const [mediaValoraciones, setMediaValoraciones] = useState(null);
    const [loadingMedia, setLoadingMedia] = useState(true);
    const [errorMedia, setErrorMedia] = useState(null);

    const clienteId = reservation?.usuario;
    const anfitrionId = reservation?.anfitrion;
    const propiedadId = reservation?.propiedad;
    const usuarioId = JSON.parse(localStorage.getItem('additionalInfo'))?.usuarioId;

    useEffect(() => {
        if (reservaId) {
            fetchReservation();
        }
    }, [reservaId]);

    useEffect(() => {
        if (anfitrionId) {
            fetchAnfitrion();
        }

    }, [anfitrionId]);

    useEffect(() => {
        if (propiedadId) {
            fetchPropiedad();
            fetchMediaValoraciones();
        }
    }, [propiedadId]);

    useEffect(() => {
        if (clienteId) {
            fetchCliente();
        }
    }, [clienteId]);

    useEffect(() => {
        if (reservation && propiedad && anfitrion) {
            setLoading(false);
        }
    }, [reservation, propiedad, anfitrion]);

    const fetchCliente = async (retried = false) => {
        try {
            const response = await fetch(`http://localhost:8000/api/usuarios/${clienteId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem("accessToken")}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setCliente(data);
                console.log("Cliente", data);
            } else if (response.status === 401 && !retried) {
                const token = await refreshAccessToken();
                if (token) {
                    fetchCliente(true);
                } else {
                    console.log("No se pudo refrescar el token");
                }
            }
        } catch (error) {
            console.error("Error fetching client:", error);
        }
    };

    const fetchReservation = async (retried = false) => {
        try {
            const response = await fetch(`http://localhost:8000/api/propiedades/reservas/${reservaId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem("accessToken")}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setReservation(data);
                console.log("Reserva: ", data);
            } else if (response.status === 401 && !retried) {
                const token = await refreshAccessToken();
                if (token) {
                    fetchReservation(true);
                } else {
                    console.log("No se pudo refrescar el token");
                }
            }
        } catch (error) {
            console.error("Error fetching reservation:", error);
        }
    };

    const fetchAnfitrion = async (retried = false) => {
        try {
            const response = await fetch(`http://localhost:8000/api/usuarios/${anfitrionId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem("accessToken")}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setAnfitrion(data);
                console.log("Anfitrion", data);
            } else if (response.status === 401 && !retried) {
                const token = await refreshAccessToken();
                if (token) {
                    fetchAnfitrion(true);
                } else {
                    console.log("No se pudo refrescar el token");
                }
            }
        } catch (error) {
            console.error("Error fetching host:", error);
        }
    };

    const fetchPropiedad = async (retried = false) => {
        try {
            const response = await fetch(`http://localhost:8000/api/propiedades/propiedades/${propiedadId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem("accessToken")}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setPropiedad(data);
                fetchPropertyPhoto();
                console.log("Propiedad", data);
            } else if (response.status === 401 && !retried) {
                const token = await refreshAccessToken();
                if (token) {
                    fetchPropiedad(true);
                } else {
                    console.log("No se pudo refrescar el token");
                }
            }
        } catch (error) {
            console.error("Error fetching property:", error);
        }
    };

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
                fetchReservation();
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
                setNotification({
                    type: 'success',
                    message: 'Reserva aceptada con éxito'
                });
                setTimeout(() => setNotification(null), 5000);
                fetchReservation();
            } else {
                console.log("Error al aceptar la solicitud de reserva con id", solicitudId);
            }
        } catch (error) {
            console.error("Error al aceptar la solicitud de reserva con id", solicitudId, error);
        }
    }

    const fetchMediaValoraciones = async () => {
        try {
            const response = await fetch(`http://localhost:8000/api/propiedades/valoraciones-propiedades/${propiedadId}/media_valoraciones/`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            });
            if (response.ok) {
                const data = await response.json();
                setMediaValoraciones(data);
            } else {
                setErrorMedia("No se pudo obtener la media de valoraciones");
            }
        } catch (error) {
            setErrorMedia("No se pudo obtener la media de valoraciones");
            console.error(error);
        } finally {
            setLoadingMedia(false);
        }
    };

    const fetchPropertyPhoto = async (retried = false) => {
        try {
            const response = await fetch("http://localhost:8000/api/propiedades/fotos-propiedades", {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem("accessToken")}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                const dataFiltered = data.filter(photo => photo.propiedad === propiedadId && photo.es_portada);
                setPropertyPhoto(dataFiltered);
                console.log("Foto de propiedad", dataFiltered);
            } else if (response.status === 401 && !retried) {
                const token = await refreshAccessToken();
                if (token) {
                    fetchPropertyPhoto(true);
                } else {
                    console.log("No se pudo refrescar el token");
                }
            }
        } catch (error) {
            console.error("Error fetching property photos:", error);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Confirmada':
                return 'success';
            case 'Pendiente':
                return 'warning';
            case 'Cancelada':
                return 'error';
            default:
                return 'default';
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    if (loading) {
        return (
            <Box sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '100vh',
                backgroundColor: '#f4f6f9'
            }}>
                <Box sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    padding: 4,
                    borderRadius: 2,
                    backgroundColor: 'white',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                }}>
                    <CircularProgress
                        size={60}
                        sx={{
                            color: '#3f51b5',
                            marginBottom: 2
                        }}
                    />
                    <Typography
                        variant="h6"
                        sx={{
                            color: '#2c3e50',
                            fontWeight: 500
                        }}
                    >
                        Cargando detalles de la reserva...
                    </Typography>
                </Box>
            </Box>
        );
    }

    return (
        <Box sx={{
            minHeight: '100vh',
            backgroundColor: '#f4f6f9',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            py: { xs: 2, md: 5 },
            px: { xs: 1, md: 2 }
        }}>
            <Container maxWidth="lg" sx={{
                width: '100%',
                maxWidth: { xs: '100%', sm: '95%', md: '1200px' }
            }}>
                <Typography
                    variant="h4"
                    sx={{
                        textAlign: 'center',
                        mb: 4,
                        color: '#1a365d',
                        fontWeight: 700,
                        letterSpacing: '0.5px'
                    }}
                >
                    Detalles de la Reserva
                </Typography>

                <Card
                    elevation={4}
                    sx={{
                        borderRadius: 3,
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: { xs: 'column', md: 'row' },
                        backgroundColor: 'white',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                            boxShadow: '0 12px 32px rgba(0,0,0,0.12)'
                        }
                    }}
                >
                    <Box sx={{
                        width: { xs: '100%', md: '40%' },
                        position: 'relative',
                        backgroundColor: '#f0f2f5',
                        minHeight: { xs: '300px', md: '500px' }
                    }}>
                        {propertyPhoto && propertyPhoto.length > 0 ? (
                            <CardMedia
                                component="img"
                                image={propertyPhoto[0]?.foto}
                                alt={propiedad?.nombre || "Imagen de la propiedad"}
                                sx={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    transition: 'transform 0.5s ease',
                                    '&:hover': {
                                        transform: 'scale(1.05)'
                                    }
                                }}
                            />
                        ) : (
                            <Box sx={{
                                display: 'flex',
                                height: '100%',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: alpha('#718096', 0.1)
                            }}>
                                <Typography
                                    variant="body1"
                                    color="text.secondary"
                                    sx={{ fontStyle: 'italic' }}
                                >
                                    No hay foto disponible
                                </Typography>
                            </Box>
                        )}
                    </Box>

                    <Box sx={{
                        width: { xs: '100%', md: '60%' },
                        p: { xs: 3, sm: 4 },
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between'
                    }}>
                        <Box>
                            <Box sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                mb: 2
                            }}>
                                <Typography
                                    variant="h5"
                                    sx={{
                                        fontWeight: 700,
                                        color: '#2d3748',
                                        lineHeight: 1.2
                                    }}
                                >
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

                                <Chip
                                    label={reservation?.estado}
                                    color={getStatusColor(reservation?.estado)}
                                    size="small"
                                    sx={{
                                        fontWeight: 600,
                                        textTransform: 'capitalize',
                                        borderRadius: 2
                                    }}
                                />
                            </Box>

                            <Divider sx={{
                                my: 2,
                                borderColor: alpha('#718096', 0.2)
                            }} />

                            <Stack spacing={3}>
                                <Box sx={{
                                    display: 'flex',
                                    flexDirection: { xs: 'column', sm: 'row' },
                                    gap: { xs: 2, sm: 3 }
                                }}>
                                    {reservation.usuario === usuarioId ? (
                                        <>
                                            <Box sx={{ flex: 1 }}>
                                                <Typography variant="subtitle2" sx={{ color: '#718096', mb: 0.5, fontWeight: 600 }}>
                                                    Anfitrión
                                                </Typography>
                                                <Typography variant="body1" sx={{ fontWeight: 500, color: '#2d3748' }}>
                                                    {anfitrion?.usuario?.username}
                                                </Typography>
                                            </Box>
                                        </>
                                    ) : (
                                        <>
                                            <Box sx={{ flex: 1 }}>
                                                <Typography variant="subtitle2" sx={{ color: '#718096', mb: 0.5, fontWeight: 600 }}>
                                                    Usuario
                                                </Typography>
                                                <Typography variant="body1" sx={{ fontWeight: 500, color: '#2d3748' }}>
                                                    {cliente?.usuario?.username}
                                                </Typography>
                                            </Box>
                                        </>
                                    )}
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="subtitle2" sx={{ color: '#718096', mb: 0.5, fontWeight: 600 }}>
                                            Valoración: {loadingMedia ? <CircularProgress size={16} /> : null}
                                        </Typography>
                                        <Rating name="read-only" value={mediaValoraciones?.media || 0} readOnly />
                                    </Box>
                                </Box>

                                <Box sx={{
                                    display: 'flex',
                                    flexDirection: { xs: 'column', sm: 'row' },
                                    gap: { xs: 2, sm: 3 }
                                }}>
                                    {reservation.usuario === usuarioId ? (
                                        <>
                                            <Box sx={{ flex: 1 }}>
                                                <Typography variant="subtitle2" sx={{ color: '#718096', mb: 0.5, fontWeight: 600 }}>
                                                    Telefono
                                                </Typography>
                                                <Typography variant="body1" sx={{ fontWeight: 500, color: '#2d3748' }}>
                                                    {anfitrion?.telefono}
                                                </Typography>
                                            </Box>
                                            <Box sx={{ flex: 1 }}>
                                                <Typography variant="subtitle2" sx={{ color: '#718096', mb: 0.5, fontWeight: 600 }}>
                                                    Correo electrónico
                                                </Typography>
                                                <Typography variant="body1" sx={{ fontWeight: 500, color: '#2d3748' }}>
                                                    {anfitrion?.usuario?.email}
                                                </Typography>

                                            </Box>
                                        </>
                                    ) : (
                                        <>
                                            <Box sx={{ flex: 1 }}>
                                                <Typography variant="subtitle2" sx={{ color: '#718096', mb: 0.5, fontWeight: 600 }}>
                                                    Telefono
                                                </Typography>
                                                <Typography variant="body1" sx={{ fontWeight: 500, color: '#2d3748' }}>
                                                    {cliente?.telefono}
                                                </Typography>
                                            </Box>
                                            <Box sx={{ flex: 1 }}>
                                                <Typography variant="subtitle2" sx={{ color: '#718096', mb: 0.5, fontWeight: 600 }}>
                                                    Correo electrónico
                                                </Typography>
                                                <Typography variant="body1" sx={{ fontWeight: 500, color: '#2d3748' }}>
                                                    {cliente?.usuario?.email}
                                                </Typography>

                                            </Box>
                                        </>
                                    )}

                                </Box>

                                <Box sx={{
                                    display: 'flex',
                                    flexDirection: { xs: 'column', sm: 'row' },
                                    gap: { xs: 2, sm: 3 }
                                }}>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="subtitle2" sx={{ color: '#718096', mb: 0.5, fontWeight: 600 }}>
                                            Fecha de llegada
                                        </Typography>
                                        <Typography variant="body1" sx={{ fontWeight: 500, color: '#2d3748' }}>
                                            {formatDate(reservation?.fecha_llegada)}
                                        </Typography>
                                    </Box>

                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="subtitle2" sx={{ color: '#718096', mb: 0.5, fontWeight: 600 }}>
                                            Fecha de salida
                                        </Typography>
                                        <Typography variant="body1" sx={{ fontWeight: 500, color: '#2d3748' }}>
                                            {formatDate(reservation?.fecha_salida)}
                                        </Typography>
                                    </Box>
                                </Box>

                                <Box sx={{
                                    display: 'flex',
                                    flexDirection: { xs: 'column', sm: 'row' },
                                    gap: { xs: 2, sm: 3 }
                                }}>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="subtitle2" sx={{ color: '#718096', mb: 0.5, fontWeight: 600 }}>
                                            Número de personas
                                        </Typography>
                                        <Typography variant="body1" sx={{ fontWeight: 500, color: '#2d3748' }}>
                                            {reservation?.numero_personas}
                                        </Typography>
                                    </Box>

                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="subtitle2" sx={{ color: '#718096', mb: 0.5, fontWeight: 600 }}>
                                            Precio por noche
                                        </Typography>
                                        <Typography variant="body1" sx={{ fontWeight: 700, color: '#2d3748' }}>
                                            {reservation?.precio_por_noche}€
                                        </Typography>
                                    </Box>
                                </Box>

                                <Box sx={{
                                    display: 'flex',
                                    flexDirection: { xs: 'column', sm: 'row' },
                                    gap: { xs: 2, sm: 3 }
                                }}>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="subtitle2" sx={{ color: '#718096', mb: 0.5, fontWeight: 600 }}>
                                            Método de Pago
                                        </Typography>
                                        <Typography variant="body1" sx={{ fontWeight: 500, color: '#2d3748' }}>
                                            {reservation?.metodo_pago || "No especificado"}
                                        </Typography>
                                    </Box>

                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="subtitle2" sx={{ color: '#718096', mb: 0.5, fontWeight: 600 }}>
                                            Precio total
                                        </Typography>
                                        <Typography variant="body1" sx={{
                                            fontWeight: 700,
                                            color: '#3182ce',
                                            fontSize: '1.1rem'
                                        }}>
                                            {reservation?.precio_total}€
                                        </Typography>
                                    </Box>
                                </Box>

                                <Divider sx={{
                                    my: 2,
                                    borderColor: alpha('#718096', 0.2)
                                }} />

                                {/* User Comments Section */}
                                <Box>
                                    <Typography variant="subtitle2" sx={{ color: '#718096', mb: 1, fontWeight: 600 }}>
                                        Comentarios del usuario
                                    </Typography>
                                    <Paper
                                        variant="outlined"
                                        sx={{
                                            p: 3,
                                            backgroundColor: alpha('#f8f9fa', 0.7),
                                            minHeight: '80px',
                                            borderRadius: '12px',
                                            borderColor: alpha('#718096', 0.2)
                                        }}
                                    >
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                color: reservation?.comentarios_usuario ? '#2d3748' : '#a0aec0',
                                                fontStyle: reservation?.comentarios_usuario ? 'normal' : 'italic'
                                            }}
                                        >
                                            {reservation?.comentarios_usuario || "Sin comentarios"}
                                        </Typography>
                                    </Paper>
                                </Box>

                                {reservation?.estado === 'Pendiente' && usuarioId === reservation?.usuario && (
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        sx={{
                                            mt: 2,
                                            py: 1.5,
                                            borderRadius: 2,
                                            transition: 'all 0.3s ease',
                                            '&:hover': {
                                                transform: 'translateY(-2px)',
                                                boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                                            }
                                        }}
                                        onClick={() => cancelarReserva(reservaId)}
                                    >
                                        Cancelar Reserva
                                    </Button>
                                )}

                                {reservation?.estado === 'Pendiente' && usuarioId === reservation?.anfitrion && (
                                    <Box sx={{
                                        display: 'flex',
                                        gap: 2,
                                        mt: 2
                                    }}>
                                        <Button
                                            variant="contained"
                                            color="success"
                                            sx={{
                                                flex: 1,
                                                py: 1.5,
                                                borderRadius: 2,
                                                transition: 'all 0.3s ease',
                                                '&:hover': {
                                                    transform: 'translateY(-2px)',
                                                    boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                                                }
                                            }}
                                            onClick={() => handleAccept(reservaId)}
                                        >
                                            Aceptar reserva
                                        </Button>
                                        <Button
                                            variant="contained"
                                            color="error"
                                            sx={{
                                                flex: 1,
                                                py: 1.5,
                                                borderRadius: 2,
                                                transition: 'all 0.3s ease',
                                                '&:hover': {
                                                    transform: 'translateY(-2px)',
                                                    boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                                                }
                                            }}
                                            onClick={() => cancelarReserva(reservaId)}
                                        >
                                            Rechazar Reserva
                                        </Button>
                                    </Box>
                                )}
                            </Stack>
                        </Box>
                    </Box>
                </Card >

                {notification && (
                    <Alert
                        severity={notification.type}
                        sx={{
                            mt: 3,
                            borderRadius: 2,
                            boxShadow: '0 2px 10px rgba(0,0,0,0.08)'
                        }}
                        onClose={() => setNotification(null)}
                    >
                        {notification.message}
                    </Alert>
                )}
            </Container >
        </Box >
    );
};

export default ReservationDetail;