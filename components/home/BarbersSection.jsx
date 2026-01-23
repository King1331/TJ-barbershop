"use client";

import { useEffect, useState } from "react";
import { getBarbersService } from "@/lib/services/barbers.service";

export default function BarbersSection() {
  const [barbers, setBarbers] = useState([]);

  useEffect(() => {
    getBarbersService().then(setBarbers);
  }, []);

  return (
    <section className="bg-[#0A0A0A] py-20">
      <div className="max-w-6xl mx-auto px-6">
        <h2 className="text-4xl font-black text-white mb-12 text-center">
          Nuestros Barberos
        </h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {barbers.map(barber => (
            <div
              key={barber.id}
              className="bg-white/5 border border-white/10 rounded-2xl p-6"
            >
              <img
                src={barber.image_url}
                alt={barber.name}
                className="w-24 h-24 rounded-full object-cover mb-4"
              />

              <h3 className="text-white font-bold text-lg">
                {barber.name}
              </h3>

              <p className="text-gray-400 text-sm">
                {barber.role}
              </p>

              {barber.quote && (
                <p className="text-gray-500 text-sm mt-3 italic">
                  “{barber.quote}”
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
