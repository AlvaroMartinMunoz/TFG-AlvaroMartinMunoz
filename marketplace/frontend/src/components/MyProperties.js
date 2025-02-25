import React, { useEffect } from "react";
import NavBar from "./NavBar";
import Footer from "./Footer";
import { Box, Button, Container, Typography } from "@mui/material";
import { useState } from "react";
import refreshAccessToken from "./RefreshToken";
import { Navigate } from "react-router-dom";


const MyProperties = () => {

    const [mispropiedades, setMisPropiedades] = useState([]);

    useEffect(() => {
        fetchMyProperties();
    }
        , []);

    const handleLogOut = () => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        window.location.reload();
    }

    const fetchMyProperties = async () => {
        const usuarioIdSinParse = localStorage.getItem("additionalInfo");
        const usuarioId = JSON.parse(usuarioIdSinParse).usuarioId;

        try {

            const response = await fetch("http://localhost:8000/api/propiedades/", {
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
        <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", backgroundColor: "#f4f7fc" }}>
            <NavBar />
            <Container maxWidth="lg" sx={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "80vh", flexDirection: "column", }}>
                <Box sx={{ textAlign: "center", width: "100%", marginTop: "20px" }}>
                    <Typography variant="h4" gutterBottom> Mis propiedades </Typography>
                    <p>En esta sección podrás ver todas tus propiedades publicadas</p>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", flexWrap: "wrap", width: "100%", padding: "20px", marginTop: "20px", borderRadius: "10px", overflow: "auto", }}>
                    {mispropiedades.map((propiedad, index) => (

                        <Box key={index} sx={{
                            backgroundColor: "white",
                            border: "1px solid #ccc",
                            padding: 2,
                            width: "calc( 20vw - 16px)",
                            boxSizing: "border-box",
                            aspectRatio: "1/1",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "center",
                            alignItems: "center",
                            borderRadius: "8px",
                            margin: "0 20px",
                            mb: 4
                        }}>
                            <Typography variant="h6" gutterBottom> {propiedad.nombre}</Typography>
                            <p>Descripción de la propiedad 1</p>
                        </Box>
                    ))}


                </Box>
                <Box> <Button onClick={() => window.location.href = "/crear-propiedad"} sx={{ bgcolor: "#1976d2", color: "white", padding: "10px 20px", mb: "20px" }}> Agregar propiedad </Button></Box>
            </Container>
            <Footer />

        </Box>
    )
}

export default MyProperties;