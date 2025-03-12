import React, { useEffect, useState } from "react";


// Función para calcular el nivel según los puntos
// Cada 10 puntos aumenta 1 nivel, hasta nivel 100 al llegar a 1000 puntos.
const calculateLevel = (points) => {
    // Caso especial: 1000 o más => nivel 100
    if (points >= 1000) {
      return { level: 100, progress: 100 };
    }
  
    // Nivel calculado con división entera
    const level = Math.floor(points / 10);
    // Resto para la barra de progreso
    const remainder = points % 10;
    // Porcentaje de progreso entre un nivel y el siguiente
    const progress = (remainder / 10) * 100;
  
    return { level, progress };
  };


const Trofeos = () => {
  const [trofeos, setTrofeos] = useState([]);
  const [userLevel, setUserLevel] = useState(1); // Nivel del usuario
  const [completedChallenges, setCompletedChallenges] = useState([]); // Desafíos completados por el usuario

  useEffect(() => {
    const token = localStorage.getItem("accessToken");

    if (!token) {
        console.error("No hay token disponible, el usuario no está autenticado.");
        return;
    }

    fetch("http://localhost:8000/api/trofeos/", {
        headers: { Authorization: `Bearer ${token}` },
    })
    .then((res) => res.json())
    .then((data) => {
        console.log("Datos del usuario:", data.usuario);
        console.log("Trofeos recibidos:", data.trofeos);

        // Obtener los puntos del usuario desde la API
        const userPoints = data.usuario?.puntos || 0;
        const { level } = calculateLevel(userPoints);
        setUserLevel(level);
        
        console.log(`Puntos del usuario: ${userPoints}, Nivel calculado: ${level}`);

        // Guardamos los trofeos en el estado
        setTrofeos(data.trofeos);

        // Guardar los desafíos completados en el estado
        setCompletedChallenges(data.usuario?.desafios_completados || []);

    })
    .catch((error) => console.error("Error al cargar los trofeos:", error));
}, []);

const backendURL = "http://localhost:8000"; 
  return (
    <div className="w-full flex flex-col items-center">
      <h2 className="text-3xl font-bold text-center text-gray-900">Trofeos</h2>

      {trofeos.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 mt-6">
          {trofeos.map((trofeo) => {
            const nivelRequerido = parseInt(trofeo.nivel_requerido, 10); // Convertir a número
            // Verificar si el trofeo está desbloqueado por nivel o por desafío completado
            const desbloqueadoPorNivel = userLevel >= nivelRequerido;
            const desbloqueadoPorDesafio = trofeo.desafios_desbloqueantes?.some((desafio) =>
              completedChallenges.includes(desafio.id)
            );
            
            // Nuevo: si el trofeo ya está marcado como desbloqueado en el backend, respétalo
            const desbloqueado = trofeo.desbloqueado_para_el_usuario || (userLevel >= nivelRequerido);

            console.log(`Trofeo: ${trofeo.nombre}, Nivel Requerido: ${nivelRequerido}, Usuario Nivel: ${userLevel}, Desbloqueado: ${desbloqueado}`);

            // Verificar si hay imagen desbloqueada o usar la bloqueada
            const imagenUrl = desbloqueado
                ? trofeo.imagen_desbloqueada
                    ? `${backendURL}${new URL(trofeo.imagen_desbloqueada).pathname}`
                    : "/fallback-image.png"
                : `${backendURL}${new URL(trofeo.imagen_actual).pathname}`;

            return (
                <div key={trofeo.id} className="p-4 border rounded-lg shadow-md">
                    <img
                        src={imagenUrl}
                        alt={trofeo.nombre}
                        className="w-32 h-32 mx-auto border-4 border-gray-800 shadow-lg rounded-lg object-cover"
                        onError={(e) => {
                            if (e.target.src !== "/fallback-image.png") {
                                e.target.src = "/fallback-image.png";
                            }
                        }}
                    />

                    <h3 className="text-center text-lg font-semibold">{trofeo.nombre}</h3>
                    <p className="text-center text-gray-500">
                        {desbloqueado ? trofeo.descripcion : "???"}
                    </p>
                </div>
            );
          })}
        </div>
      ) : (
        <div className="w-full flex flex-col items-center mt-4">
          <p className="text-gray-600 text-lg font-semibold text-center">
            No has desbloqueado ningún trofeo aún.
          </p>
        </div>
      )}
    </div>
  );

};

export default Trofeos;