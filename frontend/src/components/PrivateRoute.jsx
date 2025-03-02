import { useContext } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { AuthContext } from "../utils/AuthContext";

const PrivateRoute = () => {
    const { isAuthenticated } = useContext(AuthContext);

    console.log("PrivateRoute - Estado de autenticación:", isAuthenticated);

    if (isAuthenticated === null) {
        return null; // No renderiza nada hasta que se determine la autenticación
    }

    return isAuthenticated ? <Outlet /> : <Navigate to="/login" />;
};

export default PrivateRoute;
