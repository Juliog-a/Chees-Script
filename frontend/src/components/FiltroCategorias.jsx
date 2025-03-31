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
    const [mostrarFiltros, setMostrarFiltros] = useState(false);

    const dificultades = ["Todas", "Principiante", "Intermedio", "Avanzado", "Experto"];
    const categorias = [
        "Cifrado", "XSS", "Inyección SQL", "Ejecución de Código", 
        "Path Traversal", "Denegación de Servicio", "Manipulación de Estado del Cliente", 
        "XSRF", "XSSI", "Vulnerabilidades de Configuración", "Ajax", "Depuración", "Todas"
    ];

    return (
        <div className="w-full max-w-[900px] mx-auto mb-6">
            <div className="flex justify-between items-center mb-4 md:hidden">
                <button
                    onClick={() => setMostrarFiltros(!mostrarFiltros)}
                    className="bg-black text-yellow-400 px-4 py-2 rounded-md hover:bg-gray-800"
                >
                    {mostrarFiltros ? "Ocultar Filtros" : "Mostrar Filtros"} 
                </button>
            </div>

            {/* Filtros visibles siempre en md+ o en móvil si están desplegados */}
            {(mostrarFiltros || window.innerWidth >= 768) && (
                <div className="flex flex-col md:flex-row items-center justify-center md:justify-around flex-wrap gap-4 text-sm md:text-base">
                    {/* Dificultad */}
                    <div className="flex flex-wrap justify-center gap-2">
                        {dificultades.map((nivel) => (
                            <button
                                key={nivel}
                                onClick={() => setDificultadSeleccionada(nivel)}
                                className={`px-4 py-2 rounded-md font-semibold transition ${
                                    dificultadSeleccionada === nivel 
                                        ? "bg-yellow-400 text-black" 
                                        : "bg-black text-yellow-400 hover:bg-gray-800"
                                }`}
                            >
                                {nivel}
                            </button>
                        ))}
                    </div>

                    {/* Favoritos y Temáticas */}
                    <div className="flex flex-wrap justify-center gap-2">
                        <button
                            onClick={() => setMostrarFavoritos(!mostrarFavoritos)}
                            className={`px-4 py-2 rounded-md font-semibold transition ${
                                mostrarFavoritos 
                                    ? "bg-yellow-400 text-black" 
                                    : "bg-black text-yellow-400 hover:bg-gray-800"
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
                                <div className="absolute right-0 mt-2 w-52 max-h-[300px] overflow-y-auto bg-yellow-50 text-black border border-yellow-300 rounded-md shadow-lg z-50">
                                    {categorias.map((categoria) => (
                                      <button
                                        key={categoria}
                                        onClick={() => {
                                          setCategoriaSeleccionada(categoria);
                                          setMostrarTematicas(false);
                                        }}
                                        className="block w-full text-left px-4 py-2 text-sm text-black bg-yellow-50 hover:bg-yellow-200 transition"
                                      >
                                        {categoria}
                                      </button>
                                    ))}
                                  </div>
                                )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FiltroCategorias;
