import React, { useEffect, useState } from "react";
import NavBar from "./NavBar";
import Footer from "./Footer";
import {
    Box,
    Button,
    Container,
    Typography,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Paper,
    CircularProgress,
    Card,
    CardMedia,
    CardContent,
    CardActions,
    Divider,
    IconButton,
    Tooltip,
    Fade,
    Chip
} from "@mui/material";
import { Edit as EditIcon, Delete as DeleteIcon, Home as HomeIcon, Add as AddIcon } from "@mui/icons-material";
import refreshAccessToken from "./RefreshToken";

const MyProperties = () => {
    const [mispropiedades, setMisPropiedades] = useState([]);
    const [open, setOpen] = useState(false);
    const [selectedProperty, setSelectedProperty] = useState(null);
    const [url, setUrl] = useState([]);
    const [loading, setLoading] = useState(true);
    const [imageLoading, setImageLoading] = useState({});

    useEffect(() => {
        fetchMyProperties();
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            const photoPromises = mispropiedades.map((propiedad) => fetchPropertyPhotos(propiedad.id));
            await Promise.all(photoPromises);
            setLoading(false);
        };
        fetchData();
    }, [mispropiedades]);

    const fetchPropertyPhotos = async (propiedadId) => {
        setImageLoading((prev) => ({ ...prev, [propiedadId]: true }));
        try {
            const response = await fetch(`http://localhost:8000/api/propiedades/fotos-por-propiedad/${propiedadId}`);
            if (response.ok) {
                const data = await response.json();
                const filteredData = data.filter((foto) => foto.propiedad === parseInt(propiedadId));
                console.log("Filtered Data:", filteredData);
                const portadaFoto = filteredData.find((foto) => foto.es_portada);
                const url = await portadaFoto ? portadaFoto.foto : "https://source.unsplash.com/1600x900/?house";
                setUrl((prev) => ({ ...prev, [propiedadId]: "http://localhost:8000" + url }));
                console.log("URL:", url);
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

    const handleClickOpen = (propertyId) => {
        setSelectedProperty(propertyId);
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        setSelectedProperty(null);
    };

    const handleConfirmDelete = () => {
        if (selectedProperty) {
            handleDeleteProperty(selectedProperty);
            setOpen(false);
        }
    };

    const handleDeleteProperty = async (propertyId) => {
        try {
            const response = await fetch(`http://localhost:8000/api/propiedades/propiedades/${propertyId}/`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("accessToken")}`
                }
            });
            if (response.status === 401) {
                console.log("Token expirado");
                const token = await refreshAccessToken();
                if (token) {
                    handleDeleteProperty(propertyId);
                } else {
                    console.log("Token inválido, cerrando sesión...");
                    handleLogOut();
                }
            }
            if (response.ok) {
                setMisPropiedades(mispropiedades.filter(propiedad => propiedad.id !== propertyId));
            } else {
                console.log("Error al eliminar la propiedad");
            }

        } catch (error) {
            console.error("Error al eliminar la propiedad", error);
        }
    };

    const fetchMyProperties = async () => {
        const usuarioIdSinParse = localStorage.getItem("additionalInfo");
        const usuarioId = JSON.parse(usuarioIdSinParse).usuarioId;

        try {
            const response = await fetch(`http://localhost:8000/api/propiedades/propiedades-por-usuario/${usuarioId}`, {
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
                    fetchMyProperties();
                } else {
                    console.log("Token inválido, cerrando sesión...");
                    handleLogOut();
                }
            }

            if (response.ok) {
                const data = await response.json();
                const filtro = await data.filter(propiedad => propiedad.anfitrion === usuarioId);
                setMisPropiedades(filtro);
            }
        } catch (error) {
            console.error("Error al obtener las propiedades", error);
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
                            <HomeIcon sx={{ fontSize: 32, color: "#1976d2", mr: 1 }} />
                            <Typography variant="h4" fontWeight="600">
                                Mis Propiedades
                            </Typography>
                        </Box>
                        <Divider sx={{ my: 2 }} />
                        <Typography variant="body1" color="text.secondary">
                            Administra todas tus propiedades publicadas desde un solo lugar
                        </Typography>
                    </Box>

                    {mispropiedades.length === 0 ? (
                        <Box sx={{
                            textAlign: "center",
                            p: 5,
                            backgroundColor: "white",
                            borderRadius: 2,
                            boxShadow: "0 4px 20px rgba(0,0,0,0.04)"
                        }}>
                            <Typography variant="h6" gutterBottom>
                                Aún no tienes propiedades publicadas
                            </Typography>
                            <Button
                                variant="contained"
                                startIcon={<AddIcon />}
                                onClick={() => window.location.href = "/crear-propiedad"}
                                sx={{ mt: 2 }}
                            >
                                Agregar propiedad
                            </Button>
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
                                {mispropiedades.map((propiedad) => (
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
                                                }}
                                            />
                                        </Box>
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
                                            <Divider sx={{ my: 1.5 }} />
                                        </CardContent>
                                        <CardActions sx={{ px: 2, pb: 2.5, pt: 0.5, justifyContent: "space-between" }}>
                                            <Tooltip title="Editar propiedad" arrow TransitionComponent={Fade} TransitionProps={{ timeout: 600 }}>
                                                <Button
                                                    variant="outlined"
                                                    startIcon={<EditIcon />}
                                                    onClick={() => window.location.href = `/editar-propiedad/${propiedad.id}`}
                                                    size="medium"
                                                    sx={{
                                                        flex: 1,
                                                        mr: 1,
                                                        borderRadius: 1.5,
                                                        textTransform: "none",
                                                        fontSize: "0.9rem"
                                                    }}
                                                >
                                                    Editar
                                                </Button>
                                            </Tooltip>
                                            <Tooltip title="Eliminar propiedad" arrow TransitionComponent={Fade} TransitionProps={{ timeout: 600 }}>
                                                <Button
                                                    variant="outlined"
                                                    startIcon={<DeleteIcon />}
                                                    onClick={() => handleClickOpen(propiedad.id)}
                                                    color="error"
                                                    size="medium"
                                                    sx={{
                                                        flex: 1,
                                                        ml: 1,
                                                        borderRadius: 1.5,
                                                        textTransform: "none",
                                                        fontSize: "0.9rem"
                                                    }}
                                                >
                                                    Eliminar
                                                </Button>
                                            </Tooltip>
                                        </CardActions>
                                    </Card>
                                ))}
                            </Box>
                            <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
                                <Button
                                    variant="contained"
                                    startIcon={<AddIcon />}
                                    onClick={() => window.location.href = "/crear-propiedad"}
                                    sx={{
                                        px: 4,
                                        py: 1.2,
                                        borderRadius: 2,
                                        fontSize: "1rem",
                                        textTransform: "none",
                                        boxShadow: "0 4px 14px rgba(25, 118, 210, 0.3)",
                                        "&:hover": {
                                            boxShadow: "0 6px 20px rgba(25, 118, 210, 0.4)"
                                        }
                                    }}
                                >
                                    Agregar propiedad
                                </Button>
                            </Box>
                        </>
                    )}
                </Container>
            )}

            <Dialog
                open={open}
                onClose={handleClose}
                PaperProps={{
                    sx: {
                        borderRadius: 2,
                        p: 1,
                        maxWidth: 400
                    }
                }}
            >
                <DialogTitle sx={{ fontSize: "1.2rem", fontWeight: 600 }}>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                        <DeleteIcon color="error" sx={{ mr: 1.5 }} />
                        Eliminar propiedad
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ color: "text.primary" }}>
                        ¿Estás seguro de que deseas eliminar esta propiedad? Esta acción no se puede deshacer.
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3 }}>
                    <Button
                        onClick={handleClose}
                        variant="outlined"
                        sx={{ borderRadius: 1.5, textTransform: "none" }}
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleConfirmDelete}
                        variant="contained"
                        color="error"
                        autoFocus
                        sx={{
                            borderRadius: 1.5,
                            ml: 1.5,
                            textTransform: "none",
                            boxShadow: "0 2px 8px rgba(211, 47, 47, 0.2)"
                        }}
                    >
                        Eliminar
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default MyProperties;