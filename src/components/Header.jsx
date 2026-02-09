/* global gtag */
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Phone,
  MessageCircle,
  RotateCcw,
  Menu,
  X,
  MapPin,
  Calendar,
  Briefcase,
  Star,
  Sparkles
} from "lucide-react";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "framer-motion";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import logo from "../assets/logo.png";
import { cn } from "@/lib/utils";
import WhatsAppInterceptModal from "./WhatsAppInterceptModal";
import { usePricingData } from "../hooks/usePricingData";

// --- Trackers ---
const trackWhatsAppClick = () => {
  if (typeof gtag === "function") {
    gtag("event", "conversion", {
      send_to: "AW-17529712870/M7-iCN_HtZUbEObh6KZB",
    });
  }
};

// --- Menu Items Data ---
const MENU_ITEMS = [
  { label: "Inicio", href: "#inicio", icon: Star },
  { label: "Servicios", href: "#servicios", icon: Briefcase },
  { label: "Destinos", href: "#destinos", icon: MapPin },
  { label: "Tours", href: "#tours", icon: Calendar },
  { label: "Temporada", href: "#destacados", icon: Star },
  { label: "🔥 Oportunidades", href: "#oportunidades", special: true, icon: Sparkles },
  { label: "Fletes", href: "/#fletes", external: true, icon: Briefcase },
  { label: "Consultar Reserva", href: "#consultar-reserva", highlight: true, icon: Calendar },
  { label: "Pagar con Código", href: "#pagar-con-codigo", highlight: true, icon: Briefcase },
  { label: "Contacto", href: "#contacto", icon: Phone },
];

