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
  Star
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

// --- Trackers ---
const trackWhatsAppClick = () => {
  if (typeof gtag === "function") {
    gtag("event", "conversion", {
      send_to: "AW-17529712870/M7-iCN_HtZUbEObh6KZB",
    });
    console.log("Conversión de clic en WhatsApp (Header) enviada.");
  }
};

// --- Menu Items Data ---
const MENU_ITEMS = [
  { label: "Inicio", href: "#inicio", icon: Star },
  { label: "Servicios", href: "#servicios", icon: Briefcase },
  { label: "Destinos", href: "#destinos", icon: MapPin },
  { label: "Tours", href: "#tours", icon: Calendar },
  { label: "Temporada", href: "#destacados", icon: Star },
  { label: "Fletes", href: "/#fletes", external: true, icon: Briefcase },
  { label: "Consultar Reserva", href: "#consultar-reserva", highlight: true, icon: Calendar },
  { label: "Pagar con Código", href: "#pagar-con-codigo", highlight: true, icon: Briefcase },
  { label: "Contacto", href: "#contacto", icon: Phone },
];

function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const { scrollY } = useScroll();

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
    <motion.header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b border-transparent",
        isScrolled
          ? "bg-white/90 backdrop-blur-md shadow-sm border-gray-200/50 py-1 md:py-2"
          : "bg-white/80 backdrop-blur-sm py-2 md:py-4"
      )}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex justify-between items-center">

          {/* LOGO SECTION */}
          <div className="flex items-center gap-4 relative z-50">
            <motion.img
              src={logo}
              alt="Transportes Araucaria"
              className={cn(
                "transition-all duration-300 object-contain",
                isScrolled ? "h-12 md:h-16" : "h-14 md:h-20 lg:h-24"
              )}
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
                  item.highlight
                    ? "text-primary hover:text-primary-foreground hover:bg-primary/10"
                    : "text-gray-600 hover:text-primary"
                )}
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

              <motion.a
                href="https://wa.me/56936643540"
                target="_blank"
                rel="noopener noreferrer"
                onClick={trackWhatsAppClick}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button className="bg-green-600 hover:bg-green-700 text-white rounded-full px-6 shadow-lg shadow-green-600/20">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  WhatsApp
                </Button>
              </motion.a>
            </motion.div>
          </nav>

          {/* MOBILE MENU TRIGGER */}
          <div className="xl:hidden flex items-center gap-4">
            <a
              href="https://wa.me/56936643540"
              target="_blank"
              rel="noopener noreferrer"
              onClick={trackWhatsAppClick}
              className="md:hidden"
            >
              <Button size="icon" className="bg-green-600 hover:bg-green-700 rounded-full h-10 w-10 shadow-md">
                <MessageCircle className="w-5 h-5 text-white" />
              </Button>
            </a>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-12 w-12 rounded-full hover:bg-gray-100">
                  <Menu className="w-7 h-7 text-gray-800" />
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
                            "flex items-center gap-4 px-4 py-3 rounded-xl text-base font-medium transition-all duration-200",
                            item.highlight
                              ? "bg-primary/5 text-primary hover:bg-primary/10"
                              : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:translate-x-1"
                          )}
                        >
                          <div className={cn(
                            "p-2 rounded-lg",
                            item.highlight ? "bg-primary/10 text-primary" : "bg-gray-100 text-gray-500"
                          )}>
                            <item.icon className="w-5 h-5" />
                          </div>
                          {item.label}
                        </motion.a>
                      </SheetClose>
                    ))}
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

                  <a
                    href="https://wa.me/56936643540"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={trackWhatsAppClick}
                    className="flex items-center justify-center w-full gap-2 p-3 rounded-xl bg-green-600 text-white font-medium hover:bg-green-700 shadow-lg shadow-green-600/20 transition-all"
                  >
                    <MessageCircle className="w-5 h-5" />
                    Chatear por WhatsApp
                  </a>
                </div>

              </SheetContent>
            </Sheet>
          </div>

        </div>
      </div>
    </motion.header>
  );
}

export default Header;
