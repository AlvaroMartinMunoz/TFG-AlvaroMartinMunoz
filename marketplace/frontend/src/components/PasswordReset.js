import { Box, Container, Paper, Typography, TextField, Button, CircularProgress } from '@mui/material';
import { Alert } from '@mui/material';
import { useState } from 'react';



const PasswordReset = () => {

    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const handleChange = (e) => {
        setEmail(e.target.value);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setLoading(true);
        try {
            const response = await fetch('http://localhost:8000/api/usuarios/password/reset/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || "Error al solicitar el cambio de contraseña");
            }
            setMessage("Correo enviado. Por favor, siga las instrucciones en el correo para cambiar su contraseña");
        } catch (error) {
            setError("El correo electrónico no está registrado");
        } finally {
            setLoading(false);
        }

    }


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

                    {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}
                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                    <form onSubmit={handleSubmit}>
                        <TextField
                            fullWidth
                            label="Correo Electrónico"
                            type="email"
                            variant="outlined"
                            margin="normal"
                            value={email}
                            onChange={handleChange}
                            required
                        />

                        <Button
                            type="submit"
                            variant="contained"
                            color="primary"
                            fullWidth
                            size="large"
                            disabled={loading}
                            sx={{ mt: 2 }}
                        >
                            {loading ? <CircularProgress size={24} color="inherit" /> : "Enviar Correo"}
                        </Button>
                    </form>
                </Paper>
            </Container>
        </Box>
    );
};


export default PasswordReset;
