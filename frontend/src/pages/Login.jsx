import { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../utils/AuthContext";

const Login = () => {
    // Contexto de autenticación para guardar tokens y actualizar estado global
    const { login, isAuthenticated } = useContext(AuthContext);

    // Estados locales del formulario y manejo de errores/mensajes
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [otp, setOtp] = useState("");
    const [step, setStep] = useState("login"); // Estado para controlar qué formulario mostrar
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const navigate = useNavigate();

    // Redirección automática si ya está autenticado
    useEffect(() => {
        if (isAuthenticated) {
            navigate("/perfil");
        }
    }, [isAuthenticated, navigate]);

    // Manejar envío del formulario inicial (usuario y contraseña)
    const handleLogin = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        try {
            const response = await axios.post("http://127.0.0.1:8000/api/login/", { username, password });

            // Si requiere 2FA, guarda temporalmente los datos necesarios
            if (response.data["2fa_required"]) {
                setStep("2fa");
                sessionStorage.setItem("tempToken", response.data.temp_token);
                sessionStorage.setItem("tempUsername", response.data.username);
                setSuccess("Introduce el código 2FA");
                return;
            }

            // Si no requiere 2FA, guardar tokens, actualizar contexto y redirigir
            localStorage.setItem("accessToken", response.data.access);
            localStorage.setItem("refreshToken", response.data.refresh);
            login(response.data.access, response.data.refresh, false);

            setSuccess("Login exitoso. Redirigiendo...");
            setTimeout(() => navigate("/perfil"), 1000);

        } catch (error) {
            setError(error.response?.data?.error || "Credenciales incorrectas");
        }
    };

    // Manejar envío del formulario OTP
    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        setError(null);

        const temp_token = sessionStorage.getItem("tempToken");
        const username = sessionStorage.getItem("tempUsername");

        try {
            const response = await axios.post("http://127.0.0.1:8000/api/verify-2fa/", { username, otp_code: otp, temp_token });

            if (response.status === 200) {
                sessionStorage.removeItem("tempToken");
                sessionStorage.removeItem("tempUsername");

                localStorage.setItem("accessToken", response.data.access);
                localStorage.setItem("refreshToken", response.data.refresh);
                login(response.data.access, response.data.refresh, false);

                setSuccess("Verificación exitosa. Redirigiendo al perfil...");
                setTimeout(() => {
                    navigate("/perfil");
                    window.location.reload();
                }, 500);
            }
        } catch (error) {
            setError(error.response?.data?.error || "Código 2FA incorrecto");
        }
    };

    return (
        <div className="w-screen min-h-screen flex flex-col bg-white text-black">
            <div className="flex-1 flex items-center justify-center px-4">
                <div className="w-full max-w-[400px] text-center bg-yellow-200 p-6 rounded-md shadow-md">
                    <h2 className="text-3xl font-bold mb-6">Login</h2>

                    {error && <p className="text-red-500">{error}</p>}
                    {success && <p className="text-green-500">{success}</p>}

                    {step === "login" && (
                        <form onSubmit={handleLogin} className="flex flex-col space-y-4">
                            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Usuario/Email" className="w-full p-3 border border-gray-300 rounded-md bg-yellow-100" required />
                            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Contraseña" className="w-full p-3 border border-gray-300 rounded-md bg-yellow-100" required />
                            <button type="submit" className="bg-black text-yellow-400 px-6 py-3 font-bold rounded-md hover:bg-gray-800 transition">Login</button>
                        </form>
                    )}

                    {step === "2fa" && (
                        <form onSubmit={handleVerifyOTP} className="flex flex-col space-y-4">
                            <input type="text" value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="Código 2FA" className="w-full p-3 border border-gray-300 rounded-md bg-yellow-100 text-center text-lg" required />
                            <button type="submit" className="bg-black text-yellow-400 px-6 py-3 font-bold rounded-md hover:bg-gray-800 transition">Verificar Código</button>
                        </form>
                    )}

                    <div className="mt-4">
                        <button onClick={() => window.location.href = "http://127.0.0.1:8000/api/password_reset/"} className="text-blue-600 hover:underline">He olvidado mi contraseña</button>
                        <br />
                        <button onClick={() => navigate("/register")} className="text-blue-600 hover:underline mt-2">No tengo cuenta</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
