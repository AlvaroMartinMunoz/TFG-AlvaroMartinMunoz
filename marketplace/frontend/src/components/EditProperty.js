import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import refreshAccessToken from "./RefreshToken";
import {
    Box,
    Container,
    Typography,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    FormHelperText,
    Button,
    FormControlLabel,
    Checkbox,
    Radio,
    CircularProgress,
    Paper,
    Divider,
    IconButton,
    Stack,
    Alert,
    Tooltip
} from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import SaveIcon from '@mui/icons-material/Save';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

const EditProperty = () => {
    const { propiedadId: id } = useParams();
    const storedInfo = localStorage.getItem("additionalInfo");
    const usuarioId = storedInfo ? JSON.parse(storedInfo).usuarioId : null;
    const [photoPreviews, setPhotoPreviews] = useState([]);
    const [errors, setErrors] = useState({});
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [deletedPhotoIds, setDeletedPhotoIds] = useState([]);
    const [formValues, setFormValues] = useState({
        anfitrion: usuarioId,
        nombre: "",
        descripcion: "",
        direccion: "",
        ciudad: "",
        codigo_postal: "",
        pais: "España",
        tipo_de_propiedad: "",
        precio_por_noche: "",
        maximo_huespedes: "",
        numero_de_habitaciones: "",
        numero_de_banos: "",
        numero_de_camas: "",
        tamano: "",
        wifi: false,
        aire_acondicionado: false,
        calefaccion: false,
        parking: false,
        mascotas: false,
        permitido_fumar: false,
        politica_de_cancelacion: "",
        fotos: [],
        portada: null
    });

    const ciudadesEspana = [
        "Madrid",
        "Barcelona",
        "Valencia",
        "Sevilla",
        "Zaragoza",
        "Málaga",
        "Murcia",
        "Palma",
        "Bilbao",
        "Alicante",
        "Córdoba",
        "Valladolid",
        "Vigo",
        "Gijón",
        "Granada",
        "Elche",
        "Oviedo",
        "Badalona",
        "Cartagena",
        "Terrassa",
        "Jerez de la Frontera",
        "Sabadell",
        "Móstoles",
        "Santa Cruz de Tenerife",
        "Pamplona",
        "Almería",
        "Alcalá de Henares",
        "San Sebastián",
        "Donostia",
        "Leganés",
        "Santander",
        "Burgos",
        "Castellón de la Plana",
        "Alcorcón",
        "Albacete",
        "Getafe",
        "Salamanca",
        "Logroño",
        "Huelva",
        "Badajoz",
        "Tarragona",
        "Lleida",
        "Marbella",
        "León",
        "Cádiz",
        "Jaén",
        "Ourense",
        "Lugo",
        "Santiago de Compostela",
        "Cáceres",
        "Melilla",
        "Ceuta",
        "Ávila",
        "Segovia",
        "Guadalajara",
        "Cuenca",
        "Soria",
        "Zamora",
        "Palencia",
        "Toledo",
        "Ciudad Real",
        "Huesca",
    ].sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));


    useEffect(() => {
        const fetchData = async () => {
            await fetchPropertyDetails(id);
            await fetchPropertyPhotos(id);
            setLoading(false);
        }
        fetchData();
    }, [id]);

    const handleLogOut = () => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("additionalInfo");
        window.location.reload();
    }

    const handleRemovePhoto = (index) => {
        const isExistingPhoto = typeof photoPreviews[index] === 'string';
        const newPhotos = [...formValues.fotos];
        const newPreviews = [...photoPreviews];
        const newIds = [...formValues.id || []];

        if (isExistingPhoto) {
            const deletedId = newIds[index];
            setDeletedPhotoIds(prev => [...prev, deletedId]);
            newIds.splice(index, 1);
        }

        newPhotos.splice(index, 1);
        newPreviews.splice(index, 1);

        let newPortada = formValues.portada;
        if (index < formValues.portada) {
            newPortada -= 1;
        } else if (index === formValues.portada) {
            newPortada = null;
        }

        setFormValues(prev => ({
            ...prev,
            fotos: newPhotos,
            id: newIds,
            portada: newPortada,
        }));
        setPhotoPreviews(newPreviews);
    };

    const deleteRemovedPhotos = async (retried = false) => {
        try {
            for (const photoId of deletedPhotoIds) {
                const response = await fetch(`http://localhost:8000/api/propiedades/fotos-propiedades/${photoId}/`, {
                    method: 'DELETE',
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('accessToken')}`
                    }
                });

                if (response.status === 401 && !retried) {
                    const token = await refreshAccessToken();
                    if (token) {
                        await deleteRemovedPhotos(true);
                        return;
                    } else {
                        handleLogOut();
                        return;
                    }
                }

                if (!response.ok) {
                    console.error('Error al eliminar la foto', await response.text());
                }
            }
            setDeletedPhotoIds([]); // Limpiar IDs después de eliminación
        } catch (error) {
            console.error('Error al eliminar las fotos', error);
        }
    };

    const handlePortadaChange = (index) => {
        setFormValues((prev) => ({ ...prev, portada: index }));
    }

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormValues({ ...formValues, [name]: type === "checkbox" ? checked : value });
    }

    const fetchPropertyDetails = async (id, retried = false) => {
        try {
            const response = await fetch(`http://localhost:8000/api/propiedades/propiedades/${id}/`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("accessToken")}`
                }
            });
            if (response.status === 401 && retried === false) {
                console.log("Token expirado");
                const token = await refreshAccessToken();
                if (token) {
                    fetchPropertyDetails(id, true);
                } else {
                    console.log("Token inválido, cerrando sesión...");
                    handleLogOut();
                }
            }
            if (response.ok) {
                const data = await response.json();
                setFormValues(data);
                setPhotoPreviews(data.fotos || []);
            } else {
                console.log("Error al obtener la propiedad");
            }
        } catch (error) {
            console.error("Error al obtener la propiedad", error);
        }
    }

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length + formValues.fotos.length > 10) {
            setErrors({ ...errors, fotos: "Máximo 10 fotos permitidas" });
            return;
        }

        const newPreviews = files.map(file => URL.createObjectURL(file));
        setPhotoPreviews([...photoPreviews, ...newPreviews]);

        setFormValues(prev => ({
            ...prev,
            fotos: [...prev.fotos, ...files]
        }));
    };

    const fetchPropertyPhotos = async (id, retried = false) => {
        try {
            const response = await fetch(`http://localhost:8000/api/propiedades/fotos-propiedades`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("accessToken")}`
                }
            });
            if (response.status === 401 && retried === false) {
                console.log("Token expirado");
                const token = await refreshAccessToken();
                if (token) {
                    fetchPropertyPhotos(id, true);
                } else {
                    console.log("Token inválido, cerrando sesión...");
                    handleLogOut();
                }
            }
            if (response.ok) {
                const data = await response.json();
                const fotos = await data.filter(foto => foto.propiedad === parseInt(id));
                setFormValues((prev) => ({ ...prev, fotos: fotos.map(foto => foto.foto), id: fotos.map(foto => foto.id) }));
                const portada = fotos.find(foto => foto.es_portada === true);
                setFormValues((prev) => ({ ...prev, portada: fotos.indexOf(portada) }));
                setPhotoPreviews(fotos.map(foto => foto.foto));
            } else {
                console.log("Error al obtener las fotos de la propiedad");
            }
        } catch (error) {
            console.error("Error al obtener las fotos de la propiedad", error);
        }
    }

    const validateForm = async () => {
        const errors = {};
        const codigoPostalRegex = /^\d{5}$/;

        const empiezaConLetraRegex = /^[a-zA-Z]/;

        try {
            const response = await fetch("http://localhost:8000/api/propiedades/propiedades/")
            const propiedades = await response.json();
            const existeNombrePropiedad = propiedades.filter(propiedad => propiedad.id != id && propiedad.nombre === formValues.nombre).length > 0;
            console.log(existeNombrePropiedad);
            if (existeNombrePropiedad) {
                errors.nombre = "Ya existe una propiedad con ese nombre";
            }
            setErrors(errors);
        } catch (error) {
            console.error("Error al validar el nombre de la propiedad", error);
        }

        if (formValues.portada === null) {
            errors.portada = "Debes seleccionar una foto como portada";
        }

        if (!formValues.nombre || formValues.nombre.length > 100 || !empiezaConLetraRegex.test(formValues.nombre)) {
            errors.nombre = "El nombre es obligatorio, debe tener menos de 100 caracteres y debe comenzar con una letra";
        }

        if (!formValues.descripcion || !empiezaConLetraRegex.test(formValues.descripcion)) {
            errors.descripcion = "La descripción es obligatoria y debe comenzar con una letra";
        }

        if (!formValues.direccion || formValues.direccion.length > 255 || !empiezaConLetraRegex.test(formValues.direccion)) {
            errors.direccion = "La dirección es obligatoria, debe tener menos de 255 caracteres y debe comenzar con una letra";
        }

        if (!formValues.ciudad || formValues.ciudad.length > 100 || !empiezaConLetraRegex.test(formValues.ciudad)) {
            errors.ciudad = "La ciudad es obligatoria, debe tener menos de 100 caracteres y debe comenzar con una letra";
        }

        if (!formValues.pais || formValues.pais.length > 100 || !empiezaConLetraRegex.test(formValues.pais)) {
            errors.pais = "El país es obligatorio, debe tener menos de 100 caracteres y debe comenzar con una letra";
        }

        if (!codigoPostalRegex.test(formValues.codigo_postal)) {
            errors.codigo_postal = "El código postal debe tener 5 dígitos";
        }

        if (!formValues.tipo_de_propiedad) {
            errors.tipo_de_propiedad = "El tipo de propiedad es obligatorio";
        }

        if (!formValues.precio_por_noche || formValues.precio_por_noche < 1 || formValues.precio_por_noche > 5000) {
            errors.precio_por_noche = "El precio por noche es obligatorio, debe ser mayor que 0 y menor que 5000";
        }

        if (!formValues.maximo_huespedes || formValues.maximo_huespedes < 1 || formValues.maximo_huespedes > 10) {
            errors.maximo_huespedes = "El máximo de huéspedes es obligatorio, debe ser mayor que 0 y menor que 10";
        }

        if (!formValues.numero_de_habitaciones || formValues.numero_de_habitaciones < 1 || formValues.numero_de_habitaciones > 10) {
            errors.numero_de_habitaciones = "El número de habitaciones es obligatorio, debe ser mayor que 0 y menor que 10";
        }

        if (!formValues.numero_de_banos || formValues.numero_de_banos < 1 || formValues.numero_de_banos > 10) {
            errors.numero_de_banos = "El número de baños es obligatorio, debe ser mayor que 0 y menor que 10";
        }

        if (!formValues.numero_de_camas || formValues.numero_de_camas < 1 || formValues.numero_de_camas > 10) {
            errors.numero_de_camas = "El número de camas es obligatorio, debe ser mayor que 0 y menor que 10";
        }

        if (!formValues.tamano || formValues.tamano < 10 || formValues.tamano > 1000) {
            errors.tamano = "El tamaño es obligatorio, debe ser mayor que 10 y menor que 1000";
        }

        if (!formValues.politica_de_cancelacion) {
            errors.politica_de_cancelacion = "La política de cancelación es obligatoria";
        }
        if ((formValues.fotos?.length || 0) < 4) {
            errors.fotos = "Debes subir al menos 4 fotos";
        }

        setErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const updatePropertyPhotos = async (retried = false) => {
        try {
            for (let index = 0; index < formValues.fotos.length; index++) {
                const foto = formValues.fotos[index];
                const photoId = formValues.id[index] || null;

                const formData = new FormData();

                if (foto instanceof File) {
                    formData.append('foto', foto);
                }

                formData.append('es_portada', formValues.portada === index ? 'True' : 'False');

                if (photoId) {
                    formData.append('id', photoId);
                }
                formData.append('propiedadId', id);


                const method = photoId ? 'PATCH' : 'POST';
                const url = photoId
                    ? `http://localhost:8000/api/propiedades/fotos-propiedades/${photoId}/`
                    : `http://localhost:8000/api/propiedades/fotos-propiedades/`;

                const response = await fetch(url, {
                    method: method,
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("accessToken")}`
                    },
                    body: formData
                });

                if (response.status === 401 && retried === false) {
                    console.log("Token expirado");
                    const token = await refreshAccessToken();
                    if (token) {
                        updatePropertyPhotos(true);
                    } else {
                        console.log("Token inválido, cerrando sesión...");
                        handleLogOut();
                    }
                }
                if (!response.ok) {
                    console.log("Error al actualizar las fotos de la propiedad");
                }
            }
        } catch (error) {
            console.error("Error al actualizar las fotos de la propiedad", error);
        }
    };


    const handleSubmit = async (e, retried = false) => {
        e.preventDefault();
        if (await validateForm()) {
            try {
                const response = await fetch(`http://localhost:8000/api/propiedades/propiedades/${id}/`, {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localStorage.getItem("accessToken")}`
                    },
                    body: JSON.stringify(formValues)
                });

                if (response.status === 401 && retried === false) {
                    const token = await refreshAccessToken();
                    if (token) {
                        handleSubmit(e, true);
                    } else {
                        handleLogOut();
                    }
                    return;
                }

                if (response.ok) {
                    await updatePropertyPhotos();
                    await deleteRemovedPhotos(); // Eliminar fotos marcadas
                    navigate("/mis-propiedades");
                } else {
                    console.log("Error al editar la propiedad");
                }
            } catch (error) {
                console.error("Error al editar la propiedad", error);
            }
        }
    };

    return (
        <Box sx={{
            minHeight: "80vh",
            display: "flex",
            flexDirection: "column",
            bgcolor: "#f5f7fa",
            py: 4
        }}>
            {loading ? (
                <Container maxWidth="lg" sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: "60vh"
                }}>
                    <CircularProgress />
                </Container>
            ) : (
                <Container maxWidth="lg">
                    <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
                        <Typography variant="h4" gutterBottom fontWeight="500" color="primary" align="center">
                            Editar propiedad
                        </Typography>
                        <Divider sx={{ mb: 4 }} />

                        <Box component="form" onSubmit={handleSubmit}>
                            <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: 3, mb: 4 }}>
                                {/* Primera columna */}
                                <Box sx={{ flex: 1 }}>
                                    <Typography variant="h6" gutterBottom fontWeight="500" color="text.secondary">
                                        Información básica
                                    </Typography>
                                    <Stack spacing={2.5}>
                                        <TextField
                                            label="Nombre"
                                            name="nombre"
                                            variant="outlined"
                                            fullWidth
                                            value={formValues.nombre}
                                            onChange={handleChange}
                                            required
                                            error={!!errors.nombre}
                                            helperText={errors.nombre}
                                            size="small"
                                        />
                                        <TextField
                                            label="Descripción"
                                            name="descripcion"
                                            variant="outlined"
                                            fullWidth
                                            multiline
                                            rows={3}
                                            value={formValues.descripcion}
                                            onChange={handleChange}
                                            required
                                            error={!!errors.descripcion}
                                            helperText={errors.descripcion}
                                        />
                                        <TextField
                                            label="Dirección"
                                            name="direccion"
                                            variant="outlined"
                                            fullWidth
                                            value={formValues.direccion}
                                            onChange={handleChange}
                                            required
                                            error={!!errors.direccion}
                                            helperText={errors.direccion}
                                            size="small"
                                        />
                                        <Box sx={{ display: "flex", gap: 2 }}>
                                            <FormControl fullWidth size="small" variant="outlined" error={!!errors.ciudad}>
                                                <InputLabel>Ciudad</InputLabel>
                                                <Select
                                                    name="ciudad"
                                                    value={formValues.ciudad}
                                                    onChange={handleChange}
                                                    label="Ciudad"
                                                    required
                                                    renderValue={(selected) => selected || "Selecciona una ciudad"}
                                                >
                                                    <MenuItem value="" disabled>
                                                        Selecciona una ciudad
                                                    </MenuItem>
                                                    {ciudadesEspana.map((ciudad) => (
                                                        <MenuItem key={ciudad} value={ciudad}>
                                                            {ciudad}
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                                <FormHelperText>{errors.ciudad}</FormHelperText>
                                            </FormControl>
                                            <TextField
                                                label="Código Postal"
                                                name="codigo_postal"
                                                variant="outlined"
                                                fullWidth
                                                value={formValues.codigo_postal}
                                                onChange={handleChange}
                                                required
                                                error={!!errors.codigo_postal}
                                                helperText={errors.codigo_postal}
                                                size="small"
                                            />
                                        </Box>
                                        <TextField
                                            label="País"
                                            name="pais"
                                            variant="outlined"
                                            fullWidth
                                            value="España"
                                            disabled
                                            size="small"
                                        />
                                    </Stack>
                                </Box>

                                {/* Segunda columna */}
                                <Box sx={{ flex: 1 }}>
                                    <Typography variant="h6" gutterBottom fontWeight="500" color="text.secondary">
                                        Detalles del alojamiento
                                    </Typography>
                                    <Stack spacing={2.5}>
                                        <FormControl variant="outlined" fullWidth error={!!errors.tipo_de_propiedad} size="small">
                                            <InputLabel>Tipo de Propiedad</InputLabel>
                                            <Select
                                                name="tipo_de_propiedad"
                                                value={formValues.tipo_de_propiedad}
                                                onChange={handleChange}
                                                label="Tipo de Propiedad"
                                                required
                                            >
                                                <MenuItem value="Apartamento">Apartamento</MenuItem>
                                                <MenuItem value="Casa">Casa</MenuItem>
                                                <MenuItem value="Villa">Villa</MenuItem>
                                            </Select>
                                            <FormHelperText>{errors.tipo_de_propiedad}</FormHelperText>
                                        </FormControl>

                                        <Box sx={{ display: "flex", gap: 2 }}>
                                            <TextField
                                                label="Precio por Noche"
                                                name="precio_por_noche"
                                                type="number"
                                                variant="outlined"
                                                fullWidth
                                                value={formValues.precio_por_noche}
                                                onChange={handleChange}
                                                required
                                                error={!!errors.precio_por_noche}
                                                helperText={errors.precio_por_noche}
                                                size="small"
                                                InputProps={{
                                                    startAdornment: <Typography sx={{ mr: 0.5 }}>€</Typography>
                                                }}
                                            />
                                            <TextField
                                                label="Tamaño (m²)"
                                                name="tamano"
                                                type="number"
                                                variant="outlined"
                                                fullWidth
                                                value={formValues.tamano}
                                                onChange={handleChange}
                                                required
                                                error={!!errors.tamano}
                                                helperText={errors.tamano}
                                                size="small"
                                            />
                                        </Box>

                                        <Box sx={{ display: "flex", gap: 2 }}>
                                            <TextField
                                                label="Habitaciones"
                                                name="numero_de_habitaciones"
                                                type="number"
                                                variant="outlined"
                                                fullWidth
                                                value={formValues.numero_de_habitaciones}
                                                onChange={handleChange}
                                                required
                                                error={!!errors.numero_de_habitaciones}
                                                helperText={errors.numero_de_habitaciones}
                                                size="small"
                                            />
                                            <TextField
                                                label="Camas"
                                                name="numero_de_camas"
                                                type="number"
                                                variant="outlined"
                                                fullWidth
                                                value={formValues.numero_de_camas}
                                                onChange={handleChange}
                                                required
                                                error={!!errors.numero_de_camas}
                                                helperText={errors.numero_de_camas}
                                                size="small"
                                            />
                                        </Box>

                                        <Box sx={{ display: "flex", gap: 2 }}>
                                            <TextField
                                                label="Baños"
                                                name="numero_de_banos"
                                                type="number"
                                                variant="outlined"
                                                fullWidth
                                                value={formValues.numero_de_banos}
                                                onChange={handleChange}
                                                required
                                                error={!!errors.numero_de_banos}
                                                helperText={errors.numero_de_banos}
                                                size="small"
                                            />
                                            <TextField
                                                label="Huéspedes máx."
                                                name="maximo_huespedes"
                                                type="number"
                                                variant="outlined"
                                                fullWidth
                                                value={formValues.maximo_huespedes}
                                                onChange={handleChange}
                                                required
                                                error={!!errors.maximo_huespedes}
                                                helperText={errors.maximo_huespedes}
                                                size="small"
                                            />
                                        </Box>

                                        <FormControl variant="outlined" fullWidth size="small">
                                            <InputLabel>Política de Cancelación</InputLabel>
                                            <Select
                                                name="politica_de_cancelacion"
                                                value={formValues.politica_de_cancelacion}
                                                onChange={handleChange}
                                                label="Política de Cancelación"
                                                required
                                                error={!!errors.politica_de_cancelacion}
                                            >
                                                <MenuItem value="Flexible">Flexible</MenuItem>
                                                <MenuItem value="Moderada">Moderada</MenuItem>
                                                <MenuItem value="Estricta">Estricta</MenuItem>
                                            </Select>
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
                                                <HelpOutlineIcon sx={{ ml: 1, color: "#888", cursor: "pointer,", mt: 1 }} fontSize="small" />
                                            </Tooltip>
                                            <FormHelperText error>{errors.politica_de_cancelacion}</FormHelperText>
                                        </FormControl>
                                    </Stack>
                                </Box>
                            </Box>



                            <Box sx={{ mb: 4 }}>
                                <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
                                    <Typography variant="h6" fontWeight="500" color="text.secondary" gutterBottom>
                                        Servicios disponibles
                                    </Typography>
                                    <Box sx={{ display: "flex", flexWrap: "wrap" }}>
                                        <Box sx={{ width: { xs: "50%", sm: "33%" } }}>
                                            <FormControlLabel
                                                control={<Checkbox color="primary" name="wifi" checked={formValues.wifi} onChange={handleChange} />}
                                                label="WiFi"
                                            />
                                        </Box>
                                        <Box sx={{ width: { xs: "50%", sm: "33%" } }}>
                                            <FormControlLabel
                                                control={<Checkbox color="primary" name="aire_acondicionado" checked={formValues.aire_acondicionado} onChange={handleChange} />}
                                                label="Aire Acondicionado"
                                            />
                                        </Box>
                                        <Box sx={{ width: { xs: "50%", sm: "33%" } }}>
                                            <FormControlLabel
                                                control={<Checkbox color="primary" name="calefaccion" checked={formValues.calefaccion} onChange={handleChange} />}
                                                label="Calefacción"
                                            />
                                        </Box>
                                        <Box sx={{ width: { xs: "50%", sm: "33%" } }}>
                                            <FormControlLabel
                                                control={<Checkbox color="primary" name="parking" checked={formValues.parking} onChange={handleChange} />}
                                                label="Parking"
                                            />
                                        </Box>
                                        <Box sx={{ width: { xs: "50%", sm: "33%" } }}>
                                            <FormControlLabel
                                                control={<Checkbox color="primary" name="mascotas" checked={formValues.mascotas} onChange={handleChange} />}
                                                label="Mascotas"
                                            />
                                        </Box>
                                        <Box sx={{ width: { xs: "50%", sm: "33%" } }}>
                                            <FormControlLabel
                                                control={<Checkbox color="primary" name="permitido_fumar" checked={formValues.permitido_fumar} onChange={handleChange} />}
                                                label="Permitido Fumar"
                                            />
                                        </Box>
                                    </Box>
                                </Paper>
                            </Box>

                            <Box sx={{ mb: 4 }}>
                                <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
                                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                                        <Typography variant="h6" fontWeight="500" color="text.secondary">
                                            Fotografías
                                        </Typography>
                                        <Box>
                                            <input
                                                accept="image/*"
                                                style={{ display: "none" }}
                                                id="fotos"
                                                name="fotos"
                                                type="file"
                                                multiple
                                                onChange={handleFileChange}
                                            />
                                            <label htmlFor="fotos">
                                                <Button
                                                    variant="outlined"
                                                    component="span"
                                                    startIcon={<AddPhotoAlternateIcon />}
                                                    size="small"
                                                >
                                                    Subir Fotos
                                                </Button>
                                            </label>
                                        </Box>
                                    </Box>

                                    {errors.fotos && (
                                        <Alert severity="error" sx={{ mb: 2 }}>{errors.fotos}</Alert>
                                    )}

                                    {/* {errors.portada && (
                                        <Alert severity="error" sx={{ mb: 2 }}>{errors.portada}</Alert>
                                    )} */}

                                    {photoPreviews.length > 0 && (
                                        <Typography variant="subtitle1" color="text.secondary" gutterBottom sx={{ mt: 2, fontWeight: 500 }}>
                                            Selecciona la foto de portada:
                                        </Typography>
                                    )}

                                    {errors.portada && (
                                        <Alert severity="error" sx={{ mb: 2 }}>
                                            {errors.portada}
                                        </Alert>
                                    )}

                                    <Box sx={{
                                        display: "flex",
                                        flexWrap: "wrap",
                                        gap: 3,
                                        mt: 2,
                                        justifyContent: "flex-start",
                                        width: "100%"
                                    }}>
                                        {photoPreviews.map((photo, index) => (
                                            <Paper
                                                key={index}
                                                elevation={formValues.portada === index ? 3 : 1}
                                                sx={{
                                                    position: 'relative',
                                                    width: 160,
                                                    borderRadius: 2,
                                                    overflow: 'hidden',
                                                    transition: 'all 0.3s ease',
                                                    border: formValues.portada === index ? '2px solid #1976d2' : '1px solid #e0e0e0',
                                                    '&:hover': {
                                                        transform: 'translateY(-4px)',
                                                        boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)'
                                                    }
                                                }}
                                            >
                                                <Box sx={{ position: 'relative' }}>
                                                    <img
                                                        src={photo}
                                                        alt={`Foto ${index + 1}`}
                                                        style={{
                                                            width: "100%",
                                                            height: 120,
                                                            objectFit: "cover"
                                                        }}
                                                    />
                                                    <IconButton
                                                        onClick={() => handleRemovePhoto(index)}
                                                        aria-label="Eliminar foto"
                                                        sx={{
                                                            position: 'absolute',
                                                            top: 6,
                                                            right: 6,
                                                            backgroundColor: 'rgba(255, 255, 255, 0.85)',
                                                            p: 0.5,
                                                            '&:hover': {
                                                                backgroundColor: 'rgba(255, 255, 255, 1)',
                                                                color: 'error.main'
                                                            },
                                                            width: 24,
                                                            height: 24,
                                                            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                                                        }}
                                                        size="small"
                                                    >
                                                        <CloseIcon fontSize="small" />
                                                    </IconButton>
                                                </Box>
                                                <Box sx={{ p: 1.5, bgcolor: formValues.portada === index ? 'primary.lighter' : 'transparent' }}>
                                                    <FormControlLabel
                                                        control={
                                                            <Radio
                                                                checked={formValues.portada === index}
                                                                onChange={() => handlePortadaChange(index)}
                                                                size="small"
                                                                color="primary"
                                                            />
                                                        }
                                                        label={
                                                            <Typography variant="body2" sx={{ fontWeight: formValues.portada === index ? 500 : 400 }}>
                                                                Portada
                                                            </Typography>
                                                        }
                                                        sx={{ m: 0 }}
                                                    />
                                                </Box>
                                            </Paper>
                                        ))}
                                    </Box>
                                </Paper>
                            </Box>

                            <Button
                                type="submit"
                                variant="contained"
                                color="primary"
                                size="large"
                                startIcon={<SaveIcon />}
                                fullWidth
                                sx={{
                                    py: 1.5,
                                    borderRadius: 1.5,
                                    textTransform: "none",
                                    fontWeight: 600,
                                    fontSize: "1rem",
                                    boxShadow: 2,
                                    "&:hover": { boxShadow: 4 }
                                }}
                            >
                                Guardar Cambios
                            </Button>
                        </Box>
                    </Paper>
                </Container>
            )}
        </Box>
    );
};


export default EditProperty;
