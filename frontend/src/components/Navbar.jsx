import { Link, useNavigate } from "react-router-dom";
import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../utils/AuthContext";
import axios from "axios";
import logo from "../assets/logo_cheescript.png";

const Navbar = () => {
    const { isAuthenticated, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const [userData, setUserData] = useState({ profileImage: "", level: 1 });

    useEffect(() => {
        if (isAuthenticated) {
            fetchUserData();
        }
    }, [isAuthenticated]);

// Cada 10 puntos aumenta 1 nivel, hasta nivel 100 al llegar a 1000 puntos.
const calculateLevel = (points) => {
    // Caso especial: 1000 o más => nivel 100
    if (points >= 1000) {
      return { level: 100, progress: 100 };
    }
  
    // Nivel calculado con división entera
    const level = Math.floor(points / 10);
    // Resto para la barra de progreso
    const remainder = points % 10;
    // Porcentaje de progreso entre un nivel y el siguiente
    const progress = (remainder / 10) * 100;
  
    return { level, progress };
  };
    

    const fetchUserData = async () => {
        try {
            const token = localStorage.getItem("accessToken");
            const response = await axios.get("http://127.0.0.1:8000/api/user/", {
                headers: { Authorization: `Bearer ${token}` },
            });
    
            console.log("Datos del usuario:", response.data); // Verifica los puntos
    
            const { level } = calculateLevel(response.data.points || 0); // Calcula nivel desde los puntos
    
            setUserData({
                profileImage: response.data.profile_image || "https://cdn-icons-png.flaticon.com/512/149/149071.png",
                level: level, // Usamos el nivel calculado correctamente
            });
        } catch (error) {
            console.error("Error al obtener los datos del usuario:", error);
        }
    };
    

    const handleLogout = () => {
        logout();
        navigate("/");
        window.location.reload();
    };

    return (
    <nav className="w-full max-w-screen bg-black text-white py-4 px-6 flex items-center justify-between shadow-md fixed top-0 left-0 z-50 overflow-hidden">
{/* Logo */}
            <Link to="/" className="flex items-center">
                <img src={logo} alt="Chees Script" className="h-12 cursor-pointer" />
            </Link>

            {/* Links de navegación */}
            <div className="flex space-x-4 items-center">
                {!isAuthenticated ? (
                    <>
                        <Link to="/" className="bg-yellow-500 px-4 py-2 rounded-lg text-black font-bold hover:bg-yellow-400 transition">
                            Inicio
                        </Link>
                        <Link to="/login" className="bg-yellow-500 px-4 py-2 rounded-lg text-black font-bold hover:bg-yellow-400 transition">
                            Iniciar sesión
                        </Link>
                    </>
                ) : (
                    <>
                        <Link to="/snippets" className="bg-yellow-500 px-4 py-2 rounded-lg text-black font-bold hover:bg-yellow-400 transition">
                            Inicio
                        </Link>
                        <Link to="/desafios" className="bg-yellow-500 px-4 py-2 rounded-lg text-black font-bold hover:bg-yellow-400 transition">
                            Desafíos
                        </Link>
                        <Link to="/blog" className="bg-yellow-500 px-4 py-2 rounded-lg text-black font-bold hover:bg-yellow-400 transition">
                            Blog
                        </Link>
                        <Link to="/contacto" className="bg-yellow-500 px-4 py-2 rounded-lg text-black font-bold hover:bg-yellow-400 transition">
                            Contacto
                        </Link>
                        <Link to="/perfil" className="bg-yellow-500 px-4 py-2 rounded-lg text-black font-bold hover:bg-yellow-400 transition">
                            Perfil
                        </Link>

                        {/* Imagen de perfil y nivel */}
                        <div className="flex items-center space-x-2 bg-gray-900 px-3 py-1 rounded-lg">
                            <img
                                src={userData.profileImage}
                                alt="Perfil"
                                className="w-8 h-8 rounded-full border-2 border-white"
                            />
                            <span className="text-sm font-semibold">Nivel {userData.level}</span>
                        </div>

                        {/* Botón de Cerrar Sesión */}
                        <button onClick={handleLogout} className="bg-red-500 px-4 py-2 rounded-lg text-white font-bold hover:bg-red-400 transition">
                            Cerrar sesión
                        </button>
                    </>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
