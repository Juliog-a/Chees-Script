import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./utils/AuthContext.jsx";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Perfil from "./pages/Perfil";
import PrivateRoute from "./components/PrivateRoute";
import Terminos from "./pages/Terminos";
import Politica from "./pages/Politica";
import Contacto from "./pages/Contacto";
import Blog from "./pages/Blog";
import FormularioContacto from "./pages/FormularioContacto.jsx";
import Desafios from "./pages/Desafios.jsx";
import FeedbackForm from "./pages/FeedbackForm";
import DesafioPage from "./components/DesafioPage";
import TeoriaPage from "./components/TeoriaPage";
import PistasPage from "./components/PistasPage";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./index.css";

const MainApp = () => {
    return (
        <BrowserRouter>
            <AuthProvider>
                <Navbar />
                <Routes>
                    {/* Rutas Públicas */}
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />

                    {/* Rutas Privadas protegidas por PrivateRoute */}
                    <Route element={<PrivateRoute />}>
                        <Route path="/perfil" element={<Perfil />} />
                        <Route path="/desafios" element={<Desafios />} />
                        <Route path="/terminos" element={<Terminos />} />
                        <Route path="/politica" element={<Politica />} />
                        <Route path="/contacto" element={<Contacto />} />
                        <Route path="/formulario-contacto" element={<FormularioContacto />} />
                        <Route path="/feedback/:desafioId" element={<FeedbackForm />} />
                        <Route path="/blog" element={<Blog />} />
                        <Route path="/teoria/:id" element={<TeoriaPage />} />
                        <Route path="/pistas/:id" element={<PistasPage />} />
                        <Route path="/desafio/:id" element={<DesafioPage />} />
                    </Route>

                    {/* Redirección para rutas no existentes */}
                    <Route path="*" element={<Navigate to="/" />} />
                </Routes>
                <Footer />
            </AuthProvider>
        </BrowserRouter>
    );
};

// Renderizar la aplicación correctamente
ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        <MainApp />
        <ToastContainer position="top-right" autoClose={3000} />
    </React.StrictMode>
);
