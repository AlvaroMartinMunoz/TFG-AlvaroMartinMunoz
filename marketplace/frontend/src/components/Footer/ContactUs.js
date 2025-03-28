import React from 'react';
import { Box, Container, Typography, Paper } from "@mui/material";

const ContactUs = () => {
    return (
        <Box
            sx={{
                padding: 2,
                backgroundColor: "#f5f5f5",
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '300px'
            }}
        >
            <Paper
                elevation={3}
                sx={{
                    padding: 3,
                    borderRadius: 2,
                    textAlign: 'center',
                    maxWidth: 500,
                    width: '100%'
                }}
            >
                <Container maxWidth="sm">
                    <Typography
                        variant="h4"
                        component="h2"
                        gutterBottom
                        sx={{
                            color: 'primary.main',
                            fontWeight: 600
                        }}
                    >
                        Contacta con nosotros
                    </Typography>
                    <Typography
                        variant="body1"
                        gutterBottom
                        sx={{
                            color: 'text.secondary',
                            mb: 2
                        }}
                    >
                        Si tienes alguna pregunta o necesitas más información, no dudes en ponerte en contacto con nosotros.
                    </Typography>
                    <Typography
                        variant="body1"
                        sx={{
                            fontWeight: 'bold',
                            color: 'text.primary'
                        }}
                    >
                        bestrentproperties00@gmail.com
                    </Typography>
                </Container>
            </Paper>
        </Box>
    )
}

export default ContactUs;