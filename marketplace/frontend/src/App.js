import "./App.css";
import Navbar from "./components/NavBar";
import fondo from "./assets/fondo3.jpeg";

function App() {
  return (
    <div
      className="App"
      style={{
        backgroundImage: `url(${fondo})`,
        backgroundSize: "cover",
        backgroundPosition: "top center",
        margin: 0,
        minHeight: "100vh",
        backdropFilter: "blur(50px)",
      }}
    >
      <Navbar />
    </div>
  );
}

export default App;
