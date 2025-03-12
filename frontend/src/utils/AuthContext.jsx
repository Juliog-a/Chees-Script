import { createContext, useState, useEffect } from "react";
import axios from "axios";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(null);
    const [accessToken, setAccessToken] = useState(localStorage.getItem("accessToken"));
    const [refreshToken, setRefreshToken] = useState(localStorage.getItem("refreshToken"));

    // Función para refrescar el token de acceso
    const refreshAccessToken = async () => {
        if (!refreshToken) {
            console.log("No hay refreshToken disponible.");
            logout();
            return;
        }

        try {
            const response = await axios.post("http://127.0.0.1:8000/api/token/refresh/", {
                refresh: refreshToken,
            });

            if (response.status === 200) {
                console.log("Token refrescado correctamente.");
                localStorage.setItem("accessToken", response.data.access);
                setAccessToken(response.data.access);
                setIsAuthenticated(true);
            }
        } catch (error) {
            console.error("Error al refrescar el token:", error);
            logout(); // Si falla el refresh, forzar logout
        }
    };

    // Función para verificar si el token sigue siendo válido y si el usuario tiene perfil
    const checkTokenValidity = async () => {
        const token = localStorage.getItem("accessToken");

        if (!token) {
            console.log("Token no encontrado. Cerrando sesión.");
            logout();
            return;
        }

        try {
            const response = await axios.get("http://127.0.0.1:8000/api/user/", {
                headers: { Authorization: `Bearer ${token}` },
            });

            // Si el usuario tiene perfil y está autenticado, actualizar estado
            if (response.status === 200) {
                setIsAuthenticated(true);
            }
        } catch (error) {
            if (error.response?.status === 401) {
                console.warn("Token expirado. Cerrando sesión.");
                logout();
            } else {
                console.error("Error verificando token:", error);
            }
        }
    };

    // Efecto para manejar la autenticación y verificar el token periódicamente
    useEffect(() => {
        const token = localStorage.getItem("accessToken");
        const refresh = localStorage.getItem("refreshToken");

        console.log("AuthContext cargando... Token detectado:", token);
        setIsAuthenticated(!!token);
        setAccessToken(token);
        setRefreshToken(refresh);

        if (token) {
            // Refrescar token cada 10 minutos para el modo debug
            const refreshInterval = setInterval(refreshAccessToken, 10 * 60 * 1000);

            // Verificar token cada 50 segundos para evitar llamadas excesivas
            const checkInterval = setInterval(checkTokenValidity, 50000);

            return () => {
                clearInterval(refreshInterval);
                clearInterval(checkInterval);
            };
        }
    }, []);

    // Función de inicio de sesión
    const login = (token, refresh, is2FA = false) => {
        if (is2FA) {
            console.log("2FA habilitado. Esperando verificación antes de guardar el token.");
            return;
        }
    
        console.log("Usuario autenticado. Guardando tokens...");
        localStorage.setItem("accessToken", token);
        localStorage.setItem("refreshToken", refresh);
        setAccessToken(token);
        setRefreshToken(refresh);
        setIsAuthenticated(true);
    };

    // Función de cierre de sesión
    const logout = () => {
        console.log("Cerrando sesión...");
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        setAccessToken(null);
        setRefreshToken(null);
        setIsAuthenticated(false);
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, accessToken, refreshToken, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
