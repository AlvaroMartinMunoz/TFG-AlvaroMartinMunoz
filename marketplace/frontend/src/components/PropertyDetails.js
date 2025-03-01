import { Box, Typography, Container, Grid2, Card, CardMedia, CardContent, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import NavBar from './NavBar';
import Footer from './Footer';
import { Navigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Carousel from 'react-material-ui-carousel';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';




const PropertyDetails = () => {

    const { propiedadId } = useParams();
    const [propiedad, setPropiedad] = useState(null);
    const [fotos, setFotos] = useState([]);

    useEffect(() => {
        fetchPropertyDetails();
        fetchPropertyPhotos(propiedadId);
    }, [propiedadId]);

    const fetchPropertyDetails = async () => {
        try {
            const response = await fetch(`http://localhost:8000/api/propiedades/propiedades/${propiedadId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                const data = await response.json();
                setPropiedad(data);
            }

        } catch (error) {
            console.log(error);
        }
    }

    const fetchPropertyPhotos = async (propiedadId) => {
        try {
            const response = await fetch("http://localhost:8000/api/propiedades/fotos-propiedades/");

            if (response.ok) {
                const data = await response.json();
                const filteredData = data.filter(foto => foto.propiedad === parseInt(propiedadId));
                setFotos(filteredData);
            }

        } catch (error) {
            console.log(error);
        }
    }


    return (
        <Box sx={{ minHeigth: '100vh', display: 'flex', bgcolor: "#f4f7fc", flexDirection: "column" }}>
            <Box sx={{ flexGrow: 1 }}>
                <NavBar />
            </Box>
            <Container maxWidth={false} sx={{ minHeight: "80vh", display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
                <Box sx={{
                    display: 'flex', width: '100%', gap: 2, alignItems: "center", mt: 2
                }}>
                    <Box sx={{ flex: 2 }}>
                        <Card>
                            <Carousel stopAutoPlayOnHover indicators={false} interval={8000} navButtonsAlwaysVisible={true} navButtonsProps={{ style: { backgroundColor: 'transparent', color: 'white' } }}>
                                {fotos.map((foto, index) => (
                                    <Box key={index} sx={{ position: "relative", height: 0, paddingTop: '56.25%' }}>
                                        <img
                                            src={foto.foto}
                                            alt={foto.descripcion}
                                            style={{
                                                position: 'absolute',
                                                top: 0,
                                                left: 0,
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover',
                                                borderRadius: '4px'
                                            }}
                                        />
                                    </Box>

                                )
                                )}
                            </Carousel>


                        </Card>

                    </Box>
                    <Box sx={{ flex: 1 }
                    }>
                        <Card>
                            <CardContent>
                                <Typography variant="h4" align="center" gutterBottom sx={{ fontWeight: "bold" }}>
                                    {propiedad?.nombre}
                                </Typography>
                                <Typography variant="h6" align="center" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                                    {propiedad?.precio_por_noche} € por noche
                                </Typography>
                                <Typography variant="h6" align="center" gutterBottom sx={{ color: 'text.secondary' }}>
                                    {propiedad?.direccion}, {propiedad?.ciudad}, {propiedad?.pais}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Box>
                </Box>


                <Box sx={{ flexWrap: 'wrap', width: '100%', gap: 2, mt: 2, borderRadius: '4px', p: 2, mb: 2, }}>
                    <Accordion>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="panel1a-content" id="panel1a-header">
                            <Typography variant='h6'>Detalles</Typography>
                        </AccordionSummary>
                        <AccordionDetails>

                            <Typography variant="h5" align="center" gutterBottom sx={{ color: 'black', fontWeight: 'bold', flex: '1 1 100%' }}>
                                Detalles de la Propiedad
                            </Typography>
                            <Typography variant="body1" align="left" gutterBottom sx={{ color: 'text.secondary', flex: '1 1 100%', mb: 2 }}>
                                {propiedad?.descripcion}
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                                    <strong>Código Postal:</strong> {propiedad?.codigo_postal}
                                </Typography>
                                <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                                    <strong>Tipo de Propiedad:</strong> {propiedad?.tipo_de_propiedad}
                                </Typography>
                                <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                                    <strong>Máximo de Huéspedes:</strong> {propiedad?.maximo_huespedes}
                                </Typography>
                                <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                                    <strong>Número de Habitaciones:</strong> {propiedad?.numero_de_habitaciones}
                                </Typography>
                                <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                                    <strong>Número de Baños:</strong> {propiedad?.numero_de_banos}
                                </Typography>
                                <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                                    <strong>Número de Camas:</strong> {propiedad?.numero_de_camas}
                                </Typography>
                                <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                                    <strong>Tamaño:</strong> {propiedad?.tamano} m²
                                </Typography>
                                <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                                    <strong>Wifi:</strong> {propiedad?.wifi ? 'Sí' : 'No'}
                                </Typography>
                                <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                                    <strong>Aire Acondicionado:</strong> {propiedad?.aire_acondicionado ? 'Sí' : 'No'}
                                </Typography>
                                <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                                    <strong>Calefacción:</strong> {propiedad?.calefaccion ? 'Sí' : 'No'}
                                </Typography>
                                <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                                    <strong>Parking:</strong> {propiedad?.parking ? 'Sí' : 'No'}
                                </Typography>
                                <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                                    <strong>Mascotas:</strong> {propiedad?.mascotas ? 'Sí' : 'No'}
                                </Typography>
                                <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                                    <strong>Permitido Fumar:</strong> {propiedad?.permitido_fumar ? 'Sí' : 'No'}
                                </Typography>
                                <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                                    <strong>Política de Cancelación:</strong> {propiedad?.politica_de_cancelacion}
                                </Typography>
                            </Box>
                        </AccordionDetails>
                    </Accordion>
                </Box>
            </Container >
            <Box sx={{ mt: "0" }}>
                <Footer />
            </Box>

        </Box >
    );
}

export default PropertyDetails;