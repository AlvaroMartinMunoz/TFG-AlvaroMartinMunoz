import React from 'react';
import { Box, Container, Typography, Paper } from "@mui/material";

const PrivacyPolicy = () => {
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
                        Política de Privacidad
                    </Typography>

                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                        1. Información que Recopilamos
                    </Typography>
                    <Typography
                        variant="body1"
                        paragraph
                        sx={{
                            textAlign: 'justify',
                            textJustify: 'inter-word'
                        }}
                    >
                        Recopilamos información personal que nos proporcionas directamente, incluyendo:
                        - Nombre y apellidos
                        - Dirección de correo electrónico
                        - Número de teléfono
                        - Información de pago
                        - Datos de ubicación
                        - Preferencias de viaje
                    </Typography>

                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                        2. Cómo Utilizamos Tu Información
                    </Typography>
                    <Typography
                        variant="body1"
                        paragraph
                        sx={{
                            textAlign: 'justify',
                            textJustify: 'inter-word'
                        }}
                    >
                        Utilizamos tu información para:
                        - Procesar reservas y pagos
                        - Comunicarnos contigo
                        - Mejorar nuestros servicios
                        - Personalizar tu experiencia
                        - Enviar notificaciones relevantes
                    </Typography>

                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                        3. Compartir Información
                    </Typography>
                    <Typography
                        variant="body1"
                        paragraph
                        sx={{
                            textAlign: 'justify',
                            textJustify: 'inter-word'
                        }}
                    >
                        Podemos compartir tu información con:
                        - Anfitriones para confirmar reservas
                        - Proveedores de servicios necesarios
                        - Autoridades legales si es requerido
                        - Con tu consentimiento explícito
                    </Typography>

                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                        4. Seguridad de Datos
                    </Typography>
                    <Typography
                        variant="body1"
                        paragraph
                        sx={{
                            textAlign: 'justify',
                            textJustify: 'inter-word'
                        }}
                    >
                        Implementamos medidas de seguridad para proteger tu información personal, incluyendo:
                        - Encriptación de datos
                        - Acceso restringido a información sensible
                        - Protocolos de seguridad actualizados
                    </Typography>

                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                        5. Tus Derechos
                    </Typography>
                    <Typography
                        variant="body1"
                        paragraph
                        sx={{
                            textAlign: 'justify',
                            textJustify: 'inter-word'
                        }}
                    >
                        Tienes derecho a:
                        - Acceder a tu información personal
                        - Solicitar corrección de datos
                        - Eliminar tu cuenta y datos
                        - Oponerte al procesamiento de datos
                        - Solicitar una copia de tus datos
                    </Typography>

                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                        6. Cookies y Tecnologías de Seguimiento
                    </Typography>
                    <Typography
                        variant="body1"
                        paragraph
                        sx={{
                            textAlign: 'justify',
                            textJustify: 'inter-word'
                        }}
                    >
                        Utilizamos cookies para mejorar tu experiencia, analizar el tráfico y personalizar contenido. Puedes gestionar las preferencias de cookies en cualquier momento.
                    </Typography>

                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                        7. Cambios en la Política de Privacidad
                    </Typography>
                    <Typography
                        variant="body1"
                        paragraph
                        sx={{
                            textAlign: 'justify',
                            textJustify: 'inter-word'
                        }}
                    >
                        Nos reservamos el derecho de modificar esta política. Te notificaremos de cualquier cambio significativo mediante un aviso en nuestra plataforma.
                    </Typography>

                    <Typography variant="body2" sx={{ mt: 3, textAlign: 'center', color: 'text.secondary' }}>
                        Última actualización: Marzo 2024
                    </Typography>
                </Container>
            </Paper>
        </Box>
    )
}

export default PrivacyPolicy;