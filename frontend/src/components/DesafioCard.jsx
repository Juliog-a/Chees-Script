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
      <div
      className="w-full max-w-[550px] h-full p-6 rounded-xl shadow-lg flex flex-col justify-between bg-yellow-50 border-l-8 border-yellow-300 relative min-h-[400px]"
      data-testid={`desafio-card-${desafio.id}`}
      >
        <div className="absolute top-3 left-3 bg-yellow-500 text-black text-xs px-3 py-1 rounded-full font-semibold shadow-sm">
          {desafio.nivel_dificultad}
        </div>
          <div className="flex items-center justify-between mb-2 gap-3 mt-6">
          <button onClick={toggleLike} className="text-xl hover:scale-110 transition-transform">
            {liked ? "❤️" : "🤍"}
          </button>
          <h2 className="text-base sm:text-lg font-bold text-center flex-grow whitespace-nowrap overflow-hidden text-ellipsis">
          {desafio.nombre}
          </h2>
          <div data-testid={`categoria-${desafio.id}`} style={{ display: 'none' }}>
            {desafio.tematica}
          </div>
          <span
            className={`text-white text-xs px-3 py-1 rounded-md font-semibold ${
              desafio.solucionado ? "bg-gray-500" : "bg-green-600"
            }`}
          >
            {desafio.puntuacion} ptos
          </span>
        </div>
          <p className="text-sm text-gray-800 mt-2 leading-relaxed">
          {desafio.descripcion}
        </p>
          <div className="mt-4 flex flex-wrap justify-between gap-2">
          <Link
            to={`/teoria/${desafio.id}`}
            className="bg-black text-yellow-400 px-4 py-2 rounded w-full sm:w-auto flex-1 text-center text-sm font-semibold hover:bg-gray-800 transition"
          >
            Teoría
          </Link>
          <Link
            to={`/pistas/${desafio.id}`}
            className="bg-black text-yellow-400 px-4 py-2 rounded w-full sm:w-auto flex-1 text-center text-sm font-semibold hover:bg-gray-800 transition"
          >
            Pistas
          </Link>
          <Link
            to={`/feedback/${desafio.id}`}
            className="bg-black text-yellow-400 px-4 py-2 rounded w-full sm:w-auto flex-1 text-center text-sm font-semibold hover:bg-gray-800 transition"
          >
            Feedback
          </Link>
        </div>
          <div className="mt-4">
          <Link
            to={`/desafio/${desafio.id}`}
            className="bg-yellow-400 text-black px-6 py-3 text-base sm:text-lg font-bold rounded w-full flex items-center justify-center hover:bg-yellow-500 transition"
          >
            ¡Vamos!
          </Link>
        </div>
      </div>
    );
  };

  
    
    export default DesafioCard;
