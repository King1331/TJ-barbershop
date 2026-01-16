"use client";

import { motion } from "framer-motion";
import { Clock } from "lucide-react";

const defaultServices = [
  {
    id: "1",
    name: "Corte Clásico",
    description: "Corte tradicional de precisión con tijeras y máquina",
    price: 25,
    duration: 30,
    image_url:
      "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=400&q=80",
  },
  {
    id: "2",
    name: "Fade Premium",
    description: "Degradado perfecto con técnica especializada",
    price: 30,
    duration: 40,
    image_url:
      "https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=400&q=80",
  },
  {
    id: "3",
    name: "Barba Completa",
    description: "Diseño, recorte y tratamiento de barba",
    price: 20,
    duration: 25,
    image_url:
      "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&q=80",
  },
  {
    id: "4",
    name: "Corte + Barba",
    description: "Combo completo de corte y arreglo de barba",
    price: 40,
    duration: 50,
    image_url:
      "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=400&q=80",
  },
  {
    id: "5",
    name: "Diseño de Cejas",
    description: "Perfilado y diseño de cejas masculinas",
    price: 10,
    duration: 15,
    image_url:
      "https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=400&q=80",
  },
  {
    id: "6",
    name: "Afeitado Clásico",
    description: "Afeitado con navaja y toalla caliente",
    price: 25,
    duration: 30,
    image_url:
      "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=400&q=80",
  },
];

export default function ServicesSection() {
  return (
    <section id="services" className="py-24 bg-[#111111]">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-white text-sm font-semibold tracking-[0.3em] uppercase mb-4 block">
            Nuestros servicios
          </span>

          <h2 className="text-4xl md:text-5xl font-black text-white">
            Servicios Premium
          </h2>
        </motion.div>

        {/* Services Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {defaultServices.map((service, index) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="group relative overflow-hidden rounded-2xl bg-gradient-to-b from-white/5 to-transparent border border-white/10 hover:border-white/30 transition-all duration-500"
            >
              {/* Image */}
              <div className="relative h-48 overflow-hidden">
                <img
                  src={service.image_url}
                  alt={service.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#111111] via-transparent to-transparent" />
              </div>

              {/* Content */}
              <div className="p-6">
                <h3 className="text-xl font-bold text-white mb-2">
                  {service.name}
                </h3>

                <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                  {service.description}
                </p>

                <div className="flex items-center justify-between">
                  <span className="text-2xl font-black text-white">
                    ${service.price}
                  </span>

                  <div className="flex items-center gap-2 text-gray-400 text-sm">
                    <Clock size={14} />
                    <span>{service.duration} min</span>
                  </div>
                </div>
              </div>

              {/* Hover Accent */}
              <div className="absolute bottom-0 left-0 w-full h-1 bg-white transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
