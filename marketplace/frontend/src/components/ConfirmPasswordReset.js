import { useParams, useNavigate } from "react-router-dom";
import { Box, Container, Paper, Typography, TextField, Button, CircularProgress } from "@mui/material";
import { Alert } from "@mui/material";
import { useState } from "react";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { IconButton, InputAdornment } from "@mui/material";
import { API_BASE_URL } from "../config";


const ConfirmPasswordReset = () => {

    const { uid, token } = useParams();
    const [newPassword, setNewPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);

    const handlePasswordChange = (e) => {
        setNewPassword(e.target.value);
    };

    const handleClickShowPassword = () => {
        setShowPassword(!showPassword);
    }

    const validatePassword = (password) => {
        const errors = [];
        if (password.length < 8) {
            errors.push("La contraseña debe tener al menos 8 caracteres");
        }
        if (!/[a-z]/.test(password)) {
            errors.push("La contraseña debe contener al menos una letra minúscula");
        }
        if (!/[A-Z]/.test(password)) {
            errors.push("La contraseña debe contener al menos una letra mayúscula");
        }
        if (!/[0-9]/.test(password)) {
            errors.push("La contraseña debe contener al menos un número");
        }
        return errors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess(false);
        setLoading(true);

        const validationErrors = validatePassword(newPassword);
        if (validationErrors.length > 0) {
            setError(validationErrors.join(". "));
            setLoading(false);
            return;
        }

        if (!newPassword) {
            setError("Por favor, ingrese una nueva contraseña");
            setLoading(false);
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/api/usuarios/password-reset-confirm/${uid}/${token}/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    new_password: newPassword,
                }),
            });

            if (response.ok) {
                setSuccess(true);
                setTimeout(() => {
                    navigate("/inicio-de-sesion");
                }, 3000);
            } else {
                const data = await response.json();
                setError(data.error || "Error al cambiar la contraseña");
            }
        } catch (error) {
            setError("Error en la conexión");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box
            sx={{
                backgroundColor: "#f4f7fc",
                minHeight: "80vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 2,
            }}
        >
            <Container maxWidth="xs">
                <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
                    <Typography variant="h5" gutterBottom textAlign="center" fontWeight={600}>
                        Recuperar Contraseña
                    </Typography>

                    {success && <Alert severity="success" sx={{ mb: 2 }}>Contraseña cambiada exitosamente. Serás redirigido al login.</Alert>}
                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                    <form onSubmit={handleSubmit}>
                        <TextField
                            fullWidth
                            label="Nueva Contraseña"
                            type={showPassword ? "text" : "password"}
                            variant="outlined"
                            margin="normal"
                            value={newPassword}
                            onChange={handlePasswordChange}
                            required
                            sx={{
                                mb: 2,
                                "& .MuiOutlinedInput-root": {
                                    borderRadius: 1.5,
                                }
                            }}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            onClick={handleClickShowPassword}
                                            edge="end"
                                        >
                                            {showPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                ),

                            }}

                        />

                        <Button
                            type="submit"
                            variant="contained"
                            color="primary"
                            fullWidth
                            size="large"
                            disabled={loading}
                            sx={{
                                mt: 2,
                                py: 1.5,
                                borderRadius: 1.5,
                                textTransform: "none",
                                fontWeight: 600,
                                fontSize: "1rem",
                                boxShadow: 2,
                                "&:hover": {
                                    boxShadow: 4,
                                }
                            }}
                        >
                            {loading ? <CircularProgress size={24} color="inherit" /> : "Restablecer Contraseña"}
                        </Button>
                    </form>
                </Paper>
            </Container>
        </Box>
    );
};

export default ConfirmPasswordReset;
