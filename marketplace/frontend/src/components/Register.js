import { useEffect, useState } from "react";
import {
  Button,
  Box,
  Container,
  TextField,
  Typography,
  InputAdornment,
  IconButton,
  Alert,
} from "@mui/material";
import NavBar from "./NavBar";
import Footer from "./Footer";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

const Register = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    dni: "",
    telefono: "",
    direccion: "",
    biografia: "",
    fecha_de_nacimiento: "",
    rol: "Huesped",
    foto_de_perfil: null,
  });
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      navigate("/");
    }
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const validateForm = async () => {
    const errors = {};
    const today = new Date();
    const eighteenYearsAgo = new Date(
      today.setFullYear(today.getFullYear() - 18)
    );

    const emailRegex =
      /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;

    const emailDominio = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    const dniRegex = /^[0-9]{8}[A-Za-z]$/;

    if (!emailRegex.test(formData.email)) {
      errors.email = "El email debe tener un formato válido";
    }

    if (!emailDominio.test(formData.email)) {
      errors.email = "El email debe tener un dominio válido";
    }

    if (!dniRegex.test(formData.dni)) {
      errors.dni =
        "El DNI debe tener el formato correcto (8 dígitos y 1 letra)";
    }

    if (!/^\d{9}$/.test(formData.telefono)) {
      errors.telefono = "El teléfono debe tener 9 dígitos numéricos";
    }

    const fechaNacimiento = new Date(formData.fecha_de_nacimiento);
    if (fechaNacimiento > eighteenYearsAgo) {
      errors.fecha_de_nacimiento =
        "Debes ser mayor de 18 años para registrarte";
    }

    if (formData.rol !== "Huesped" && formData.rol !== "Anfitrion") {
      errors.rol = "El rol debe ser Huesped o Anfitrion";
    }

    if (formData.password.length < 8) {
      errors.password = "La contraseña debe tener al menos 8 caracteres";
    }

    if (/^\d+$/.test(formData.password)) {
      errors.password = "La contraseña debe tener al menos una letra";
    }

    if (
      formData.password.toLowerCase().includes(formData.username.toLowerCase())
    ) {
      errors.password =
        "La contraseña no puede ser similar al nombre de usuario";
    }

    try {
      const checkResponse = await fetch("http://localhost:8000/api/usuarios/");
      const usuarios = await checkResponse.json();

      const existeUsuario = usuarios.some(
        (u) => u.usuario.username === formData.username
      );
      const existeEmail = usuarios.some(
        (u) => u.usuario.email === formData.email
      );
      const existeTelefono = usuarios.some(
        (u) => u.telefono === formData.telefono
      );
      const existeDni = usuarios.some(
        (u) => u.dni.trim().toLowerCase() === formData.dni.trim().toLowerCase()
      );

      if (existeUsuario) {
        errors.usuario = "El nombre de usuario ya está en uso";
      }
      if (existeEmail) {
        errors.email = "El email ya está en uso";
      }
      if (existeTelefono) {
        errors.telefono = "El teléfono ya está en uso";
      }
      if (existeDni) {
        errors.dni = "El DNI ya está en uso";
      }
    } catch (error) {
      setMessage("Error al validar el formulario");
    }

    setErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!(await validateForm())) {
      setMessage("Por favor, corrija los errores en el formulario");
      setLoading(false);
      return;
    }

    const response = await fetch("http://localhost:8000/api/usuarios/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });

    if (response.ok) {
      const responseData = await response.json();
      const { access, refresh } = responseData;

      localStorage.setItem("accessToken", access);
      localStorage.setItem("refreshToken", refresh);

      navigate("/");

      setMessage("Registro exitoso");
    } else {
      const errorData = await response.json();
      setMessage(errorData.detail || "Error al registrar");
    }

    setLoading(false);
  };

  return (
    <div
      style={{
        backgroundColor: "#f4f7fc",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        flex: "1",
      }}
    >
      <NavBar />
      <Container
        maxWidth="md"
        sx={{
          minHeight: "80vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Box sx={{ textAlign: "center", width: "100%" }}>
          <Typography variant="h4" gutterBottom>
            Registro
          </Typography>

          {message && <Alert severity="error">{message}</Alert>}

          <form onSubmit={handleSubmit}>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: "16px" }}>
              <Box sx={{ flex: "1 1 48%" }}>
                <TextField
                  fullWidth
                  label="Usuario"
                  name="username"
                  variant="outlined"
                  margin="normal"
                  onChange={handleChange}
                  required
                  error={!!errors.usuario}
                  helperText={errors.usuario}
                  size="small"
                />
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  variant="outlined"
                  margin="normal"
                  onChange={handleChange}
                  required
                  error={!!errors.email}
                  helperText={errors.email}
                  size="small"

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
                  size="small"

                  error={!!errors.password}
                  helperText={errors.password}
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
                <TextField
                  fullWidth
                  label="DNI"
                  name="dni"
                  variant="outlined"
                  margin="normal"
                  onChange={handleChange}
                  required
                  error={!!errors.dni}
                  helperText={errors.dni}
                  size="small"

                />
                <TextField
                  fullWidth
                  label="Teléfono"
                  name="telefono"
                  variant="outlined"
                  margin="normal"
                  onChange={handleChange}
                  required
                  error={!!errors.telefono}
                  helperText={errors.telefono}
                  size="small"

                />
              </Box>

              {/* Segunda columna */}
              <Box sx={{ flex: "1 1 48%" }}>
                <TextField
                  fullWidth
                  label="Dirección"
                  name="direccion"
                  variant="outlined"
                  margin="normal"
                  onChange={handleChange}
                  size="small"

                  required
                />
                <TextField
                  fullWidth
                  label="Biografía"
                  name="biografia"
                  variant="outlined"
                  margin="normal"
                  onChange={handleChange}
                  required
                  size="small"

                />
                <TextField
                  fullWidth
                  label="Fecha de nacimiento"
                  name="fecha_de_nacimiento"
                  type="date"
                  variant="outlined"
                  margin="normal"
                  onChange={handleChange}
                  required
                  size="small"

                  error={!!errors.fecha_de_nacimiento}
                  helperText={errors.fecha_de_nacimiento}
                  SlotProps={{
                    input: {
                      shrink: true,
                    },
                  }}
                />
                <TextField
                  fullWidth
                  label="Foto de perfil"
                  name="foto_de_perfil"
                  type="file"
                  variant="outlined"
                  margin="normal"
                  onChange={handleChange}
                  slotProps={{
                    input: {
                      shrink: true,
                    },
                  }}
                />
                <TextField
                  fullWidth
                  label="Rol"
                  name="rol"
                  select
                  variant="outlined"
                  margin="normal"
                  size="small"

                  onChange={handleChange}
                  required
                  SelectProps={{
                    native: true,
                  }}
                >
                  <option value="Huesped">Huesped</option>
                  <option value="Anfitrion">Anfitrion</option>
                </TextField>
              </Box>
            </Box>

            <Button
              type="submit"
              variant="contained"
              color="primary"
              size="small"

              fullWidth
              disabled={loading}
              sx={{ mt: 2 }}
            >
              Registrarse
            </Button>
          </form>
        </Box>
      </Container>
      <Box sx={{ mt: "auto" }}>
        <Footer />
      </Box>
    </div>
  );
};

export default Register;
