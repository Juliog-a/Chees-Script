import { Link } from "react-router-dom";

export default function Terminos() {
  return (
    <div className="w-screen min-h-screen flex flex-col bg-white text-black">
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-[700px] text-center">
          <h1 className="text-3xl md:text-5xl font-bold">
            Términos y Condiciones
          </h1>
          <div className="mt-6 text-lg md:text-xl space-y-4 text-left">
            <p>
              ¡Bienvenido a <strong>Chees Script</strong>! Al acceder o utilizar
              nuestra plataforma, aceptas cumplir con los siguientes términos y
              condiciones, diseñados para garantizar un entorno seguro,
              responsable y confiable para todos los usuarios.
            </p>
            <p>
              <strong>1. Uso adecuado:</strong> El contenido y los recursos de{" "}
              <strong>Chees Script</strong> están destinados exclusivamente a
              fines educativos y de aprendizaje. No debes utilizar nuestro sitio
              para realizar actividades ilícitas o que atenten contra la
              integridad de la plataforma o de otros usuarios.
            </p>
            <p>
              <strong>2. Propiedad intelectual:</strong> Todos los desafíos,
              textos, gráficos y recursos publicados en la plataforma son
              propiedad de <strong>Chees Script</strong> o están compartidos con
              la debida autorización. No se permite copiar, distribuir o
              modificar el contenido sin consentimiento previo por escrito.
            </p>
            <p>
              <strong>3. Privacidad:</strong> Respetamos tu privacidad y
              protegemos tus datos personales conforme a nuestra{" "}
              <Link to="/politica" className="underline hover:text-blue-500">
                Política de Privacidad
              </Link>
              . No compartimos tu información con terceros sin tu consentimiento
              expreso.
            </p>
            <p>
              <strong>4. Acceso y disponibilidad:</strong> Nos esforzamos por
              mantener la plataforma en funcionamiento continuo. Sin embargo, no
              garantizamos la ausencia de interrupciones, errores o caídas del
              sistema.
            </p>
            <p>
              <strong>5. Responsabilidad del usuario:</strong> Eres responsable
              de salvaguardar tu contraseña y de todas las actividades que se
              realicen bajo tu cuenta. Si detectas un uso no autorizado,
              notifícanos de inmediato.
            </p>
            <p>
              <strong>6. Modificaciones:</strong> Estos términos pueden ser
              actualizados ocasionalmente. Publicaremos las revisiones en esta
              sección y, si son cambios sustanciales, lo notificaremos en el 
              inicio de la página.
            </p>
            <p>
              <strong>7. Contacto:</strong> Si tienes dudas, preguntas o
              sugerencias sobre estos Términos y Condiciones, escríbenos a{" "}
              <span className="font-semibold">cheesscript@gmail.com</span> o accede a
              nuestro apartado de   {" "}            
              <Link to="/contacto" className="underline hover:text-blue-500">
                Contacto
              </Link>
              .{" "}¡Estaremos encantados de ayudarte!
            </p>
          </div>
          <div className="mt-8 mb-10">
            <Link
              to="/"
              className="bg-black text-yellow-400 px-6 py-3 text-lg font-bold rounded-md hover:bg-gray-800 transition"
            >
              Volver al Inicio
            </Link>
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
