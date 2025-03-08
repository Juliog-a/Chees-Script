import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import AccountDeleted from "../components/AccountDeleted.jsx";
import TwoFactorAuth from "../components/TwoFactorAuth";

const Perfil = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState({
        username: "",
        profileImage: "",
        favoriteChallenges: "",
        
    });

    const [originalUser, setOriginalUser] = useState({});
    const [loading, setLoading] = useState(true);
    const [success, setSuccess] = useState("");
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [errorPassword, setErrorPassword] = useState("");

    const [is2FAEnabled, setIs2FAEnabled] = useState(false);

    // Estados para el cambio de contraseña
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
    }, []);  // <= dependencias vacías para ejecutar solo una vez al montar
    
    
    

    const fetchUserData = async (token) => {
        try {
            const response = await axios.get("http://127.0.0.1:8000/api/user/", {
                headers: { Authorization: `Bearer ${token}` },
            });
    
            setUser({
                username: response.data.username,
                profileImage: response.data.profile_image || "",
                favoriteChallenges: response.data.favoriteChallenges || "",
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
            <div className="w-screen min-h-screen flex items-center justify-center bg-white text-black">
                <p className="text-xl font-bold">Cargando...</p>
            </div>
        );
    }
    
    

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
        if (!validatePassword(newPassword)) {
            setErrorPassword("La contraseña debe tener al menos 8 caracteres, incluir una letra, un número y un carácter especial.");
            return;
        }

        if (newPassword === oldPassword) {
            setErrorPassword("La nueva contraseña no puede ser igual a la anterior.");
            return;
        }

        if (newPassword !== confirmPassword) {
            setErrorPassword("Las contraseñas no coinciden.");
            return;
        }

        try {
            const token = localStorage.getItem("accessToken");
    
            const response = await axios.put(
                "http://127.0.0.1:8000/api/change-password/",
                { oldPassword, newPassword },
                { headers: { Authorization: `Bearer ${token}` } }
            );
    
            const newAccessToken = response.data.access_token;
            
            localStorage.setItem("accessToken", newAccessToken);
    
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
            await axios.put(
                "http://127.0.0.1:8000/api/user/update/",
                {
                    profile_image: user.profileImage || undefined,
                    username: user.username !== originalUser.username ? user.username : undefined,
                    favoriteChallenges: user.favoriteChallenges !== originalUser.favoriteChallenges ? user.favoriteChallenges : undefined,
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setSuccess("Perfil actualizado correctamente.");
            setOriginalUser({ ...user });
        } catch (err) {
            setErrorPassword("Error al actualizar el perfil.");
        }
    };

    const handleDeleteAccount = async () => {
        try {
            const token = localStorage.getItem("accessToken");
            await axios.delete("http://127.0.0.1:8000/api/user/delete/", {
                headers: { Authorization: `Bearer ${token}` },
            });
    
            localStorage.removeItem("accessToken");
            navigate("/"); // Redirigir al inicio tras eliminar la cuenta
        } catch (err) {
            setErrorDelete("Error al eliminar la cuenta. Inténtalo de nuevo.");
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
        <div className="w-screen min-h-screen flex items-center justify-center bg-white text-black">
            <div className="w-full max-w-md bg-yellow-200 p-8 rounded-lg shadow-lg text-center">
                <h2 className="text-4xl md:text-5xl font-bold mb-6">Perfil</h2>

                <img
                    src={originalUser.profileImage || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                    alt="Perfil"
                    className="w-32 h-32 rounded-full mx-auto mb-6 border-4 border-black shadow-md"
                />

                <div className="text-left space-y-4">
                    <div className="flex flex-col">
                        <label className="text-lg font-semibold">Nombre:</label>
                        <input
                            type="text"
                            name="username"
                            value={user.username}
                            onChange={(e) => setUser({ ...user, username: e.target.value })}
                            className="w-full p-2 border border-gray-300 rounded-md bg-yellow-100"
                        />
                    </div>

                    <div className="flex flex-col">
                        <label className="text-lg font-semibold">Imagen de perfil (URL):</label>
                        <input
                            type="text"
                            name="profileImage"
                            value={user.profileImage}
                            onChange={(e) => setUser({ ...user, profileImage: e.target.value })}
                            className="w-full p-2 border border-gray-300 rounded-md bg-yellow-100"
                            placeholder="URL de imagen"
                        />
                    </div>

                    
                </div>

                <TwoFactorAuth />

                {success && <p className="text-green-500 mt-4">{success}</p>}

                <div className="flex justify-center gap-4 mt-6">
                    <button onClick={handleSave} className="bg-black text-yellow-400 px-4 py-2 font-bold rounded-md hover:bg-gray-900 transition">
                    Guardar
                </button>
                <button onClick={() => setShowPasswordModal(true)} className="bg-black text-yellow-400 px-4 py-2 font-bold rounded-md hover:bg-gray-900 transition">
                Cambiar Contraseña
                </button>
                </div>

                <button
                onClick={() => setShowDeleteModal(true)}
                className="bg-red-600 text-white px-4 py-2 font-bold rounded-md hover:bg-red-800 transition mt-20"
                >
                Borrar Cuenta
                </button>
            </div>

            {showDeleteModal && (
    <AccountDeleted
        onConfirm={(confirm) => {
            if (confirm) {
                handleDeleteAccount(); // Borra la cuenta si la confirmación es válida
            } else {
                setShowDeleteModal(false);
            }
        }}
    />
)}



            {showPasswordModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="bg-white p-6 rounded-md shadow-lg text-center w-96">
                        <h2 className="text-xl font-bold">Cambiar Contraseña</h2>

                        <input type="password" placeholder="Contraseña Antigua" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} className="w-full p-2 border mt-2 border-gray-300 rounded-md" />
                        <input type="password" placeholder="Nueva Contraseña" value={newPassword} onChange={(e) => { setNewPassword(e.target.value); validatePassword(e.target.value); }} className="w-full p-2 border mt-2 border-gray-300 rounded-md" />
                        
                        <div className="w-full h-2 bg-gray-300 rounded-full mt-2">
                            <div className="h-2 bg-green-500 rounded-full" style={{ width: `${passwordStrength}%` }}></div>
                        </div>

                        <input type="password" placeholder="Confirmar Nueva Contraseña" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full p-2 border mt-2 border-gray-300 rounded-md" />

                        {errorPassword && <p className="text-red-500 mt-2">{errorPassword}</p>}

                        <div className="mt-6 flex justify-center gap-36">
                        <button onClick={handleChangePassword} className="bg-black text-yellow-400 px-4 py-2 font-bold rounded-md hover:bg-gray-900 transition mt-4">
                            Confirmar
                        </button>
                        <button onClick={() => setShowPasswordModal(false)} className="bg-yellow-500 px-4 py-2 rounded-lg text-black font-bold hover:bg-yellow-400 transition mt-4">                            
                            Cerrar
                        </button>
                        
                        </div>
                    </div>
                </div>
            )}
        </div>

        
    
);
};

export default Perfil;