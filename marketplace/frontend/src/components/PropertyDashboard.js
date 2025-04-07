import React, { useEffect, useState } from 'react';
import {
    Box,
    Container,
    Typography,
    Card,
    CardContent,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    LinearProgress,
    Chip,
    useTheme,
    Stack
} from '@mui/material';
import { useParams } from 'react-router-dom';
import {
    BarChart,
    LineChart,
    Bar,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import EuroIcon from '@mui/icons-material/Euro';
import StarRateIcon from '@mui/icons-material/StarRate';
import PeopleIcon from '@mui/icons-material/People';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';

const PropertyDashboard = () => {
    const theme = useTheme();
    const usuarioId = JSON.parse(localStorage.getItem('additionalInfo'))?.usuarioId;
    const { propiedadId } = useParams();
    const [valoraciones, setValoraciones] = useState([]);
    const [propiedad, setPropiedad] = useState(null);
    const [preciosEspeciales, setPreciosEspeciales] = useState([]);
    const [propiedades, setPropiedades] = useState([]);
    const [reservas, setReservas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [dateRange, setDateRange] = useState([null, null]);

    const totalReservas = reservas.length;
    const promedioValoracion = propiedad?.valoracion_promedio || 0;
    const ingresosTotales = reservas.reduce((acc, curr) => acc + parseFloat(curr.precio_total), 0);
    const diasOcupados = reservas.reduce((totalDias, reserva) => {
        const fechaLlegada = new Date(reserva.fecha_llegada);
        const fechaSalida = new Date(reserva.fecha_salida);
        return totalDias + Math.ceil((fechaSalida - fechaLlegada) / (1000 * 60 * 60 * 24));
    }, 0);
    const ocupacionPorcentaje = (diasOcupados / 365 * 100).toFixed(1);

    const datosReservasPorMes = procesarDatosReservas(reservas);
    const datosValoraciones = procesarValoraciones(valoraciones);
    const eventosCalendario = [...reservas.map(r => ({ ...r, tipo: 'reserva' })), ...preciosEspeciales.map(p => ({ ...p, tipo: 'precio-especial' }))];

    useEffect(() => {
        fetchPropiedades();
    }, []);

    useEffect(() => {
        const fetchPreciosEspeciales = async () => {
            try {
                const response = await fetch(`http://localhost:8000/api/propiedades/precios-especiales-por-propiedad/${propiedadId}`,
                    {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                        },
                    }
                );
                if (!response.ok) {
                    throw new Error('Error fetching precios especiales');
                }
                if (response.ok) {
                    const data = await response.json();
                    setPreciosEspeciales(data);
                }
            } catch (error) {
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };

        const fetchReservas = async () => {
            try {
                const response = await fetch(`http://localhost:8000/api/propiedades/reservas-por-propiedad/${propiedadId}`,
                    {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                        },
                    }
                );
                if (!response.ok) {
                    throw new Error('Error fetching reservas');
                }
                if (response.ok) {
                    const data = await response.json();
                    setReservas(data);
                }
            } catch (error) {
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };

        const fetchValoraciones = async () => {
            try {
                const response = await fetch(`http://localhost:8000/api/propiedades/valoraciones-por-propiedad/${propiedadId}`,
                    {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                        },
                    }
                );
                if (!response.ok) {
                    throw new Error('Error fetching valoraciones');
                }
                if (response.ok) {
                    const data = await response.json();
                    setValoraciones(data);
                }
            } catch (error) {
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };

        if (propiedadId) {
            fetchReservas();
            fetchValoraciones();
            fetchPreciosEspeciales();
        }
    }, [propiedadId]);

    const fetchPropiedades = async () => {
        try {
            const response = await fetch(`http://localhost:8000/api/propiedades/propiedades-por-usuario/${usuarioId}`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                    },
                }
            );
            if (!response.ok) {
                throw new Error('Error fetching propiedades');
            }
            if (response.ok) {
                const data = await response.json();
                setPropiedades(data);
                const selectedPropiedad = data.find((prop) => prop.id === parseInt(propiedadId));
                setPropiedad(selectedPropiedad);
                if (selectedPropiedad?.anfitrion !== usuarioId) {
                    setError('No tienes permiso para ver esta propiedad');
                    window.location.href = '/mis-propiedades';
                }
            }
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <LinearProgress />;
    if (error) return <Typography color="error">{error}</Typography>;

    return (
        <Box sx={{
            p: 3,
            backgroundColor: '#f9fafc',
            minHeight: '100vh',
            backgroundImage: 'linear-gradient(to bottom, rgba(255,255,255,0.8), rgba(255,255,255,0.4))',
        }}>
            <Container maxWidth="xl">
                <Box sx={{
                    mb: 4,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: `1px solid ${theme.palette.divider}`,
                    pb: 2
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography variant="h4" sx={{
                            fontWeight: 'bold',
                            color: theme.palette.primary.dark,
                        }}>
                            {propiedad?.nombre}
                        </Typography>
                        <Chip
                            label={propiedad?.tipo_de_propiedad}
                            color="secondary"
                            variant="outlined"
                            sx={{ fontWeight: 500 }}
                        />
                    </Box>
                </Box>

                {/* Metrics Row - Using Flexbox instead of Grid */}
                <Box sx={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 3,
                    mb: 4
                }}>
                    <MetricCard
                        icon={<EventAvailableIcon />}
                        title="Reservas Totales"
                        value={totalReservas}
                        subtitle="Últimos 12 meses"
                        color={theme.palette.primary.main}
                    />
                    <MetricCard
                        icon={<EuroIcon />}
                        title="Ingresos Totales"
                        value={`€${ingresosTotales.toFixed(2)}`}
                        subtitle="Ingresos anuales"
                        color={theme.palette.success.main}
                    />
                    <MetricCard
                        icon={<StarRateIcon />}
                        title="Valoración Promedio"
                        value={promedioValoracion}
                        subtitle={`de ${valoraciones.length} reseñas`}
                        color={theme.palette.warning.main}
                    />
                    <MetricCard
                        icon={<PeopleIcon />}
                        title="Tasa de Ocupación"
                        value={`${ocupacionPorcentaje}%`}
                        subtitle="Días ocupados/año"
                        color={theme.palette.info.main}
                    />
                </Box>

                {/* Charts Section - Using CSS Grid */}
                <Box sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' },
                    gap: 3,
                    mb: 4
                }}>
                    <Card elevation={0} sx={{
                        borderRadius: 2,
                        boxShadow: '0 4px 20px 0 rgba(0,0,0,0.05)'
                    }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom sx={{ fontWeight: 500 }}>
                                Reservas e Ingresos Mensuales
                            </Typography>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={datosReservasPorMes}>
                                    <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                                    <XAxis dataKey="mes" tickLine={false} />
                                    <YAxis axisLine={false} tickLine={false} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: theme.palette.background.paper,
                                            borderRadius: 8,
                                            boxShadow: '0 4px 20px 0 rgba(0,0,0,0.1)',
                                            border: 'none'
                                        }}
                                    />
                                    <Legend wrapperStyle={{ paddingTop: 20 }} />
                                    <Bar dataKey="reservas" fill={theme.palette.primary.main} radius={[4, 4, 0, 0]} name="Reservas" />
                                    <Bar dataKey="ingresos" fill={theme.palette.success.main} radius={[4, 4, 0, 0]} name="Ingresos (€)" />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    <Card elevation={0} sx={{
                        borderRadius: 2,
                        boxShadow: '0 4px 20px 0 rgba(0,0,0,0.05)'
                    }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom sx={{ fontWeight: 500 }}>
                                Distribución de Valoraciones
                            </Typography>
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={datosValoraciones}
                                        dataKey="cantidad"
                                        nameKey="valoracion"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={80}
                                        label
                                    >
                                        {datosValoraciones.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={[
                                                    theme.palette.error.light,
                                                    theme.palette.warning.light,
                                                    theme.palette.success.light,
                                                    theme.palette.primary.light,
                                                    theme.palette.secondary.light
                                                ][index % 5]}
                                                stroke={theme.palette.background.paper}
                                                strokeWidth={2}
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: theme.palette.background.paper,
                                            borderRadius: 8,
                                            boxShadow: '0 4px 20px 0 rgba(0,0,0,0.1)',
                                            border: 'none'
                                        }}
                                    />
                                    <Legend wrapperStyle={{ paddingTop: 20 }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </Box>

                {/* Bottom Section - Using CSS Grid */}
                <Box sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                    gap: 3,
                    mb: 4
                }}>
                    <Card elevation={0} sx={{
                        borderRadius: 2,
                        boxShadow: '0 4px 20px 0 rgba(0,0,0,0.05)'
                    }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                fontWeight: 500
                            }}>
                                <CalendarTodayIcon fontSize="small" /> Calendario de Disponibilidad
                            </Typography>
                            <LocalizationProvider dateAdapter={AdapterDateFns}>
                                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                                    <DatePicker
                                        value={dateRange[0]}
                                        onChange={(newValue) => setDateRange([newValue, dateRange[1]])}
                                        slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                                        label="Fecha inicio"
                                    />
                                    <DatePicker
                                        value={dateRange[1]}
                                        onChange={(newValue) => setDateRange([dateRange[0], newValue])}
                                        slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                                        label="Fecha fin"
                                    />
                                </Box>
                            </LocalizationProvider>
                            <TableContainer
                                component={Paper}
                                sx={{
                                    mt: 2,
                                    borderRadius: 2,
                                    boxShadow: 'none',
                                    border: `1px solid ${theme.palette.divider}`
                                }}
                            >
                                <Table>
                                    <TableHead>
                                        <TableRow sx={{ backgroundColor: theme.palette.grey[50] }}>
                                            <TableCell sx={{ fontWeight: 600 }}>Fecha</TableCell>
                                            <TableCell sx={{ fontWeight: 600 }}>Tipo</TableCell>
                                            <TableCell sx={{ fontWeight: 600 }}>Detalles</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {eventosCalendario.length > 0 ? eventosCalendario.map((evento, index) => (
                                            <TableRow key={index} sx={{
                                                '&:hover': { backgroundColor: theme.palette.action.hover }
                                            }}>
                                                <TableCell>
                                                    {evento.tipo === 'reserva'
                                                        ? `${evento.fecha_llegada} - ${evento.fecha_salida}`
                                                        : `${evento.fecha_inicio} - ${evento.fecha_fin}`}
                                                </TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={evento.tipo === 'reserva' ? 'Reserva' : 'Precio Especial'}
                                                        color={evento.tipo === 'reserva' ? 'primary' : 'secondary'}
                                                        size="small"
                                                        variant="outlined"
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    {evento.tipo === 'reserva'
                                                        ? `Reserva de ${evento.usuario} (${evento.estado})`
                                                        : `Precio especial: €${evento.precio_especial}`}
                                                </TableCell>
                                            </TableRow>
                                        )) : (
                                            <TableRow>
                                                <TableCell colSpan={3} align="center">
                                                    No hay eventos programados
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </CardContent>
                    </Card>

                    <Card elevation={0} sx={{
                        borderRadius: 2,
                        boxShadow: '0 4px 20px 0 rgba(0,0,0,0.05)'
                    }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom sx={{ fontWeight: 500 }}>
                                Últimas Valoraciones
                            </Typography>
                            <Stack spacing={2}>
                                {valoraciones.length > 0 ? valoraciones.map((valoracion, index) => (
                                    <Box key={index} sx={{
                                        p: 2,
                                        borderRadius: 2,
                                        backgroundColor: theme.palette.grey[50],
                                        border: `1px solid ${theme.palette.divider}`,
                                        transition: 'transform 0.2s, box-shadow 0.2s',
                                        '&:hover': {
                                            transform: 'translateY(-2px)',
                                            boxShadow: '0 4px 10px rgba(0,0,0,0.05)'
                                        }
                                    }}>
                                        <Box sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            mb: 1
                                        }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                <StarRateIcon color="warning" />
                                                <Typography variant="body1" sx={{ ml: 1, fontWeight: 600 }}>
                                                    {valoracion.valoracion}/5
                                                </Typography>
                                            </Box>
                                            <Typography variant="caption" color="text.secondary">
                                                {new Date(valoracion.fecha || Date.now()).toLocaleDateString()}
                                            </Typography>
                                        </Box>
                                        <Typography variant="body2" color="text.secondary">
                                            {valoracion.comentario}
                                        </Typography>
                                    </Box>
                                )) : (
                                    <Box sx={{
                                        p: 4,
                                        borderRadius: 2,
                                        backgroundColor: theme.palette.grey[50],
                                        textAlign: 'center'
                                    }}>
                                        <Typography color="text.secondary">
                                            No hay valoraciones disponibles
                                        </Typography>
                                    </Box>
                                )}
                            </Stack>
                        </CardContent>
                    </Card>
                </Box>
            </Container>
        </Box>
    );
};

