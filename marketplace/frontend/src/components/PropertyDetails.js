import { Box, Typography, Container, Paper, Modal, Divider, Chip, ListItem, List, ListItemIcon, ListItemText, InputAdornment, IconButton, DialogActions, Button, DialogTitle, DialogContent, TextField, FormControl, InputLabel, MenuItem, Select, Rating, Dialog, CircularProgress, Tooltip, ToggleButton, ToggleButtonGroup, Snackbar, Alert as MuiAlert, Avatar } from '@mui/material';
import { useParams } from 'react-router-dom';
import React, { useEffect, useState, useMemo } from 'react'; // Agregado useMemo
import Carousel from 'react-material-ui-carousel';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import refreshAccessToken from './RefreshToken';
import 'react-dates/initialize';
import 'react-dates/lib/css/_datepicker.css';
import { DateRangePicker, DayPickerRangeController } from 'react-dates'; // Cambiado DayPickerSingleDateController si es necesario
import moment from 'moment';
import 'moment/locale/es'; // Importar locale español para moment
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import { loadStripe } from '@stripe/stripe-js';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
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
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import HomeWorkIcon from '@mui/icons-material/HomeWork';
import BarChartIcon from '@mui/icons-material/BarChart';
import { useFavoritos } from "../context/FavoritosContext";
import SettingsIcon from '@mui/icons-material/Settings'; // Nuevo icono
import EventAvailableIcon from '@mui/icons-material/EventAvailable'; // Nuevo icono
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'; // Nuevo icono
import HelpOutlineIcon from '@mui/icons-material/HelpOutline'; // Import HelpOutlineIcon
import { API_BASE_URL } from "../apiConfig";

// Configurar Moment.js en español
moment.locale('es');

// Componente Alert personalizado para Snackbar
const Alert = React.forwardRef(function Alert(props, ref) {
    return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});


