import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import API from "../api/api";

const DesafioPage = () => {
  const { id } = useParams();
  const [desafio, setDesafio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [respuestaUsuario, setRespuestaUsuario] = useState("");
  const [mensaje, setMensaje] = useState("");
  const token = localStorage.getItem("accessToken");

  useEffect(() => {
    API.get(`/desafios/${id}/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((response) => {
        setDesafio(response.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error al obtener el desafío:", error);
        setLoading(false);
      });
  }, [id, token]);

  if (loading)
    return <p className="text-center text-gray-700 text-lg pt-24">Cargando desafío...</p>;
  if (!desafio)
    return <p className="text-center text-red-600 text-lg pt-24">Error: Desafío no encontrado.</p>;

  const cargarTrofeos = async () => {
    try {
      const res = await API.get("/trofeos/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("Trofeos recargados:", res.data);
    } catch (error) {
      console.error("Error al cargar trofeos:", error);
    }
  };

  const verificarRespuesta = async () => {
    try {
      const response = await API.post(
        `/desafios/${id}/verificar_respuesta/`,
        { respuesta: respuestaUsuario },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMensaje(response.data.mensaje);

      if (response.data.solucionado) {
        setDesafio((prev) => ({ ...prev, solucionado: true }));
        await cargarTrofeos();
      }
    } catch (error) {
      console.error("Error al verificar respuesta:", error);
      if (error.response) {
        setMensaje(error.response.data.mensaje || "Hubo un error al verificar la respuesta.");
      } else {
        setMensaje("Error de conexión con el servidor.");
      }
    }
  };

  return (
    <div className="w-screen min-h-screen bg-white text-black flex flex-col items-center pt-24 pb-10 px-4 sm:px-8">
      <div className="w-full max-w-[800px] bg-yellow-100 p-6 sm:p-10 rounded-lg shadow-xl border-l-8 border-yellow-400">
        <h1 className="text-3xl md:text-5xl font-bold text-center mb-4">{desafio.nombre}</h1>
        <p className="text-md sm:text-lg text-gray-700 text-center mb-6">{desafio.descripcion}</p>

        {desafio.url_imagen && (
          <img
            src={desafio.url_imagen}
            alt="Imagen del desafío"
            className="w-full max-w-md mx-auto mt-4 rounded-lg shadow-md"
          />
        )}

        <div className="mt-8 p-4 bg-white border-l-4 border-yellow-500 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-2">📜 Enunciado del Desafío</h2>
          <pre className="text-gray-800 text-sm sm:text-base bg-yellow-50 p-4 rounded-md whitespace-pre-wrap overflow-x-auto">
            {desafio.enunciado}
          </pre>
        </div>

        {desafio.tematica === "Cifrado" && (
          <div className="mt-6 p-5 bg-gray-900 text-yellow-400 border-l-4 border-yellow-500 rounded-md text-center text-lg font-mono">
            <h3 className="text-xl font-semibold mb-2">🔐 Texto Cifrado</h3>
            <p>{desafio.texto_cifrado}</p>
          </div>
        )}

        <div className="mt-8 p-6 bg-white border rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-2">Solución:</h2>
          <input
            type="text"
            value={respuestaUsuario}
            onChange={(e) => setRespuestaUsuario(e.target.value)}
            className="w-full p-3 border border-gray-400 rounded-md mt-2 text-lg bg-yellow-50 placeholder:text-gray-500"
            placeholder="Escribe aquí tu respuesta..."
          />
          <button
            onClick={verificarRespuesta}
            className="mt-4 bg-black text-yellow-400 px-8 py-3 rounded-md text-lg shadow-md hover:bg-gray-800 transition w-full sm:w-auto"
          >
            Comprobar
          </button>
          {mensaje && <p className="mt-4 text-md font-semibold text-center">{mensaje}</p>}
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <a
            href={`/teoria/${desafio.id}`}
            className="bg-black text-yellow-400 px-6 py-3 rounded-md text-lg shadow-md hover:bg-gray-800 transition"
          >
            📖 Ver Teoría
          </a>
          <a
            href={`/pistas/${desafio.id}`}
            className="bg-black text-yellow-400 px-6 py-3 rounded-md text-lg shadow-md hover:bg-gray-800 transition"
          >
            💡 Ver Pistas
          </a>
          <a
            href={`/feedback/${desafio.id}`}
            className="bg-black text-yellow-400 px-6 py-3 rounded-md text-lg shadow-md hover:bg-gray-800 transition"
          >
            📝 Feedback
          </a>
        </div>
      </div>
    </div>
  );
};

export default DesafioPage;
