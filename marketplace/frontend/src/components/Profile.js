import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import {
    Box,
    Button,
    Container,
    TextField,
    Typography,
    CircularProgress,
    Paper,
    Avatar,
    Divider,
    Stack,
    Card,
    CardContent,
    IconButton,
    Snackbar,
    Alert
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';
import NavBar from "./NavBar";
import Footer from "./Footer";

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
    const [saveLoading, setSaveLoading] = useState(false);
    const navigate = useNavigate();
    const [isEditing, setIsEditing] = useState(false);
    const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });

    const handleLogOut = () => {
        setLoading(true);
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        setNotification({ open: true, message: 'Sesión cerrada correctamente', severity: 'info' });
        setTimeout(() => {
            navigate("/inicio-de-sesion");
            setLoading(false);
            window.location.reload();
        }, 1000);
    };

    useEffect(() => {
        const token = localStorage.getItem("accessToken");
        const usuarioIdSinParse = localStorage.getItem("additionalInfo");

        if (!usuarioIdSinParse) {
            handleLogOut();
            return;
        }

        const usuarioId = JSON.parse(usuarioIdSinParse).usuarioId;

        if (token) {
            try {
                const decodedToken = jwtDecode(token);
                if (decodedToken && decodedToken.user_id) {
                    fetchProfile(usuarioId);
                } else {
                    handleLogOut();
                }
            } catch (error) {
                console.error("Error al decodificar el token:", error);
                handleLogOut();
            }
        } else {
            handleLogOut();
        }
    }, []);

    const updateProfile = async () => {
        try {
            setSaveLoading(true);
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

            if (!response.ok) {
                setNotification({ open: true, message: 'Error al actualizar el perfil', severity: 'error' });
                setSaveLoading(false);
                return;
            }

            const data = await response.json();
            setFormData(data);
            setIsEditing(false);
            setNotification({ open: true, message: 'Perfil actualizado correctamente', severity: 'success' });
            setSaveLoading(false);
        } catch (error) {
            console.error("Error al actualizar el perfil:", error);
            setNotification({ open: true, message: 'Error al actualizar el perfil', severity: 'error' });
            setSaveLoading(false);
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
                return false;
            }
            const data = await response.json();
            localStorage.setItem("accessToken", data.access);
            return true;
        } catch (error) {
            console.error("Error al refrescar el token:", error);
            handleLogOut();
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
                    return;
                }
            }

            if (!response.ok) {
                handleLogOut();
                return;
            }

            const data = await response.json();
            setFormData(data);
        } catch (error) {
            console.error("Error al obtener el perfil:", error);
            setNotification({ open: true, message: 'Error al obtener el perfil', severity: 'error' });
        }
    };

    const handleCloseNotification = () => {
        setNotification({ ...notification, open: false });
    };

    return (
        <Box sx={{
            minHeight: '100vh',
            display: "flex",
            flexDirection: "column",
            backgroundColor: "#f5f7fa",
            pb: 6
        }}>
            <Snackbar
                open={notification.open}
                autoHideDuration={6000}
                onClose={handleCloseNotification}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert onClose={handleCloseNotification} severity={notification.severity} sx={{ width: '100%' }}>
                    {notification.message}
                </Alert>
            </Snackbar>

            <Container maxWidth="md" sx={{ flex: 1, py: 4 }}>
                <Paper
                    elevation={3}
                    sx={{
                        borderRadius: 2,
                        overflow: 'hidden',
                    }}
                >
                    <Box sx={{
                        bgcolor: 'primary.main',
                        py: 3,
                        px: 4,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2
                    }}>
                        <Avatar
                            sx={{
                                width: 80,
                                height: 80,
                                bgcolor: 'white',
                                color: 'primary.main',
                                border: '4px solid white'
                            }}
                        >
                            {formData.usuario.username ? formData.usuario.username.charAt(0).toUpperCase() : <PersonIcon fontSize="large" />}
                        </Avatar>
                        <Box>
                            <Typography variant="h4" sx={{ color: 'white', fontWeight: 600 }}>
                                Mi Perfil
                            </Typography>
                            <Typography variant="subtitle1" sx={{ color: 'white', opacity: 0.9 }}>
                                Información personal
                            </Typography>
                        </Box>
                    </Box>

                    <Box sx={{ p: 4 }}>
                        <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
                            <Box sx={{ flex: 1 }}>
                                <Typography variant="h6" sx={{ mb: 2, fontWeight: 500, color: 'text.primary' }}>
                                    Información de cuenta
                                </Typography>
                                <Card variant="outlined" sx={{ mb: 2 }}>
                                    <CardContent>
                                        <TextField
                                            fullWidth
                                            label="Nombre de usuario"
                                            name="username"
                                            variant="outlined"
                                            value={formData ? formData.usuario.username : ""}
                                            disabled
                                            sx={{ mb: 2 }}
                                            InputProps={{
                                                sx: { bgcolor: 'background.paper' }
                                            }}
                                        />

                                        <TextField
                                            fullWidth
                                            label="Email"
                                            name="email"
                                            variant="outlined"
                                            value={formData.usuario.email}
                                            disabled
                                            sx={{ mb: 2 }}
                                            InputProps={{
                                                sx: { bgcolor: 'background.paper' }
                                            }}
                                        />

                                        <TextField
                                            fullWidth
                                            label="DNI"
                                            name="dni"
                                            variant="outlined"
                                            value={formData.dni}
                                            disabled
                                            sx={{ mb: 2 }}
                                            InputProps={{
                                                sx: { bgcolor: 'background.paper' }
                                            }}
                                        />

                                        <TextField
                                            fullWidth
                                            label="Teléfono"
                                            name="telefono"
                                            variant="outlined"
                                            value={formData.telefono}
                                            disabled
                                            InputProps={{
                                                sx: { bgcolor: 'background.paper' }
                                            }}
                                        />
                                    </CardContent>
                                </Card>
                            </Box>

                            <Box sx={{ flex: 1 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                    <Typography variant="h6" sx={{ fontWeight: 500, color: 'text.primary' }}>
                                        Información personal
                                    </Typography>
                                    <IconButton
                                        color={isEditing ? "primary" : "default"}
                                        onClick={() => setIsEditing(!isEditing)}
                                        disabled={saveLoading}
                                    >
                                        <EditIcon />
                                    </IconButton>
                                </Box>
                                <Card variant="outlined" sx={{ mb: 2 }}>
                                    <CardContent>
                                        <TextField
                                            fullWidth
                                            label="Dirección"
                                            name="direccion"
                                            variant="outlined"
                                            value={formData.direccion}
                                            disabled={!isEditing}
                                            onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                                            sx={{ mb: 2 }}
                                            InputProps={{
                                                sx: { bgcolor: isEditing ? 'rgba(25, 118, 210, 0.05)' : 'background.paper' }
                                            }}
                                        />

                                        <TextField
                                            fullWidth
                                            label="Biografía"
                                            name="biografia"
                                            variant="outlined"
                                            value={formData.biografia}
                                            disabled={!isEditing}
                                            onChange={(e) => setFormData({ ...formData, biografia: e.target.value })}
                                            sx={{ mb: 2 }}
                                            multiline
                                            rows={4}
                                            InputProps={{
                                                sx: { bgcolor: isEditing ? 'rgba(25, 118, 210, 0.05)' : 'background.paper' }
                                            }}
                                        />

                                        <TextField
                                            fullWidth
                                            label="Fecha de nacimiento"
                                            name="fecha_nacimiento"
                                            variant="outlined"
                                            value={formData.fecha_de_nacimiento}
                                            disabled
                                            InputProps={{
                                                sx: { bgcolor: 'background.paper' }
                                            }}
                                        />
                                    </CardContent>
                                </Card>
                            </Box>
                        </Stack>

                        <Divider sx={{ my: 3 }} />

                        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                            <Button
                                variant="outlined"
                                color="error"
                                onClick={handleLogOut}
                                startIcon={loading ? <CircularProgress size={20} color="error" /> : <LogoutIcon />}
                                disabled={loading}
                                sx={{
                                    px: 3,
                                    py: 1,
                                    borderRadius: 2,
                                    fontWeight: 600,
                                }}
                            >
                                {loading ? "Cerrando sesión..." : "Cerrar Sesión"}
                            </Button>

                            {isEditing && (
                                <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={updateProfile}
                                    startIcon={saveLoading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                                    disabled={saveLoading}
                                    sx={{
                                        px: 3,
                                        py: 1,
                                        borderRadius: 2,
                                        fontWeight: 600,
                                    }}
                                >
                                    {saveLoading ? "Guardando..." : "Guardar Cambios"}
                                </Button>
                            )}
                        </Box>
                    </Box>
                </Paper>
            </Container>
        </Box>
    );
};

export default Profile;