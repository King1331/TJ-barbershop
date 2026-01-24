"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { collection, getDocs, addDoc } from "firebase/firestore";
import db from "@/lib/firebase/firestore";

import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Clock,
  User,
  Mail,
  CheckCircle,
  ChevronRight,
  ChevronLeft,
  Scissors,
} from "lucide-react";

import { format, addDays, isBefore, isAfter, startOfDay } from "date-fns";
import { es } from "date-fns/locale";

/* ------------------ CONFIG ------------------ */

const timeSlots = [
  "9:00 AM","9:30 AM","10:00 AM","10:30 AM","11:00 AM","11:30 AM",
  "12:00 PM","12:30 PM","1:00 PM","1:30 PM","2:00 PM","2:30 PM",
  "3:00 PM","3:30 PM","4:00 PM","4:30 PM","5:00 PM","5:30 PM",
  "6:00 PM","6:30 PM","7:00 PM","7:30 PM",
];

/* ------------------ COMPONENT ------------------ */

export default function BookAppointment() {
  const searchParams = useSearchParams();
  const preselectedBarberId = searchParams.get("barber");

  const [step, setStep] = useState(1);

  const [barbers, setBarbers] = useState([]);
  const [services, setServices] = useState([]);

  const [selectedBarber, setSelectedBarber] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);

  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  /* -------- FETCH BARBERS & SERVICES -------- */

  useEffect(() => {
    const fetchData = async () => {
      try {
        const barberSnap = await getDocs(collection(db, "barber"));
        const serviceSnap = await getDocs(collection(db, "services"));

        const barberData = barberSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));

        const serviceData = serviceSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));

        setBarbers(barberData);
        setServices(serviceData);

        if (preselectedBarberId) {
          const found = barberData.find(b => b.id === preselectedBarberId);
          if (found) setSelectedBarber(found);
        }

      } catch (err) {
        console.error("❌ Error cargando datos:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [preselectedBarberId]);

  /* -------- SUBMIT APPOINTMENT -------- */

  const handleSubmit = async () => {
    if (!selectedBarber || !selectedService) return;

    setIsSubmitting(true);

    try {
      await addDoc(collection(db, "appointments"), {
        barber_id: selectedBarber.id,
        barber_name: selectedBarber.name,

        service_id: selectedService.id,
        service_name: selectedService.name,
        service_price: selectedService.price,

        date: format(selectedDate, "yyyy-MM-dd"),
        time: selectedTime,

        client_name: clientName,
        client_email: clientEmail,

        status: "pendiente",
        created_at: new Date(),
      });

      setIsComplete(true);
    } catch (err) {
      console.error("❌ Error creando cita:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  /* -------- VALIDATION -------- */

  const canProceed = () => {
    switch (step) {
      case 1: return !!selectedBarber;
      case 2: return !!selectedService;
      case 3: return !!selectedDate;
      case 4: return !!selectedTime;
      case 5: return clientName && clientEmail;
      default: return false;
    }
  };

  /* -------- SUCCESS -------- */

  if (isComplete) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />
          <h1 className="text-3xl font-black text-white mb-4">
            ¡Cita confirmada!
          </h1>
          <p className="text-gray-400 mb-6">
            Te enviaremos un correo a <b>{clientEmail}</b>
          </p>
          <a
            href="/"
            className="inline-block bg-white text-black px-8 py-3 rounded-full font-bold"
          >
            Volver al inicio
          </a>
        </div>
      </div>
    );
  }

  /* -------- UI -------- */

  return (
    <div className="min-h-screen bg-[#0A0A0A] pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-6">

        <h1 className="text-4xl font-black text-white text-center mb-12">
          Agendar cita
        </h1>

        {loading ? (
          <p className="text-center text-gray-500">Cargando…</p>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white/5 rounded-3xl border border-white/10 p-8"
            >

              {/* STEP 1 BARBER */}
              {step === 1 && (
                <>
                  <h2 className="text-xl font-bold text-white mb-6">
                    Selecciona barbero
                  </h2>
                  <div className="grid md:grid-cols-3 gap-4">
                    {barbers.map(barber => (
                      <button
                        key={barber.id}
                        onClick={() => setSelectedBarber(barber)}
                        className={`p-4 rounded-2xl border text-left ${
                          selectedBarber?.id === barber.id
                            ? "border-white bg-white/10"
                            : "border-white/10"
                        }`}
                      >
                        <img
                          src={barber.image_url}
                          className="w-16 h-16 rounded-full mb-3"
                        />
                        <p className="text-white font-semibold">{barber.name}</p>
                        <p className="text-gray-400 text-sm">{barber.role}</p>
                      </button>
                    ))}
                  </div>
                </>
              )}

              {/* STEP 2 SERVICE */}
              {step === 2 && (
                <>
                  <h2 className="text-xl font-bold text-white mb-6">
                    Selecciona servicio
                  </h2>
                  <div className="grid md:grid-cols-2 gap-4">
                    {services.map(service => (
                      <button
                        key={service.id}
                        onClick={() => setSelectedService(service)}
                        className={`p-5 rounded-2xl border text-left ${
                          selectedService?.id === service.id
                            ? "border-white bg-white/10"
                            : "border-white/10"
                        }`}
                      >
                        <div className="flex justify-between">
                          <span className="text-white">{service.name}</span>
                          <span className="text-white font-bold">
                            ₡{service.price}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}

            </motion.div>
          </AnimatePresence>
        )}

        {/* NAV */}
        <div className="flex justify-between mt-8">
          <button
            disabled={step === 1}
            onClick={() => setStep(step - 1)}
            className="text-gray-400"
          >
            ← Anterior
          </button>

          {step < 5 ? (
            <button
              disabled={!canProceed()}
              onClick={() => setStep(step + 1)}
              className="bg-white text-black px-6 py-3 rounded-full font-bold"
            >
              Siguiente →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-white text-black px-6 py-3 rounded-full font-bold"
            >
              Confirmar cita
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
