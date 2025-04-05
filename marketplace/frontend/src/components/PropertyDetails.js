import { Box, Typography, Container, Paper, Modal, IconButton, Button, TextField, FormControl, Input, InputLabel, MenuItem, Select, Rating } from '@mui/material';
import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Carousel from 'react-material-ui-carousel';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import refreshAccessToken from './RefreshToken';
import 'react-dates/initialize';
import 'react-dates/lib/css/_datepicker.css';
import { DateRangePicker, DayPickerSingleDateController } from 'react-dates';
import moment from 'moment';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import { Alert } from '@mui/material';
import { loadStripe } from '@stripe/stripe-js';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import { set } from 'date-fns';
import PropertyValorations from './PropertyValorations';





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
    const [mediaValoraciones, setMediaValoraciones] = useState(null);
    const [loadingMedia, setLoadingMedia] = useState(true);
    const [errorMedia, setErrorMedia] = useState(null);
    const [loading, setLoading] = useState(false);
    const [loadingRating, setLoadingRating] = useState(false);
    const stripePromise = loadStripe('pk_test_51OLmDUDoSuE99ePTNjJmFyVKyw1JJEabUApOykfz6zKOpSHuGJZ2Tobebcs0l9tSNtcBfUkURjIqSgarS1ik5YVt00ZVb4u4nn');
    const [isFavorite, setIsFavorite] = useState(false);
    const [favoritoId, setFavoritoId] = useState(null);
    const [notification, setNotification] = useState(null);
    const clienteId = JSON.parse(localStorage.getItem('additionalInfo'))?.usuarioId;
    const [cliente, setCliente] = useState(null);

    useEffect(() => {
        if (isAuthenticated()) {

            fetchBlockedDates();
            fetchReservas();
            refreshAccessToken();
            checkIfFavorite();
        }
        fetchPropertyDetails();
        fetchPropertyPhotos(propiedadId);
        checkUserRating();
        fetchMediaValoraciones();

    }, [propiedadId, openManageDates, openDatePicker, openUnblockDatePicker, openReserveDatePicker]);

    useEffect(() => {
        if (clienteId)
            fetchCliente(clienteId);
    }, [clienteId]);


    const validateFields = () => {
        if (rating === 0 || comentario_valoracion.trim() === "") {
            setAlertMessage("Por favor, complete todos los campos");
            return false;
        }
        setAlertMessage("");
        return true;
    };

    const fetchCliente = async (clienteId) => {
        try {
            const response = await fetch(`http://localhost:8000/api/usuarios/${clienteId}/`);
            if (response.ok) {
                const data = await response.json();
                setCliente(data);
                console.log(data);
            } else {
                console.error("Error fetching cliente data:", response.statusText);
            }
        } catch (error) {
            console.error("Error fetching cliente data:", error);
        }
    };


    const checkIfFavorite = async () => {
        try {
            const response = await fetch(`http://localhost:8000/api/propiedades/favoritos/`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                const storedInfo = JSON.parse(localStorage.getItem('additionalInfo'));
                const usuarioID = storedInfo ? storedInfo.usuarioId : null;
                const propiedadID = parseInt(propiedadId);
                const isFav = data.some((fav) => fav.usuario === usuarioID && fav.propiedad === propiedadID);
                setIsFavorite(isFav);
                console.log(isFav)
                setFavoritoId(data.find((fav) => fav.usuario === usuarioID && fav.propiedad === propiedadID)?.id);
                console.log(data.find((fav) => fav.usuario === usuarioID && fav.propiedad === propiedadID)?.id);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleDeleteRating = async (ratingId) => {
        try {
            const response = await fetch(`http://localhost:8000/api/propiedades/valoraciones-propiedades/${ratingId}/`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                },
            });
            if (response.ok) {

                setNotification({
                    message: "Valoración eliminada correctamente",
                    severity: "success",
                })
                setTimeout(() => { window.location.reload() }, 2000);
                fetchMediaValoraciones();
            }

        } catch (error) {
            console.error(error);
            setNotification({
                message: "Error al eliminar la valoración",
                severity: "error",
            })

        }
    };

    const handleToggleFavorite = async (retried = false) => {
        try {
            const storedInfo = JSON.parse(localStorage.getItem('additionalInfo'));
            const usuarioID = storedInfo ? storedInfo.usuarioId : null;
            const propiedadID = parseInt(propiedadId);
            const isFavorito = isFavorite;
            if (isFavorito) {
                const data = await fetch(`http://localhost:8000/api/propiedades/favoritos/${favoritoId}/`, {
                    method: "DELETE",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                    },
                });
                if (data.status === 401 && !retried) {
                    const token = await refreshAccessToken();
                    if (token) {
                        handleToggleFavorite(propiedadId, true);
                    }
                    else {
                        throw new Error("Error al refrescar el token");
                    }
                }
            } else if (!isFavorito) {
                const data = await fetch("http://localhost:8000/api/propiedades/favoritos/", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                    },
                    body: JSON.stringify({ propiedad: propiedadID, usuario: usuarioID }),
                });
                if (data.status === 401 && !retried) {
                    const token = await refreshAccessToken();
                    if (token) {
                        handleToggleFavorite(propiedadId, true);
                    } else {
                        throw new Error("Error al refrescar el token");
                    }
                }
            }
            checkIfFavorite();
            // window.location.reload();
        } catch (error) {
            console.error("Error al añadir a favoritos:", error);
        }
    };


    const fetchMediaValoraciones = async () => {
        try {
            const response = await fetch(`http://localhost:8000/api/propiedades/valoraciones-propiedades/${propiedadId}/media_valoraciones/`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            });
            if (response.ok) {
                const data = await response.json();
                setMediaValoraciones(data);
            } else {
                setErrorMedia("No se pudo obtener la media de valoraciones");
            }
        } catch (error) {
            setErrorMedia("No se pudo obtener la media de valoraciones");
            console.error(error);
        } finally {
            setLoadingMedia(false);
        }
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
                setNotification({
                    message: "Valoración actualizada correctamente",
                    severity: "success",
                })
                setTimeout(() => { window.location.reload() }, 2000);

            }

        } catch (error) {
            console.error(error);

        };
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
        setLoadingRating(true);
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
                setNotification({
                    message: "Valoración enviada correctamente",
                    severity: "success",
                })

                setTimeout(() => { window.location.reload(); }, 2000);
            } else {
                console.error(response);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoadingRating(false);
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
            const response = await fetch("http://localhost:8000/api/propiedades/fechas-bloqueadas/", {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                },
            });
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
            const response = await fetch("http://localhost:8000/api/propiedades/reservas/", {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                },
            });
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
                const endDate = moment(reserva.fecha_salida).subtract(1, 'day');
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
            alert('Por favor, seleccione las fechas de reserva');
            return;
        }

        setLoading(true);

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
            setLoading(false);
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
            amount: Math.round(precioTotal * 100),
            currency: 'eur',
            correo: cliente?.usuario?.email,
            nombrePropiedad: propiedad.nombre,

        };

        if (metodoPago === "Tarjeta de crédito") {

            try {
                const response = await fetch("http://localhost:8000/api/propiedades/create-checkout-session/", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                    },
                    body: JSON.stringify({
                        reservationData,
                    }),
                });

                const data = await response.json();

                const { id: sessionId } = data;

                const stripe = await stripePromise;

                console.log('Redirecting to checkout');
                const { error } = await stripe.redirectToCheckout({
                    sessionId: sessionId,

                });
                if (error) {
                    if (error.type === 'card_error') {
                        alert(`Error de tarjeta: ${error.message}`);
                    } else if (error.type === 'validation_error') {
                        alert(error.message);
                    } else {
                        alert('Error inesperado durante el pago');
                    }
                }

                if (error) {
                    console.error(error);
                    alert('Ocurrió un error al procesar el pago');
                    setLoading(false);
                    return;
                }

            } catch (error) {
                console.error(error);
                alert('Ocurrió un error al procesar el pago');
                setLoading(false);
            }
        } else if (metodoPago === "PayPal") {
            try {
                const response = await fetch("http://localhost:8000/api/propiedades/create-checkout-paypal/", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                    },
                    body: JSON.stringify({
                        reservationData,
                    }),
                });

                const data = await response.json();

                if (data.approval_url) {
                    localStorage.setItem('reservationData', JSON.stringify(reservationData));
                    window.location.href = data.approval_url;
                } else {
                    alert('Ocurrió un error al procesar el pago');
                    setLoading(false);
                }
            } catch (error) {
                console.error(error);
                alert('Ocurrió un error al procesar el pago');
                setLoading(false);
            }
        }

    };
    return (
        <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: '#f8f9fc' }}>
            <Container maxWidth="lg" sx={{ flexGrow: 1, py: 5 }}>
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: { xs: 'column', md: 'row' },
                        gap: 4,
                        mb: 5,
                    }}
                >
                    {fotos.length > 0 && (
                        <Box sx={{
                            flex: 1.2,
                            display: 'flex',
                            alignItems: 'center'
                        }}>
                            <Paper
                                elevation={2}
                                sx={{
                                    borderRadius: 3,
                                    overflow: 'hidden',
                                    transition: 'transform 0.3s',
                                    height: '100%',
                                    width: '100%',
                                    '&:hover': {
                                        transform: 'scale(1.01)',
                                    },
                                }}
                            >
                                <Carousel
                                    autoPlay
                                    interval={8000}
                                    navButtonsAlwaysVisible
                                    indicators={true}
                                    animation="slide"
                                    sx={{ height: '100%' }}
                                    navButtonsProps={{
                                        style: {
                                            backgroundColor: 'rgba(255, 255, 255, 0.7)',
                                            color: '#000',
                                            borderRadius: '50%',
                                            margin: '0 10px',

                                        }
                                    }}
                                    indicatorContainerProps={{
                                        style: {
                                            marginTop: '-24px',
                                            position: 'relative',
                                            zIndex: 1,
                                            height: "100%",
                                            bottom: "15px"
                                        }
                                    }}
                                    indicatorIconButtonProps={{
                                        style: {
                                            color: 'rgba(255, 255, 255, 0.7)',

                                        }
                                    }}
                                    activeIndicatorIconButtonProps={{
                                        style: {
                                            color: '#fff',
                                        }
                                    }}
                                >
                                    {fotos.map((foto, index) => (
                                        <Box
                                            key={index}
                                            sx={{
                                                position: 'relative',
                                                width: '100%',
                                                height: '100%',
                                                paddingTop: '66.25%',
                                                cursor: 'pointer',
                                            }}
                                            onClick={() => handleClickOpen(index)}
                                        >
                                            <Box
                                                component="img"
                                                src={foto.foto}
                                                alt={foto.descripcion || 'Imagen de propiedad'}
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
                            </Paper>
                        </Box>
                    )}
                    <Box
                        sx={{
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                        }}
                    >
                        <Paper
                            elevation={2}
                            sx={{
                                p: 4,
                                borderRadius: 3,
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center',
                                position: 'relative',
                            }}
                        >
                            <IconButton
                                onClick={handleToggleFavorite}
                                color="primary"
                                sx={{
                                    position: 'absolute',
                                    top: 16,
                                    right: 16,
                                    zIndex: 2,
                                    backgroundColor: 'rgba(255, 255, 255, 0.7)',
                                    '&:hover': {
                                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                    },
                                }}
                            >
                                {isFavorite ? <FavoriteIcon sx={{ color: "#e91e63" }} /> : <FavoriteBorderIcon />}
                            </IconButton>
                            <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 2 }}>
                                {propiedad?.nombre || 'Cargando...'}
                            </Typography>

                            <Typography variant="h5" color="primary" sx={{ fontWeight: 600, mb: 3 }}>
                                {propiedad?.precio_por_noche ? `${propiedad.precio_por_noche} € por noche` : 'Precio no disponible'}
                            </Typography>
                            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                                {propiedad ? `${propiedad.direccion}, ${propiedad.ciudad}, ${propiedad.pais}` : 'Dirección no disponible'}
                            </Typography>
                            {loadingMedia ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                                    <Typography variant='body1' color='text.secondary'>Cargando valoraciones...</Typography>
                                </Box>
                            ) : errorMedia ? (
                                <Typography variant='body1' color='text.secondary' sx={{ my: 2 }}>{errorMedia}</Typography>
                            ) : (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                                    <Rating
                                        name="read-only"
                                        value={mediaValoraciones?.media || 0}
                                        readOnly
                                        precision={0.25}
                                        size="large"
                                    />
                                    <Typography variant='body1' color='text.secondary'>
                                        {mediaValoraciones?.reseñas ? `${mediaValoraciones.media.toFixed(2)} (${mediaValoraciones.reseñas} valoraciones)` : '0 valoraciones'}
                                    </Typography>
                                </Box>
                            )}

                            {esAnfitrion && isAuthenticated() ? (
                                <Button
                                    variant='contained'
                                    color='primary'
                                    size="large"
                                    startIcon={<AddIcon />}
                                    sx={{
                                        mt: 2,
                                        py: 1.5,
                                        fontWeight: 600,
                                        borderRadius: 2,
                                        boxShadow: 3,
                                    }}
                                    onClick={() => setOpenManageDates(true)}
                                >
                                    Gestionar Fechas Disponibles
                                </Button>
                            ) : isAuthenticated() ? (
                                <Button
                                    variant='contained'
                                    color='primary'
                                    size="large"
                                    sx={{
                                        mt: 2,
                                        py: 1.5,
                                        fontWeight: 600,
                                        borderRadius: 2,
                                        boxShadow: 3,
                                    }}
                                    onClick={handleOpenReserveDatePicker}
                                >
                                    Reservar Ahora
                                </Button>
                            ) : (
                                <Button
                                    variant='contained'
                                    color='primary'
                                    size="large"
                                    sx={{
                                        mt: 2,
                                        py: 1.5,
                                        fontWeight: 600,
                                        borderRadius: 2,
                                        boxShadow: 3,
                                    }}
                                    onClick={() => {
                                        const redirectUrl = `/inicio-de-sesion?redirect=/detalles/${propiedadId}`;
                                        window.location.href = redirectUrl;
                                    }}
                                >
                                    Inicie sesión para reservar
                                </Button>
                            )}
                        </Paper>

                    </Box>
                </Box>



                <Paper
                    elevation={2}
                    sx={{
                        p: 4,
                        borderRadius: 3,
                        mb: 4,
                        transition: 'transform 0.2s',
                        '&:hover': {
                            transform: 'translateY(-5px)',
                        },
                    }}
                >
                    <Typography variant="h5" sx={{ mb: 3, fontWeight: 600, color: 'primary.main' }}>
                        Descripción
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 4, lineHeight: 1.8 }}>
                        {propiedad?.descripcion || 'Descripción no disponible'}
                    </Typography>

                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                        <Box sx={{ minWidth: '160px', flex: '1 1 auto', mb: 2 }}>
                            <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 600, mb: 1 }}>
                                Información General
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                <strong>Código Postal:</strong> {propiedad?.codigo_postal}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                <strong>Tipo:</strong> {propiedad?.tipo_de_propiedad}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                <strong>Tamaño:</strong> {propiedad?.tamano} m²
                            </Typography>
                        </Box>

                        <Box sx={{ minWidth: '160px', flex: '1 1 auto', mb: 2 }}>
                            <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 600, mb: 1 }}>
                                Capacidad
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                <strong>Máx. Huéspedes:</strong> {propiedad?.maximo_huespedes}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                <strong>Habitaciones:</strong> {propiedad?.numero_de_habitaciones}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                <strong>Camas:</strong> {propiedad?.numero_de_camas}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                <strong>Baños:</strong> {propiedad?.numero_de_banos}
                            </Typography>
                        </Box>

                        <Box sx={{ minWidth: '160px', flex: '1 1 auto', mb: 2 }}>
                            <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 600, mb: 1 }}>
                                Comodidades
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                <strong>Wifi:</strong> {propiedad?.wifi ? '✓' : '✗'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                <strong>Aire Acond.:</strong> {propiedad?.aire_acondicionado ? '✓' : '✗'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                <strong>Calefacción:</strong> {propiedad?.calefaccion ? '✓' : '✗'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                <strong>Parking:</strong> {propiedad?.parking ? '✓' : '✗'}
                            </Typography>
                        </Box>

                        <Box sx={{ minWidth: '160px', flex: '1 1 auto', mb: 2 }}>
                            <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 600, mb: 1 }}>
                                Normas
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                <strong>Mascotas:</strong> {propiedad?.mascotas ? 'Permitidas' : 'No permitidas'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                <strong>Fumar:</strong> {propiedad?.permitido_fumar ? 'Permitido' : 'No permitido'}
                            </Typography>
                        </Box>
                    </Box>

                    <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 600, mt: 3, mb: 1 }}>
                        Política de Cancelación
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {propiedad?.politica_de_cancelacion || 'No especificada'}
                    </Typography>
                </Paper>

                {
                    (isAuthenticated() && esAnfitrion) ? null : (isAuthenticated() && (
                        <Paper
                            elevation={2}
                            sx={{
                                p: 4,
                                borderRadius: 3,
                                mb: 4,
                                transition: 'transform 0.2s',
                                '&:hover': {
                                    transform: 'translateY(-5px)',
                                },
                            }}
                        >
                            <Typography variant="h5" sx={{ mb: 3, fontWeight: 600, color: 'primary.main' }}>
                                Tu Valoración
                            </Typography>
                            {alertMessage && (
                                <Alert severity='error' sx={{ mb: 3, borderRadius: 2 }}>
                                    {alertMessage}
                                </Alert>
                            )}
                            {hasRated ? (
                                isEditing ? (
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Typography variant="body1" sx={{ mr: 2 }}>Tu puntuación:</Typography>
                                            <Rating
                                                name="rating"
                                                value={rating}
                                                onChange={handleRatingChange}
                                                precision={0.5}
                                                size="large"
                                            />
                                        </Box>
                                        <TextField
                                            label="Tu comentario"
                                            value={comentario_valoracion}
                                            onChange={(e) => setComentarioValoracion(e.target.value)}
                                            multiline
                                            rows={4}
                                            fullWidth
                                            variant="outlined"
                                            sx={{ mt: 1, mb: 2 }}
                                        />
                                        <Box sx={{ display: 'flex', gap: 2 }}>
                                            <Button
                                                variant="contained"
                                                color="primary"
                                                onClick={() => handleUpdateRating(propiedad.id)}
                                                sx={{
                                                    py: 1,
                                                    px: 3,
                                                    fontWeight: 600,
                                                    borderRadius: 2,
                                                }}
                                            >
                                                Actualizar Valoración
                                            </Button>
                                            <Button
                                                variant="outlined"
                                                color="secondary"
                                                onClick={() => setIsEditing(false)}
                                                sx={{
                                                    py: 1,
                                                    px: 3,
                                                    fontWeight: 600,
                                                    borderRadius: 2,
                                                }}
                                            >
                                                Cancelar
                                            </Button>
                                        </Box>
                                    </Box>
                                ) : (
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                            <Typography variant="body1" sx={{ mr: 2 }}>Tu puntuación:</Typography>
                                            <Rating
                                                name="read-only"
                                                value={userRating.valoracion}
                                                readOnly
                                                precision={0.5}
                                                size="large"
                                            />
                                        </Box>
                                        <Paper
                                            elevation={0}
                                            sx={{
                                                p: 3,
                                                mb: 3,
                                                borderRadius: 2,
                                                bgcolor: 'rgba(0, 0, 0, 0.02)',
                                                border: '1px solid rgba(0, 0, 0, 0.08)'
                                            }}
                                        >
                                            <Typography variant="body1" color="text.secondary">
                                                {userRating.comentario}
                                            </Typography>
                                        </Paper>
                                        <Box sx={{ display: 'flex', gap: 2 }}>
                                            <Button
                                                variant="contained"
                                                color="primary"
                                                onClick={handleEditRating}
                                                sx={{
                                                    alignSelf: 'flex-start',
                                                    py: 1,
                                                    px: 3,
                                                    fontWeight: 600,
                                                    borderRadius: 2,
                                                }}
                                            >
                                                Editar Valoración
                                            </Button>
                                            <Button variant="contained" color="error" onClick={() => handleDeleteRating(userRating.id)} sx={{ py: 1, px: 3, fontWeight: 600, borderRadius: 2 }}>
                                                Eliminar Valoración
                                            </Button>

                                        </Box>

                                    </Box>

                                )
                            ) : (isAuthenticated() && !esAnfitrion && (
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                        <Typography variant="body1" sx={{ mr: 2 }}>Tu puntuación:</Typography>
                                        <Rating
                                            name="rating"
                                            value={rating}
                                            onChange={handleRatingChange}
                                            precision={0.5}
                                            size="large"
                                        />
                                    </Box>
                                    <TextField
                                        label="Tu comentario sobre la propiedad"
                                        value={comentario_valoracion}
                                        onChange={(e) => setComentarioValoracion(e.target.value)}
                                        multiline
                                        rows={4}
                                        fullWidth
                                        variant="outlined"
                                        placeholder="Comparte tu experiencia con otros huéspedes"
                                        sx={{ mb: 2 }}
                                    />
                                    <Button
                                        variant="contained"
                                        disabled={loadingRating}
                                        color="primary"
                                        onClick={() => handleSubmitRating(propiedad.id)}
                                        sx={{
                                            alignSelf: 'flex-start',
                                            py: 1,
                                            px: 3,
                                            fontWeight: 600,
                                            borderRadius: 2,
                                        }}
                                    >
                                        Enviar Valoración
                                    </Button>
                                </Box>
                            ))}
                            {notification && (
                                <Alert
                                    severity={notification.type}
                                    sx={{
                                        mt: 3,
                                        borderRadius: 2,
                                        boxShadow: '0 2px 10px rgba(0,0,0,0.08)'
                                    }}
                                    onClose={() => setNotification(null)}
                                >
                                    {notification.message}
                                </Alert>
                            )}

                        </Paper>
                    ))
                }

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <PropertyValorations propiedadId={propiedadId} />
                </Box>

                <Modal
                    open={open}
                    onClose={handleClose}
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <Box
                        sx={{
                            position: 'relative',
                            width: '85vw',
                            height: '85vh',
                            bgcolor: "background.paper",
                            p: 0,
                            borderRadius: 3,
                            overflow: 'hidden',
                            boxShadow: 24
                        }}
                    >
                        <IconButton
                            onClick={handleClose}
                            sx={{
                                position: 'absolute',
                                top: 16,
                                right: 16,
                                bgcolor: 'rgba(255, 255, 255, 0.7)',
                                zIndex: 2,
                                '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.9)' }
                            }}
                        >
                            <CloseIcon />
                        </IconButton>
                        <IconButton
                            onClick={handlePrev}
                            sx={{
                                position: 'absolute',
                                top: '50%',
                                left: 16,
                                transform: 'translateY(-50%)',
                                bgcolor: 'rgba(255, 255, 255, 0.7)',
                                zIndex: 2,
                                '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.9)' }
                            }}
                        >
                            <ArrowBackIosNewIcon />
                        </IconButton>
                        <IconButton
                            onClick={handleNext}
                            sx={{
                                position: 'absolute',
                                top: '50%',
                                right: 16,
                                transform: 'translateY(-50%)',
                                bgcolor: 'rgba(255, 255, 255, 0.7)',
                                zIndex: 2,
                                '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.9)' }
                            }}
                        >
                            <ArrowForwardIosIcon />
                        </IconButton>
                        {fotos[selectedFotoIndex] && (
                            <Box
                                component="img"
                                src={fotos[selectedFotoIndex].foto}
                                alt={fotos[selectedFotoIndex].descripcion || 'Imagen de propiedad'}
                                sx={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'contain',
                                    bgcolor: '#000'
                                }}
                            />
                        )}
                    </Box>
                </Modal>

                <Modal
                    open={openManageDates}
                    onClose={() => setOpenManageDates(false)}
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    <Paper
                        sx={{
                            position: 'relative',
                            width: '100%',
                            maxWidth: '500px',
                            p: 4,
                            borderRadius: 3,
                            boxShadow: 24
                        }}
                    >
                        <IconButton
                            onClick={() => setOpenManageDates(false)}
                            sx={{
                                position: 'absolute',
                                top: 8,
                                right: 8
                            }}
                        >
                            <CloseIcon />
                        </IconButton>
                        <Typography variant="h5" sx={{ mb: 4, fontWeight: 600, textAlign: 'center' }}>
                            Gestionar Fechas Disponibles
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                            <Button
                                variant="contained"
                                color="primary"
                                size="large"
                                onClick={() => handleOpenDatePicker()}
                                sx={{
                                    py: 1.5,
                                    fontWeight: 600,
                                    borderRadius: 2,
                                }}
                            >
                                Bloquear Fecha
                            </Button>
                            <Button
                                variant="contained"
                                color="error"
                                size="large"
                                onClick={handleOpenUnblockDatePicker}
                                sx={{
                                    py: 1.5,
                                    fontWeight: 600,
                                    borderRadius: 2,
                                }}
                            >
                                Desbloquear Fecha
                            </Button>
                        </Box>
                    </Paper>
                </Modal>

                <Modal
                    open={openDatePicker}
                    onClose={handleCloseDatePicker}
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    <Paper
                        sx={{
                            position: 'relative',
                            width: '100%',
                            maxWidth: '600px',
                            p: 4,
                            borderRadius: 3,
                            boxShadow: 24
                        }}
                    >
                        <IconButton
                            onClick={handleCloseDatePicker}
                            sx={{
                                position: 'absolute',
                                top: 8,
                                right: 8
                            }}
                        >
                            <CloseIcon />
                        </IconButton>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <Typography variant="h5" sx={{ mb: 3, fontWeight: 600, textAlign: 'center' }}>
                                Seleccionar fechas para bloquear
                            </Typography>
                            <Box sx={{ mb: 3 }}>
                                <DayPickerSingleDateController
                                    date={null}
                                    onDateChange={handleBlockDateChange}
                                    focused={true}
                                    onFocusChange={handleFocusChange}
                                    isDayHighlighted={(date) => selectedBlockDates.includes(date.format('YYYY-MM-DD'))}
                                    isOutsideRange={(date) => date.isBefore(moment()) || allBlockedDates.some((blockedDate) => moment(blockedDate).isSame(date, 'day'))}
                                    hideKeyboardShortcutsPanel
                                    numberOfMonths={1}
                                />
                            </Box>
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={handleConfirmBlockDate}
                                sx={{
                                    py: 1.5,
                                    px: 4,
                                    fontWeight: 600,
                                    borderRadius: 2,
                                }}
                            >
                                Confirmar
                            </Button>
                        </Box>
                    </Paper>
                </Modal>

                <Modal
                    open={openUnblockDatePicker}
                    onClose={handleCloseUnblockDatePicker}
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '100vw',
                    }}
                >
                    <Paper
                        sx={{
                            position: 'relative',
                            width: '100%',
                            maxWidth: '600px',
                            p: 4,
                            borderRadius: 3,
                            boxShadow: 24
                        }}
                    >
                        <IconButton
                            onClick={handleCloseUnblockDatePicker}
                            sx={{
                                position: 'absolute',
                                top: 8,
                                right: 8
                            }}
                        >
                            <CloseIcon />
                        </IconButton>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <Typography variant="h5" sx={{ mb: 3, fontWeight: 600, textAlign: 'center' }}>
                                Seleccionar fechas para desbloquear
                            </Typography>
                            <Box sx={{ mb: 3 }}>
                                <DayPickerSingleDateController
                                    date={null}
                                    onDateChange={handleUnblockDateChange}
                                    focused={true}
                                    onFocusChange={handleFocusChange}
                                    isDayHighlighted={(date) => selectedUnblockDates.includes(date.format('YYYY-MM-DD'))}
                                    isOutsideRange={(date) => date.isBefore(moment()) || !blockedDates.some((blockedDate) => moment(blockedDate.fecha).isSame(date, 'day'))}
                                    hideKeyboardShortcutsPanel
                                    numberOfMonths={1}
                                />
                            </Box>
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={handleConfirmUnblockDate}
                                sx={{
                                    py: 1.5,
                                    px: 4,
                                    fontWeight: 600,
                                    borderRadius: 2,
                                }}
                            >
                                Confirmar
                            </Button>
                        </Box>
                    </Paper>
                </Modal>
                <Modal
                    open={openReserveDatePicker}
                    onClose={handleCloseReserveDatePicker}
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '100vw',
                        bgcolor: "white"
                    }}
                >
                    <Paper
                        elevation={3}
                        sx={{
                            position: 'relative',
                            width: '80vw',
                            maxWidth: '850px',
                            bgcolor: "background.paper",
                            maxHeight: '90vh',
                            p: 4,
                            pt: 5,
                            pb: 5,
                            borderRadius: 2,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            boxShadow: 24,
                            overflow: 'auto'

                        }}
                    >
                        <Box sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            height: '6px',
                            bgcolor: 'white',
                            width: '100%',
                        }} />

                        <IconButton
                            onClick={handleCloseReserveDatePicker}
                            sx={{
                                position: 'absolute',
                                top: 8,
                                right: 8,
                                color: 'text.secondary',
                                '&:hover': {
                                    bgcolor: 'rgba(0, 0, 0, 0.04)',
                                    color: 'primary.main'
                                }
                            }}
                        >
                            <CloseIcon />
                        </IconButton>

                        <Typography
                            variant="h5"
                            sx={{
                                mb: 4,
                                fontWeight: 600,
                                textAlign: 'center',
                                color: 'text.primary'
                            }}
                        >
                            Reservar Alojamiento
                        </Typography>

                        <Box sx={{
                            zIndex: 1300,
                            width: '100%',
                            mb: 3
                        }}>
                            <Typography
                                variant="subtitle1"
                                sx={{
                                    mb: 1,
                                    fontWeight: 500,
                                    color: 'text.secondary'
                                }}
                            >
                                Seleccione fechas de estancia:
                            </Typography>
                            <DateRangePicker
                                startDate={reserveStartDate}
                                startDateId="start_date_id"
                                endDate={reserveEndDate}
                                startDatePlaceholderText='Entrada'
                                endDatePlaceholderText='Salida'
                                endDateId="end_date_id"
                                onDatesChange={handleReserveDateChange}
                                focusedInput={focusedInput}
                                onFocusChange={(focusedInput) => setFocusedInput(focusedInput)}
                                minimumNights={1}
                                isOutsideRange={(date) => date.isBefore(moment()) || allBlockedDates.some((blockedDate) => moment(blockedDate).isSame(date, 'day'))}
                                hideKeyboardShortcutsPanel
                                required
                                customArrowIcon={<span style={{ padding: '0 8px' }}>→</span>}
                                displayFormat="DD/MM/YYYY"
                                small
                            />
                        </Box>

                        <Box sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            width: '100%',
                            mb: 3,
                            p: 2,
                            bgcolor: 'rgba(0, 0, 0, 0.02)',
                            borderRadius: 1
                        }}>
                            <Typography variant="body1">Número de huéspedes:</Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <IconButton
                                    onClick={handleDecrement}
                                    size="small"
                                    sx={{
                                        bgcolor: 'rgba(0, 0, 0, 0.04)',
                                        color: 'text.secondary',
                                        '&:hover': {
                                            bgcolor: 'primary.light',
                                            color: 'primary.contrastText'
                                        }
                                    }}
                                >
                                    <RemoveIcon fontSize="small" />
                                </IconButton>
                                <Typography variant="body1" sx={{ mx: 2, fontWeight: 500 }}>{numPersonas}</Typography>
                                <IconButton
                                    onClick={handleIncrement}
                                    size="small"
                                    sx={{
                                        bgcolor: 'rgba(0, 0, 0, 0.04)',
                                        color: 'text.secondary',
                                        '&:hover': {
                                            bgcolor: 'primary.light',
                                            color: 'primary.contrastText'
                                        }
                                    }}
                                >
                                    <AddIcon fontSize="small" />
                                </IconButton>
                            </Box>
                        </Box>

                        <FormControl sx={{ mt: 1, mb: 3, width: '100%' }}>
                            <InputLabel id="metodo-pago-label">Método de Pago</InputLabel>
                            <Select
                                id="metodo-pago"
                                labelId="metodo-pago-label"
                                value={metodoPago}
                                onChange={(e) => setMetodoPago(e.target.value)}
                                label="Método de Pago"
                                sx={{ '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(0, 0, 0, 0.23)' } }}
                            >
                                <MenuItem value="Tarjeta de crédito">Tarjeta de Crédito</MenuItem>
                                <MenuItem value="PayPal">PayPal</MenuItem>
                            </Select>
                        </FormControl>

                        <Box sx={{ width: '100%', mb: 3 }}>
                            <Typography
                                variant="subtitle1"
                                sx={{
                                    mb: 1,
                                    fontWeight: 500,
                                    color: 'text.secondary'
                                }}
                            >
                                Comentarios sobre la reserva:
                            </Typography>
                            <TextField
                                value={comentarios_usuario}
                                onChange={(e) => setComentariosUsuario(e.target.value)}
                                multiline
                                rows={3}
                                placeholder="Información adicional para el anfitrión..."
                                sx={{
                                    width: '100%',
                                    '& .MuiOutlinedInput-root': {
                                        '& fieldset': {
                                            borderColor: 'rgba(0, 0, 0, 0.23)',
                                        },
                                        '&:hover fieldset': {
                                            borderColor: 'primary.main',
                                        },
                                    }
                                }}
                            />
                        </Box>

                        {reserveStartDate && reserveEndDate && (
                            <Paper
                                elevation={0}
                                sx={{
                                    width: '100%',
                                    mb: 3,
                                    p: 2,
                                    bgcolor: 'rgba(0, 0, 0, 0.02)',
                                    borderRadius: 1,
                                    border: '1px solid rgba(0, 0, 0, 0.08)'
                                }}
                            >
                                <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600, color: 'text.primary' }}>
                                    Detalles del precio
                                </Typography>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        {propiedad?.precio_por_noche} € x {moment(reserveEndDate).diff(moment(reserveStartDate), 'days')} noches
                                    </Typography>
                                    <Typography variant="body2" fontWeight={500}>
                                        {(propiedad?.precio_por_noche * moment(reserveEndDate).diff(moment(reserveStartDate), 'days')).toFixed(2)} €
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        Comisión de servicio (10%)
                                    </Typography>
                                    <Typography variant="body2" fontWeight={500}>
                                        {(propiedad?.precio_por_noche * moment(reserveEndDate).diff(moment(reserveStartDate), 'days') * 0.10).toFixed(2)} €
                                    </Typography>
                                </Box>
                                <Box sx={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    mt: 2,
                                    pt: 2,
                                    borderTop: '1px solid rgba(0, 0, 0, 0.1)'
                                }}>
                                    <Typography variant="subtitle2" fontWeight={700}>
                                        Precio Total
                                    </Typography>
                                    <Typography variant="subtitle2" fontWeight={700}>
                                        {(propiedad?.precio_por_noche * moment(reserveEndDate).diff(moment(reserveStartDate), 'days') * 1.10).toFixed(2)} €
                                    </Typography>
                                </Box>
                            </Paper>
                        )}

                        <Box sx={{
                            display: 'flex',
                            flexDirection: 'row',
                            gap: 2,
                            width: '100%',
                            justifyContent: 'space-between'
                        }}>
                            <Button
                                variant="outlined"
                                color="inherit"
                                onClick={handleCloseReserveDatePicker}
                                disabled={loading}
                                sx={{
                                    flex: 1,
                                    py: 1.2,
                                    color: 'text.secondary',
                                    borderColor: 'rgba(0, 0, 0, 0.23)',
                                    '&:hover': {
                                        borderColor: 'rgba(0, 0, 0, 0.5)',
                                        bgcolor: 'rgba(0, 0, 0, 0.02)'
                                    }
                                }}
                            >
                                Cancelar
                            </Button>
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={handleConfirmReserve}
                                disabled={loading}
                                sx={{
                                    flex: 2,
                                    py: 1.2,
                                    fontWeight: 600,
                                    boxShadow: 2,
                                    '&:hover': {
                                        boxShadow: 4
                                    }
                                }}
                            >
                                {loading ? 'Procesando...' : 'Confirmar reserva'}
                            </Button>
                        </Box>
                    </Paper>
                </Modal>
            </Container >
        </Box >
    );
};


export default PropertyDetails;

