import React, { useState, useEffect } from 'react';
import {
    Box,
    Container,
    Typography,
    Card,
    CardContent,
    Chip,
    CardMedia,
    Avatar,
    Button,
    Skeleton,
    IconButton,
    Stack,
    Divider
} from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import ShareIcon from '@mui/icons-material/Share';

const Events = () => {
    const [eventos, setEventos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);


    useEffect(() => {
        fetchEventos();
    }, []);

    const fetchEventos = async () => {
        try {
            setLoading(true);
            const response = await fetch('http://localhost:8000/api/eventos/eventos');
            if (response.ok) {
                const data = await response.json();
                setEventos(data);
            } else {
                setError('No pudimos cargar los eventos. Por favor, intenta de nuevo más tarde.');
            }
        } catch (error) {
            console.error('Error al obtener los eventos', error);
            setError('Ocurrió un problema al conectar con el servidor.');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        return dateString;
    };

    const handleShare = (evento) => {
        if (navigator.share) {
            navigator.share({
                title: evento.nombre,
                text: evento.descripcion,
                url: window.location.origin + '/detalles-evento/' + evento.id
            }).then(() => {
                console.log('Contenido compartido con éxito');
            }).catch((error) => {
                console.error('Error al compartir:', error);
            });
        } else {
            console.log('Web Share API no está soportado en este navegador');
        }
    }


    return (
        <Box
            sx={{
                minHeight: "90vh",
                backgroundColor: "#f8fafc",
                width: "100%",
                py: 6
            }}
        >
            <Container maxWidth="lg">
                <Box sx={{ mb: 6, textAlign: "center" }}>
                    <Typography
                        variant="h3"
                        component="h1"
                        sx={{
                            fontWeight: 700,
                            color: "#1e293b",
                            mb: 2
                        }}
                    >
                        Próximos Eventos
                    </Typography>
                    <Typography
                        variant="subtitle1"
                        sx={{
                            color: "#64748b",
                            maxWidth: 600,
                            mx: "auto"
                        }}
                    >
                        Descubre los mejores eventos de nuestra comunidad y no te pierdas ninguna oportunidad
                    </Typography>
                </Box>

                {loading ? (
                    <Box
                        sx={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: 3,
                            justifyContent: 'center'
                        }}
                    >
                        {[1, 2, 3, 4, 5, 6].map((item) => (
                            <Box
                                key={item}
                                sx={{
                                    width: { xs: '100%', sm: 'calc(50% - 24px)', md: 'calc(33.333% - 24px)' },
                                    minWidth: { xs: '100%', sm: '280px' }
                                }}
                            >
                                <Card sx={{ height: 440, borderRadius: 3 }}>
                                    <Skeleton variant="rectangular" height={220} />
                                    <CardContent>
                                        <Skeleton variant="text" height={40} />
                                        <Skeleton variant="text" />
                                        <Skeleton variant="text" width="60%" />
                                    </CardContent>
                                </Card>
                            </Box>
                        ))}
                    </Box>
                ) : error ? (
                    <Box sx={{ textAlign: "center", py: 8 }}>
                        <Typography variant="h6" color="error" sx={{ mb: 2 }}>
                            {error}
                        </Typography>
                        <Button
                            variant="contained"
                            onClick={fetchEventos}
                            sx={{
                                bgcolor: "#3b82f6",
                                '&:hover': {
                                    bgcolor: "#2563eb"
                                }
                            }}
                        >
                            Reintentar
                        </Button>
                    </Box>
                ) : (
                    <Box
                        sx={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: 3,
                            justifyContent: 'flex-start'
                        }}
                    >
                        {eventos.map(evento => (
                            <Box
                                key={evento.id}
                                sx={{
                                    width: { xs: '100%', sm: 'calc(50% - 24px)', md: 'calc(33.333% - 24px)' },
                                    minWidth: { xs: '100%', sm: '280px' }
                                }}
                            >
                                <Card
                                    sx={{
                                        height: 440,
                                        borderRadius: 3,
                                        overflow: "hidden",
                                        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.025)",
                                        transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease',
                                        position: 'relative',
                                        '&:hover': {
                                            transform: 'translateY(-8px)',
                                            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
                                        }
                                    }}
                                >
                                    <Box sx={{ position: 'relative' }}>
                                        <CardMedia
                                            component="img"
                                            image={evento.imagen}
                                            alt={evento.nombre}
                                            sx={{
                                                height: 220,
                                                objectFit: "cover"
                                            }}
                                        />
                                        <Chip
                                            label={evento.categoria}
                                            size="small"
                                            sx={{
                                                position: 'absolute',
                                                top: 16,
                                                left: 16,
                                                bgcolor: 'rgba(255, 255, 255, 0.85)',
                                                color: '#1e293b',
                                                fontWeight: 600,
                                                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                                            }}
                                        />
                                        <Box
                                            sx={{
                                                position: 'absolute',
                                                top: 16,
                                                right: 16,
                                                display: 'flex',
                                                gap: 1
                                            }}
                                        >

                                            <IconButton
                                                size="small"
                                                sx={{
                                                    bgcolor: 'rgba(255, 255, 255, 0.85)',
                                                    '&:hover': {
                                                        bgcolor: 'rgba(255, 255, 255, 0.95)'
                                                    }
                                                }}
                                                onClick={() => handleShare(evento)}
                                            >
                                                <ShareIcon fontSize="small" />
                                            </IconButton>
                                        </Box>
                                    </Box>

                                    <CardContent sx={{ p: 3 }}>
                                        <Typography
                                            variant="h5"
                                            component="h3"
                                            sx={{
                                                mb: 1,
                                                fontWeight: 700,
                                                color: "#1e293b",
                                                lineHeight: 1.3,
                                                display: '-webkit-box',
                                                overflow: 'hidden',
                                                WebkitBoxOrient: 'vertical',
                                                WebkitLineClamp: 2,
                                                height: 60
                                            }}
                                        >
                                            <a
                                                href={`/detalles-evento/${evento.id}`}
                                                style={{
                                                    textDecoration: "none",
                                                    color: "inherit"
                                                }}
                                            >
                                                {evento.nombre}
                                            </a>
                                        </Typography>

                                        <Stack
                                            direction="row"
                                            spacing={3}
                                            sx={{
                                                my: 2
                                            }}
                                        >
                                            <Stack direction="row" spacing={1} alignItems="center">
                                                <CalendarTodayIcon
                                                    fontSize="small"
                                                    sx={{
                                                        color: "#64748b",
                                                        fontSize: 18
                                                    }}
                                                />
                                                <Typography
                                                    variant="body2"
                                                    sx={{
                                                        color: "#64748b",
                                                        fontWeight: 500
                                                    }}
                                                >
                                                    {formatDate(evento.fecha)}
                                                </Typography>
                                            </Stack>

                                            <Stack direction="row" spacing={1} alignItems="center">
                                                <LocationOnIcon
                                                    fontSize="small"
                                                    sx={{
                                                        color: "#64748b",
                                                        fontSize: 18
                                                    }}
                                                />
                                                <Typography
                                                    variant="body2"
                                                    sx={{
                                                        color: "#64748b",
                                                        fontWeight: 500,
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        whiteSpace: 'nowrap',
                                                        maxWidth: '100px'
                                                    }}
                                                >
                                                    {evento.lugar}
                                                </Typography>
                                            </Stack>
                                        </Stack>

                                        <Divider sx={{ my: 2 }} />

                                        <Box
                                            sx={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                mt: 2
                                            }}
                                        >
                                            <Button
                                                variant="contained"
                                                href={`/detalles-evento/${evento.id}`}
                                                sx={{
                                                    textTransform: 'none',
                                                    bgcolor: '#3b82f6',
                                                    fontWeight: 600,
                                                    borderRadius: 2,
                                                    px: 3,
                                                    '&:hover': {
                                                        bgcolor: '#2563eb'
                                                    }
                                                }}
                                            >
                                                Ver detalles
                                            </Button>

                                            <Avatar
                                                sx={{
                                                    width: 32,
                                                    height: 32,
                                                    bgcolor: '#e2e8f0'
                                                }}
                                            >
                                                {evento.nombre.charAt(0)}
                                            </Avatar>
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Box>
                        ))}
                    </Box>
                )}
            </Container>
        </Box>
    );
};

export default Events;