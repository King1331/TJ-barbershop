"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import Link from "next/link";
import { CalendarDays } from "lucide-react";
import db from "@/lib/firebase/firestore";

export default function BarbersSection() {
  const [barbers, setBarbers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBarbers = async () => {
      try {
        const snapshot = await getDocs(collection(db, "barber"));

        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setBarbers(data);
      } catch (error) {
        console.error("❌ Error cargando barberos:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBarbers();
  }, []);

  return (
    <section id="barbers" className="py-24 bg-[#0A0A0A]">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="text-sm font-semibold tracking-[0.3em] uppercase text-gray-400 block mb-4">
            El equipo
          </span>
          <h2 className="text-4xl md:text-5xl font-black text-white">
            Nuestros barberos
          </h2>
        </div>

        {/* Content */}
        {loading ? (
          <p className="text-center text-gray-500">Cargando barberos…</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {barbers.map((barber) => (
              <div
                key={barber.id}
                className="bg-[#111111] rounded-3xl p-8 flex gap-6 items-center"
              >
                {/* Image */}
                <img
                  src={
                    barber.image_url ||
                    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80"
                  }
                  alt={barber.name}
                  className="w-32 h-32 rounded-full object-cover"
                />

                {/* Info */}
                <div>
                  <h3 className="text-2xl font-bold text-white mb-1">
                    {barber.name}
                  </h3>
                  <p className="text-gray-400">{barber.role}</p>

                  {barber.experience && (
                    <p className="text-gray-500 text-sm mt-1">
                      {barber.experience}
                    </p>
                  )}

                  {barber.quote && (
                    <p className="text-gray-400 italic text-sm mt-3">
                      “{barber.quote}”
                    </p>
                  )}

                  {/* ✅ BOTÓN AGREGADO (sin cambiar layout) */}
                  <Link
                    href={`/book-appointment?barber=${barber.id}`}
                    className="inline-flex items-center gap-2 mt-4 bg-white text-black px-5 py-2 rounded-full font-bold text-xs uppercase tracking-wider hover:bg-gray-200 transition"
                  >
                    <CalendarDays size={16} />
                    Agendar
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
