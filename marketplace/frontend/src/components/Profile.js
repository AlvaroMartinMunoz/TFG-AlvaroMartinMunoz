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

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [saveLoading, setSaveLoading] = useState(false);
    const [message, setMessage] = useState("");
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

    const validateProfileData = async () => {
        const newErrors = {};
        const usernameRegex = /^[^\d\s][a-zA-Z0-9\s]*$/;
        const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
        const emailDominio = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

        // Validación de email
        if (!formData.usuario.email) {
            newErrors.email = "El email es requerido";
        } else if (!emailRegex.test(formData.usuario.email)) {
            newErrors.email = "El email debe tener un formato válido";
        } else if (!emailDominio.test(formData.usuario.email)) {
            newErrors.email = "El email debe tener un dominio válido";
        }

        // Validación de teléfono
        if (!formData.telefono) {
            newErrors.telefono = "El teléfono es requerido";
        }
        if (!/^\d{9}$/.test(formData.telefono)) {
            newErrors.telefono = "El teléfono debe tener 9 dígitos numéricos";
        }

        if (!usernameRegex.test(formData.direccion)) {
            errors.direccion = "La dirección no puede empezar con espacios ni con numeros";
        }

        if (formData.direccion.length < 5) {
            newErrors.direccion = "La dirección debe tener al menos 5 caracteres";
        }
        if (formData.biografia.length < 10) {
            newErrors.biografia = "La biografía debe tener al menos 10 caracteres";
        }
        if (formData.biografia.length > 250) {
            newErrors.biografia = "La biografía no puede tener más de 250 caracteres";
        }
        if (formData.telefono.length < 9) {
            newErrors.telefono = "El teléfono debe tener al menos 9 dígitos";
        }


        try {
            const checkResponse = await fetch("http://localhost:8000/api/usuarios/");
            const usuarios = await checkResponse.json();

            const existeEmail = usuarios.some(u =>
                u.usuario.email === formData.usuario.email &&
                u.usuario.id !== formData.usuario.id
            );

            const existeTelefono = usuarios.some(
                (u) => u.telefono === formData.telefono && u.id !== formData.id
            );

            if (existeEmail) {
                newErrors.email = "El email ya está en uso";
            }
            if (existeTelefono) {
                newErrors.telefono = "El teléfono ya está en uso";
            }
        } catch (error) {
            console.error("Error al validar:", error);
            setMessage("Error al validar el formulario");
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };


    const updateProfile = async () => {
        const isValid = await validateProfileData();

        if (!isValid) {
            setNotification({
                open: true,
                message: 'Por favor, corrija los errores en el formulario',
                severity: 'error'
            });
            return;
        }

        try {
            setSaveLoading(true);

            const requestData = {
                username: formData.usuario.username,
                email: formData.usuario.email,
                telefono: formData.telefono,
                direccion: formData.direccion,
                biografia: formData.biografia,
                dni: formData.dni,
                fecha_de_nacimiento: formData.fecha_de_nacimiento
            };

            const response = await fetch(`http://localhost:8000/api/usuarios/${formData.id}/`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                },
                body: JSON.stringify(requestData),
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
                                            error={!!errors.email}
                                            helperText={errors.email}
                                            disabled={!isEditing}
                                            onChange={(e) => {
                                                setFormData({
                                                    ...formData,
                                                    usuario: {
                                                        ...formData.usuario,
                                                        email: e.target.value
                                                    }
                                                });
                                                if (errors.email) {
                                                    setErrors({ ...errors, email: '' });
                                                }
                                            }}
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
                                            error={!!errors.telefono}
                                            helperText={errors.telefono}
                                            disabled={!isEditing}
                                            onChange={(e) => {
                                                setFormData({ ...formData, telefono: e.target.value });
                                                if (errors.telefono) {
                                                    setErrors({ ...errors, telefono: '' });
                                                }
                                            }}
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
                                        onClick={() => {
                                            setIsEditing(!isEditing);
                                            setErrors({});
                                        }}
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
                                            error={!!errors.direccion}
                                            helperText={errors.direccion}
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
                                            error={!!errors.biografia}
                                            helperText={errors.biografia}
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