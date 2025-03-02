import { Link } from "react-router-dom";

export default function Politica() {
  return (
    <div className="w-screen min-h-screen flex flex-col bg-white text-black">
      {/* Contenido Principal */}
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-[700px] text-center">
          {/* Título */}
          <h1 className="text-3xl md:text-5xl font-bold">Política de Privacidad</h1>

          {/* Contenido */}
          <div className="mt-6 text-lg md:text-xl space-y-4 text-left">
            <p>
              En <strong>Chees Script</strong>, tu privacidad es esencial. Trabajamos
              continuamente para proteger tu información y fomentar un uso responsable
              de nuestros servicios.
            </p>

            <p>
              🔍 <strong>Recopilación de datos:</strong> Solo solicitamos la
              información estrictamente necesaria para mejorar tu experiencia y
              brindarte todas las funciones que ofrecemos.
            </p>

            <p>
              🔒 <strong>Uso de datos:</strong> Tus datos personales nunca se
              compartirán con terceros sin tu autorización explícita. Todo lo que
              nos facilitas se almacena de forma segura y cifrada.
            </p>

            <p>
              🍪 <strong>Cookies:</strong> Empleamos cookies para optimizar tu
              navegación y personalizar tu experiencia en la plataforma. Puedes
              rechazarlas o gestionarlas en cualquier momento, sin que eso afecte
              tu acceso a las funcionalidades de <strong>Chees Script</strong>.
            </p>

            <p>
              🛡️ <strong>Seguridad:</strong> Implementamos protocolos
              robustos de protección y cifrado para salvaguardar tu información.
              Nuestro objetivo es que disfrutes de una experiencia segura y confiable.
            </p>

            <p>
              📩 <strong>7. Contacto:</strong> Si tienes dudas, preguntas o
              sugerencias sobre estos Términos y Condiciones, escríbenos a{" "}
              <span className="font-semibold">cheesscript@gmail.com</span> o accede a
              nuestro apartado de   {" "}            
              <Link to="/contacto" className="underline hover:text-blue-500">
                Contacto
              </Link>
              .{" "}¡Estaremos encantados de ayudarte!
            </p>
          </div>

          {/* Botón de regreso */}
          <div className="mt-8">
            <Link
              to="/"
              className="bg-black text-yellow-400 px-6 py-3 text-lg font-bold rounded-md hover:bg-gray-800 transition"
            >
              Volver al Inicio
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
