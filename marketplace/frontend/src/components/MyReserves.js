import { Box, CircularProgress, Container, Paper, Typography } from "@mui/material";
import { useState, useEffect } from "react";
import refreshAccessToken from "./RefreshToken";


const MyReserves = () => {

    const [misReservas, setMisReservas] = useState([]);
    const [propiedades, setPropiedades] = useState([]);
    const [url, setUrl] = useState([]);
    const [imageLoading, setImageLoading] = useState({});
    const [loading, setLoading] = useState(true);


    useEffect(() => {
        fethReservas();
        console.log(misReservas);
    }
        , []);

    useEffect(() => {

        const fetchData = async () => {
            const photoPromises = misReservas.map((reserva) => fetchPropertyPhotos(reserva.propiedad));
            await Promise.all(photoPromises);
            setLoading(false);
        }
        fetchData();

    }, [propiedades]);

    const handleLogOut = () => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        window.location.reload();
    }

    const fethReservas = async (retried = false) => {
        try {
            const response = await fetch("http://localhost:8000/api/propiedades/reservas/", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("accessToken")}`
                }
            });
            if (response.status === 401 && !retried) {
                console.log("Token expirado");
                const token = await refreshAccessToken();
                if (token) {
                    fethReservas(true);
                } else {
                    console.log("Token inválido, cerrando sesión...");
                    handleLogOut();
                }
            } else if (response.ok) {
                const data = await response.json();
                const dataFiltered = data.filter(reserva => reserva.usuario === JSON.parse(localStorage.getItem("additionalInfo")).usuarioId);
                setMisReservas(dataFiltered);
                fetchProperties(dataFiltered);

            } else {
                console.log("Error al obtener las reservas");
            }
        }
        catch (error) {
            console.error("Error al obtener las reservas", error);
        }
    };

    const fetchProperties = async (reservas, retried = false) => {
        const propiedadesData = {};
        for (const reserva of reservas) {
            try {
                const response = await fetch(`http://localhost:8000/api/propiedades/propiedades/${reserva.propiedad}/`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localStorage.getItem("accessToken")}`
                    }
                });
                if (response.status === 401 && !retried) {
                    console.log("Token expirado");
                    const token = await refreshAccessToken();
                    if (token) {
                        fetchProperties(reservas, true);
                    } else {
                        console.log("Token inválido, cerrando sesión...");
                        handleLogOut();
                    }
                } else if (response.ok) {
                    const data = await response.json();

                    propiedadesData[reserva.propiedad] = data;
                } else {
                    console.log("Error al obtener las propiedades");
                }
            }
            catch (error) {
                console.error("Error al obtener las propiedades", error);
            }
        }
        setPropiedades(propiedadesData);
    };

    const fetchPropertyPhotos = async (propiedadId) => {
        setImageLoading((prev) => ({ ...prev, [propiedadId]: true }));
        try {
            const response = await fetch("http://localhost:8000/api/propiedades/fotos-propiedades/");
            if (response.ok) {
                const data = await response.json();
                const filteredData = data.filter((foto) => foto.propiedad === parseInt(propiedadId));
                const portadaFoto = filteredData.find((foto) => foto.es_portada);
                const url = await portadaFoto ? portadaFoto.foto : "https://source.unsplash.com/1600x900/?house";
                setUrl((prev) => ({ ...prev, [propiedadId]: url }));
                setImageLoading((prev) => ({ ...prev, [propiedadId]: false }));
            }
        } catch (error) {
            console.log(error);
        }
    };


    return (
        <Box sx={{ display: 'flex', minHeight: '80vh', flexDirection: 'column', backgroundColor: '#f4f7fc', width: '100%' }}>
            <Container sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', flexDirection: 'column', width: '100%' }}>
                <Typography variant="h4" sx={{ mt: 2, mb: 2 }}>Mis Reservas</Typography>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", flexWrap: "wrap", width: "100%", padding: "20px", borderRadius: "10px", overflow: "auto", }}>
                    {misReservas?.map((reserva, index) => {
                        const propiedad = propiedades[reserva.propiedad];
                        return (
                            <Paper key={index}
                                elevation={3}
                                sx={{
                                    backgroundColor: "white",
                                    flex: "0 0 calc(27.333% - 16px)",
                                    display: "flex",
                                    flexDirection: "column",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    borderRadius: 2,
                                    overflow: "hidden",
                                    mt: 2,
                                    mr: 2,
                                    ml: 2,
                                }}>
                                {imageLoading[propiedad?.id] ? (
                                    <CircularProgress />
                                ) : (
                                    <img src={url[propiedad?.id]} alt="propiedad" style={{ width: "100%", height: "200px", objectFit: "cover", borderRadius: "8px" }} />

                                )}
                                <Box sx={{ p: 2, width: "100%" }}>
                                    <Typography variant="h6" gutterBottom> <a
                                        href={`/detalles/${propiedad?.id}`}
                                        style={{ textDecoration: "none", color: "inherit" }}>{propiedad?.nombre}</a></Typography>
                                    <Typography variant="body2" gutterBottom><strong>Fecha de inicio:</strong> {reserva?.fecha_salida}</Typography>
                                    <Typography variant="body2" gutterBottom>Fecha de fin: {reserva?.fecha_salida}</Typography>
                                    <Typography variant="body2" gutterBottom>Método de Pago: {reserva?.metodo_pago}</Typography>
                                    <Typography variant="body2" gutterBottom>Precio total: {reserva?.precio_total}€</Typography>
                                    <Typography variant="body2" gutterBottom>Estado: {reserva?.estado}</Typography>
                                </Box>


                            </Paper>
                        );
                    })}
                </Box>
            </Container>
        </Box>
    );
};

export default MyReserves;