import { useEffect, useState } from "react";
import FiltroCategorias from "../components/FiltroCategorias";
import DesafioCard from "../components/DesafioCard";
import axios from "axios";

export default function Desafios() {
    const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("Todas");
    const [dificultadSeleccionada, setDificultadSeleccionada] = useState("Todas");
    const [desafios, setDesafios] = useState([]);
    const [mostrarFavoritos, setMostrarFavoritos] = useState(false);
    const [error, setError] = useState("");

    const token = localStorage.getItem("accessToken");

    const cargarDesafios = () => {
        const url = mostrarFavoritos
            ? "http://localhost:8000/api/desafios/mis_favoritos/"
            : "http://localhost:8000/api/desafios/";

        axios.get(url, {
            headers: { Authorization: `Bearer ${token}` }
        })
        .then(response => setDesafios(response.data))
        .catch(error => console.error("Error al obtener desafíos:", error));
    };

    useEffect(() => {
        cargarDesafios();
    }, [mostrarFavoritos]);  // Se actualiza cada vez que se pulsa el filtro de favoritos

    return (
        <div className="w-screen min-h-screen flex flex-col bg-white text-black p-6 overflow-x-hidden" style={{ paddingLeft: "5px" }}>
            <h1 className="text-3xl md:text-5xl font-bold text-center mb-8">Lista de Desafíos</h1>
            {error && <p className="text-red-600 text-center">{error}</p>}
    
            <FiltroCategorias 
                categoriaSeleccionada={categoriaSeleccionada} 
                setCategoriaSeleccionada={setCategoriaSeleccionada}
                dificultadSeleccionada={dificultadSeleccionada} 
                setDificultadSeleccionada={setDificultadSeleccionada} 
                mostrarFavoritos={mostrarFavoritos}
                setMostrarFavoritos={setMostrarFavoritos}
            />
    
            <div className="grid justify-center"
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(500px, 1fr))",
                    gap: "40px",
                    placeItems: "center"
                }}
            >
                {desafios
                    .filter(d => 
                        (categoriaSeleccionada === "Todas" || d.tematica === categoriaSeleccionada) &&
                        (dificultadSeleccionada === "Todas" || d.nivel_dificultad === dificultadSeleccionada)
                    )
                    .map((desafio) => (
                        <DesafioCard key={desafio.id} desafio={desafio} recargarDesafios={cargarDesafios} />
                    ))}
            </div>
        </div>
    );
}
