import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

const PistasPage = () => {
    const { id } = useParams();
    const [recursos, setRecursos] = useState([]);
    const [desafio, setDesafio] = useState(null);
    const [loading, setLoading] = useState(true);
    const token = localStorage.getItem("accessToken");

    useEffect(() => {
        axios.get(`http://127.0.0.1:8000/api/desafios/${id}/`, {
            headers: { Authorization: `Bearer ${token}` }
        })
        .then(response => setDesafio(response.data))
        .catch(error => console.error("Error al obtener el desafío:", error));
        axios.get(`http://127.0.0.1:8000/api/recursos/?desafio_id=${id}&tipo=pista`, {
            headers: { Authorization: `Bearer ${token}` }
        })
        .then(response => {
            setRecursos(response.data);
            setLoading(false);
        })
        .catch(error => {
            console.error("Error al obtener pistas:", error);
            setLoading(false);
        });
    }, [id, token]);

    if (loading) return <p className="text-center text-gray-700 text-lg">Cargando pistas...</p>;

    return (
        <div className="w-screen min-h-screen flex flex-col bg-white text-black">
            <div className="flex-1 flex items-center justify-center px-6 mt-10">
                <div className="w-[90%] max-w-[1100px] bg-white p-10 rounded-lg shadow-xl border border-gray-300 min-h-[80vh] flex flex-col">
                    {desafio && (
                        <div className="w-full overflow-x-auto mb-6">
                            <table className="w-full border border-gray-400 text-left">
                                <thead className="bg-black text-white">
                                    <tr>
                                        <th className="p-4 border border-gray-400">Nombre</th>
                                        <th className="p-4 border border-gray-400">Descripción</th>
                                        <th className="p-4 border border-gray-400">Dificultad</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="bg-yellow-100">
                                        <td className="p-4 border border-gray-400">{desafio.nombre}</td>
                                        <td className="p-4 border border-gray-400">{desafio.descripcion}</td>
                                        <td className="p-4 border border-gray-400 text-center">⭐</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    )}

                    <h1 className="text-3xl font-bold text-center mb-6">💡 Pistas del Desafío</h1>
                    <div className="p-8 bg-yellow-100 border-l-8 border-yellow-500 rounded-lg shadow-md text-lg leading-relaxed min-h-[200px] max-h-[600px] overflow-y-auto">
                        {recursos.length > 0 ? (
                            recursos.map(recurso => (
                                <div key={recurso.id} className="mb-6">
                                    <h2 className="text-xl font-semibold text-gray-900">{recurso.nombre}</h2>
                                    <p className="text-gray-800 mt-4" style={{ whiteSpace: "pre-wrap" }}>
                                        {recurso.contenido}
                                    </p>
                                </div>
                            ))
                        ) : (
                            <p className="text-lg text-center text-gray-600">No hay pistas disponibles para este desafío.</p>
                        )}
                    </div>
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

export default PistasPage;
