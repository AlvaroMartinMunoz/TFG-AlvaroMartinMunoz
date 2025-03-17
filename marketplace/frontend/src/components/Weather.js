import { Box, CircularProgress, Typography, Paper } from "@mui/material";
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
                        current: 'temperature_2m,weather_code,wind_speed_10m,relative_humidity_2m',
                        hourly: 'temperature_2m,precipitation_probability',
                        daily: 'weather_code,temperature_2m_max,temperature_2m_min',
                        timezone: 'auto'
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

            const newLocationName = geoRes.data.address?.city || geoRes.data.address?.town || geoRes.data.address?.village || "Ubicación desconocida";

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
        // Manejar redimensionamiento de ventana
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
            0: '☀️', 1: '⛅', 2: '☁️', 3: '🌧',
            45: '🌫', 51: '🌦', 61: '🌧', 71: '🌨', 80: '⛈'
        };
        return icons[code] || '🌤';
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
        <Box sx={{ padding: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Información Meteorológica
            </Typography>
            <Box sx={{
                display: 'flex',
                height: '60vh',  // Altura fija principal
                width: '100%',
                flexDirection: { xs: 'column', md: 'row' },
                marginTop: 2,
                mb: 2,
                boxShadow: 3

            }}>
                <Box sx={{
                    width: { xs: '100%', md: '70%' },
                    height: { xs: '40vh', md: '100%' }, // Altura completa en desktop
                }}>
                    <div ref={mapContainerRef} style={{ height: '100%', width: '100%' }}></div>
                </Box>

                <Box sx={{
                    width: { xs: '100%', md: '30%' },
                    height: { xs: '40vh', md: '100%' },
                    p: 2,
                    bgcolor: 'background.paper',
                    overflow: 'auto',
                    boxShadow: 3
                }}>
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="h4" sx={{ fontWeight: 700 }}>
                            {getWeatherIcon(weatherData.current.weather_code)}
                        </Typography>
                        <Typography variant="h4" sx={{ my: 1 }}>
                            {weatherData.current.temperature_2m}°C
                        </Typography>
                        <Typography variant="h6" color="text.secondary">
                            {weatherData.locationName}
                        </Typography>
                    </Box>

                    <Box sx={{
                        display: 'flex',
                        gap: 1,
                        mb: 3,
                        flexWrap: 'wrap',
                        '& > *': { flex: '1 1 150px' }
                    }}>
                        <Paper sx={{ p: 1, textAlign: 'center' }}>
                            <Typography variant="body2">Humedad</Typography>
                            <Typography variant="h5">{weatherData.current.relative_humidity_2m}%</Typography>
                        </Paper>
                        <Paper sx={{ p: 1, textAlign: 'center' }}>
                            <Typography variant="body2">Viento</Typography>
                            <Typography variant="h5">{weatherData.current.wind_speed_10m} km/h</Typography>
                        </Paper>
                    </Box>

                    <Typography variant="h6" sx={{ mb: 1 }}>Próximas Horas</Typography>
                    <Box sx={{
                        display: 'flex',
                        gap: 1,
                        mb: 3,
                        overflowX: 'auto',
                        pb: 1
                    }}>
                        {weatherData.hourly.time.slice(0, 12).map((time, index) => (
                            <Paper key={time} sx={{ p: 1, minWidth: 80, textAlign: 'center', flexShrink: 0 }}>
                                <Typography variant="body2">{new Date(time).getHours()}h</Typography>
                                <Typography variant="h6">{weatherData.hourly.temperature_2m[index]}°C</Typography>
                            </Paper>
                        ))}
                    </Box>
                </Box>
            </Box>
        </Box>
    );
};

export default Weather;