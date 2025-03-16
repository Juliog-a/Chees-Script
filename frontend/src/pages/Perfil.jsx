import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import AccountDeleted from "../components/AccountDeleted.jsx";
import TwoFactorAuth from "../components/TwoFactorAuth";
import Trofeos from "../components/Trofeos";

const Perfil = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState({
        username: "",
        profileImage: "",
        favoriteChallenges: "",
        
    });

    const [originalUser, setOriginalUser] = useState({});
    const [loading, setLoading] = useState(true);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [errorPassword, setErrorPassword] = useState("");
    const [success, setSuccess] = useState("");
    const [is2FAEnabled, setIs2FAEnabled] = useState(false);
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [passwordStrength, setPasswordStrength] = useState(0);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [errorDelete, setErrorDelete] = useState("");
    
    useEffect(() => {
        const token = localStorage.getItem("accessToken");
        if (!token) {
            navigate("/login");
            return;
        }
        fetchUserData(token);
    }, []);

    const fetchUserData = async (token) => {
        try {
            const response = await axios.get("http://127.0.0.1:8000/api/user/", {
                headers: { Authorization: `Bearer ${token}` },
            });
    
            setUser({
                username: response.data.username,
                profileImage: response.data.profile_image || "",
                favoriteChallenges: response.data.favoriteChallenges || "",
                points: response.data.points || 0,
            });
            
            setOriginalUser({
                username: response.data.username,
                profileImage: response.data.profile_image || "",
                favoriteChallenges: response.data.favoriteChallenges || "",
            });
    
            setIs2FAEnabled(response.data.is2fa_enabled);
            setLoading(false);
        } catch (err) {
            setLoading(false);
            navigate("/login");
        }
    };
    
    if (loading) {
        return (
            <div className="w-screen min-h-screen flex items-center justify-center bg-white text-black mt-24">
                <p className="text-xl font-bold">Cargando...</p>
            </div>
        );
    }
    
    {/*Función para el calculo del nivel en funcion de los puntos*/}

