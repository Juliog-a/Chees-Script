import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

const DesafioPage = () => {
    const { id } = useParams();
    const [desafio, setDesafio] = useState(null);
    const [loading, setLoading] = useState(true);
    const [respuestaUsuario, setRespuestaUsuario] = useState("");
    const [mensaje, setMensaje] = useState("");
    const token = localStorage.getItem("accessToken");

    useEffect(() => {
        axios.get(`http://127.0.0.1:8000/api/desafios/${id}/`, {
            headers: { Authorization: `Bearer ${token}` }
        })
        .then(response => {
            setDesafio(response.data);
            setLoading(false);
        })
        .catch(error => {
            console.error("Error al obtener el desafío:", error);
            setLoading(false);
        });
    }, [id, token]);

    if (loading) return <p className="text-center text-gray-700 text-lg">Cargando desafío...</p>;
    if (!desafio) return <p className="text-center text-red-600 text-lg">Error: Desafío no encontrado.</p>;

    // Función para verificar la respuesta
    const verificarRespuesta = async () => {
        try {
            const response = await axios.post(
                `http://127.0.0.1:8000/api/desafios/${id}/verificar_respuesta/`,
                { respuesta: respuestaUsuario },
                { headers: { Authorization: `Bearer ${token}` } }
            );
    
            setMensaje(response.data.mensaje);
    
            if (response.data.solucionado) {
                setDesafio(prev => ({ ...prev, solucionado: true })); // Marcar como solucionado
            }
        } catch (error) {
            console.error("Error al verificar respuesta:", error);
    
            // Si el error tiene una respuesta del servidor, capturar el mensaje
            if (error.response) {
                setMensaje(error.response.data.mensaje || "Hubo un error al verificar la respuesta.");
            } else {
                setMensaje("Error de conexión con el servidor.");
            }
        }
    };
    
    

    return (
        <div className="w-screen min-h-screen flex flex-col bg-white text-black">
            <div className="flex-1 flex items-center justify-center px-6 mt-20">
                <div className="w-[90%] max-w-[1300px] bg-yellow-100 p-20 rounded-lg shadow-xl border-l-8 min-h-[80vh]">

                    {/* Título del Desafío */}
                    <h1 className="text-4xl md:text-6xl font-bold text-center mb-6">{desafio.nombre}</h1>
                    
                    {/* Descripción general */}
                    <p className="text-lg text-gray-700 text-center">{desafio.descripcion}</p>

                    {/* Imagen si está disponible */}
                    {desafio.url_imagen && (
                        <img src={desafio.url_imagen} alt="Imagen del desafío" 
                            className="w-full max-w-2xl mx-auto mt-6 rounded-lg shadow-md"
                        />
                    )}

                    {/* Sección de Enunciado */}
                    <div className="mt-8 p-6 bg-gray-200 border-l-4 border-gray-600 rounded-lg shadow-md">
                        <h2 className="text-2xl font-semibold">📜 Enunciado del Desafío</h2>
                        <p className="text-gray-800 mt-3 text-lg">{desafio.enunciado}</p>
                    </div>

                    {/* Sección de Texto Cifrado (solo si aplica) */}
                    {desafio.tematica === "Cifrado" && (
                        <div className="mt-6 p-5 bg-gray-900 text-yellow-400 border-l-4 border-yellow-500 rounded-md text-center text-lg font-mono">
                            <h3 className="text-xl font-semibold mb-2">🔐 Texto Cifrado 🔐</h3>
                            <p>{desafio.texto_cifrado}</p>
                        </div>
                    )}



                    {/* Campo de Respuesta */}
                    <div className="mt-8 p-6 bg-white border rounded-lg shadow-md">
                        <h2 className="text-2xl font-semibold">Solución:</h2>
                        <input 
                            type="text" 
                            value={respuestaUsuario}
                            onChange={(e) => setRespuestaUsuario(e.target.value)}
                            className="w-full p-3 border border-gray-400 rounded-md mt-3 text-lg"
                            placeholder="Escribe aquí tu respuesta..."
                        />
                        <button 
                            onClick={verificarRespuesta}
                            className="mt-4 bg-black text-yellow-400 px-8 py-3 rounded-md text-lg shadow-md hover:bg-gray-800"
                        >
                            Comprobar
                        </button>
                        {mensaje && <p className="mt-4 text-lg font-semibold">{mensaje}</p>}
                    </div>

                    {/* Botones de Navegación */}
                    <div className="mt-8 flex flex-wrap justify-center gap-6">
                        <a href={`/teoria/${desafio.id}`} className="bg-black text-yellow-400 px-8 py-3 rounded-md text-lg shadow-md hover:bg-gray-800">📖 Ver Teoría</a>
                        <a href={`/pistas/${desafio.id}`} className="bg-black text-yellow-400 px-8 py-3 rounded-md text-lg shadow-md hover:bg-gray-800">💡 Ver Pistas</a>
                        <a href={`/feedback/${desafio.id}`} className="bg-black text-yellow-400 px-8 py-3 rounded-md text-lg shadow-md hover:bg-gray-800">📝 Feedback</a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DesafioPage;
