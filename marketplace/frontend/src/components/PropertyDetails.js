import { Box, Typography, Container, Paper, Modal, Divider, ListItem, List, ListItemIcon, ListItemText, InputAdornment, IconButton, DialogActions, Button, DialogTitle, DialogContent, TextField, FormControl, InputLabel, MenuItem, Select, Rating, Dialog, CircularProgress, Tooltip } from '@mui/material';
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
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import ArrowRightAltIcon from '@mui/icons-material/ArrowRightAlt';
import EuroIcon from '@mui/icons-material/Euro';
import SaveIcon from '@mui/icons-material/Save';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';






const PropertyDetails = () => {
    const usuarioId = JSON.parse(localStorage.getItem('additionalInfo'))?.usuarioId;
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
    const [specialPriceStartDate, setSpecialPriceStartDate] = useState(null);
    const [specialPriceEndDate, setSpecialPriceEndDate] = useState(null);
    const [specialPricesList, setSpecialPricesList] = useState([]);
    const [specialPrice, setSpecialPrice] = useState('');
    const [openAddSpecialPrice, setOpenAddSpecialPrice] = useState(false);
    const [openMenuSpecialPrice, setOpenMenuSpecialPrice] = useState(false);
    const [openDeleteSpecialPrice, setOpenDeleteSpecialPrice] = useState(false);
    const [datesBetween, setDatesBetween] = useState([]);
    const [openPrincipalMenu, setOpenPrincipalMenu] = useState(false);


    useEffect(() => {
        if (isAuthenticated()) {

            fetchBlockedDates();
            fetchReservas();
            refreshAccessToken();
            checkIfFavorite();
            fetchSpecialPrices();
        }
        fetchPropertyDetails();
        fetchPropertyPhotos(propiedadId);
        checkUserRating();
        fetchMediaValoraciones();


    }, [propiedadId, openManageDates, openDatePicker, openUnblockDatePicker, openReserveDatePicker, openAddSpecialPrice, openMenuSpecialPrice, openDeleteSpecialPrice]);

    useEffect(() => {
        if (clienteId)
            fetchCliente(clienteId);
    }, [clienteId]);

    const isSpecialPriceDate = (date) => {
        return specialPricesList.some(
            (price) =>
                moment(date).isBetween(price.fecha_inicio, price.fecha_fin, null, '[]')
        );
    };

    const fetchSpecialPrices = async () => {
        try {
            const response = await fetch(`http://localhost:8000/api/propiedades/precios-especiales-por-propiedad/${propiedadId}/`);
            if (response.ok) {
                const data = await response.json();
                const filteredData = data.filter((precio) => precio.fecha_fin >= moment().format('YYYY-MM-DD'));
                setSpecialPricesList(filteredData);
            } else {
                console.error("Error fetching special prices:", response.statusText);
            }
        } catch (error) {
            console.error("Error fetching special prices:", error);
        }
    };



    const validateFields = () => {
        if (rating === 0 || comentario_valoracion.trim() === "") {
            setAlertMessage("Por favor, complete todos los campos");
            return false;
        }
        setAlertMessage("");
        return true;
    };

    const handleDeleteSpecialPrice = async (specialPriceId) => {
        try {
            const response = await fetch(`http://localhost:8000/api/propiedades/precios-especiales/${specialPriceId}/`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                },
            });
            if (response.ok) {
                alert("Precio especial eliminado correctamente");
                fetchSpecialPrices();
            } else {
                console.error("Error deleting special price:", response.statusText);
            }
        } catch (error) {
            console.error("Error deleting special price:", error);
        }
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

    const handleSpecialPriceDateChange = ({ startDate, endDate }) => {
        setSpecialPriceStartDate(startDate);
        setSpecialPriceEndDate(endDate);
    };

    const handleCloseMenuSpecialPrice = () => {
        setOpenMenuSpecialPrice(false);
        setOpenDeleteSpecialPrice(false);
    };

    const handleCloseDeleteSpecialPrice = () => {
        setOpenDeleteSpecialPrice(false);
        setSpecialPriceStartDate(null);
        setSpecialPriceEndDate(null);
        setSpecialPrice(null);
    };

    const validateSpecialPriceDates = (startData, endDate) => {
        if (!startData || !endDate) {
            alert("Por favor, seleccione ambas fechas");
            return false;
        }
        if (specialPrice <= 0) {
            alert("El precio especial debe ser mayor a 0");
            return false;
        }
        if (specialPrice > 5000) {
            alert("El precio especial no puede ser mayor a 5000");
            return false;
        }

        const start = moment(startData);
        const end = moment(endDate);
        const datesBetween = [];
        let currentDate = start.clone();


        while (currentDate.isBefore(end) || currentDate.isSame(end, 'day')) {
            datesBetween.push(currentDate.format('YYYY-MM-DD'));
            currentDate.add(1, 'day');
        }

        const hasUnavailableDates = datesBetween.some((date) => allBlockedDatesWithSpecialPrices.includes(date));
        if (hasUnavailableDates) {
            alert('Las fechas seleccionadas no están disponibles porque tienen que ser días seguidos');
            return false;
        }
        return true;
    };


    const handleSpecialPriceChange = async (priceValue) => {
        try {
            if (!specialPriceStartDate || !specialPriceEndDate || !priceValue) {
                alert("Por favor, complete todas las fechas y el precio especial");
                return;
            }

            if (!validateSpecialPriceDates(specialPriceStartDate, specialPriceEndDate)) {
                return;
            }

            const response = await fetch(`http://localhost:8000/api/propiedades/precios-especiales/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                },
                body: JSON.stringify({
                    propiedad: propiedadId,
                    fecha_inicio: moment(specialPriceStartDate).format('YYYY-MM-DD'),
                    fecha_fin: moment(specialPriceEndDate).format('YYYY-MM-DD'),
                    precio_especial: parseFloat(priceValue),
                }),
            });
            if (response.ok) {
                alert("Precio especial creado correctamente");
                fetchSpecialPrices();
                handleCloseAddSpecialPrice();

            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleCloseAddSpecialPrice = () => {
        setOpenAddSpecialPrice(false);
        setSpecialPriceStartDate(null);
        setSpecialPriceEndDate(null);
        setSpecialPrice(null);
    };

    const checkIfFavorite = async () => {
        try {
            const response = await fetch(`http://localhost:8000/api/propiedades/favoritos-por-usuario/${usuarioId}`, {
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
            const response = await fetch(`http://localhost:8000/api/propiedades/valoraciones-por-propiedad/${propiedadId}`);
            if (response.ok) {
                const data = await response.json();
                const dataFiltered = data.filter((valoracion) => valoracion.usuario === JSON.parse(localStorage.getItem('additionalInfo')).usuarioId);
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
        if (startDate && endDate) {
            const start = moment(startDate);
            const end = moment(endDate).subtract(1, 'day');
            const dates = [];
            let currentDate = start.clone();
            while (currentDate.isBefore(end) || currentDate.isSame(end, 'day')) {
                dates.push(currentDate.format('YYYY-MM-DD'));
                currentDate.add(1, 'day');
            }

            setDatesBetween(dates);
        } else {
            setDatesBetween([]);
        }
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
            const response = await fetch(`http://localhost:8000/api/propiedades/fechas-bloqueadas-por-propiedad/${propiedadId}`, {
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
                setBlockedDates(data);
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
            const response = await fetch(`http://localhost:8000/api/propiedades/reservas-por-propiedad/${propiedadId}`, {
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
                setReservas(data);
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

    const calculateBlockedDatesWithGaps = (blockedDates) => {
        const sortedDates = blockedDates.sort((a, b) => moment(a).diff(moment(b)));
        const filledDates = new Set(blockedDates);

        for (let i = 0; i < sortedDates.length - 1; i++) {
            const current = moment(sortedDates[i]);
            const next = moment(sortedDates[i + 1]);

            if (next.diff(current, 'days') === 2) {
                const gapDate = current.clone().add(1, 'day').format('YYYY-MM-DD');
                filledDates.add(gapDate);
            }
        }

        return Array.from(filledDates);

    };

    const allBlockedDates = calculateBlockedDatesWithGaps([
        ...blockedDates?.map((fecha) => fecha.fecha),
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
    ]);
    const allBlockedDatesWithSpecialPrices = calculateBlockedDatesWithGaps([
        ...allBlockedDates,
        ...(Array.isArray(specialPricesList) ? specialPricesList.flatMap((precio) => {
            const startDate = moment(precio.fecha_inicio);
            const endDate = moment(precio.fecha_fin);
            const dates = [];
            while (startDate.isBefore(endDate) || startDate.isSame(endDate, 'day')) {
                dates.push(startDate.format('YYYY-MM-DD'));
                startDate.add(1, 'day');
            }
            return dates;
        }) : [])
    ]);


    const handleConfirmReserve = async (retried = false) => {
        if (!reserveStartDate || !reserveEndDate) {
            alert('Por favor, seleccione las fechas de reserva');
            return;
        }

        setLoading(true);

        const startDate = moment(reserveStartDate);
        const endDate = moment(reserveEndDate);
        const endDateAdjusted = endDate.subtract(1, 'day');
        const datesBetween = [];
        let currentDate = startDate.clone();
        while (currentDate.isBefore(endDateAdjusted) || currentDate.isSame(endDateAdjusted, 'day')) {
            datesBetween.push(currentDate.format('YYYY-MM-DD'));
            currentDate.add(1, 'day');
        }

        const hasBlockedDates = datesBetween.some((date) => allBlockedDates.includes(date));

        if (hasBlockedDates) {
            alert('Las fechas seleccionadas no están disponibles porque tienen que ser días seguidos');
            setLoading(false);
            return;
        }

        const subtotal = datesBetween.reduce((total, date) => {
            const specialPrice = specialPricesList.find(
                (price) => moment(date).isBetween(price.fecha_inicio, price.fecha_fin, null, '[]')
            );
            return total + (specialPrice ? parseFloat(specialPrice.precio_especial) : parseFloat(propiedad.precio_por_noche));
        }, 0);

        const comision = subtotal * 0.1;

        const precioTotal = subtotal + comision;

        const formattedStartDate = moment(reserveStartDate).format('YYYY-MM-DD');
        const formattedEndDate = moment(reserveEndDate).format('YYYY-MM-DD');

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
            tiene_precio_especial: specialPricesList.some(price =>
                moment(reserveStartDate).isBetween(price.fecha_inicio, price.fecha_fin, null, '[]') ||
                moment(reserveEndDate).isBetween(price.fecha_inicio, price.fecha_fin, null, '[]')
            )
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
                    localStorage.setItem(`reservation_${data.orderID}`, JSON.stringify(reservationData));
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
                            <Typography variant="h5" component="h1" sx={{ fontWeight: 700, mb: 2 }}>
                                {propiedad?.nombre || 'Cargando...'}
                            </Typography>

                            <Typography variant="h6" color="primary" sx={{ fontWeight: 600, mb: 3 }}>
                                {propiedad ? `${propiedad.precio_por_noche} € por noche` : 'Cargando...'}
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
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Rating
                                        name="read-only"
                                        value={mediaValoraciones?.media || 0}
                                        readOnly
                                        precision={0.25}
                                        size="medium"
                                    />
                                    <Typography variant='body1' color='text.secondary'>
                                        {mediaValoraciones?.reseñas ? `${mediaValoraciones.media.toFixed(2)} (${mediaValoraciones.reseñas} valoraciones)` : '0 valoraciones'}
                                    </Typography>
                                </Box>
                            )}

                            {esAnfitrion && isAuthenticated() ? (
                                <Box
                                    display="flex"
                                    flexDirection="column"
                                    width="100%"
                                    maxWidth="450px"
                                    mx="auto"
                                    mt={2}
                                >

                                    <Button
                                        variant="contained"
                                        color="primary"
                                        size="medium"
                                        fullWidth
                                        startIcon={<AddIcon />}
                                        sx={{
                                            py: 1,
                                            fontWeight: 600,
                                            borderRadius: 2,
                                            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.12)",
                                            textTransform: "none",
                                            fontSize: "0.95rem",
                                            mb: 2
                                        }}
                                        onClick={() => setOpenPrincipalMenu(true)}
                                    >
                                        Gestionar Propiedad
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        color="primary"
                                        size="medium"
                                        fullWidth
                                        startIcon={<AddIcon />}
                                        sx={{
                                            py: 1,
                                            fontWeight: 600,
                                            borderRadius: 2,
                                            borderWidth: 1.5,
                                            textTransform: "none",
                                            fontSize: "0.95rem",
                                            "&:hover": {
                                                borderWidth: 1.5
                                            }
                                        }}
                                        onClick={() => window.location.href = `/dashboard/${propiedadId}`}
                                    >
                                        Estadísticas de la Propiedad
                                    </Button>
                                </Box>

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

                <Dialog
                    open={openManageDates}
                    onClose={() => setOpenManageDates(false)}
                    maxWidth="sm"
                    fullWidth
                    PaperProps={{
                        elevation: 3,
                        sx: {
                            borderRadius: 1,
                            overflow: 'hidden'
                        }
                    }}
                >


                    <Paper square sx={{ position: 'relative' }}>
                        <DialogTitle sx={{
                            bgcolor: 'primary.main',
                            color: 'primary.contrastText',
                            py: 2,
                            pl: 3,
                            pr: 6
                        }}>
                            <Typography variant="h6" component="div" sx={{ fontWeight: 500 }}>
                                Gestionar Fechas Disponibles
                            </Typography>
                            <IconButton
                                aria-label="cerrar"
                                onClick={() => setOpenManageDates(false)}
                                sx={{
                                    position: 'absolute',
                                    right: 12,
                                    top: 12,
                                    color: 'primary.contrastText'
                                }}
                                size="small"
                            >
                                <CloseIcon fontSize="small" />
                            </IconButton>
                        </DialogTitle>
                    </Paper>

                    <DialogContent sx={{ px: 0, py: 2 }}>
                        <Typography variant="subtitle2" sx={{ px: 3, pb: 1, color: 'text.secondary' }}>
                            Seleccione una acción para continuar
                        </Typography>

                        <List disablePadding>
                            <ListItem
                                button
                                onClick={() => handleOpenDatePicker()}
                                sx={{
                                    py: 1.5,
                                    '&:hover': {
                                        bgcolor: 'primary.50'
                                    }
                                }}
                            >
                                <ListItemIcon sx={{ minWidth: 40, ml: 1 }}>
                                    <AddCircleOutlineIcon color="primary" />
                                </ListItemIcon>
                                <ListItemText
                                    primary="Bloquear Fecha"
                                    primaryTypographyProps={{
                                        fontSize: '0.9rem',
                                        fontWeight: 400
                                    }}
                                />
                            </ListItem>

                            <Divider component="li" />

                            <ListItem
                                button
                                onClick={handleOpenUnblockDatePicker}
                                sx={{
                                    py: 1.5,
                                    '&:hover': {
                                        bgcolor: 'error.50'
                                    }
                                }}
                            >
                                <ListItemIcon sx={{ minWidth: 40, ml: 1 }}>
                                    <DeleteOutlineIcon color="error" />
                                </ListItemIcon>
                                <ListItemText
                                    primary="Desbloquear Fecha"
                                    primaryTypographyProps={{
                                        fontSize: '0.9rem',
                                        fontWeight: 400
                                    }}
                                />
                            </ListItem>
                        </List>
                    </DialogContent>

                    <Divider />

                    <DialogActions sx={{ px: 3, py: 2, justifyContent: 'flex-end' }}>
                        <Button
                            onClick={() => setOpenManageDates(false)}
                            variant="contained"
                            color="primary"
                            disableElevation
                            sx={{
                                textTransform: 'none',
                                borderRadius: 1,
                                px: 3
                            }}
                        >
                            Cerrar
                        </Button>
                    </DialogActions>
                </Dialog>
                <Dialog
                    open={openPrincipalMenu}
                    onClose={() => setOpenPrincipalMenu(false)}
                    maxWidth="sm"
                    fullWidth
                    PaperProps={{
                        elevation: 3,
                        sx: {
                            borderRadius: 1,
                            overflow: 'hidden'
                        }
                    }}
                >


                    <Paper square sx={{ position: 'relative' }}>
                        <DialogTitle sx={{
                            bgcolor: 'primary.main',
                            color: 'primary.contrastText',
                            py: 2,
                            pl: 3,
                            pr: 6
                        }}>
                            <Typography variant="h6" component="div" sx={{ fontWeight: 500 }}>
                                Gestionar Propiedad
                            </Typography>
                            <IconButton
                                aria-label="cerrar"
                                onClick={() => setOpenPrincipalMenu(false)}
                                sx={{
                                    position: 'absolute',
                                    right: 12,
                                    top: 12,
                                    color: 'primary.contrastText'
                                }}
                                size="small"
                            >
                                <CloseIcon fontSize="small" />
                            </IconButton>
                        </DialogTitle>
                    </Paper>

                    <DialogContent sx={{ px: 0, py: 2 }}>
                        <Typography variant="subtitle2" sx={{ px: 3, pb: 1, color: 'text.secondary' }}>
                            Seleccione una acción para continuar
                        </Typography>

                        <List disablePadding>
                            <ListItem
                                button
                                onClick={() => setOpenManageDates(true)}
                                sx={{
                                    py: 1.5,
                                    '&:hover': {
                                        bgcolor: 'primary.50'
                                    }
                                }}
                            >
                                <ListItemIcon sx={{ minWidth: 40, ml: 1 }}>
                                    <AddCircleOutlineIcon color="primary" />
                                </ListItemIcon>
                                <ListItemText
                                    primary="Gestionar Fechas Disponibles"
                                    primaryTypographyProps={{
                                        fontSize: '0.9rem',
                                        fontWeight: 400
                                    }}
                                />
                            </ListItem>

                            <Divider component="li" />

                            <ListItem
                                button
                                onClick={() => setOpenMenuSpecialPrice(true)}
                                sx={{
                                    py: 1.5,
                                    '&:hover': {
                                        bgcolor: 'error.50'
                                    }
                                }}
                            >
                                <ListItemIcon sx={{ minWidth: 40, ml: 1 }}>
                                    <DeleteOutlineIcon color="error" />
                                </ListItemIcon>
                                <ListItemText
                                    primary="Gestionar Fechas Especiales"
                                    primaryTypographyProps={{
                                        fontSize: '0.9rem',
                                        fontWeight: 400
                                    }}
                                />
                            </ListItem>
                        </List>
                    </DialogContent>

                    <Divider />

                    <DialogActions sx={{ px: 3, py: 2, justifyContent: 'flex-end' }}>
                        <Button
                            onClick={() => setOpenPrincipalMenu(false)}
                            variant="contained"
                            color="primary"
                            disableElevation
                            sx={{
                                textTransform: 'none',
                                borderRadius: 1,
                                px: 3
                            }}
                        >
                            Cerrar
                        </Button>
                    </DialogActions>
                </Dialog>

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
                            aria-label="Cerrar"
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
                            Realizar Reserva
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
                                Seleccione las fechas de su estancia:
                            </Typography>
                            <DateRangePicker
                                startDate={reserveStartDate}
                                startDateId="start_date_id"
                                endDate={reserveEndDate}
                                startDatePlaceholderText='Fecha de entrada'
                                endDatePlaceholderText='Fecha de salida'
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
                                renderDayContents={(day) => {
                                    const isSpecial = isSpecialPriceDate(day);
                                    return (
                                        <div style={{
                                            position: 'relative',
                                            width: '100%',
                                            height: '100%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            backgroundColor: isSpecial ? 'rgba(156, 39, 176, 0.1)' : 'transparent',
                                            borderRadius: '50%',
                                            color: isSpecial ? '#9c27b0' : 'inherit',
                                            fontWeight: isSpecial ? 'bold' : 'normal'
                                        }}>
                                            {day.date()}
                                            {isSpecial && (
                                                <div style={{
                                                    position: 'absolute',
                                                    bottom: 2,
                                                    fontSize: 10,
                                                    color: '#9c27b0'
                                                }}>
                                                    €
                                                </div>
                                            )}
                                        </div>
                                    );
                                }}
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
                                    aria-label="Reducir número de huéspedes"
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
                                    aria-label="Aumentar número de huéspedes"
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
                                Información adicional:
                            </Typography>
                            <TextField
                                value={comentarios_usuario}
                                onChange={(e) => setComentariosUsuario(e.target.value)}
                                multiline
                                rows={3}
                                placeholder="Indique cualquier requerimiento especial o información relevante para su estancia..."
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
                                    p: 3,
                                    bgcolor: 'rgba(250, 250, 250, 0.95)',
                                    borderRadius: 2,
                                    border: '1px solid rgba(0, 0, 0, 0.09)',
                                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
                                }}
                            >
                                <Typography
                                    variant="h6"
                                    sx={{
                                        mb: 2.5,
                                        fontWeight: 600,
                                        color: 'text.primary',
                                        position: 'relative',
                                        pb: 1.5,
                                        '&:after': {
                                            content: '""',
                                            position: 'absolute',
                                            bottom: 0,
                                            left: 0,
                                            width: '40px',
                                            height: '3px',
                                            backgroundColor: 'primary.main',
                                            borderRadius: '2px'
                                        }
                                    }}
                                >
                                    Resumen de precios
                                </Typography>

                                {/* Desglose diario */}
                                <Box sx={{ mb: 3, pl: 0.5, pr: 0.5 }}>
                                    {datesBetween.map((date, index) => {
                                        const specialPrice = specialPricesList.find(
                                            (price) => date >= price.fecha_inicio && date <= price.fecha_fin
                                        );
                                        const price = specialPrice ? specialPrice.precio_especial : propiedad.precio_por_noche;
                                        const isSpecialPrice = !!specialPrice;

                                        return (
                                            <Box
                                                key={index}
                                                sx={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    mb: 1,
                                                    p: 1,
                                                    borderRadius: 1,
                                                    backgroundColor: isSpecialPrice ? 'rgba(156, 39, 176, 0.04)' : 'transparent',
                                                    transition: 'background-color 0.2s ease'
                                                }}
                                            >
                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                    <Typography variant="body2" color="text.secondary">
                                                        {moment(date).format('DD MMM, yyyy')}
                                                    </Typography>
                                                    {isSpecialPrice && (
                                                        <Tooltip title="Tarifa especial para esta fecha" arrow>
                                                            <Box sx={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                ml: 1,
                                                                borderRadius: '4px',
                                                                p: '2px 5px',
                                                                backgroundColor: 'secondary.light',
                                                            }}>
                                                                <EuroIcon sx={{ fontSize: 14, mr: 0.5, color: 'secondary.main' }} />
                                                                <Typography variant="caption" sx={{ fontWeight: 600, color: 'secondary.main' }}>
                                                                    Tarifa Especial
                                                                </Typography>
                                                            </Box>
                                                        </Tooltip>
                                                    )}
                                                </Box>
                                                <Typography variant="body2" fontWeight={600} sx={{ color: isSpecialPrice ? 'secondary.dark' : 'text.primary' }}>
                                                    {price} €
                                                </Typography>
                                            </Box>
                                        );
                                    })}
                                </Box>

                                {/* Sección de resumen */}
                                <Box sx={{
                                    backgroundColor: 'rgba(0, 0, 0, 0.02)',
                                    p: 2,
                                    borderRadius: 1.5,
                                    border: '1px solid rgba(0, 0, 0, 0.06)'
                                }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                                            Subtotal ({datesBetween.length} {datesBetween.length === 1 ? 'noche' : 'noches'})
                                        </Typography>
                                        <Typography variant="body2" fontWeight={600}>
                                            {datesBetween.reduce((total, date) => {
                                                const specialPrice = specialPricesList.find(
                                                    (price) => date >= price.fecha_inicio && date <= price.fecha_fin
                                                );
                                                return total + (specialPrice ? parseFloat(specialPrice.precio_especial) : parseFloat(propiedad.precio_por_noche));
                                            }, 0).toFixed(2)} €
                                        </Typography>
                                    </Box>

                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                                                Comisión de servicio
                                            </Typography>
                                            <Tooltip title="Tarifa administrativa por uso de la plataforma" arrow>
                                                <InfoOutlinedIcon sx={{ fontSize: 16, ml: 0.5, color: 'text.secondary', opacity: 0.7 }} />
                                            </Tooltip>
                                        </Box>
                                        <Typography variant="body2" fontWeight={600}>
                                            {(datesBetween.reduce((total, date) => {
                                                const specialPrice = specialPricesList.find(
                                                    (price) => date >= price.fecha_inicio && date <= price.fecha_fin
                                                );
                                                return total + (specialPrice ? parseFloat(specialPrice.precio_especial) : parseFloat(propiedad.precio_por_noche));
                                            }, 0) * 0.10).toFixed(2)} €
                                        </Typography>
                                    </Box>
                                </Box>

                                {/* Precio total */}
                                <Box sx={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    mt: 3,
                                    pt: 2,
                                    borderTop: '1px solid rgba(0, 0, 0, 0.1)'
                                }}>
                                    <Typography variant="subtitle1" fontWeight={700}>
                                        Importe Total
                                    </Typography>
                                    <Box sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        backgroundColor: 'primary.main',
                                        color: 'white',
                                        px: 2,
                                        py: 1,
                                        borderRadius: 1.5
                                    }}>
                                        <Typography variant="subtitle1" fontWeight={700}>
                                            {(datesBetween.reduce((total, date) => {
                                                const specialPrice = specialPricesList.find(
                                                    (price) => date >= price.fecha_inicio && date <= price.fecha_fin
                                                );
                                                return total + (specialPrice ? parseFloat(specialPrice.precio_especial) : parseFloat(propiedad.precio_por_noche));
                                            }, 0) * 1.10).toFixed(2)} €
                                        </Typography>
                                    </Box>
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
                                disabled={loading || !reserveStartDate || !reserveEndDate}
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
                                {loading ? (
                                    <>
                                        <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
                                        Procesando
                                    </>
                                ) : 'Confirmar Reserva'}
                            </Button>
                        </Box>
                    </Paper>
                </Modal>
                <Dialog
                    open={openMenuSpecialPrice}
                    onClose={handleCloseMenuSpecialPrice}
                    maxWidth="sm"
                    fullWidth
                    PaperProps={{
                        elevation: 3,
                        sx: {
                            borderRadius: 1,
                            overflow: 'hidden'
                        }
                    }}
                >
                    <Paper square sx={{ position: 'relative' }}>
                        <DialogTitle sx={{
                            bgcolor: 'primary.main',
                            color: 'primary.contrastText',
                            py: 2,
                            pl: 3,
                            pr: 6
                        }}>
                            <Typography variant="h6" component="div" sx={{ fontWeight: 500 }}>
                                Gestión de fechas especiales
                            </Typography>
                            <IconButton
                                aria-label="cerrar"
                                onClick={handleCloseMenuSpecialPrice}
                                sx={{
                                    position: 'absolute',
                                    right: 12,
                                    top: 12,
                                    color: 'primary.contrastText'
                                }}
                                size="small"
                            >
                                <CloseIcon fontSize="small" />
                            </IconButton>
                        </DialogTitle>
                    </Paper>

                    <DialogContent sx={{ px: 0, py: 2 }}>
                        <Typography variant="subtitle2" sx={{ px: 3, pb: 1, color: 'text.secondary' }}>
                            Seleccione una acción para continuar
                        </Typography>

                        <List disablePadding>
                            <ListItem
                                button
                                onClick={() => setOpenAddSpecialPrice(true)}
                                sx={{
                                    py: 1.5,
                                    '&:hover': {
                                        bgcolor: 'primary.50'
                                    }
                                }}
                            >
                                <ListItemIcon sx={{ minWidth: 40, ml: 1 }}>
                                    <AddCircleOutlineIcon color="primary" />
                                </ListItemIcon>
                                <ListItemText
                                    primary="Añadir fechas con precio especial"
                                    primaryTypographyProps={{
                                        fontSize: '0.9rem',
                                        fontWeight: 400
                                    }}
                                />
                            </ListItem>

                            <Divider component="li" />

                            <ListItem
                                button
                                onClick={() => setOpenDeleteSpecialPrice(true)}
                                sx={{
                                    py: 1.5,
                                    '&:hover': {
                                        bgcolor: 'error.50'
                                    }
                                }}
                            >
                                <ListItemIcon sx={{ minWidth: 40, ml: 1 }}>
                                    <DeleteOutlineIcon color="error" />
                                </ListItemIcon>
                                <ListItemText
                                    primary="Eliminar fechas con precio especial"
                                    primaryTypographyProps={{
                                        fontSize: '0.9rem',
                                        fontWeight: 400
                                    }}
                                />
                            </ListItem>
                        </List>
                    </DialogContent>

                    <Divider />

                    <DialogActions sx={{ px: 3, py: 2, justifyContent: 'flex-end' }}>
                        <Button
                            onClick={handleCloseMenuSpecialPrice}
                            variant="contained"
                            color="primary"
                            disableElevation
                            sx={{
                                textTransform: 'none',
                                borderRadius: 1,
                                px: 3
                            }}
                        >
                            Cerrar
                        </Button>
                    </DialogActions>
                </Dialog>

                <Dialog
                    open={openAddSpecialPrice}
                    onClose={handleCloseAddSpecialPrice}
                    fullWidth
                    maxWidth="md"
                    PaperProps={{
                        elevation: 4,
                        sx: {
                            borderRadius: 2,
                            overflow: 'hidden',
                            height: '90vh',
                            maxHeight: '650px',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.1)'
                        }
                    }}
                >
                    <Paper square sx={{ position: 'relative' }}>
                        <DialogTitle sx={{
                            bgcolor: 'primary.main',
                            color: 'primary.contrastText',
                            py: 2.5,
                            pl: 3,
                            pr: 6,
                            borderBottom: '1px solid rgba(255,255,255,0.1)'
                        }}>
                            <Typography variant="h6" component="div" sx={{ fontWeight: 600, letterSpacing: '0.01em' }}>
                                Configurar precio especial
                            </Typography>
                            <IconButton
                                aria-label="cerrar"
                                onClick={handleCloseAddSpecialPrice}
                                sx={{
                                    position: 'absolute',
                                    right: 16,
                                    top: 14,
                                    color: 'primary.contrastText',
                                    '&:hover': {
                                        bgcolor: 'rgba(255,255,255,0.15)'
                                    },
                                    transition: 'background-color 0.2s'
                                }}
                                size="small"
                            >
                                <CloseIcon fontSize="small" />
                            </IconButton>
                        </DialogTitle>
                    </Paper>

                    <DialogContent sx={{ pt: 4, px: 4, pb: 3 }}>
                        <Box mb={4.5}>
                            <Typography variant="subtitle1" color="text.primary" mb={2} fontWeight={600} sx={{ display: 'flex', alignItems: 'center' }}>
                                <CalendarTodayIcon sx={{ fontSize: 18, mr: 1.5, color: 'primary.main', opacity: 0.9 }} />
                                Rango de fechas
                            </Typography>
                            <Paper
                                variant="outlined"
                                sx={{
                                    p: 2.5,
                                    borderRadius: 1.5,
                                    borderColor: 'divider',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                                    bgcolor: 'background.paper',
                                    position: 'relative',
                                    zIndex: 1,
                                }}
                            >
                                <DateRangePicker
                                    startDate={specialPriceStartDate}
                                    startDateId="start_date_id"
                                    endDate={specialPriceEndDate}
                                    startDatePlaceholderText='Fecha inicio'
                                    endDatePlaceholderText='Fecha fin'
                                    endDateId="end_date_id"
                                    onDatesChange={handleSpecialPriceDateChange}
                                    focusedInput={focusedInput}
                                    onFocusChange={(focusedInput) => setFocusedInput(focusedInput)}
                                    minimumNights={1}
                                    isOutsideRange={(date) => date.isBefore(moment()) || allBlockedDatesWithSpecialPrices.some((blockedDate) => moment(blockedDate).isSame(date, 'day'))}
                                    hideKeyboardShortcutsPanel
                                    required
                                    customArrowIcon={<ArrowRightAltIcon sx={{ color: 'text.secondary', mx: 1 }} />}
                                    displayFormat="DD/MM/YYYY"
                                    small
                                    noBorder
                                    daySize={36}
                                    renderCalendarInfo={() => (
                                        <Box sx={{ p: 1.5, borderTop: '1px solid', borderColor: 'divider', fontSize: '0.85rem', color: 'text.secondary' }}>
                                            Las fechas no disponibles aparecen deshabilitadas
                                        </Box>
                                    )}
                                />
                            </Paper>
                        </Box>

                        <Box mb={4.5} sx={{ position: 'relative', zIndex: 0 }}>
                            <Typography variant="subtitle1" color="text.primary" mb={2} fontWeight={600} sx={{ display: 'flex', alignItems: 'center' }}>
                                <EuroIcon sx={{ fontSize: 18, mr: 1.5, color: 'primary.main', opacity: 0.9 }} />
                                Valor del precio especial
                            </Typography>
                            <TextField
                                label="Precio por noche"
                                type="number"
                                value={specialPrice}
                                onChange={(e) => setSpecialPrice(e.target.value)}
                                fullWidth
                                variant="outlined"
                                size="medium"
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Typography variant="body1" color="text.primary" sx={{ fontWeight: 500 }}>€</Typography>
                                        </InputAdornment>
                                    )
                                }}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 1.5,
                                        '&:hover .MuiOutlinedInput-notchedOutline': {
                                            borderColor: 'primary.main',
                                            borderWidth: '1px'
                                        },
                                    }
                                }}
                            />
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block', fontStyle: 'italic' }}>
                                El precio especial tiene prioridad sobre cualquier otro precio configurado para estas fechas
                            </Typography>
                        </Box>

                        <Divider sx={{ mb: 4, opacity: 0.7 }} />

                        <Box display="flex" justifyContent="flex-end" gap={2}>
                            <Button
                                variant="outlined"
                                onClick={handleCloseAddSpecialPrice}
                                sx={{
                                    px: 3.5,
                                    py: 1.2,
                                    textTransform: 'none',
                                    fontWeight: 500,
                                    borderRadius: 1.5,
                                    borderColor: 'divider',
                                    color: 'text.primary',
                                    '&:hover': {
                                        borderColor: 'text.secondary',
                                        bgcolor: 'rgba(0,0,0,0.02)'
                                    }
                                }}
                                startIcon={<CloseIcon fontSize="small" />}
                            >
                                Cancelar
                            </Button>

                            <Button
                                variant="contained"
                                color="primary"
                                onClick={() => handleSpecialPriceChange(specialPrice)}
                                disabled={loading || !specialPrice || !specialPriceStartDate || !specialPriceEndDate}
                                disableElevation
                                sx={{
                                    px: 4,
                                    py: 1.2,
                                    textTransform: 'none',
                                    fontWeight: 600,
                                    borderRadius: 1.5,
                                    boxShadow: '0 3px 8px rgba(0,0,0,0.08)',
                                    '&:hover': {
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                                    }
                                }}
                                startIcon={loading ? null : <SaveIcon fontSize="small" />}
                            >
                                {loading ? (
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <CircularProgress size={20} color="inherit" sx={{ mr: 1.5 }} />
                                        <span>Procesando...</span>
                                    </Box>
                                ) : 'Aplicar cambios'}
                            </Button>
                        </Box>
                    </DialogContent>
                </Dialog>
                <Dialog
                    open={openDeleteSpecialPrice}
                    onClose={handleCloseDeleteSpecialPrice}
                    fullWidth
                    maxWidth="sm"
                    PaperProps={{
                        elevation: 4,
                        sx: {
                            borderRadius: 2,
                            boxShadow: '0 10px 32px rgba(0, 0, 0, 0.18)',
                            overflow: 'hidden'
                        }
                    }}
                >
                    <DialogTitle
                        sx={{
                            borderBottom: '1px solid',
                            borderColor: 'divider',
                            py: 2.5,
                            px: 3,
                            fontWeight: 600,
                            fontSize: '1.1rem',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            bgcolor: 'background.paper',
                            color: 'text.primary'
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <EventBusyIcon sx={{ mr: 1.5, color: 'error.main', opacity: 0.85 }} />
                            Eliminar fechas con precio especial
                        </Box>
                        <IconButton
                            onClick={handleCloseDeleteSpecialPrice}
                            size="small"
                            aria-label="cerrar"
                            sx={{
                                color: 'text.secondary',
                                '&:hover': {
                                    bgcolor: 'action.hover',
                                    color: 'text.primary'
                                }
                            }}
                        >
                            <CloseIcon fontSize="small" />
                        </IconButton>
                    </DialogTitle>

                    <Box sx={{ maxHeight: '400px', overflowY: 'auto' }}>
                        <DialogContent sx={{ p: 0 }}>
                            {specialPricesList?.length > 0 ? (
                                <>
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            py: 1.5,
                                            px: 3,
                                            bgcolor: 'action.hover',
                                            borderBottom: '1px solid',
                                            borderColor: 'divider'
                                        }}
                                    >
                                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, width: '30%' }}>
                                            FECHA INICIO
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, width: '30%' }}>
                                            FECHA FIN
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, width: '25%', textAlign: 'right' }}>
                                            PRECIO
                                        </Typography>
                                        <Box sx={{ width: '15%' }}></Box>
                                    </Box>

                                    {specialPricesList?.map((date, index) => (
                                        <Box
                                            key={index}
                                            sx={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                py: 2,
                                                px: 3,
                                                borderBottom: index !== specialPricesList.length - 1 ? '1px solid' : 'none',
                                                borderColor: 'divider',
                                                transition: 'background-color 0.2s',
                                                '&:hover': {
                                                    bgcolor: 'action.hover'
                                                }
                                            }}
                                        >
                                            <Box sx={{ width: '30%' }}>
                                                <Typography variant="body2" color="text.primary" fontWeight={500}>
                                                    {date.fecha_inicio}
                                                </Typography>
                                            </Box>
                                            <Box sx={{ width: '30%' }}>
                                                <Typography variant="body2" color="text.primary" fontWeight={500}>
                                                    {date.fecha_fin}
                                                </Typography>
                                            </Box>
                                            <Box sx={{ width: '25%', textAlign: 'right' }}>
                                                <Typography variant="body2" color="primary.main" fontWeight={600}>
                                                    {date.precio_especial} €
                                                </Typography>
                                            </Box>
                                            <Box sx={{ width: '15%', textAlign: 'right' }}>
                                                <Tooltip title="Eliminar precio especial" placement="top" arrow>
                                                    <IconButton
                                                        onClick={() => handleDeleteSpecialPrice(date.id)}
                                                        size="small"
                                                        color="error"
                                                        sx={{
                                                            transition: 'all 0.2s',
                                                            '&:hover': {
                                                                bgcolor: 'error.lighter',
                                                                transform: 'scale(1.05)'
                                                            }
                                                        }}
                                                    >
                                                        <DeleteOutlineIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </Box>
                                        </Box>
                                    ))}
                                </>
                            ) : (
                                <Box sx={{ p: 4, textAlign: 'center' }}>
                                    <Box sx={{ opacity: 0.7, mb: 2 }}>
                                        <EventBusyIcon sx={{ fontSize: '3rem', color: 'text.disabled' }} />
                                    </Box>
                                    <Typography variant="body1" color="text.secondary" fontWeight={500}>
                                        No hay fechas con precios especiales
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                                        Puede agregar precios especiales desde la sección de calendario
                                    </Typography>
                                </Box>
                            )}
                        </DialogContent>
                    </Box>

                    <DialogActions
                        sx={{
                            p: 2.5,
                            borderTop: '1px solid',
                            borderColor: 'divider',
                            justifyContent: 'space-between',
                            bgcolor: 'background.paper'
                        }}
                    >
                        <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                            {specialPricesList?.length > 0 ? `${specialPricesList.length} fecha${specialPricesList.length > 1 ? 's' : ''} con precio especial` : ''}
                        </Typography>
                        <Box>
                            <Button
                                onClick={handleCloseDeleteSpecialPrice}
                                variant="outlined"
                                color="inherit"
                                startIcon={<ArrowBackIcon fontSize="small" />}
                                sx={{
                                    mr: 1.5,
                                    textTransform: 'none',
                                    fontWeight: 500,
                                    borderRadius: 1.5,
                                    px: 2.5
                                }}
                            >
                                Volver
                            </Button>
                            {specialPricesList?.length > 0 && (
                                <Button
                                    variant="contained"
                                    color="primary"
                                    disableElevation
                                    sx={{
                                        textTransform: 'none',
                                        fontWeight: 500,
                                        borderRadius: 1.5,
                                        px: 2.5
                                    }}
                                    onClick={() => handleCloseDeleteSpecialPrice()}
                                >
                                    Finalizar
                                </Button>
                            )}
                        </Box>
                    </DialogActions>
                </Dialog>

            </Container >
        </Box >
    );
};


export default PropertyDetails;

