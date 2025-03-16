import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";

const Trofeos = () => {
  const [trofeos, setTrofeos] = useState([]);
  const [userPoints, setUserPoints] = useState(0);
  const [completedChallenges, setCompletedChallenges] = useState([]);
  const [previousUnlockedTrophies, setPreviousUnlockedTrophies] = useState(new Set());

  // Función para calcular el nivel del usuario (Cada 10 puntos = 1 nivel)
  const calculateLevel = (points) => {
    return Math.floor(points / 10);
  };

  const cargarTrofeos = () => {
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
        console.log("Datos recibidos actualizados:", data); // Verifica esta línea
  
        const userPoints = data.usuario?.puntos || 0;
  
        const storedUnlockedTrophies = new Set(
          JSON.parse(localStorage.getItem("unlockedTrophies")) || []
        );
  
        const nuevosTrofeosDesbloqueados = new Set();
  
        data.trofeos.forEach((trofeo) => {
          if (trofeo.desbloqueado_para_el_usuario) {
            nuevosTrofeosDesbloqueados.add(trofeo.id);
  
            if (!storedUnlockedTrophies.has(trofeo.id)) {
              toast.success(`¡Trofeo desbloqueado! ${trofeo.nombre}`, {
                position: "top-center",
                autoClose: 4000,
              });
            }
          }
        });
  
        localStorage.setItem(
          "unlockedTrophies",
          JSON.stringify([...nuevosTrofeosDesbloqueados])
        );
  
        setPreviousUnlockedTrophies(nuevosTrofeosDesbloqueados);
        setUserPoints(userPoints);
        setTrofeos(data.trofeos);
        setCompletedChallenges(data.usuario?.desafios_completados || []);
      })
      .catch((error) => console.error("❌ Error al cargar los trofeos:", error));
  };



  // ───────────────────────────────────────────────────────────
  // NUEVA FUNCIÓN para verificar la respuesta de un desafío.
  // No se modifica nada más del componente.
  // ───────────────────────────────────────────────────────────
  const verificarRespuesta = async (desafioId, respuesta) => {
    const token = localStorage.getItem("accessToken");
  
    try {
      const response = await fetch(
        `http://localhost:8000/api/desafios/${desafioId}/verificar_respuesta/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ respuesta }),
        }
      );
  
      const data = await response.json();
  
      if (response.ok) {
        toast.success(data.mensaje);
        if (data.puntos !== undefined) {
          setUserPoints(data.puntos);
          cargarTrofeos(); // <-- Añade exactamente esto aquí
        }
      } else {
        toast.error(data.mensaje);
      }
    } catch (error) {
      console.error("Error al verificar la respuesta:", error);
      toast.error("Error al verificar la respuesta.");
    }
  };
  
  // ───────────────────────────────────────────────────────────
  

  
  useEffect(() => {
    cargarTrofeos();
  }, []);

  const backendURL = "http://localhost:8000";

  return (
    <div className="w-full flex flex-col items-center">
      <h2 className="text-3xl font-bold text-center text-gray-900">Trofeos</h2>

      {trofeos.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 mt-6">
          {trofeos.map((trofeo) => {
            // Verificamos si el trofeo está desbloqueado según el backend
            const desbloqueado = trofeo.desbloqueado_para_el_usuario;

            console.log(
              `Trofeo: ${trofeo.nombre}, Nivel Requerido: ${trofeo.nivel_requerido}, Puntos Usuario: ${userPoints}, Desbloqueado: ${desbloqueado}`
            );

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
