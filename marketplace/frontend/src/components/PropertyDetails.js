import { Box, Typography, Container, Paper, Modal, IconButton, Button, TextField, Icon } from '@mui/material';
import NavBar from './NavBar';
import Footer from './Footer';
import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Carousel from 'react-material-ui-carousel';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import refreshAccessToken from './RefreshToken';
import { LocalizationProvider, PickersDay } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers';
import { StaticDatePicker } from '@mui/x-date-pickers-pro';

const PropertyDetails = () => {
    const { propiedadId } = useParams();
    const [propiedad, setPropiedad] = useState(null);
    const [fotos, setFotos] = useState([]);
    const [open, setOpen] = useState(false);
    const [selectedFotoIndex, setSelectedFotoIndex] = useState(0);
    const [esAnfitrion, setEsAnfitrion] = useState(false);
    const [openManageDates, setOpenManageDates] = useState(false);
    const [blockedDates, setBlockedDates] = useState([]);
    const [openDatePicker, setOpenDatePicker] = useState(false);
    const [selectedDates, setSelectedDates] = useState([]);
    const [openUnblockDatePicker, setOpenUnblockDatePicker] = useState(false);
    const [selectedUnblockDates, setSelectedUnblockDates] = useState([]);

    useEffect(() => {
        fetchPropertyDetails();
        fetchPropertyPhotos(propiedadId);
        fetchBlockedDates();
    }, [propiedadId]);

    const handleLogout = () => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        window.location.reload();
    };

    const handleOpenUnblockDatePicker = () => {
        setOpenUnblockDatePicker(true);
    };

    const handleCloseUnblockDatePicker = () => {
        setOpenUnblockDatePicker(false);
    };

    const handleUnblockDateChange = (date) => {
        setSelectedUnblockDates((prevDates) => {
            const dateStr = date.toISOString().split('T')[0];
            if (prevDates.some((d) => d.toISOString().split('T')[0] === dateStr)) {
                return prevDates.filter((d) => d.toISOString().split('T')[0] !== dateStr);
            } else {
                return [...prevDates, date];
            }
        });
    };

    const handleConfirmUnblockDate = () => {
        selectedUnblockDates.forEach((date) => handleUnblockDate(date.toISOString().split('T')[0]));
        handleCloseUnblockDatePicker();
    };

    const handleOpenDatePicker = () => {
        setOpenDatePicker(true);
    };

    const handleCloseDatePicker = () => {
        setOpenDatePicker(false);
    };

    const handleDateChange = (date) => {
        setSelectedDates((prevDates) => {
            const dateStr = date.toISOString().split('T')[0];
            if (prevDates.some((d) => d.toISOString().split('T')[0] === dateStr)) {
                return prevDates.filter((d) => d.toISOString().split('T')[0] !== dateStr);
            } else {
                return [...prevDates, date];
            }
        });
    };

    const handleConfirmBlockDate = () => {
        selectedDates.forEach((date) => handleBlockDate(date.toISOString().split('T')[0]));
        handleCloseDatePicker();
    }



    const handleClickOpen = (index) => {
        setSelectedFotoIndex(index);
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        setSelectedFotoIndex(0);
    };

    const handlePrev = () => {
        setSelectedFotoIndex((prev) => (prev === 0 ? fotos.length - 1 : prev - 1));
    };

    const handleNext = () => {
        setSelectedFotoIndex((prev) => (prev === fotos.length - 1 ? 0 : prev + 1));
    };

    const fetchBlockedDates = async () => {
        try {
            const response = await fetch("http://localhost:8000/api/propiedades/fechas-bloqueadas/");
            if (response.ok) {
                const data = await response.json();
                const filteredData = data.filter((fecha) => fecha.propiedad === parseInt(propiedadId));
                setBlockedDates(filteredData);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleBlockDate = async (date, retried = false) => {
        try {
            const response = await fetch("http://localhost:8000/api/propiedades/fechas-bloqueadas/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                },
                body: JSON.stringify({
                    fecha: date,
                    propiedad: propiedadId,
                }),
            });
            if (response.status === 401 && retried === false) {
                const token = await refreshAccessToken();
                if (token) {
                    handleBlockDate(date, true);
                }
                else {
                    handleLogout();
                }
            }
            if (response.ok) {
                await fetchBlockedDates();
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleUnblockDate = async (date, retried = false) => {
        try {
            const fechaBloqueada = blockedDates.find((fecha) => fecha.fecha === date);
            const response = await fetch(`http://localhost:8000/api/propiedades/fechas-bloqueadas/${fechaBloqueada.id}/`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("accessToken")}`
                },
            });
            if (response.status === 401) {
                const token = await refreshAccessToken();
                if (token && !retried) {
                    handleUnblockDate(date, true);
                }
            }

            if (response.ok) {
                fetchBlockedDates();
            }
        } catch (error) {
            console.error(error);
        }
    };

    const fetchPropertyDetails = async () => {
        try {
            const response = await fetch(`http://localhost:8000/api/propiedades/propiedades/${propiedadId}`);
            if (response.ok) {
                const data = await response.json();
                setPropiedad(data);
                const storedInfo = JSON.parse(localStorage.getItem('additionalInfo'));
                const usuarioID = storedInfo ? storedInfo.usuarioId : null;
                if (usuarioID === data.anfitrion) {
                    setEsAnfitrion(true);
                    console.log(esAnfitrion);
                }
            }
        } catch (error) {
            console.error(error);
        }
    };

    const fetchPropertyPhotos = async (propiedadId) => {
        try {
            const response = await fetch("http://localhost:8000/api/propiedades/fotos-propiedades/");
            if (response.ok) {
                const data = await response.json();
                const filteredData = data.filter(foto => foto.propiedad === parseInt(propiedadId));
                setFotos(filteredData);
            }
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <Box sx={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', bgcolor: '#f4f7fc' }}>
            <Container maxWidth="md" sx={{ flexGrow: 1, py: 4 }}>
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: { xs: 'column', md: 'row' },
                        gap: 4,
                        mb: 4,
                    }}
                >
                    {fotos.length > 0 && (
                        <Box sx={{ flex: 1 }}>
                            <Carousel
                                autoPlay
                                interval={8000}
                                navButtonsAlwaysVisible
                                indicators={false}
                                sx={{ borderRadius: 2, overflow: 'hidden' }}
                            >
                                {fotos.map((foto, index) => (
                                    <Box
                                        key={index}
                                        sx={{
                                            position: 'relative',
                                            width: '100%',
                                            height: 0,
                                            paddingTop: '56.25%',
                                        }}
                                        onClick={() => handleClickOpen(index)}
                                    >
                                        <Box
                                            component="img"
                                            src={foto.foto}
                                            alt={foto.descripcion}
                                            sx={{
                                                position: 'absolute',
                                                top: 0,
                                                left: 0,
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover',
                                            }}
                                        />
                                    </Box>
                                ))}
                            </Carousel>
                        </Box>
                    )}
                    <Box
                        sx={{
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            textAlign: 'center',
                        }}
                    >
                        <Typography variant="h5" component="h1" sx={{ fontWeight: 700, mb: 1 }}>
                            {propiedad?.nombre}
                        </Typography>
                        <Typography variant="h5" color="black" sx={{ fontWeight: 500, mb: 1 }}>
                            {propiedad?.precio_por_noche} € por noche
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                            {propiedad?.direccion}, {propiedad?.ciudad}, {propiedad?.pais}
                        </Typography>
                        {esAnfitrion && (
                            <Button variant='contained' color='primary' sx={{ mt: 2 }} onClick={() => setOpenManageDates(true)} > Gestionar Fechas Disponibles</Button>)}

                    </Box>
                </Box>

                <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: '1px solid #e0e0e0' }}>
                    <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
                        Descripción
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                        {propiedad?.descripcion}
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                        <Box sx={{ flex: '1 1 calc(50% - 16px)' }}>
                            <Typography variant="body2" color="text.secondary">
                                <strong>Código Postal:</strong> {propiedad?.codigo_postal}
                            </Typography>
                        </Box>
                        <Box sx={{ flex: '1 1 calc(50% - 16px)' }}>
                            <Typography variant="body2" color="text.secondary">
                                <strong>Tipo de Propiedad:</strong> {propiedad?.tipo_de_propiedad}
                            </Typography>
                        </Box>
                        <Box sx={{ flex: '1 1 calc(50% - 16px)' }}>
                            <Typography variant="body2" color="text.secondary">
                                <strong>Máx. Huéspedes:</strong> {propiedad?.maximo_huespedes}
                            </Typography>
                        </Box>
                        <Box sx={{ flex: '1 1 calc(50% - 16px)' }}>
                            <Typography variant="body2" color="text.secondary">
                                <strong>Habitaciones:</strong> {propiedad?.numero_de_habitaciones}
                            </Typography>
                        </Box>
                        <Box sx={{ flex: '1 1 calc(50% - 16px)' }}>
                            <Typography variant="body2" color="text.secondary">
                                <strong>Baños:</strong> {propiedad?.numero_de_banos}
                            </Typography>
                        </Box>
                        <Box sx={{ flex: '1 1 calc(50% - 16px)' }}>
                            <Typography variant="body2" color="text.secondary">
                                <strong>Camas:</strong> {propiedad?.numero_de_camas}
                            </Typography>
                        </Box>
                        <Box sx={{ flex: '1 1 calc(50% - 16px)' }}>
                            <Typography variant="body2" color="text.secondary">
                                <strong>Tamaño:</strong> {propiedad?.tamano} m²
                            </Typography>
                        </Box>
                        <Box sx={{ flex: '1 1 calc(50% - 16px)' }}>
                            <Typography variant="body2" color="text.secondary">
                                <strong>Wifi:</strong> {propiedad?.wifi ? 'Sí' : 'No'}
                            </Typography>
                        </Box>
                        <Box sx={{ flex: '1 1 calc(50% - 16px)' }}>
                            <Typography variant="body2" color="text.secondary">
                                <strong>Aire Acond.:</strong> {propiedad?.aire_acondicionado ? 'Sí' : 'No'}
                            </Typography>
                        </Box>
                        <Box sx={{ flex: '1 1 calc(50% - 16px)' }}>
                            <Typography variant="body2" color="text.secondary">
                                <strong>Calefacción:</strong> {propiedad?.calefaccion ? 'Sí' : 'No'}
                            </Typography>
                        </Box>
                        <Box sx={{ flex: '1 1 calc(50% - 16px)' }}>
                            <Typography variant="body2" color="text.secondary">
                                <strong>Parking:</strong> {propiedad?.parking ? 'Sí' : 'No'}
                            </Typography>
                        </Box>
                        <Box sx={{ flex: '1 1 calc(50% - 16px)' }}>
                            <Typography variant="body2" color="text.secondary">
                                <strong>Mascotas:</strong> {propiedad?.mascotas ? 'Sí' : 'No'}
                            </Typography>
                        </Box>
                        <Box sx={{ flex: '1 1 calc(50% - 16px)' }}>
                            <Typography variant="body2" color="text.secondary">
                                <strong>Fumar:</strong> {propiedad?.permitido_fumar ? 'Sí' : 'No'}
                            </Typography>
                        </Box>
                        <Box sx={{ flex: '1 1 100%' }}>
                            <Typography variant="body2" color="text.secondary">
                                <strong>Política de Cancelación:</strong> {propiedad?.politica_de_cancelacion}
                            </Typography>
                        </Box>
                    </Box>
                </Paper>
                <Modal open={open} onClose={handleClose} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Box sx={{ position: 'relative', width: '80vw', height: '80vh', bgcolor: "background.paper", p: 4, borderRadius: 2 }}>
                        <IconButton onClick={handleClose} sx={{ position: 'absolute', top: 8, right: 8 }}>
                            <CloseIcon />
                        </IconButton>
                        <IconButton onClick={handlePrev} sx={{ position: 'absolute', top: '50%', left: 8, transform: 'translateY(-50%)' }}>
                            <ArrowBackIosNewIcon />
                        </IconButton>
                        <IconButton onClick={handleNext} sx={{ position: 'absolute', top: '50%', right: 8, transform: 'translateY(-50%)' }}>
                            <ArrowForwardIosIcon />
                        </IconButton>
                        {fotos[selectedFotoIndex] && (
                            <Box
                                component="img"
                                src={fotos[selectedFotoIndex].foto}
                                alt={fotos[selectedFotoIndex].descripcion}
                                sx={{ width: '100%', height: '100%', objectFit: 'contain' }}
                            />
                        )}
                    </Box>

                </Modal>
                <Modal open={openManageDates} onClose={() => setOpenManageDates(false)} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Box sx={{ position: 'relative', width: '40vw', height: '40vh', bgcolor: "background.paper", p: 4, borderRadius: 2 }}>
                        <IconButton onClick={() => setOpenManageDates(false)} sx={{ position: 'absolute', top: 8, right: 8 }}>
                            <CloseIcon />
                        </IconButton>
                        <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
                            Gestionar Fechas Disponibles
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 6 }}>
                            <Button variant="contained" color="primary" onClick={() => handleOpenDatePicker()}>
                                Bloquear Fecha
                            </Button>
                            <Button variant="contained" color="error" onClick={handleOpenUnblockDatePicker}>
                                Desbloquear Fecha
                            </Button>
                        </Box>
                    </Box>
                </Modal>
                <Modal open={openDatePicker} onClose={handleCloseDatePicker} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 8 }}>
                    <Box sx={{ position: 'relative', width: '40vw', height: '40vh', bgcolor: "background.paper", p: 4, borderRadius: 2 }}>
                        <IconButton onClick={handleCloseDatePicker} sx={{ position: 'absolute', top: 8, right: 8 }}>
                            <CloseIcon />
                        </IconButton>
                        <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
                            Seleccionar fecha para Bloquear
                        </Typography>
                        <LocalizationProvider dateAdapter={AdapterDateFns}>
                            <StaticDatePicker
                                displayStaticWrapperAs="desktop"
                                openTo='day'
                                value={selectedDates}
                                onChange={handleDateChange}
                                renderInput={(params) => <TextField {...params} />}
                                disablePast
                                shouldDisableDate={(date) => blockedDates.some((fecha) => fecha.fecha === date.toISOString().split('T')[0])}
                                renderDay={(day, _value, DayComponentProps) => {
                                    const dateStr = day.toISOString().split('T')[0];
                                    const isSelected = selectedDates.some((date) => date.toISOString().split('T')[0] === dateStr);
                                    return (<PickersDay {...DayComponentProps} selected={isSelected} />);
                                }}
                            />
                        </LocalizationProvider>
                        <Button variant="contained" color="primary" onClick={handleConfirmBlockDate}>
                            Confirmar
                        </Button>
                    </Box>
                </Modal>
                <Modal open={openUnblockDatePicker} onClose={handleCloseUnblockDatePicker} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 8 }}>
                    <Box sx={{ position: 'relative', width: '40vw', height: '40vh', bgcolor: "background.paper", p: 4, borderRadius: 2 }}>
                        <IconButton onClick={handleCloseUnblockDatePicker} sx={{ position: 'absolute', top: 8, right: 8 }}>
                            <CloseIcon />
                        </IconButton>
                        <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
                            Seleccionar fecha para Desbloquear
                        </Typography>
                        <LocalizationProvider dateAdapter={AdapterDateFns}>
                            <StaticDatePicker
                                displayStaticWrapperAs="desktop"
                                openTo='day'
                                value={selectedUnblockDates}
                                onChange={handleUnblockDateChange}
                                renderInput={(params) => <TextField {...params} />}
                                disablePast
                                shouldDisableDate={(date) => !blockedDates.some((fecha) => fecha.fecha === date.toISOString().split('T')[0])}
                                renderDay={(day, _value, DayComponentProps) => {
                                    const dateStr = day.toISOString().split('T')[0];
                                    const isSelected = selectedUnblockDates?.some((date) => date.toISOString().split('T')[0] === dateStr);
                                    return (<PickersDay {...DayComponentProps} selected={isSelected} />);
                                }}
                            />
                        </LocalizationProvider>
                        <Button variant="contained" color="primary" onClick={handleConfirmUnblockDate}>
                            Confirmar
                        </Button>
                    </Box>
                </Modal>
            </Container>
        </Box>
    );
};

export default PropertyDetails;
