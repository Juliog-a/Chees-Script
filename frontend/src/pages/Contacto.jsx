import { Link } from "react-router-dom";

export default function Contacto() {
  return (
    <div className="w-screen min-h-screen flex flex-col bg-white text-black">
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-[700px] text-center">
          <h1 className="text-3xl md:text-5xl font-bold">¿Necesitas ayuda?</h1>
          <div className="mt-6 text-lg md:text-xl space-y-3">
            <p>📞 Teléfono: (+34) 6XX 7X 5X 8X</p>
            <p>📧 Correo de contacto: <span className="font-semibold">cheesscript@gmail.com</span></p>
            <p>📘 Facebook: <span className="font-semibold">CheeseandoelScript</span></p>
            <p>📸 Instagram: <span className="font-semibold">CheeseandoelScript</span></p>
          </div>
          <div className="mt-8">
            <Link
              to="/formulario-contacto" data-testid="form-button"
              className="bg-black text-yellow-400 px-6 py-3 text-lg font-bold rounded-md hover:bg-gray-800 transition"
            >
              Formulario de contacto
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
