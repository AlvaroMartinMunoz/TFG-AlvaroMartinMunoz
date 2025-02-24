import React, { useState, useEffect, use } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
const Profile = () => {



    const [formData, setFormData] = useState({
        username: "",
        email: "",
        dni: "",
        telefono: "",
        direccion: "",
        biographia: "",
        fecha_nacimiento: "",
        rol: "",
    });

    const [errors, setErrors] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogOut = () => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        window.location.reload();
    };

    useEffect(() => {

        const token = localStorage.getItem("accessToken");
        const usuarioIdSinParse = localStorage.getItem("additionalInfo");
        const usuarioId = JSON.parse(usuarioIdSinParse).usuarioId;

        if (token) {
            try {
                const decodedToken = jwtDecode(token);
                if (decodedToken && decodedToken.user_id) {
                    fetchProfile(usuarioId);
                } else {
                    handleLogOut();
                    navigate("/inicio-de-sesion");
                }
            } catch (error) {
                console.error("Error al decodificar el token:", error);
            }
        }

    }, []);




    const fetchProfile = async (usuarioId) => {
        try {

            const response = await fetch(`http://localhost:8000/api/usuarios/${usuarioId}/`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                },

            });
            if (!response.ok) {
                handleLogOut();
                navigate("/inicio-de-sesion");
                return;
            }

            const data = await response.json();
            setFormData(data);
        } catch (error) {
            console.error("Error al obtener el perfil:", error);
        }
    };

    return (
        <div>
            <h1>Profile</h1>
        </div>
    );
}
export default Profile;