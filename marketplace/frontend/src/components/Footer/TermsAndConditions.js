import React from 'react';
import { Box, Container, Typography, Paper } from "@mui/material";

const TermsAndConditions = () => {
    return (
        <Box
            sx={{
                padding: 2,
                backgroundColor: "#f5f5f5",
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '100vh'
            }}
        >
            <Paper
                elevation={3}
                sx={{
                    padding: 4,
                    borderRadius: 2,
                    maxWidth: 800,
                    width: '100%',
                    overflow: 'auto',
                    maxHeight: '90vh'
                }}
            >
                <Container maxWidth="md">
                    <Typography
                        variant="h4"
                        component="h1"
                        gutterBottom
                        sx={{
                            color: 'primary.main',
                            fontWeight: 600,
                            textAlign: 'center',
                            mb: 3
                        }}
                    >
                        Términos y Condiciones
                    </Typography>

                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                        1. Introducción
                    </Typography>
                    <Typography
                        variant="body1"
                        paragraph
                        sx={{ textAlign: 'justify' }}
                    >
                        Bienvenido a nuestra plataforma de alquiler de espacios. Al utilizar nuestro servicio, aceptas cumplir y estar sujeto a estos términos y condiciones.
                    </Typography>

                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                        2. Uso de la Plataforma
                    </Typography>
                    <Typography
                        variant="body1"
                        paragraph
                        sx={{ textAlign: 'justify' }}
                    >
                        Nuestra plataforma permite a usuarios anfitriones ofrecer espacios y a usuarios huéspedes reservar dichos espacios. Nos reservamos el derecho de modificar o suspender el servicio en cualquier momento.
                    </Typography>

                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                        3. Responsabilidades del Usuario
                    </Typography>
                    <Typography
                        variant="body1"
                        paragraph
                        sx={{ textAlign: 'justify' }}
                    >
                        Los usuarios son responsables de:
                        - Proporcionar información precisa y actualizada
                        - Mantener la confidencialidad de su cuenta
                        - Cumplir con las normas y regulaciones locales
                        - Respetar la propiedad y privacidad de otros usuarios
                    </Typography>

                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                        4. Política de Reservas y Cancelaciones
                    </Typography>
                    <Typography
                        variant="body1"
                        paragraph
                        sx={{ textAlign: 'justify' }}
                    >
                        Cada espacio tiene sus propias políticas de reserva y cancelación. Es responsabilidad del usuario revisar estos términos antes de realizar una reserva.
                    </Typography>

                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                        5. Pagos y Tarifas
                    </Typography>
                    <Typography
                        variant="body1"
                        paragraph
                        sx={{ textAlign: 'justify' }}
                    >
                        Todos los pagos se realizan a través de nuestra plataforma. Nos reservamos el derecho de modificar tarifas y comisiones en cualquier momento.
                    </Typography>

                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                        6. Privacidad
                    </Typography>
                    <Typography
                        variant="body1"
                        paragraph
                        sx={{ textAlign: 'justify' }}
                    >
                        La información personal se maneja según nuestra Política de Privacidad. Al usar la plataforma, aceptas los términos de dicha política.
                    </Typography>

                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                        7. Limitación de Responsabilidad
                    </Typography>
                    <Typography
                        variant="body1"
                        paragraph
                        sx={{ textAlign: 'justify' }}
                    >
                        No nos hacemos responsables de daños directos, indirectos, incidentales o consecuenciales derivados del uso de nuestra plataforma.
                    </Typography>

                    <Typography variant="body2" sx={{ mt: 3, textAlign: 'center', color: 'text.secondary' }}>
                        Última actualización: Marzo 2024
                    </Typography>
                </Container>
            </Paper>
        </Box>
    )
}

export default TermsAndConditions;