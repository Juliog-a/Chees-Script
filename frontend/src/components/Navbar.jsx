import { Link, useNavigate } from "react-router-dom";
import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../utils/AuthContext";
import axios from "axios";
import logo from "../assets/logo_cheescript.png";
import API from "../api/api";

const Navbar = () => {
    const { isAuthenticated, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const [userData, setUserData] = useState({ profileImage: "", level: 1 });
    const [menuOpen, setMenuOpen] = useState(false);
    const toggleMenu = () => setMenuOpen(!menuOpen);
    
    useEffect(() => {
        if (isAuthenticated) {
            fetchUserData();
        }
    }, [isAuthenticated]);

const calculateLevel = (points) => {
    if (points >= 1000) {
      return { level: 100, progress: 100 };
    }
      const level = Math.floor(points / 10);
    const remainder = points % 10;
    const progress = (remainder / 10) * 100;
  
    return { level, progress };
  };
    

    const fetchUserData = async () => {
        try {
            const token = localStorage.getItem("accessToken");
            const response = await API.get("/user/", {
                headers: { Authorization: `Bearer ${token}` },
            });
    
            console.log("Datos del usuario:", response.data); 
    
            const { level } = calculateLevel(response.data.points || 0); 
    
            setUserData({
                profileImage: response.data.profile_image || "https://cdn-icons-png.flaticon.com/512/149/149071.png",
                level: level, 
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
        <nav className="w-full max-w-screen bg-black text-white py-4 px-6 flex items-center justify-between shadow-md fixed top-0 left-0 z-50 md:z-40">
            <Link to="/" className="flex items-center">
                <img src={logo} alt="Chees Script" className="h-12 cursor-pointer" />
            </Link>
    
            {/* Menú para escritorio */}
            <div className="hidden md:flex space-x-4 items-center">
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
                        <div className="flex items-center space-x-2 bg-gray-900 px-3 py-1 rounded-lg">
                            <img
                                src={userData.profileImage}
                                alt="Perfil"
                                className="w-8 h-8 rounded-full border-2 border-white"
                            />
                            <span className="text-sm font-semibold">Nivel {userData.level}</span>
                        </div>
                        <button onClick={handleLogout} className="bg-red-500 px-4 py-2 rounded-lg text-white font-bold hover:bg-red-400 transition">
                            Cerrar sesión
                        </button>
                    </>
                )}
            </div>
    
            {/* Botón hamburguesa para móvil */}
            <div className="md:hidden">
                <button
                onClick={toggleMenu}
                aria-label="Abrir/cerrar menú"
                className="bg-yellow-500 text-black px-4 py-2 rounded-lg font-bold hover:bg-yellow-400 transition"
                >
                {menuOpen ? "✖" : "☰"}
            </button>
            </div>
    
            {/* Menú desplegable para móvil */}
            {menuOpen && (
                <div className="absolute top-20 left-0 w-full bg-black flex flex-col items-center space-y-4 py-4 md:hidden z-50 md:z-40 transition-all duration-300">
                    {!isAuthenticated ? (
                        <>
                            <Link to="/" onClick={() => setMenuOpen(false)} className="bg-yellow-500 px-4 py-2 rounded-lg text-black font-bold hover:bg-yellow-400 transition">
                                Inicio
                            </Link>
                            <Link to="/login" onClick={() => setMenuOpen(false)} className="bg-yellow-500 px-4 py-2 rounded-lg text-black font-bold hover:bg-yellow-400 transition">
                                Iniciar sesión
                            </Link>
                        </>
                    ) : (
                        <>
                            <Link to="/snippets" onClick={() => setMenuOpen(false)} className="bg-yellow-500 px-4 py-2 rounded-lg text-black font-bold hover:bg-yellow-400 transition">
                                Inicio
                            </Link>
                            <Link to="/desafios" onClick={() => setMenuOpen(false)} className="bg-yellow-500 px-4 py-2 rounded-lg text-black font-bold hover:bg-yellow-400 transition">
                                Desafíos
                            </Link>
                            <Link to="/blog" onClick={() => setMenuOpen(false)} className="bg-yellow-500 px-4 py-2 rounded-lg text-black font-bold hover:bg-yellow-400 transition">
                                Blog
                            </Link>
                            <Link to="/contacto" onClick={() => setMenuOpen(false)} className="bg-yellow-500 px-4 py-2 rounded-lg text-black font-bold hover:bg-yellow-400 transition">
                                Contacto
                            </Link>
                            <Link to="/perfil" onClick={() => setMenuOpen(false)} className="bg-yellow-500 px-4 py-2 rounded-lg text-black font-bold hover:bg-yellow-400 transition">
                                Perfil
                            </Link>
                            <div className="flex items-center space-x-2 bg-gray-900 px-3 py-1 rounded-lg">
                                <img
                                    src={userData.profileImage}
                                    alt="Perfil"
                                    className="w-8 h-8 rounded-full border-2 border-white"
                                />
                                <span className="text-sm font-semibold">Nivel {userData.level}</span>
                            </div>
                            <button
                                onClick={() => {
                                    setMenuOpen(false);
                                    handleLogout();
                                }}
                                className="bg-red-500 px-4 py-2 rounded-lg text-white font-bold hover:bg-red-400 transition"
                            >
                                Cerrar sesión
                            </button>
                        </>
                    )}
                </div>
            )}
        </nav>
    );    
};

export default Navbar;
