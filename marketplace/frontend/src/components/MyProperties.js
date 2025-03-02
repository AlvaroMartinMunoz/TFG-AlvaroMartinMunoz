import React, { useEffect } from "react";
import NavBar from "./NavBar";
import Footer from "./Footer";
import { Box, Button, Container, Typography, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Paper } from "@mui/material";
import { useState } from "react";
import refreshAccessToken from "./RefreshToken";
import { set } from "date-fns";



const MyProperties = () => {

    const [mispropiedades, setMisPropiedades] = useState([]);
    const [open, setOpen] = useState(false);
    const [selectedProperty, setSelectedProperty] = useState(null);
    const [url, setUrl] = useState([]);

    useEffect(() => {
        fetchMyProperties();
    }
        , []);

    useEffect(() => {

        mispropiedades.forEach((propiedad) => {
            fetchPropertyPhotos(propiedad.id);
        });

    }, [mispropiedades]);


    const fetchPropertyPhotos = async (propiedadId) => {
        try {
            const response = await fetch("http://localhost:8000/api/propiedades/fotos-propiedades/");
            if (response.ok) {
                const data = await response.json();
                const filteredData = data.filter((foto) => foto.propiedad === parseInt(propiedadId));
                const portadaFoto = filteredData.find((foto) => foto.es_portada);
                const url = await portadaFoto ? portadaFoto.foto : "https://source.unsplash.com/1600x900/?house";
                setUrl((prev) => ({ ...prev, [propiedadId]: url }));
            }
        } catch (error) {
            console.log(error);
        }
    };

    const handleLogOut = () => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        window.location.reload();
    }

    const handleClickOpen = (propertyId) => {
        setSelectedProperty(propertyId);
        setOpen(true);
    }

    const handleClose = () => {
        setOpen(false);
        setSelectedProperty(null);
    }

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
    }

    const fetchMyProperties = async () => {
        const usuarioIdSinParse = localStorage.getItem("additionalInfo");
        const usuarioId = JSON.parse(usuarioIdSinParse).usuarioId;

        try {

            const response = await fetch("http://localhost:8000/api/propiedades/propiedades/", {
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
                console.log(data);
                console.log(usuarioId);
                const filtro = await data.filter(propiedad => propiedad.anfitrion === usuarioId);
                setMisPropiedades(filtro);
            }
        }
        catch (error) {
            console.error("Error al obtener las propiedades", error);
        }
    }


    return (
        <Box sx={{ minHeight: "80vh", display: "flex", flexDirection: "column", backgroundColor: "#f4f7fc", width: "100%" }}>

            <Container maxWidth={false} sx={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "80vh", flexDirection: "column", width: "100%" }}>
                <Box sx={{ textAlign: "center", width: "100%", marginTop: "20px" }}>
                    <Typography variant="h4" gutterBottom> Mis propiedades </Typography>
                    <p>En esta sección podrás ver todas tus propiedades publicadas</p>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", flexWrap: "wrap", width: "100%", padding: "20px", borderRadius: "10px", overflow: "auto", }}>
                    {mispropiedades.map((propiedad, index) => (

                        <Paper key={index}
                            elevation={3}
                            sx={{
                                backgroundColor: "white",
                                flex: "0 0 calc(33.333% - 16px)",
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "center",
                                alignItems: "center",
                                borderRadius: 2,
                                overflow: "hidden",
                                mr: 2,
                                ml: 2,

                            }}>
                            <img src={url[propiedad.id]} alt="propiedad" style={{ width: "100%", height: "200px", objectFit: "cover", borderRadius: "8px" }} />
                            <Typography variant="h6" gutterBottom> <a
                                href={`/detalles/${propiedad.id}`}
                                style={{ textDecoration: "none", color: "inherit" }}>{propiedad.nombre}</a></Typography>
                            <Typography variant="body1" sx={{ fontWeight: "bold" }}>
                                {propiedad.precio_por_noche}€/noche
                            </Typography>
                            <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "center", padding: "10px" }}>
                                <Button variant="contained" color="primary" onClick={() => window.location.href = `/editar-propiedad/${propiedad.id}`} sx={{ mr: 1 }}>Editar</Button>
                                <Button variant="contained" color="error" onClick={() => handleClickOpen(propiedad.id)} sx={{ ml: 1 }}>Eliminar</Button>
                            </Box>
                        </Paper>
                    ))}


                </Box>
                <Box>
                    <Button onClick={() => window.location.href = "/crear-propiedad"} sx={{ bgcolor: "#1976d2", color: "white", padding: "10px 20px", mb: "20px" }}> Agregar propiedad </Button>
                </Box>
            </Container >
            <Dialog
                open={open}
                onClose={handleClose}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
            >
                <DialogTitle id="alert-dialog-title">Eliminar propiedad</DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-description">
                        ¿Estás seguro de que deseas eliminar esta propiedad?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Cancelar</Button>
                    <Button onClick={handleConfirmDelete} autoFocus>
                        Eliminar
                    </Button>
                </DialogActions>
            </Dialog>

        </Box >
    )
}

export default MyProperties;