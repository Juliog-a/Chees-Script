import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import API from "../api/api";

const PistasPage = () => {
    const { id } = useParams();
    const [recursos, setRecursos] = useState([]);
    const [desafio, setDesafio] = useState(null);
    const [loading, setLoading] = useState(true);
    const token = localStorage.getItem("accessToken");

    useEffect(() => {
        API.get(`/desafios/${id}/`, {
            headers: { Authorization: `Bearer ${token}` }
        })
        .then(response => setDesafio(response.data))
        .catch(error => console.error("Error al obtener el desafío:", error));

        API.get(`/recursos/?desafio_id=${id}&tipo=pista`, {
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

    if (loading) return <p className="text-center text-gray-700 text-lg pt-24">Cargando pistas...</p>;

    return (
        <div className="w-screen min-h-screen bg-white text-black flex flex-col items-center pt-24 pb-10 px-4 sm:px-8">
            <div className="w-full max-w-[800px] bg-white rounded-lg shadow-xl border border-gray-300 p-6 sm:p-10">
                
                {desafio && (
                    <div className="w-full overflow-x-auto mb-6">
                        <table className="min-w-[600px] table-auto border border-gray-400 text-left">
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

                <h1 className="text-3xl md:text-4xl font-bold text-center mb-6">💡 Pistas del Desafío</h1>

                <div className="space-y-4">
                    {recursos.length > 0 ? (
                        recursos.map(recurso => (
                            <div key={recurso.id} className="bg-yellow-100 border-l-4 border-yellow-500 rounded-md shadow-sm p-4">
                                <h2 className="text-lg font-semibold text-gray-900">{recurso.nombre}</h2>
                                <p className="text-sm text-gray-800 mt-2 whitespace-pre-line">
                                    {recurso.contenido}
                                </p>
                            </div>
                        ))
                    ) : (
                        <p className="text-lg text-center text-gray-600">
                            No hay pistas disponibles para este desafío.
                        </p>
                    )}
                </div>

                <div className="mt-8 flex justify-center">
                    <a href="/desafios" className="bg-black text-yellow-400 px-8 py-3 rounded-md text-lg shadow-md hover:bg-gray-800 transition">
                        Volver a Desafíos
                    </a>
                </div>
            </div>
        </div>
    );
};

export default PistasPage;
