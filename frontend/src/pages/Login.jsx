import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../utils/AuthContext";

const Login = () => {
    const { login } = useContext(AuthContext);
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError(null); // Limpiar errores previos
        setSuccess(null); // Limpiar mensajes previos

        try {
            const response = await axios.post("http://127.0.0.1:8000/api/token/", {
                username,
                password,
            });

            if (response.status === 200) {
                console.log("Login exitoso:", response.data);

                // Guardar los tokens en localStorage
                localStorage.setItem("accessToken", response.data.access);
                localStorage.setItem("refreshToken", response.data.refresh);
                login(response.data.access); // Actualiza el contexto de autenticación

                setSuccess("Login exitoso. Redirigiendo...");

                // Redirige al perfil y recarga la página
                setTimeout(() => {
                    navigate("/perfil");
                    window.location.reload(); // Forzar actualización de la UI
                }, 1000);
            }
        } catch (error) {
            console.error("Error en login:", error.response ? error.response.data : error);
            setError("Credenciales incorrectas");
        }
    };

    return (
        <div className="w-screen min-h-screen flex flex-col bg-white text-black">
            {/* Contenedor principal */}
            <div className="flex-1 flex items-center justify-center px-4">
                <div className="w-full max-w-[400px] text-center bg-yellow-200 p-6 rounded-md shadow-md">
                    {/* Título */}
                    <h2 className="text-3xl font-bold mb-6">Login</h2>

                    {/* Mensajes de error o éxito */}
                    {error && <p className="text-red-500">{error}</p>}
                    {success && <p className="text-green-500">{success}</p>}

                    {/* Formulario de login */}
                    <form onSubmit={handleLogin} className="flex flex-col space-y-4">
                        <div className="text-left">
                            <label className="block text-lg font-semibold">Usuario/Email:</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-md bg-yellow-100"
                                required
                            />
                        </div>

                        <div className="text-left">
                            <label className="block text-lg font-semibold">Contraseña:</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-md bg-yellow-100"
                                required
                            />
                        </div>

                        {/* Botón de Login */}
                        <button
                            type="submit"
                            className="bg-black text-yellow-400 px-6 py-3 font-bold rounded-md hover:bg-gray-800 transition"
                        >
                            Login
                        </button>
                    </form>

                    {/* Enlaces para recuperación de cuAenta */}
                    <div className="mt-4">
                    <button
                        onClick={() => window.location.href = "http://127.0.0.1:8000/api/password_reset/"}
                        className="text-blue-600 hover:underline"
                        >
                        He olvidado mi contraseña
                        </button>
                        <br />
                        <button
                            onClick={() => navigate("/register")}
                            className="text-blue-600 hover:underline mt-2"
                        >
                            No tengo cuenta
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;