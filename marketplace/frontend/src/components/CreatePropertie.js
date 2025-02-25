import { Box, Container, Typography, TextField, FormControlLabel, Checkbox, FormControl, InputLabel, Select, MenuItem, Button } from "@mui/material";
import React from "react";
import NavBar from "./NavBar";
import Footer from "./Footer";
import { useState } from "react";
import refreshAccessToken from "./RefreshToken";


const CreatePropertie = () => {

    const [formValues, setFormValues] = useState({
        anfitrion: JSON.parse(localStorage.getItem("additionalInfo")).usuarioId,
        nombre: "",
        descripcion: "",
        direccion: "",
        ciudad: "",
        codigo_postal: "",
        pais: "España",
        tipo_de_propiedad: "",
        precio_por_noche: "",
        disponible_desde: "",
        disponible_hasta: "",
        maximo_huespedes: "",
        numero_de_habitaciones: "",
        numero_de_banos: "",
        numero_de_camas: "",
        tamano: "",
        wifi: false,
        aire_acondicionado: false,
        calefaccion: false,
        parking: false,
        mascotas: false,
        permitido_fumar: false,
        latitud: "",
        longitud: "",
        politica_de_cancelacion: ""
    });

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        const newValue = type === "checkbox" ? checked : value;
        setFormValues({ ...formValues, [name]: newValue });
    }

    const handleLogOut = () => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        window.location.reload();
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch("http://localhost:8000/api/propiedades/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("accessToken")}`
                },
                body: JSON.stringify(formValues)
            });

            if (response.status === 401) {
                console.log("Token expirado");
                const token = await refreshAccessToken();
                if (token) {
                    handleSubmit(e);
                } else {
                    console.log("Token inválido, cerrando sesión...");
                    handleLogOut();
                }
            }

            if (response.ok) {
                console.log("Propiedad creada con éxito");
            }
            else {
                console.error("Error al crear la propiedad");
            }


        } catch (error) {
            console.error("Error al crear la propiedad", error);
        };
    }

    return (
        <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", bgcolor: "#f4f7fc" }}>
            <NavBar />
            <Container maxWidth="lg" sx={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "80vh", flexDirection: "column", }}>
                <Box sx={{ mt: "20px" }}><Typography variant="h4" gutterBottom> Crear nueva propiedad</Typography></Box>
                <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "row", width: "100%", maxWidth: "1200px", marginTop: "20px" }}>
                    <Box sx={{ display: "flex", flexDirection: "column", width: "25%", paddingRight: "10px" }}>
                        <TextField label="Nombre" name="nombre" variant="outlined" value={formValues.nombre} onChange={handleChange} sx={{ marginBottom: "20px" }} required />
                        <TextField label="Descripción" name="descripcion" variant="outlined" value={formValues.descripcion} onChange={handleChange} sx={{ marginBottom: "20px" }} required />
                        <TextField label="Dirección" name="direccion" variant="outlined" value={formValues.direccion} onChange={handleChange} sx={{ marginBottom: "20px" }} required />
                        <TextField label="Ciudad" name="ciudad" variant="outlined" value={formValues.ciudad} onChange={handleChange} sx={{ marginBottom: "20px" }} required />
                        <TextField label="Pais" name="pais" variant="outlined" value={formValues.pais} onChange={handleChange} sx={{ marginBottom: "20px" }} />
                        <TextField label="Código Postal" name="codigo_postal" variant="outlined" value={formValues.codigo_postal} onChange={handleChange} sx={{ marginBottom: "20px" }} required />
                    </Box>
                    <Box sx={{ display: "flex", flexDirection: "column", width: "25%", paddingRight: "10px" }}>
                        <FormControl variant="outlined" sx={{ marginBottom: "20px" }}>
                            <InputLabel>Tipo de Propiedad</InputLabel>
                            <Select name="tipo_de_propiedad" value={formValues.tipo_de_propiedad} onChange={handleChange} label="Tipo de Propiedad" required>
                                <MenuItem value="Apartamento">Apartamento</MenuItem>
                                <MenuItem value="Casa">Casa</MenuItem>
                                <MenuItem value="Villa">Villa</MenuItem>
                            </Select>
                        </FormControl>
                        <TextField label="Precio por Noche" name="precio_por_noche" type="number" variant="outlined" value={formValues.precio_por_noche} onChange={handleChange} sx={{ marginBottom: "20px" }} required />
                        <TextField label="Disponible Desde" name="disponible_desde" type="date" variant="outlined" value={formValues.disponible_desde} onChange={handleChange} sx={{ marginBottom: "20px" }} InputLabelProps={{ shrink: true }} required />
                        <TextField label="Disponible Hasta" name="disponible_hasta" type="date" variant="outlined" value={formValues.disponible_hasta} onChange={handleChange} sx={{ marginBottom: "20px" }} InputLabelProps={{ shrink: true }} required />
                        <TextField label="Máximo de Huéspedes" name="maximo_huespedes" type="number" variant="outlined" value={formValues.maximo_huespedes} onChange={handleChange} sx={{ marginBottom: "20px" }} required />
                        <TextField label="Número de Habitaciones" name="numero_de_habitaciones" type="number" variant="outlined" value={formValues.numero_de_habitaciones} onChange={handleChange} sx={{ marginBottom: "20px" }} required />

                    </Box>
                    <Box sx={{ display: "flex", flexDirection: "column", width: "25%", paddingRight: "10px" }}>
                        <TextField label="Número de Baños" name="numero_de_banos" type="number" variant="outlined" value={formValues.numero_de_banos} onChange={handleChange} sx={{ marginBottom: "20px" }} required />
                        <TextField label="Número de Camas" name="numero_de_camas" type="number" variant="outlined" value={formValues.numero_de_camas} onChange={handleChange} sx={{ marginBottom: "20px" }} required />
                        <TextField label="Tamaño (m²)" name="tamano" type="number" variant="outlined" value={formValues.tamano} onChange={handleChange} sx={{ marginBottom: "20px" }} required />
                        <TextField label="Latitud" name="latitud" type="number" variant="outlined" value={formValues.latitud} onChange={handleChange} sx={{ marginBottom: "20px" }} />
                        <TextField label="Longitud" name="longitud" type="number" variant="outlined" value={formValues.longitud} onChange={handleChange} sx={{ marginBottom: "20px" }} />
                        <FormControl variant="outlined" sx={{ marginBottom: "20px" }}>
                            <InputLabel>Política de Cancelación</InputLabel>
                            <Select name="politica_de_cancelacion" value={formValues.politica_de_cancelacion} onChange={handleChange} label="Política de Cancelación" required>
                                <MenuItem value="Flexible">Flexible</MenuItem>
                                <MenuItem value="Moderada">Moderada</MenuItem>
                                <MenuItem value="Estricta">Estricta</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>
                    <Box sx={{ display: "flex", flexDirection: "column", width: "25%", paddingLeft: "10px" }}>
                        <FormControlLabel control={<Checkbox name="wifi" checked={formValues.wifi} onChange={handleChange} />} label="WiFi" />
                        <FormControlLabel control={<Checkbox name="aire_acondicionado" checked={formValues.aire_acondicionado} onChange={handleChange} />} label="Aire Acondicionado" />
                        <FormControlLabel control={<Checkbox name="calefaccion" checked={formValues.calefaccion} onChange={handleChange} />} label="Calefacción" />
                        <FormControlLabel control={<Checkbox name="parking" checked={formValues.parking} onChange={handleChange} />} label="Parking" />
                        <FormControlLabel control={<Checkbox name="mascotas" checked={formValues.mascotas} onChange={handleChange} />} label="Mascotas" />
                        <FormControlLabel control={<Checkbox name="permitido_fumar" checked={formValues.permitido_fumar} onChange={handleChange} />} label="Permitido Fumar" />
                        <Button type="submit" onClick={() => window.location.href = "/mis-propiedades"} sx={{ bgcolor: "#1976d2", mt: "135px", color: "white", padding: "10px 20px", borderRadius: "8px", '&:hover': { backgroundColor: "#1565c0" } }}>
                            Crear propiedad
                        </Button>
                    </Box>
                </Box>
            </Container>
            <Footer />

        </Box>
    );
}

export default CreatePropertie;