import { Box } from '@mui/material';
import React, { useState } from 'react';
import { Container, Typography, Card, CardContent, Chip, CardMedia } from '@mui/material';
import { useEffect } from 'react';

const Events = () => {

    const [eventos, setEventos] = useState([]);

    useEffect(() => {
        fetchEventos();
    }
        , []);

    const fetchEventos = async () => {
        try {
            const response = await (fetch('http://localhost:8000/api/eventos/eventos'));
            if (response.ok) {
                const data = await response.json();
                setEventos(data);
                console.log(data);
            } else {
                console.log('Error al obtener los eventos');
            }
        } catch (error) {
            console.error('Error al obtener los eventos', error);
        }
    }

    return (
        <Box sx={{ minHeight: "80vh", display: "flex", flexDirection: "column", backgroundColor: "#f4f7fc", width: "100%", overflowX: "hidden" }}>
            <Container maxwidth="false" sx={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "80vh", flexDirection: "column", width: "100%" }}>
                <Typography variant="h4" sx={{ marginBottom: 2, mt: 2 }}>Próximos eventos</Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "center", width: "100vw " }}>
                    {eventos.map(evento => (
                        <Card key={evento.id} sx={{
                            display: "flex",
                            flexDirection: "column",
                            borderRadius: 2,
                            overflow: "hidden",
                            boxShadow: 3,
                            width: 300,
                            height: 480,
                            mr: 4,
                            mt: 2,
                            mb: 2,
                            transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease',
                            '&:hover': {
                                transform: 'translateY(-4px)',
                                boxShadow: 6
                            }
                        }}>
                            <CardMedia
                                component="img"
                                image={evento.imagen}
                                alt={evento.nombre}
                                sx={{
                                    height: 240,
                                    objectFit: "cover",
                                    borderBottom: "1px solid",
                                    borderColor: "divider"
                                }}
                            />

                            <CardContent sx={{ flexGrow: 1 }}>
                                <Typography
                                    variant="h6"
                                    component="h3"
                                    sx={{
                                        mb: 2,
                                        fontWeight: 600,
                                        color: "text.primary"
                                    }}
                                >
                                    <a href={`/detalles-evento/${evento.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                                        {evento.nombre}
                                    </a>
                                </Typography>


                                <Typography
                                    variant="body2"
                                    sx={{
                                        mb: 2,
                                        color: "text.secondary",
                                        lineHeight: 1.6
                                    }}
                                >
                                    {evento.categoria}
                                </Typography>
                            </CardContent>

                            <CardContent sx={{
                                backgroundColor: "action.hover",
                                py: 2
                            }}>
                                <Box sx={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center"
                                }}>
                                    <Chip
                                        label={evento.fecha}
                                        color="primary"
                                        size="small"
                                        sx={{ fontWeight: 500, mr: 1 }}
                                    />
                                    <Typography
                                        variant="caption"
                                        sx={{
                                            color: "text.secondary",
                                            fontWeight: 500
                                        }}
                                    >
                                        {evento.lugar}
                                    </Typography>
                                </Box>
                            </CardContent>
                        </Card>
                    ))}

                </Box>

            </Container >
        </Box >
    );
}

export default Events;