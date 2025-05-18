import { Box, Typography, Avatar, Card, CardContent, Alert, CircularProgress, Button } from "@mui/material";
import { useEffect, useState, useMemo } from "react";
import Rating from '@mui/material/Rating';
import { Comment as CommentIcon, VisibilityOff as VisibilityOffIcon, Visibility as VisibilityIcon } from '@mui/icons-material';
import { API_BASE_URL } from "../config";

const PropertyValorations = ({ propiedadId }) => {
    const [valoraciones, setValoraciones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [usuarios, setUsuarios] = useState({});
    const [mostrarValoraciones, setMostrarValoraciones] = useState(true);
    const [numeroValoraciones, setNumeroValoraciones] = useState(0);
    const usuarioId = JSON.parse(localStorage.getItem('additionalInfo'))?.usuarioId || null;

    const valoracionesFiltradas = useMemo(() => {
        return valoraciones.filter((valoracion) =>
            valoracion.propiedad === parseInt(propiedadId)
        );
    }, [valoraciones, propiedadId]);

    const valoracionPromedio = useMemo(() => {
        if (valoracionesFiltradas.length === 0) return 0;
        const suma = valoracionesFiltradas.reduce((acc, val) => acc + val.valoracion, 0);
        return (suma / valoracionesFiltradas.length).toFixed(1);
    }, [valoracionesFiltradas]);

    useEffect(() => {
        fetchPropertyValorations();
    }, [propiedadId]);

    useEffect(() => {
        const usuariosIds = [...new Set(valoracionesFiltradas.map(v => v.usuario))];
        usuariosIds.forEach(fetchUsuario);
    }, [valoracionesFiltradas]);

    const fetchUsuario = async (usuarioId) => {
        if (usuarios[usuarioId]) return;

        try {
            const response = await fetch(`${API_BASE_URL}/api/usuarios/${usuarioId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`Error al obtener usuario ${usuarioId}`);
            }

            const data = await response.json();
            setUsuarios(prev => ({
                ...prev,
                [usuarioId]: data
            }));
        } catch (error) {
            console.error('Error al cargar usuario:', error);
            setError(`No se pudo cargar la información de usuario ${usuarioId}`);
        }
    };

    const fetchPropertyValorations = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_BASE_URL}/api/propiedades/valoraciones-por-propiedad/${propiedadId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Error al obtener valoraciones');
            }

            const data = await response.json();
            setNumeroValoraciones(data.length);
            const dataFiltered = data.filter((valoracion) => valoracion.usuario !== usuarioId && valoracion.propiedad === parseInt(propiedadId));

            setValoraciones(dataFiltered);

        } catch (error) {
            console.error('Error al cargar valoraciones:', error);
            setError('No se pudieron cargar las valoraciones');
        } finally {
            setLoading(false);
        }
    };

    const toggleMostrarValoraciones = () => {
        setMostrarValoraciones(!mostrarValoraciones);
    };

    // Componente para mostrar un estado de carga
    const LoadingState = () => (
        <Box sx={{ padding: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <CircularProgress size={40} sx={{ mb: 2 }} />
            <Typography variant="body2" color="text.secondary">
                Cargando valoraciones...
            </Typography>
        </Box>
    );

    // Componente para mostrar un mensaje cuando no hay valoraciones
    const NoReviews = () => (
        <Box sx={{ padding: 3, textAlign: 'center' }}>
            <CommentIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
            <Typography variant="body1" color="text.secondary">
                Esta propiedad aún no tiene valoraciones
            </Typography>
        </Box>
    );

    // Componente para mostrar un error
    const ErrorMessage = () => (
        <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
            {error || 'Ocurrió un error al cargar las valoraciones'}
        </Alert>
    );

    if (loading) return <LoadingState />;
    if (error) return <ErrorMessage />;
    if (valoracionesFiltradas.length === 0) return <NoReviews />;

    return (
        <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            backgroundColor: '#f8f9fa',
            borderRadius: 2,
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
            {/* Encabezado con resumen de valoraciones */}
            <Box sx={{
                padding: 3,
                backgroundColor: 'white',
                borderBottom: '1px solid #eaecef',
                display: 'flex',
                flexDirection: 'column'
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="h5" fontWeight="600" color="primary.main">
                        Valoraciones
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Rating
                            value={parseFloat(valoracionPromedio)}
                            readOnly
                            precision={0.5}
                            sx={{ mr: 1 }}
                        />
                        <Typography variant="h6" fontWeight="medium">
                            {valoracionPromedio}
                        </Typography>
                    </Box>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                        {numeroValoraciones} {valoracionesFiltradas.length === 1 ? 'valoración' : 'valoraciones'} en total
                    </Typography>
                    <Button
                        variant="outlined"
                        size="small"
                        onClick={toggleMostrarValoraciones}
                        startIcon={mostrarValoraciones ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        sx={{ ml: 2 }}
                    >
                        {mostrarValoraciones ? 'Ocultar valoraciones' : 'Mostrar valoraciones'}
                    </Button>
                </Box>
            </Box>

            {mostrarValoraciones && (
                <Box sx={{ padding: 2 }}>
                    {valoracionesFiltradas.map((valoracion, index) => {
                        const usuario = usuarios[valoracion.usuario];
                        const username = usuario?.usuario?.username || 'Usuario';

                        return (
                            <Card
                                key={valoracion.id}
                                sx={{
                                    mb: 2,
                                    transition: 'transform 0.2s, box-shadow 0.2s',
                                    '&:hover': {
                                        transform: 'translateY(-2px)',
                                        boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                                    }
                                }}
                            >
                                <CardContent>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                                        <Avatar
                                            sx={{
                                                bgcolor: 'primary.main',
                                                width: 40,
                                                height: 40,
                                                mr: 2
                                            }}
                                        >
                                            {username.charAt(0).toUpperCase()}
                                        </Avatar>
                                        <Box>
                                            <Typography variant="subtitle1" fontWeight="medium">
                                                {username}
                                            </Typography>
                                            <Rating
                                                name={`rating-${valoracion.id}`}
                                                value={valoracion.valoracion}
                                                readOnly
                                                precision={0.5}
                                                size="small"
                                            />
                                        </Box>
                                    </Box>

                                    <Typography
                                        variant="body1"
                                        sx={{
                                            lineHeight: 1.6,
                                            fontStyle: valoracion.comentario ? 'normal' : 'italic',
                                            color: valoracion.comentario ? 'text.primary' : 'text.secondary'
                                        }}
                                    >
                                        {valoracion.comentario || "Sin comentario"}
                                    </Typography>
                                </CardContent>
                            </Card>
                        );
                    })}
                </Box>
            )}
        </Box>
    );
};

export default PropertyValorations;