import { useState, useEffect } from "react";

const TwoFactorAuth = () => {
    const [qrCode, setQrCode] = useState(null);
    const [otp, setOtp] = useState("");
    const [is2FAEnabled, setIs2FAEnabled] = useState(false);
    const [loading, setLoading] = useState(true);
    const token = localStorage.getItem("accessToken");

    useEffect(() => {
        check2FAStatus(); 
    }, []);
    const check2FAStatus = async () => {
        try {
            const response = await fetch("http://127.0.0.1:8000/api/user/", {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            const data = await response.json();
            if (response.ok) {
                setIs2FAEnabled(data.is2fa_enabled); 
            }
        } catch (error) {
            console.error("Error al consultar estado 2FA:", error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleEnable2FA = async () => {
        try {
            const response = await fetch("http://127.0.0.1:8000/api/enable-2fa/", {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error("Error al activar 2FA:", errorData);
                return;
            }

            const data = await response.json();
            setQrCode(data.qr_code);
        } catch (error) {
            console.error("Error al activar 2FA:", error.message);
        }
    };

    const handleVerify2FA = async () => {
        if (!otp.trim()) {
            alert("Debes ingresar un código OTP antes de verificar.");
            return;
        }

        try {
            const response = await fetch("http://127.0.0.1:8000/api/confirm-2fa/", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ otp_code: otp })
            });

            const data = await response.json();

            if (response.ok) {
                alert("2FA activado correctamente.");
                setIs2FAEnabled(true);
                setQrCode(null); 
            } else {
                alert(`Código incorrecto: ${data.error}`);
            }

        } catch (error) {
            console.error("Error en 2FA:", error);
            alert("Error al verificar el código.");
        }
    };
    const handleDisable2FA = async () => {
        const otp_code = prompt("Introduce el código 2FA para desactivarlo:");
    
        if (!otp_code) {
            alert("Debes ingresar un código OTP.");
            return;
        }
    
        const token = localStorage.getItem("accessToken");
    
        if (!token) {
            alert("No tienes una sesión activa. Por favor, inicia sesión.");
            return;
        }
    
        try {
            const response = await fetch("http://127.0.0.1:8000/api/disable-2fa/", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ otp_code }),
            });
    
            const data = await response.json();
            if (response.ok) {
                alert("2FA desactivado correctamente.");
                setIs2FAEnabled(false);
            } else {
                alert(`Error: ${data.error}`);
            }
        } catch (error) {
            console.error("Error al desactivar 2FA:", error.message);
            alert("Ocurrió un error al intentar desactivar 2FA.");
        }
    };
    
    
    return (
        <div className="text-center bg-yellow-200 p-4 rounded-md">
            <h3 className="text-lg font-semibold mb-2">Autenticación en Dos Factores (2FA)</h3>

            {loading ? (
                <p className="text-gray-500">Cargando...</p>
            ) : is2FAEnabled ? (
                <div>
                    <p className="text-green-600 font-bold">2FA ya está activado.</p>
                    <button 
                        onClick={handleDisable2FA} 
                        className="bg-black text-yellow-400 px-4 py-2 font-bold rounded-md hover:bg-gray-900 transition"
                    >
                        Desactivar 2FA
                    </button>
                </div>
            ) : (
                <div>
                    <button 
                        onClick={handleEnable2FA} 
                        className="bg-black text-yellow-400 px-4 py-2 font-bold rounded-md hover:bg-gray-900 transition"
                    >
                        Activar 2FA
                    </button>

                    {qrCode && (
                        <div className="mt-4">
                            <h3 className="text-lg font-semibold">Escanea este código QR en Google Authenticator</h3>
                            <img 
                                src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(qrCode)}&size=200x200`} 
                                alt="QR Code 2FA" 
                                className="mx-auto my-4"
                            />

                            <input
                                type="text"
                                placeholder="Código 2FA"
                                className="w-full p-2 border border-gray-300 rounded-md text-center text-lg"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                            />

                            <button 
                                onClick={handleVerify2FA} 
                                className="bg-black text-yellow-400 px-4 py-2 font-bold rounded-md hover:bg-gray-900 transition mt-4"
                            >
                                Verificar Código
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default TwoFactorAuth;
