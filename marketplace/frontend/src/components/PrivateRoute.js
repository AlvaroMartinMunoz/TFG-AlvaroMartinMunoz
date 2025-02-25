import React from "react";
import { Navigate } from "react-router-dom";


const PrivateRoute = ({ component: Component }) => {
    const isAuthenticated = !!localStorage.getItem("accessToken");
    return isAuthenticated ? <Component /> : <Navigate to="/inicio-de-sesion" />;
}
export default PrivateRoute;
