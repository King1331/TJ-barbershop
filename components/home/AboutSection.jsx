"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

const images = [
  "https://i.postimg.cc/vBTxsZwW/IMG-2971.jpg",
  "https://i.postimg.cc/8544y5mD/IMG-4516.avif",
  "https://i.postimg.cc/fyFxF0tQ/IMG-5167.avif",
  "https://i.postimg.cc/GtNkNsB6/IMG-5307.avif",
  "https://i.postimg.cc/j5cc854R/IMG-5130.avif",
  "https://i.postimg.cc/BvKQcPsb/IMG-4186.avif",
];

const HIGHLIGHTS = [
  { number: "5+", label: "Años de experiencia" },
  { number: "10K+", label: "Clientes satisfechos" },
  { number: "100%", label: "Productos premium" },
];

export default function AboutSection() {
  const [currentSlide, setCurrentSlide] = useState(0);

  /* ── auto-play ── */
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % images.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % images.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + images.length) % images.length);

  return (
    <section id="about" className="py-24 bg-[#0A0A0A]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">

          {/* ── TEXTO ── */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            {/* eyebrow */}
            <div>
              <span className="text-xs font-semibold tracking-[0.3em] uppercase text-gray-500 block mb-3">
                Acerca de nosotros
              </span>
              <h2 className="text-4xl md:text-5xl font-black text-white leading-tight">
                Bienvenido a{" "}
                <span className="relative inline-block">
                  TJ's Cuts
                  <span className="absolute -bottom-1 left-0 w-full h-[3px] bg-white rounded-full" />
                </span>
              </h2>
            </div>

            {/* párrafos */}
            <div className="space-y-4 text-gray-400 leading-relaxed text-[15px]">
              <p>
                TJ's Cuts Barbershop se enorgullece de ser líder en la industria del
                grooming masculino moderno — establecidos con la pasión de traer de vuelta
                la barbería tradicional donde la <span className="text-white font-medium">calidad, no la cantidad</span>, es lo primordial.
              </p>
              <p>
                En un ambiente amigable y relajado, ofrecemos servicio con y sin cita previa.
                Nuestro equipo es seleccionado cuidadosamente por su expertise y habilidades
                excepcionales en la industria.
              </p>
              <p>
                No solo cortamos y afeitamos. Contamos con tratamientos faciales, diseño de
                barba y coloración — cada servicio personalizado según el tipo de cabello,
                piel y preferencias del cliente.
              </p>
            </div>

            {/* highlight strip */}
            <div className="grid grid-cols-3 gap-4 pt-2">
              {HIGHLIGHTS.map(({ number, label }) => (
                <div
                  key={label}
                  className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center"
                >
                  <p className="text-2xl font-black text-white">{number}</p>
                  <p className="text-xs text-gray-500 mt-1 leading-tight">{label}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* ── SLIDER ── */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="relative aspect-[4/5] max-w-sm mx-auto rounded-2xl overflow-hidden">
              {images.map((img, index) => (
                <div
                  key={index}
                  className={`absolute inset-0 transition-opacity duration-700 ${
                    index === currentSlide ? "opacity-100" : "opacity-0"
                  }`}
                >
                  <img
                    src={img}
                    alt={`TJ's Cuts ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}

              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

              {/* flechas */}
              <button
                onClick={prevSlide}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white hover:text-black transition-all duration-300"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={nextSlide}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white hover:text-black transition-all duration-300"
              >
                <ChevronRight size={20} />
              </button>

              {/* dots */}
              <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2">
                {images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      index === currentSlide
                        ? "bg-white w-6"
                        : "bg-white/40 w-2 hover:bg-white/70"
                    }`}
                  />
                ))}
              </div>

              {/* contador */}
              <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full">
                {currentSlide + 1} / {images.length}
              </div>
            </div>

            {/* decoración */}
            <div className="absolute -bottom-6 -right-6 w-32 h-32 border-2 border-white/10 rounded-2xl -z-10" />
          </motion.div>

        </div>
      </div>
    </section>
  );
}
