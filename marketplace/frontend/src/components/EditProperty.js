import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import refreshAccessToken from "./RefreshToken";
import { Box, Container, Typography, TextField, FormControl, InputLabel, Select, MenuItem, FormHelperText, Button, FormControlLabel, Checkbox, Radio, CircularProgress } from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import { set } from "date-fns";

const EditProperty = () => {

    const id = useParams().propiedadId;
    const storedInfo = localStorage.getItem("additionalInfo");
    const usuarioId = storedInfo ? JSON.parse(storedInfo).usuarioId : null;
    const [photoPreviews, setPhotoPreviews] = useState([]);
    const [errors, setErrors] = useState({});
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
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
        latitud: "",
        longitud: "",
        politica_de_cancelacion: "",
        fotos: [],
        portada: null
    });

    useEffect(() => {
        const fetchData = async () => {

            await fetchPropertyDetails(id);
            await fetchPropertyPhotos(id);
            setLoading(false);
        }
        fetchData();
    }
        , [id]);

    const handleLogOut = () => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("additionalInfo");
        window.location.reload();
    }

    const handleRemovePhoto = (index) => {
        const newPhotos = photoPreviews.filter((photo, i) => i !== index);
        setPhotoPreviews(newPhotos);
    }

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
                setFormValues((prev) => ({ ...prev, fotos: fotos.map(foto => foto.foto) }));
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
        const latitudValida = (lat) => lat >= -90 && lat <= 90;
        const longitudValida = (lng) => lng >= -180 && lng <= 180;
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

        if (formValues.latitud && !latitudValida(formValues.latitud)) {
            errors.latitud = "La latitud debe estar entre -90 y 90 grados";
        }

        if (formValues.longitud && !longitudValida(formValues.longitud)) {
            errors.longitud = "La longitud debe estar entre -180 y 180 grados";
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

    const updatePropertyPhotos = async (id, retried = false) => {
        try {
            const response = await fetch(`http://localhost:8000/api/propiedades/fotos-propiedades/`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("accessToken")}`
                },
                body: JSON.stringify({ propiedad: id, fotos: formValues.fotos, es_portada: formValues.portada })
            });
            if (response.status === 401 && retried === false) {
                console.log("Token expirado");
                const token = await refreshAccessToken();
                if (token) {
                    updatePropertyPhotos(id, true);
                } else {
                    console.log("Token inválido, cerrando sesión...");
                    handleLogOut();
                }
            }
            if (response.ok) {
                console.log("Fotos actualizadas");
            } else {
                console.log("Error al actualizar las fotos de la propiedad");
            }
        } catch (error) {
            console.error("Error al actualizar las fotos de la propiedad", error);
        }
    }


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
                    console.log("Token expirado");
                    const token = await refreshAccessToken();
                    if (token) {
                        handleSubmit(e, true);
                    } else {
                        console.log("Token inválido, cerrando sesión...");
                        handleLogOut();
                    }
                }
                if (response.ok) {
                    await updatePropertyPhotos(id);
                    navigate("/mis-propiedades");
                } else {
                    console.log("Error al editar la propiedad");
                }
            }
            catch (error) {
                console.error("Error al editar la propiedad", error);
            }
        }
    };

    return (
        <Box sx={{ minHeight: "80vh", display: "flex", flexDirection: "column", bgcolor: "#f4f7fc" }}>
            {loading ? (
                <Container maxWidth={false} sx={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "80vh", flexDirection: "column", width: "100%" }}>
                    <CircularProgress />
                </Container>

            ) : (

                <Container maxWidth={false} sx={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "80vh", flexDirection: "column", width: "100%" }}>
                    <Box sx={{ mt: "20px" }}><Typography variant="h4" gutterBottom> Editar propiedad</Typography></Box>
                    <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "row", width: "100%", maxWidth: "1200px", marginTop: "20px" }}>
                        <Box sx={{ display: "flex", flexDirection: "column", width: "25%", paddingRight: "10px" }}>
                            <TextField label="Nombre" name="nombre" variant="outlined" value={formValues.nombre} onChange={handleChange} sx={{ marginBottom: "20px" }} required error={!!errors.nombre} helperText={errors.nombre} />
                            <TextField label="Descripción" name="descripcion" variant="outlined" value={formValues.descripcion} onChange={handleChange} sx={{ marginBottom: "20px" }} required error={!!errors.descripcion} helperText={errors.descripcion} />
                            <TextField label="Dirección" name="direccion" variant="outlined" value={formValues.direccion} onChange={handleChange} sx={{ marginBottom: "20px" }} required error={!!errors.direccion} helperText={errors.direccion} />
                            <TextField label="Ciudad" name="ciudad" variant="outlined" value={formValues.ciudad} onChange={handleChange} sx={{ marginBottom: "20px" }} required error={!!errors.ciudad} helperText={errors.ciudad} />
                            <TextField label="Pais" name="pais" variant="outlined" value={formValues.pais} onChange={handleChange} sx={{ marginBottom: "20px" }} required error={!!errors.pais} helperText={errors.pais} />
                            <TextField label="Código Postal" name="codigo_postal" variant="outlined" value={formValues.codigo_postal} onChange={handleChange} sx={{ marginBottom: "20px" }} required error={!!errors.codigo_postal} helperText={errors.codigo_postal} />
                        </Box>
                        <Box sx={{ display: "flex", flexDirection: "column", width: "25%", paddingRight: "10px" }}>
                            <FormControl variant="outlined" sx={{ marginBottom: "20px" }} error={!!errors.tipo_de_propiedad} >
                                <InputLabel>Tipo de Propiedad</InputLabel>
                                <Select name="tipo_de_propiedad" value={formValues.tipo_de_propiedad} onChange={handleChange} label="Tipo de Propiedad" required  >
                                    <MenuItem value="Apartamento">Apartamento</MenuItem>
                                    <MenuItem value="Casa">Casa</MenuItem>
                                    <MenuItem value="Villa">Villa</MenuItem>
                                </Select>
                                <FormHelperText>{errors.tipo_de_propiedad}</FormHelperText>
                            </FormControl>
                            <TextField label="Precio por Noche" name="precio_por_noche" type="number" variant="outlined" value={formValues.precio_por_noche} onChange={handleChange} sx={{ marginBottom: "20px" }} required error={!!errors.precio_por_noche} helperText={errors.precio_por_noche} />
                            <TextField label="Máximo de Huéspedes" name="maximo_huespedes" type="number" variant="outlined" value={formValues.maximo_huespedes} onChange={handleChange} sx={{ marginBottom: "20px" }} required error={!!errors.maximo_huespedes} helperText={errors.maximo_huespedes} />
                            <TextField label="Número de Habitaciones" name="numero_de_habitaciones" type="number" variant="outlined" value={formValues.numero_de_habitaciones} onChange={handleChange} sx={{ marginBottom: "20px" }} required error={!!errors.numero_de_habitaciones} helperText={errors.numero_de_habitaciones} />
                            <TextField label="Número de Baños" name="numero_de_banos" type="number" variant="outlined" value={formValues.numero_de_banos} onChange={handleChange} sx={{ marginBottom: "20px" }} required error={!!errors.numero_de_banos} helperText={errors.numero_de_banos} />
                        </Box>
                        <Box sx={{ display: "flex", flexDirection: "column", width: "25%", paddingRight: "10px" }}>
                            <TextField label="Número de Camas" name="numero_de_camas" type="number" variant="outlined" value={formValues.numero_de_camas} onChange={handleChange} sx={{ marginBottom: "20px" }} required slotProps={{ input: { min: 1 } }} error={!!errors.numero_de_camas} helperText={errors.numero_de_camas} />
                            <TextField label="Tamaño (m²)" name="tamano" type="number" variant="outlined" value={formValues.tamano} onChange={handleChange} sx={{ marginBottom: "20px" }} required error={!!errors.tamano} helperText={errors.tamano} />
                            <TextField label="Latitud" name="latitud" type="number" variant="outlined" value={formValues.latitud} onChange={handleChange} sx={{ marginBottom: "20px" }} required error={!!errors.latitud} helperText={errors.latitud} />
                            <TextField label="Longitud" name="longitud" type="number" variant="outlined" value={formValues.longitud} onChange={handleChange} sx={{ marginBottom: "20px" }} error={!!errors.longitud} helperText={errors.longitud} />
                            <FormControl variant="outlined" sx={{ marginBottom: "20px" }}>
                                <InputLabel>Política de Cancelación</InputLabel>
                                <Select name="politica_de_cancelacion" value={formValues.politica_de_cancelacion} onChange={handleChange} label="Política de Cancelación" required error={!!errors.politica_de_cancelacion}  >
                                    <MenuItem value="Flexible">Flexible</MenuItem>
                                    <MenuItem value="Moderada">Moderada</MenuItem>
                                    <MenuItem value="Estricta">Estricta</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>
                        <Box sx={{ display: "flex", flexDirection: "column", width: "25%", paddingLeft: "10px" }}>
                            <FormControlLabel control={<Checkbox name="wifi" checked={formValues.wifi} onChange={handleChange} />} label="WiFi" />
                            <FormControlLabel control={<Checkbox name="aire_acondicionado" checked={formValues.aire_acondicionado} onChange={handleChange} />} label="Aire Acondicionado" />
                            <FormControlLabel control={<Checkbox name="calefaccion" checked={formValues.calefaccion} onChange={handleChange} />} label="Calefacción" />
                            <FormControlLabel control={<Checkbox name="parking" checked={formValues.parking} onChange={handleChange} />} label="Parking" />
                            <FormControlLabel control={<Checkbox name="mascotas" checked={formValues.mascotas} onChange={handleChange} />} label="Mascotas" />
                            <FormControlLabel control={<Checkbox name="permitido_fumar" checked={formValues.permitido_fumar} onChange={handleChange} />} label="Permitido Fumar" />
                            <input accept="image/*" style={{ display: "none" }} id="fotos" name="fotos" type="file" multiple onChange={handleChange} />
                            <label htmlFor="fotos">
                                <Button variant="contained" component="span" sx={{ mt: "20px" }}>
                                    Subir Fotos
                                </Button>
                            </label>

                            {errors.fotos && <FormHelperText error>{errors.fotos}</FormHelperText>}
                            <Button type="submit" sx={{ bgcolor: "#1976d2", mt: "135px", color: "white", padding: "10px 20px", borderRadius: "8px", '&:hover': { backgroundColor: "#1565c0" } }}>
                                Guardar cambios
                            </Button>
                        </Box>
                    </Box>
                    {photoPreviews.length > 0 && <Typography variant="h6" gutterBottom sx={{ marginTop: "20px" }}>Selecciona la foto de portada:</Typography>}
                    {errors.portada && <FormHelperText error>{errors.portada}</FormHelperText>}
                    <Box sx={{ display: "flex", flexDirection: "row", width: "100%", maxWidth: "1200px", marginTop: "20px", justifyContent: "center" }}>
                        {photoPreviews.length > 0 && (
                            <>
                                <Box sx={{ display: "flex", flexDirection: "row", flexWrap: "wrap", gap: 1, alignItems: "center", justifyContent: "center" }}>
                                    {photoPreviews.map((photo, index) => (
                                        <Box key={index} sx={{ position: 'relative', margin: '10px', display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'center', justifyContent: "center" }}>
                                            <img src={photo} alt={`Foto ${index + 1}`} style={{ width: "150px", height: "auto", objectFit: "cover", borderRadius: "8px" }} />
                                            <Button onClick={() => handleRemovePhoto(index)} sx={{ position: 'absolute', top: '5px', right: '5px', minWidth: "16px", minHeight: "16px", backgroundColor: 'rgba(255, 255, 255, 0.8)', borderRadius: "50%" }}><CloseIcon sx={{ fontSize: "16px", color: "red" }} /></Button>
                                            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                <FormControlLabel value={index} control={<Radio />} checked={formValues.portada === index} onChange={() => handlePortadaChange(index)} sx={{ alignSelf: "center", ml: "15px" }} />
                                            </Box>
                                        </Box>
                                    ))}
                                </Box>
                            </>
                        )}
                    </Box>
                </Container>
            )}
        </Box>

    );
}

export default EditProperty;