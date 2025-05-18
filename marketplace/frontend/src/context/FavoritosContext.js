import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { API_BASE_URL } from '../config';


const FavoritosContext = createContext();

export function FavoritosProvider({ children }) {
    const usuarioId = JSON.parse(localStorage.getItem("additionalInfo"))?.usuarioId;
    const [favoritosNavbar, setFavoritosNavbar] = useState(0);

    const isAuthenticated = useCallback(() => {
        return !!localStorage.getItem("accessToken");
    }, []);

    const fetchFavoritosNavbar = useCallback(async (retried = false) => {
        if (!isAuthenticated()) return;
        try {
            const response = await fetch(`${API_BASE_URL}/api/propiedades/favoritos-por-usuario/${usuarioId}`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setFavoritosNavbar(data.length);
            }
            if (response.status === 401 && !retried) {
                console.log("Token expirado");
                const token = await refreshAccessToken();
                if (token) {
                    fetchFavoritosNavbar(true);
                }
            }
        } catch (error) {
            console.error("Error al obtener los favoritos:", error);
        }
    }, [usuarioId]);

    useEffect(() => {
        if (isAuthenticated()) {
            fetchFavoritosNavbar();
        }
    }, [isAuthenticated, fetchFavoritosNavbar]);

    const actualizarFavoritosNavbar = useCallback(() => {
        fetchFavoritosNavbar();
    }, [fetchFavoritosNavbar]);



    const refreshAccessToken = async () => {
        try {
            const refreshToken = localStorage.getItem("refreshToken");
            if (!refreshToken) {
                console.log("No hay token de refresco");
                return null;
            }
            const response = await fetch(`${API_BASE_URL}/api/token/refresh/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ refresh: refreshToken }),
            });
            if (response.ok) {
                const data = await response.json();
                localStorage.setItem("accessToken", data.access);
                return data.access;
            } else {
                console.log("Error al refrescar el token");
                return null;
            }
        } catch (error) {
            console.error("Error al refrescar el token", error);
            return null;
        }
    };

    return (
        <FavoritosContext.Provider value={{ favoritosNavbar, actualizarFavoritosNavbar }}>
            {children}
        </FavoritosContext.Provider>
    );
}

export function useFavoritos() {
    return useContext(FavoritosContext);
}

