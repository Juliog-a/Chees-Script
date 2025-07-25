import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/api";

export default function FormularioContacto() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    comentario: "",
    captcha: "",
  });

  const [mensajeExito, setMensajeExito] = useState("");
  const [error, setError] = useState("");
  const [captchaPregunta, setCaptchaPregunta] = useState("");
  const [captchaRespuesta, setCaptchaRespuesta] = useState(null);


  useEffect(() => {
    generarCaptcha();
    
    const token = localStorage.getItem("accessToken");
    if (!token) {
      navigate("/login");
      return;
    }

    API.get("/user", {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then(() => {
    })
    .catch(() => {
      localStorage.removeItem("accessToken");
      navigate("/login");
    });

  }, []);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      console.error("No hay token disponible, el usuario no está autenticado.");
      return;
    }

    API.get("/trofeos", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(response => response.json())
      .then(data => console.log("Trofeos obtenidos:", data))
      .catch(error => console.error("Error obteniendo trofeos:", error));
  }, []);

  const generarCaptcha = () => {
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    setCaptchaPregunta(`¿Cuánto es ${num1} + ${num2}?`);
    setCaptchaRespuesta(num1 + num2);
  };

  const validateEmail = (email) => /^[a-zA-Z0-9._%+-]+@(gmail\.com|outlook\.com)$/.test(email);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMensajeExito("");

    if (!validateEmail(formData.email)) {
      setError("Solo se permiten correos de Gmail y Outlook.");
      return;
    }

    if (parseInt(formData.captcha) !== captchaRespuesta) {
      setError("Captcha incorrecto. Inténtalo de nuevo.");
      generarCaptcha();
      return;
    }

    const token = localStorage.getItem("accessToken");
    if (!token) {
      setError("Debes iniciar sesión para enviar un mensaje.");
      return;
    }

    try {
      await API.post("/contacto/", {
        autor: formData.email,
        mensaje: formData.comentario,
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
    
      setMensajeExito("Mensaje enviado correctamente.");
      setFormData({ email: "", comentario: "", captcha: "" });
      generarCaptcha();
    } catch (err) {
      console.error("Error al enviar el formulario:", err);
      if (err.response?.status === 429) {
        setError("Debes esperar unos minutos antes de enviar otro mensaje.");
      } else if (err.response?.data?.mensaje && err.response.data.mensaje.length > 0) {
        setError(err.response.data.mensaje[0]);
      } else if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError("Hubo un error al enviar el mensaje. Revisa el contenido e inténtalo de nuevo.");
      }
    }    
  };

  return (
    <div className="w-screen min-h-screen flex flex-col bg-white text-black">
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-[700px] text-center">
          <h1 className="text-3xl md:text-5xl font-bold">Formulario de Contacto</h1>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-lg font-semibold text-left">Email:</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full bg-yellow-100 px-4 py-2 border rounded-md focus:ring-2 focus:ring-yellow-400"
                required
                placeholder="tuemail@gmail.com/@outlook.com"
              />
            </div>

            <div>
              <label className="block text-lg font-semibold text-left">Comentario:</label>
              <textarea
                name="comentario"
                value={formData.comentario}
                onChange={handleChange}
                className="w-full bg-yellow-100 px-4 py-2 border rounded-md focus:ring-2 focus:ring-yellow-400"
                rows="4"
                maxLength="250"
                required
                placeholder="Escribe tu mensaje aquí..."
              ></textarea>
              <p className="text-sm text-gray-600">Máx. 250 caracteres</p>
            </div>

            <div>
              <label className="block text-lg font-semibold text-left">{captchaPregunta}</label>
              <input
                type="text"
                name="captcha"
                value={formData.captcha}
                onChange={handleChange}
                className="w-full bg-yellow-100 px-4 py-2 border rounded-md focus:ring-2 focus:ring-yellow-400"
                required
                placeholder="Introduce el resultado"
              />
            </div>

            <div className="mt-6">
              <button
                type="submit"
                className="bg-black text-yellow-400 px-4 py-3 text-lg font-bold rounded-md hover:bg-gray-800 transition"
              >
                ENVIAR ➢
              </button>
            </div>
          </form>

          {mensajeExito && <p className="mt-4 text-green-600">{mensajeExito}</p>}
          {error && <p className="mt-4 text-red-600">{error}</p>}
        </div>
      </div>
    </div>
  );
}