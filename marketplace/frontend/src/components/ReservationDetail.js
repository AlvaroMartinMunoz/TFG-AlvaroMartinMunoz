import { Box, Card, CardMedia, Container, Paper, Typography, Divider, Chip, CircularProgress, Stack, alpha } from "@mui/material";
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

    // Derived states to avoid separate state variables
    const anfitrionId = reservation?.anfitrion;
    const propiedadId = reservation?.propiedad;
    const usuarioId = JSON.parse(localStorage.getItem('additionalInfo'))?.usuarioId;

    // Fetch reservation data
    useEffect(() => {
        if (reservaId) {
            fetchReservation();
        }
    }, [reservaId]);

    // Fetch host data when anfitrionId changes
    useEffect(() => {
        if (anfitrionId) {
            fetchAnfitrion();
        }
    }, [anfitrionId]);

    // Fetch property data when propiedadId changes
    useEffect(() => {
        if (propiedadId) {
            fetchPropiedad();
        }
    }, [propiedadId]);

    // Update loading state when all data is loaded
    useEffect(() => {
        if (reservation && propiedad && anfitrion) {
            setLoading(false);
        }
    }, [reservation, propiedad, anfitrion]);

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

    // Helper function to format reservation status
    const getStatusColor = (status) => {
        switch (status) {
            case 'confirmada':
                return 'success';
            case 'pendiente':
                return 'warning';
            case 'cancelada':
                return 'error';
            default:
                return 'default';
        }
    };

    // Format date for better display
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
                minHeight: '90vh',
                backgroundColor: '#f8f9fa'
            }}>
                <CircularProgress sx={{ color: '#3f51b5' }} />
                <Typography sx={{ ml: 2, color: '#555', fontWeight: 500 }}>
                    Cargando detalles de la reserva...
                </Typography>
            </Box>
        );
    }

    return (
        <Box sx={{
            minHeight: '90vh',
            backgroundColor: '#f8f9fa',
            py: 5,
            px: 2
        }}>
            <Container maxWidth="lg" sx={{
                maxWidth: { xs: '100%', sm: '95%', md: '90%', lg: '1200px' },
                mx: 'auto'
            }}>
                <Typography
                    variant="h4"
                    gutterBottom
                    sx={{
                        fontWeight: 700,
                        textAlign: 'center',
                        mb: 4,
                        color: '#1a365d',
                        letterSpacing: '0.5px',
                        textShadow: '1px 1px 2px rgba(0,0,0,0.05)',
                    }}
                >
                    Detalles de la Reserva
                </Typography>

                <Card
                    elevation={3}
                    sx={{
                        borderRadius: '16px',
                        overflow: 'hidden',
                        backgroundColor: '#fff',
                        boxShadow: '0px 6px 16px rgba(0, 0, 0, 0.08)',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                            boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.12)',
                            transform: 'translateY(-4px)'
                        },
                    }}
                >
                    <Box sx={{
                        display: 'flex',
                        flexDirection: { xs: 'column', md: 'row' },
                    }}>
                        {/* Left Section - Property Image */}
                        <Box sx={{
                            flex: { xs: '1 1 100%', md: '0 0 40%' },
                            position: 'relative',
                            bgcolor: '#f0f2f5',
                            minHeight: { xs: '300px', md: 'auto' },
                            maxHeight: { md: '500px' },
                            overflow: 'hidden'
                        }}>
                            {propertyPhoto && propertyPhoto.length > 0 ? (
                                <CardMedia
                                    component="img"
                                    image={propertyPhoto[0]?.foto}
                                    alt={propiedad?.nombre || "Imagen de la propiedad"}
                                    sx={{
                                        height: '100%',
                                        width: '100%',
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
                                    backgroundColor: alpha('#718096', 0.1),
                                    p: 4
                                }}>
                                    <Typography variant="body1" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                        No hay foto disponible
                                    </Typography>
                                </Box>
                            )}
                        </Box>

                        {/* Right Section - Reservation Details */}
                        <Box sx={{
                            flex: { xs: '1 1 100%', md: '1 1 60%' },
                            p: { xs: 3, sm: 4 },
                            display: 'flex',
                            flexDirection: 'column'
                        }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                <Typography
                                    variant="h5"
                                    sx={{
                                        fontWeight: 700,
                                        color: '#2d3748',
                                        lineHeight: 1.2
                                    }}
                                >
                                    {propiedad?.nombre}
                                </Typography>

                                <Chip
                                    label={reservation?.estado}
                                    color={getStatusColor(reservation?.estado)}
                                    size="small"
                                    sx={{
                                        fontWeight: 600,
                                        textTransform: 'capitalize',
                                        borderRadius: '8px',
                                        height: '28px',
                                        px: 1
                                    }}
                                />
                            </Box>

                            <Divider sx={{
                                my: 2.5,
                                borderColor: alpha('#718096', 0.2),
                                width: '100%'
                            }} />

                            <Stack spacing={3} sx={{ width: '100%' }}>
                                <Box>
                                    <Typography variant="subtitle2" sx={{ color: '#718096', mb: 0.5, fontWeight: 600 }}>
                                        Anfitrión
                                    </Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 500, color: '#2d3748' }}>
                                        {anfitrion?.usuario?.username}
                                    </Typography>
                                </Box>

                                <Box sx={{
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    gap: 3
                                }}>
                                    <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 45%' } }}>
                                        <Typography variant="subtitle2" sx={{ color: '#718096', mb: 0.5, fontWeight: 600 }}>
                                            Fecha de llegada
                                        </Typography>
                                        <Typography variant="body1" sx={{ fontWeight: 500, color: '#2d3748' }}>
                                            {formatDate(reservation?.fecha_llegada)}
                                        </Typography>
                                    </Box>

                                    <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 45%' } }}>
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
                                    flexWrap: 'wrap',
                                    gap: 3
                                }}>
                                    <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 45%' } }}>
                                        <Typography variant="subtitle2" sx={{ color: '#718096', mb: 0.5, fontWeight: 600 }}>
                                            Número de personas
                                        </Typography>
                                        <Typography variant="body1" sx={{ fontWeight: 500, color: '#2d3748' }}>
                                            {reservation?.numero_personas}
                                        </Typography>
                                    </Box>

                                    <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 45%' } }}>
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
                                    flexWrap: 'wrap',
                                    gap: 3
                                }}>
                                    <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 45%' } }}>
                                        <Typography variant="subtitle2" sx={{ color: '#718096', mb: 0.5, fontWeight: 600 }}>
                                            Método de Pago
                                        </Typography>
                                        <Typography variant="body1" sx={{ fontWeight: 500, color: '#2d3748' }}>
                                            {reservation?.metodo_pago || "No especificado"}
                                        </Typography>
                                    </Box>

                                    <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 45%' } }}>
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
                                    my: 1,
                                    borderColor: alpha('#718096', 0.2),
                                    width: '100%'
                                }} />

                                <Box sx={{ width: '100%' }}>
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
                            </Stack>
                        </Box>
                    </Box>
                </Card>
            </Container>
        </Box>
    );
};

export default ReservationDetail;