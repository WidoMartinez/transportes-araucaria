import "./App.css";

import Header from "./components/Header";
import Hero from "./components/Hero";
import Servicios from "./components/Servicios";
import Destinos from "./components/Destinos";
import Destacados from "./components/Destacados";
import PorQueElegirnos from "./components/PorQueElegirnos";
import Testimonios from "./components/Testimonios";
import Contacto from "./components/Contacto";
import Footer from "./components/Footer";
import Fidelizacion from "./components/Fidelizacion";
import ReservaWizard from "./components/ReservaWizard";

import temucoImg from "./assets/temuco.jpg";
import villarricaImg from "./assets/villarrica.jpg";
import puconImg from "./assets/pucon.jpg";
import corralcoImg from "./assets/corralco.jpg";

const destinos = [
        {
                nombre: "Temuco",
                descripcion: "Centro comercial y administrativo de La Araucanía.",
                tiempo: "45 min",
                imagen: temucoImg,
                maxPasajeros: 4,
                minHorasAnticipacion: 5,
                precios: {
                        auto: { base: 15000, porcentajeAdicional: 0.1 },
                },
        },
        {
                nombre: "Villarrica",
                descripcion: "Turismo y naturaleza junto al lago.",
                tiempo: "1h 15min",
                imagen: villarricaImg,
                maxPasajeros: 7,
                minHorasAnticipacion: 5,
                precios: {
                        auto: { base: 40000, porcentajeAdicional: 0.05 },
                        van: { base: 200000, porcentajeAdicional: 0.05 },
                },
        },
        {
                nombre: "Pucón",
                descripcion: "Aventura, termas y volcán.",
                tiempo: "1h 30min",
                imagen: puconImg,
                maxPasajeros: 7,
                minHorasAnticipacion: 5,
                precios: {
                        auto: { base: 50000, porcentajeAdicional: 0.05 },
                        van: { base: 250000, porcentajeAdicional: 0.05 },
                },
        },
];

const destacadosData = [
        {
                nombre: "Corralco",
                titulo: "Visita Corralco en Temporada de Nieve",
                subtitulo: "Una Aventura Invernal Inolvidable",
                descripcion:
                        "Disfruta de la majestuosa nieve en el centro de ski Corralco, a los pies del volcán Lonquimay. Ofrecemos traslados directos y seguros para que solo te preocupes de disfrutar las pistas y los paisajes.",
                imagen: corralcoImg,
        },
];

function App() {
        return (
                <ReservaWizard destinos={destinos}>
                        <div className="min-h-screen bg-background text-foreground">
                                <Header />

                                <main>
                                        <Hero destinos={destinos} />
                                        <Servicios />
                                        <Destinos destinos={destinos} />
                                        <Destacados destinos={destacadosData} />
                                        <Fidelizacion />
                                        <PorQueElegirnos />
                                        <Testimonios />
                                        <Contacto />
                                </main>

                                <Footer />
                        </div>
                </ReservaWizard>
        );
}

export default App;
