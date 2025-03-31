import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import API from "../api/api";

const FeedbackForm = () => {
    const { desafioId } = useParams();
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [comentario, setComentario] = useState("");
    const [puntuacion, setPuntuacion] = useState(5);
    const [captcha, setCaptcha] = useState("");
    const [captchaQuestion, setCaptchaQuestion] = useState("");
    const [captchaAnswer, setCaptchaAnswer] = useState(null);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem("accessToken");
        if (!token) {
            navigate("/login");
            return;
        }

        API.get("/user/", {
            headers: { Authorization: `Bearer ${token}` }
        })
        .then(response => {
            setUser(response.data);
        })
        .catch(() => {
            navigate("/login");
        });

        generateCaptcha();
    }, [navigate]);

    const generateCaptcha = () => {
        const num1 = Math.floor(Math.random() * 10);
        const num2 = Math.floor(Math.random() * 10);
        const num3 = Math.floor(Math.random() * 5);
        setCaptchaQuestion(`¿Cuánto es ${num1} + ${num2} - ${num3}?`);
        setCaptchaAnswer(num1 + num2 - num3);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
    
        if (parseInt(captcha) !== captchaAnswer) {
            setError("Respuesta incorrecta en la verificación.");
            generateCaptcha();
            return;
        }
    
        const token = localStorage.getItem("accessToken");
    
        try {
            const response = await API.post("/feedbacks/", {
                desafio_id: desafioId,
                usuario_id: user.id,
                autor: user.username,
                codigo: comentario,
                puntuacion: puntuacion
            }, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });
    
            if (response.status === 201) {
                setSuccess("Feedback enviado correctamente.");
                setTimeout(() => navigate("/desafios"), 1500);
            }
        } catch (err) {
            console.error("Error en la API:", err.response?.data || err);
            setError("Error al enviar el feedback.");
        }
    };
    

    return (
        <div className="w-screen min-h-screen flex flex-col bg-white text-black p-6 items-center">
            <h1 className="text-3xl md:text-5xl font-bold text-center mb-8">Formulario de Feedback</h1>

            <form onSubmit={handleSubmit} className="w-full max-w-lg bg-yellow-100 p-6 rounded-lg shadow-md">
                <label className="block text-lg font-semibold mb-2">Autor:</label>
                <input
                    type="text"
                    className="w-full p-3 border border-gray-300 rounded-md bg-yellow-200"
                    value={user ? user.username : "Cargando..."} 
                    readOnly
                />

                <label className="block text-lg font-semibold mt-4 mb-2">Comentario:</label>
                <textarea
                    className="w-full p-3 border border-gray-300 rounded-md bg-yellow-100"
                    maxLength={250}
                    rows={4}
                    value={comentario}
                    onChange={(e) => setComentario(e.target.value)}
                    required
                ></textarea>
                <p className="text-gray-500 text-sm mt-1">Máx. 250 caracteres</p>

                <label className="block text-lg font-semibold mt-4 mb-2">Puntuación:</label>
                <div className="flex flex-wrap justify-center gap-2">                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            type="button"
                            className={`text-2xl ${puntuacion >= star ? "text-black" : "text-gray-400"}`}
                            onClick={() => setPuntuacion(star)}
                        >
                            ★
                        </button>
                    ))}
                </div>

                <label className="block text-lg font-semibold mt-4 mb-2">{captchaQuestion}</label>
                <input
                    type="number"
                    className="w-full p-3 border border-gray-300 rounded-md bg-yellow-100"
                    value={captcha}
                    onChange={(e) => setCaptcha(e.target.value)}
                    required
                />

                {error && <p className="text-red-500 mt-4">{error}</p>}
                {success && <p className="text-green-500 mt-4">{success}</p>}

                <button type="submit" className="w-full mt-6 bg-black text-yellow-400 px-6 py-3 font-bold rounded-md hover:bg-gray-800 transition">
                    ENVIAR ➢
                </button>
            </form>
        </div>
    );
};

export default FeedbackForm;
