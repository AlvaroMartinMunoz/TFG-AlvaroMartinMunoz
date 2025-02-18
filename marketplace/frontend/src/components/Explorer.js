import React from "react";
import NavBar from "./NavBar";
import Footer from "./Footer";
import { Box, Container, Typography } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";
import { Button, TextField } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import { useState } from "react";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { es } from "date-fns/locale";

const Explorer = () => {
  const [fechaLlegada, setFechaLlegada] = useState(null);
  const [fechaSalida, setFechaSalida] = useState(null);
  const [numPersonas, setNumPersonas] = useState(1);

  const handleIncrement = () => {
    if (numPersonas < 15) setNumPersonas(numPersonas + 1);
  };

  const handleDecrement = () => {
    if (numPersonas > 1) {
      setNumPersonas(numPersonas - 1);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
      <div style={{ backgroundColor: "#f4f7fc", minHeight: "100vh" }}>
        <NavBar />
        <Container
          maxWidth="xl"
          sx={{
            minHeight: "80vh",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            paddingTop: 4,
            width: "100%",
          }}
        >
          <Box
            sx={{
              textAlign: "center",
              width: "100%",
              marginBottom: 4,
            }}
          >
            <Typography variant="h4" gutterBottom>
              Explorar
            </Typography>
          </Box>

          <Box
            sx={{
              bgcolor: "white",
              width: "65%",
              display: "flex",
              alignContent: "center",
              justifyContent: "center",
              padding: "20px",
              borderRadius: "50px",
              maxHeight: "45px",
            }}
          >
            <DatePicker
              label="Llegada"
              value={fechaLlegada}
              onChange={setFechaLlegada}
              renderInput={(params) => <TextField {...params} />}
              disablePast
            />
            <div className="separador"></div>
            <DatePicker
              label="Salida"
              value={fechaSalida}
              onChange={setFechaSalida}
              renderInput={(params) => <TextField {...params} />}
              disablePast
              minDate={fechaLlegada}
            />
            <div className="separador"></div>
            <div style={{ alignContent: "center", justifyContent: "center" }}>
              <Button className="circular-button" onClick={handleDecrement}>
                <RemoveIcon style={{ color: "black" }} />
              </Button>
              <span>{numPersonas}</span>
              <Button className="circular-button" onClick={handleIncrement}>
                <AddIcon
                  style={{
                    color: "black",
                    alignContent: "center",
                    justifyContent: "center",
                  }}
                />
              </Button>
            </div>
            <div style={{ alignContent: "center", justifyContent: "center" }}>
              Personas
            </div>
            <Button color="primary">
              <SearchIcon
                style={{
                  borderRadius: 100,
                  backgroundColor: "091630",
                  color: "white",
                  fontSize: "3rem",
                  marginLeft: "30px",
                }}
              />
            </Button>
          </Box>

          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 2,
              justifyContent: "center",
              width: "100%",
              overflow: "auto",
              marginTop: 4,
            }}
          >
            <Box
              sx={{
                backgroundColor: "white",
                border: "1px solid #ccc",
                padding: 2,
                width: "calc( 20vw - 16px)",
                boxSizing: "border-box",
                aspectRatio: "1/1",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              Producto 1
            </Box>
            <Box
              sx={{
                backgroundColor: "white",
                border: "1px solid #ccc",
                padding: 2,
                width: "calc( 20vw - 16px)",
                boxSizing: "border-box",
                aspectRatio: "1/1",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              Producto 2
            </Box>
            <Box
              sx={{
                backgroundColor: "white",
                border: "1px solid #ccc",
                padding: 2,
                width: "calc( 20vw - 16px)",
                boxSizing: "border-box",
                aspectRatio: "1",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              Producto 3
            </Box>
            <Box
              sx={{
                backgroundColor: "white",
                border: "1px solid #ccc",
                padding: 2,
                width: "calc( 20vw - 16px)",
                boxSizing: "border-box",
                aspectRatio: "1/1",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              Producto 4
            </Box>

            <Box
              sx={{
                backgroundColor: "white",
                border: "1px solid #ccc",
                padding: 2,
                width: "calc( 20vw - 16px)",
                boxSizing: "border-box",
                aspectRatio: "1/1",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              Producto 1
            </Box>
            <Box
              sx={{
                backgroundColor: "white",
                border: "1px solid #ccc",
                padding: 2,
                width: "calc( 20vw - 16px)",
                boxSizing: "border-box",
                aspectRatio: "1/1",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              Producto 2
            </Box>
            <Box
              sx={{
                backgroundColor: "white",
                border: "1px solid #ccc",
                padding: 2,
                width: "calc( 20vw - 16px)",
                boxSizing: "border-box",
                aspectRatio: "1",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              Producto 3
            </Box>
            <Box
              sx={{
                backgroundColor: "white",
                border: "1px solid #ccc",
                padding: 2,
                width: "calc( 20vw - 16px)",
                boxSizing: "border-box",
                aspectRatio: "1/1",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              Producto 4
            </Box>
          </Box>
        </Container>
        <Box sx={{ marginTop: "20px" }}>
          <Footer />
        </Box>
      </div>
    </LocalizationProvider>
  );
};

export default Explorer;
