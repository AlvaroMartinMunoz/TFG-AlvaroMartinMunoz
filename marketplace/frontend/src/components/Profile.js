import React, { useState, useEffect, } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { Box, Button, Container, TextField, Typography, CircularProgress, Grid2 } from '@mui/material';
import NavBar from "./NavBar";
import Footer from "./Footer";
import { id } from 'date-fns/locale';

const Profile = () => {

    const [formData, setFormData] = useState({
        id: null,
        usuario: {
            id: null,
            username: "",
            email: "",
        },
        dni: "",
        telefono: "",
        direccion: "",
        biografia: "",
        fecha_de_nacimiento: "",
        foto_de_perfil: null,
        numero_de_resenas: 0,
        rol: "",
        valoraciones_usuario: 0,
    });


    const [errors, setErrors] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const [isEditing, setIsEditing] = useState(false);

    const handleLogOut = () => {
        setLoading(true);
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        navigate("/inicio-de-sesion");
        setLoading(false);
    };

    useEffect(() => {

        const token = localStorage.getItem("accessToken");
        const usuarioIdSinParse = localStorage.getItem("additionalInfo");
        const usuarioId = JSON.parse(usuarioIdSinParse).usuarioId;
        console.log(usuarioId);

        if (token) {
            try {
                const decodedToken = jwtDecode(token);
                if (decodedToken && decodedToken.user_id) {
                    fetchProfile(usuarioId);
                } else {
                    handleLogOut();
                    navigate("/inicio-de-sesion");
                }
            } catch (error) {
                console.error("Error al decodificar el token:", error);
            }
        } else {
            handleLogOut();
            navigate("/inicio-de-sesion");
        }

    }, []);

    const updateProfile = async () => {
        try {
            const response = await fetch(`http://localhost:8000/api/usuarios/${formData.id}/`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                },
                body: JSON.stringify({
                    id: formData.id,
                    username: formData.usuario.username,
                    email: formData.usuario.email,
                    dni: formData.dni,
                    telefono: formData.telefono,
                    direccion: formData.direccion,
                    biografia: formData.biografia,
                    fecha_de_nacimiento: formData.fecha_de_nacimiento,
                }),

            });

            console.log(formData);
            if (!response.ok) {
                console.error("Error al actualizar el perfil:", response);
                return
            }
            const data = await response.json();
            setFormData(data);
            setIsEditing(false);
        } catch (error) {
            console.error("Error al actualizar el perfil:", error);
        }
    };


    const refreshToken = async () => {
        try {
            const response = await fetch("http://localhost:8000/api/token/refresh/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ refresh: localStorage.getItem("refreshToken") }),
            });
            if (!response.ok) {
                handleLogOut();
                navigate("/inicio-de-sesion");
                return false;
            }
            const data = await response.json();
            localStorage.setItem("accessToken", data.access);
            return true;
        } catch (error) {
            console.error("Error al refrescar el token:", error);
            handleLogOut();
            navigate("/inicio-de-sesion");
            return false;
        }
    };

    const fetchProfile = async (usuarioId) => {
        try {

            const response = await fetch(`http://localhost:8000/api/usuarios/${usuarioId}/`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                },
            });

            if (response.status === 401) {
                const tokenRefreshed = await refreshToken();
                if (tokenRefreshed) {
                    return fetchProfile(usuarioId);
                } else {
                    return
                }
            }

            if (!response.ok) {
                handleLogOut();
                navigate("/inicio-de-sesion");
                return;
            }

            const data = await response.json();
            setFormData(data);
        } catch (error) {
            console.error("Error al obtener el perfil:", error);
        }
    };

    return (
        <Box sx={{ minHeight: '100vh', display: "flex", flexDirection: "column", backgroundColor: "#f4f7fc" }}>
            <Box sx={{ flexGrow: 1 }}>
                <NavBar />
            </Box>
            <Container maxWidth="sm" sx={{ minHeight: "80vh", display: "flex", justifyContent: "center", alignItems: "center" }}>
                <Box>
                    <Typography variant="h4" align="center" gutterBottom sx={{ fontWeight: "bold", marginTop: 2 }} >
                        Mi Perfil
                    </Typography>
                    <Box sx={{ display: "flex", flexDirection: "row", gap: 2 }}>
                        <Box sx={{ flex: 1 }}>
                            <TextField
                                fullWidth
                                label="Nombre de usuario"
                                name="username"
                                variant="outlined"
                                value={formData ? formData.usuario.username : ""}
                                disabled
                                sx={{ mb: 2 }}
                            />

                            <TextField
                                fullWidth
                                label="Email"
                                name="email"
                                variant="outlined"
                                value={formData.usuario.email}
                                disabled
                                sx={{ mb: 2 }}

                            />
                            <TextField
                                fullWidth
                                label="DNI"
                                name="dni"
                                variant="outlined"
                                value={formData.dni}
                                disabled
                                sx={{ mb: 2 }}

                            />
                            <TextField
                                fullWidth
                                label="Telefono"
                                name="telefono"
                                variant="outlined"
                                value={formData.telefono}
                                disabled
                                sx={{ mb: 2 }}

                            />
                        </Box>
                        <Box sx={{ flex: 1 }}>
                            <TextField
                                fullWidth
                                label="Direccion"
                                name="direccion"
                                variant="outlined"
                                value={formData.direccion}
                                disabled={!isEditing}
                                onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                                sx={{ mb: 2 }}

                            />
                            <TextField
                                fullWidth
                                label="Biografia"
                                name="biografia"
                                variant="outlined"
                                value={formData.biografia}
                                disabled={!isEditing}
                                onChange={(e) => setFormData({ ...formData, biografia: e.target.value })}
                                sx={{ mb: 2 }}

                            />
                            <TextField
                                fullWidth
                                name="fecha_nacimiento"
                                variant="outlined"
                                value={formData.fecha_de_nacimiento}
                                disabled
                                sx={{ mb: 2 }}

                            />
                        </Box>
                    </Box>
                    <Button fullWidth onClick={() => {
                        if (isEditing) {
                            updateProfile()
                        } else {
                            setIsEditing(true)
                        }
                    }} sx={{
                        mt: 2,
                        py: 1,
                        mb: 2,
                        color: "white",
                        fontSize: "1rem",
                        fontWeight: "bold",
                        textTransform: "none",
                        backgroundColor: "#1976d2",
                        "&:hover": {
                            backgroundColor: "#115293",
                        },
                    }}>{isEditing ? "Guardar" : "Editar"}</Button>
                    <Button fullWidth onClick={handleLogOut} sx={{

                        py: 1,
                        mb: 2,
                        color: "white",
                        fontSize: "1rem",
                        fontWeight: "bold",
                        textTransform: "none",
                        backgroundColor: "#d32f2f",
                        "&:hover": {
                            backgroundColor: "#b71c1c",
                        },
                    }}>{loading ? <CircularProgress size={24} color='inherit' /> : "Cerrar Sesión"}</Button>
                </Box>
            </Container >
            <Box sx={{ mt: "auto" }}><Footer /></Box>

        </Box >
    );
}
export default Profile;