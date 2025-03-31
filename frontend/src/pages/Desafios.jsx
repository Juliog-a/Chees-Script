import { useEffect, useState } from "react";
import FiltroCategorias from "../components/FiltroCategorias";
import DesafioCard from "../components/DesafioCard";
import axios from "axios";
import API from "../api/api";

export default function Desafios() {
    const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("Todas");
    const [dificultadSeleccionada, setDificultadSeleccionada] = useState("Todas");
    const [desafios, setDesafios] = useState([]);
    const [mostrarFavoritos, setMostrarFavoritos] = useState(false);
    const [error, setError] = useState("");

    const token = localStorage.getItem("accessToken");

    const cargarDesafios = () => {
        const url = mostrarFavoritos
            ? "/desafios/mis_favoritos/"
            : "/desafios/";

        API.get(url, {
            headers: { Authorization: `Bearer ${token}` }
        })
        .then(response => setDesafios(response.data))
        .catch(error => console.error("Error al obtener desafíos:", error));
    };

    useEffect(() => {
        cargarDesafios();
    }, [mostrarFavoritos]);

    return (
        <div className="w-screen min-h-screen flex flex-col bg-white text-black px-4 pt-24 overflow-x-hidden">
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
      
          <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10 place-items-center w-full mt-8">
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
