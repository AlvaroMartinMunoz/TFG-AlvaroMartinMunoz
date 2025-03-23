import { Box, CircularProgress, Typography, Paper, Tabs, Tab, Chip, Divider } from "@mui/material";
import axios from "axios";
import { useEffect, useState, useRef } from "react";
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const Weather = () => {
    const [weatherData, setWeatherData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [location, setLocation] = useState({
        lat: 40.4167,
        lng: -3.70325,
        name: "Madrid"
    });
    const [tabValue, setTabValue] = useState(0);
    const mapRef = useRef(null);
    const markerRef = useRef(null);
    const mapContainerRef = useRef(null);

    const fetchWeather = async (lat, lng) => {
        try {
            setLoading(true);
            const [weatherRes, geoRes] = await Promise.all([
                axios.get('https://api.open-meteo.com/v1/forecast', {
                    params: {
                        latitude: lat,
                        longitude: lng,
                        current: 'temperature_2m,weather_code,wind_speed_10m,relative_humidity_2m,apparent_temperature,precipitation',
                        hourly: 'temperature_2m,precipitation_probability,weather_code',
                        daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,sunrise,sunset',
                        timezone: 'auto',
                        forecast_days: 7
                    }
                }),
                axios.get('https://nominatim.openstreetmap.org/reverse', {
                    params: {
                        format: 'json',
                        lat: lat,
                        lon: lng
                    }
                })
            ]);

            const newLocationName = geoRes.data.address?.city ||
                geoRes.data.address?.town ||
                geoRes.data.address?.village ||
                geoRes.data.address?.municipality ||
                "Ubicación desconocida";

            setLocation({
                lat,
                lng,
                name: newLocationName
            });

            setWeatherData({
                ...weatherRes.data,
                locationName: newLocationName
            });

        } catch (error) {
            setError(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (mapContainerRef.current && !mapRef.current) {
            mapRef.current = L.map(mapContainerRef.current).setView([location.lat, location.lng], 10);

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap contributors'
            }).addTo(mapRef.current);

            markerRef.current = L.marker([location.lat, location.lng]).addTo(mapRef.current)
                .bindPopup(`${location.name}<br>${weatherData?.current?.temperature_2m}°C`);

            mapRef.current.on('click', (e) => {
                fetchWeather(e.latlng.lat, e.latlng.lng);
            });
        }

        if (mapRef.current && markerRef.current) {
            mapRef.current.setView([location.lat, location.lng]);
            markerRef.current.setLatLng([location.lat, location.lng])
                .setPopupContent(`${location.name}<br>${weatherData?.current?.temperature_2m}°C`);
        }

        return () => {
            if (mapRef.current) {
                mapRef.current.off();
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, [location, weatherData]);

    useEffect(() => {
        const handleResize = () => {
            if (mapRef.current) {
                setTimeout(() => {
                    mapRef.current.invalidateSize();
                }, 100);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        fetchWeather(location.lat, location.lng);
    }, []);

    const getWeatherIcon = (code) => {
        const icons = {
            0: '☀️', // Clear sky
            1: '🌤️', // Mainly clear
            2: '⛅', // Partly cloudy
            3: '☁️', // Overcast
            45: '🌫️', // Fog
            48: '🌫️', // Depositing rime fog
            51: '🌦️', // Light drizzle
            53: '🌦️', // Moderate drizzle
            55: '🌧️', // Dense drizzle
            56: '🌨️', // Light freezing drizzle
            57: '🌨️', // Dense freezing drizzle
            61: '🌧️', // Slight rain
            63: '🌧️', // Moderate rain
            65: '🌧️', // Heavy rain
            66: '🌨️', // Light freezing rain
            67: '🌨️', // Heavy freezing rain
            71: '🌨️', // Slight snow fall
            73: '🌨️', // Moderate snow fall
            75: '❄️', // Heavy snow fall
            77: '❄️', // Snow grains
            80: '🌦️', // Slight rain showers
            81: '🌧️', // Moderate rain showers
            82: '⛈️', // Violent rain showers
            85: '🌨️', // Slight snow showers
            86: '❄️', // Heavy snow showers
            95: '⛈️', // Thunderstorm
            96: '⛈️', // Thunderstorm with slight hail
            99: '⛈️', // Thunderstorm with heavy hail
        };
        return icons[code] || '🌤️';
    };

    const getWeatherDescription = (code) => {
        const descriptions = {
            0: 'Cielo despejado',
            1: 'Mayormente despejado',
            2: 'Parcialmente nublado',
            3: 'Nublado',
            45: 'Niebla',
            48: 'Niebla helada',
            51: 'Llovizna ligera',
            53: 'Llovizna moderada',
            55: 'Llovizna densa',
            56: 'Llovizna helada ligera',
            57: 'Llovizna helada densa',
            61: 'Lluvia ligera',
            63: 'Lluvia moderada',
            65: 'Lluvia intensa',
            66: 'Lluvia helada ligera',
            67: 'Lluvia helada intensa',
            71: 'Nevada ligera',
            73: 'Nevada moderada',
            75: 'Nevada intensa',
            77: 'Granos de nieve',
            80: 'Chubascos ligeros',
            81: 'Chubascos moderados',
            82: 'Chubascos violentos',
            85: 'Chubascos de nieve ligeros',
            86: 'Chubascos de nieve intensos',
            95: 'Tormenta',
            96: 'Tormenta con granizo ligero',
            99: 'Tormenta con granizo intenso',
        };
        return descriptions[code] || 'Desconocido';
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            weekday: 'long',
            day: 'numeric',
            month: 'long'
        });
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress size={60} />
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <Typography variant="h5" color="error">Error: {error.message}</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ padding: 2, width: '100%', height: '100%' }}>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
                Pronóstico Meteorológico
            </Typography>
            <Paper elevation={3} sx={{ borderRadius: 2, overflow: 'hidden' }}>
                <Box sx={{
                    display: 'flex',
                    height: '75vh',
                    width: '100%',
                    flexDirection: { xs: 'column', md: 'row' },
                }}>
                    <Box sx={{
                        width: { xs: '100%', md: '60%' },
                        height: { xs: '40vh', md: '100%' },
                    }}>
                        <div ref={mapContainerRef} style={{ height: '100%', width: '100%' }}></div>
                    </Box>

                    <Box sx={{
                        width: { xs: '100%', md: '40%' },
                        height: { xs: '60vh', md: '100%' },
                        display: 'flex',
                        flexDirection: 'column',
                    }}>
                        <Box sx={{ p: 3, bgcolor: 'primary.main', color: 'white' }}>
                            <Typography variant="h4" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                                {getWeatherIcon(weatherData.current.weather_code)}
                                {weatherData.current.temperature_2m}°C
                            </Typography>
                            <Typography variant="body1" sx={{ mt: 1, mb: 2 }}>
                                {getWeatherDescription(weatherData.current.weather_code)}
                            </Typography>
                            <Typography variant="h6">
                                {weatherData.locationName}
                            </Typography>
                            <Typography variant="subtitle2">
                                {new Date().toLocaleDateString('es-ES', {
                                    weekday: 'long',
                                    day: 'numeric',
                                    month: 'long',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </Typography>
                        </Box>

                        <Box sx={{ bgcolor: 'background.paper', flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                            <Tabs
                                value={tabValue}
                                onChange={handleTabChange}
                                variant="fullWidth"
                                sx={{ borderBottom: 1, borderColor: 'divider' }}
                            >
                                <Tab label="Actual" />
                                <Tab label="Por Horas" />
                                <Tab label="Próximos Días" />
                            </Tabs>

                            <Box sx={{ p: 2, overflow: 'auto', flex: 1 }}>
                                {tabValue === 0 && (
                                    <Box>
                                        {/* Replaced Grid with Box and flexbox */}
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
                                            <Box sx={{ flex: '1 1 calc(50% - 8px)', minWidth: '120px' }}>
                                                <Paper sx={{ p: 2, textAlign: 'center', height: '100%' }}>
                                                    <Typography variant="body2" color="text.secondary">Sensación Térmica</Typography>
                                                    <Typography variant="h5">{weatherData.current.apparent_temperature}°C</Typography>
                                                </Paper>
                                            </Box>
                                            <Box sx={{ flex: '1 1 calc(50% - 8px)', minWidth: '120px' }}>
                                                <Paper sx={{ p: 2, textAlign: 'center', height: '100%' }}>
                                                    <Typography variant="body2" color="text.secondary">Humedad</Typography>
                                                    <Typography variant="h5">{weatherData.current.relative_humidity_2m}%</Typography>
                                                </Paper>
                                            </Box>
                                            <Box sx={{ flex: '1 1 calc(50% - 8px)', minWidth: '120px' }}>
                                                <Paper sx={{ p: 2, textAlign: 'center', height: '100%' }}>
                                                    <Typography variant="body2" color="text.secondary">Viento</Typography>
                                                    <Typography variant="h5">{weatherData.current.wind_speed_10m} km/h</Typography>
                                                </Paper>
                                            </Box>
                                            <Box sx={{ flex: '1 1 calc(50% - 8px)', minWidth: '120px' }}>
                                                <Paper sx={{ p: 2, textAlign: 'center', height: '100%' }}>
                                                    <Typography variant="body2" color="text.secondary">Precipitación</Typography>
                                                    <Typography variant="h5">{weatherData.current.precipitation} mm</Typography>
                                                </Paper>
                                            </Box>
                                        </Box>

                                        <Box sx={{ mb: 3 }}>
                                            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>Amanecer y Atardecer</Typography>
                                            <Paper sx={{ p: 2 }}>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <Box sx={{ textAlign: 'center' }}>
                                                        <Typography variant="body2" color="text.secondary">Amanecer</Typography>
                                                        <Typography variant="h6">🌅 {formatTime(weatherData.daily.sunrise[0])}</Typography>
                                                    </Box>
                                                    <Box sx={{ textAlign: 'center' }}>
                                                        <Typography variant="body2" color="text.secondary">Atardecer</Typography>
                                                        <Typography variant="h6">🌇 {formatTime(weatherData.daily.sunset[0])}</Typography>
                                                    </Box>
                                                </Box>
                                            </Paper>
                                        </Box>

                                        <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>Hoy</Typography>
                                        <Paper sx={{ p: 2 }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                                <Typography variant="body1">{formatDate(weatherData.daily.time[0])}</Typography>
                                                <Typography variant="h5">{getWeatherIcon(weatherData.daily.weather_code[0])}</Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Typography variant="body2" color="text.secondary">
                                                    {getWeatherDescription(weatherData.daily.weather_code[0])}
                                                </Typography>
                                                <Typography variant="h6">
                                                    {weatherData.daily.temperature_2m_min[0]}° / {weatherData.daily.temperature_2m_max[0]}°
                                                </Typography>
                                            </Box>
                                            {weatherData.daily.precipitation_sum[0] > 0 && (
                                                <Box sx={{ mt: 1 }}>
                                                    <Chip
                                                        label={`Precipitación: ${weatherData.daily.precipitation_sum[0]} mm`}
                                                        size="small"
                                                        color="info"
                                                    />
                                                </Box>
                                            )}
                                        </Paper>
                                    </Box>
                                )}

                                {tabValue === 1 && (
                                    <Box sx={{ overflow: 'auto' }}>
                                        <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>Próximas 24 horas</Typography>
                                        {weatherData.hourly.time.slice(0, 24).map((time, index) => (
                                            <Paper key={time} sx={{ p: 2, mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                <Box>
                                                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                                        {new Date(time).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary">
                                                        {new Date(time).toLocaleDateString('es-ES', { weekday: 'short' })}
                                                    </Typography>
                                                </Box>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                    <Typography variant="body1">{getWeatherIcon(weatherData.hourly.weather_code[index])}</Typography>
                                                    <Typography variant="h6">{weatherData.hourly.temperature_2m[index]}°C</Typography>
                                                </Box>
                                                <Box>
                                                    {weatherData.hourly.precipitation_probability[index] > 0 && (
                                                        <Chip
                                                            label={`${weatherData.hourly.precipitation_probability[index]}%`}
                                                            size="small"
                                                            color={weatherData.hourly.precipitation_probability[index] > 50 ? "primary" : "default"}
                                                            icon={<span>💧</span>}
                                                        />
                                                    )}
                                                </Box>
                                            </Paper>
                                        ))}
                                    </Box>
                                )}

                                {tabValue === 2 && (
                                    <Box>
                                        <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>Pronóstico de 7 días</Typography>
                                        {weatherData.daily.time.map((day, index) => (
                                            <Paper key={day} sx={{ p: 2, mb: 2 }}>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                                        {formatDate(day)}
                                                    </Typography>
                                                    <Typography variant="h5">{getWeatherIcon(weatherData.daily.weather_code[index])}</Typography>
                                                </Box>

                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <Typography variant="body2" color="text.secondary">
                                                        {getWeatherDescription(weatherData.daily.weather_code[index])}
                                                    </Typography>
                                                    <Typography variant="h6">
                                                        {weatherData.daily.temperature_2m_min[index]}° / {weatherData.daily.temperature_2m_max[index]}°
                                                    </Typography>
                                                </Box>

                                                <Divider sx={{ my: 1 }} />

                                                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                                    {weatherData.daily.precipitation_sum[index] > 0 && (
                                                        <Chip
                                                            label={`Precipitación: ${weatherData.daily.precipitation_sum[index]} mm`}
                                                            size="small"
                                                            color="info"
                                                        />
                                                    )}

                                                    {weatherData.daily.precipitation_probability_max[index] > 0 && (
                                                        <Chip
                                                            label={`Prob. de lluvia: ${weatherData.daily.precipitation_probability_max[index]}%`}
                                                            size="small"
                                                            color={weatherData.daily.precipitation_probability_max[index] > 50 ? "primary" : "default"}
                                                        />
                                                    )}
                                                </Box>

                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                                                    <Typography variant="body2">
                                                        🌅 {formatTime(weatherData.daily.sunrise[index])}
                                                    </Typography>
                                                    <Typography variant="body2">
                                                        🌇 {formatTime(weatherData.daily.sunset[index])}
                                                    </Typography>
                                                </Box>
                                            </Paper>
                                        ))}
                                    </Box>
                                )}
                            </Box>
                        </Box>
                    </Box>
                </Box>
            </Paper>
        </Box>
    );
};

export default Weather;