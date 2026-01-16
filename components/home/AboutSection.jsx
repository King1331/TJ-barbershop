"use client";   // ✅ MUY IMPORTANTE EN NEXT APP ROUTER

import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

const images = [
  "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&q=80",
  "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=800&q=80",
  "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=800&q=80",
  "https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=800&q=80",
];

export default function AboutSection() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % images.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <section id="about" className="py-24 bg-[#0A0A0A]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* TEXTO */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
<span className="text-white text-sm font-semibold tracking-[0.3em] uppercase mb-4 block">
  Acerca de nosotros
</span>

<h2 className="text-4xl md:text-5xl font-black text-white mb-8 leading-tight">
  Bienvenido a{" "}
  <span className="text-white">
    TJ's Cuts
  </span>
</h2>


            <div className="space-y-4 text-gray-400 leading-relaxed">
              <p>
                TJ's Cuts Barbershop se enorgullece de ser líder en la industria del grooming masculino moderno. Establecidos con la pasión de traer de vuelta elementos de la barbería tradicional donde la calidad, no la cantidad, es lo primordial.
              </p>
              <p>
                En un ambiente amigable y relajado, ofrecemos servicio con y sin cita previa. Nuestro equipo de barberos cuenta con amplia experiencia y habilidades excepcionales en la industria, seleccionados cuidadosamente por su expertise.
              </p>
              <p>
                No solo cortamos y afeitamos. Tenemos una gama completa de servicios que incluyen tratamientos faciales, diseño de barba y coloración. Cada servicio está personalizado según el tipo de cabello, piel y las preferencias del cliente.
              </p>
              <p className="font-semibold text-white">
                Con productos premium de todo el mundo, todas tus necesidades de grooming serán atendidas en un solo lugar.
              </p>
            </div>
          </motion.div>

          {/* SLIDER DE IMÁGENES */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="relative aspect-[4/5] rounded-2xl overflow-hidden">
              {images.map((img, index) => (
                <div
                  key={index}
                  className={`absolute inset-0 transition-opacity duration-500 ${
                    index === currentSlide ? "opacity-100" : "opacity-0"
                  }`}
                >
                  <img
                    src={img}
                    alt={`Barbershop ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}

              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

              {/* Flechas */}
              <button
                onClick={prevSlide}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-amber-500 hover:text-black transition-all duration-300"
              >
                <ChevronLeft size={24} />
              </button>

              <button
                onClick={nextSlide}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-amber-500 hover:text-black transition-all duration-300"
              >
                <ChevronRight size={24} />
              </button>

              {/* Dots */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                {images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      index === currentSlide
                        ? "bg-white/50 w-8"
                        : "bg-white/50 hover:bg-white/80"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Decoración */}
            <div className="absolute -bottom-6 -right-6 w-32 h-32 border-2 border-amber-400/30 rounded-2xl -z-10" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
