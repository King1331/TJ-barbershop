"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Clock } from "lucide-react";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import  db from "@/lib/firebase/firestore";

export default function ServicesSection() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const q = query(
          collection(db, "services"),
          where("visible", "==", true),
          orderBy("createdAt", "desc")
        );

        const snapshot = await getDocs(q);
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setServices(data);
      } catch (error) {
        console.error("Error cargando servicios:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  if (loading) {
    return (
      <section className="py-24 bg-[#111111] text-center text-gray-400">
        Cargando servicios...
      </section>
    );
  }

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

        {/* Grid */}
        {services.length === 0 ? (
          <p className="text-center text-gray-400">
            No hay servicios disponibles
          </p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, index) => (
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

                {/* Accent */}
                <div className="absolute bottom-0 left-0 w-full h-1 bg-white transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
