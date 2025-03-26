import React, { useState } from "react";
import {
    Box,
    Container,
    Typography,
    TextField,
    FormControlLabel,
    Checkbox,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Button,
    FormHelperText,
    Radio,
    Paper,
    IconButton,
    Divider,
    Card,
    CardMedia,
    CardContent,
    Stack
} from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import PhotoCamera from '@mui/icons-material/PhotoCamera';
import AddHomeIcon from '@mui/icons-material/AddHome';
import { useNavigate } from "react-router-dom";
import refreshAccessToken from "./RefreshToken";

const CreateProperty = () => {
    const storedInfo = localStorage.getItem("additionalInfo");
    const anfitrion = storedInfo ? JSON.parse(storedInfo).usuarioId : null;
    const [photoPreviews, setPhotoPreviews] = useState([]);

    const [formValues, setFormValues] = useState({
        anfitrion: anfitrion,
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

    const [errors, setErrors] = useState({});
    const navigate = useNavigate();

    const handleRemovePhoto = (index) => {
        const newPhotos = formValues.fotos.filter((photo, i) => i !== index);
        const newPhotoPreviews = photoPreviews.filter((photo, i) => i !== index);

        if (formValues.portada === index) {
            setFormValues({ ...formValues, fotos: newPhotos, portada: null });
        } else {
            const newPortada = formValues.portada > index ? formValues.portada - 1 : formValues.portada;
            setFormValues({ ...formValues, fotos: newPhotos, portada: newPortada });
        }

        setPhotoPreviews(newPhotoPreviews);
    };

    const handlePortadaChange = (index) => {
        setFormValues(prevState => ({ ...prevState, portada: index }));
    };

    const handleChange = (e) => {
        const { name, value, type, checked, files } = e.target;
        const newValue = type === "checkbox" ? checked : value;

        if (name === "fotos") {
            const filesArray = Array.from(files);
            const uniqueFilesArray = filesArray.filter(file =>
                !formValues.fotos.some(photo =>
                    photo.name === file.name && photo.size === file.size
                )
            );

            setFormValues(prevState => ({
                ...prevState,
                [name]: [...prevState[name], ...uniqueFilesArray]
            }));

            setPhotoPreviews(prevState => ([
                ...prevState,
                ...uniqueFilesArray.map(file => URL.createObjectURL(file))
            ]));
        } else {
            setFormValues({ ...formValues, [name]: newValue });
        }
    };

    const handleLogOut = () => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        window.location.reload();
    };

    const handleSubmit = async (e, retried = false) => {
        e.preventDefault();
        setErrors({});

        if (await validateForm()) {
            try {
                const response = await fetch("http://localhost:8000/api/propiedades/propiedades/", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localStorage.getItem("accessToken")}`
                    },
                    body: JSON.stringify(formValues)
                });

                if (response.status === 401 && !retried) {
                    console.log("Token expirado");
                    const token = await refreshAccessToken();
                    if (token) {
                        await handleSubmit(new Event("submit"), true);
                        return;
                    } else {
                        console.log("Token inválido, cerrando sesión...");
                        await handleLogOut();
                        return;
                    }
                }

                if (!response.ok) {
                    console.error("Error en la creación de la propiedad", await response.text());
                    return;
                }

                const data = await response.json();
                const propiedadId = data.id;

                if (formValues.fotos.length > 0) {
                    const formData = new FormData();
                    formValues.fotos.forEach((foto, index) => {
                        formData.append("fotos", foto);
                        formData.append("es_portada", index === formValues.portada ? "true" : "false");
                    });
                    formData.append("propiedadId", propiedadId);

                    const uploadResponse = await fetch("http://localhost:8000/api/propiedades/fotos-propiedades/upload_photos/", {
                        method: "POST",
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem("accessToken")}`
                        },
                        body: formData
                    });

                    if (!uploadResponse.ok) {
                        console.error("Error al subir las fotos", await uploadResponse.text());
                        return;
                    }
                }

                navigate("/mis-propiedades");
            } catch (error) {
                console.error("Error al crear la propiedad", error);
            }
        }
    };

    const validateForm = async () => {
        const errors = {};
        const codigoPostalRegex = /^\d{5}$/;
        const empiezaConLetraRegex = /^[a-zA-Z]/;

        try {
            const response = await fetch("http://localhost:8000/api/propiedades/propiedades/");
            const propiedades = await response.json();
            const existeNombrePropiedad = propiedades.some(propiedad => propiedad.nombre === formValues.nombre);
            if (existeNombrePropiedad) {
                errors.nombre = "Ya existe una propiedad con ese nombre";
            }
        } catch (error) {
            console.error("Error al validar el nombre de la propiedad", error);
        }

        if (formValues.portada === null && formValues.fotos.length > 0) {
            errors.portada = "Debes seleccionar una foto como portada";
        }

        if (!formValues.nombre || formValues.nombre.length > 100 || !empiezaConLetraRegex.test(formValues.nombre)) {
            errors.nombre = "El nombre es obligatorio, debe tener menos de 100 caracteres y debe comenzar con una letra";
        }

        if (!formValues.descripcion || formValues.descripcion.length > 255 || !empiezaConLetraRegex.test(formValues.descripcion)) {
            errors.descripcion = "La descripción es obligatoria, debe tener menos de 255 caracteres y debe comenzar con una letra";
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

        if (formValues.fotos.length < 4) {
            errors.fotos = "Debes subir al menos 4 fotos";
        }

        setErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // Group amenities
    const amenities = [
        { name: "wifi", label: "WiFi", checked: formValues.wifi },
        { name: "aire_acondicionado", label: "Aire Acondicionado", checked: formValues.aire_acondicionado },
        { name: "calefaccion", label: "Calefacción", checked: formValues.calefaccion },
        { name: "parking", label: "Parking", checked: formValues.parking },
        { name: "mascotas", label: "Mascotas", checked: formValues.mascotas },
        { name: "permitido_fumar", label: "Permitido Fumar", checked: formValues.permitido_fumar }
    ];

    return (
        <Box sx={{ bgcolor: "#f8f9fa", minHeight: "100vh", py: 4 }}>
            <Container maxWidth="lg">
                <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
                    <Typography variant="h4" gutterBottom sx={{
                        color: "#1e3a8a",
                        fontWeight: 600,
                        mb: 3,
                        textAlign: "center"
                    }}>
                        <AddHomeIcon sx={{ mr: 1, verticalAlign: "middle" }} />
                        Crear nueva propiedad
                    </Typography>

                    <Divider sx={{ mb: 4 }} />

                    <Box component="form" onSubmit={handleSubmit}>
                        <Box sx={{ mb: 5 }}>
                            <Typography variant="h6" gutterBottom sx={{ color: "#2c3e50", mb: 2 }}>
                                Información básica
                            </Typography>
                            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
                                <TextField
                                    label="Nombre"
                                    name="nombre"
                                    variant="outlined"
                                    value={formValues.nombre}
                                    onChange={handleChange}
                                    required
                                    error={!!errors.nombre}
                                    helperText={errors.nombre}
                                    sx={{ flexGrow: 1, minWidth: "300px" }}
                                />
                                <FormControl variant="outlined" sx={{ flexGrow: 1, minWidth: "300px" }} error={!!errors.tipo_de_propiedad}>
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
                            </Box>

                            <TextField
                                label="Descripción"
                                name="descripcion"
                                variant="outlined"
                                value={formValues.descripcion}
                                onChange={handleChange}
                                multiline
                                rows={3}
                                required
                                error={!!errors.descripcion}
                                helperText={errors.descripcion}
                                sx={{ width: "100%", mt: 2 }}
                            />
                        </Box>

                        <Box sx={{ mb: 5 }}>
                            <Typography variant="h6" gutterBottom sx={{ color: "#2c3e50", mb: 2 }}>
                                Ubicación
                            </Typography>
                            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
                                <TextField
                                    label="Dirección"
                                    name="direccion"
                                    variant="outlined"
                                    value={formValues.direccion}
                                    onChange={handleChange}
                                    required
                                    error={!!errors.direccion}
                                    helperText={errors.direccion}
                                    sx={{ flexGrow: 1, minWidth: "300px" }}
                                />
                                <TextField
                                    label="Ciudad"
                                    name="ciudad"
                                    variant="outlined"
                                    value={formValues.ciudad}
                                    onChange={handleChange}
                                    required
                                    error={!!errors.ciudad}
                                    helperText={errors.ciudad}
                                    sx={{ width: "200px" }}
                                />
                                <TextField
                                    label="Código Postal"
                                    name="codigo_postal"
                                    variant="outlined"
                                    value={formValues.codigo_postal}
                                    onChange={handleChange}
                                    required
                                    error={!!errors.codigo_postal}
                                    helperText={errors.codigo_postal}
                                    sx={{ width: "150px" }}
                                />
                                <TextField
                                    label="País"
                                    name="pais"
                                    variant="outlined"
                                    value={formValues.pais}
                                    onChange={handleChange}
                                    required
                                    error={!!errors.pais}
                                    helperText={errors.pais}
                                    sx={{ width: "200px" }}
                                />
                            </Box>


                        </Box>

                        <Box sx={{ mb: 5 }}>
                            <Typography variant="h6" gutterBottom sx={{ color: "#2c3e50", mb: 2 }}>
                                Detalles de la propiedad
                            </Typography>
                            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
                                <TextField
                                    label="Precio por Noche (€)"
                                    name="precio_por_noche"
                                    type="number"
                                    variant="outlined"
                                    value={formValues.precio_por_noche}
                                    onChange={handleChange}
                                    required
                                    error={!!errors.precio_por_noche}
                                    helperText={errors.precio_por_noche}
                                    sx={{ width: "200px" }}
                                />
                                <TextField
                                    label="Máximo de Huéspedes"
                                    name="maximo_huespedes"
                                    type="number"
                                    variant="outlined"
                                    value={formValues.maximo_huespedes}
                                    onChange={handleChange}
                                    required
                                    error={!!errors.maximo_huespedes}
                                    helperText={errors.maximo_huespedes}
                                    sx={{ width: "200px" }}
                                />
                                <TextField
                                    label="Número de Habitaciones"
                                    name="numero_de_habitaciones"
                                    type="number"
                                    variant="outlined"
                                    value={formValues.numero_de_habitaciones}
                                    onChange={handleChange}
                                    required
                                    error={!!errors.numero_de_habitaciones}
                                    helperText={errors.numero_de_habitaciones}
                                    sx={{ width: "200px" }}
                                />
                                <TextField
                                    label="Número de Baños"
                                    name="numero_de_banos"
                                    type="number"
                                    variant="outlined"
                                    value={formValues.numero_de_banos}
                                    onChange={handleChange}
                                    required
                                    error={!!errors.numero_de_banos}
                                    helperText={errors.numero_de_banos}
                                    sx={{ width: "200px" }}
                                />
                                <TextField
                                    label="Número de Camas"
                                    name="numero_de_camas"
                                    type="number"
                                    variant="outlined"
                                    value={formValues.numero_de_camas}
                                    onChange={handleChange}
                                    required
                                    slotProps={{ input: { min: 1 } }}
                                    error={!!errors.numero_de_camas}
                                    helperText={errors.numero_de_camas}
                                    sx={{ width: "200px" }}
                                />
                                <TextField
                                    label="Tamaño (m²)"
                                    name="tamano"
                                    type="number"
                                    variant="outlined"
                                    value={formValues.tamano}
                                    onChange={handleChange}
                                    required
                                    error={!!errors.tamano}
                                    helperText={errors.tamano}
                                    sx={{ width: "200px" }}
                                />
                                <FormControl variant="outlined" sx={{ width: "200px" }} error={!!errors.politica_de_cancelacion}>
                                    <InputLabel>Política de Cancelación</InputLabel>
                                    <Select
                                        name="politica_de_cancelacion"
                                        value={formValues.politica_de_cancelacion}
                                        onChange={handleChange}
                                        label="Política de Cancelación"
                                        required
                                    >
                                        <MenuItem value="Flexible">Flexible</MenuItem>
                                        <MenuItem value="Moderada">Moderada</MenuItem>
                                        <MenuItem value="Estricta">Estricta</MenuItem>
                                    </Select>
                                    <FormHelperText>{errors.politica_de_cancelacion}</FormHelperText>
                                </FormControl>
                            </Box>
                        </Box>

                        <Box sx={{ mb: 5 }}>
                            <Typography variant="h6" gutterBottom sx={{ color: "#2c3e50", mb: 2 }}>
                                Servicios y amenidades
                            </Typography>
                            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
                                {amenities.map((amenity) => (
                                    <FormControlLabel
                                        key={amenity.name}
                                        control={
                                            <Checkbox
                                                name={amenity.name}
                                                checked={amenity.checked}
                                                onChange={handleChange}
                                            />
                                        }
                                        label={amenity.label}
                                        sx={{
                                            border: "1px solid #e2e8f0",
                                            borderRadius: 1,
                                            p: 1,
                                            width: "200px",
                                            m: 0
                                        }}
                                    />
                                ))}
                            </Box>
                        </Box>

                        <Box sx={{ mb: 5 }}>
                            <Typography variant="h6" gutterBottom sx={{ color: "#2c3e50", mb: 2 }}>
                                Fotografías
                            </Typography>
                            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                                <input
                                    accept="image/*"
                                    style={{ display: "none" }}
                                    id="fotos"
                                    name="fotos"
                                    type="file"
                                    multiple
                                    onChange={handleChange}
                                />
                                <label htmlFor="fotos">
                                    <Button
                                        variant="contained"
                                        component="span"
                                        startIcon={<PhotoCamera />}
                                        sx={{
                                            bgcolor: "#334155",
                                            "&:hover": { bgcolor: "#1e293b" }
                                        }}
                                    >
                                        Subir Fotos
                                    </Button>
                                </label>
                                <Typography variant="body2" color="textSecondary" sx={{ ml: 2 }}>
                                    Mínimo 4 fotos. Selecciona una como portada.
                                </Typography>
                            </Box>

                            {errors.fotos && (
                                <FormHelperText error sx={{ ml: 1, mb: 2 }}>
                                    {errors.fotos}
                                </FormHelperText>
                            )}

                            {errors.portada && (
                                <FormHelperText error sx={{ ml: 1, mb: 2 }}>
                                    {errors.portada}
                                </FormHelperText>
                            )}

                            {photoPreviews.length > 0 && (
                                <Box sx={{ mt: 2 }}>
                                    <Typography variant="subtitle1" gutterBottom>
                                        Fotografías seleccionadas:
                                    </Typography>
                                    <Box
                                        sx={{
                                            display: "flex",
                                            flexWrap: "wrap",
                                            gap: 2,
                                            justifyContent: "center"  // Mejor alineación
                                        }}
                                    >
                                        {photoPreviews.map((photo, index) => (
                                            <Card
                                                key={index}
                                                sx={{
                                                    width: 200,
                                                    position: "relative",
                                                    transition: "transform 0.3s, box-shadow 0.3s",
                                                    "&:hover": {
                                                        transform: "translateY(-5px)",
                                                        boxShadow: 6,
                                                        "& .MuiCardMedia-root": {
                                                            filter: "brightness(1.1)",
                                                        }
                                                    },
                                                    overflow: "hidden",
                                                    borderRadius: 2,
                                                    boxShadow: 3
                                                }}
                                            >
                                                <CardMedia
                                                    component="img"
                                                    height="150"  // Aumenté la altura para mejor visualización
                                                    image={photo}
                                                    alt={`Foto ${index + 1}`}
                                                    sx={{
                                                        transition: "filter 0.3s, transform 0.5s",
                                                        "&:hover": {
                                                            transform: "scale(1.05)",
                                                        }
                                                    }}
                                                />
                                                <IconButton
                                                    onClick={() => handleRemovePhoto(index)}
                                                    size="small"
                                                    sx={{
                                                        position: "absolute",
                                                        top: 8,
                                                        right: 8,
                                                        bgcolor: "rgba(255, 255, 255, 0.7)",
                                                        "&:hover": {
                                                            bgcolor: "rgba(255, 255, 255, 0.9)",
                                                            color: "error.main"
                                                        },
                                                        zIndex: 2,
                                                        padding: 0.5
                                                    }}
                                                >
                                                    <CloseIcon fontSize="small" />
                                                </IconButton>
                                                <CardContent
                                                    sx={{
                                                        p: 1.5,
                                                        backgroundColor: "background.paper",
                                                        transition: "background-color 0.3s",
                                                        "&:hover": {
                                                            backgroundColor: "action.hover"
                                                        }
                                                    }}
                                                >
                                                    <FormControlLabel
                                                        control={
                                                            <Radio
                                                                checked={formValues.portada === index}
                                                                onChange={() => handlePortadaChange(index)}
                                                                size="small"
                                                                sx={{
                                                                    color: "primary.light",
                                                                    '&.Mui-checked': {
                                                                        color: "primary.main",
                                                                    }
                                                                }}
                                                            />
                                                        }
                                                        label="Portada"
                                                        sx={{
                                                            margin: 0,
                                                            "& .MuiTypography-root": {
                                                                fontSize: "0.875rem",
                                                                fontWeight: formValues.portada === index ? "medium" : "normal"
                                                            }
                                                        }}
                                                    />
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </Box>
                                </Box>
                            )}
                        </Box>

                        <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 4 }}>
                            <Button
                                type="submit"
                                variant="contained"
                                size="large"
                                sx={{
                                    bgcolor: "#1e3a8a",
                                    px: 4,
                                    py: 1,
                                    "&:hover": { bgcolor: "#1e40af" }
                                }}
                            >
                                Crear propiedad
                            </Button>
                        </Box>
                    </Box>
                </Paper>
            </Container>
        </Box>
    );
};

export default CreateProperty;