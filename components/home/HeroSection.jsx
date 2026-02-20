"use client";

import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import Link from "next/link";

export default function HeroSection() {
  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage:
            "url(https://i.postimg.cc/8kbVLm8c/IMG-5529.avif)",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-[#0A0A0A]" />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <span className="inline-block text-white text-sm font-semibold tracking-[0.3em] uppercase mb-6">
            Premium Barbershop Experience
          </span>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white mb-6 leading-tight">
            TJ's Cuts
            <br />
            <span className="text-white">
              Barbershop
            </span>
          </h1>

          <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-10">
            Donde el estilo urbano se encuentra con la excelencia. Cortes de
            precisión y experiencia premium.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/book-appointment"
              className="bg-white text-black px-8 py-4 font-bold text-sm tracking-wider uppercase hover:bg-gray-200 transition-all duration-300 shadow-xl"
            >
              Agende su cita
            </Link>

            <a
              href="#book"
              className="border border-white text-white px-8 py-4 font-bold text-sm tracking-wider uppercase hover:bg-white/10 transition-all duration-300"
            >
              Encuentrános
            </a>
          </div>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, y: [0, 10, 0] }}
        transition={{ duration: 1.5, repeat: Infinity, delay: 1 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2"
      >
        <a
          href="#about"
          className="text-white/50 hover:text-white transition-colors"
        >
          <ChevronDown size={32} />
        </a>
      </motion.div>
    </section>
  );
}