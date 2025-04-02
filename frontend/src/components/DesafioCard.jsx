import { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import API from "../api/api";

const DesafioCard = ({ desafio }) => {
    const [liked, setLiked] = useState(desafio.liked_by_user);

    const toggleLike = async () => {
        const token = localStorage.getItem("accessToken");

        try {
            const response = await API.post(`/desafios/${desafio.id}/toggle_like/`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setLiked(response.data.liked);
        } catch (error) {
            console.error("Error al cambiar el estado de Me gusta:", error);
        }
    };

    return (
        <div className="w-full max-w-[500px] min-h-[320px] p-6 rounded-lg shadow-md flex flex-col justify-between bg-yellow-100 border-l-8 relative">
          {/* Header */}
          <div className="flex justify-between items-start gap-2">
            <button onClick={toggleLike} className="text-2xl">
              {liked ? "❤️" : "🤍"}
            </button>
            <span className="text-2xl font-bold text-center flex-grow break-words">
              {desafio.nombre}
            </span>
            <span
              className={`text-white text-sm px-4 py-1 rounded-md font-bold ${
                desafio.solucionado ? "bg-gray-500" : "bg-green-600"
              } flex items-center whitespace-nowrap`}
            >
              {desafio.puntuacion} ptos
            </span>
          </div>
    
          {/* Descripción */}
          <p className="text-md text-gray-700 mt-4">{desafio.descripcion}</p>
    
          {/* Botones de teoría, pistas, feedback */}
          <div className="mt-4 flex flex-wrap justify-between gap-2">
            <Link
              to={`/teoria/${desafio.id}`}
              className="bg-black text-yellow-400 px-4 py-2 rounded w-full sm:w-auto flex-1 flex items-center justify-center"
            >
              Teoría
            </Link>
            <Link
              to={`/pistas/${desafio.id}`}
              className="bg-black text-yellow-400 px-4 py-2 rounded w-full sm:w-auto flex-1 flex items-center justify-center"
            >
              Pistas
            </Link>
            <Link
              to={`/feedback/${desafio.id}`}
              className="bg-black text-yellow-400 px-4 py-2 rounded w-full sm:w-auto flex-1 flex items-center justify-center"
            >
              Feedback
            </Link>
          </div>
    
          {/* Botón principal */}
          <div className="mt-4 flex justify-center">
            <Link
              to={`/desafio/${desafio.id}`}
              className="bg-yellow-400 text-black px-6 py-3 text-lg font-bold rounded w-full sm:w-3/4 flex items-center justify-center"
            >
              ¡Vamos!
            </Link>
          </div>
        </div>
      );
    };
    
    export default DesafioCard;
