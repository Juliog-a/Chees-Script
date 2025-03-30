import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import API from "../api/api";

const Trofeos = () => {
  const [trofeos, setTrofeos] = useState([]);
  const [userPoints, setUserPoints] = useState(0);
  const [completedChallenges, setCompletedChallenges] = useState([]);
  const [previousUnlockedTrophies, setPreviousUnlockedTrophies] = useState(new Set());
  const calculateLevel = (points) => {
    return Math.floor(points / 10);
  };

  const cargarTrofeos = () => {
    const token = localStorage.getItem("accessToken");
    
    if (!token) {
      console.error("No hay token disponible, el usuario no está autenticado.");
      return;
    }
  
    API.post("/trofeos/", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then(async (data) => {
        setUserPoints(data.usuario?.puntos || 0);
        setTrofeos(data.trofeos);
        setCompletedChallenges(data.usuario?.desafios_completados || []);
  
        data.trofeos.forEach((trofeo) => {
          if (trofeo.desbloqueado_para_el_usuario && !trofeo.ya_notificado) {
            toast.success(`¡Trofeo desbloqueado! ${trofeo.nombre}`, {
              position: "top-center",
              autoClose: 4000,
            });
  
            // Marca en el backend como notificado
            API.get("/trofeos/", {
                method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ trofeo_id: trofeo.id }),
            })
            .then(res => res.json())
            .then(res => console.log(res.mensaje))
            .catch(err => console.error("Error al marcar notificación:", err));
          }
        });
      })
      .catch((error) => console.error("Error al cargar los trofeos:", error));
  };
  
  

  const verificarRespuesta = async (desafioId, respuesta) => {
    const token = localStorage.getItem("accessToken");
  
    try {
      const response = await API.post(`/desafios/${desafioId}/verificar_respuesta/`,
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
          cargarTrofeos();
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

  const backendURL = "https://chees-script.onrender.com";

  return (
    <div className="w-full flex flex-col items-center">
      <h2 className="text-3xl font-bold text-center text-gray-900">Trofeos</h2>

      {trofeos.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 mt-6">
          {trofeos.map((trofeo) => {
            const desbloqueado = trofeo.desbloqueado_para_el_usuario;

            console.log(
              `Trofeo: ${trofeo.nombre}, Nivel Requerido: ${trofeo.nivel_requerido}, Puntos Usuario: ${userPoints}, Desbloqueado: ${desbloqueado}`
            );

            const imagenUrl = desbloqueado
              && trofeo.imagen_desbloqueada 
              && trofeo.imagen_desbloqueada.trim() !== ""
                ? `${backendURL}${new URL(trofeo.imagen_desbloqueada, backendURL).pathname}`
              : !desbloqueado && trofeo.imagen_actual && trofeo.imagen_actual.trim() !== ""
                ? `${backendURL}${new URL(trofeo.imagen_actual, backendURL).pathname}`
                : "/fallback-image.png";          
            const imagenFinal = (imagenUrl && imagenUrl.trim()) ? imagenUrl : "/fallback-image.png";
          
            return (
              <div key={trofeo.id} className="p-4 border rounded-lg shadow-md">
                <img
                  src={imagenFinal}
                  alt={trofeo.nombre}
                  width={128} 
                  height={128} 
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
