import React from 'react';
import { Box, Container, Typography, Paper } from "@mui/material";

const AboutUs = () => {
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
                            mb: 4
                        }}
                    >
                        Sobre Nosotros
                    </Typography>

                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                        Nuestra Historia
                    </Typography>
                    <Typography
                        variant="body1"
                        paragraph
                        sx={{ textAlign: 'justify' }}
                    >
                        Fundada en 2020, nuestra plataforma nació de la visión de revolucionar la forma en que las personas encuentran y reservan espacios únicos. Comenzamos como un pequeño equipo de emprendedores apasionados por conectar viajeros con experiencias auténticas y acogedoras.
                    </Typography>

                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                        Nuestra Misión
                    </Typography>
                    <Typography
                        variant="body1"
                        paragraph
                        sx={{ textAlign: 'justify' }}
                    >
                        Nuestra misión es simplificar los viajes, ofreciendo una plataforma intuitiva que permita a los usuarios descubrir y reservar espacios increíbles en todo el mundo. Buscamos crear conexiones significativas entre anfitriones y huéspedes.
                    </Typography>

                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                        Nuestro Compromiso
                    </Typography>
                    <Typography
                        variant="body1"
                        paragraph
                        sx={{ textAlign: 'justify' }}
                    >
                        Nos comprometemos a:
                        - Garantizar la seguridad y comodidad de nuestros usuarios
                        - Ofrecer un servicio de atención al cliente excepcional
                        - Promover prácticas sostenibles y responsables
                        - Fomentar la diversidad y la inclusión en nuestra comunidad
                    </Typography>

                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                        Nuestro Equipo
                    </Typography>
                    <Typography
                        variant="body1"
                        paragraph
                        sx={{ textAlign: 'justify' }}
                    >
                        Somos un equipo diverso de profesionales apasionados por la tecnología, los viajes y la conexión humana. Desde desarrolladores y diseñadores hasta especialistas en servicio al cliente, cada miembro de nuestro equipo trabaja con dedicación para hacer realidad nuestra visión.
                    </Typography>

                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                        Valores
                    </Typography>
                    <Typography variant="body1" paragraph>
                        Nuestros valores fundamentales son:
                    </Typography>
                    <Typography
                        variant="body1"
                        sx={{
                            pl: 2,
                            textAlign: 'justify'
                        }}
                    >
                        <strong>Transparencia:</strong> Actuamos con honestidad y claridad en todas nuestras interacciones.
                    </Typography>
                    <Typography
                        variant="body1"
                        sx={{
                            pl: 2,
                            textAlign: 'justify'
                        }}
                    >
                        <strong>Innovación:</strong> Buscamos constantemente nuevas formas de mejorar nuestra plataforma.
                    </Typography>
                    <Typography
                        variant="body1"
                        sx={{
                            pl: 2,
                            mb: 2,
                            textAlign: 'justify'
                        }}
                    >
                        <strong>Comunidad:</strong> Valoramos y respetamos a cada miembro de nuestra comunidad.
                    </Typography>

                    <Typography
                        variant="body2"
                        sx={{
                            mt: 4,
                            textAlign: 'center',
                            color: 'text.secondary'
                        }}
                    >
                        Únete a nosotros en nuestra misión de hacer los viajes más accesibles, personales y memorables.
                    </Typography>
                </Container>
            </Paper>
        </Box>
    )
}

export default AboutUs;