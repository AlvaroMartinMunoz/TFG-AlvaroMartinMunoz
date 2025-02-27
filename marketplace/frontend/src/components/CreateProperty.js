import { Box, Container, Typography, TextField, FormControlLabel, Checkbox, FormControl, InputLabel, Select, MenuItem, Button, FormHelperText } from "@mui/material";
import React from "react";
import NavBar from "./NavBar";
import Footer from "./Footer";
import { useState } from "react";
import refreshAccessToken from "./RefreshToken";
import { useNavigate } from "react-router-dom";

const CreateProperty = () => {

    const storedInfo = localStorage.getItem("additionalInfo");
    const anfitrion = storedInfo ? JSON.parse(storedInfo).usuarioId : null;

    const [formValues, setFormValues] = useState({
        anfitrion: anfitrion,
        nombre: "",
        descripcion: "",
        direccion: "",
        ciudad: "",
        codigo_postal: "",
        pais: "España",
        tipo_de_propiedad: "",
        precio_por_noche: "",
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

    const [errors, setErrors] = useState({});
    const navigate = useNavigate();

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

    const handleSubmit = async (e, retried = false) => {
        e.preventDefault();
        if (await validateForm()) {
            try {
                const response = await fetch("http://localhost:8000/api/propiedades/", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localStorage.getItem("accessToken")}`
                    },
                    body: JSON.stringify(formValues)
                });

                if (response.status === 401 && !retried) {
                    console.log("Token expirado");
                    const token = await refreshAccessToken();
                    if (token) {
                        await handleSubmit(e, true);
                    } else {
                        console.log("Token inválido, cerrando sesión...");
                        handleLogOut();
                    }
                }

                if (response.ok) {
                    console.log("Propiedad creada con éxito");
                    navigate("/mis-propiedades");
                }
                else {
                    console.error("Error al crear la propiedad");
                }


            } catch (error) {
                console.error("Error al crear la propiedad", error);
            };
        }
    }

    const validateForm = async () => {
        const errors = {};
        const codigoPostalRegex = /^\d{5}$/;
        const latitudValida = (lat) => lat >= -90 && lat <= 90;
        const longitudValida = (lng) => lng >= -180 && lng <= 180;
        const empiezaConLetraRegex = /^[a-zA-Z]/;

        try {
            const response = await fetch("http://localhost:8000/api/propiedades/")
            const propiedades = await response.json();
            const existeNombrePropiedad = propiedades.some(propiedad => propiedad.nombre === formValues.nombre);
            if (existeNombrePropiedad) {
                errors.nombre = "Ya existe una propiedad con ese nombre";
            }
            setErrors(errors);
        } catch (error) {
            console.error("Error al validar el nombre de la propiedad", error);
        }

        if (!formValues.nombre || formValues.nombre.length > 100 || !empiezaConLetraRegex.test(formValues.nombre)) {
            errors.nombre = "El nombre es obligatorio, debe tener menos de 100 caracteres y debe comenzar con una letra";
        }

        if (!formValues.descripcion || formValues.descripcion.length > 255 || !empiezaConLetraRegex.test(formValues.descripcion)) {
            errors.descripcion = "La descripción es obligatoria, debe tener menos de 255 caracteres y debe comenzar con una letra";
        }

        if (!formValues.direccion || formValues.direccion.length > 255 || !empiezaConLetraRegex.test(formValues.direccion)) {
            errors.direccion = "La dirección es obligatoria, debe tener menos de 255 caracteres y debe comenzar con una letra";
        }

        if (!formValues.ciudad || formValues.ciudad.length > 100 || !empiezaConLetraRegex.test(formValues.ciudad)) {
            errors.ciudad = "La ciudad es obligatoria, debe tener menos de 100 caracteres y debe comenzar con una letra";
        }

        if (!formValues.pais || formValues.pais.length > 100 || !empiezaConLetraRegex.test(formValues.pais)) {
            errors.pais = "El país es obligatorio, debe tener menos de 100 caracteres y debe comenzar con una letra";
        }

        if (!codigoPostalRegex.test(formValues.codigo_postal)) {
            errors.codigo_postal = "El código postal debe tener 5 dígitos";
        }

        if (!formValues.tipo_de_propiedad) {
            errors.tipo_de_propiedad = "El tipo de propiedad es obligatorio";
        }

        if (!formValues.precio_por_noche || formValues.precio_por_noche < 1) {
            errors.precio_por_noche = "El precio por noche es obligatorio y debe ser mayor que 0";
        }

        if (!formValues.maximo_huespedes || formValues.maximo_huespedes < 1) {
            errors.maximo_huespedes = "El máximo de huéspedes es obligatorio y debe ser mayor que 0";
        }

        if (!formValues.numero_de_habitaciones || formValues.numero_de_habitaciones < 1) {
            errors.numero_de_habitaciones = "El número de habitaciones es obligatorio y debe ser mayor que 0";
        }

        if (!formValues.numero_de_banos || formValues.numero_de_banos < 1) {
            errors.numero_de_banos = "El número de baños es obligatorio y debe ser mayor que 0";
        }

        if (!formValues.numero_de_camas || formValues.numero_de_camas < 1) {
            errors.numero_de_camas = "El número de camas es obligatorio y debe ser mayor que 0";
        }

        if (!formValues.tamano || formValues.tamano < 10) {
            errors.tamano = "El tamaño es obligatorio y debe ser mayor que 10 m²";
        }

        if (formValues.latitud && !latitudValida(formValues.latitud)) {
            errors.latitud = "La latitud debe estar entre -90 y 90 grados";
        }

        if (formValues.longitud && !longitudValida(formValues.longitud)) {
            errors.longitud = "La longitud debe estar entre -180 y 180 grados";
        }

        if (!formValues.politica_de_cancelacion) {
            errors.politica_de_cancelacion = "La política de cancelación es obligatoria";
        }

        setErrors(errors);
        return Object.keys(errors).length === 0;
    };

    return (
        <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", bgcolor: "#f4f7fc" }}>
            <Box sx={{ mt: "0" }}>
                <NavBar />
            </Box>
            <Container maxWidth={false} sx={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "80vh", flexDirection: "column", width: "100%" }}>
                <Box sx={{ mt: "20px" }}><Typography variant="h4" gutterBottom> Crear nueva propiedad</Typography></Box>
                <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "row", width: "100%", maxWidth: "1200px", marginTop: "20px" }}>
                    <Box sx={{ display: "flex", flexDirection: "column", width: "25%", paddingRight: "10px" }}>
                        <TextField label="Nombre" name="nombre" variant="outlined" value={formValues.nombre} onChange={handleChange} sx={{ marginBottom: "20px" }} required error={!!errors.nombre} helperText={errors.nombre} />
                        <TextField label="Descripción" name="descripcion" variant="outlined" value={formValues.descripcion} onChange={handleChange} sx={{ marginBottom: "20px" }} required error={!!errors.descripcion} helperText={errors.descripcion} />
                        <TextField label="Dirección" name="direccion" variant="outlined" value={formValues.direccion} onChange={handleChange} sx={{ marginBottom: "20px" }} required error={!!errors.direccion} helperText={errors.direccion} />
                        <TextField label="Ciudad" name="ciudad" variant="outlined" value={formValues.ciudad} onChange={handleChange} sx={{ marginBottom: "20px" }} required error={!!errors.ciudad} helperText={errors.ciudad} />
                        <TextField label="Pais" name="pais" variant="outlined" value={formValues.pais} onChange={handleChange} sx={{ marginBottom: "20px" }} required error={!!errors.pais} helperText={errors.pais} />
                        <TextField label="Código Postal" name="codigo_postal" variant="outlined" value={formValues.codigo_postal} onChange={handleChange} sx={{ marginBottom: "20px" }} required error={!!errors.codigo_postal} helperText={errors.codigo_postal} />
                    </Box>
                    <Box sx={{ display: "flex", flexDirection: "column", width: "25%", paddingRight: "10px" }}>
                        <FormControl variant="outlined" sx={{ marginBottom: "20px" }} error={!!errors.tipo_de_propiedad} >
                            <InputLabel>Tipo de Propiedad</InputLabel>
                            <Select name="tipo_de_propiedad" value={formValues.tipo_de_propiedad} onChange={handleChange} label="Tipo de Propiedad" required  >
                                <MenuItem value="Apartamento">Apartamento</MenuItem>
                                <MenuItem value="Casa">Casa</MenuItem>
                                <MenuItem value="Villa">Villa</MenuItem>
                            </Select>
                            <FormHelperText>{errors.tipo_de_propiedad}</FormHelperText>
                        </FormControl>
                        <TextField label="Precio por Noche" name="precio_por_noche" type="number" variant="outlined" value={formValues.precio_por_noche} onChange={handleChange} sx={{ marginBottom: "20px" }} required error={!!errors.precio_por_noche} helperText={errors.precio_por_noche} />
                        <TextField label="Máximo de Huéspedes" name="maximo_huespedes" type="number" variant="outlined" value={formValues.maximo_huespedes} onChange={handleChange} sx={{ marginBottom: "20px" }} required error={!!errors.maximo_huespedes} helperText={errors.maximo_huespedes} />
                        <TextField label="Número de Habitaciones" name="numero_de_habitaciones" type="number" variant="outlined" value={formValues.numero_de_habitaciones} onChange={handleChange} sx={{ marginBottom: "20px" }} required error={!!errors.numero_de_habitaciones} helperText={errors.numero_de_habitaciones} />

                    </Box>
                    <Box sx={{ display: "flex", flexDirection: "column", width: "25%", paddingRight: "10px" }}>
                        <TextField label="Número de Baños" name="numero_de_banos" type="number" variant="outlined" value={formValues.numero_de_banos} onChange={handleChange} sx={{ marginBottom: "20px" }} required error={!!errors.numero_de_banos} helperText={errors.numero_de_banos} />
                        <TextField label="Número de Camas" name="numero_de_camas" type="number" variant="outlined" value={formValues.numero_de_camas} onChange={handleChange} sx={{ marginBottom: "20px" }} required slotProps={{ input: { min: 1 } }} error={!!errors.numero_de_camas} helperText={errors.numero_de_camas} />
                        <TextField label="Tamaño (m²)" name="tamano" type="number" variant="outlined" value={formValues.tamano} onChange={handleChange} sx={{ marginBottom: "20px" }} required error={!!errors.tamano} helperText={errors.tamano} />
                        <TextField label="Latitud" name="latitud" type="number" variant="outlined" value={formValues.latitud} onChange={handleChange} sx={{ marginBottom: "20px" }} required error={!!errors.latitud} helperText={errors.latitud} />
                        <TextField label="Longitud" name="longitud" type="number" variant="outlined" value={formValues.longitud} onChange={handleChange} sx={{ marginBottom: "20px" }} error={!!errors.longitud} helperText={errors.longitud} />
                        <FormControl variant="outlined" sx={{ marginBottom: "20px" }}>
                            <InputLabel>Política de Cancelación</InputLabel>
                            <Select name="politica_de_cancelacion" value={formValues.politica_de_cancelacion} onChange={handleChange} label="Política de Cancelación" required error={!!errors.politica_de_cancelacion}  >
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
                        <Button type="submit" sx={{ bgcolor: "#1976d2", mt: "135px", color: "white", padding: "10px 20px", borderRadius: "8px", '&:hover': { backgroundColor: "#1565c0" } }}>
                            Crear propiedad
                        </Button>
                    </Box>
                </Box>
            </Container >
            <Box sx={{ mt: "auto" }}>
                <Footer />
            </Box>

        </Box >
    );
}

export default CreateProperty;