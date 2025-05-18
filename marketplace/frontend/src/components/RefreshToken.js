import { API_BASE_URL } from "../apiConfig";

const refreshAccessToken = async () => {

    const handleLogOut = () => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        window.location.reload();
    };

    try {
        const refreshToken = localStorage.getItem("refreshToken");

        if (!refreshToken) {
            console.log("No hay token de refresco");
            handleLogOut();
            return null;
        }

        const response = await fetch(`${API_BASE_URL}/api/token/refresh/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ refresh: refreshToken }),
        });

        if (response.ok) {
            const data = await response.json();
            localStorage.setItem("accessToken", data.access);
            return data.access;
        } else {
            console.log("Error al refrescar el token");
            handleLogOut();
            return null;
        }
    } catch (error) {
        console.error("Error al refrescar el token", error);
        return null;
    }


};

export default refreshAccessToken;    