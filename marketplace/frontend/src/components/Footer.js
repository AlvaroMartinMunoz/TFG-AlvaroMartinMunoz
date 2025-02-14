import React from "react";
import "../App.css";

const Footer = () => {
  return (
    <div className="footer">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-around",
          width: "100%",
        }}
      >
        <div style={{ marginBottom: "-15px" }}>
          {" "}
          <p
            style={{
              color: "black",
              fontWeight: "bold",
              fontSize: "1.25 rem",
              marginLeft: "80px",
              marginTop: "-20px",
              position: "absolute",
            }}
          >
            Ayuda
          </p>
          <a
            href="/"
            style={{
              marginLeft: "80px",
              color: "grey",
              textDecoration: "none",
            }}
          >
            Contacta con nosotros
          </a>
        </div>
        <div style={{ marginBottom: "-15px" }}>
          {" "}
          <p
            style={{
              color: "black",
              fontWeight: "bold",
              fontSize: "1.25 rem",
              marginLeft: "150px",
              marginTop: "-20px",
              position: "absolute",
            }}
          >
            Políticas
          </p>
          <a
            href="/"
            style={{
              marginLeft: "150px",
              color: "grey",
              textDecoration: "none",
            }}
          >
            Terminos y condiciones
          </a>
        </div>
        <div style={{ marginBottom: "-15px", marginRight: "100px" }}>
          {" "}
          <p
            style={{
              color: "black",
              fontWeight: "bold",
              fontSize: "1.25 rem",
              marginLeft: "180px",
              marginTop: "-20px",
              position: "absolute",
            }}
          >
            Más Información
          </p>
          <a
            href="/"
            style={{
              marginLeft: "180px",
              color: "grey",
              textDecoration: "none",
            }}
          >
            Sobre nosotros
          </a>
        </div>
      </div>
    </div>
  );
};

export default Footer;
