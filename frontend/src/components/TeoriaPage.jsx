import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

const TeoriaPage = () => {
    const { id } = useParams(); // Obtener el ID del desafío desde la URL
    const [recursos, setRecursos] = useState([]);
    const [loading, setLoading] = useState(true);
    const token = localStorage.getItem("accessToken");

    useEffect(() => {
        axios.get(`http://127.0.0.1:8000/api/recursos/?desafio_id=${id}&tipo=teoria`, {
            headers: { Authorization: `Bearer ${token}` }
        })
        .then(response => {
            setRecursos(response.data);
            setLoading(false);
        })
        .catch(error => {
            console.error("Error al obtener teoría:", error);
            setLoading(false);
        });
    }, [id, token]);

    if (loading) return <p className="text-center text-gray-700 text-lg">Cargando teoría...</p>;

    return (
        <div className="w-screen min-h-screen flex flex-col bg-white text-black">
            <div className="flex-1 flex items-center justify-center px-6 mt-20">
                <div className="w-[90%] max-w-[1300px] bg-yellow-100 p-20 rounded-lg shadow-xl border-l-8 min-h-[80vh] flex flex-col justify-center">

                    {/* Título de la Teoría */}
                    <h1 className="text-4xl md:text-6xl font-bold text-center mb-6">Teoría del Desafío</h1>
                    
                    {/* Sección de Contenido de la Teoría */}
                    <div className="mt-8 p-10 bg-white border rounded-lg shadow-md text-lg leading-relaxed min-h-[400px] max-h-[600px] overflow-y-auto">
                        {recursos.length > 0 ? (
                            recursos.map(recurso => (
                                <div key={recurso.id} className="mb-6">
                                    <h2 className="text-2xl font-semibold text-gray-900">{recurso.nombre}</h2>
                                    <p className="text-gray-800 mt-4">{recurso.contenido}</p>
                                </div>
                            ))
                        ) : (
                            <p className="text-lg text-center text-gray-600">No hay teoría disponible para este desafío.</p>
                        )}
                    </div>

                    {/* Botón para volver a los desafíos */}
                    <div className="mt-8 flex justify-center">
                        <a href="/desafios" className="bg-black text-yellow-400 px-8 py-3 rounded-md text-lg shadow-md hover:bg-gray-800">
                            Volver a Desafíos
                        </a>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default TeoriaPage;
