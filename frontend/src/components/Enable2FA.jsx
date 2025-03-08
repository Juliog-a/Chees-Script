import axios from "axios";
import { useNavigate } from "react-router-dom";

const handleEnable2FA = async () => {
    const navigate = useNavigate(); // Para redirigir al login
    const token = localStorage.getItem("accessToken");

    try {
        const response = await axios.get("http://127.0.0.1:8000/api/enable-2fa/", {
            headers: { Authorization: `Bearer ${token}` },
            validateStatus: (status) => status < 500, // Permite capturar respuestas 302 y 403
        });

        if (response.status === 403) {
            alert("⚠️ No tienes permisos. Redirigiendo a login...");
            navigate("/login");  // Redirige al login si no está autenticado
            return;
        }

        if (response.status === 302) {
            console.warn("Redirección detectada, el usuario no está autenticado.");
            navigate("/login"); // Redirigir al login en React
            return;
        }

        if (response.status === 200) {
            console.log("Código QR recibido:", response.data.qr_code);
        }
    } catch (error) {
        console.error("Error al activar 2FA:", error);
    }
};
