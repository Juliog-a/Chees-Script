import { useState } from "react";

const FiltroCategorias = ({ 
    categoriaSeleccionada, 
    setCategoriaSeleccionada, 
    dificultadSeleccionada, 
    setDificultadSeleccionada,
    setMostrarFavoritos,
    mostrarFavoritos
}) => {
    const [mostrarTematicas, setMostrarTematicas] = useState(false);

    const dificultades = ["Todas", "Principiante", "Intermedio", "Avanzado", "Experto"];
    const categorias = [
        "Cifrado", "XSS", "Inyección SQL", "Ejecución de Código", 
        "Path Traversal", "Denegación de Servicio", "Manipulación de Estado del Cliente", 
        "XSRF", "XSSI", "Vulnerabilidades de Configuración", "Ajax","Depuración ", "Todas"
    ];

    return (
<div className="w-full flex flex-col md:flex-row items-center justify-center md:justify-around mb-6 flex-wrap gap-x-4">
            <div className="flex flex-wrap gap-4">
                {dificultades.map((nivel) => (
                    <button
                        key={nivel}
                        onClick={() => setDificultadSeleccionada(nivel)}
                        className={`px-4 py-2 rounded-md font-semibold transition ${
                            dificultadSeleccionada === nivel ? "bg-yellow-400 text-black" : "bg-black text-yellow-400 hover:bg-gray-800"
                        }`}
                    >
                        {nivel}
                    </button>
                ))}
            </div>
            <div className="flex gap-4 mt-6 md:mt-0">
                <button
                    onClick={() => setMostrarFavoritos(!mostrarFavoritos)}
                    className={`px-4 py-2 rounded-md font-semibold transition ${
                        mostrarFavoritos ? "bg-yellow-400 text-black" : "bg-black text-yellow-400 hover:bg-gray-800"
                    }`}
                >
                    ❤️ Favoritos
                </button>
                <div className="relative">
                    <button 
                        onClick={() => setMostrarTematicas(!mostrarTematicas)} 
                        className="px-4 py-2 rounded-md font-semibold bg-black text-yellow-400 hover:bg-gray-800 transition"
                    >
                        
                        ☰ Temáticas
                    </button>

                    {mostrarTematicas && (
                        <div className="absolute right-0 mt-2 w-48 bg-white border rounded-md shadow-lg z-50">
                            {categorias.map((categoria) => (
                                <button
                                    key={categoria}
                                    onClick={() => {
                                        setCategoriaSeleccionada(categoria);
                                        setMostrarTematicas(false);
                                    }}
                                    className="block w-full text-left px-4 py-2 text-sm text-black hover:bg-yellow-200"
                                >
                                    {categoria}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FiltroCategorias;
