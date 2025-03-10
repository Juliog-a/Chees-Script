import { useEffect, useState } from "react";
import axios from "axios";
import PublicacionCard from "../components/PublicacionCard";

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
        axios.get("http://localhost:8000/api/blog/", {
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

    // Función para validar URL de imagen en el frontend
    const validarURLImagen = (url) => {
        const regex = /^https?:\/\/.*\.(?:png|jpg|jpeg|gif|bmp|webp|svg)$/i;
        return regex.test(url);
    };

    const handlePublicar = async () => {
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

        const nuevaPublicacion = {
            titulo,
            contenido,
            url_imagen: imagen && imagen.length > 0 ? imagen : "",
        };

        try {
            const response = await axios.post("http://localhost:8000/api/blog/", nuevaPublicacion, {
                headers: { Authorization: `Bearer ${token}` },
            });

            setPublicaciones([response.data, ...publicaciones]); 
            setMostrarFormulario(false);
            setTitulo("");
            setContenido("");
            setImagen("");
            setErrorImagen(""); // Limpiamos error de imagen tras una publicación exitosa
        } catch (error) {
            console.error("Error al publicar:", error.response?.data || error);
            if (error.response?.data?.url_imagen) {
                setErrorImagen(error.response.data.url_imagen[0]); // Guardamos mensaje de error de la API
            } else {
                setError("Hubo un problema al publicar.");
            }
        }
    };

    return (
        <div className="w-screen min-h-screen flex flex-col bg-white text-black p-6 overflow-x-hidden">
            <h1 className="text-3xl md:text-5xl font-bold text-center mb-8">Blog</h1>
            {error && <p className="text-red-600 text-center">{error}</p>}
    
            {/* Botón para abrir el formulario */}
            <button 
                onClick={() => setMostrarFormulario(true)} 
                className="bg-black text-yellow-400 px-6 py-3 font-bold rounded-md hover:bg-gray-900 transition mx-auto mb-6 shadow-md">
                Crear Publicación
            </button>
    
            {/* Formulario de creación */}
            {mostrarFormulario && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="bg-white p-6 rounded-md shadow-lg text-center w-96">
                        <h2 className="text-xl font-bold mb-4">Crear Publicación</h2>
    
                        <input 
                            type="text" 
                            placeholder="Título" 
                            value={titulo} 
                            onChange={(e) => setTitulo(e.target.value)}
                            className="w-full p-2 border mt-2 border-gray-300 rounded-md" 
                            maxLength={maxCaracteresTitulo} 
                        />
                        <div className="text-right text-gray-500 text-sm">{titulo.length}/{maxCaracteresTitulo}</div>
    
                        <textarea 
                            placeholder="Contenido" 
                            value={contenido} 
                            onChange={(e) => setContenido(e.target.value)}
                            className="w-full p-2 border mt-2 border-gray-300 rounded-md resize-none" 
                            maxLength={maxCaracteresContenido}
                        ></textarea>
                        <div className="text-right text-gray-500 text-sm">{contenido.length}/{maxCaracteresContenido}</div>
    
                        <input 
                            type="text" 
                            placeholder="URL de imagen (Opcional)" 
                            value={imagen} 
                            onChange={(e) => {
                                setImagen(e.target.value);
                                setErrorImagen(""); // Borramos el error cuando el usuario edita el input
                            }}
                            className={`w-full p-2 border mt-2 rounded-md ${errorImagen ? "border-red-500" : "border-gray-300"}`} 
                        />
                        {errorImagen && <p className="text-red-600 text-sm mt-1">{errorImagen}</p>} {/* Mostramos error si hay */}
    
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
    
            {/* Lista de Publicaciones */}
            <div className="grid justify-center"
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
                    gap: "40px",
                    alignItems: "start" // Evita que las tarjetas se monten entre sí
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
