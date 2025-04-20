import { useState } from "react";
import { DatePicker } from "@mui/x-date-pickers";
import { Box, Button, TextField, Typography, IconButton } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";

const SearchBar = () => {
    const [fechaLlegada, setFechaLlegada] = useState(null);
    const [fechaSalida, setFechaSalida] = useState(null);
    const [numPersonas, setNumPersonas] = useState(1);

    const handleIncrement = () => setNumPersonas((prev) => Math.min(15, prev + 1));
    const handleDecrement = () => setNumPersonas((prev) => Math.max(1, prev - 1));

    return (
        <Box sx={{ textAlign: "center", maxWidth: 600, p: 3 }}>
            <Typography variant="h4" fontWeight="bold">Descubre las mejores playas</Typography>
            <Typography variant="h6">Vive tus sueños frente al mar, en los mejores pisos y al mejor precio</Typography>

            <Box sx={{ display: "flex", gap: 2, justifyContent: "center", alignItems: "center", mt: 3 }}>
                <DatePicker label="Llegada" value={fechaLlegada} onChange={setFechaLlegada} renderInput={(params) => <TextField {...params} />} disablePast />
                <DatePicker label="Salida" value={fechaSalida} onChange={setFechaSalida} renderInput={(params) => <TextField {...params} />} disablePast minDate={fechaLlegada} />

                <Box sx={{ display: "flex", alignItems: "center" }}>
                    <IconButton onClick={handleDecrement}><RemoveIcon /></IconButton>
                    <Typography sx={{ mx: 2 }}>{numPersonas}</Typography>
                    <IconButton onClick={handleIncrement}><AddIcon /></IconButton>
                </Box>

                <Button variant="contained" color="primary" sx={{ borderRadius: "50%", p: 1 }}>
                    <SearchIcon fontSize="large" />
                </Button>
            </Box>
        </Box>
    );
};

export default SearchBar;
