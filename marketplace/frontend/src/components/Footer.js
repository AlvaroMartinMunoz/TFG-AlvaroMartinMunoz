import React from "react";
import {
  Box,
  Container,
  Grid,
  Typography,
  Link,
  Divider,
  IconButton,
  Stack
} from "@mui/material";
import {
  Facebook as FacebookIcon,
  Twitter as TwitterIcon,
  Instagram as InstagramIcon,
  LinkedIn as LinkedInIcon
} from "@mui/icons-material";

const Footer = () => {
  return (
    <Box
      component="footer"
      sx={{
        background: "linear-gradient(to right, #304352, #2c3e50)",
        color: "white",
        pt: 6,
        pb: 3,
        mt: 'auto'
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          <Grid item xs={12} sm={4}>
            <Typography variant="h6" color="common.white" gutterBottom fontWeight="bold">
              Ayuda
            </Typography>
            <Box>
              <Link href="/contacta-con-nosotros" color="common.white" sx={{ display: "block", mb: 1, textDecoration: "none", opacity: 0.8, "&:hover": { opacity: 1 } }}>
                Contacta con nosotros
              </Link>


            </Box>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography variant="h6" color="common.white" gutterBottom fontWeight="bold">
              Políticas
            </Typography>
            <Box>
              <Link href="/terminos-y-condiciones" color="common.white" sx={{ display: "block", mb: 1, textDecoration: "none", opacity: 0.8, "&:hover": { opacity: 1 } }}>
                Términos y condiciones
              </Link>
              <Link href="/politica-de-privacidad" color="common.white" sx={{ display: "block", mb: 1, textDecoration: "none", opacity: 0.8, "&:hover": { opacity: 1 } }}>
                Política de privacidad
              </Link>

            </Box>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography variant="h6" color="common.white" gutterBottom fontWeight="bold">
              Más Información
            </Typography>
            <Box>
              <Link href="/sobre-nosotros" color="common.white" sx={{ display: "block", mb: 1, textDecoration: "none", opacity: 0.8, "&:hover": { opacity: 1 } }}>
                Sobre nosotros
              </Link>


            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ my: 4, bgcolor: "rgba(255,255,255,0.2)" }} />

        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" }}>
          <Typography variant="body2" color="common.white" sx={{ mb: { xs: 2, md: 0 }, opacity: 0.8 }}>
            © {new Date().getFullYear()} Tu Empresa. Todos los derechos reservados.
          </Typography>
          <Stack direction="row" spacing={1}>
            <IconButton aria-label="facebook" size="small" sx={{ color: "common.white" }}>
              <FacebookIcon fontSize="small" />
            </IconButton>
            <IconButton aria-label="twitter" size="small" sx={{ color: "common.white" }}>
              <TwitterIcon fontSize="small" />
            </IconButton>
            <IconButton aria-label="instagram" size="small" sx={{ color: "common.white" }}>
              <InstagramIcon fontSize="small" />
            </IconButton>
            <IconButton aria-label="linkedin" size="small" sx={{ color: "common.white" }}>
              <LinkedInIcon fontSize="small" />
            </IconButton>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;