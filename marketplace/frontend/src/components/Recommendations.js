import React, { useEffect, useState, useCallback } from "react";
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
    Divider,
    IconButton,
    Fade,
    Tooltip
} from "@mui/material";
import {
    Wifi as WifiIcon,
    LocalParking as ParkingIcon,
    Pets as PetsIcon,
    LocationOn as LocationIcon
} from "@mui/icons-material";
import refreshAccessToken from "./RefreshToken";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import FavoriteIcon from "@mui/icons-material/Favorite";
import { useFavoritos } from "../context/FavoritosContext";
import { API_BASE_URL } from "../apiConfig";


const Recommendations = () => {
    const usuarioId = JSON.parse(localStorage.getItem("additionalInfo")).usuarioId;
    const { actualizarFavoritosNavbar } = useFavoritos();
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [propertyImages, setPropertyImages] = useState({});
    const [propertyRatings, setPropertyRatings] = useState({});
    const [imageLoading, setImageLoading] = useState({});
    const [favorites, setFavorites] = useState([]);

    const isAuthenticated = () => {
        return !!localStorage.getItem("accessToken");
    };

    const getUserId = () => {
        const additionalInfo = localStorage.getItem("additionalInfo");
        return additionalInfo ? JSON.parse(additionalInfo)?.usuarioId : null;
    };

    const fetchRecommendations = useCallback(async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/propiedades/recomendaciones/`, {
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
        }
    }, []);

    const fetchFavorites = useCallback(async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/propiedades/favoritos-por-usuario/${usuarioId}`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setFavorites(data);
                actualizarFavoritosNavbar();
            } else {
                throw new Error("Error al obtener los favoritos");
            }
        } catch (error) {
            console.error("Error al obtener los favoritos:", error);
        }
    }, []);

    const fetchPropertyPhotos = useCallback(async (propertyId) => {
        setImageLoading((prev) => ({ ...prev, [propertyId]: true }));
        try {
            const response = await fetch(`${API_BASE_URL}/api/propiedades/fotos-propiedades/`);
            if (response.ok) {
                const data = await response.json();
                const filteredData = data.filter((foto) => foto.propiedad === parseInt(propertyId));
                const coverPhoto = filteredData.find((foto) => foto.es_portada);
                const imageUrl = coverPhoto ? coverPhoto.foto : "https://source.unsplash.com/1600x900/?house";
                setPropertyImages((prev) => ({ ...prev, [propertyId]: imageUrl }));
            }
        } catch (error) {
            console.error("Error fetching property photos:", error);
        } finally {
            setImageLoading((prev) => ({ ...prev, [propertyId]: false }));
        }
    }, []);

    const fetchPropertyRatings = useCallback(async (propertyId) => {
        try {
            const response = await fetch(
                `${API_BASE_URL}/api/propiedades/valoraciones-propiedades/${propertyId}/media-valoraciones/`
            );
            if (response.ok) {
                const data = await response.json();
                setPropertyRatings((prev) => ({ ...prev, [propertyId]: data.media }));
            }
        } catch (error) {
            console.error("Error fetching property ratings:", error);
        }
    }, []);

    const toggleFavorite = useCallback(async (propertyId, retried = false) => {
        try {
            const userId = getUserId();
            if (!userId) return;

            const propertyIdNum = parseInt(propertyId);
            const favorite = favorites.find(
                (fav) => fav.propiedad === propertyId && fav.usuario === userId
            );
            const isFavorite = !!favorite;
            const favoriteId = favorite?.id;

            const endpoint = isFavorite
                ? `${API_BASE_URL}/api/propiedades/favoritos/${favoriteId}/`
                : `${API_BASE_URL}/api/propiedades/favoritos/`;

            const method = isFavorite ? "DELETE" : "POST";
            const body = isFavorite ? undefined : JSON.stringify({
                propiedad: propertyIdNum,
                usuario: userId
            });

            const response = await fetch(endpoint, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                },
                ...(body && { body }),
            });

            if (response.status === 401 && !retried) {
                const token = await refreshAccessToken();
                if (token) {
                    toggleFavorite(propertyId, true);
                } else {
                    throw new Error("Error al refrescar el token");
                }
                return;
            }

            if (!response.ok) {
                throw new Error(`Error ${isFavorite ? "eliminando" : "añadiendo"} favorito`);
            }

            fetchFavorites();
            actualizarFavoritosNavbar();
        } catch (error) {
            console.error("Error toggling favorite:", error);
        }
    }, [favorites, fetchFavorites]);

    useEffect(() => {
        if (isAuthenticated()) {
            fetchRecommendations();
            fetchFavorites();
            actualizarFavoritosNavbar();
        } else {
            setLoading(false);
        }
    }, [fetchRecommendations, fetchFavorites]);

    useEffect(() => {
        const fetchAllPropertyData = async () => {
            if (recommendations.length === 0) return;

            const fetchPromises = recommendations.flatMap((property) => [
                fetchPropertyPhotos(property.id),
                fetchPropertyRatings(property.id)
            ]);

            await Promise.all(fetchPromises);
            setLoading(false);
        };

        fetchAllPropertyData();
    }, [recommendations, fetchPropertyPhotos, fetchPropertyRatings]);

    const isPropertyFavorite = (propertyId) => {
        const userId = getUserId();
        return favorites.some(fav => fav.propiedad === propertyId && fav.usuario === userId);
    };

    if (loading) {
        return (
            <Box
                display="flex"
                flexDirection="column"
                justifyContent="center"
                alignItems="center"
                minHeight="60vh"
                gap={2}
            >
                <CircularProgress
                    color="primary"
                    size={40}
                    thickness={4}
                />
                <Typography
                    variant="h5"
                    sx={{
                        fontWeight: 600,
                        color: "text.primary",
                        textAlign: "center",
                        mb: 1
                    }}
                >
                    Preparando sus recomendaciones
                </Typography>
                <Typography
                    variant="body1"
                    sx={{
                        color: "text.secondary",
                        textAlign: "center",
                        maxWidth: 450,
                        px: 3
                    }}
                >
                    Para visualizar recomendaciones personalizadas, verifique que ha iniciado sesión y cuenta con propiedades valoradas, guardadas como favoritas o con reservas previas.
                </Typography>
            </Box>
        );
    }

    if (error) {
        return (
            <Box my={4}>
                <Alert severity="error" variant="filled">
                    Error: {error}
                </Alert>
            </Box>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ py: 5 }}>
            <Typography
                variant="h4"
                component="h1"
                gutterBottom
                fontWeight="700"
                sx={{
                    borderLeft: '4px solid #2196f3',
                    pl: 2,
                    color: '#091630'
                }}
            >
                Recomendaciones personalizadas para ti
            </Typography>
            <Divider sx={{ mb: 4 }} />

            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3, justifyContent: "flex-start" }}>
                {recommendations.length > 0 ? (
                    recommendations.map((property) => (
                        <Fade in={true} key={property.id} timeout={500}>
                            <Card
                                sx={{
                                    width: { xs: '100%', sm: 'calc(50% - 12px)', md: 'calc(33.33% - 16px)' },
                                    borderRadius: 2,
                                    overflow: "hidden",
                                    boxShadow: '0 6px 16px rgba(0, 0, 0, 0.08)',
                                    transition: "transform 0.3s, box-shadow 0.3s",
                                    "&:hover": {
                                        transform: "translateY(-8px)",
                                        boxShadow: '0 12px 24px rgba(0, 0, 0, 0.12)'
                                    }
                                }}
                            >
                                <Box sx={{ position: "relative" }}>
                                    <CardMedia
                                        component="img"
                                        height="220"
                                        image={propertyImages[property.id] || "https://source.unsplash.com/1600x900/?house"}
                                        alt={property.nombre}
                                        sx={{
                                            objectFit: "cover",
                                            filter: imageLoading[property.id] ? "blur(10px)" : "none",
                                            transition: "filter 0.5s ease-in-out"
                                        }}
                                    />
                                    {isAuthenticated() && (
                                        <IconButton
                                            onClick={() => toggleFavorite(property.id)}
                                            aria-label={isPropertyFavorite(property.id) ? "Quitar de favoritos" : "Añadir a favoritos"}
                                            sx={{
                                                position: "absolute",
                                                top: 12,
                                                right: 12,
                                                bgcolor: "rgba(255, 255, 255, 0.9)",
                                                boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                                                transition: "transform 0.2s",
                                                "&:hover": {
                                                    bgcolor: "white",
                                                    transform: "scale(1.1)"
                                                },
                                            }}
                                        >
                                            {isPropertyFavorite(property.id) ? (
                                                <FavoriteIcon sx={{ color: "#e91e63" }} />
                                            ) : (
                                                <FavoriteBorderIcon sx={{ color: "#091630" }} />
                                            )}
                                        </IconButton>
                                    )}
                                    <Chip
                                        label={`${property.score}% coincidencia`}
                                        size="small"
                                        color="primary"
                                        sx={{
                                            position: "absolute",
                                            bottom: 12,
                                            left: 12,
                                            fontWeight: "bold",
                                            backgroundColor: "#091630",
                                            boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                                        }}
                                    />
                                </Box>

                                <CardContent sx={{ p: 3 }}>
                                    <Typography
                                        variant="h6"
                                        component="h2"
                                        gutterBottom
                                        noWrap
                                        sx={{
                                            fontWeight: 600,
                                            color: "#091630"
                                        }}
                                    >
                                        <a
                                            href={`/detalles/${property.id}`}
                                            style={{
                                                textDecoration: "none",
                                                color: "#091630",
                                                transition: "color 0.2s ease",
                                                "&:hover": {
                                                    color: "#2a4a8d"
                                                }
                                            }}
                                        >
                                            {property.nombre}
                                        </a>
                                    </Typography>

                                    <Box sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        mb: 1.5,
                                        color: "text.secondary"
                                    }}>
                                        <LocationIcon sx={{ fontSize: 18, mr: 0.5 }} />
                                        <Typography variant="body2">
                                            {property.ciudad}, {property.pais}
                                        </Typography>
                                    </Box>

                                    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2, alignItems: "center" }}>
                                        <Typography
                                            variant="h6"
                                            color="primary"
                                            fontWeight="700"
                                            sx={{ color: "#2196f3" }}
                                        >
                                            ${property.precio_por_noche}
                                            <Typography
                                                component="span"
                                                variant="body2"
                                                color="text.secondary"
                                                sx={{ ml: 0.5 }}
                                            >
                                                /noche
                                            </Typography>
                                        </Typography>
                                        <Box sx={{ display: "flex", alignItems: "center" }}>
                                            <Rating
                                                value={propertyRatings[property.id] || 0}
                                                precision={0.5}
                                                readOnly
                                                size="small"
                                            />
                                            {propertyRatings[property.id] && (
                                                <Typography
                                                    variant="body2"
                                                    sx={{ ml: 0.5, fontWeight: "bold" }}
                                                >
                                                    {propertyRatings[property.id].toFixed(1)}
                                                </Typography>
                                            )}
                                        </Box>
                                    </Box>

                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                        sx={{
                                            mb: 2,
                                            display: "-webkit-box",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: "vertical",
                                            height: "40px"
                                        }}
                                    >
                                        {property.descripcion}
                                    </Typography>

                                    <Divider sx={{ my: 2 }} />

                                    <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 2 }}>
                                        <Chip
                                            label={property.tipo_de_propiedad}
                                            size="small"
                                            color="default"
                                            variant="outlined"
                                            sx={{ mb: 1 }}
                                        />
                                        <Box sx={{ flexGrow: 1 }} />
                                        {property.wifi && (
                                            <Tooltip title="WiFi disponible">
                                                <Chip
                                                    icon={<WifiIcon />}
                                                    size="small"
                                                    variant="outlined"
                                                    sx={{ mb: 1 }}
                                                />
                                            </Tooltip>
                                        )}
                                        {property.parking && (
                                            <Tooltip title="Estacionamiento disponible">
                                                <Chip
                                                    icon={<ParkingIcon />}
                                                    size="small"
                                                    variant="outlined"
                                                    sx={{ mb: 1 }}
                                                />
                                            </Tooltip>
                                        )}
                                        {property.mascotas && (
                                            <Tooltip title="Admite mascotas">
                                                <Chip
                                                    icon={<PetsIcon />}
                                                    size="small"
                                                    variant="outlined"
                                                    sx={{ mb: 1 }}
                                                />
                                            </Tooltip>
                                        )}
                                    </Stack>

                                    <Button
                                        variant="contained"
                                        href={`/detalles/${property.id}`}
                                        fullWidth
                                        sx={{
                                            mt: 1,
                                            backgroundColor: "#091630",
                                            "&:hover": {
                                                backgroundColor: "#2196f3"
                                            }
                                        }}
                                    >
                                        Ver detalles
                                    </Button>
                                </CardContent>
                            </Card>
                        </Fade>
                    ))
                ) : (
                    <Paper
                        elevation={0}
                        sx={{
                            width: "100%",
                            p: 5,
                            textAlign: "center",
                            bgcolor: "grey.50",
                            borderRadius: 2
                        }}
                    >
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                            No hay recomendaciones disponibles en este momento
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                            Explora propiedades disponibles o vuelve más tarde para ver recomendaciones personalizadas.
                        </Typography>
                        <Button
                            variant="contained"
                            sx={{
                                backgroundColor: "#091630",
                                "&:hover": {
                                    backgroundColor: "#2196f3"
                                }
                            }}
                        >
                            Explorar propiedades
                        </Button>
                    </Paper>
                )}
            </Box>
        </Container >
    );
};

export default Recommendations;