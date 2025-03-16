
import { Box, Card, CardContent, CardMedia, Container, Typography, Chip } from '@mui/material';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import PlaceIcon from '@mui/icons-material/Place';

const EventDetails = () => {
    const eventoId = useParams().eventoId;
    const [evento, setEvento] = useState(null);

    useEffect(() => {
        fetchEvento(eventoId);

    }, [eventoId]);

    const fetchEvento = async (eventoId) => {
        try {
            const response = await fetch(`http://localhost:8000/api/eventos/eventos/${eventoId}`);
            if (response.ok) {
                const data = await response.json();
                setEvento(data);
                console.log(data);
            } else {
                console.log('Error al obtener el evento');
            }
        } catch (error) {
            console.error('Error al obtener el evento', error);
        }
    }


    return (
        <Box sx={{ minHeigth: "80vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <Container maxWidth="false" sx={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "center", width: "100%" }}>
                <Card sx={{
                    display: 'flex',
                    mt: 2,
                    mb: 2,
                    flexDirection: { xs: 'column', md: 'row' },
                    width: '100%',
                    boxShadow: 3,
                    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                    '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: 6
                    },
                    borderRadius: 2,
                    overflow: 'hidden'
                }}>
                    <CardMedia
                        component="img"
                        image={evento?.imagen}
                        alt={evento?.nombre}
                        sx={{
                            width: { xs: '100%', md: '40%' },
                            maxWidth: 400,
                            mt: 6,
                            ml: 2,
                            height: { xs: 250, md: 320 },
                            objectFit: 'cover',
                            borderRight: { md: '1px solid' },
                            borderColor: 'divider'
                        }}
                    />

                    <CardContent sx={{
                        flex: 1,
                        p: 4,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2
                    }}>
                        <Typography
                            variant="h4"
                            component="h1"
                            sx={{
                                mb: 3,
                                fontWeight: 700,
                                color: 'text.primary',
                                textAlign: { xs: 'center', md: 'left' }
                            }}
                        >
                            {evento?.nombre}
                        </Typography>

                        <Box sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1.5,
                            mb: 2
                        }}>
                            <PlaceIcon color="primary" fontSize="small" />
                            <Typography
                                variant="h6"
                                sx={{
                                    color: 'text.secondary',
                                    fontWeight: 500
                                }}
                            >
                                {evento?.lugar}
                            </Typography>
                        </Box>

                        <Chip
                            label={evento?.fecha}
                            color="primary"
                            sx={{
                                alignSelf: 'flex-start',
                                mb: 2,
                                px: 2,
                                py: 1,
                                fontSize: '1rem'
                            }}
                        />

                        <Typography
                            variant="body1"
                            sx={{
                                color: 'text.secondary',
                                lineHeight: 1.7,
                                mb: 2,
                                whiteSpace: 'pre-line'
                            }}
                        >
                            {evento?.descripcion_principal}
                        </Typography>

                        <Typography
                            variant="body2"
                            sx={{
                                color: 'text.secondary',
                                lineHeight: 1.6,
                                fontStyle: 'italic',
                                opacity: 0.9,
                                borderLeft: '3px solid',
                                borderColor: 'divider',
                                pl: 2,
                                ml: 1
                            }}
                        >
                            {evento?.descripcion_secundaria}
                        </Typography>
                    </CardContent>
                </Card>
            </Container>
        </Box>
    );
}

export default EventDetails;