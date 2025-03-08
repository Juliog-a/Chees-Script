import { useState } from "react";
import axios from "axios";

const OTPInput = ({ username, tempToken, onVerify }) => {
    const [otp, setOtp] = useState("");
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (!username || !tempToken) {
            console.error("Error: Falta username o tempToken en OTPInput");
            setError("Error interno. Intenta nuevamente.");
            return;
        }

        try {
            console.log("Enviando OTP para verificación:", otp);
            const response = await axios.post("http://127.0.0.1:8000/api/verify-2fa/", {
                username,
                otp_code: otp,
                temp_token: tempToken,
            });

            if (response.status === 200) {
                console.log("Código OTP correcto, autenticando usuario...");
                onVerify(response.data);
            }
        } catch (error) {
            console.error("Error en 2FA:", error.response?.data || error.message);
            setError("Código 2FA incorrecto. Inténtalo de nuevo.");
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
            <div className="text-left">
                <label className="block text-lg font-semibold">Código 2FA:</label>
                <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-md bg-yellow-100 text-center text-lg"
                    required
                />
            </div>

            {error && <p className="text-red-500">{error}</p>}

            <button
                type="submit"
                className="bg-black text-yellow-400 px-6 py-3 font-bold rounded-md hover:bg-gray-800 transition"
            >
                Verificar Código
            </button>
        </form>
    );
};

export default OTPInput;
