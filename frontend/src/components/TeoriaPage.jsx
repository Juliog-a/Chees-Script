import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import API from "../api/api";

const TeoriaPage = () => {
    const { id } = useParams();
    const [recursos, setRecursos] = useState([]);
    const [loading, setLoading] = useState(true);
    const token = localStorage.getItem("accessToken");

    useEffect(() => {
        API.get(`/recursos/?desafio_id=${id}&tipo=teoria`, {
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

    if (loading) return <p className="text-center text-gray-700 text-lg pt-24">Cargando teoría...</p>;

    return (
        <div className="w-screen min-h-screen bg-yellow-100 flex flex-col items-center pt-24 pb-10 px-4 sm:px-8">
            <div className="w-full max-w-[800px] bg-white p-6 sm:p-10 rounded-lg shadow-xl border-l-8 border-yellow-400">
                <h1 className="text-3xl md:text-5xl font-bold text-center mb-6">Teoría del Desafío</h1>

                <div className="bg-white border rounded-lg shadow-md p-6 sm:p-8 text-base sm:text-lg leading-relaxed">
                    {recursos.length > 0 ? (
                        recursos.map(recurso => (
                            <div key={recurso.id} className="mb-6">
                                <h2 className="text-xl font-semibold text-gray-900">{recurso.nombre}</h2>
                                <p className="text-gray-800 mt-2 whitespace-pre-line">
                                    {recurso.contenido}
                                </p>
                            </div>
                        ))
                    ) : (
                        <p className="text-lg text-center text-gray-600">
                            No hay teoría disponible para este desafío.
                        </p>
                    )}
                </div>

                <div className="mt-8 flex justify-center">
                    <a
                        href="/desafios"
                        className="bg-black text-yellow-400 px-8 py-3 rounded-md text-lg shadow-md hover:bg-gray-800 transition"
                    >
                        Volver a Desafíos
                    </a>
                </div>
            </div>
        </div>
    );
};

export default TeoriaPage;
