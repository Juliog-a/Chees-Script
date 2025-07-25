import { useEffect, useState } from "react";
import axios from "axios";
import PublicacionCard from "../components/PublicacionCard";
import API from "../api/api";

export default function Blog() {
    const [publicaciones, setPublicaciones] = useState([]);
    const [error, setError] = useState("");
    const [mostrarFormulario, setMostrarFormulario] = useState(false);
    const [titulo, setTitulo] = useState("");
    const [contenido, setContenido] = useState("");
    const [imagen, setImagen] = useState("");
    const [errorImagen, setErrorImagen] = useState("");
    const maxCaracteresContenido = 130;
    const maxCaracteresTitulo = 32;
    const token = localStorage.getItem("accessToken");
    const cargarPublicaciones = () => {
        API.get("/blog/", {
            headers: { Authorization: `Bearer ${token}` }
        })
        .then(response => setPublicaciones(response.data))
        .catch(error => {
            console.error("Error al obtener publicaciones:", error);
            setError("No se pudieron cargar las publicaciones.");
        });
    };
    useEffect(() => {
        cargarPublicaciones();
    }, []);

    const validarURLImagen = (url) => {
        const regex = /^https?:\/\/.*\.(?:png|jpg|jpeg|gif|bmp|webp|svg)$/i;
        return regex.test(url);
    };
    const handlePublicar = async () => {
        // Validaciones básicas del formulario
        if (!titulo || !contenido) {
            alert("Título y contenido son obligatorios.");
            return;
        }
        if (contenido.length > maxCaracteresContenido) {
            alert(`El contenido no puede superar los ${maxCaracteresContenido} caracteres.`);
            return;
        }
        if (imagen && !validarURLImagen(imagen)) {
            setErrorImagen("La URL debe ser una imagen válida (png, jpg, jpeg, gif, bmp, webp, svg).");
            return;
        }
        
        // Preparar el objeto de publicación
        const nuevaPublicacion = {
            titulo,
            contenido,
            url_imagen: imagen && imagen.length > 0 ? imagen : "",
        };
        
        try {
            // Envío al backend utilizando el token de autenticación
            const response = await API.post("/blog/", nuevaPublicacion, {
                headers: { Authorization: `Bearer ${token}` },
            });
            // Actualización de publicaciones y reseteo del formulario
            setPublicaciones([response.data, ...publicaciones]);
            setMostrarFormulario(false);
            setTitulo("");
            setContenido("");
            setImagen("");
            setErrorImagen("");
            setError("");  // Limpia errores previos
        } catch (error) {
            console.error("Error al publicar:", error.response?.data || error);
            
            // Muestra mensaje específico si se excede el límite (429)
            if (error.response?.status === 429) {
                setError("Has superado el límite de comentarios permitidos (5 por minuto). Por favor, espera unos instantes antes de intentar nuevamente.");
            }
            // Muestra error específico si hay problemas con el contenido
            else if (error.response?.data?.contenido) {
                setError(error.response.data.contenido[0]);
            } 
            // Muestra error en la URL de imagen si aplica
            else if (error.response?.data?.url_imagen) {
                setErrorImagen(error.response.data.url_imagen[0]); 
            } 
            // Mensaje genérico en caso de otros errores
            else {
                setError("Hubo un problema al publicar. Inténtalo nuevamente.");
            }
        }
    };
    
    
    return (
    <div className="w-screen min-h-screen flex flex-col bg-white text-black pt-32 px-4 overflow-x-hidden">
        <h1 className="text-3xl md:text-5xl font-bold text-center mb-8">Blog</h1>
            {error && <p className="text-red-600 text-center">{error}</p>}
                <button 
                onClick={() => setMostrarFormulario(true)} 
                className="bg-black text-yellow-400 px-6 py-3 font-bold rounded-md hover:bg-gray-900 transition mx-auto mb-6 shadow-md">
                Crear Publicación
            </button>
                {mostrarFormulario && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="bg-white p-6 rounded-md shadow-lg text-center w-96">
                        <h2 className="text-xl font-bold mb-4">Crear Publicación</h2>
    
                        <input 
                            type="text" 
                            placeholder="Título" 
                            value={titulo} 
                            onChange={(e) => setTitulo(e.target.value)}
                            className="w-full p-2 mt-2 bg-white text-black placeholder-gray-500 border border-yellow-500 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400"
                            maxLength={maxCaracteresTitulo} 
                        />
                        <div className="text-right text-gray-500 text-sm">{titulo.length}/{maxCaracteresTitulo}</div>
    
                        <textarea 
                            placeholder="Contenido" 
                            value={contenido} 
                            onChange={(e) => setContenido(e.target.value)}
                            className="w-full p-2 mt-2 bg-white text-black placeholder-gray-500 border border-yellow-500 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-yellow-400" 
                            maxLength={maxCaracteresContenido}
                        ></textarea>
                        <div className="text-right text-gray-500 text-sm">{contenido.length}/{maxCaracteresContenido}</div>
    
                        <input 
                            type="text" 
                            placeholder="URL de imagen (Opcional)" 
                            value={imagen} 
                            onChange={(e) => {
                                setImagen(e.target.value);
                                setErrorImagen("");
                            }}
                            className={`w-full p-2 mt-2 bg-white text-black placeholder-gray-500 border rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400 ${
                                errorImagen ? "border-red-500" : "border-yellow-500"
                            }`}
                        />
                        {errorImagen && <p className="text-red-600 text-sm mt-1">{errorImagen}</p>}
    
                        <div className="flex justify-between mt-4">
                            <button 
                                onClick={handlePublicar} 
                                className="bg-black text-yellow-400 px-4 py-2 font-bold rounded-md hover:bg-gray-900 transition w-1/2 mx-1">
                                Publicar
                            </button>
                            <button 
                                onClick={() => setMostrarFormulario(false)} 
                                className="bg-gray-500 px-4 py-2 rounded-md text-white font-bold hover:bg-gray-700 transition w-1/2 mx-1">
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <div className="grid justify-center"
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
                    gap: "40px",
                    alignItems: "start"
                }}
            >
                {publicaciones.length > 0 ? (
                    publicaciones.map((post) => (
                        <PublicacionCard
                            key={post.id}
                            publicacion={post}
                        />
                    ))
                ) : (
                    <p className="text-center text-gray-500 col-span-full">No hay publicaciones aún.</p>
                )}
            </div>
        </div>
    );
    
}
