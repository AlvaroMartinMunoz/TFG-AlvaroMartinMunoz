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
  Paper,
  CircularProgress,
  FormControlLabel,
  Checkbox,
  Link
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { parseISO } from "date-fns";
import { DatePicker } from "@mui/x-date-pickers";

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
    foto_de_perfil: null,
  });
  const [message, setMessage] = useState("");
  const [message2, setMessage2] = useState("");
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [termsError, setTermsError] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      navigate("/", { replace: true });
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

    const usernameRegex = /^[^\d\s][a-zA-Z0-9\s]*$/;

    const biografiaRegex = /^[a-zA-Z0-9\s,.'!?áéíóúÁÉÍÓÚñÑ-]{1,500}$/;


    if (!usernameRegex.test(formData.direccion)) {
      errors.direccion = "La dirección no puede empezar con espacios ni con numeros";
    }

    if (!biografiaRegex.test(formData.biografia)) {
      errors.biografia = "La biografía no puede empezar con espacios ni con numeros";
    }

    if (!usernameRegex.test(formData.username)) {
      errors.usuario =
        "El nombre de usuario no puede contener espacios ni empezar con números";
    }

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
    setErrors({});
    setMessage("");
    setMessage2("");

    if (!acceptedTerms) {
      setTermsError(true);
      setLoading(false);
      return;
    }

    if (!(await validateForm())) {
      setMessage("Por favor, corrija los errores en el formulario");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("http://localhost:8000/api/usuarios/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setMessage2("Registro exitoso. Redirigiendo...");
        setTimeout(() => {
          navigate("/inicio-de-sesion");
        }, 1500);
      } else {
        const errorData = await response.json();
        setMessage(errorData.detail || "Error al registrar");
      }
    } catch (error) {
      setMessage("Error en la conexión con el servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        backgroundColor: "#f4f7fc",
        minHeight: "85vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 2,
      }}
    >
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper
          elevation={3}
          sx={{
            p: { xs: 2, sm: 3, md: 4 },
            borderRadius: 2,
            backgroundColor: "white",
            transition: "all 0.3s ease",
            "&:hover": {
              boxShadow: 6,
            },
          }}
        >
          <Typography
            variant="h4"
            gutterBottom
            sx={{
              textAlign: "center",
              fontWeight: 600,
              color: "primary.main",
              mb: 3,
            }}
          >
            Registro
          </Typography>

          {message && (
            <Alert
              severity="error"
              sx={{ mb: 2, borderRadius: 1 }}
            >
              {message}
            </Alert>
          )}
          {message2 && (
            <Alert
              severity="success"
              sx={{ mb: 2, borderRadius: 1 }}
            >
              {message2}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", md: "row" },
                gap: 2
              }}
            >
              {/* Primera columna */}
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
                  sx={{
                    mb: 1,
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 1.5,
                    }
                  }}
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
                  sx={{
                    mb: 1,
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 1.5,
                    }
                  }}
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
                  sx={{
                    mb: 1,
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 1.5,
                    }
                  }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={toggleShowPassword}
                          edge="end"
                          aria-label={showPassword ? "ocultar contraseña" : "mostrar contraseña"}
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
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
                  sx={{
                    mb: 1,
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 1.5,
                    }
                  }}
                />

              </Box>

              {/* Segunda columna */}
              <Box sx={{ flex: "1 1 48%" }}>
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
                  sx={{
                    mb: 1,
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 1.5,
                    }
                  }}
                />
                <TextField
                  fullWidth
                  label="Dirección"
                  name="direccion"
                  variant="outlined"
                  margin="normal"
                  onChange={handleChange}
                  error={!!errors.direccion}
                  helperText={errors.direccion}
                  size="small"
                  required
                  sx={{
                    mb: 1,
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 1.5,
                    }
                  }}
                />
                <TextField
                  fullWidth
                  label="Biografía"
                  name="biografia"
                  variant="outlined"
                  margin="normal"
                  onChange={handleChange}
                  error={!!errors.biografia}
                  helperText={errors.biografia}
                  required
                  size="small"
                  sx={{
                    mb: 1,
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 1.5,
                    }
                  }}
                />
                <DatePicker
                  label="Fecha de nacimiento"
                  value={formData.fecha_de_nacimiento ? parseISO(formData.fecha_de_nacimiento) : null}
                  onChange={(newValue) => {
                    if (newValue) {
                      const year = newValue.getFullYear();
                      const month = String(newValue.getMonth() + 1).padStart(2, '0');
                      const day = String(newValue.getDate()).padStart(2, '0');
                      setFormData({ ...formData, fecha_de_nacimiento: `${year}-${month}-${day}` });
                    } else {
                      setFormData({ ...formData, fecha_de_nacimiento: '' });
                    }
                  }
                  }
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      required: true,
                      size: "small",
                      margin: "normal",
                      error: !!errors.fecha_de_nacimiento,
                      helperText: errors.fecha_de_nacimiento,
                      sx: {
                        mb: 1,
                        "& .MuiOutlinedInput-root": {
                          borderRadius: 1.5,
                        }
                      }
                    }
                  }}
                />
              </Box>
            </Box>
            <FormControlLabel
              control={
                <Checkbox
                  checked={acceptedTerms}
                  onChange={(e) => {
                    setAcceptedTerms(e.target.checked);
                    setTermsError(false); // Limpia el error al marcar
                  }}
                  color="primary"
                />
              }
              label={
                <Typography variant="body2">
                  Acepto los{" "}
                  <Link
                    to="/terminos-y-condiciones"
                    style={{ color: "#1976d2", textDecoration: "none" }}
                    onClick={(e) => {
                      e.preventDefault();
                      window.open("/terminos-y-condiciones", "_blank");
                    }}
                  >
                    términos y condiciones
                  </Link>
                </Typography>
              }
              sx={{ mt: 2 }}
            />
            {termsError && (
              <Typography color="error" variant="body2" sx={{ mt: 1 }}>
                Debes aceptar los términos y condiciones para continuar.
              </Typography>
            )}


            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              disabled={loading}
              sx={{
                mt: 3,
                py: 1.2,
                borderRadius: 1.5,
                textTransform: "none",
                fontWeight: 600,
                fontSize: "1rem",
                boxShadow: 2,
                "&:hover": {
                  boxShadow: 4,
                }
              }}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                "Completar Registro"
              )}
            </Button>
          </form>
        </Paper>
      </Container>
    </Box>
  );
};

export default Register;