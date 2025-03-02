import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../utils/AuthContext";

const Register = () => {
    const { login } = useContext(AuthContext);
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [passwordStrength, setPasswordStrength] = useState(0);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const validateEmail = (email) => /@gmail\.com$|@outlook\.com$/.test(email);
    const validateUsername = (username) => /^[a-zA-Z0-9]+$/.test(username);
    const validatePassword = (password) => {
        const minLength = password.length >= 8;
        const hasNumber = /\d/.test(password);
        const hasLetter = /[a-zA-Z]/.test(password);
        const hasSpecial = /[.,_\-€%|@#\\/¿?*Ç^¨]/.test(password);

        let strength = 0;
        if (minLength) strength += 25;
        if (hasNumber) strength += 25;
        if (hasLetter) strength += 25;
        if (hasSpecial) strength += 25;
        setPasswordStrength(strength);

        return minLength && hasNumber && hasLetter && hasSpecial;
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setError(null);

        if (!validateEmail(email)) {
            setError("Solo se permiten correos de Gmail y Outlook.");
            return;
        }

        if (!validateUsername(username)) {
            setError("El usuario solo puede contener letras y números sin espacios.");
            return;
        }

        if (!validatePassword(password)) {
            setError("La contraseña debe tener al menos 8 caracteres, incluir una letra, un número y un carácter especial.");
            return;
        }

        if (password !== confirmPassword) {
            setError("Las contraseñas no coinciden");
            return;
        }

        try {
            const response = await axios.post("http://127.0.0.1:8000/api/register/", {
                username,
                email,
                password,
            });

            if (response.status === 201) {
                const accessToken = response.data.access;
                const refreshToken = response.data.refresh;

                if (!accessToken || !refreshToken) {
                    throw new Error("Error: el servidor no devolvió tokens");
                }

                console.log("Registro exitoso. Tokens recibidos:", response.data);

                localStorage.setItem("accessToken", accessToken);
                localStorage.setItem("refreshToken", refreshToken);
                login(accessToken, refreshToken);

                navigate("/perfil");
            }
        } catch (error) {
            console.error("Error en el registro:", error.response ? error.response.data : error);
            setError(error.response?.data?.error || "Error en el registro. Inténtalo de nuevo.");
        }
    };

    return (
        <div className="w-screen min-h-screen flex flex-col bg-white text-black">
            <div className="flex-1 flex items-center justify-center px-4">
                <div className="w-full max-w-[400px] text-center bg-yellow-200 p-6 rounded-md shadow-md">
                    <h2 className="text-3xl font-bold mb-6">Registro</h2>
                    {error && <p className="text-red-500">{error}</p>}
                    <form onSubmit={handleRegister} className="flex flex-col space-y-4">
                        <div className="text-left">
                            <label className="block text-lg font-semibold">Usuario:</label>
                            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required className="w-full p-3 border border-gray-300 rounded-md bg-yellow-100" />
                        </div>
                        <div className="text-left">
                            <label className="block text-lg font-semibold">Email:</label>
                            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full p-3 border border-gray-300 rounded-md bg-yellow-100" />
                        </div>
                        <div className="text-left">
                            <label className="block text-lg font-semibold">Contraseña:</label>
                            <input type="password" value={password} onChange={(e) => { setPassword(e.target.value); validatePassword(e.target.value); }} required className="w-full p-3 border border-gray-300 rounded-md bg-yellow-100" />
                            <div className="w-full h-2 bg-gray-300 rounded-full mt-2">
                                <div className="h-2 bg-green-500 rounded-full" style={{ width: `${passwordStrength}%` }}></div>
                            </div>
                        </div>
                        <div className="text-left">
                            <label className="block text-lg font-semibold">Confirmar Contraseña:</label>
                            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="w-full p-3 border border-gray-300 rounded-md bg-yellow-100" />
                        </div>
                        <button type="submit" className="bg-black text-yellow-400 px-6 py-3 font-bold rounded-md hover:bg-gray-800 transition">
                            Registrarse
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Register;
