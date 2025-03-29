import React, { useState, useEffect } from "react";
import axios from "axios";

const PublicacionCard = ({ publicacion, recargarPublicaciones }) => {
    const [liked, setLiked] = useState(publicacion.liked_by_user);
    const [likesCount, setLikesCount] = useState(publicacion.likes_count);
    const [comentarios, setComentarios] = useState([]);
    const [nuevoComentario, setNuevoComentario] = useState("");
    const [esPropietario, setEsPropietario] = useState(false);
    const [esAdmin, setEsAdmin] = useState(false);

    const maxCaracteres = 100;
    const token = localStorage.getItem("accessToken");

    useEffect(() => {
        console.log("Publicacion recibida:", publicacion);

        if (!token) return;
        axios.get("http://127.0.0.1:8000/api/usuario/", {
            headers: { Authorization: `Bearer ${token}` },
        })

        .then(response => {
            const usuario = response.data;
            const usuarioId = parseInt(usuario.id);
            const publicacionUsuarioId = parseInt(publicacion.usuario);

        // Verificar si el usuario actual es el propietario de la publicación
            setEsPropietario(usuarioId === publicacionUsuarioId);

        // Verificar si el usuario tiene permisos de administrador
            setEsAdmin(usuario.is_staff || usuario.is_superuser);
        })
        .catch(error => console.error("Error al obtener datos del usuario:", error));
        obtenerComentarios();

    }, [publicacion.id, token]);
    const obtenerComentarios = () => {
        if (!token) return; 
    
        axios.get(`http://127.0.0.1:8000/api/blog/${publicacion.id}/comentarios/`, {
            headers: { Authorization: `Bearer ${token}` }
        })
        .then(response => {
            setComentarios(response.data);
        })
        .catch(error => console.error("Error al obtener los comentarios:", error));
    };
        const toggleLike = async () => {
        if (!token) return;

        try {
            const response = await axios.post(
                `http://127.0.0.1:8000/api/blog/${publicacion.id}/toggle_like/`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setLiked(response.data.liked);
            setLikesCount(response.data.likes_count);
        } catch (error) {
            console.error("Error al cambiar el estado de Me gusta:", error);
        }
    };

    const enviarComentario = async () => {
        if (!nuevoComentario.trim() || !token) return;
    
        try {
            const response = await axios.post(
                `http://127.0.0.1:8000/api/blog/${publicacion.id}/comentarios/nuevo/`,
                { contenido: nuevoComentario, publicacion_id: publicacion.id },
                { headers: { Authorization: `Bearer ${token}` } }
            );
    
            setNuevoComentario("");
            setComentarios(prevComentarios => [...prevComentarios, response.data]);
        } catch (error) {
            console.error("Error al enviar comentario:", error);
        }
    };

    const eliminarPublicacion = async () => {
        if (!token) return;

        if (!window.confirm("¿Seguro que quieres eliminar esta publicación?")) {
            return;
        }

        try {
            await axios.delete(`http://127.0.0.1:8000/api/blog/${publicacion.id}/eliminar/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            window.location.reload();
            recargarPublicaciones();
        } catch (error) {
            console.error("Error al eliminar publicación:", error);
        }
    };

    return (
        <div className="bg-yellow-100 p-4 rounded-lg shadow-lg flex flex-col w-[400px] h-[750px] overflow-hidden mx-auto">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Autor: {publicacion.usuario_nombre}</h3>
            <h2 className="text-xl font-bold break-words w-full">{publicacion.titulo}</h2>
            <p className="break-words whitespace-normal w-full">{publicacion.contenido}</p>

            {publicacion.url_imagen && (
                <img
                    src={publicacion.url_imagen}
                    alt="Imagen de la publicación"
                    className="w-full h-48 object-cover mt-4 rounded-md"
                />
            )}

            <div className="flex justify-between items-center mt-2">
                <button onClick={toggleLike} className="text-2xl">
                    {liked ? "❤️" : "🤍"}
                </button>
                <span className="text-lg font-bold">{likesCount} Likes</span>
            </div>
            {(esPropietario || esAdmin) && (
                <button 
                    onClick={eliminarPublicacion} 
                    className="bg-red-500 text-white text-xs px-2 py-1 rounded-md hover:bg-red-700 transition shadow-sm mt-4 self-end"
                    title="Eliminar publicación"
                >
                🗑 Eliminar
                </button>
            )}

            <div className="mt-4 flex flex-col">
                <h3 className="font-semibold">Comentarios:</h3>
                <div className="overflow-y-auto max-h-32 pr-2 bg-yellow-200 border border-yellow-400 rounded-md p-2" 
                    style={{ scrollbarWidth: "thin" }}>
                    {comentarios.length > 0 ? (
                        comentarios.map((comentario) => (
                            <p key={comentario.id} className="break-words text-black">
                                <b>{comentario.autor}:</b> {comentario.contenido}
                            </p>
                        ))
                    ) : (
                        <p className="text-gray-700">No hay comentarios aún.</p>
                    )}
                </div>
            </div>
            <div className="mt-auto">
                <div className="text-right text-gray-500 text-sm">
                    {nuevoComentario.length}/{maxCaracteres}
                </div>

                <textarea
                    placeholder="Escribe un comentario..."
                    value={nuevoComentario}
                    maxLength={maxCaracteres}
                    onChange={(e) => setNuevoComentario(e.target.value)}
                    className="w-full p-2 border mt-2 border-gray-300 rounded-md"
                />

                <button 
                    onClick={enviarComentario} 
                    className={`mt-2 px-4 py-2 rounded-md ${
                        nuevoComentario.length === 0 
                            ? "bg-gray-400 cursor-not-allowed" 
                            : "bg-black text-yellow-400 hover:bg-gray-900"
                    }`}
                    disabled={nuevoComentario.length === 0}
                >
                    Comentar
                </button>
            </div>
        </div>
    );
};

export default PublicacionCard;
