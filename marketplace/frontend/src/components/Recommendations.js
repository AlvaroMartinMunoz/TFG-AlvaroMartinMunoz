import React, { useEffect, useState } from "react";
import {
    Container,
    Typography,
    Box,
    Card,
    CardContent,
    CardMedia,
    Chip,
    Stack,
    Rating,
    CircularProgress,
    Alert,
    Paper,
    Button,
    Divider
} from "@mui/material";
import {
    Wifi as WifiIcon,
    LocalParking as ParkingIcon,
    Pets as PetsIcon
} from "@mui/icons-material";

const Recommendations = () => {
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchRecommendations = async () => {
            try {
                const response = await fetch("http://localhost:8000/api/propiedades/recomendaciones/", {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                    },
                });

                if (!response.ok) {
                    throw new Error("Error al obtener recomendaciones");
                }

                const data = await response.json();
                setRecommendations(data);
            } catch (error) {
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };

        if (localStorage.getItem("accessToken")) {
            fetchRecommendations();
        } else {
            setLoading(false);
        }
    }, []);

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
                <CircularProgress />
                <Typography variant="h6" sx={{ ml: 2 }}>
                    Cargando recomendaciones...
                </Typography>
            </Box>
        );
    }

    if (error) {
        return (
            <Box my={4}>
                <Alert severity="error">Error: {error}</Alert>
            </Box>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Typography variant="h4" component="h2" gutterBottom fontWeight="bold">
                Recomendaciones para ti
            </Typography>
            <Divider sx={{ mb: 4 }} />

            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
                {recommendations.length > 0 ? (
                    recommendations.map((propiedad) => (
                        <Card
                            key={propiedad.id}
                            sx={{
                                maxWidth: 345,
                                width: "100%",
                                transition: "0.3s",
                                "&:hover": {
                                    boxShadow: 6,
                                    transform: "translateY(-5px)"
                                }
                            }}
                        >
                            <CardMedia
                                component="div"
                                sx={{ height: 180, backgroundColor: "grey.200" }}
                                title={propiedad.nombre}
                            />
                            <CardContent>
                                <Typography variant="h6" component="h3" gutterBottom noWrap>
                                    {propiedad.nombre}
                                </Typography>

                                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2, alignItems: "center" }}>
                                    <Typography variant="h6" color="primary" fontWeight="bold">
                                        ${propiedad.precio_por_noche}/noche
                                    </Typography>
                                    <Box sx={{ display: "flex", alignItems: "center" }}>
                                        <Rating value={propiedad.score} precision={0.5} readOnly size="small" />
                                        <Typography variant="body2" sx={{ ml: 0.5 }}>
                                            ({propiedad.score.toFixed(1)})
                                        </Typography>
                                    </Box>
                                </Box>

                                <Typography variant="body2" color="text.secondary" sx={{
                                    mb: 2,
                                    display: "-webkit-box",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: "vertical"
                                }}>
                                    {propiedad.descripcion}
                                </Typography>

                                <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 2 }}>
                                    <Chip
                                        label={`${propiedad.ciudad}, ${propiedad.pais}`}
                                        size="small"
                                        variant="outlined"
                                        sx={{ mb: 1 }}
                                    />
                                    <Chip
                                        label={propiedad.tipo_de_propiedad}
                                        size="small"
                                        variant="outlined"
                                        sx={{ mb: 1 }}
                                    />
                                </Stack>

                                <Stack direction="row" spacing={1}>
                                    {propiedad.wifi && (
                                        <Chip icon={<WifiIcon />} label="WiFi" size="small" variant="outlined" />
                                    )}
                                    {propiedad.parking && (
                                        <Chip icon={<ParkingIcon />} label="Parking" size="small" variant="outlined" />
                                    )}
                                    {propiedad.mascotas && (
                                        <Chip icon={<PetsIcon />} label="Mascotas" size="small" variant="outlined" />
                                    )}
                                </Stack>
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <Paper elevation={0} sx={{ width: "100%", p: 4, textAlign: "center", bgcolor: "grey.50" }}>
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                            No hay recomendaciones disponibles en este momento
                        </Typography>
                        <Button variant="outlined" sx={{ mt: 2 }}>
                            Explorar propiedades
                        </Button>
                    </Paper>
                )}
            </Box>
        </Container>
    );
};

export default Recommendations;