const MetricCard = ({ icon, title, value, subtitle, color }) => (
    <Card sx={{
        backgroundColor: color + '08',
        borderLeft: `4px solid ${color}`,
        borderRadius: 2,
        flex: '1 1 200px',
        minWidth: { xs: '100%', sm: 'calc(50% - 12px)', md: 'calc(25% - 18px)' },
        boxShadow: '0 4px 20px 0 rgba(0,0,0,0.05)',
        overflow: 'hidden',
        position: 'relative',
        '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: `radial-gradient(circle at top right, ${color}10, transparent 70%)`,
            opacity: 0.5
        }
    }}>
        <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, position: 'relative', zIndex: 1 }}>
                <Box sx={{
                    backgroundColor: color + '15',
                    p: 1.5,
                    borderRadius: '12px',
                    display: 'flex'
                }}>
                    {React.cloneElement(icon, { sx: { color } })}
                </Box>
                <Box>
                    <Typography variant="h5" component="div" sx={{ fontWeight: 'bold' }}>
                        {value}
                    </Typography>
                    <Typography variant="subtitle2" sx={{ color: theme => theme.palette.text.primary, fontWeight: 500 }}>
                        {title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        {subtitle}
                    </Typography>
                </Box>
            </Box>
        </CardContent>
    </Card>
);

const procesarDatosReservas = (reservas) => {
    const meses = Array(12).fill(0).map((_, i) => ({
        mes: new Date(2024, i).toLocaleString('default', { month: 'short' }),
        reservas: 0,
        ingresos: 0
    }));

    reservas.forEach(reserva => {
        const mes = new Date(reserva.fecha_llegada).getMonth();
        meses[mes].reservas += 1;
        meses[mes].ingresos += parseFloat(reserva.precio_total);
    });

    return meses;
};

const procesarValoraciones = (valoraciones) => {
    const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    valoraciones.forEach(v => counts[Math.floor(v.valoracion)]++);
    return Object.entries(counts).map(([valoracion, cantidad]) => ({
        valoracion: `${valoracion} estrellas`,
        cantidad
    }));
};

export default PropertyDashboard;