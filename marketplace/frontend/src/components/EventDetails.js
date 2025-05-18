import React, { useEffect, useState } from 'react';
import {
    Box,
    Card,
    CardContent,
    CardMedia,
    Container,
    Typography,
    Chip,
    Divider,
    IconButton,
    Button,
    Stack,
    Skeleton,
    Alert,
} from '@mui/material';
import { useParams } from 'react-router-dom';
import PlaceIcon from '@mui/icons-material/Place';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import CategoryIcon from '@mui/icons-material/Category';
import ShareIcon from '@mui/icons-material/Share';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Link } from 'react-router-dom';
import { API_BASE_URL } from '../config';

const EventDetails = () => {
    const { eventoId } = useParams();
    const [evento, setEvento] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchEvento(eventoId);
    }, [eventoId]);

    const fetchEvento = async (eventoId) => {
        try {
            setLoading(true);
            const response = await fetch(`${API_BASE_URL}/api/eventos/eventos/${eventoId}`);
            if (response.ok) {
                const data = await response.json();
                setEvento(data);
            } else {
                setError('No pudimos encontrar el evento solicitado.');
            }
        } catch (error) {
            console.error('Error al obtener el evento', error);
            setError('Ocurrió un problema al conectar con el servidor.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Box sx={{ py: 8, px: 2 }}>
                <Container maxWidth="lg">
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
                        <Skeleton variant="circular" width={40} height={40} sx={{ mr: 2 }} />
                        <Skeleton variant="text" width={120} height={40} />
                    </Box>

                    <Card sx={{
                        display: 'flex',
                        flexDirection: { xs: 'column', md: 'row' },
                        borderRadius: 3,
                        overflow: 'hidden',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.025)'
                    }}>
                        <Skeleton variant="rectangular" width="100%" height={400} />

                        <Box sx={{ p: 4, width: '100%' }}>
                            <Skeleton variant="text" height={60} sx={{ mb: 2 }} />
                            <Skeleton variant="text" width="60%" height={30} sx={{ mb: 2 }} />
                            <Skeleton variant="text" width="40%" height={30} sx={{ mb: 2 }} />
                            <Skeleton variant="rectangular" width="100%" height={120} sx={{ mb: 2 }} />
                            <Skeleton variant="rectangular" width="100%" height={80} />
                        </Box>
                    </Card>
                </Container>
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ py: 8, px: 2, textAlign: 'center' }}>
                <Container maxWidth="md">
                    <Alert severity="error" sx={{ mb: 4 }}>
                        {error}
                    </Alert>
                    <Button
                        component={Link}
                        to="/eventos"
                        variant="contained"
                        startIcon={<ArrowBackIcon />}
                        sx={{
                            bgcolor: '#3b82f6',
                            '&:hover': {
                                bgcolor: '#2563eb'
                            }
                        }}
                    >
                        Volver a eventos
                    </Button>
                </Container>
            </Box>
        );
    }

    if (!evento) return null;

    return (
        <Box
            sx={{
                py: { xs: 2, md: 3 },
                px: 2,
                backgroundColor: '#f8fafc',
                minHeight: '90vh'
            }}
        >
            <Container maxWidth="lg">
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        mb: 2,
                        gap: 2
                    }}
                >
                    <Button
                        component={Link}
                        to="/eventos"
                        startIcon={<ArrowBackIcon />}
                        sx={{
                            color: '#64748b',
                            '&:hover': {
                                bgcolor: 'rgba(0, 0, 0, 0.04)'
                            }
                        }}
                    >
                        Volver a eventos
                    </Button>
                </Box>

                <Card
                    sx={{
                        display: 'flex',
                        flexDirection: { xs: 'column', md: 'row' },
                        borderRadius: 3,
                        overflow: 'hidden',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.025)'
                    }}
                >
                    <Box
                        sx={{
                            position: 'relative',
                            width: { xs: '100%', md: '45%' },
                            maxHeight: { md: 600 },
                            overflow: 'hidden'
                        }}
                    >
                        <CardMedia
                            component="img"
                            image={evento.imagen}
                            alt={evento.nombre}
                            sx={{
                                width: '100%',
                                height: { xs: 300, md: '100%' },
                                objectFit: 'cover',
                                objectPosition: 'center',
                                transition: 'transform 0.5s ease-in-out',
                                '&:hover': {
                                    transform: 'scale(1.05)'
                                }
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
                            >
                                <BookmarkBorderIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                                size="small"
                                sx={{
                                    bgcolor: 'rgba(255, 255, 255, 0.85)',
                                    '&:hover': {
                                        bgcolor: 'rgba(255, 255, 255, 0.95)'
                                    }
                                }}
                            >
                                <ShareIcon fontSize="small" />
                            </IconButton>
                        </Box>
                        <Chip
                            label={evento.categoria}
                            size="medium"
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
                    </Box>

                    <CardContent
                        sx={{
                            flex: 1,
                            p: { xs: 3, md: 5 },
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 3
                        }}
                    >
                        <Typography
                            variant="h3"
                            component="h1"
                            sx={{
                                fontWeight: 800,
                                color: '#1e293b',
                                lineHeight: 1.2,
                                mb: 1
                            }}
                        >
                            {evento.nombre}
                        </Typography>

                        <Stack direction="row" spacing={4} sx={{ mb: 1 }}>
                            <Stack direction="row" spacing={1} alignItems="center">
                                <CalendarTodayIcon
                                    sx={{
                                        color: '#3b82f6',
                                        fontSize: 20
                                    }}
                                />
                                <Typography
                                    variant="body1"
                                    sx={{
                                        color: '#64748b',
                                        fontWeight: 600
                                    }}
                                >
                                    {evento.fecha}
                                </Typography>
                            </Stack>

                            <Stack direction="row" spacing={1} alignItems="center">
                                <PlaceIcon
                                    sx={{
                                        color: '#3b82f6',
                                        fontSize: 20
                                    }}
                                />
                                <Typography
                                    variant="body1"
                                    sx={{
                                        color: '#64748b',
                                        fontWeight: 600
                                    }}
                                >
                                    {evento.lugar}
                                </Typography>
                            </Stack>

                            {evento.categoria && (
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <CategoryIcon
                                        sx={{
                                            color: '#3b82f6',
                                            fontSize: 20
                                        }}
                                    />
                                    <Typography
                                        variant="body1"
                                        sx={{
                                            color: '#64748b',
                                            fontWeight: 600
                                        }}
                                    >
                                        {evento.categoria}
                                    </Typography>
                                </Stack>
                            )}
                        </Stack>

                        <Divider />

                        <Box>
                            <Typography
                                variant="h6"
                                component="h2"
                                sx={{
                                    fontWeight: 600,
                                    color: '#1e293b',
                                    mb: 2
                                }}
                            >
                                Acerca de este evento
                            </Typography>

                            <Typography
                                variant="body1"
                                sx={{
                                    color: '#334155',
                                    lineHeight: 1.8,
                                    mb: 4,
                                    fontSize: '1.05rem'
                                }}
                            >
                                {evento.descripcion_principal}
                            </Typography>

                            {evento.descripcion_secundaria && (
                                <Box
                                    sx={{
                                        bgcolor: '#f1f5f9',
                                        p: 3,
                                        borderRadius: 2,
                                        borderLeft: '4px solid',
                                        borderColor: '#3b82f6',
                                        mb: 3
                                    }}
                                >
                                    <Typography
                                        variant="body1"
                                        sx={{
                                            color: '#475569',
                                            lineHeight: 1.7,
                                            fontStyle: 'italic'
                                        }}
                                    >
                                        {evento.descripcion_secundaria}
                                    </Typography>
                                </Box>
                            )}
                        </Box>

                        <Box
                            sx={{
                                mt: 'auto',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}
                        >


                        </Box>
                    </CardContent>
                </Card>
            </Container >
        </Box >
    );
};

export default EventDetails;