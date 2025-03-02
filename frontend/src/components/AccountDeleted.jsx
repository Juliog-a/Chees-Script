import { useState } from "react";

const AccountDeleted = ({ onConfirm }) => {
    const [confirmationText, setConfirmationText] = useState("");
    const [error, setError] = useState("");

    const handleDelete = () => { // Maneja el borrado del usuario
        if (confirmationText === "CONFIRMO") {
            localStorage.removeItem("accessToken"); // Borra el token de acceso
            onConfirm(true);
            window.location.reload(); // Recarga la página tras eliminación
        } else {
            setError("Debes escribir exactamente 'CONFIRMO' en mayúsculas para continuar.");
        }
    };

    return (
        <div className="fixed inset-0 flex items-start justify-center pt-60 bg-black bg-opacity-50 z-50">
            <div className="w-full max-w-xl bg-yellow-200 p-10 rounded-lg shadow-lg text-center">
                <h2 className="text-4xl md:text-5xl font-bold mb-8 text-red-600">⚠️ Advertencia ⚠️</h2>
                <p className="text-lg text-black font-semibold">
                    Estás a punto de eliminar tu cuenta **permanentemente**. Esta acción **no se puede deshacer**.
                </p>

                <p className="text-md text-gray-700 mt-9">
                    Para proceder, **escribe "CONFIRMO" en mayúsculas** en el cuadro de texto.
                </p>

                <input
                    type="text"
                    value={confirmationText}
                    onChange={(e) => {
                        setConfirmationText(e.target.value);
                        setError(""); // Limpia el error cuando el usuario escribe
                    }}
                    className="w-full p-2 mt-8 border border-gray-400 rounded-md text-center bg-white"
                    placeholder='Escribe "CONFIRMO" aquí'
                />

                {error && <p className="text-red-500 mt-2">{error}</p>}

                <div className="mt-6 flex justify-center gap-44">
                    <button
                        onClick={handleDelete}
                        className={`px-4 py-2 font-bold rounded-md transition ${
                            confirmationText === "CONFIRMO"
                                ? "bg-red-600 text-white hover:bg-red-800"
                                : "bg-gray-300 text-gray-500 cursor-not-allowed"
                        }`}
                        disabled={confirmationText !== "CONFIRMO"}
                    >
                        Confirmar Eliminación
                    </button>
                    <button
                        onClick={() => onConfirm(false)}
                        className="bg-gray-400 px-4 py-2 rounded-md text-black font-bold hover:bg-gray-500 transition"
                    >
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AccountDeleted;
