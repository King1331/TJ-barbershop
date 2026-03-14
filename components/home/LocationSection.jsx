"use client";

import { motion } from "framer-motion";
import {
  MapPin,
  Clock,
  Phone,
  Mail,
  ExternalLink,
  CalendarDays,
} from "lucide-react";
import Link from "next/link";

export default function LocationSection() {
  const schedule = [
    { day: "Lunes - Sabado", hours: "10:00 AM - 8:00 PM" },
    { day: "Domingos", hours: "Cerrado" },
  ];

  return (
    <section id="book" className="py-24 bg-black">
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
            Encuéntranos
          </span>
          <h2 className="text-4xl md:text-5xl font-black text-white">
            Ubicación y Horarios
          </h2>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Location Card */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden">
              {/* Map */}
              <div className="aspect-video relative">
                <img
                  src="https://i.postimg.cc/fybK1NB6/IMG-5055.avif"
                  alt="Ubicación"
                  className="w-full h-full object-cover opacity-50"
                />

                <div className="absolute inset-0 bg-black/40" />

                <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4">
                    <MapPin size={28} className="text-black" />
                  </div>
                  <p className="text-white font-bold text-lg mb-3">
                    TJ&apos;s Cuts Barbershop
                  </p>

                  <a
                    href="https://www.google.com/maps/place/Chicago+Barber+Studio/@9.9318706,-84.0479822,17z/data=!3m1!4b1!4m6!3m5!1s0x8fa0e39107ba71bf:0xe3a9c38d08747e7e!8m2!3d9.9318706!4d-84.0454073!16s%2Fg%2F11w3gqns0v?entry=ttu&g_ep=EgoyMDI2MDIyMy4wIKXMDSoASAFQAw%3D%3D"
                    target="_blank"
                    className="inline-flex items-center gap-2 bg-white text-black px-5 py-2 rounded-full text-xs font-bold uppercase hover:bg-gray-200 transition"
                  >
                    Ver en Maps
                    <ExternalLink size={14} />
                  </a>
                </div>
              </div>

              {/* Info */}
              <div className="p-8 space-y-6">
                <InfoItem
                  icon={<MapPin size={20} />}
                  title="Dirección"
                  text={`Centro Comercial Los Laureles Local #2 San José, San Pedro, 1501`}
                />
                <InfoItem
                  icon={<Phone size={20} />}
                  title="Teléfono"
                  text="+506 7017 5462"
                />
                <InfoItem
                  icon={<Mail size={20} />}
                  title="Email"
                  text="info@tjscuts.com"
                />
              </div>
            </div>
          </motion.div>

          {/* Schedule */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
                  <Clock size={24} className="text-black" />
                </div>
                <h3 className="text-2xl font-bold text-white">
                  Horarios de Atención
                </h3>
              </div>

              <div className="space-y-4">
                {schedule.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-4 border-b border-white/10 last:border-0"
                  >
                    <span className="text-white font-medium">
                      {item.day}
                    </span>
                    <span
                      className={`font-semibold ${
                        item.hours === "Cerrado"
                          ? "text-gray-500"
                          : "text-white"
                      }`}
                    >
                      {item.hours}
                    </span>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <Link
                href="/book-appointment"
                className="mt-10 inline-flex items-center justify-center gap-2 w-full bg-white text-black px-6 py-4 rounded-full font-bold uppercase text-sm hover:bg-gray-200 transition"
              >
                <CalendarDays size={18} />
                Agendar cita
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* Reusable info block */
function InfoItem({ icon, title, text }) {
  return (
    <div className="flex items-start gap-4">
      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-black">
        {icon}
      </div>
      <div>
        <h4 className="text-white font-semibold mb-1">{title}</h4>
        <p className="text-gray-400 text-sm whitespace-pre-line">
          {text}
        </p>
      </div>
    </div>
  );
}