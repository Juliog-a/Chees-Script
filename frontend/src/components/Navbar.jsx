import { Link, useNavigate } from "react-router-dom";
import { useContext, useEffect } from "react";
import { AuthContext } from "../utils/AuthContext";
import logo from "../assets/logo_cheescript.png";

const Navbar = () => {
    const { isAuthenticated, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    useEffect(() => {
        // Asegura que la navbar se re-renderice cuando cambia la autenticación
    }, [isAuthenticated]);

    const handleLogout = () => {
        logout();
        navigate("/"); // Redirige al home
        window.location.reload(); // Recarga la página para actualizar la barra
    };

    return (
        <nav className="w-full bg-black text-white py-4 px-10 flex items-center justify-between shadow-md fixed top-0 left-0 z-50">
            <Link to="/" className="flex items-center">
                <img src={logo} alt="Chees Script" className="h-12 cursor-pointer" />
            </Link>

            <div className="flex space-x-4">
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
