import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import API from "../api/api";


export default function Home() {
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const response = await API.get("/home/");
        setRanking(response.data.ranking);
      } catch (err) {
        setError("Error al cargar el ranking.");
        console.error("Error al obtener el ranking:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHomeData();
  }, []);

  return (
    <div className="w-screen min-h-screen flex flex-col bg-white text-black pt-[100px] md:pt-24">
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-[700px] text-center">
          <h1 className="text-3xl md:text-5xl font-bold">
            Aprende ciberseguridad jugando
          </h1>
          <p className="text-gray-500 italic mt-2 text-sm md:text-lg">
            "La educación no es aprender datos, sino entrenar la mente para pensar." - Albert Einstein
          </p>
          <div className="flex flex-col md:flex-row justify-center items-start gap-6 mt-8">
            <div className="bg-yellow-200 p-6 rounded-md shadow-md w-full md:w-[300px]">
              <h2 className="text-xl font-bold mb-4">Ranking</h2>
              {loading ? (
                <p>Cargando ranking...</p>
              ) : error ? (
                <p className="text-red-500">{error}</p>
              ) : (
                <ul className="space-y-2">
                  {ranking.length > 0 ? (
                    ranking.map((player, index) => (
                      <li key={player.id}>
                        {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `${index + 1}️`}{" "}
                        <strong>{player.username}</strong> - {player.points} ptos
                      </li>
                    ))
                  ) : (
                    <p className="text-gray-500">No hay jugadores con puntos aún.</p>
                  )}
                </ul>
              )}
            </div>
            <div className="bg-yellow-200 p-6 rounded-md shadow-md w-full md:w-[300px]">
              <h2 className="text-xl font-bold mb-4">Sobre nosotros</h2>
              <p className="text-sm">
                En <strong>Chees Script</strong>, creemos que aprender ciberseguridad debe ser accesible y divertido. Nuestra plataforma ofrece desafíos que te ayudarán a descubrir y comprender las vulnerabilidades más comunes. Adentrate en el mundo de la ciberseguridad, las vulnerabilidades y los bugs y conviertete en un verdadero Blue-Team Hacker.
              </p>
            </div>
          </div>
          <div className="mt-8 mb-10 md:mb-0">
            <Link
              to="/desafios"
              className="bg-black text-yellow-400 px-6 py-3 text-lg font-bold rounded-md hover:bg-gray-800 transition"
            >
              ➤ Empezar Ahora
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
