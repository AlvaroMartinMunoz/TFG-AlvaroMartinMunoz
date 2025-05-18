import React, { useEffect, useState } from "react";
import {
    Box,
    Container,
    Typography,
    CircularProgress,
    Card,
    CardMedia,
    CardContent,
    Divider,
    Chip
} from "@mui/material";
import refreshAccessToken from "./RefreshToken";
import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import IconButton from "@mui/material/IconButton";
import { useFavoritos } from "../context/FavoritosContext";
import API_BASE_URL from "../apiConfig";


const Myfavorites = () => {
    const { actualizarFavoritosNavbar } = useFavoritos();
    const [url, setUrl] = useState([]);
    const [loading, setLoading] = useState(true);
    const [imageLoading, setImageLoading] = useState({});
    const [misfavoritos, setMisFavoritos] = useState([]);
    const [misPropiedadesfavoritas, setMisPropiedadesfavoritas] = useState([]);

    useEffect(() => {
        fetchMyFavorites();
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            const photoPromises = misPropiedadesfavoritas.map((propiedad) => fetchPropertyPhotos(propiedad.id));
            await Promise.all(photoPromises);
            setLoading(false);
        };
        fetchData();
    }, [misPropiedadesfavoritas]);

    useEffect(() => {
        const fetchData = async () => {
            const uniquePropIds = [...new Set(misfavoritos.map((favorito) => favorito.propiedad))];
            await Promise.all(uniquePropIds.map((propiedadId) => fetchMyFavoritesProperties(propiedadId)));
        };

        fetchData();
    }, [misfavoritos,]);

    const isAuthenticated = () => {
        return !!localStorage.getItem("accessToken");
    };

    const toggleFavorito = async (propiedadId, retried = false) => {
        try {
            const propiedadIdNum = parseInt(propiedadId);
            const favorito = misfavoritos.find((favorito) => favorito.propiedad === propiedadId && favorito.usuario === JSON.parse(localStorage.getItem("additionalInfo"))?.usuarioId);
            const isFavorito = !!favorito;

            const favoritoId = misfavoritos.find((favorito) => favorito.propiedad === propiedadId)?.id;

            if (isFavorito) {
                const data = await fetch(`${API_BASE_URL}/api/propiedades/favoritos/${favoritoId}/`, {
                    method: "DELETE",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                    },
                });
                if (data.status === 401 && !retried) {
                    const token = await refreshAccessToken();
                    if (token) {
                        toggleFavorito(propiedadId, true);
                    }
                    else {
                        throw new Error("Error al refrescar el token");
                    }
                }
            } else if (!isFavorito) {
                const data = await fetch(`${API_BASE_URL}/api/propiedades/favoritos/`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                    },
                    body: JSON.stringify({ propiedad: propiedadIdNum, usuario: JSON.parse(localStorage.getItem("additionalInfo"))?.usuarioId }),
                });
                if (data.status === 401 && !retried) {
                    const token = await refreshAccessToken();
                    if (token) {
                        toggleFavorito(propiedadId, true);
                    } else {
                        throw new Error("Error al refrescar el token");
                    }
                }
            }
            fetchMyFavorites();
            window.location.reload();
            actualizarFavoritosNavbar();
        } catch (error) {
            console.error("Error al añadir a favoritos:", error);
        }
    };



    const fetchPropertyPhotos = async (propiedadId) => {
        setImageLoading((prev) => ({ ...prev, [propiedadId]: true }));
        try {
            const response = await fetch(`${API_BASE_URL}/api/propiedades/fotos-propiedades/`);
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

    const handleLogOut = () => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        window.location.reload();
    };


    const fetchMyFavoritesProperties = async (propiedadId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/propiedades/propiedades/${propiedadId}/`, {
                method: "GET",
            });

            if (response.ok) {
                const data = await response.json();
                setMisPropiedadesfavoritas((prev) => {
                    // Evitar duplicados
                    const existe = prev.some((prop) => prop.id === data.id);
                    return existe ? prev : [...prev, data];
                });
            }
        } catch (error) {
            console.error("Error al obtener las propiedades", error);
        }
    };


    const fetchMyFavorites = async () => {
        const usuarioId = JSON.parse(localStorage.getItem("additionalInfo")).usuarioId
        try {
            const response = await fetch(`${API_BASE_URL}/api/propiedades/favoritos/`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("accessToken")}`
                }
            });

            if (response.status === 401) {
                console.log("Token expirado");
                const token = await refreshAccessToken();
                if (token) {
                    fetchMyFavorites();

                } else {
                    console.log("Token inválido, cerrando sesión...");
                    handleLogOut();
                }
            }

            if (response.ok) {
                const data = await response.json();
                const filtro = await data.filter(favorito => favorito.usuario === usuarioId);
                setMisFavoritos(filtro);
            }
        } catch (error) {
            console.error("Error al obtener los favoritos", error);
        }
    };

    return (
        <Box sx={{
            minHeight: "80vh",
            display: "flex",
            flexDirection: "column",
            backgroundColor: "#f5f7fa",
            width: "100%",
            pb: 5
        }}>
            {loading ? (
                <Box sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: "80vh"
                }}>
                    <CircularProgress color="primary" />
                </Box>
            ) : (
                <Container maxWidth="lg" sx={{ flex: 1, py: 4 }}>
                    <Box sx={{
                        mb: 5,
                        textAlign: "center",
                        backgroundColor: "white",
                        p: 3,
                        borderRadius: 2,
                        boxShadow: "0 4px 20px rgba(0,0,0,0.04)"
                    }}>
                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", mb: 1 }}>
                            <FavoriteIcon sx={{ fontSize: 32, color: "#1976d2", mr: 1 }} />
                            <Typography variant="h4" fontWeight="600">
                                Mis Propiedades Favoritas
                            </Typography>
                        </Box>
                        <Divider sx={{ my: 2 }} />
                        <Typography variant="body1" color="text.secondary">
                            Aquí encontrarás todas las propiedades que has marcado como favoritas
                        </Typography>
                    </Box>

                    {misPropiedadesfavoritas.length === 0 ? (
                        <Box sx={{
                            textAlign: "center",
                            p: 5,
                            backgroundColor: "white",
                            borderRadius: 2,
                            boxShadow: "0 4px 20px rgba(0,0,0,0.04)"
                        }}>
                            <Typography variant="h6" gutterBottom>
                                No tienes propiedades favoritas
                            </Typography>

                        </Box>
                    ) : (
                        <>
                            <Box sx={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: 3,
                                justifyContent: { xs: "center", sm: "flex-start" },
                                mb: 4
                            }}>
                                {misPropiedadesfavoritas?.map((propiedad, index) => (
                                    <Card
                                        key={propiedad.id}
                                        sx={{
                                            width: { xs: "100%", sm: "calc(50% - 16px)", md: "calc(33.333% - 16px)" },
                                            minWidth: { xs: "100%", sm: "300px", md: "280px" },
                                            maxWidth: "350px",
                                            borderRadius: 2,
                                            overflow: "hidden",
                                            boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                                            transition: "transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
                                            "&:hover": {
                                                transform: "translateY(-5px)",
                                                boxShadow: "0 8px 25px rgba(0,0,0,0.12)"
                                            }
                                        }}
                                    >
                                        <Box sx={{ position: "relative", height: 200 }}>
                                            {imageLoading[propiedad.id] ? (
                                                <Box sx={{
                                                    height: "100%",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    backgroundColor: "#f0f2f5"
                                                }}>
                                                    <CircularProgress size={40} />
                                                </Box>
                                            ) : (
                                                <CardMedia
                                                    component="img"
                                                    height="200"
                                                    image={url[propiedad.id]}
                                                    alt={propiedad.nombre}
                                                    sx={{ objectFit: "cover" }}
                                                />
                                            )}
                                            {isAuthenticated() ? (
                                                <IconButton
                                                    onClick={() => toggleFavorito(propiedad.id)}
                                                    sx={{
                                                        position: "absolute",
                                                        top: 10,
                                                        right: 10,
                                                        bgcolor: "rgba(255, 255, 255, 0.9)",
                                                        "&:hover": {
                                                            bgcolor: "rgba(255, 255, 255, 0.95)",
                                                        },
                                                    }}
                                                    size="small"
                                                >
                                                    {misfavoritos.filter(favorito => favorito.propiedad === propiedad.id && favorito.usuario === JSON.parse(localStorage.getItem("additionalInfo")).usuarioId).length > 0 ? (
                                                        <FavoriteIcon sx={{ color: "#e91e63" }} />
                                                    ) : (
                                                        <FavoriteBorderIcon sx={{ color: "#091630" }} />
                                                    )}
                                                </IconButton>
                                            ) : null}
                                            <Chip
                                                label={`${propiedad.precio_por_noche}€/noche`}
                                                sx={{
                                                    position: "absolute",
                                                    bottom: 10,
                                                    right: 10,
                                                    backgroundColor: "rgba(255, 255, 255, 0.9)",
                                                    color: "#1976d2",
                                                    fontWeight: "bold",
                                                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
                                                }
                                                }
                                            />
                                        </Box >
                                        <CardContent sx={{ p: 2.5 }}>
                                            <Typography
                                                variant="h6"
                                                component="a"
                                                href={`/detalles/${propiedad.id}`}
                                                sx={{
                                                    textDecoration: "none",
                                                    color: "inherit",
                                                    display: "block",
                                                    mb: 1,
                                                    fontWeight: 600,
                                                    "&:hover": {
                                                        color: "#1976d2"
                                                    }
                                                }}
                                            >
                                                {propiedad.nombre}
                                            </Typography>
                                            {/* <Divider sx={{ my: 1.5 }} /> */}
                                        </CardContent>

                                    </Card >
                                ))}
                            </Box >

                        </>
                    )}
                </Container >
            )
            }

        </Box >
    );
};

export default Myfavorites;