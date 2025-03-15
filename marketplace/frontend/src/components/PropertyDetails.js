import { Box, Typography, Container, Paper, Modal, IconButton, Button, TextField, FormControl, Input, InputLabel, MenuItem, Select, Rating } from '@mui/material';
import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Carousel from 'react-material-ui-carousel';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import refreshAccessToken from './RefreshToken';
import { LocalizationProvider, PickersDay, StaticDatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import 'react-dates/initialize';
import 'react-dates/lib/css/_datepicker.css';
import { DateRangePicker, DayPickerSingleDateController } from 'react-dates';
import moment from 'moment';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import { Alert } from '@mui/material';
import { set } from 'date-fns';


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
    const [openUnblockDatePicker, setOpenUnblockDatePicker] = useState(false);
    const [openReserveDatePicker, setOpenReserveDatePicker] = useState(false);
    const [reserveStartDate, setReserveStartDate] = useState(null);
    const [reserveEndDate, setReserveEndDate] = useState(null);
    const [focusedInput, setFocusedInput] = useState(null);
    const [numPersonas, setNumPersonas] = useState(1);
    const [metodoPago, setMetodoPago] = useState("Tarjeta de crédito");
    const [comentarios_usuario, setComentariosUsuario] = useState("");
    const [reservas, setReservas] = useState([]);
    const [selectedBlockDates, setSelectedBlockDates] = useState([]);
    const [selectedUnblockDates, setSelectedUnblockDates] = useState([]);
    const [rating, setRating] = useState(0);
    const [comentario_valoracion, setComentarioValoracion] = useState("");
    const [hasRated, setHasRated] = useState(false);
    const [userRating, setUserRating] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [alertMessage, setAlertMessage] = useState("");



    useEffect(() => {
        if (isAuthenticated()) {

            fetchBlockedDates();
            fetchReservas();
            refreshAccessToken();
        }
        fetchPropertyDetails();
        fetchPropertyPhotos(propiedadId);
        checkUserRating();

    }, [propiedadId, openManageDates, openDatePicker, openUnblockDatePicker, openReserveDatePicker]);

    const validateFields = () => {
        if (rating === 0 || comentario_valoracion.trim() === "") {
            setAlertMessage("Por favor, complete todos los campos");
            return false;
        }
        setAlertMessage("");
        return true;
    };

    const checkUserRating = async () => {
        try {
            const response = await fetch(`http://localhost:8000/api/propiedades/valoraciones-propiedades/`);
            if (response.ok) {
                const data = await response.json();
                const dataFiltered = data.filter((valoracion) => valoracion.usuario === JSON.parse(localStorage.getItem('additionalInfo')).usuarioId && valoracion.propiedad === parseInt(propiedadId));
                if (dataFiltered.length > 0) {
                    setHasRated(true);
                    setUserRating(dataFiltered[0]);
                }
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleEditRating = async () => {
        setIsEditing(true);
        setRating(userRating.valoracion);
        setComentarioValoracion(userRating.comentario);
    };

    const handleUpdateRating = async (propiedadId, retried = false) => {
        if (!validateFields()) return;
        try {
            const response = await fetch(`http://localhost:8000/api/propiedades/valoraciones-propiedades/${userRating.id}/`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                },
                body: JSON.stringify({
                    valoracion: rating,
                    comentario: comentario_valoracion,
                }),
            });
            if (response.status === 401 && !retried) {
                const token = await refreshAccessToken();
                if (token) {
                    handleUpdateRating(retried = true, propiedadId);
                } else {
                    handleLogout();
                }
            } else if (response.ok) {
                alert('Valoración actualizada correctamente');
                window.location.reload();
            }

        } catch (error) {
            console.error(error);
        }
    };

    const isAuthenticated = () => {
        return localStorage.getItem("accessToken") && localStorage.getItem("refreshToken");
    };

    const handleLogout = () => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        window.location.reload();
    };

    const handleRatingChange = (event, newValue) => {
        setRating(newValue);
    };

    const handleSubmitRating = async (propiedadId, retried = false) => {
        if (!validateFields()) return;
        try {
            const response = await fetch("http://localhost:8000/api/propiedades/valoraciones-propiedades/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                },
                body: JSON.stringify({
                    propiedad: propiedadId,
                    usuario: JSON.parse(localStorage.getItem('additionalInfo')).usuarioId,
                    valoracion: rating,
                    comentario: comentario_valoracion,
                }),
            });

            if (response.status === 401 && !retried) {
                const token = await refreshAccessToken();
                if (token) {
                    handleSubmitRating(retried = true, propiedadId);
                } else {
                    handleLogout();
                }
            } else if (response.ok) {
                alert('Valoración enviada correctamente');
                window.location.reload();
            } else {
                console.error(response);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleIncrement = () => {
        if (numPersonas < propiedad.maximo_huespedes)
            setNumPersonas((prev) => prev + 1);
    };

    const handleDecrement = () => {
        if (numPersonas > 1)
            setNumPersonas((prev) => prev - 1);
    };

    const handleOpenReserveDatePicker = () => {
        setOpenReserveDatePicker(true);
    };

    const handleCloseReserveDatePicker = () => {
        setOpenReserveDatePicker(false);
    };

    const handleReserveDateChange = ({ startDate, endDate }) => {
        setReserveStartDate(startDate);
        setReserveEndDate(endDate);
    };

    const handleOpenUnblockDatePicker = () => {
        setOpenUnblockDatePicker(true);
    };

    const handleCloseUnblockDatePicker = () => {
        setOpenUnblockDatePicker(false);
    };

    const handleUnblockDateChange = (date) => {
        const dateStr = date.format('YYYY-MM-DD');
        setSelectedUnblockDates((prevDates) => {
            if (prevDates.includes(dateStr)) {
                return prevDates.filter((d) => d !== dateStr);
            } else {
                return [...prevDates, dateStr];
            }
        });
    };

    const handleConfirmUnblockDate = () => {
        selectedUnblockDates.forEach((date) => handleUnblockDate(date));
        setSelectedUnblockDates([]);
        handleCloseUnblockDatePicker();
    };

    const handleOpenDatePicker = () => {
        setOpenDatePicker(true);
    };

    const handleCloseDatePicker = () => {
        setOpenDatePicker(false);
    };

    const handleBlockDateChange = (date) => {
        const dateStr = date.format('YYYY-MM-DD');
        setSelectedBlockDates((prevDates) => {
            if (prevDates.includes(dateStr)) {
                return prevDates.filter((d) => d !== dateStr);
            } else {
                return [...prevDates, dateStr];
            }
        });
    };

    const handleFocusChange = (focusedInput) => {
        setFocusedInput(focusedInput);
    };

    const handleConfirmBlockDate = async () => {

        for (const date of selectedBlockDates) {
            await handleBlockDate(date);
        }
        setSelectedBlockDates([]);
        handleCloseDatePicker();
    };


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

    const fetchBlockedDates = async (retried = false) => {
        try {
            const response = await fetch("http://localhost:8000/api/propiedades/fechas-bloqueadas/")
            if (response.status === 401 && !retried) {
                const token = await refreshAccessToken();
                if (token) {
                    fetchBlockedDates(retried = true);
                } else {
                    handleLogout();
                }
            }
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
            if (response.status === 401 && !retried) {
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
            if (response.status === 401 && !retried) {
                const token = await refreshAccessToken();
                if (token) {
                    handleUnblockDate(date, true);
                } else {
                    handleLogout();
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
                }
            }

            console.log(propiedad);
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

    const fetchReservas = async (retried = false) => {
        try {
            const response = await fetch("http://localhost:8000/api/propiedades/reservas/");
            if (response.status === 401 && !retried) {
                const token = await refreshAccessToken();
                if (token) {
                    fetchReservas(true);
                } else {
                    handleLogout();
                }
            }
            if (response.ok) {
                const data = await response.json();
                const filteredData = data.filter((reserva) => reserva.propiedad === parseInt(propiedadId));
                setReservas(filteredData);
                setReserveStartDate(null);
                setReserveEndDate(null);
                setFocusedInput(null);
                setNumPersonas(1);
                setMetodoPago("Tarjeta de crédito");
                setComentariosUsuario("");
            }
        } catch (error) {
            console.error(error);
        }
    };

    const allBlockedDates = [
        ...blockedDates.map((fecha) => fecha.fecha),
        ...reservas.filter((reserva) => reserva.estado !== "Cancelada")
            .flatMap((reserva) => {
                const startDate = moment(reserva.fecha_llegada);
                const endDate = moment(reserva.fecha_salida);
                const dates = [];
                while (startDate.isBefore(endDate) || startDate.isSame(endDate, 'day')) {
                    dates.push(startDate.format('YYYY-MM-DD'));
                    startDate.add(1, 'day');
                }
                return dates;
            })
    ];

    const handleConfirmReserve = async (retried = false) => {
        if (!reserveStartDate || !reserveEndDate) {
            return;
        }

        const startDate = moment(reserveStartDate);
        const endDate = moment(reserveEndDate);
        const datesBetween = [];
        let currentDate = startDate.clone();
        while (currentDate.isBefore(endDate) || currentDate.isSame(endDate, 'day')) {
            datesBetween.push(currentDate.format('YYYY-MM-DD'));
            currentDate.add(1, 'day');
        }

        const hasBlockedDates = datesBetween.some((date) => allBlockedDates.includes(date));

        if (hasBlockedDates) {
            alert('Las fechas seleccionadas no están disponibles porque tienen que ser días seguidos');
            return;
        }

        const formattedStartDate = moment(reserveStartDate).format('YYYY-MM-DD');
        const formattedEndDate = moment(reserveEndDate).format('YYYY-MM-DD');

        const numNoches = moment(reserveEndDate).diff(moment(reserveStartDate), 'days');

        const precioTotalSinComision = propiedad.precio_por_noche * numNoches;

        const porcentajeComision = 0.1;

        const comision = precioTotalSinComision * porcentajeComision;

        const precioTotal = precioTotalSinComision + comision;

        const reservationData = {
            usuario: JSON.parse(localStorage.getItem('additionalInfo')).usuarioId,
            anfitrion: propiedad.anfitrion,
            propiedad: propiedadId,
            fecha_llegada: formattedStartDate,
            fecha_salida: formattedEndDate,
            estado: 'Pendiente',
            precio_por_noche: propiedad.precio_por_noche,
            numero_personas: numPersonas,
            metodo_pago: metodoPago,
            precio_total: precioTotal,
            comentarios_usuario: comentarios_usuario,
        };

        try {
            const response = await fetch("http://localhost:8000/api/propiedades/reservas/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                },
                body: JSON.stringify(reservationData),
            });

            if (response.status === 401 && !retried) {
                const token = await refreshAccessToken();
                if (token) {
                    handleConfirmReserve(true);
                } else {
                    handleLogout();
                }
            } else if (response.ok) {
                handleCloseReserveDatePicker();
            } else {
                console.error(response);
            }

        } catch (error) {
            console.error(error);
        }
    }


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
                        {esAnfitrion && isAuthenticated() ? (
                            <Button variant='contained' color='primary' sx={{ mt: 2 }} onClick={() => setOpenManageDates(true)} > Gestionar Fechas Disponibles</Button>)
                            : <Button variant='contained' color='primary' sx={{ mt: 2 }} onClick={handleOpenReserveDatePicker} > Reservar</Button>}

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
                {(isAuthenticated() && esAnfitrion) ? null : (
                    <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: '1px solid #e0e0e0', mt: 4 }}>
                        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                            Valoración
                        </Typography>
                        {alertMessage && (
                            <Alert severity='error' sx={{ mb: 2 }}>
                                {alertMessage}
                            </Alert>

                        )}
                        {hasRated ? (
                            isEditing ? (
                                <Box>
                                    <Rating name="rating" value={rating} onChange={handleRatingChange} precision={0.5} />
                                    <TextField
                                        value={comentario_valoracion}
                                        onChange={(e) => setComentarioValoracion(e.target.value)}
                                        multiline
                                        sx={{ mt: 1, width: '100%' }}
                                    />
                                    <Button variant="contained" color="primary" onClick={() => handleUpdateRating(propiedad.id)} sx={{ mt: 2 }}>
                                        Actualizar Valoración
                                    </Button>
                                    <Button variant="outlined" color="secondary" onClick={() => setIsEditing(false)} sx={{ mt: 2, ml: 2 }}>
                                        Cancelar
                                    </Button>
                                </Box>
                            ) : (
                                <Box>
                                    <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                                        <Rating name="read-only" value={userRating.valoracion} readOnly precision={0.5} />
                                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                            {userRating.comentario}
                                        </Typography>
                                    </Typography>
                                    <Button variant="contained" color="primary" onClick={handleEditRating}>
                                        Editar Valoración
                                    </Button>
                                </Box>
                            )
                        ) : (
                            <>
                                <Rating name="rating" value={rating} onChange={handleRatingChange} precision={0.5} />
                                <TextField
                                    value={comentario_valoracion}
                                    onChange={(e) => setComentarioValoracion(e.target.value)}
                                    multiline
                                    sx={{ mt: 1, width: '100%' }}
                                />
                                <Button variant="contained" color="primary" onClick={() => handleSubmitRating(propiedad.id)} sx={{ mt: 2 }}>
                                    Enviar Valoración
                                </Button>
                            </>
                        )}
                    </Paper>
                )}
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
                    <Box sx={{ position: 'relative', width: '80vw', height: '80vh', bgcolor: "background.paper", p: 4, borderRadius: 2, alignItems: 'center' }}>
                        <IconButton onClick={handleCloseDatePicker} sx={{ position: 'absolute', top: 8, right: 8 }}>
                            <CloseIcon />
                        </IconButton>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, justifyContent: 'center', alignItems: 'center' }}>
                            <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
                                Seleccionar fecha para Bloquear
                            </Typography>
                            <DayPickerSingleDateController
                                date={null}
                                onDateChange={handleBlockDateChange}
                                focused={true}
                                onFocusChange={handleFocusChange}
                                isDayHighlighted={(date) => selectedBlockDates.includes(date.format('YYYY-MM-DD'))}
                                isOutsideRange={(date) => date.isBefore(moment()) || allBlockedDates.some((blockedDate) => moment(blockedDate).isSame(date, 'day'))}
                                hideKeyboardShortcutsPanel
                            />
                            <Button variant="contained" color="primary" onClick={handleConfirmBlockDate}>
                                Confirmar
                            </Button>
                        </Box>
                    </Box>
                </Modal>
                <Modal open={openUnblockDatePicker} onClose={handleCloseUnblockDatePicker} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 8 }}>
                    <Box sx={{ position: 'relative', width: '80vw', height: '80vh', bgcolor: "background.paper", p: 4, borderRadius: 2 }}>
                        <IconButton onClick={handleCloseUnblockDatePicker} sx={{ position: 'absolute', top: 8, right: 8 }}>
                            <CloseIcon />
                        </IconButton>
                        <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
                            Seleccionar fecha para Desbloquear
                        </Typography>
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, justifyContent: "center", alignItems: "center" }}>
                            <DayPickerSingleDateController
                                date={null}
                                onDateChange={handleUnblockDateChange}
                                focused={true}
                                onFocusChange={handleFocusChange}
                                isDayHighlighted={(date) => selectedUnblockDates.includes(date.format('YYYY-MM-DD'))}
                                isOutsideRange={(date) => date.isBefore(moment()) || !blockedDates.some((blockedDate) => moment(blockedDate.fecha).isSame(date, 'day'))}
                                hideKeyboardShortcutsPanel
                            />
                            <Button variant="contained" color="primary" onClick={handleConfirmUnblockDate}>
                                Confirmar
                            </Button>
                        </Box>

                    </Box>
                </Modal>
                <Modal open={openReserveDatePicker} onClose={handleCloseReserveDatePicker} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 8 }}>
                    <Box sx={{ position: 'relative', width: '50vw', maxWidth: '600px', bgcolor: "background.paper", p: 4, borderRadius: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: 24 }}>
                        <IconButton onClick={handleCloseReserveDatePicker} sx={{ position: 'absolute', top: 8, right: 8 }}>
                            <CloseIcon />
                        </IconButton>
                        <Typography variant="h5" sx={{ mb: 4, fontWeight: 600 }}>
                            Seleccionar fecha para Reservar
                        </Typography>
                        <Box sx={{ zIndex: 1300 }}>
                            <DateRangePicker
                                startDate={reserveStartDate}
                                startDateId="start_date_id"
                                endDate={reserveEndDate}
                                endDateId="end_date_id"
                                onDatesChange={handleReserveDateChange}
                                focusedInput={focusedInput}
                                onFocusChange={(focusedInput) => setFocusedInput(focusedInput)}
                                minimumNights={1}
                                isOutsideRange={(date) => date.isBefore(moment()) || allBlockedDates.some((blockedDate) => moment(blockedDate).isSame(date, 'day'))}
                                hideKeyboardShortcutsPanel
                                required
                            />
                        </Box>
                        <Box sx={{ display: "flex", alignItems: "center", mt: 2 }}>
                            <Typography variant="body1" component="span">Número de huéspedes:</Typography>
                            <IconButton onClick={handleDecrement} sx={{ mx: 1 }}>
                                <RemoveIcon />
                            </IconButton>
                            <Typography variant="body1" component="span">{numPersonas}</Typography>
                            <IconButton onClick={handleIncrement} sx={{ mx: 1 }}>
                                <AddIcon />
                            </IconButton>
                        </Box>
                        <FormControl sx={{ mt: 2, width: '100%' }}>
                            <InputLabel id="metodo-pago-label">Método de Pago</InputLabel>
                            <Select
                                id="metodo-pago"
                                aria-labelledby="metodo-pago-label"
                                value={metodoPago}
                                onChange={(e) => setMetodoPago(e.target.value)}
                                label="Método de Pago"
                            >
                                <MenuItem value="Tarjeta de crédito">Tarjeta de Crédito</MenuItem>
                                <MenuItem value="PayPal">Paypal</MenuItem>
                                <MenuItem value="Transferencia bancaria">Transferencia Bancaria</MenuItem>
                            </Select>
                        </FormControl>
                        <Typography variant="body2" component="span" sx={{ mt: 2 }}>Comentario sobre la reserva:</Typography>
                        <TextField
                            value={comentarios_usuario}
                            onChange={(e) => setComentariosUsuario(e.target.value)}
                            multiline
                            sx={{ mt: 1, width: '100%' }}
                        />
                        {reserveStartDate && reserveEndDate && (
                            <>
                                <Typography variant="body2" component="span" sx={{ mt: 2 }}>
                                    Precio sin Comisión: {(propiedad?.precio_por_noche * moment(reserveEndDate).diff(moment(reserveStartDate), 'days')).toFixed(2)} €
                                </Typography>
                                <Typography variant="body2" component="span" sx={{ mt: 1 }}>
                                    Comisión: {(propiedad?.precio_por_noche * moment(reserveEndDate).diff(moment(reserveStartDate), 'days') * 0.10).toFixed(2)} €
                                </Typography>
                                <Typography variant="body2" component="span" sx={{ mt: 1 }}>
                                    Precio Total: {(propiedad?.precio_por_noche * moment(reserveEndDate).diff(moment(reserveStartDate), 'days') * 1.10).toFixed(2)} €
                                </Typography>
                            </>
                        )}
                        <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2, mt: 2 }}>
                            <Button variant="contained" color="error" onClick={handleCloseReserveDatePicker}>
                                Cancelar
                            </Button>
                            <Button variant="contained" color="primary" onClick={handleConfirmReserve}>
                                Confirmar
                            </Button>
                        </Box>
                    </Box>
                </Modal>
            </Container>
        </Box >
    );
};


export default PropertyDetails;
