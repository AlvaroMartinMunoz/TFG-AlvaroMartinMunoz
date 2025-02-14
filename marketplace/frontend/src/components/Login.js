import {
  Alert,
  Box,
  Button,
  Container,
  TextField,
  Typography,
  IconButton,
  InputAdornment,
} from "@mui/material";
import NavBar from "./NavBar";
import Footer from "./Footer";
import { useState } from "react";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { set } from "date-fns";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [formData, setFormData] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!formData.username || !formData.password) {
      setError("Por favor, rellene todos los campos");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("http://localhost:8000/api/token/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        setError("Credenciales incorrectas");
        setLoading(false);
        return;
      }

      const data = await response.json();
      localStorage.setItem("accessToken", data.access);
      localStorage.setItem("refreshToken", data.refresh);
      navigate("/");
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ backgroundColor: "#f4f7fc", minHeight: "100vh" }}>
      <NavBar />
      <Container
        maxWidth="xs"
        sx={{
          minHeight: "80vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Box sx={{ textAlign: "center", width: "100%" }}>
          <Typography variant="h4" gutterBottom>
            {" "}
            Iniciar Sesion{" "}
          </Typography>
          {error && <Alert severity="error">{error}</Alert>}
          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Nombre de usuario"
              name="username"
              variant="outlined"
              margin="normal"
              onChange={handleChange}
              required
            />

            <TextField
              fullWidth
              label="Contraseña"
              name="password"
              type={showPassword ? "text" : "password"}
              variant="outlined"
              margin="normal"
              onChange={handleChange}
              required
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={toggleShowPassword} edge="end">
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />

            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              sx={{ mt: 2 }}
            >
              Iniciar Sesion
            </Button>
          </form>
        </Box>
      </Container>
      <Footer />
    </div>
  );
};

export default Login;