const PropertyDetails = () => {
    const usuarioId = JSON.parse(localStorage.getItem('additionalInfo'))?.usuarioId;
    const { actualizarFavoritosNavbar } = useFavoritos();
    const { propiedadId } = useParams();
    const [propiedad, setPropiedad] = useState(null);
    const [fotos, setFotos] = useState([]);
    const [open, setOpen] = useState(false); // Modal de fotos grande
    const [selectedFotoIndex, setSelectedFotoIndex] = useState(0);
    const [esAnfitrion, setEsAnfitrion] = useState(false);
    const [blockedDates, setBlockedDates] = useState([]); // Fechas bloqueadas manualmente por anfitrión
    const [openReserveDatePicker, setOpenReserveDatePicker] = useState(false); // Modal de reserva cliente
    const [reserveStartDate, setReserveStartDate] = useState(null);
    const [reserveEndDate, setReserveEndDate] = useState(null);
    const [focusedInput, setFocusedInput] = useState(null); // Para el DateRangePicker de reserva cliente
    const [numPersonas, setNumPersonas] = useState(1);
    const [metodoPago, setMetodoPago] = useState("Tarjeta de crédito");
    const [comentarios_usuario, setComentariosUsuario] = useState("");
    const [reservas, setReservas] = useState([]); // Reservas confirmadas
    const [rating, setRating] = useState(0);
    const [comentario_valoracion, setComentarioValoracion] = useState("");
    const [hasRated, setHasRated] = useState(false);
    const [userRating, setUserRating] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [alertMessage, setAlertMessage] = useState(""); // Para alertas de valoración
    const [mediaValoraciones, setMediaValoraciones] = useState(null);
    const [loadingMedia, setLoadingMedia] = useState(true);
    const [errorMedia, setErrorMedia] = useState(null);
    const [loading, setLoading] = useState(false); // Estado de carga general o para acciones específicas
    const [loadingRating, setLoadingRating] = useState(false);
    const stripePromise = loadStripe('pk_test_51OLmDUDoSuE99ePTNjJmFyVKyw1JJEabUApOykfz6zKOpSHuGJZ2Tobebcs0l9tSNtcBfUkURjIqSgarS1ik5YVt00ZVb4u4nn'); // Reemplaza con tu clave pública de Stripe
    const [isFavorite, setIsFavorite] = useState(false);
    const [favoritoId, setFavoritoId] = useState(null);
    const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' }); // Para Snackbar
    const clienteId = JSON.parse(localStorage.getItem('additionalInfo'))?.usuarioId;
    const [cliente, setCliente] = useState(null);
    const [specialPricesList, setSpecialPricesList] = useState([]); // Lista de precios especiales
    const [specialPrice, setSpecialPrice] = useState(''); // Input para precio especial en modal unificado
    const [datesBetween, setDatesBetween] = useState([]); // Para cálculo de precio en modal reserva cliente

    const [openGestionModal, setOpenGestionModal] = useState(false);
    const [gestionAccion, setGestionAccion] = useState('bloquear'); // 'bloquear', 'desbloquear', 'precio'
    const [gestionStartDate, setGestionStartDate] = useState(null);
    const [gestionEndDate, setGestionEndDate] = useState(null);
    const [gestionFocusedInput, setGestionFocusedInput] = useState(null); // Para el DRP del modal de gestión

    // --- Estilos reutilizables ---
    const columnStyle = {
        p: { xs: 2, sm: 3 }, // Padding adaptable
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto', // Permitir scroll independiente en cada columna
        flexGrow: 1,        // Permitir que crezcan
        minHeight: 0,       // Necesario para que flexGrow funcione con overflow
    };

    const leftColumnStyle = {
        ...columnStyle,
        flexBasis: { md: '60%' }, // Más espacio para el calendario
        borderRight: { md: '1px solid' },
        borderColor: { md: 'divider' },
    };

    const rightColumnStyle = {
        ...columnStyle,
        flexBasis: { md: '40%' }, // Menos espacio para la lista
        bgcolor: 'grey.50',      // Fondo sutil para diferenciar
    };

    const stickyHeaderStyle = {
        position: 'sticky',
        top: 0,
        bgcolor: 'background.paper', // Fondo para tapar contenido al hacer scroll
        zIndex: 1,
        pt: 0, // Ajustar padding si es necesario
        pb: 1.5,
        borderBottom: '1px solid',
        borderColor: 'divider',
        mx: -3, // Extender al ancho completo del padding del contenedor
        px: 3, // Restaurar padding interno
    };

    const stickyHeaderStyleRight = {
        ...stickyHeaderStyle,
        bgcolor: 'grey.50', // Mantener el fondo de la columna derecha
        mx: -3,
        px: 3,
    };

    useEffect(() => {
        if (isAuthenticated()) {
            fetchBlockedDates();
            fetchReservas();
            refreshAccessToken();
            checkIfFavorite();
            fetchSpecialPrices();
            actualizarFavoritosNavbar();
        }
        fetchPropertyDetails();
        fetchPropertyPhotos(propiedadId);
        checkUserRating();
        fetchMediaValoraciones();

    }, [propiedadId]);

    useEffect(() => {
        if (clienteId)
            fetchCliente(clienteId);
    }, [clienteId]);

    const hasConfirmedReservation = () => {
        return reservas.some(reserva => reserva.estado === 'Aceptada' && reserva.usuario === usuarioId);
    };

    const fetchPropertyDetails = async () => {
        try {
            let response;
            if (isAuthenticated()) {
                response = await fetch(`${API_BASE_URL}/api/propiedades/propiedades/${propiedadId}/`, { // Asegúrate que la URL sea correcta
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                    },
                });
            }
            else {
                response = await fetch(`${API_BASE_URL}/api/propiedades/propiedades/${propiedadId}/`, { // Asegúrate que la URL sea correcta
                    method: "GET",
                });
            }
            if (response.ok) {
                const data = await response.json();
                setPropiedad(data);

                const storedInfo = JSON.parse(localStorage.getItem('additionalInfo'));
                const usuarioID = storedInfo ? storedInfo.usuarioId : null;
                if (usuarioID && data.anfitrion && usuarioID === data.anfitrion) {
                    setEsAnfitrion(true);
                } else {
                    setEsAnfitrion(false); // Asegúrate de resetear si no lo es
                }
            } else {
                console.error("Error fetching property details:", response.status, response.statusText);
                // Considera mostrar un error al usuario
            }

        } catch (error) {
            console.error("Error fetching property details:", error);
        }
    };

    const fetchPropertyPhotos = async (propiedadId) => {
        // ... (sin cambios)
        try {
            const response = await fetch(`${API_BASE_URL}/api/propiedades/fotos-propiedades/`);
            if (response.ok) {
                const data = await response.json();
                const filteredData = data.filter(foto => foto.propiedad === parseInt(propiedadId));
                setFotos(filteredData);
            } else {
                console.error("Error fetching photos:", response.status, response.statusText);
            }
        } catch (error) {
            console.error("Error fetching photos:", error);
        }
    };

    const fetchBlockedDates = async (retried = false) => {
        if (!isAuthenticated()) return; // No intentar si no está autenticado
        try {
            const response = await fetch(`${API_BASE_URL}/api/propiedades/fechas-bloqueadas-por-propiedad/${propiedadId}/`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                },
            });
            if (response.status === 401 && !retried) {
                const tokenRefreshed = await refreshAccessToken();
                if (tokenRefreshed) {
                    return fetchBlockedDates(true); // Reintentar con el nuevo token
                } else {
                    handleLogout(); // Falló el refresh, desloguear
                    return;
                }
            }
            if (response.ok) {
                const data = await response.json();
                setBlockedDates(data);
            } else {
                console.error("Error fetching blocked dates:", response.status, response.statusText);
            }
        } catch (error) {
            console.error("Error fetching blocked dates:", error);
        }
    };

    const fetchReservas = async (retried = false) => {
        if (!isAuthenticated()) return;
        try {
            const response = await fetch(`${API_BASE_URL}/api/propiedades/reservas-por-propiedad/${propiedadId}/`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                },
            });
            if (response.status === 401 && !retried) {
                const tokenRefreshed = await refreshAccessToken();
                if (tokenRefreshed) {
                    return fetchReservas(true);
                } else {
                    handleLogout();
                    return;
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
            } else {
                console.error("Error fetching reservas:", response.status, response.statusText);
            }
        } catch (error) {
            console.error("Error fetching reservas:", error);
        }
    };

    const fetchSpecialPrices = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/propiedades/precios-especiales-por-propiedad/${propiedadId}/`);
            if (response.ok) {
                const data = await response.json();
                const filteredData = data.filter((precio) => moment(precio.fecha_fin).isSameOrAfter(moment(), 'day'));
                setSpecialPricesList(filteredData);
            } else {
                console.error("Error fetching special prices:", response.statusText);
            }
        } catch (error) {
            console.error("Error fetching special prices:", error);
        }
    };

    const fetchMediaValoraciones = async () => {
        setLoadingMedia(true);
        setErrorMedia(null);
        try {
            const response = await fetch(`${API_BASE_URL}/api/propiedades/valoraciones-propiedades/${propiedadId}/media-valoraciones/`, {
                method: "GET",
                headers: { "Content-Type": "application/json" },
            });
            if (response.ok) {
                const data = await response.json();
                setMediaValoraciones(data);
            } else {
                setErrorMedia("No se pudo obtener la media de valoraciones");
                console.error("Error fetching media valoraciones:", response.status, response.statusText);
            }
        } catch (error) {
            setErrorMedia("Error al conectar para obtener valoraciones");
            console.error("Error fetching media valoraciones:", error);
        } finally {
            setLoadingMedia(false);
        }
    };

    const checkUserRating = async () => {
        if (!isAuthenticated() || !usuarioId) return; // Necesita estar logueado
        try {
            const response = await fetch(`${API_BASE_URL}/api/propiedades/valoraciones-por-propiedad/${propiedadId}/`);
            if (response.ok) {
                const data = await response.json();
                const dataFiltered = data.filter((valoracion) => valoracion.usuario === usuarioId);
                if (dataFiltered.length > 0) {
                    setHasRated(true);
                    setUserRating(dataFiltered[0]);
                    setRating(dataFiltered[0].valoracion);
                    setComentarioValoracion(dataFiltered[0].comentario);
                } else {
                    setHasRated(false);
                    setUserRating(null);
                }
            } else {
                console.error("Error checking user rating:", response.status, response.statusText);
            }
        } catch (error) {
            console.error("Error checking user rating:", error);
        }
    };

    const checkIfFavorite = async () => {
        if (!isAuthenticated() || !usuarioId) return;
        try {
            const response = await fetch(`${API_BASE_URL}/api/propiedades/favoritos-por-usuario/${usuarioId}/`, {
                method: "GET",
                headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
            });

            // Manejo de token expirado (opcional pero recomendado)
            if (response.status === 401) {
                const refreshed = await refreshAccessToken();
                if (refreshed) return checkIfFavorite(); // Reintentar
                else { handleLogout(); return; }
            }

            if (response.ok) {
                const data = await response.json();
                const propiedadID = parseInt(propiedadId);
                const fav = data.find((fav) => fav.usuario === usuarioId && fav.propiedad === propiedadID);
                setIsFavorite(!!fav);
                setFavoritoId(fav ? fav.id : null);
                actualizarFavoritosNavbar(); // Asegúrate que esta función exista en tu contexto
            } else {
                console.error("Error checking favorite status:", response.status, response.statusText);
            }
        } catch (error) {
            console.error("Error checking favorite status:", error);
        }
    };

    const fetchCliente = async (clienteId) => {
        if (!isAuthenticated()) return;
        try {
            const response = await fetch(`${API_BASE_URL}/api/usuarios/${clienteId}/`);
            if (response.ok) {
                const data = await response.json();
                setCliente(data);
                // console.log(data); // Evitar logs innecesarios en producción
            } else {
                console.error("Error fetching cliente data:", response.statusText);
            }
        } catch (error) {
            console.error("Error fetching cliente data:", error);
        }
    };


    const isAuthenticated = () => {
        return !!localStorage.getItem("accessToken") && !!localStorage.getItem("refreshToken");
    };

    const handleLogout = () => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("additionalInfo"); // Limpiar toda la info de usuario
        setIsFavorite(false); // Resetear estado de favorito
        setEsAnfitrion(false); // Resetear estado de anfitrión
        window.location.href = '/inicio-de-sesion'; // Redirigir a login
    };

    const handleNotificationClose = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setNotification({ ...notification, open: false });
    };

    const handleClickOpen = (index) => {
        setSelectedFotoIndex(index);
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);

    };

    const handlePrev = () => {

        setSelectedFotoIndex((prev) => (prev === 0 ? fotos.length - 1 : prev - 1));
    };

    const handleNext = () => {

        setSelectedFotoIndex((prev) => (prev === fotos.length - 1 ? 0 : prev + 1));
    };

    const handleToggleFavorite = async (retried = false) => {
        try {
            const storedInfo = JSON.parse(localStorage.getItem('additionalInfo'));
            const usuarioID = storedInfo ? storedInfo.usuarioId : null;
            const propiedadID = parseInt(propiedadId);
            const isFavorito = isFavorite;
            if (isFavorito) {
                const data = await fetch(`${API_BASE_URL}/api/propiedades/favoritos/${favoritoId}/`, {
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
                const data = await fetch(`${API_BASE_URL}/api/propiedades/favoritos/`, {
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
            actualizarFavoritosNavbar();
            // window.location.reload();
        } catch (error) {
            console.error("Error al añadir a favoritos:", error);
        }
    };

    const handleRatingChange = (event, newValue) => {
        setRating(newValue);
    };

    const validateFields = () => {
        if (rating === 0 || !comentario_valoracion || comentario_valoracion.trim() === "") {
            setAlertMessage("Por favor, complete la puntuación y el comentario.");
            return false;
        }
        if (comentario_valoracion.length < 10) {
            setAlertMessage("El comentario debe tener al menos 10 caracteres.");
            return false;
        }
        setAlertMessage(""); // Limpiar alerta si todo OK
        return true;
    };

    const handleSubmitRating = async (retried = false) => {
        if (!validateFields()) return;
        if (!isAuthenticated() || !usuarioId || !propiedadId) {
            setAlertMessage("Necesita iniciar sesión para valorar.");
            return;
        }
        setLoadingRating(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/propiedades/valoraciones-propiedades/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                },
                body: JSON.stringify({
                    propiedad: parseInt(propiedadId),
                    usuario: usuarioId,
                    valoracion: rating,
                    comentario: comentario_valoracion,
                }),
            });

            if (response.status === 401 && !retried) {
                const tokenRefreshed = await refreshAccessToken();
                if (tokenRefreshed) {
                    return handleSubmitRating(true);
                } else {
                    handleLogout();
                    setAlertMessage("Su sesión ha expirado. Por favor, inicie sesión de nuevo.");
                    return;
                }
            } else if (response.ok) {
                setNotification({
                    open: true,
                    message: "Valoración enviada correctamente",
                    severity: "success",
                });
                await checkUserRating();
                await fetchMediaValoraciones();
                setRating(0);
                setComentarioValoracion("");
                setAlertMessage("");
                setIsEditing(false);
            } else {
                const errorData = await response.json().catch(() => ({}));
                setAlertMessage(`Error al enviar la valoración: ${errorData.detail || response.statusText}`);
                console.error("Error submitting rating:", response.status, response.statusText, errorData);
            }
        } catch (error) {
            setAlertMessage("Error de red al enviar la valoración.");
            console.error("Error submitting rating:", error);
        } finally {
            setLoadingRating(false);
        }
    };

    const handleEditRating = () => {
        if (userRating) {
            setIsEditing(true);
            setRating(userRating.valoracion);
            setComentarioValoracion(userRating.comentario);
            setAlertMessage("");
        }
    };

    const handleUpdateRating = async (retried = false) => {
        if (!validateFields()) return;
        if (!userRating || !userRating.id) {
            setAlertMessage("No se encontró la valoración a editar.");
            return;
        }
        if (!isAuthenticated()) {
            setAlertMessage("Necesita iniciar sesión para editar.");
            return;
        }
        setLoadingRating(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/propiedades/valoraciones-propiedades/${userRating.id}/`, {
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
                const tokenRefreshed = await refreshAccessToken();
                if (tokenRefreshed) {
                    return handleUpdateRating(true);
                } else {
                    handleLogout();
                    setAlertMessage("Su sesión ha expirado. Por favor, inicie sesión de nuevo.");
                    return;
                }
            } else if (response.ok) {
                setNotification({
                    open: true,
                    message: "Valoración actualizada correctamente",
                    severity: "success",
                });
                await checkUserRating(); // Actualizar los datos de la valoración mostrada
                await fetchMediaValoraciones(); // Actualizar media
                setIsEditing(false); // Salir del modo edición
                setAlertMessage("");
            } else {
                const errorData = await response.json().catch(() => ({}));
                setAlertMessage(`Error al actualizar la valoración: ${errorData.detail || response.statusText}`);
                console.error("Error updating rating:", response.status, response.statusText, errorData);
            }
        } catch (error) {
            setAlertMessage("Error de red al actualizar la valoración.");
            console.error("Error updating rating:", error);
        } finally {
            setLoadingRating(false);
        }
    };

    const handleDeleteRating = async (ratingId, retried = false) => {
        if (!isAuthenticated()) {
            setNotification({ open: true, message: 'Necesita iniciar sesión para eliminar.', severity: 'error' });
            return;
        }
        // Confirmación opcional antes de borrar
        if (!window.confirm("¿Está seguro de que desea eliminar su valoración? Esta acción no se puede deshacer.")) {
            return;
        }

        setLoadingRating(true); // Podrías usar un estado de carga específico si lo deseas
        try {
            const response = await fetch(`${API_BASE_URL}/api/propiedades/valoraciones-propiedades/${ratingId}/`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                },
            });

            if (response.status === 401 && !retried) {
                const tokenRefreshed = await refreshAccessToken();
                if (tokenRefreshed) {
                    return handleDeleteRating(ratingId, true);
                } else {
                    handleLogout();
                    setNotification({ open: true, message: 'Su sesión ha expirado.', severity: 'error' });
                    return;
                }
            }

            if (response.status === 204) { // Éxito en DELETE
                setNotification({
                    open: true,
                    message: "Valoración eliminada correctamente",
                    severity: "success",
                });
                setHasRated(false);
                setUserRating(null);
                setRating(0); // Resetear campos
                setComentarioValoracion("");
                setIsEditing(false); // Salir de edición si estaba activo
                await fetchMediaValoraciones(); // Actualizar la media
            } else {
                const errorData = await response.text(); // DELETE puede no devolver JSON
                setNotification({
                    open: true,
                    message: `Error al eliminar la valoración: ${response.statusText || errorData}`,
                    severity: "error",
                });
                console.error("Error deleting rating:", response.status, response.statusText, errorData);
            }
        } catch (error) {
            setNotification({
                open: true,
                message: "Error de red al eliminar la valoración.",
                severity: "error",
            });
            console.error("Error deleting rating:", error);
        } finally {
            setLoadingRating(false);
        }
    };


    const handleIncrement = () => {
        if (propiedad && numPersonas < propiedad.maximo_huespedes)
            setNumPersonas((prev) => prev + 1);
    };

    const handleDecrement = () => {
        if (numPersonas > 1)
            setNumPersonas((prev) => prev - 1);
    };

    const handleOpenReserveDatePicker = () => {
        setReserveStartDate(null);
        setReserveEndDate(null);
        setFocusedInput(null); // Importante para react-dates
        setComentariosUsuario(""); // Limpiar comentarios previos
        setNumPersonas(1); // Resetear número de personas
        setMetodoPago("Tarjeta de crédito"); // Resetear método de pago
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
            const end = moment(endDate);
            const dates = [];
            let currentDate = start.clone();
            while (currentDate.isBefore(end, 'day')) {
                dates.push(currentDate.format('YYYY-MM-DD'));
                currentDate.add(1, 'day');
            }
            setDatesBetween(dates);
        } else {
            setDatesBetween([]);
        }
    };

    const allUnavailableDatesForClient = useMemo(() => {
        const blocked = blockedDates?.map((fecha) => fecha.fecha) || [];
        const reserved = reservas
            .filter((reserva) => reserva.estado !== "Cancelada")
            .flatMap((reserva) => {
                const start = moment(reserva.fecha_llegada);
                const end = moment(reserva.fecha_salida); // Sin restar 1 día
                const dates = [];
                let current = start.clone();
                while (current.isBefore(end, 'day')) {
                    dates.push(current.format('YYYY-MM-DD'));
                    current.add(1, 'day');
                }
                return dates;
            });
        const specialPriceDates = specialPricesList.flatMap((precio) => {
            const start = moment(precio.fecha_inicio);
            const end = moment(precio.fecha_fin);
            const dates = [];
            let current = start.clone();
            while (current.isSameOrBefore(end, 'day')) { // Incluye inicio y fin
                dates.push(current.format('YYYY-MM-DD'));
                current.add(1, 'day');
            }
            return dates;
        });


        const allDatesSet = new Set([...blocked, ...reserved, ...specialPriceDates]);

        return [...new Set([...blocked, ...reserved])]; // Usar Set para eliminar duplicados
    }, [blockedDates, reservas, specialPricesList]);


    // Función para el DateRangePicker del cliente
    const isClientDayBlocked = (day) => {
        const dateStr = day.format('YYYY-MM-DD');
        if (day.isBefore(moment(), 'day')) {
            return true; // Bloquear pasado
        }
        return allUnavailableDatesForClient.includes(dateStr);
    };

    // Función para mostrar días con precio especial en el calendario del cliente
    const renderClientDayContents = (day) => {
        const dateStr = day.format('YYYY-MM-DD');
        const specialPriceInfo = specialPricesList.find(
            (price) => moment(dateStr).isBetween(price.fecha_inicio, price.fecha_fin, 'day', '[]')
        );
        const isSpecial = !!specialPriceInfo;
        const isUnavailable = isClientDayBlocked(day); // Revisa si está bloqueado/reservado

        // Estilo base
        let dayStyle = {
            position: 'relative',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            fontSize: '0.8rem', // Ligeramente más pequeño
        };
        let tooltip = '';

        if (isUnavailable && !isSpecial) { // Si está bloqueado/reservado Y NO tiene precio especial visible
            dayStyle = {
                ...dayStyle,
                textDecoration: 'line-through',
                color: 'rgba(0, 0, 0, 0.3)',
                backgroundColor: 'rgba(0, 0, 0, 0.04)',
                cursor: 'not-allowed' // Indicar no seleccionable
            };
        } else if (isSpecial) {
            dayStyle = {
                ...dayStyle,
                fontWeight: 'bold',
                color: '#0056b3', // Azul oscuro para precio especial
                backgroundColor: 'rgba(0, 123, 255, 0.08)', // Fondo azul claro
                border: '1px solid rgba(0, 123, 255, 0.2)'
            };
            tooltip = `Precio especial: ${specialPriceInfo.precio_especial} €`;
        }

        const content = <div style={dayStyle}>{day.format('D')}</div>;

        return tooltip ? (
            <Tooltip title={tooltip} placement="top" arrow>
                {content}
            </Tooltip>
        ) : (
            content
        );
    };


    const handleConfirmReserve = async (retried = false) => {
        if (!reserveStartDate || !reserveEndDate) {
            setNotification({ open: true, message: 'Por favor, seleccione las fechas de reserva', severity: 'warning' });
            return;
        }
        if (!isAuthenticated()) {
            setNotification({ open: true, message: 'Necesita iniciar sesión para reservar', severity: 'error' });
            // Opcional: redirigir a login
            // const redirectUrl = `/inicio-de-sesion?redirect=/detalles/${propiedadId}`;
            // window.location.href = redirectUrl;
            return;
        }

        setLoading(true);

        // Validar si alguna fecha seleccionada está bloqueada (doble chequeo)
        const localDatesBetween = [];
        let currentCheck = reserveStartDate.clone();
        while (currentCheck.isBefore(reserveEndDate, 'day')) {
            localDatesBetween.push(currentCheck.format('YYYY-MM-DD'));
            currentCheck.add(1, 'day');
        }
        const hasBlockedDates = localDatesBetween.some((date) => allUnavailableDatesForClient.includes(date));

        if (hasBlockedDates) {
            setNotification({ open: true, message: 'Alguna de las fechas seleccionadas ya no está disponible.', severity: 'error' });
            setLoading(false);
            return;
        }

        // Cálculo de precio total
        const subtotal = localDatesBetween.reduce((total, date) => {
            const specialPriceInfo = specialPricesList.find(
                (price) => moment(date).isBetween(price.fecha_inicio, price.fecha_fin, 'day', '[]')
            );
            return total + (specialPriceInfo ? parseFloat(specialPriceInfo.precio_especial) : parseFloat(propiedad.precio_por_noche));
        }, 0);

        const comision = subtotal * 0.10; // Asumiendo 10% de comisión
        const precioTotal = subtotal + comision;

        const formattedStartDate = reserveStartDate.format('YYYY-MM-DD');
        const formattedEndDate = reserveEndDate.format('YYYY-MM-DD');

        const reservationData = {
            usuario: usuarioId,
            anfitrion: propiedad.anfitrion,
            propiedad: parseInt(propiedadId),
            fecha_llegada: formattedStartDate,
            fecha_salida: formattedEndDate,
            estado: 'Pendiente', // O 'Confirmada' si el pago es inmediato y exitoso
            precio_por_noche: propiedad.precio_por_noche, // Podría ser redundante si se calcula al confirmar
            numero_personas: numPersonas,
            metodo_pago: metodoPago,
            precio_total: precioTotal, // Enviar como string formateado? O número? Verificar API
            comentarios_usuario: comentarios_usuario || "", // Asegurar que no sea null
            // Datos para Stripe/Paypal
            amount: Math.round(precioTotal * 100), // En céntimos para Stripe
            currency: 'eur',
            correo: cliente?.usuario?.email, // Asegúrate que 'cliente' tenga esta estructura
            nombrePropiedad: propiedad?.nombre,

            // tiene_precio_especial: localDatesBetween.some(date => specialPricesList.some(price => moment(date).isBetween(price.fecha_inicio, price.fecha_fin, 'day', '[]'))) // Para info adicional si es necesario
        };

        // --- Lógica de Pago (Stripe / PayPal) ---
        if (metodoPago === "Tarjeta de crédito") {
            try {
                const response = await fetch(`${API_BASE_URL}/api/propiedades/create-checkout-session/`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                    },
                    body: JSON.stringify({ reservationData }), // Enviar el objeto completo
                });

                if (response.status === 401 && !retried) {
                    const tokenRefreshed = await refreshAccessToken();
                    if (tokenRefreshed) return handleConfirmReserve(true);
                    else { handleLogout(); return; }
                }

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(`Error ${response.status}: ${errorData.error || response.statusText}`);
                }

                const data = await response.json();
                const { id: sessionId } = data;
                const stripe = await stripePromise;
                const { error } = await stripe.redirectToCheckout({ sessionId });

                if (error) {
                    console.error("Stripe checkout error:", error);
                    setNotification({ open: true, message: `Error en el pago: ${error.message}`, severity: 'error' });
                }
                // Si no hay error, Stripe redirige. Si el usuario cancela, vuelve.
                // La confirmación final suele manejarse en una página de éxito/cancelación via webhooks.

            } catch (error) {
                console.error("Error creating Stripe session:", error);
                setNotification({ open: true, message: `Error al iniciar el pago: ${error.message}`, severity: 'error' });
            } finally {
                setLoading(false); // Detener carga si falla antes de redirigir
            }
        } else if (metodoPago === "PayPal") {
            try {
                const response = await fetch(`${API_BASE_URL}/api/propiedades/create-checkout-paypal/`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                    },
                    body: JSON.stringify({ reservationData }),
                });

                if (response.status === 401 && !retried) {
                    const tokenRefreshed = await refreshAccessToken();
                    if (tokenRefreshed) return handleConfirmReserve(true);
                    else { handleLogout(); return; }
                }

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(`Error ${response.status}: ${errorData.error || response.statusText}`);
                }

                const data = await response.json();

                if (data.approval_url) {
                    // Guardar temporalmente los datos de la reserva asociados al ID de pedido de PayPal
                    // para recuperarlos después de la redirección de PayPal.
                    localStorage.setItem(`pending_paypal_reservation_${data.orderID}`, JSON.stringify(reservationData));
                    window.location.href = data.approval_url; // Redirigir a PayPal
                } else {
                    throw new Error("No se recibió la URL de aprobación de PayPal.");
                }
            } catch (error) {
                console.error("Error creating PayPal session:", error);
                setNotification({ open: true, message: `Error al iniciar el pago con PayPal: ${error.message}`, severity: 'error' });
                setLoading(false); // Detener carga si falla
            }
        } else {
            setNotification({ open: true, message: 'Método de pago no soportado', severity: 'error' });
            setLoading(false);
        }
    };


    // --- FUNCIONES PARA EL MODAL UNIFICADO DE GESTIÓN ---

    const handleOpenGestionModal = () => {
        // ... (implementado arriba)
        setGestionAccion('bloquear'); // Acción por defecto
        setGestionStartDate(null);
        setGestionEndDate(null);
        setSpecialPrice('');
        setGestionFocusedInput(null);
        setOpenGestionModal(true);
    };

    const handleCloseGestionModal = () => {
        // ... (implementado arriba)
        setOpenGestionModal(false);
        // Resetear estados al cerrar (opcional, pero recomendado si no se guardó)
        setGestionAccion('bloquear');
        setGestionStartDate(null);
        setGestionEndDate(null);
        setSpecialPrice('');
        setGestionFocusedInput(null);
    };

    const handleGestionAccionChange = (event, nuevaAccion) => {
        // ... (implementado arriba)
        if (nuevaAccion !== null) {
            setGestionAccion(nuevaAccion);
            setGestionStartDate(null);
            setGestionEndDate(null);
            setSpecialPrice('');
            setGestionFocusedInput(null); // Forzar re-render del calendario
        }
    };

    const handleGestionDatesChange = ({ startDate, endDate }) => {
        // ... (implementado arriba)
        setGestionStartDate(startDate);
        setGestionEndDate(endDate);
    };

    // Fechas no disponibles para el ANFITRIÓN (bloqueadas manualmente + reservadas)
    const fechasNoDisponiblesGestion = useMemo(() => {
        const blocked = blockedDates?.map((fecha) => fecha.fecha) || [];
        const reserved = reservas
            .filter((reserva) => reserva.estado !== "Cancelada")
            .flatMap((reserva) => {
                const start = moment(reserva.fecha_llegada);
                const end = moment(reserva.fecha_salida);
                const dates = [];
                let current = start.clone();
                while (current.isBefore(end, 'day')) {
                    dates.push(current.format('YYYY-MM-DD'));
                    current.add(1, 'day');
                }
                return dates;
            });
        return [...new Set([...blocked, ...reserved])];
    }, [blockedDates, reservas]);

    // Fechas que YA tienen precio especial asignado
    const fechasConPrecioEspecial = useMemo(() => {
        return specialPricesList.flatMap((precio) => {
            const start = moment(precio.fecha_inicio);
            const end = moment(precio.fecha_fin);
            const dates = [];
            let current = start.clone();
            while (current.isSameOrBefore(end, 'day')) {
                dates.push(current.format('YYYY-MM-DD'));
                current.add(1, 'day');
            }
            return dates;
        });
    }, [specialPricesList]);


    // Decide qué días deshabilitar en el modal de GESTIÓN
    const isGestionDayBlocked = (day) => {
        // ... (implementado arriba)
        const dateStr = day.format('YYYY-MM-DD');

        if (day.isBefore(moment(), 'day')) {
            return true; // Bloquear fechas pasadas
        }

        switch (gestionAccion) {
            case 'bloquear':
                // Bloquear si ya reservado o tiene precio especial (no se puede bloquear encima)
                // O si ya está bloqueado manualmente (ya está hecho)
                const isReserved = reservas.some(r => r.estado !== 'Cancelada' && moment(dateStr).isBetween(r.fecha_llegada, r.fecha_salida, 'day', '[)'));
                const isSpecial = fechasConPrecioEspecial.includes(dateStr);
                const isManuallyBlocked = blockedDates.some(b => b.fecha === dateStr);
                return isReserved || isSpecial || isManuallyBlocked;
            case 'desbloquear':
                // Solo permitir seleccionar días bloqueados manualmente
                return !blockedDates.some(b => b.fecha === dateStr);
            case 'precio':
                // Bloquear si ya reservado o ya tiene precio especial. Permitir sobre bloqueos manuales? (Decisión de negocio)
                // Aquí permitimos poner precio sobre bloqueo manual (el precio tendría precedencia)
                const isReservedForPrice = reservas.some(r => r.estado !== 'Cancelada' && moment(dateStr).isBetween(r.fecha_llegada, r.fecha_salida, 'day', '[)'));
                const isSpecialForPrice = fechasConPrecioEspecial.includes(dateStr);
                // const isManuallyBlockedForPrice = blockedDates.some(b => b.fecha === dateStr); // Descomentar si no se permite precio sobre bloqueo
                return isReservedForPrice || isSpecialForPrice; // || isManuallyBlockedForPrice;
            default:
                return false;
        }
    };

    // Renderiza visualmente los días en el modal de GESTIÓN
    const renderGestionDayContents = (day) => {
        // ... (implementado arriba)
        const dateStr = day.format('YYYY-MM-DD');
        const isBlockedManual = blockedDates.some(b => b.fecha === dateStr);
        const isReserved = reservas.some(r => r.estado !== 'Cancelada' && moment(dateStr).isBetween(r.fecha_llegada, r.fecha_salida, 'day', '[)'));
        const specialPriceInfo = specialPricesList.find(p => moment(dateStr).isBetween(p.fecha_inicio, p.fecha_fin, 'day', '[]'));
        const isSpecial = !!specialPriceInfo;

        let style = {};
        let tooltipTitle = '';

        // Prioridad visual: Reserva > Precio Especial > Bloqueo Manual
        if (isReserved) {
            style = { backgroundColor: 'rgba(108, 117, 125, 0.1)', textDecoration: 'line-through', color: 'rgba(108, 117, 125, 0.7)', borderRadius: '50%', cursor: 'not-allowed' };
            tooltipTitle = 'Fecha reservada';
        } else if (isSpecial) {
            style = { backgroundColor: 'rgba(0, 123, 255, 0.1)', color: '#0056b3', fontWeight: 'bold', borderRadius: '50%' };
            tooltipTitle = `Precio especial: ${specialPriceInfo.precio_especial} €`;
        } else if (isBlockedManual) {
            style = { backgroundColor: 'rgba(255, 0, 0, 0.1)', textDecoration: 'line-through', color: 'rgba(200, 0, 0, 0.7)', borderRadius: '50%' };
            tooltipTitle = 'Fecha bloqueada manualmente';
            if (gestionAccion === 'desbloquear') {
                style.cursor = 'pointer'; // Indicar que es clickeable para desbloquear
                style.border = '1px solid rgba(255, 0, 0, 0.5)'; // Resaltar más
            } else {
                style.cursor = 'not-allowed';
            }
        }

        const dayContainerStyle = {
            position: 'relative',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            ...style
        };

        const dayContent = (
            <div style={dayContainerStyle}>
                {day.format('D')}
            </div>
        );

        return tooltipTitle ? (
            <Tooltip title={tooltipTitle} placement="top" arrow>
                {dayContent}
            </Tooltip>
        ) : (
            dayContent
        );
    };


    // Bloquea UNA fecha (llamado por handleGuardarGestion)
    const handleBlockDate = async (date, retried = false) => {
        // ... (código original, pero sin gestión de UI aquí)
        if (!isAuthenticated()) return false;
        try {
            const response = await fetch(`${API_BASE_URL}/api/propiedades/fechas-bloqueadas/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                },
                body: JSON.stringify({
                    fecha: date, // date ya es YYYY-MM-DD
                    propiedad: parseInt(propiedadId),
                }),
            });
            if (response.status === 401 && !retried) {
                const tokenRefreshed = await refreshAccessToken();
                if (tokenRefreshed) return handleBlockDate(date, true);
                else { handleLogout(); return false; }
            }
            if (response.ok) {
                console.log(`Fecha ${date} bloqueada`);
                return true; // Indicar éxito
            } else {
                console.error(`Error bloqueando fecha ${date}: `, response.status, response.statusText);
                return false; // Indicar fallo
            }
        } catch (error) {
            console.error(`Error en petición para bloquear ${date}: `, error);
            return false;
        }
    };

    // Desbloquea UNA fecha (llamado por handleGuardarGestion)
    const handleUnblockDate = async (date, retried = false) => {
        // ... (código original, pero sin gestión de UI aquí)
        if (!isAuthenticated()) return false;
        try {
            // Encontrar el ID de la fecha bloqueada
            const fechaBloqueada = blockedDates.find((fecha) => fecha.fecha === date);
            if (!fechaBloqueada || !fechaBloqueada.id) {
                console.warn(`Fecha ${date} no encontrada o sin ID para desbloquear.`);
                return false; // No se puede desbloquear si no existe
            }

            const response = await fetch(`${API_BASE_URL}/api/propiedades/fechas-bloqueadas/${fechaBloqueada.id}/`, {
                method: "DELETE",
                headers: {
                    // "Content-Type": "application/json", // DELETE no suele necesitar Content-Type
                    Authorization: `Bearer ${localStorage.getItem("accessToken")}`
                },
            });

            if (response.status === 401 && !retried) {
                const tokenRefreshed = await refreshAccessToken();
                if (tokenRefreshed) return handleUnblockDate(date, true);
                else { handleLogout(); return false; }
            }

            if (response.status === 204) { // Éxito
                console.log(`Fecha ${date} desbloqueada`);
                return true;
            } else {
                console.error(`Error desbloqueando fecha ${date}:`, response.status, response.statusText);
                return false;
            }
        } catch (error) {
            console.error(`Error en petición para desbloquear ${date}:`, error);
            return false;
        }
    };

    // Guarda precio especial para UN rango (llamado por handleGuardarGestion)
    const handleSetSpecialPrice = async (fechaInicio, fechaFin, priceValue, retried = false) => {
        if (!isAuthenticated()) return false;
        try {
            const response = await fetch(`${API_BASE_URL}/api/propiedades/precios-especiales/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                },
                body: JSON.stringify({
                    propiedad: parseInt(propiedadId),
                    fecha_inicio: fechaInicio,
                    fecha_fin: fechaFin,
                    precio_especial: parseFloat(priceValue), // Asegurar que es número
                }),
            });

            if (response.status === 401 && !retried) {
                const tokenRefreshed = await refreshAccessToken();
                if (tokenRefreshed) return handleSetSpecialPrice(fechaInicio, fechaFin, priceValue, true);
                else { handleLogout(); return false; }
            }

            if (response.ok) {
                console.log(`Precio especial creado para ${fechaInicio} - ${fechaFin}`);
                return true;
            } else {
                const errorData = await response.json().catch(() => ({}));
                console.error(`Error creando precio especial para ${fechaInicio} - ${fechaFin}:`, response.status, response.statusText, errorData);
                setNotification({ // Mostrar error específico de la API
                    open: true,
                    message: `Error al guardar precio: ${errorData.detail || response.statusText}`,
                    severity: 'error'
                });
                return false;
            }
        } catch (error) {
            console.error(`Error en petición para crear precio especial ${fechaInicio} - ${fechaFin}:`, error);
            setNotification({ open: true, message: 'Error de red al guardar precio especial.', severity: 'error' });
            return false;
        }
    };


    // Borra UN precio especial (llamado desde la lista en el modal)
    const handleDeleteSpecialPrice = async (specialPriceId, retried = false) => {
        // ... (implementado arriba, asegurar que refresque la lista y muestre notificación)
        if (!isAuthenticated()) return;
        // Confirmación opcional
        if (!window.confirm("¿Está seguro de que desea eliminar este precio especial?")) {
            return;
        }
        setLoading(true); // Indicar carga mientras se borra
        try {
            const response = await fetch(`${API_BASE_URL}/api/propiedades/precios-especiales/${specialPriceId}/`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
            });

            if (response.status === 401 && !retried) {
                const tokenRefreshed = await refreshAccessToken();
                if (tokenRefreshed) return handleDeleteSpecialPrice(specialPriceId, true);
                else { handleLogout(); setLoading(false); return; }
            }

            if (response.status === 204) { // Éxito
                setNotification({ open: true, message: 'Precio especial eliminado.', severity: 'success' });
                await fetchSpecialPrices(); // Actualizar la lista mostrada en el modal
                // await fetchBlockedDates(); // Opcional: refrescar calendario si afecta visualización
            } else {
                const errorData = await response.text();
                setNotification({ open: true, message: `Error al eliminar: ${response.statusText || errorData}`, severity: 'error' });
                console.error("Error deleting special price:", response.status, response.statusText, errorData);
            }
        } catch (error) {
            setNotification({ open: true, message: 'Error de red al eliminar.', severity: 'error' });
            console.error("Error deleting special price:", error);
        } finally {
            setLoading(false);
        }
    };

    // Guarda los cambios del modal de GESTIÓN (Bloquear, Desbloquear, Precio)
    const handleGuardarGestion = async () => {
        // ... (implementado arriba)
        if (!gestionStartDate) {
            setNotification({ open: true, message: 'Seleccione una fecha o rango.', severity: 'warning' });
            return;
        }
        // Usar fecha de fin igual a inicio si no se seleccionó rango
        const endDateToUse = gestionEndDate || gestionStartDate;

        setLoading(true);

        // Generar lista de fechas (días individuales) en el rango seleccionado
        const datesToProcess = [];
        let current = gestionStartDate.clone();
        while (current.isSameOrBefore(endDateToUse, 'day')) {
            // Doble check: solo procesar fechas desde hoy en adelante
            if (current.isSameOrAfter(moment(), 'day')) {
                datesToProcess.push(current.format('YYYY-MM-DD'));
            }
            current.add(1, 'day');
        }

        if (datesToProcess.length === 0) {
            setNotification({ open: true, message: 'No se han seleccionado fechas válidas (a partir de hoy).', severity: 'warning' });
            setLoading(false);
            return;
        }

        let success = true; // Flag para saber si todas las operaciones fueron exitosas
        let partialSuccess = false; // Flag si al menos una tuvo éxito
        let errorMessage = '';

        try {
            switch (gestionAccion) {
                case 'bloquear':
                    for (const date of datesToProcess) {
                        const canBlock = !fechasNoDisponiblesGestion.includes(date) && !fechasConPrecioEspecial.includes(date);
                        if (canBlock) {
                            const blocked = await handleBlockDate(date);
                            if (blocked) partialSuccess = true;
                            else success = false; // Si una falla, el resultado general no es 100% exitoso
                        } else {
                            console.warn(`Intento de bloquear fecha no disponible o con precio: ${date}`);
                            success = false; // No se pudo realizar esta operación
                            errorMessage = 'Algunas fechas no se pudieron bloquear por no estar disponibles.';
                        }
                    }
                    if (partialSuccess && success) setNotification({ open: true, message: 'Fechas bloqueadas correctamente.', severity: 'success' });
                    else if (partialSuccess) setNotification({ open: true, message: errorMessage || 'Algunas fechas no se pudieron bloquear.', severity: 'warning' });
                    else setNotification({ open: true, message: 'No se pudo bloquear ninguna fecha.', severity: 'error' });
                    break;

                case 'desbloquear':
                    for (const date of datesToProcess) {
                        const canUnblock = blockedDates.some(b => b.fecha === date); // Solo desbloquear las bloqueadas manualmente
                        if (canUnblock) {
                            const unblocked = await handleUnblockDate(date);
                            if (unblocked) partialSuccess = true;
                            else success = false;
                        } else {
                            console.warn(`Intento de desbloquear fecha no bloqueada manualmente: ${date}`);
                            success = false;
                            errorMessage = 'Algunas fechas no se pudieron desbloquear (solo se pueden desbloquear las bloqueadas manualmente).';
                        }
                    }
                    if (partialSuccess && success) setNotification({ open: true, message: 'Fechas desbloqueadas correctamente.', severity: 'success' });
                    else if (partialSuccess) setNotification({ open: true, message: errorMessage || 'Algunas fechas no se pudieron desbloquear.', severity: 'warning' });
                    else setNotification({ open: true, message: 'No se pudo desbloquear ninguna fecha.', severity: 'error' });
                    break;

                case 'precio':
                    const priceValue = parseFloat(specialPrice);
                    if (isNaN(priceValue) || priceValue <= 0 || priceValue > 5000) {
                        setNotification({ open: true, message: 'Ingrese un precio especial válido (entre 0.01 y 5000).', severity: 'error' });
                        success = false;
                        break; // Salir del switch
                    }
                    if (!gestionEndDate) { // Necesita rango para precio
                        setNotification({ open: true, message: 'Seleccione una fecha de fin para el precio especial.', severity: 'error' });
                        success = false;
                        break;
                    }

                    // Validar que NINGUNA fecha en el rango esté ya reservada o con OTRO precio especial
                    const canSetPrice = datesToProcess.every(date =>
                        !reservas.some(r => r.estado !== 'Cancelada' && moment(date).isBetween(r.fecha_llegada, r.fecha_salida, 'day', '[)')) &&
                        !fechasConPrecioEspecial.includes(date)
                    );

                    if (!canSetPrice) {
                        setNotification({ open: true, message: 'El rango incluye fechas reservadas o que ya tienen un precio especial.', severity: 'error' });
                        success = false;
                        break;
                    }

                    // Llamar a la API para crear el precio especial para TODO el rango
                    const priceSet = await handleSetSpecialPrice(
                        gestionStartDate.format('YYYY-MM-DD'),
                        gestionEndDate.format('YYYY-MM-DD'),
                        priceValue
                    );
                    success = priceSet; // El éxito depende del resultado de la API
                    if (success) {
                        setNotification({ open: true, message: 'Precio especial guardado.', severity: 'success' });
                        partialSuccess = true; // Si la API tuvo éxito
                    }
                    // La notificación de error ya la maneja handleSetSpecialPrice
                    break;

                default:
                    console.error('Acción desconocida en handleGuardarGestion:', gestionAccion);
                    success = false;
            }

            // Si hubo algún cambio exitoso, refrescar datos y cerrar si todo fue bien
            if (partialSuccess) {
                await fetchBlockedDates();
                await fetchSpecialPrices();
                if (success) { // Solo cerrar si TODO salió bien
                    handleCloseGestionModal();
                }
            }

        } catch (error) {
            console.error("Error general al guardar cambios de gestión:", error);
            setNotification({ open: true, message: 'Ocurrió un error inesperado al guardar.', severity: 'error' });
            success = false;
        } finally {
            setLoading(false);
        }
    };

    // --- RENDERIZADO DEL COMPONENTE ---

    if (!propiedad) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
                <CircularProgress />
            </Box>
        );
    }


    return (
        <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: '#f8f9fc' }}>
            <Container maxWidth="lg" sx={{ flexGrow: 1, py: { xs: 3, md: 5 }, }}>

                {/* Sección Superior: Fotos e Info Básica/Reserva */}
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: { xs: 'column', md: 'row' },
                        gap: { xs: 3, md: 4 },
                        mb: { xs: 4, md: 5 },
                    }}
                >
                    {/* Columna Fotos */}
                    {fotos.length > 0 && (
                        <Box sx={{
                            flex: { xs: 1, md: 1.2 }, // Más ancho para fotos en desktop
                            minWidth: 0 // Para evitar overflow en flex
                        }}>
                            <Paper
                                elevation={3}
                                sx={{
                                    borderRadius: 3,
                                    overflow: 'hidden',
                                    height: '100%', // Ocupar altura disponible
                                    maxHeight: { xs: '50vh', md: "400px" }, // Limitar altura máxima
                                    boxShadow: '0 6px 20px rgba(0,0,0,0.1)'
                                }}
                            >
                                <Carousel
                                    autoPlay={false} // Desactivar autoplay puede ser mejor UX
                                    // interval={8000}
                                    navButtonsAlwaysVisible
                                    indicators={true}
                                    animation="slide"
                                    sx={{ height: '100%' }} // Carrusel ocupa todo el Paper
                                    navButtonsProps={{ style: { backgroundColor: 'rgba(255, 255, 255, 0.7)', color: '#333', '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.9)' } } }}
                                    indicatorContainerProps={{ style: { marginTop: '-30px', position: 'relative', zIndex: 1 } }}
                                    indicatorIconButtonProps={{ style: { color: 'rgba(255, 255, 255, 0.6)' } }}
                                    activeIndicatorIconButtonProps={{ style: { color: '#fff' } }}
                                >
                                    {fotos.map((foto, index) => (
                                        <Box
                                            key={index}
                                            onClick={() => handleClickOpen(index)} // Abre modal grande
                                            sx={{
                                                position: 'relative',
                                                width: '100%',
                                                height: { xs: '50vh', md: '600px' }, // Altura fija consistente
                                                cursor: 'pointer',
                                                backgroundColor: '#eee' // Fondo mientras carga img
                                            }}
                                        >
                                            <Box
                                                component="img"
                                                src={foto.foto}
                                                alt={foto.descripcion || `Imagen ${index + 1} de ${propiedad.nombre}`}
                                                sx={{
                                                    position: 'absolute',
                                                    top: 0,
                                                    left: 0,
                                                    width: '100%',
                                                    height: '100%',
                                                    objectFit: 'cover', // 'cover' suele ser mejor que 'contain' para carrusel
                                                }}
                                            />
                                        </Box>
                                    ))}
                                </Carousel>
                            </Paper>
                        </Box>
                    )}

                    {/* Columna Info y Acciones */}
                    <Box sx={{ flex: 1, display: 'flex' }}>
                        <Paper
                            elevation={3}
                            sx={{
                                p: { xs: 2.5, md: 4 },
                                borderRadius: 3,
                                height: '100%', // Ocupar altura
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between', // Distribuye espacio
                                position: 'relative',
                                boxShadow: '0 6px 20px rgba(0,0,0,0.1)',
                                width: '100%',
                            }}
                        >
                            {/* Contenido Principal Info */}
                            <Box>
                                {/* Botón Favorito */}
                                {isAuthenticated() && ( // Solo mostrar si está logueado
                                    <IconButton
                                        onClick={handleToggleFavorite}
                                        color="primary"
                                        aria-label={isFavorite ? "Quitar de favoritos" : "Añadir a favoritos"}
                                        sx={{
                                            position: 'absolute', top: 16, right: 16, zIndex: 2,
                                            backgroundColor: 'rgba(255, 255, 255, 0.8)',
                                            '&:hover': { backgroundColor: 'rgba(255, 255, 255, 1)' },
                                        }}
                                    >
                                        {isFavorite ? <FavoriteIcon sx={{ color: "#e91e63" }} /> : <FavoriteBorderIcon />}
                                    </IconButton>
                                )}

                                <Typography variant="h5" component="h1" sx={{ fontWeight: 700, mb: 1, pr: 5 }}> {/* Padding right por si solapa con fav */}
                                    {propiedad?.nombre || 'Cargando...'}
                                </Typography>
                                <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                                    {propiedad ? `${propiedad.direccion}, ${propiedad.ciudad}, ${propiedad.pais}` : 'Dirección no disponible'}
                                </Typography>

                                {/* Rating Promedio */}
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                                    {loadingMedia ? (
                                        <Typography variant='body2' color='text.secondary'>Cargando valoraciones...</Typography>
                                    ) : errorMedia ? (
                                        <Typography variant='body2' color='error.main'>{errorMedia}</Typography>
                                    ) : mediaValoraciones && mediaValoraciones.media > 0 ? (
                                        <>
                                            <Rating
                                                name="read-only-average"
                                                value={mediaValoraciones.media}
                                                readOnly
                                                precision={0.25}
                                                size="medium"
                                                sx={{ mr: 0.5 }}
                                            />
                                            <Typography variant='body2' color='text.secondary'>
                                                {`${mediaValoraciones.media.toFixed(1)} (${mediaValoraciones.reseñas} ${mediaValoraciones.reseñas === 1 ? 'valoración' : 'valoraciones'})`}
                                            </Typography>
                                        </>
                                    ) : (
                                        <Typography variant='body2' color='text.secondary'>Aún no hay valoraciones</Typography>
                                    )}
                                </Box>

                                <Typography variant="h6" color="primary" sx={{ fontWeight: 600, mb: 3 }}>
                                    {propiedad ? `Desde ${propiedad.precio_por_noche} € / noche` : 'Cargando...'}
                                    <Tooltip title="Este es el precio base. Pueden aplicarse precios especiales en algunas fechas.">
                                        <InfoOutlinedIcon fontSize="inherit" sx={{ ml: 0.5, verticalAlign: 'middle', color: 'text.secondary', opacity: 0.7 }} />
                                    </Tooltip>
                                </Typography>
                            </Box>

                            {/* Botones de Acción (Anfitrión / Cliente) */}
                            <Box mt="auto"> {/* Empuja los botones hacia abajo */}
                                {esAnfitrion && isAuthenticated() ? (
                                    <Box display="flex" flexDirection="column" gap={1.5} width="100%">
                                        <Button
                                            variant="contained"
                                            color="primary"
                                            size="large"
                                            fullWidth
                                            startIcon={<SettingsIcon />}
                                            sx={{ py: 1.3, fontWeight: 600, borderRadius: 2, textTransform: 'none', fontSize: '0.95rem' }}
                                            onClick={handleOpenGestionModal}
                                        >
                                            Gestionar Calendario y Precios
                                        </Button>
                                        <Box sx={{ display: 'flex', gap: 1.5, width: '100%' }}>
                                            <Button
                                                variant="outlined" color="primary" size="medium" fullWidth
                                                startIcon={<CalendarTodayIcon />}
                                                sx={{ textTransform: 'none', fontSize: '0.85rem', flex: 1 }}
                                                onClick={() => window.location.href = `/solicitudes-de-reserva?id=${propiedadId}`}
                                            >
                                                Ver reservas
                                            </Button>
                                            <Button
                                                variant="outlined" color="primary" size="medium" fullWidth
                                                startIcon={<BarChartIcon />}
                                                sx={{ textTransform: 'none', fontSize: '0.85rem', flex: 1 }}
                                                onClick={() => window.location.href = `/dashboard/${propiedadId}`}
                                            >
                                                Estadísticas
                                            </Button>
                                        </Box>
                                    </Box>
                                ) : isAuthenticated() ? (
                                    <Button
                                        variant='contained' color='primary' size="large" fullWidth
                                        sx={{ mt: 2, py: 1.5, fontWeight: 600, borderRadius: 2, boxShadow: 3 }}
                                        onClick={handleOpenReserveDatePicker}
                                    >
                                        Reservar Ahora
                                    </Button>
                                ) : (
                                    <Button
                                        variant='contained' color='primary' size="large" fullWidth
                                        sx={{ mt: 2, py: 1.5, fontWeight: 600, borderRadius: 2, boxShadow: 3 }}
                                        onClick={() => {
                                            const redirectUrl = `/inicio-de-sesion?redirect=/detalles/${propiedadId}`;
                                            window.location.href = redirectUrl;
                                        }}
                                    >
                                        Inicie sesión para reservar
                                    </Button>
                                )}
                            </Box>
                        </Paper>
                    </Box>
                </Box>

                {/* Sección Descripción y Detalles */}
                <Paper
                    elevation={2}
                    sx={{
                        p: { xs: 2.5, md: 4 }, borderRadius: 3, mb: 4,
                        boxShadow: '0 4px 15px rgba(0,0,0,0.07)'
                    }}
                >
                    <Typography variant="h5" sx={{ mb: 2, fontWeight: 600, color: 'primary.dark' }}>
                        Descripción
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 4, lineHeight: 1.7 }}>
                        {propiedad?.descripcion || 'Descripción no disponible'}
                    </Typography>

                    <Divider sx={{ my: 3 }} />

                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'primary.dark' }}>
                        Detalles de la Propiedad
                    </Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(4, 1fr)' }, gap: 3 }}>
                        {/* Información General */}
                        <Box>
                            <Typography variant="subtitle2" color="text.primary" sx={{ fontWeight: 600, mb: 1 }}>Información</Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}><strong>Tipo:</strong> {propiedad?.tipo_de_propiedad}</Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}><strong>Tamaño:</strong> {propiedad?.tamano} m²</Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}><strong>CP:</strong> {propiedad?.codigo_postal}</Typography>
                        </Box>
                        {/* Capacidad */}
                        <Box>
                            <Typography variant="subtitle2" color="text.primary" sx={{ fontWeight: 600, mb: 1 }}>Capacidad</Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}><strong>Huéspedes:</strong> {propiedad?.maximo_huespedes}</Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}><strong>Habitaciones:</strong> {propiedad?.numero_de_habitaciones}</Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}><strong>Camas:</strong> {propiedad?.numero_de_camas}</Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}><strong>Baños:</strong> {propiedad?.numero_de_banos}</Typography>
                        </Box>
                        {/* Comodidades */}
                        <Box>
                            <Typography variant="subtitle2" color="text.primary" sx={{ fontWeight: 600, mb: 1 }}>Comodidades</Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}><strong>Wifi:</strong> {propiedad?.wifi ? '✓ Sí' : '✗ No'}</Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}><strong>Aire Acond.:</strong> {propiedad?.aire_acondicionado ? '✓ Sí' : '✗ No'}</Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}><strong>Calefacción:</strong> {propiedad?.calefaccion ? '✓ Sí' : '✗ No'}</Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}><strong>Parking:</strong> {propiedad?.parking ? '✓ Sí' : '✗ No'}</Typography>
                        </Box>
                        {/* Normas */}
                        <Box>
                            <Typography variant="subtitle2" color="text.primary" sx={{ fontWeight: 600, mb: 1 }}>Normas</Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}><strong>Mascotas:</strong> {propiedad?.mascotas ? '✓ Permitidas' : '✗ No permitidas'}</Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}><strong>Fumar:</strong> {propiedad?.permitido_fumar ? '✓ Permitido' : '✗ No permitido'}</Typography>
                        </Box>
                    </Box>

                    <Divider sx={{ my: 3 }} />
                    <Box sx={{ display: 'flex', alignItems: 'center', }}>
                        <Typography variant="h6" sx={{ mb: 1, fontWeight: 600, color: 'primary.dark' }}>
                            Política de Cancelación
                        </Typography>
                        <Tooltip
                            title={
                                <Box>
                                    <b>Flexible:</b> Cancelación gratuita hasta 24h antes.<br />
                                    <b>Moderada:</b> Cancelación gratuita hasta 5 días antes.<br />
                                    <b>Estricta:</b> No reembolsable salvo causa mayor.
                                </Box>
                            }
                            arrow
                            placement="top"
                        >
                            <HelpOutlineIcon sx={{ ml: 1, mb: 1, color: "#888", cursor: "pointer" }} fontSize="small" />
                        </Tooltip>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                        {propiedad?.politica_de_cancelacion || 'No especificada'}
                    </Typography>
                </Paper>

                {/* Sección Tu Valoración (Solo Clientes Logueados NO Anfitriones) */}
                {isAuthenticated() && !esAnfitrion && (
                    <Paper
                        elevation={2}
                        sx={{
                            p: { xs: 2.5, md: 4 }, borderRadius: 3, mb: 4,
                            boxShadow: '0 4px 15px rgba(0,0,0,0.07)'
                        }}
                    >
                        <Typography variant="h5" sx={{ mb: 3, fontWeight: 600, color: 'primary.dark' }}>
                            {hasRated ? 'Tu Valoración' : 'Deja tu Valoración'}
                        </Typography>

                        {hasConfirmedReservation() ? (
                            // Mostrar formulario de valoración si tiene una reserva confirmada
                            <>
                                {/* Alerta para errores de validación */}
                                {alertMessage && (
                                    <MuiAlert severity='error' sx={{ mb: 2, borderRadius: 1.5 }} onClose={() => setAlertMessage("")}>
                                        {alertMessage}
                                    </MuiAlert>
                                )}

                                {/* Formulario/Vista de Valoración */}
                                {hasRated && !isEditing ? (
                                    // Vista de valoración existente
                                    <Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                            <Typography variant="body1" sx={{ mr: 1, fontWeight: 500 }}>Tu puntuación:</Typography>
                                            <Rating name="read-only-user" value={userRating.valoracion} readOnly precision={0.5} size="large" />
                                        </Box>
                                        <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: 'grey.50', borderColor: 'grey.200', borderRadius: 1.5 }}>
                                            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                                "{userRating.comentario}"
                                            </Typography>
                                        </Paper>
                                        <Box sx={{ display: 'flex', gap: 1.5 }}>
                                            <Button variant="outlined" color="primary" onClick={handleEditRating} size="small">
                                                Editar
                                            </Button>
                                            <Button variant="outlined" color="error" onClick={() => handleDeleteRating(userRating.id)} size="small" disabled={loadingRating}>
                                                {loadingRating ? <CircularProgress size={16} /> : 'Eliminar'}
                                            </Button>
                                        </Box>
                                    </Box>
                                ) : (
                                    // Formulario para valorar o editar
                                    <Box component="form" noValidate autoComplete="off">
                                        <Typography variant="body1" sx={{ mb: 1, fontWeight: 500 }}>Puntuación:</Typography>
                                        <Rating
                                            name="user-rating"
                                            value={rating}
                                            onChange={handleRatingChange}
                                            precision={0.5}
                                            size="large"
                                            sx={{ mb: 2 }}
                                        />
                                        <TextField
                                            label="Tu comentario"
                                            value={comentario_valoracion}
                                            onChange={(e) => setComentarioValoracion(e.target.value)}
                                            multiline
                                            rows={4}
                                            fullWidth
                                            variant="outlined"
                                            placeholder="Comparte tu experiencia (mín. 10 caracteres)"
                                            sx={{ mb: 2 }}
                                            required
                                            inputProps={{ minLength: 10 }}
                                        />
                                        <Box sx={{ display: 'flex', gap: 1.5 }}>
                                            <Button
                                                variant="contained"
                                                color="primary"
                                                onClick={isEditing ? handleUpdateRating : handleSubmitRating}
                                                disabled={loadingRating}
                                                startIcon={loadingRating ? <CircularProgress size={20} color="inherit" /> : null}
                                            >
                                                {loadingRating ? 'Guardando...' : (isEditing ? 'Actualizar Valoración' : 'Enviar Valoración')}
                                            </Button>
                                            {isEditing && (
                                                <Button variant="outlined" color="inherit" onClick={() => { setIsEditing(false); setAlertMessage(""); setRating(userRating.valoracion); setComentarioValoracion(userRating.comentario); }} disabled={loadingRating}>
                                                    Cancelar
                                                </Button>
                                            )}
                                        </Box>
                                    </Box>
                                )}
                            </>
                        ) : (
                            // Mostrar mensaje si no tiene una reserva confirmada
                            <Typography variant="body1" color="text.secondary">
                                Necesitas tener una reserva confirmada para dejar una valoración.
                            </Typography>
                        )}
                    </Paper>
                )}

                {/* Sección Valoraciones de Otros */}
                <PropertyValorations propiedadId={propiedadId} />

                {/* --- MODALES --- */}

                {/* Modal Fotos Grandes */}
                <Modal open={open} onClose={handleClose} /* ...otros props... */ >
                    <Box
                        sx={{
                            position: 'relative', width: { xs: '95vw', sm: '85vw' }, height: { xs: '70vh', sm: '85vh' },
                            maxWidth: '1200px', maxHeight: '800px', // Límites máximos
                            bgcolor: "background.paper", p: 0, borderRadius: 2,
                            overflow: 'hidden', boxShadow: 24,
                            top: '50%', left: '50%', transform: 'translate(-50%, -50%)' // Centrado absoluto
                        }}
                    >
                        {/* Botones navegación y cierre del modal de fotos */}
                        <IconButton onClick={handleClose} sx={{ position: 'absolute', top: 8, right: 8, bgcolor: 'rgba(0, 0, 0, 0.5)', color: 'white', zIndex: 2, '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.7)' } }}><CloseIcon /></IconButton>
                        <IconButton onClick={handlePrev} sx={{ position: 'absolute', top: '50%', left: 8, transform: 'translateY(-50%)', bgcolor: 'rgba(0, 0, 0, 0.5)', color: 'white', zIndex: 2, '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.7)' } }}><ArrowBackIosNewIcon /></IconButton>
                        <IconButton onClick={handleNext} sx={{ position: 'absolute', top: '50%', right: 8, transform: 'translateY(-50%)', bgcolor: 'rgba(0, 0, 0, 0.5)', color: 'white', zIndex: 2, '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.7)' } }}><ArrowForwardIosIcon /></IconButton>
                        {fotos[selectedFotoIndex] && (
                            <Box component="img" src={fotos[selectedFotoIndex].foto} alt={fotos[selectedFotoIndex].descripcion || 'Imagen ampliada'} sx={{ width: '100%', height: '100%', objectFit: 'contain', bgcolor: '#222' }} />
                        )}
                    </Box>
                </Modal>

                {/* Modal Reserva Cliente */}
                <Modal
                    open={openReserveDatePicker}
                    onClose={handleCloseReserveDatePicker}
                    // ... (estilos como en el código original) ...
                    sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                    <Paper
                        elevation={5}
                        sx={{
                            position: 'relative', width: { xs: '95vw', sm: '80vw', md: '70vw' }, maxWidth: '850px',
                            bgcolor: "background.paper", maxHeight: '90vh', p: { xs: 2, sm: 3, md: 4 }, borderRadius: 2,
                            display: 'flex', flexDirection: 'column', boxShadow: 24, overflow: 'hidden' // Overflow hidden en Paper
                        }}
                    >
                        {/* Título y Cierre */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, pb: 1.5, borderBottom: 1, borderColor: 'divider' }}>
                            <Typography variant="h5" sx={{ fontWeight: 600, color: 'text.primary' }}>
                                Realizar Reserva
                            </Typography>
                            <IconButton onClick={handleCloseReserveDatePicker} aria-label="Cerrar"><CloseIcon /></IconButton>
                        </Box>

                        {/* Contenido Scrollable */}
                        <Box sx={{ overflowY: 'auto', flexGrow: 1, pr: 1, mr: -1 }}> {/* Padding y margin para scrollbar */}
                            {/* Selector de Fechas */}
                            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
                                <DateRangePicker
                                    startDate={reserveStartDate} startDateId="reserve_start_date_id"
                                    endDate={reserveEndDate} endDateId="reserve_end_date_id"
                                    onDatesChange={handleReserveDateChange}
                                    focusedInput={focusedInput} onFocusChange={setFocusedInput}
                                    minimumNights={1} // O la estancia mínima que requieras
                                    isDayBlocked={isClientDayBlocked} // Usa la función específica del cliente
                                    renderDayContents={renderClientDayContents} // Muestra precios especiales
                                    numberOfMonths={window.innerWidth < 700 ? 1 : 2} // Adaptar meses
                                    hideKeyboardShortcutsPanel required noBorder small
                                    startDatePlaceholderText='Fecha de entrada' endDatePlaceholderText='Fecha de salida'
                                    customArrowIcon={<ArrowRightAltIcon sx={{ color: 'text.secondary', mx: 1 }} />}
                                    displayFormat="DD/MM/YYYY" daySize={36}
                                />
                            </Box>

                            {/* Selector Huéspedes */}
                            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: '100%', mb: 2.5, p: 1.5, bgcolor: 'grey.100', borderRadius: 1.5 }}>
                                <Typography variant="body1">Número de huéspedes:</Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <IconButton onClick={handleDecrement} size="small" aria-label="Reducir huéspedes"><RemoveIcon fontSize="small" /></IconButton>
                                    <Typography variant="body1" sx={{ mx: 2, fontWeight: 500 }}>{numPersonas}</Typography>
                                    <IconButton onClick={handleIncrement} size="small" aria-label="Aumentar huéspedes"><AddIcon fontSize="small" /></IconButton>
                                </Box>
                            </Box>

                            {/* Selector Método de Pago */}
                            <FormControl fullWidth sx={{ mb: 2.5 }}>
                                <InputLabel id="metodo-pago-label-reserva">Método de Pago</InputLabel>
                                <Select
                                    id="metodo-pago-reserva" labelId="metodo-pago-label-reserva"
                                    value={metodoPago} onChange={(e) => setMetodoPago(e.target.value)}
                                    label="Método de Pago" size="small"
                                >
                                    <MenuItem value="Tarjeta de crédito">Tarjeta de Crédito</MenuItem>
                                    <MenuItem value="PayPal">PayPal</MenuItem>
                                </Select>
                            </FormControl>

                            {/* Comentarios Adicionales */}
                            <TextField
                                label="Comentarios adicionales (opcional)"
                                value={comentarios_usuario} onChange={(e) => setComentariosUsuario(e.target.value)}
                                multiline rows={3} fullWidth variant="outlined" size="small"
                                placeholder="Indique cualquier requerimiento especial..." sx={{ mb: 3 }}
                            />

                            {/* Resumen de Precios */}
                            {reserveStartDate && reserveEndDate && datesBetween.length > 0 && (
                                <Paper variant="outlined" sx={{ width: '100%', mb: 3, p: 2.5, bgcolor: 'grey.50', borderRadius: 1.5, borderColor: 'grey.300' }}>
                                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'text.primary', pb: 1, borderBottom: 1, borderColor: 'grey.300' }}>
                                        Resumen de precios
                                    </Typography>
                                    {/* Detalle por noche (opcional, puede ocupar mucho espacio) */}
                                    {/* datesBetween.map((date, index) => { ... }) */}
                                    {/* Subtotal */}
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                        <Typography variant="body2" color="text.secondary">
                                            Subtotal ({datesBetween.length} {datesBetween.length === 1 ? 'noche' : 'noches'})
                                        </Typography>
                                        <Typography variant="body2" fontWeight={500}>
                                            {datesBetween.reduce((total, date) => {
                                                const specialPriceInfo = specialPricesList.find(p => moment(date).isBetween(p.fecha_inicio, p.fecha_fin, 'day', '[]'));
                                                return total + (specialPriceInfo ? parseFloat(specialPriceInfo.precio_especial) : parseFloat(propiedad.precio_por_noche));
                                            }, 0).toFixed(2)} €
                                        </Typography>
                                    </Box>
                                    {/* Comisión */}
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <Typography variant="body2" color="text.secondary">Comisión de servicio</Typography>
                                            <Tooltip title="Tarifa administrativa por uso de la plataforma (10%)" arrow>
                                                <InfoOutlinedIcon sx={{ fontSize: 14, ml: 0.5, color: 'text.secondary', opacity: 0.7 }} />
                                            </Tooltip>
                                        </Box>
                                        <Typography variant="body2" fontWeight={500}>
                                            {(datesBetween.reduce((total, date) => {
                                                const specialPriceInfo = specialPricesList.find(p => moment(date).isBetween(p.fecha_inicio, p.fecha_fin, 'day', '[]'));
                                                return total + (specialPriceInfo ? parseFloat(specialPriceInfo.precio_especial) : parseFloat(propiedad.precio_por_noche));
                                            }, 0) * 0.10).toFixed(2)} €
                                        </Typography>
                                    </Box>
                                    {/* Total */}
                                    <Divider sx={{ my: 1.5 }} />
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Typography variant="subtitle1" fontWeight={700}>Importe Total</Typography>
                                        <Typography variant="subtitle1" fontWeight={700} color="primary.main">
                                            {(datesBetween.reduce((total, date) => {
                                                const specialPriceInfo = specialPricesList.find(p => moment(date).isBetween(p.fecha_inicio, p.fecha_fin, 'day', '[]'));
                                                return total + (specialPriceInfo ? parseFloat(specialPriceInfo.precio_especial) : parseFloat(propiedad.precio_por_noche));
                                            }, 0) * 1.10).toFixed(2)} €
                                        </Typography>
                                    </Box>
                                </Paper>
                            )}
                        </Box> {/* Fin Contenido Scrollable */}

                        {/* Acciones del Modal de Reserva */}
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5, pt: 2, borderTop: 1, borderColor: 'divider', mt: 'auto' }}> {/* mt auto para empujar abajo */}
                            <Button variant="outlined" color="inherit" onClick={handleCloseReserveDatePicker} disabled={loading}>
                                Cancelar
                            </Button>
                            <Button
                                variant="contained" color="primary" onClick={handleConfirmReserve}
                                disabled={loading || !reserveStartDate || !reserveEndDate || datesBetween.length === 0}
                                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
                            >
                                {loading ? 'Procesando...' : 'Confirmar y Pagar'}
                            </Button>
                        </Box>
                    </Paper>
                </Modal>

                {/* Modal Unificado Gestión Anfitrión */}
                {esAnfitrion && (
                    <Dialog
                        open={openGestionModal}
                        onClose={handleCloseGestionModal}
                        fullWidth
                        maxWidth="lg"
                        PaperProps={{
                            sx: {
                                borderRadius: { xs: 0, sm: 3 }, // Sin borde en móvil, redondeado en escritorio
                                height: { xs: '100%', sm: '90vh' }, // Pantalla completa en móvil
                                maxHeight: { sm: '750px' },     // Altura máxima en escritorio
                                overflow: 'hidden',           // Gestionar scroll interno
                                boxShadow: '0 12px 30px -5px rgba(0,0,0,0.2)' // Sombra más pronunciada
                            }
                        }}
                    >
                        {/* Título del Diálogo */}
                        <DialogTitle sx={{
                            bgcolor: 'primary.main',
                            color: 'primary.contrastText',
                            py: 1.5, px: { xs: 2, sm: 3 },
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            borderBottom: '1px solid', borderColor: 'primary.dark' // Línea sutil
                        }}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <CalendarMonthIcon sx={{ mr: 1.5, opacity: 0.9 }} />
                                <Typography variant="h6" component="div" sx={{ fontWeight: 600, fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
                                    Gestionar Calendario y Precios
                                </Typography>
                            </Box>
                            <IconButton aria-label="cerrar" onClick={handleCloseGestionModal} sx={{ color: 'primary.contrastText' }} size="medium">
                                <CloseIcon />
                            </IconButton>
                        </DialogTitle>

                        {/* Contenido Principal (Dividido en Columnas) */}
                        <DialogContent dividers sx={{ p: 0, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, flexGrow: 1, minHeight: 0 }}>

                            {/* Columna Izquierda: Acciones y Calendario */}
                            <Box sx={leftColumnStyle}>
                                {/* Selector de Acción */}
                                <Box sx={stickyHeaderStyle}> {/* Header pegajoso */}
                                    <Typography variant="overline" display="block" gutterBottom sx={{ color: 'text.secondary', fontWeight: 500, pt: 1.5 }}>
                                        Seleccionar Acción
                                    </Typography>
                                    <ToggleButtonGroup
                                        color="primary" value={gestionAccion} exclusive
                                        onChange={handleGestionAccionChange} aria-label="Acción de gestión"
                                        fullWidth size="small" sx={{ mb: 2 }}
                                    >
                                        <ToggleButton value="bloquear" aria-label="Bloquear fechas" sx={{ textTransform: 'none', flexGrow: 1 }}>
                                            <EventBusyIcon sx={{ mr: { xs: 0, sm: 1 } }} fontSize="small" />
                                            <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'inline' } }}>Bloquear</Typography>
                                        </ToggleButton>
                                        <ToggleButton value="desbloquear" aria-label="Desbloquear fechas" sx={{ textTransform: 'none', flexGrow: 1 }}>
                                            <EventAvailableIcon sx={{ mr: { xs: 0, sm: 1 } }} fontSize="small" />
                                            <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'inline' } }}>Desbloquear</Typography>
                                        </ToggleButton>
                                        <ToggleButton value="precio" aria-label="Establecer precio especial" sx={{ textTransform: 'none', flexGrow: 1 }}>
                                            <AttachMoneyIcon sx={{ mr: { xs: 0, sm: 1 } }} fontSize="small" />
                                            <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'inline' } }}>Precio Esp.</Typography>
                                        </ToggleButton>
                                    </ToggleButtonGroup>
                                    <Typography variant="overline" display="block" gutterBottom sx={{ color: 'text.secondary', fontWeight: 500 }}>
                                        Seleccionar Fechas
                                    </Typography>
                                </Box>

                                {/* Input de Precio Especial */}
                                {gestionAccion === 'precio' && (
                                    <Box sx={{ mt: 'auto', pt: 3, borderTop: 1, borderColor: 'divider', mx: -3, px: 3 }}> {/* Con separador */}
                                        <TextField
                                            label="Precio Especial por Noche" type="number"
                                            value={specialPrice} onChange={(e) => setSpecialPrice(e.target.value)}
                                            fullWidth variant="outlined" size="small" required
                                            InputProps={{ startAdornment: <InputAdornment position="start">€</InputAdornment>, inputProps: { min: 0.01, step: 0.01, max: 5000 } }}
                                            sx={{ mt: 1, mb: 0.5 }}
                                            error={specialPrice !== '' && (parseFloat(specialPrice) <= 0 || parseFloat(specialPrice) > 5000)}
                                            helperText={specialPrice !== '' && (parseFloat(specialPrice) <= 0 || parseFloat(specialPrice) > 5000) ? "Precio debe ser mayor a 0 y no exceder 5000" : "Este precio se aplicará a cada noche del rango."}
                                        />
                                    </Box>
                                )}

                                {/* Contenedor Calendario */}
                                <Box sx={{ display: 'flex', justifyContent: 'center', flexGrow: 1, minHeight: { xs: 320, sm: 360 }, mt: 2 }}>
                                    <DateRangePicker
                                        startDate={gestionStartDate} startDateId="gestion_start_date_id"
                                        endDate={gestionEndDate} endDateId="gestion_end_date_id"
                                        onDatesChange={handleGestionDatesChange}
                                        focusedInput={gestionFocusedInput} onFocusChange={setGestionFocusedInput}
                                        isDayBlocked={isGestionDayBlocked}
                                        renderDayContents={renderGestionDayContents}
                                        minimumNights={0} // Permitir seleccionar un solo día
                                        numberOfMonths={window.innerWidth < 960 ? 1 : 2}
                                        hideKeyboardShortcutsPanel noBorder readOnly
                                        startDatePlaceholderText='Inicio' endDatePlaceholderText='Fin'
                                        customArrowIcon={<ArrowRightAltIcon sx={{ color: 'text.secondary', mx: 1 }} />}
                                        daySize={window.innerWidth < 600 ? 32 : 38} // Ajustar tamaño día
                                    // Añadir estas clases para un posible CSS personalizado si es necesario
                                    // calendarInfoPosition="after"
                                    // renderCalendarInfo={() => <div style={{padding: 10, fontSize: 12, color: '#555'}}>Seleccione un rango o un solo día.</div>}
                                    />
                                </Box>


                            </Box>

                            {/* Columna Derecha: Lista de Precios Especiales */}
                            <Box sx={rightColumnStyle}>
                                <Box sx={stickyHeaderStyleRight}> {/* Header pegajoso */}
                                    <Typography variant="overline" gutterBottom sx={{ color: 'text.secondary', fontWeight: 500, display: 'block', pt: 1.5 }}>
                                        Precios Especiales Activos
                                    </Typography>
                                </Box>
                                {specialPricesList.length > 0 ? (
                                    <List dense sx={{ pt: 0, width: '100%' }}>
                                        {specialPricesList
                                            .sort((a, b) => moment(a.fecha_inicio).diff(moment(b.fecha_inicio)))
                                            .map((precio) => (
                                                <ListItem
                                                    key={precio.id}
                                                    secondaryAction={
                                                        <Tooltip title="Eliminar precio especial" arrow>
                                                            <IconButton edge="end" aria-label="delete" onClick={() => handleDeleteSpecialPrice(precio.id)} size="small" color="error" disabled={loading} sx={{ '&:hover': { bgcolor: 'error.lighter' } }}>
                                                                <DeleteOutlineIcon fontSize="inherit" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    }
                                                    sx={{
                                                        mb: 1,
                                                        bgcolor: 'background.paper', // Fondo blanco para destacar
                                                        borderRadius: 1.5,
                                                        p: 1.5,
                                                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                                                        '&:hover': { bgcolor: 'grey.100' }
                                                    }}
                                                    divider
                                                >
                                                    <ListItemIcon sx={{ minWidth: 36, color: 'primary.main' }}>
                                                        <AttachMoneyIcon fontSize="small" />
                                                    </ListItemIcon>
                                                    <ListItemText
                                                        primary={
                                                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                                {moment(precio.fecha_inicio).format('DD MMM YY')} <ArrowRightAltIcon fontSize='inherit' sx={{ verticalAlign: 'middle', mx: 0.5 }} /> {moment(precio.fecha_fin).format('DD MMM YY')}
                                                            </Typography>
                                                        }
                                                        secondary={
                                                            <Chip label={`${precio.precio_especial} € / noche`} size="small" color="primary" variant='outlined' sx={{ height: 'auto', '& .MuiChip-label': { py: 0.3, px: 0.8, fontSize: '0.7rem' }, mt: 0.5 }} />
                                                        }
                                                    />
                                                </ListItem>
                                            ))}
                                    </List>
                                ) : (
                                    // Mensaje cuando no hay precios especiales
                                    <Box sx={{ textAlign: 'center', color: 'text.secondary', flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', p: 2 }}>
                                        <Avatar sx={{ bgcolor: 'grey.200', width: 56, height: 56, mb: 2 }}>
                                            <AttachMoneyIcon color="disabled" sx={{ fontSize: 30 }} />
                                        </Avatar>
                                        <Typography variant="body2" sx={{ mb: 0.5 }}>No hay precios especiales.</Typography>
                                        <Typography variant="caption">Añada rangos de fechas y precios usando la acción "Precio Esp.".</Typography>
                                    </Box>
                                )}
                            </Box>

                        </DialogContent>

                        {/* Acciones Finales */}
                        <DialogActions sx={{
                            px: { xs: 2, sm: 3 }, py: 1.5,
                            borderTop: '1px solid', borderColor: 'divider',
                            bgcolor: 'grey.50' // Fondo ligeramente distinto
                        }}>
                            <Button onClick={handleCloseGestionModal} color="inherit" disabled={loading} sx={{ textTransform: 'none' }}>
                                Cancelar
                            </Button>
                            <Button
                                onClick={handleGuardarGestion}
                                variant="contained"
                                color="primary"
                                disabled={ /* ... (misma lógica de disabled que antes) ... */
                                    loading ||
                                    !gestionStartDate ||
                                    (gestionAccion === 'precio' && (!gestionEndDate || !specialPrice || parseFloat(specialPrice) <= 0 || parseFloat(specialPrice) > 5000)) ||
                                    (gestionAccion === 'desbloquear' && !(blockedDates.some(b => moment(gestionStartDate).isSame(b.fecha, 'day')) || (gestionEndDate && blockedDates.some(b => moment(gestionEndDate).isSame(b.fecha, 'day')))))
                                }
                                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                                sx={{ textTransform: 'none', fontWeight: 600 }}
                            >
                                {loading ? 'Guardando...' : 'Aplicar Cambios'}
                            </Button>
                        </DialogActions>
                    </Dialog>
                )};

                {/* Snackbar para notificaciones */}
                <Snackbar
                    open={notification.open}
                    autoHideDuration={6000}
                    onClose={handleNotificationClose}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                >
                    <Alert onClose={handleNotificationClose} severity={notification.severity} sx={{ width: '100%' }}>
                        {notification.message}
                    </Alert>
                </Snackbar>

            </Container>
        </Box>
    );
};

export default PropertyDetails;