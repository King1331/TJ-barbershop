"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Acerca de Nosotros", href: "/#about" },
    { name: "Servicios", href: "/#services" },
    { name: "Productos", href: "/products" },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled
          ? "bg-black/95 backdrop-blur-md py-3"
          : "bg-transparent py-5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        {/* LOGO */}
        <Link href="/" className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full overflow-hidden border border-gray-800 bg-black flex items-center justify-center transition-transform duration-300 hover:scale-105">
            <img
              src="https://horizons-cdn.hostinger.com/a6ad88d3-3563-473a-998d-e3eef6ee6b67/d0bd8fc323f422f9945c04bfe237af97.png"
              alt="TJ's Cuts Logo"
              className="w-full h-full object-cover"
            />
          </div>
          <span className="text-white font-bold text-lg tracking-wide">
            TJ's Cuts Barbershop
          </span>
        </Link>

        {/* DESKTOP NAV */}
        <div className="hidden lg:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="text-gray-300 hover:text-amber-400 transition-colors duration-300 text-sm font-medium tracking-wider uppercase"
            >
              {link.name}
            </a>
          ))}

          {/* BOTÓN CUADRADO - DESKTOP */}
          <Link
            href="/book-appointment"
            className="
              bg-white text-black 
              px-6 py-2.5
              font-semibold text-sm tracking-wider uppercase 
              hover:bg-gray-100 
              transition-all duration-300 
              shadow-lg shadow-white/10
            "
          >
            Agende su cita
          </Link>
        </div>

        {/* MOBILE BUTTON */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden text-white p-2"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* MOBILE MENU */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-black/98 backdrop-blur-lg border-t border-white/10"
          >
            <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col gap-4">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-gray-300 hover:text-amber-400 transition-colors duration-300 text-sm font-medium tracking-wider uppercase py-2"
                >
                  {link.name}
                </a>
              ))}

              {/* BOTÓN CUADRADO - MOBILE */}
              <Link
                href="/book-appointment"
                onClick={() => setMobileMenuOpen(false)}
                className="
                  bg-white text-black 
                  px-6 py-3
                  font-semibold text-sm tracking-wider uppercase 
                  text-center mt-2
                "
              >
                Agende su cita
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
