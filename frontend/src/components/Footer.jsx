import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-black text-white py-6 mt-10">
      <div className="w-full max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between px-6 text-center md:text-left">
        <div>
          <h3 className="text-xl font-bold">Chees Script</h3>
          <p className="text-sm mt-1">
            Diviértete aprendiendo
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <h4 className="text-lg font-semibold">Contacto</h4>
          <p className="text-sm"></p>
          <p className="text-sm">📍 Sevilla, España</p>
        </div>
        <div className="mt-4 md:mt-0">
          <h4 className="text-lg font-semibold">Información</h4>
          <Link to="/terminos" className="text-yellow-400 hover:underline text-sm block">
            Términos y condiciones
          </Link>
          <Link to="/politica" className="text-yellow-400 hover:underline text-sm block">
            Política de privacidad
          </Link>
          <Link to="/contacto" className="text-yellow-400 hover:underline text-sm block">
            Contacto
          </Link>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