const calculateLevel = (points) => {    // Cada 10 puntos aumenta 1 nivel, hasta nivel 100 al llegar a 1000 puntos.
    if (points >= 1000) {
      return { level: 100, progress: 100 };
    }
    const level = Math.floor(points / 10);
    const remainder = points % 10;  // Resto para la barra de progreso
    const progress = (remainder / 10) * 100; // Porcentaje de progreso entre un nivel y el siguiente
    return { level, progress };
  };
    
    const { level, progress } = calculateLevel(user.points);
    const getTitle = (level) => {
        const titles = [
            "Novato", "Estudiante", "Aprendiz", "Intermedio", "Avanzado", 
            "Experto", "Maestro", "Elite", "Veterano", "Hacker Legendario"
        ];
        return titles[Math.floor(level / 10)];
    };
    

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
    const handleChangePassword = async () => {
        // Verifica que se ingresen los tres campos
        if (!oldPassword || !newPassword || !confirmPassword) {
            setErrorPassword("Todos los campos son obligatorios.");
            return;
        }
    
        // Verifica que la nueva contraseña no sea igual a la anterior
        if (newPassword === oldPassword) {
            setErrorPassword("La nueva contraseña no puede ser igual a la anterior.");
            return;
        }
    
        // Verifica que ambas nuevas contraseñas coincidan
        if (newPassword !== confirmPassword) {
            setErrorPassword("Las nuevas contraseñas no coinciden.");
            return;
        }
    
        // Validación de requisitos de la contraseña
        if (!validatePassword(newPassword)) {
            setErrorPassword("La contraseña debe tener al menos 8 caracteres, incluir una letra, un número y un carácter especial.");
            return;
        }
    
        try {
            const token = localStorage.getItem("accessToken");
    
            const response = await axios.put(
                "http://127.0.0.1:8000/api/change-password/",
                {
                    oldPassword,
                    newPassword,
                    confirmPassword
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );
    
            setSuccess("Contraseña cambiada con éxito.");
            setErrorPassword("");
            setShowPasswordModal(false);
            setOldPassword("");
            setNewPassword("");
            setConfirmPassword("");
    
        } catch (err) {
            setErrorPassword(err.response?.data?.error || "Error al cambiar la contraseña.");
        }
    };
    

    const handleSave = async () => {
        try {
            const token = localStorage.getItem("accessToken");
    
            // Intentar actualizar el perfil
            const response = await axios.put(
                "http://127.0.0.1:8000/api/user/update/",
                {
                    profile_image: user.profileImage || undefined,
                    username: user.username !== originalUser.username ? user.username : undefined,
                    favoriteChallenges: user.favoriteChallenges !== originalUser.favoriteChallenges ? user.favoriteChallenges : undefined,
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );
    
            // Si la respuesta es exitosa (200), mostrar mensaje de éxito
            setSuccess("Perfil actualizado correctamente.");
            setErrorPassword("");  // Limpiar error si la actualización es exitosa
            setOriginalUser({ ...user });
    
        } catch (err) {
            // Captura el error si el backend devuelve un 400
            if (err.response?.status === 400) {
                setErrorPassword(err.response.data.error);  // Mostrar mensaje de error del backend
                setSuccess("");  // Limpiar mensaje de éxito si hay error
            } else {
                setErrorPassword("Error al actualizar el perfil.");
                setSuccess("");
            }
        }
    };
    
    
    const getNewToken = async () => {
        const refreshToken = localStorage.getItem("refreshToken");
        if (!refreshToken) return;
    
        try {
            const response = await axios.post("http://127.0.0.1:8000/api/token/refresh/", {
                refresh: refreshToken,
            });
    
            localStorage.setItem("accessToken", response.data.access);
            return response.data.access;
        } catch (err) {
            console.error("Error al refrescar el token:", err);
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");
            navigate("/login");
        }
    };
    

    const handleDeleteAccount = async () => {
        try {
            console.log("Token antes de eliminar cuenta:", localStorage.getItem("accessToken"));
            let token = localStorage.getItem("accessToken");
            if (!token) {
                token = await getNewToken();
                if (!token) {
                    navigate("/login");
                    return;
                }
            }
    
            const response = await axios.delete("http://127.0.0.1:8000/api/user/delete/", {
                headers: { Authorization: `Bearer ${token}` },
            });
    
            console.log(response.data.message);
            localStorage.removeItem("accessToken");
            navigate("/");
        } catch (err) {
            console.error("Error al eliminar la cuenta:", err.response?.data || err.message);
        }
    };
    
    
    


    if (loading) {
        return (
            <div className="w-screen min-h-screen flex items-center justify-center bg-white text-black">
                <p className="text-xl font-bold">Cargando...</p>
            </div>
        );
    }

    return (
        <div className="w-screen min-h-screen flex flex-col items-center justify-center bg-white text-black mt-24">
            {/* Contenedor principal del perfil */}
            <div className="w-full max-w-6xl bg-yellow-200 p-12 rounded-lg shadow-lg mt-12">
                <h2 className="text-5xl font-bold mb-6 text-center text-gray-900">Perfil</h2>
    
                <div className="flex items-center justify-center space-x-12">
                    {/* Sección Izquierda: Imagen y Nivel */}
                    <div className="flex flex-col items-center">
                        <img
                            src={user.profileImage || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                            alt="Perfil"
                            className="w-44 h-44 rounded-full border-4 border-gray-800 shadow-md"
                        />
                        <p className="text-lg font-semibold mt-2 text-gray-800">Nivel {level}</p>
                        <p className="text-xl font-bold text-gray-900">{getTitle(level)}</p>
    
                        <div className="w-44 bg-gray-300 rounded-full h-4 mt-2">
                            <div className="bg-green-500 h-4 rounded-full" style={{ width: `${progress}%` }}></div>
                        </div>
                    </div>
    
                    {/* Sección Derecha: Formulario */}
                    <div className="w-2/3 text-left space-y-6">
                        <div className="flex flex-col">
                            <label className="text-lg font-semibold">Nombre:</label>
                            <input
                                type="text"
                                name="username"
                                value={user.username}
                                onChange={(e) => setUser({ ...user, username: e.target.value })}
                                className="w-full p-3 border border-gray-400 rounded-md bg-yellow-100"
                            />
                        </div>
    
                        <div className="flex flex-col">
                            <label className="text-lg font-semibold">Imagen de perfil (URL):</label>
                            <input
                                type="text"
                                name="profileImage"
                                value={user.profileImage}
                                onChange={(e) => setUser({ ...user, profileImage: e.target.value })}
                                className="w-full p-3 border border-gray-400 rounded-md bg-yellow-100"
                                placeholder="URL de imagen"
                            />
                        </div>
    
                        <TwoFactorAuth />
                    </div>
                </div>
    
                {/* Botones alineados al centro */}
                <div className="flex justify-center gap-6 mt-8">
                    <button onClick={handleSave} className="bg-gray-900 text-yellow-400 px-6 py-3 font-bold rounded-md hover:bg-gray-800 transition">
                        Guardar
                    </button>
                    <button onClick={() => setShowPasswordModal(true)} className="bg-gray-900 text-yellow-400 px-6 py-3 font-bold rounded-md hover:bg-gray-800 transition">
                        Cambiar Contraseña
                    </button>
                </div>
    
                {/* Botón de eliminar cuenta centrado y más visible */}
                <div className="flex justify-center mt-12">
                    <button onClick={() => setShowDeleteModal(true)} className="bg-red-600 text-white px-8 py-3 font-bold rounded-md hover:bg-red-800 transition">
                        Borrar Cuenta
                    </button>
                </div>
            </div>
    
            {/* Sección de Trofeos justo debajo del perfil */}
            <div className="w-full max-w-6xl bg-yellow-200 p-12 rounded-lg shadow-lg mt-6">
                <h2 className="text-3xl font-bold text-center text-gray-900"></h2>
                <Trofeos />







                  {/* Modal para borrar cuenta */}
                  {showDeleteModal && (
                    <AccountDeleted
                        onConfirm={(confirm) => {
                            if (confirm) {
                                handleDeleteAccount();
                            } else {
                                setShowDeleteModal(false);
                            }
                        }}
                    />
                )}
    
                {/* Modal para cambiar contraseña */}
                {showPasswordModal && (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-md shadow-lg text-center w-96">
            <h2 className="text-xl font-bold">Cambiar Contraseña</h2>

            <input 
                type="password" 
                placeholder="Contraseña Antigua" 
                value={oldPassword} 
                onChange={(e) => setOldPassword(e.target.value)} 
                className="w-full p-3 border mt-4 border-gray-300 rounded-md" 
            />

            <input 
                type="password" 
                placeholder="Nueva Contraseña" 
                value={newPassword} 
                onChange={(e) => { 
                    setNewPassword(e.target.value); 
                    validatePassword(e.target.value); 
                }} 
                className="w-full p-3 border mt-4 border-gray-300 rounded-md" 
            />

            <input 
                type="password" 
                placeholder="Confirmar Nueva Contraseña" 
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)} 
                className="w-full p-3 border mt-4 border-gray-300 rounded-md" 
            />

            {errorPassword && <p className="text-red-500 mt-2">{errorPassword}</p>}

            <div className="mt-6 flex justify-center gap-6">
                <button onClick={handleChangePassword} className="bg-black text-yellow-400 px-6 py-3 font-bold rounded-md hover:bg-gray-900 transition">
                    Confirmar
                </button>
                <button onClick={() => setShowPasswordModal(false)} className="bg-gray-500 px-6 py-3 rounded-md text-white font-bold hover:bg-gray-600 transition">
                    Cerrar
                </button>
            </div>
        </div>
    </div>
)}

            </div>
        </div>



    );    
    
    
}
export default Perfil;
