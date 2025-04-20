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
    Chip,
    useTheme,
    Stack,
    Button,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    CardHeader,
    InputAdornment
} from '@mui/material';
import { es } from 'date-fns/locale';

import {
    CalendarToday as CalendarTodayIcon,
    Event as EventIcon,
    DateRange as DateRangeIcon,
    InfoOutlined as InfoOutlinedIcon,
    Add as AddIcon,
    Euro as EuroIcon
} from '@mui/icons-material';
import { TrendingUp, Home, Star } from 'lucide-react';
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
import StarRateIcon from '@mui/icons-material/StarRate';
import PeopleIcon from '@mui/icons-material/People';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import CompareIcon from '@mui/icons-material/Compare';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { set } from 'date-fns';

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
    const [dateRangeInicio, setDateRangeInicio] = useState(null);
    const [dateRangeFin, setDateRangeFin] = useState(null);
    const [selectedPropertyCompare, setSelectedPropertyCompare] = useState('');
    const [usuariosValoraciones, setUsuariosValoraciones] = useState([]);
    const [usuariosReservas, setUsuariosReservas] = useState([]);
    const [errorDateRangeInicio, setErrorDateRangeInicio] = useState(null);
    const [errorDateRangeFin, setErrorDateRangeFin] = useState(null);
    const [ocupacionTendencias, setOcupacionTendencias] = useState([]);
    const [precioTendencias, setPrecioTendencias] = useState([]);

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
    const eventosCalendario = [...reservas.map(r => ({ ...r, tipo: 'reserva' }))];

    useEffect(() => {
        fetchPropiedades();
        fetchOcupacionTendencias();
        fetchPrecioTendencias();
        fetchReservas();
        fetchValoraciones();
        fetchPreciosEspeciales();

    }, [propiedadId]);

    useEffect(() => {
        if (valoraciones.length > 0) {
            const usuarios = valoraciones.map(v => v.usuario)
            const uniqueUsuarios = [...new Set(usuarios)];
            uniqueUsuarios.forEach(usuario => {
                fetchUsuarioValoraciones(usuario);
            });
        }
    }, [valoraciones]);

    useEffect(() => {
        if (reservas.length > 0) {
            const usuarios = reservas.map(r => r.usuario);
            const uniqueUsuarios = [...new Set(usuarios)];
            uniqueUsuarios.forEach(usuario => {
                fetchUsuarioReservas(usuario);
            });
        }
    }, [reservas]);

    const fetchUsuarioReservas = async (usuarioId) => {
        try {
            const response = await fetch(`http://localhost:8000/api/usuarios/${usuarioId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                },
            });
            if (!response.ok) throw new Error('Error fetching usuario reservas');
            const data = await response.json();
            setUsuariosReservas(prev => [...prev, data]);
        } catch (error) {
            console.error(error.message);
        }
    }

    const fetchUsuarioValoraciones = async (usuarioId) => {
        try {
            const response = await fetch(`http://localhost:8000/api/usuarios/${usuarioId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                },
            });
            if (!response.ok) throw new Error('Error fetching usuario valoraciones');
            const data = await response.json();
            setUsuariosValoraciones(prev => [...prev, data]);
        } catch (error) {
            console.error(error.message);
        }
    }


    const fetchPropiedades = async () => {
        try {
            const response = await fetch(`http://localhost:8000/api/propiedades/propiedades-por-usuario/${usuarioId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                },
            });
            if (!response.ok) throw new Error('Error fetching propiedades');
            const data = await response.json();
            setPropiedades(data);
            const selectedPropiedad = data.find((prop) => prop.id === parseInt(propiedadId));
            setPropiedad(selectedPropiedad);
            if (selectedPropiedad?.anfitrion !== usuarioId) {
                setError('No tienes permiso para ver esta propiedad');
                window.location.href = '/mis-propiedades';
            }
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchPreciosEspeciales = async () => {
        try {
            const response = await fetch(`http://localhost:8000/api/propiedades/precios-especiales-por-propiedad/${propiedadId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                },
            });
            if (!response.ok) throw new Error('Error fetching precios especiales');
            const data = await response.json();
            setPreciosEspeciales(data);
        } catch (error) {
            setError(error.message);
        }
    };

    const fetchReservas = async () => {
        try {
            const response = await fetch(`http://localhost:8000/api/propiedades/reservas-por-propiedad/${propiedadId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                },
            });
            if (!response.ok) throw new Error('Error fetching reservas');
            const data = await response.json();
            setReservas(data);
        } catch (error) {
            setError(error.message);
        }
    };

    const fetchValoraciones = async () => {
        try {
            const response = await fetch(`http://localhost:8000/api/propiedades/valoraciones-por-propiedad/${propiedadId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                },
            });
            if (!response.ok) throw new Error('Error fetching valoraciones');
            const data = await response.json();
            setValoraciones(data);
        } catch (error) {
            setError(error.message);
        }
    };

    const fetchOcupacionTendencias = async () => {
        try {
            const response = await fetch(`http://localhost:8000/api/propiedades/ocupacion-tendencias/${propiedadId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                },
            });
            if (!response.ok) throw new Error('Error fetching tendencias de ocupación');
            const data = await response.json();
            setOcupacionTendencias(data);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchPrecioTendencias = async () => {
        try {
            const response = await fetch(`http://localhost:8000/api/propiedades/precio-tendencias/${propiedadId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                },
            });
            if (!response.ok) throw new Error('Error fetching tendencias de precios');
            const data = await response.json();
            setPrecioTendencias(data);
        } catch (error) {
            console.error(error);
        }
    };

    const validateDateRanges = (inicio, fin) => {
        if (inicio && fin) {
            if (new Date(inicio) > new Date(fin)) {
                setErrorDateRangeInicio("La fecha de inicio no puede ser posterior a la fecha de fin.");
                setErrorDateRangeFin("La fecha de fin no puede ser anterior a la fecha de inicio.");
                return false;
            } else {
                setErrorDateRangeInicio(null);
                setErrorDateRangeFin(null);
            }
        } else {
            setErrorDateRangeInicio(null);
            setErrorDateRangeFin(null);
        }
    };




    const COLORS = [
        theme.palette.error.main,
        theme.palette.warning.main,
        theme.palette.info.main,
        theme.palette.success.main,
        theme.palette.primary.main,
    ];

    const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
        const RADIAN = Math.PI / 180;
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);

        return (
            <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central">
                {`${(percent * 100).toFixed(0)}%`}
            </text>
        );
    };



    return (
        <Box sx={{
            p: 3,
            backgroundColor: '#f9fafc',
            minHeight: '100vh',
            backgroundImage: 'linear-gradient(to bottom, rgba(255,255,255,0.8), rgba(255,255,255,0.4))',
        }}>
            <Container maxWidth="xl">
                <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${theme.palette.divider}`, pb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography component="a" href={`/detalles/${propiedad?.id}`} variant="h4" sx={{ fontWeight: 'bold', color: theme.palette.primary.dark, textDecoration: 'none' }}>
                            {propiedad?.nombre}
                        </Typography>
                        <Chip label={propiedad?.tipo_de_propiedad} color="secondary" variant="outlined" sx={{ fontWeight: 500 }} />
                    </Box>

                </Box>

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 4 }}>
                    <MetricCard icon={<EventAvailableIcon />} title="Reservas Totales" value={totalReservas} subtitle="Últimos 12 meses" color={theme.palette.primary.main} />
                    <MetricCard icon={<EuroIcon />} title="Ingresos Totales" value={`€${ingresosTotales.toFixed(2)}`} subtitle="Ingresos anuales" color={theme.palette.success.main} />
                    <MetricCard icon={<StarRateIcon />} title="Valoración Promedio" value={promedioValoracion.toFixed(2) + "/5"} subtitle={`de ${valoraciones.length} reseñas`} color={theme.palette.warning.main} />
                    <MetricCard icon={<PeopleIcon />} title="Tasa de Ocupación" value={`${ocupacionPorcentaje}%`} subtitle="Días ocupados/año" color={theme.palette.info.main} />
                </Box>

                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 3, mb: 4 }}>
                    <Card elevation={0} sx={{ borderRadius: 2, boxShadow: '0 4px 20px 0 rgba(0,0,0,0.05)' }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom sx={{ fontWeight: 500 }}>
                                Reservas e Ingresos Mensuales
                            </Typography>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={datosReservasPorMes}>
                                    <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                                    <XAxis dataKey="mes" tickLine={false} />
                                    <YAxis axisLine={false} tickLine={false} />
                                    <Tooltip contentStyle={{ backgroundColor: theme.palette.background.paper, borderRadius: 8, boxShadow: '0 4px 20px 0 rgba(0,0,0,0.1)', border: 'none' }} />
                                    <Legend wrapperStyle={{ paddingTop: 20 }} />
                                    <Bar dataKey="reservas" fill={theme.palette.primary.main} radius={[4, 4, 0, 0]} name="Reservas" />
                                    <Bar dataKey="ingresos" fill={theme.palette.success.main} radius={[4, 4, 0, 0]} name="Ingresos (€)" />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    <Card elevation={3} sx={{ borderRadius: 2, boxShadow: '0 4px 20px 0 rgba(0,0,0,0.1)' }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
                                Distribución de Valoraciones
                            </Typography>
                            <Typography variant="body2" sx={{ mb: 2, color: theme.palette.text.secondary }}>
                                Esta gráfica muestra la distribución de las valoraciones recibidas, proporcionando una visión clara de la satisfacción general.
                            </Typography>
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={datosValoraciones}
                                        dataKey="cantidad"
                                        nameKey="valoracion"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={100}
                                        labelLine={false}
                                        label={renderCustomizedLabel}
                                    >
                                        {datosValoraciones.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={COLORS[index % COLORS.length]}
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
                                            border: 'none',
                                            padding: '10px',
                                        }}
                                        formatter={(value, name) => [`${value} valoraciones`, name]}
                                    />
                                    <Legend
                                        layout="vertical"
                                        align="right"
                                        verticalAlign="middle"
                                        wrapperStyle={{ paddingLeft: 12 }}
                                        formatter={(value) => <span style={{ color: theme.palette.text.primary }}>{value}</span>}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                            <Box sx={{ mt: 2, textAlign: 'center' }}>
                                <Typography variant="body2" color="text.secondary">
                                    Total de valoraciones: {valoraciones.length}
                                </Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Box>

                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3, mb: 4 }}>
                    <Card elevation={0} sx={{ borderRadius: 2, boxShadow: '0 4px 20px 0 rgba(0,0,0,0.05)' }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 500 }}>
                                <TrendingUpIcon /> Tendencias de Ocupación
                            </Typography>
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={ocupacionTendencias}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="mes" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Line type="monotone" dataKey="ocupacion" stroke={theme.palette.primary.main} name="Ocupación (%)" />
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    <Card elevation={0} sx={{ borderRadius: 2, boxShadow: '0 4px 20px 0 rgba(0,0,0,0.05)' }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 500 }}>
                                <EuroIcon /> Tendencias de Precios
                            </Typography>
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={precioTendencias}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="mes" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Line type="monotone" dataKey="precio" stroke={theme.palette.success.main} name="Precio (€)" />
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </Box>

                {propiedades.length > 1 && <Card elevation={0} sx={{ borderRadius: 2, boxShadow: '0 4px 20px 0 rgba(0,0,0,0.05)', mb: 4 }}>
                    <CardContent>
                        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 500 }}>
                            <CompareIcon /> Comparación con Otras Propiedades
                        </Typography>
                        <FormControl fullWidth sx={{ mb: 2 }}>
                            <InputLabel>Seleccionar Propiedad</InputLabel>
                            <Select
                                value={selectedPropertyCompare}
                                onChange={(e) => setSelectedPropertyCompare(e.target.value)}
                                label="Seleccionar Propiedad"
                            >
                                <MenuItem value="" >Selecciona una propiedad</MenuItem>
                                {propiedades.filter(p => p.id !== parseInt(propiedadId)).map(p => (
                                    <MenuItem key={p.id} value={p.id}>{p.nombre}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        {selectedPropertyCompare && (
                            <ComparacionPropiedades propiedadActual={propiedad} propiedadComparada={propiedades.find(p => p.id === parseInt(selectedPropertyCompare))} reservas={reservas} />
                        )}
                    </CardContent>
                </Card>}

                <Box sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                    gap: 2,
                    mb: 3
                }}>
                    <Card elevation={0} sx={{
                        borderRadius: 2,
                        boxShadow: '0 4px 16px rgba(0,0,0,0.05)',
                        overflow: 'hidden',
                        border: '1px solid #f0f0f0',
                        height: 'fit-content'
                    }}>
                        <CardHeader
                            title={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <CalendarTodayIcon color="primary" fontSize="small" />
                                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                        Calendario de Disponibilidad
                                    </Typography>
                                    <Button
                                        variant="outlined"
                                        color="primary"
                                        size="small"
                                        sx={{ ml: 'auto', textTransform: 'none' }}
                                        onClick={() => {
                                            setDateRangeInicio(null);
                                            setDateRangeFin(null);
                                            setErrorDateRangeFin(null);
                                            setErrorDateRangeInicio(null);
                                        }}
                                    >
                                        Limpiar filtros
                                    </Button>
                                </Box>
                            }
                            sx={{
                                backgroundColor: 'rgba(0, 0, 0, 0.02)',
                                borderBottom: '1px solid #f0f0f0',
                                padding: { xs: 1.5, sm: 2 }
                            }}
                        />
                        <CardContent sx={{ padding: { xs: 1.5, sm: 2 } }}>
                            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
                                <Box sx={{
                                    display: 'flex',
                                    flexDirection: { xs: 'column', sm: 'row' },
                                    gap: 2,
                                    mb: 2
                                }}>
                                    <Box sx={{ flexGrow: 1, width: { xs: '100%', sm: '50%' } }}>
                                        <DatePicker
                                            value={dateRangeInicio}
                                            onChange={(newValue) => {
                                                setDateRangeInicio(newValue);
                                                validateDateRanges(newValue, dateRangeFin);
                                            }}
                                            label="Inicio"

                                            slotProps={{
                                                textField: {
                                                    size: "small",
                                                    fullWidth: true,
                                                    error: !!errorDateRangeInicio,
                                                    helperText: errorDateRangeInicio,
                                                    InputProps: {
                                                        startAdornment: (
                                                            <InputAdornment position="start">
                                                                <EventIcon fontSize="small" color="action" />
                                                            </InputAdornment>
                                                        )
                                                    }
                                                }
                                            }}
                                        />
                                    </Box>
                                    <Box sx={{ flexGrow: 1, width: { xs: '100%', sm: '50%' } }}>
                                        <DatePicker
                                            value={dateRangeFin}
                                            onChange={(newValue) => {
                                                setDateRangeFin(newValue);
                                                validateDateRanges(dateRangeInicio, newValue);

                                            }
                                            }
                                            label="Fin"
                                            slotProps={{
                                                textField: {
                                                    size: "small",
                                                    fullWidth: true,
                                                    error: !!errorDateRangeFin,
                                                    helperText: errorDateRangeFin,
                                                    InputProps: {
                                                        startAdornment: (
                                                            <InputAdornment position="start">
                                                                <EventIcon fontSize="small" color="action" />
                                                            </InputAdornment>
                                                        )
                                                    }
                                                }
                                            }}
                                        />
                                    </Box>
                                </Box>
                            </LocalizationProvider>

                            <Box sx={{ mt: 1, position: 'relative' }}>
                                <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <InfoOutlinedIcon fontSize="small" color="primary" />
                                    Últimas Reservas
                                </Typography>

                                {eventosCalendario.length > 0 ? (
                                    <TableContainer
                                        component={Paper}
                                        sx={{
                                            borderRadius: 1,
                                            width: '100%',
                                            boxShadow: 'none',
                                            border: '1px solid rgba(224, 224, 224, 1)',
                                            overflow: 'hidden'
                                        }}
                                    >
                                        <Table size="small" sx={{ minWidth: 650, tableLayout: 'fixed' }}>
                                            <TableHead>
                                                <TableRow sx={{ backgroundColor: theme.palette.primary.main }}>
                                                    <TableCell sx={{ fontWeight: 600, color: '#fff', py: 0.5, width: '35%' }}>Periodo</TableCell>
                                                    <TableCell sx={{ fontWeight: 600, color: '#fff', py: 0.5, width: '65%' }}>Información</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {eventosCalendario
                                                    .filter(evento => {

                                                        const fechaEventoInicio = new Date(evento.fecha_llegada || evento.fecha_inicio);
                                                        const fechaEventoFin = new Date(evento.fecha_salida || evento.fecha_fin);

                                                        if (!dateRangeInicio && !dateRangeFin) return true;


                                                        if (dateRangeInicio && !dateRangeFin) {
                                                            const filtroInicio = new Date(dateRangeInicio);
                                                            return fechaEventoInicio >= filtroInicio || fechaEventoFin >= filtroInicio;
                                                        }

                                                        if (!dateRangeInicio && dateRangeFin) {
                                                            const filtroFin = new Date(dateRangeFin);
                                                            return fechaEventoInicio <= filtroFin || fechaEventoFin <= filtroFin;
                                                        }

                                                        if (dateRangeInicio && dateRangeFin) {
                                                            const filtroInicio = new Date(dateRangeInicio);
                                                            const filtroFin = new Date(dateRangeFin);

                                                            return (
                                                                (fechaEventoInicio >= filtroInicio && fechaEventoInicio <= filtroFin) ||
                                                                (fechaEventoFin >= filtroInicio && fechaEventoFin <= filtroFin) ||
                                                                (fechaEventoInicio <= filtroInicio && fechaEventoFin >= filtroFin)
                                                            );
                                                        }
                                                    })
                                                    .sort((a, b) => new Date(b.fecha_llegada) - new Date(a.fecha_llegada))
                                                    .slice(0, 10)
                                                    .map((evento, index) => (
                                                        <TableRow
                                                            key={index}
                                                            sx={{
                                                                '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' },
                                                                '&:nth-of-type(odd)': { backgroundColor: 'rgba(0, 0, 0, 0.02)' }
                                                            }}
                                                        >
                                                            <TableCell sx={{ py: 0.5, pl: 1 }}>
                                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                                    <DateRangeIcon fontSize="small" color="action" />
                                                                    <Typography variant="caption" sx={{ fontWeight: 500 }}>
                                                                        {evento.tipo === 'reserva'
                                                                            ? `${evento.fecha_llegada} - ${evento.fecha_salida}`
                                                                            : `${evento.fecha_inicio} - ${evento.fecha_fin}`}
                                                                    </Typography>
                                                                </Box>
                                                            </TableCell>

                                                            <TableCell sx={{ py: 0.5, pl: 1 }}>
                                                                {evento.tipo === 'reserva' ? (
                                                                    <Box>
                                                                        <Typography variant="caption" sx={{ fontWeight: 500, display: 'block' }}>
                                                                            Cliente: {usuariosReservas?.find(usuario => usuario.id === evento.usuario)?.usuario?.username}
                                                                        </Typography>
                                                                        <Typography variant="caption" color="text.secondary">
                                                                            Estado: {evento.estado} • {Math.ceil((new Date(evento.fecha_salida) - new Date(evento.fecha_llegada)) / (1000 * 60 * 60 * 24))} días
                                                                        </Typography>
                                                                    </Box>
                                                                ) : (
                                                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                                        <EuroIcon fontSize="small" color="action" sx={{ mr: 0.5 }} />
                                                                        <Typography variant="caption" sx={{ fontWeight: 500 }}>
                                                                            {evento.precio_especial}
                                                                        </Typography>
                                                                    </Box>
                                                                )}
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}

                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                ) : (
                                    <Paper
                                        sx={{
                                            p: 2,
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            borderRadius: 1,
                                            border: '1px dashed',
                                            borderColor: 'divider',
                                            backgroundColor: 'rgba(0, 0, 0, 0.01)'
                                        }}
                                    >
                                        <CalendarTodayIcon color="disabled" sx={{ fontSize: 24, mb: 1 }} />
                                        <Typography variant="body2" color="text.secondary" gutterBottom>
                                            No hay eventos programados
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary" align="center">
                                            Seleccione fechas para ver o crear eventos
                                        </Typography>
                                        <Button
                                            variant="outlined"
                                            color="primary"
                                            startIcon={<AddIcon />}
                                            size="small"
                                            sx={{ mt: 1, textTransform: 'none' }}
                                        >
                                            Crear evento
                                        </Button>
                                    </Paper>
                                )}
                            </Box>
                        </CardContent>
                    </Card>

                    <Card elevation={0} sx={{
                        borderRadius: 2,
                        boxShadow: '0 4px 16px rgba(0,0,0,0.05)',
                        border: '1px solid #f0f0f0',
                        height: 'fit-content'
                    }}>
                        <CardHeader
                            title={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <StarRateIcon color="warning" fontSize="small" />
                                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                        Últimas Valoraciones
                                    </Typography>
                                </Box>
                            }
                            sx={{
                                backgroundColor: 'rgba(0, 0, 0, 0.02)',
                                borderBottom: '1px solid #f0f0f0',
                                padding: { xs: 1.5, sm: 2 }
                            }}
                        />
                        <CardContent sx={{ padding: { xs: 1.5, sm: 2 } }}>
                            {valoraciones.length > 0 ? (
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                    {valoraciones?.sort((a, b) => b.id - a.id).slice(0, 10).map((valoracion, index) => (
                                        <Box
                                            key={index}
                                            sx={{
                                                p: 1.5,
                                                borderRadius: 1,
                                                backgroundColor: theme.palette.background.paper,
                                                border: `1px solid ${theme.palette.divider}`,
                                                boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
                                                transition: 'all 0.2s ease',
                                                '&:hover': {
                                                    transform: 'translateY(-1px)',
                                                    boxShadow: '0 3px 8px rgba(0,0,0,0.05)'
                                                }
                                            }}
                                        >
                                            <Box sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                mb: 0.5
                                            }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                    <StarRateIcon sx={{ color: theme.palette.warning.main, fontSize: '1rem' }} />
                                                    <Typography
                                                        variant="body2"
                                                        sx={{
                                                            ml: 0.5,
                                                            fontWeight: 600,
                                                            color: theme.palette.text.primary
                                                        }}
                                                    >
                                                        {valoracion.valoracion}/5
                                                    </Typography>

                                                    <Typography
                                                        variant="caption"
                                                        sx={{
                                                            ml: 1,
                                                            fontWeight: 600,
                                                            color: theme.palette.text.primary
                                                        }}
                                                    >
                                                        {usuariosValoraciones.find(usuario => usuario.id === valoracion.usuario)?.usuario?.username}
                                                    </Typography>
                                                </Box>

                                            </Box>
                                            <Typography
                                                variant="caption"
                                                sx={{
                                                    color: theme.palette.text.secondary,
                                                    lineHeight: 1.4,
                                                    display: 'block'
                                                }}
                                            >
                                                {valoracion.comentario}
                                            </Typography>
                                        </Box>
                                    ))}
                                </Box>
                            ) : (
                                <Box
                                    sx={{
                                        p: 2,
                                        borderRadius: 1,
                                        backgroundColor: theme.palette.background.paper,
                                        border: `1px solid ${theme.palette.divider}`,
                                        textAlign: 'center',
                                        minHeight: 80,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                >
                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                        sx={{ fontWeight: 500 }}
                                    >
                                        No hay valoraciones disponibles
                                    </Typography>
                                </Box>
                            )}
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
                <Box sx={{ backgroundColor: color + '15', p: 1.5, borderRadius: '12px', display: 'flex' }}>
                    {React.cloneElement(icon, { sx: { color } })}
                </Box>
                <Box>
                    <Typography variant="h5" component="div" sx={{ fontWeight: 'bold' }}>{value}</Typography>
                    <Typography variant="subtitle2" sx={{ color: theme => theme.palette.text.primary, fontWeight: 500 }}>{title}</Typography>
                    <Typography variant="caption" color="text.secondary">{subtitle}</Typography>
                </Box>
            </Box>
        </CardContent>
    </Card>
);

const ComparacionPropiedades = ({ propiedadActual, propiedadComparada, reservas }) => {

    const [reservasPropiedadComparada, setReservasPropiedadComparada] = useState([]);
    const reservasActual = reservas?.length || 0;
    const reservasComparada = reservasPropiedadComparada?.length || 0;

    const ingresosActual = reservas?.reduce((acc, curr) => acc + parseFloat(curr.precio_total), 0) || 0;
    const ingresosComparada = reservasPropiedadComparada?.reduce((acc, curr) => acc + parseFloat(curr.precio_total), 0) || 0;

    const valoracionActual = parseFloat(propiedadActual.valoracion_promedio.toFixed(2)) || 0;
    const valoracionComparada = parseFloat(propiedadComparada.valoracion_promedio.toFixed(2)) || 0;

    useEffect(() => {
        if (propiedadComparada) {
            fetchReservasComparada();
        }
    }, [propiedadComparada]);


    const fetchReservasComparada = async () => {
        try {
            const response = await fetch(`http://localhost:8000/api/propiedades/reservas-por-propiedad/${propiedadComparada.id}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                },
            });
            if (!response.ok) throw new Error('Error fetching reservas comparada');
            const data = await response.json();
            setReservasPropiedadComparada(data);
        } catch (error) {
            console.error(error);
        }
    };

    const metricas = [
        {
            titulo: 'Reservas',
            icono: <Home size={20} style={{ marginRight: 8 }} />,
            data: [{ name: 'Reservas', actual: reservasActual, comparada: reservasComparada }],
            formato: (valor) => valor
        },
        {
            titulo: 'Ingresos',
            icono: <TrendingUp size={20} style={{ marginRight: 8 }} />,
            data: [{ name: 'Ingresos', actual: ingresosActual, comparada: ingresosComparada }],
            formato: (valor) => `$${valor.toLocaleString()}`
        },
        {
            titulo: 'Valoración',
            icono: <Star size={20} style={{ marginRight: 8 }} />,
            data: [{ name: 'Valoración', actual: valoracionActual, comparada: valoracionComparada }],
            formato: (valor) => `${valor.toFixed(2)}/5`
        }
    ];

    const colorPropiedadActual = "#3f51b5";
    const colorPropiedadComparada = "#00a152";

    return (
        <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h5" fontWeight="bold" color="primary" sx={{ pb: 2, borderBottom: '1px solid #e0e0e0', mb: 3 }}>
                Comparativa de Propiedades
            </Typography>

            <Stack spacing={4} direction={{ xs: 'column', lg: 'row' }}>
                {metricas.map((metrica, i) => (
                    <Card key={i} variant="outlined" sx={{ flex: 1, bgcolor: 'background.default' }}>
                        <CardHeader
                            title={
                                <Box display="flex" alignItems="center">
                                    {metrica.icono}
                                    <Typography variant="h6">{metrica.titulo}</Typography>
                                </Box>
                            }
                            sx={{ pb: 0 }}
                        />
                        <CardContent>
                            <Box height={220}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={metrica.data} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                        <YAxis tick={{ fontSize: 12 }} />
                                        {/* <Tooltip
                                            formatter={(value, name) => [metrica.formato(value), name]}
                                            contentStyle={{ borderRadius: '6px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                                        /> */}
                                        <Legend
                                            wrapperStyle={{ paddingTop: 10 }}
                                            formatter={(value) => <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{value}</span>}
                                        />
                                        <Bar
                                            dataKey="actual"
                                            fill={colorPropiedadActual}
                                            name={propiedadActual.nombre}
                                            radius={[4, 4, 0, 0]}
                                        />
                                        <Bar
                                            dataKey="comparada"
                                            fill={colorPropiedadComparada}
                                            name={propiedadComparada.nombre}
                                            radius={[4, 4, 0, 0]}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </Box>

                            <Stack direction="row" justifyContent="space-between" sx={{ mt: 2 }}>
                                <Box display="flex" alignItems="center">
                                    <Box
                                        component="span"
                                        sx={{
                                            width: 12,
                                            height: 12,
                                            borderRadius: '50%',
                                            bgcolor: colorPropiedadActual,
                                            display: 'inline-block',
                                            mr: 1
                                        }}
                                    />
                                    <Typography variant="body2">
                                        <Box component="span" fontWeight="medium">{propiedadActual.nombre}:</Box> {metrica.formato(metrica.data[0].actual)}
                                    </Typography>
                                </Box>
                                <Box display="flex" alignItems="center">
                                    <Box
                                        component="span"
                                        sx={{
                                            width: 12,
                                            height: 12,
                                            borderRadius: '50%',
                                            bgcolor: colorPropiedadComparada,
                                            display: 'inline-block',
                                            mr: 1
                                        }}
                                    />
                                    <Typography variant="body2">
                                        <Box component="span" fontWeight="medium">{propiedadComparada.nombre}:</Box> {metrica.formato(metrica.data[0].comparada)}
                                    </Typography>
                                </Box>
                            </Stack>
                        </CardContent>
                    </Card>
                ))}
            </Stack>
        </Paper>
    );
};

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

    return meses.map((mes) => ({
        ...mes,
        ingresos: parseFloat(mes.ingresos.toFixed(2)),
    })
    );
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