function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [whatsappInterceptEnabled, setWhatsappInterceptEnabled] = useState(true);
  const { scrollY } = useScroll();
  const { discountOnline } = usePricingData();

  // Cargar configuración de modal WhatsApp al montar
  useEffect(() => {
    const cargarConfiguracion = async () => {
      try {
        // Intentar obtener de localStorage primero (caché)
        const cachedValue = localStorage.getItem("whatsapp_intercept_activo");
        if (cachedValue !== null) {
          setWhatsappInterceptEnabled(cachedValue === "true");
        }

        // Consultar al backend para tener el valor más actualizado
        const response = await fetch(
          `${import.meta.env.VITE_API_URL || "http://localhost:3001"}/api/configuracion/whatsapp-intercept`
        );

        if (response.ok) {
          const data = await response.json();
          setWhatsappInterceptEnabled(data.activo);
          // Actualizar caché
          localStorage.setItem("whatsapp_intercept_activo", data.activo.toString());
        }
      } catch (error) {
        console.error("Error cargando configuración WhatsApp intercept:", error);
        // En caso de error, mantener valor por defecto o del caché
      }
    };

    cargarConfiguracion();
  }, []);

  // Detectar scroll para cambiar estilo
  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious() || 0;
    if (latest > 50 && !isScrolled) {
      setIsScrolled(true);
    } else if (latest <= 50 && isScrolled) {
      setIsScrolled(false);
    }
  });

  const handleUpdatePricing = async () => {
    setIsUpdating(true);
    try {
      if (window.recargarDatosPrecios) {
        await window.recargarDatosPrecios();
        console.log("✅ Precios actualizados manualmente");
      } else {
        window.location.reload();
      }
    } catch (error) {
      console.error("Error al actualizar precios:", error);
    } finally {
      setTimeout(() => setIsUpdating(false), 1000);
    }
  };

  // Handlers para modal de intercepción
  const handleWhatsAppClick = (e) => {
    e.preventDefault();
    trackWhatsAppClick();
    
    // Si el modal está desactivado, abrir WhatsApp directamente
    if (!whatsappInterceptEnabled) {
      window.open("https://wa.me/56936643540", "_blank", "noopener,noreferrer");
      return;
    }
    
    // Si está activado, mostrar el modal
    setShowModal(true);
  };

  const handleReserveFromModal = () => {
    setShowModal(false);
    // Scroll a la sección de reservas
    const reservaSection = document.querySelector("#inicio");
    if (reservaSection) {
      reservaSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  // Variantes para animaciones
  const navItemVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.05,
        duration: 0.3,
        type: "spring",
        stiffness: 300
      }
    })
  };

  const mobileItemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: (i) => ({
      opacity: 1,
      x: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.4,
        ease: "easeOut"
      }
    })
  };

  return (
    <>
    <motion.header
                className={cn(
                  "relative px-4 py-2 text-sm font-medium rounded-full transition-colors group",
                  item.special
                    ? "text-yellow-600 hover:text-yellow-700 bg-yellow-50 hover:bg-yellow-100 font-bold"
                    : item.highlight
                    ? "text-primary hover:text-primary-foreground hover:bg-primary/10"
                    : "text-gray-600 hover:text-primary"
                )
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="container mx-auto px-4 md:px-6 relative">
        <div className="flex justify-between items-center">

          {/* LOGO SECTION */}
          <div className="flex items-center gap-4 relative z-50">
            <motion.img
              src={logo}
              alt="Transportes Araucaria"
                className={cn(
                  "relative px-4 py-2 text-sm font-medium rounded-full transition-colors group",
                  item.special
                    ? "text-yellow-600 hover:text-yellow-700 bg-yellow-50 hover:bg-yellow-100 font-bold"
                    : item.highlight
                    ? "text-primary hover:text-primary-foreground hover:bg-primary/10"
                    : "text-gray-600 hover:text-primary"
                )
              layout
            />

            {/* Hidden Update Button */}
            <button
              onClick={handleUpdatePricing}
              disabled={isUpdating}
              className="opacity-0 hover:opacity-100 focus:opacity-100 transition-opacity p-2 rounded-full hover:bg-gray-100 text-gray-400 absolute -right-8 top-1/2 -translate-y-1/2"
              title="Actualizar precios (Ctrl+Shift+U)"
            >
              <RotateCcw size={16} className={isUpdating ? "animate-spin" : ""} />
            </button>
          </div>

          {/* DESKTOP NAVIGATION */}
          <nav className="hidden xl:flex items-center space-x-1">
            {MENU_ITEMS.map((item, i) => (
              <motion.a
                key={item.href}
                href={item.href}
                custom={i}
                initial="hidden"
                animate="visible"
                variants={navItemVariants}
                className={cn(
                  "relative px-4 py-2 text-sm font-medium rounded-full transition-colors group",
                  item.special
                    ? "text-yellow-600 hover:text-yellow-700 bg-yellow-50 hover:bg-yellow-100 font-bold"
                    : item.highlight
                    ? "text-primary hover:text-primary-foreground hover:bg-primary/10"
                    : "text-gray-600 hover:text-primary"
                )
              >
                {/* Pill Hover Effect Background */}
                <span className="absolute inset-0 rounded-full bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity duration-200 -z-10 scale-90 group-hover:scale-100" />

                <span className="relative z-10 flex items-center gap-2">
                  {item.label}
                </span>
              </motion.a>
            ))}

            {/* CTA Buttons */}
            <motion.div
              className="flex items-center space-x-3 ml-4 pl-4 border-l border-gray-200"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <a href="tel:+56936643540" className="text-gray-600 hover:text-primary transition-colors p-2 rounded-full hover:bg-gray-50" title="Llamar ahora">
                <Phone className="w-5 h-5" />
              </a>

              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button 
                  onClick={handleWhatsAppClick}
                  className="bg-green-600 hover:bg-green-700 text-white rounded-full px-6 shadow-lg shadow-green-600/20"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  WhatsApp
                </Button>
              </motion.div>
            </motion.div>
          </nav>

          {/* MOBILE MENU TRIGGER */}
          <div className="xl:hidden flex items-center gap-4">
            <Button 
              size="icon" 
              onClick={handleWhatsAppClick}
              className="md:hidden bg-green-600 hover:bg-green-700 rounded-full h-10 w-10 shadow-md"
            >
              <MessageCircle className="w-5 h-5 text-white" />
            </Button>

            <Sheet>
              <SheetTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                className={cn(
                  "relative px-4 py-2 text-sm font-medium rounded-full transition-colors group",
                  item.special
                    ? "text-yellow-600 hover:text-yellow-700 bg-yellow-50 hover:bg-yellow-100 font-bold"
                    : item.highlight
                    ? "text-primary hover:text-primary-foreground hover:bg-primary/10"
                    : "text-gray-600 hover:text-primary"
                )
                >
                  <Menu className="w-7 h-7" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px] p-0 flex flex-col border-l-0 shadow-2xl">

                {/* Mobile Header */}
                <div className="p-6 border-b bg-gray-50/50 backdrop-blur-sm">
                  <SheetTitle className="text-left text-xl font-bold flex items-center gap-2 text-primary">
                    <img src={logo} alt="Logo" className="h-10 w-auto" />
                    Menú
                  </SheetTitle>
                </div>

                {/* Mobile Nav Links */}
                <div className="flex-1 overflow-y-auto py-6 px-4">
                  <nav className="flex flex-col space-y-2">
                    {MENU_ITEMS.map((item, i) => (
                      <SheetClose key={item.href} asChild>
                        <motion.a
                          href={item.href}
                          custom={i}
                          initial="hidden"
                          animate="visible"
                          variants={mobileItemVariants}
                className={cn(
                  "relative px-4 py-2 text-sm font-medium rounded-full transition-colors group",
                  item.special
                    ? "text-yellow-600 hover:text-yellow-700 bg-yellow-50 hover:bg-yellow-100 font-bold"
                    : item.highlight
                    ? "text-primary hover:text-primary-foreground hover:bg-primary/10"
                    : "text-gray-600 hover:text-primary"
                )
                        >
                className={cn(
                  "relative px-4 py-2 text-sm font-medium rounded-full transition-colors group",
                  item.special
                    ? "text-yellow-600 hover:text-yellow-700 bg-yellow-50 hover:bg-yellow-100 font-bold"
                    : item.highlight
                    ? "text-primary hover:text-primary-foreground hover:bg-primary/10"
                    : "text-gray-600 hover:text-primary"
                )
                  </nav>
                </div>

                {/* Mobile Footer Actions */}
                <div className="p-6 border-t bg-gray-50 space-y-3">
                  <a
                    href="tel:+56936643540"
                    className="flex items-center justify-center w-full gap-2 p-3 rounded-xl border border-gray-200 bg-white text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                  >
                    <Phone className="w-4 h-4" />
                    +56 9 3664 3540
                  </a>

                  <button
                    onClick={handleWhatsAppClick}
                    className="flex items-center justify-center w-full gap-2 p-3 rounded-xl bg-green-600 text-white font-medium hover:bg-green-700 shadow-lg shadow-green-600/20 transition-all"
                  >
                    <MessageCircle className="w-5 h-5" />
                    Chatear por WhatsApp
                  </button>
                </div>

              </SheetContent>
            </Sheet>
          </div>

        </div>
      </div>

      </motion.header>

      {/* Modal de Intercepción WhatsApp - Fuera del header para evitar problemas de stacking context por transform */}
      <WhatsAppInterceptModal
        isOpen={showModal}
        onClose={handleCloseModal}
        onReserve={handleReserveFromModal}
        discountData={discountOnline}
      />
    </>
  );
}

export default Header;
