import React, { useEffect, useState, useMemo } from 'react';
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

import { format, getYear, isValid, parseISO } from 'date-fns';
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
import BarChartIcon from '@mui/icons-material/BarChart';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import StarIcon from '@mui/icons-material/Star';

const PropertyDashboard = () => {
    const theme = useTheme();
    const usuarioId = JSON.parse(localStorage.getItem('additionalInfo'))?.usuarioId;
    const { propiedadId } = useParams();
    const [valoraciones, setValoraciones] = useState([]);
    const [propiedad, setPropiedad] = useState(null);
    const [propiedades, setPropiedades] = useState([]);
    const [reservas, setReservas] = useState([]);
    const [dateRangeInicio, setDateRangeInicio] = useState(null);
    const [dateRangeFin, setDateRangeFin] = useState(null);
    const [selectedPropertyCompare, setSelectedPropertyCompare] = useState('');
    const [usuariosValoraciones, setUsuariosValoraciones] = useState([]);
    const [usuariosReservas, setUsuariosReservas] = useState({});
    const [errorDateRangeInicio, setErrorDateRangeInicio] = useState(null);
    const [errorDateRangeFin, setErrorDateRangeFin] = useState(null);
    const [ocupacionTendencias, setOcupacionTendencias] = useState([]);
    const [precioTendencias, setPrecioTendencias] = useState([]);
    const [selectedYear, setSelectedYear] = useState('todos');
    const [availableYears, setAvailableYears] = useState([]);

    const totalReservas = reservas.length;
    const promedioValoracion = propiedad?.valoracion_promedio || 0;
    const ingresosTotales = reservas.reduce((acc, curr) => acc + parseFloat(curr.precio_total), 0);
    const diasOcupados = reservas.reduce((totalDias, reserva) => {
        const fechaLlegada = new Date(reserva.fecha_llegada);
        const fechaSalida = new Date(reserva.fecha_salida);
        return totalDias + Math.ceil((fechaSalida - fechaLlegada) / (1000 * 60 * 60 * 24));
    }, 0);
    const ocupacionPorcentaje = (diasOcupados / 365 * 100).toFixed(1);

    const datosReservasPorMes = useMemo(() => {
        return procesarDatosReservas(reservas, selectedYear);
    }, [reservas, selectedYear]);
    const datosValoraciones = procesarValoraciones(valoraciones);
    const eventosCalendario = [...reservas.map(r => ({ ...r, tipo: 'reserva' }))];

    useEffect(() => {
        fetchPropiedades();
        fetchOcupacionTendencias();
        fetchPrecioTendencias();
        fetchReservas();
        fetchValoraciones();

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

    useEffect(() => {
        if (reservas && reservas.length > 0) {
            const years = new Set();
            reservas.forEach(reserva => {
                try {
                    const fechaLlegadaDate = typeof reserva.fecha_llegada === 'string'
                        ? parseISO(reserva.fecha_llegada)
                        : new Date(reserva.fecha_llegada);
                    if (isValid(fechaLlegadaDate)) {
                        years.add(getYear(fechaLlegadaDate));
                    }
                } catch (e) {
                    console.error("Error extrayendo año de reserva:", reserva, e);
                }
            });
            const sortedYears = Array.from(years).sort((a, b) => b - a); // Ordenar descendente
            setAvailableYears(sortedYears);
            // if (selectedYear === 'todos' && sortedYears.length > 0) {
            //     setSelectedYear(sortedYears[0]);
            // }
        } else {
            setAvailableYears([]); // Limpiar si no hay reservas
        }
    }, [reservas]);

    // Dentro del componente PropertyDashboard

    // --- REEMPLAZA EL useMemo ANTERIOR CON ESTE ---
    const datosOcupacionFiltrados = useMemo(() => {
        // Nombres de meses en español para el resultado final y mapeo
        const monthsOrder = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

        // 1. Parsea los datos crudos a un formato más útil y valida
        const datosParseados = ocupacionTendencias
            .map(item => {
                if (!item || typeof item.mes !== 'string' || typeof item.ocupacion !== 'number') {
                    console.warn("Item inválido en ocupacionTendencias:", item);
                    return null; // Ignorar item inválido
                }
                const parts = item.mes.split('-'); // Divide "YYYY-MM"
                if (parts.length !== 2) {
                    console.warn("Formato mes inválido:", item.mes);
                    return null; // Ignorar formato inválido
                }
                const año = parseInt(parts[0]);
                const mesNum = parseInt(parts[1]); // Mes como número (1-12)

                // Validar año y mes numérico
                if (isNaN(año) || isNaN(mesNum) || mesNum < 1 || mesNum > 12) {
                    console.warn("Año o mes numérico inválido:", item.mes);
                    return null; // Ignorar inválido
                }

                return {
                    año: año,
                    mesNum: mesNum, // Guardamos el número del mes (1-12)
                    mes: monthsOrder[mesNum - 1], // Convertimos a 'Ene', 'Feb', etc.
                    ocupacion: item.ocupacion
                };
            })
            .filter(item => item !== null) // Elimina los items inválidos/nulos
            .sort((a, b) => { // Ordenar por si acaso
                if (a.año !== b.año) return a.año - b.año;
                return a.mesNum - b.mesNum;
            });

        // Si no hay datos parseados válidos, devuelve array vacío
        if (datosParseados.length === 0) {
            console.log("Filtrando: No hay datos parseados válidos.");
            return [];
        }
        console.log("Filtrando datos parseados:", datosParseados);

        // 2. Aplica el filtro según selectedYear
        if (selectedYear === 'todos') {
            console.log("Filtrando: Caso 'todos'");
            // Lógica para 'todos': Últimos 12 meses desde el último dato disponible
            const lastEntry = datosParseados[datosParseados.length - 1];

            // Calcula la fecha de inicio (hace 12 meses desde el mes *siguiente* al último dato)
            // Usamos mesNum (1-12) que ahora tenemos. El mes en Date() es 0-11.
            const endDate = new Date(lastEntry.año, lastEntry.mesNum, 1); // Ojo: mesNum es 1-12, Date() usa 0-11. endDate es el 1ro del mes SIGUIENTE.
            const startDate = new Date(endDate);
            startDate.setMonth(startDate.getMonth() - 12); // Retrocede 12 meses

            // Filtra los datos parseados que caen en ese rango de 12 meses
            const filtered = datosParseados.filter(d => {
                try {
                    // El mes en Date() es 0-11, por eso usamos d.mesNum - 1
                    const entryDate = new Date(d.año, d.mesNum - 1, 1);
                    return !isNaN(entryDate) && entryDate >= startDate && entryDate < endDate;
                } catch (e) { return false; } // Seguridad
            });

            console.log("Filtrando: Resultado 'todos'", filtered.slice(-12));
            // Devuelve solo los últimos 12 encontrados (o menos si no hay 12)
            // Mantenemos la estructura { año, mes ('Ene'...), ocupacion }
            return filtered.slice(-12);

        } else {
            // Lógica si se selecciona un año específico
            const yearNum = parseInt(selectedYear);
            console.log("Filtrando: Caso año específico", yearNum);
            if (isNaN(yearNum)) {
                console.log("Filtrando: Año inválido");
                return [];
            }

            // Filtra los datos parseados por el año seleccionado
            const filteredByYear = datosParseados.filter(d => d.año === yearNum);

            // Rellenar meses faltantes con ocupación 0 para ese año
            const result = [];
            const dataMap = new Map(filteredByYear.map(item => [item.mes, item])); // Mapa por nombre de mes ('Ene', 'Feb'...)

            for (let i = 0; i < 12; i++) {
                const monthName = monthsOrder[i];
                if (dataMap.has(monthName)) {
                    result.push(dataMap.get(monthName)); // Añadir dato existente
                } else {
                    // Añadir dato con ocupación 0 para ese mes/año
                    result.push({ año: yearNum, mesNum: i + 1, mes: monthName, ocupacion: 0.0 });
                }
            }
            console.log("Filtrando: Resultado año específico", result);
            return result; // Devuelve los 12 meses del año seleccionado
        }
    }, [ocupacionTendencias, selectedYear]);

    const scrollToSection = (elementId, offsetPixels = 80) => {
        const element = document.getElementById(elementId);
        if (element) {
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - offsetPixels;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    };
    const fetchUsuarioReservas = async (usuarioId) => {
        if (!usuarioId || usuariosReservas[usuarioId]) {

            return;
        }
        try {
            const response = await fetch(`http://localhost:8000/api/usuarios/${usuarioId}/`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                },
            });
            if (!response.ok) throw new Error(`Error fetching usuario ${usuarioId}`);
            const data = await response.json();
            setUsuariosReservas(prev => ({
                ...prev,
                [usuarioId]: data
            }));
        } catch (error) {
            console.error(error.message);
            setUsuariosReservas(prev => ({
                ...prev,
                [usuarioId]: { id: usuarioId, error: true, usuario: { username: 'Error' } }
            }));
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
                window.location.href = '/mis-propiedades';
            }
        } catch (error) {
            console.error(error.message);
        };
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
            console.error(error.message);
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
            console.error(error.message);
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
            console.log("Datos CRUDOS de ocupación:", data); // <--- AÑADIR ESTO
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
            <Box
                sx={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'center',
                    gap: { xs: 1, sm: 2 },
                    mb: 5,
                    borderRadius: 2,
                    p: 2,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                    background: 'linear-gradient(to right, #fafafa, #f5f5f5)'
                }}
            >
                <Button
                    variant="contained"
                    color="primary"
                    href="#metricas"
                    onClick={(e) => {
                        e.preventDefault();
                        scrollToSection('metricas');
                    }}
                    startIcon={<BarChartIcon />}
                    sx={{
                        px: 3,
                        py: 1.2,
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 600,
                        fontSize: '0.95rem',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                            transform: 'translateY(-3px)',
                            boxShadow: 3
                        }
                    }}
                >
                    Métricas
                </Button>

                <Button
                    variant="contained"
                    color="secondary"
                    href="#reservas-ingresos"
                    onClick={(e) => {
                        e.preventDefault();
                        scrollToSection('reservas-ingresos');
                    }}
                    startIcon={<AccountBalanceIcon />}
                    sx={{
                        px: 3,
                        py: 1.2,
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 600,
                        fontSize: '0.95rem',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                            transform: 'translateY(-3px)',
                            boxShadow: 3
                        }
                    }}
                >
                    Reservas e Ingresos
                </Button>

                <Button
                    variant="contained"
                    color="info"
                    href="#valoraciones"
                    onClick={(e) => {
                        e.preventDefault();
                        scrollToSection('valoraciones');
                    }}
                    startIcon={<StarIcon />}
                    sx={{
                        px: 3,
                        py: 1.2,
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 600,
                        fontSize: '0.95rem',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                            transform: 'translateY(-3px)',
                            boxShadow: 3
                        }
                    }}
                >
                    Valoraciones
                </Button>

                {propiedades.length > 1 &&
                    <Button
                        variant="contained"
                        color="success"
                        href="#comparacion"
                        onClick={(e) => {
                            e.preventDefault();
                            scrollToSection('comparacion');
                        }}
                        startIcon={<CompareIcon />}
                        sx={{
                            px: 3,
                            py: 1.2,
                            borderRadius: 2,
                            textTransform: 'none',
                            fontWeight: 600,
                            fontSize: '0.95rem',
                            transition: 'all 0.3s ease',
                            '&:hover': {
                                transform: 'translateY(-3px)',
                                boxShadow: 3
                            }
                        }}
                    >
                        Comparación
                    </Button>
                }
            </Box>
            <Container maxWidth="xl">
                <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${theme.palette.divider}`, pb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography component="a" href={`/detalles/${propiedad?.id}`} variant="h4" sx={{ fontWeight: 'bold', color: theme.palette.primary.dark, textDecoration: 'none' }}>
                            {propiedad?.nombre}
                        </Typography>
                        <Chip label={propiedad?.tipo_de_propiedad} color="secondary" variant="outlined" sx={{ fontWeight: 500 }} />
                    </Box>
                    {propiedades.length > 1 &&
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, maxWidth: '300px' }}>
                            <Typography variant="body2" sx={{ fontWeight: 500, color: theme.palette.text.secondary }}>
                                Cambiar Propiedad:
                            </Typography>
                            <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
                                <Select
                                    value={propiedadId}
                                    onChange={(e) => {
                                        const safeValue = encodeURIComponent(e.target.value);
                                        window.location.href = `/dashboard/${safeValue}`;
                                    }}

                                >
                                    {propiedades.map((prop) => (
                                        <MenuItem key={prop.id} value={prop.id}>
                                            {prop.nombre}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Box>
                    }


                </Box>

                <Box id="metricas" sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 4 }}>
                    <MetricCard icon={<EventAvailableIcon />} title="Reservas Totales" value={totalReservas} subtitle="Últimos 12 meses" color={theme.palette.primary.main} />
                    <MetricCard icon={<EuroIcon />} title="Ingresos Totales" value={`€${ingresosTotales.toFixed(2)}`} subtitle="Ingresos anuales" color={theme.palette.success.main} />
                    <MetricCard icon={<StarRateIcon />} title="Valoración Promedio" value={promedioValoracion.toFixed(2) + "/5"} subtitle={`de ${valoraciones.length} reseñas`} color={theme.palette.warning.main} />
                    <MetricCard icon={<PeopleIcon />} title="Tasa de Ocupación" value={`${ocupacionPorcentaje}%`} subtitle="Días ocupados/año" color={theme.palette.info.main} />
                </Box>

                <Box id="reservas-ingresos" sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 3, mb: 4 }}>
                    <Card elevation={0} sx={{ borderRadius: 2, boxShadow: '0 4px 20px 0 rgba(0,0,0,0.05)' }}>
                        <CardContent sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                            {/* Contenedor para título y filtro */}
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                                <Typography variant="h6" sx={{ fontWeight: 500 }}>
                                    Reservas e Ingresos Mensuales
                                </Typography>
                                {/* Filtro de Año */}
                                {availableYears.length > 0 && ( // Mostrar solo si hay años
                                    <FormControl size="small" sx={{ minWidth: 120 }}>
                                        <InputLabel id="year-filter-label">Año</InputLabel>
                                        <Select
                                            labelId="year-filter-label"
                                            id="year-filter"
                                            value={selectedYear}
                                            label="Año"
                                            onChange={(e) => setSelectedYear(e.target.value)}
                                        >
                                            <MenuItem value="todos">
                                                <em>Todos los años</em>
                                            </MenuItem>
                                            {availableYears.map(year => (
                                                <MenuItem key={year} value={year}>{year}</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                )}
                            </Box>

                            {/* Contenedor del gráfico (asegura que tome espacio) */}
                            <Box sx={{ flexGrow: 1, minHeight: 300 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    {/* El BarChart ahora usa los datos filtrados */}
                                    <BarChart data={datosReservasPorMes} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                                        <XAxis dataKey="mes" tickLine={false} fontSize="0.8rem" />
                                        <YAxis axisLine={false} tickLine={false} fontSize="0.8rem" />
                                        <Tooltip contentStyle={{ /* ... tus estilos de tooltip ... */ }} />
                                        <Legend wrapperStyle={{ paddingTop: 20 }} />
                                        <Bar dataKey="reservas" fill={theme.palette.primary.main} radius={[4, 4, 0, 0]} name="Reservas" />
                                        <Bar dataKey="ingresos" fill={theme.palette.success.main} radius={[4, 4, 0, 0]} name="Ingresos (€)" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </Box>
                        </CardContent>
                        {/* === FIN: MODIFICACIONES JSX === */}
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
                    {/* --- Gráfica Tendencias de Ocupación (MODIFICADA) --- */}
                    <Card elevation={0} sx={{ borderRadius: 2, boxShadow: '0 4px 20px 0 rgba(0,0,0,0.05)', border: '1px solid', borderColor: 'divider' }}>
                        {/* Hacer CardContent flexible para que el gráfico crezca */}
                        <CardContent sx={{ display: 'flex', flexDirection: 'column', height: '100%', p: { xs: 1.5, sm: 2 } }}>
                            {/* Añadir Título y Filtro de Año */}
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 500 }}>
                                    <TrendingUpIcon /> Tendencias de Ocupación
                                </Typography>
                                {/* Filtro de Año (USA EL MISMO ESTADO selectedYear) */}
                                {availableYears.length > 0 && (
                                    <FormControl size="small" sx={{ minWidth: 120 }}>
                                        <InputLabel id="year-filter-ocupacion-label">Año</InputLabel>
                                        <Select
                                            labelId="year-filter-ocupacion-label"
                                            id="year-filter-ocupacion"
                                            value={selectedYear}
                                            label="Año"
                                            onChange={(e) => setSelectedYear(e.target.value)}
                                        >
                                            <MenuItem value="todos">
                                                {/* Ajusta este texto si la lógica de 'todos' en useMemo es diferente */}
                                                <em>Últimos 12 meses</em>
                                            </MenuItem>
                                            {availableYears.map(year => (
                                                <MenuItem key={year} value={year}>{year}</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                )}
                            </Box>

                            {/* Contenedor del gráfico (Usa datosOcupacionFiltrados) */}
                            <Box sx={{ flexGrow: 1, minHeight: 300 }}> {/* Permite que el gráfico ocupe espacio */}
                                <ResponsiveContainer width="100%" height="100%">
                                    {/* Renderiza la gráfica solo si hay datos FILTRADOS */}
                                    {datosOcupacionFiltrados.length > 0 ? (
                                        <LineChart data={datosOcupacionFiltrados} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                                            {/* Asume que 'mes' viene como 'Ene', 'Feb'... */}
                                            <XAxis dataKey="mes" tickLine={false} fontSize="0.8rem" interval={0} />
                                            <YAxis
                                                axisLine={false}
                                                tickLine={false}
                                                fontSize="0.8rem"
                                                tickFormatter={(value) => `${value}%`} // Formato porcentaje
                                                domain={[0, 100]} // Dominio 0-100%
                                            />
                                            <Tooltip
                                                formatter={(value) => [`${value?.toFixed(1) ?? '0.0'}%`, "Ocupación"]}
                                                contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '8px', border: `1px solid ${theme.palette.divider}`, padding: '8px 12px' }}
                                            />
                                            {/* <Legend wrapperStyle={{ paddingTop: 15, fontSize: '0.85rem' }}/> */}
                                            <Line
                                                type="monotone"
                                                dataKey="ocupacion"
                                                stroke={theme.palette.info.main} // Puedes cambiar el color
                                                strokeWidth={2}
                                                dot={{ r: 3, strokeWidth: 1 }}
                                                activeDot={{ r: 6 }}
                                                name="Ocupación"
                                                connectNulls={true} // Conecta línea si hay meses con valor 0 o null (si no rellenaste)
                                            />
                                        </LineChart>
                                    ) : (
                                        // Mensaje si no hay datos para la selección actual
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'text.secondary', textAlign: 'center', p: 2 }}>
                                            <Typography>
                                                {ocupacionTendencias.length === 0
                                                    ? "Cargando datos o no hay historial."
                                                    : `No hay datos para ${selectedYear === 'todos' ? 'el periodo seleccionado' : `el año ${selectedYear}`}.`
                                                }
                                            </Typography>
                                        </Box>
                                    )}
                                </ResponsiveContainer>
                            </Box>
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

                {propiedades.length > 1 && <Card id="comparacion" elevation={0} sx={{ borderRadius: 2, boxShadow: '0 4px 20px 0 rgba(0,0,0,0.05)', mb: 4 }}>
                    <CardContent sx={{ padding: { xs: 2, sm: 3 } }}>
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
                                                                            Cliente: {usuariosReservas[evento.usuario]?.usuario?.username || 'Cargando...'}                                                                        </Typography>
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
                        <CardHeader id='valoraciones'
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


const procesarDatosReservas = (reservas, añoSeleccionado = 'todos') => {
    const meses = Array(12).fill(0).map((_, i) => ({
        mes: format(new Date(2023, i, 1), 'MMM', { locale: es }), // Nombres de meses en español
        reservas: 0,
        ingresos: 0
    }));

    // Filtra las reservas según el año seleccionado ('todos' o un número)
    const reservasFiltradas = añoSeleccionado === 'todos'
        ? reservas
        : reservas.filter(reserva => {
            try {
                // Intenta parsear la fecha (puede venir como string ISO o Date)
                const fechaLlegadaDate = typeof reserva.fecha_llegada === 'string'
                    ? parseISO(reserva.fecha_llegada)
                    : new Date(reserva.fecha_llegada);

                // Valida la fecha y compara el año
                return isValid(fechaLlegadaDate) && getYear(fechaLlegadaDate) === parseInt(añoSeleccionado);
            } catch (error) {
                console.error("Error parseando fecha en filtro:", reserva.fecha_llegada, error);
                return false; // Excluir si hay error al parsear
            }
        });

    // Agrega los datos de las reservas filtradas por mes
    reservasFiltradas.forEach(reserva => {
        try {
            const fechaLlegadaDate = typeof reserva.fecha_llegada === 'string'
                ? parseISO(reserva.fecha_llegada)
                : new Date(reserva.fecha_llegada);

            if (isValid(fechaLlegadaDate)) {
                const mesIndex = fechaLlegadaDate.getMonth(); // 0 = Enero, 11 = Diciembre
                if (mesIndex >= 0 && mesIndex < 12) {
                    meses[mesIndex].reservas += 1;
                    // Asegura que precio_total es un número antes de sumar
                    const precio = parseFloat(reserva.precio_total);
                    if (!isNaN(precio)) {
                        meses[mesIndex].ingresos += precio;
                    }
                }
            }
        } catch (error) {
            console.error("Error procesando reserva:", reserva, error);
        }
    });

    // Redondea los ingresos al final
    return meses.map((mesData) => ({
        ...mesData,
        ingresos: parseFloat(mesData.ingresos.toFixed(2)),
    }));
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