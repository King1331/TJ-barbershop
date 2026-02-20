"use client";

import { Input } from "@/components/ui/input";
import DarkCalendar from "@/components/ui/calendar";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { collection, getDocs, addDoc } from "firebase/firestore";
import db from "@/lib/firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { es } from "date-fns/locale";

/* ── HORARIOS ── */
const SCHEDULE = {
  0: null,
  1: { start: "9:00 AM", end: "8:00 PM" },
  2: { start: "9:00 AM", end: "8:00 PM" },
  3: { start: "9:00 AM", end: "8:00 PM" },
  4: { start: "9:00 AM", end: "8:00 PM" },
  5: { start: "9:00 AM", end: "8:00 PM" },
  6: { start: "9:00 AM", end: "6:00 PM" },
};

const ALL_SLOTS = [
  "9:00 AM",  "9:30 AM",
  "10:00 AM", "10:30 AM",
  "11:00 AM", "11:30 AM",
  "12:00 PM", "12:30 PM",
  "1:00 PM",  "1:30 PM",
  "2:00 PM",  "2:30 PM",
  "3:00 PM",  "3:30 PM",
  "4:00 PM",  "4:30 PM",
  "5:00 PM",  "5:30 PM",
  "6:00 PM",  "6:30 PM",
  "7:00 PM",  "7:30 PM",
  "8:00 PM",
];

const toMinutes = (slot) => {
  const [time, period] = slot.split(" ");
  let [h, m] = time.split(":").map(Number);
  if (period === "PM" && h !== 12) h += 12;
  if (period === "AM" && h === 12) h = 0;
  return h * 60 + m;
};

const getSlotsForDate = (date) => {
  if (!date) return [];
  const day = date.getDay();
  const schedule = SCHEDULE[day];
  if (!schedule) return [];
  const startMin = toMinutes(schedule.start);
  const endMin   = toMinutes(schedule.end);
  return ALL_SLOTS.filter((s) => {
    const m = toMinutes(s);
    return m >= startMin && m <= endMin;
  });
};

const toDateStr = (date) => format(date, "yyyy-MM-dd");

export default function BookAppointment() {
  const searchParams = useSearchParams();
  const preselectedBarberId = searchParams.get("barber");

  const [step, setStep] = useState(1);
  const [barbers, setBarbers] = useState([]);
  const [services, setServices] = useState([]);
  const [appointments, setAppointments] = useState([]);

  const [selectedBarber, setSelectedBarber] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  /* ── FETCH ── */
  useEffect(() => {
    const fetchData = async () => {
      const [barbersSnap, servicesSnap, appointmentsSnap] = await Promise.all([
        getDocs(collection(db, "barber")),
        getDocs(collection(db, "services")),
        getDocs(collection(db, "appointments")),
      ]);

      const barbersData = barbersSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setBarbers(barbersData.filter((b) => b.visible !== false));
      setServices(servicesSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      setAppointments(appointmentsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));

      if (preselectedBarberId) {
        const found = barbersData.find((b) => b.id === preselectedBarberId);
        if (found) setSelectedBarber(found);
      }
    };
    fetchData();
  }, [preselectedBarberId]);

  /* ── SLOTS disponibles para la fecha seleccionada ── */
  const availableSlots = (() => {
    if (!selectedDate) return [];
    const slots = getSlotsForDate(selectedDate);
    const dateStr = toDateStr(selectedDate);
    const taken = appointments
      .filter((a) => a.date === dateStr)
      .map((a) => a.time);
    return slots.map((slot) => ({ slot, taken: taken.includes(slot) }));
  })();

  const allSlotsTaken =
    availableSlots.length > 0 && availableSlots.every((s) => s.taken);

  /* ── tileDisabled para el calendario ── */
  const tileDisabled = ({ date }) => {
    if (date.getDay() === 0) return true;
    const dateStr = toDateStr(date);
    const slots = getSlotsForDate(date);
    const taken = appointments.filter((a) => a.date === dateStr).map((a) => a.time);
    return slots.length > 0 && slots.every((s) => taken.includes(s));
  };

  /* ── canProceed ── */
  const canProceed = () => {
    switch (step) {
      case 1: return !!selectedBarber;
      case 2: return !!selectedService;
      case 3: return !!selectedDate && selectedDate.getDay() !== 0 && !allSlotsTaken;
      case 4: return !!selectedTime;
      case 5: return clientName.trim() && clientEmail.trim();
      default: return false;
    }
  };

  /* ── SUBMIT ── */
  const handleSubmit = async () => {
    setIsSubmitting(true);
    await addDoc(collection(db, "appointments"), {
      barber_id: selectedBarber.id,
      barber_name: selectedBarber.name,
      service_id: selectedService.id,
      service_name: selectedService.name,
      service_price: selectedService.price,
      date: toDateStr(selectedDate),
      time: selectedTime,
      client_name: clientName,
      client_email: clientEmail,
      status: "pendiente",
      created_at: new Date(),
    });
    setIsSubmitting(false);
    setIsComplete(true);
  };

  /* ── SUCCESS ── */
 if (isComplete) {
  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />

        <h1 className="text-3xl font-black text-white mb-4">
          Cita confirmada!
        </h1>

        <p className="text-gray-400 mb-6">
          Te esperamos el{" "}
          <span className="text-white font-semibold">
            {format(selectedDate, "PPP", { locale: es })}
          </span>{" "}
          a las{" "}
          <span className="text-white font-semibold">
            {selectedTime}
          </span>
        </p>

        {/* BOTÓN REAL */}
        <button
          type="button"
          onClick={() => (window.location.href = "/")}
          className="bg-white text-black px-8 py-3 rounded-full font-bold uppercase text-sm hover:bg-gray-100 transition"
        >
          Volver al inicio
        </button>
      </div>
    </div>
  );
}
  /* ── UI ── */
  return (
    <div className="min-h-screen bg-[#0A0A0A] pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-6">
        <h1 className="text-4xl font-black text-white text-center mb-12">
          Agendar cita
        </h1>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            className="bg-white/5 rounded-3xl border border-white/10 p-8"
          >

            {/* STEP 1 — barbero */}
            {step === 1 && (
              <>
                <h2 className="text-2xl text-white font-bold mb-6">
                  Selecciona tu barbero
                </h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {barbers.map((barber) => (
                    <button
                      key={barber.id}
                      onClick={() => setSelectedBarber(barber)}
                      className={`p-4 rounded-2xl border text-left ${
                        selectedBarber?.id === barber.id
                          ? "border-white bg-white/10"
                          : "border-white/10 hover:border-white/30"
                      }`}
                    >
                      <h3 className="text-white font-semibold">{barber.name}</h3>
                      <p className="text-gray-400 text-sm">{barber.role}</p>
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* STEP 2 — servicio */}
            {step === 2 && (
              <>
                <h2 className="text-2xl text-white font-bold mb-6">
                  Selecciona el servicio
                </h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {services.map((service) => (
                    <button
                      key={service.id}
                      onClick={() => setSelectedService(service)}
                      className={`p-5 rounded-2xl border text-left ${
                        selectedService?.id === service.id
                          ? "border-white bg-white/10"
                          : "border-white/10 hover:border-white/30"
                      }`}
                    >
                      <div className="flex justify-between">
                        <span className="text-white font-semibold">{service.name}</span>
                        <span className="text-white font-bold">₡{service.price}</span>
                      </div>
                      <p className="text-gray-400 text-sm">{service.duration || 30} min</p>
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* STEP 3 — fecha */}
            {step === 3 && (
              <>
                <h2 className="text-2xl text-white font-bold mb-2">
                  Selecciona la fecha
                </h2>
                <p className="text-gray-500 text-sm mb-6">
                  Lun–Vie: 9:00 AM – 8:00 PM &nbsp;|&nbsp; Sáb: 9:00 AM – 6:00 PM &nbsp;|&nbsp; Dom: Cerrado
                </p>
                <div className="flex justify-center">
                  <DarkCalendar
                    value={selectedDate}
                    onChange={(date) => {
                      setSelectedDate(date);
                      setSelectedTime(null);
                    }}
                    minDate={new Date()}
                    maxDate={new Date(new Date().setDate(new Date().getDate() + 30))}
                    tileDisabled={tileDisabled}
                  />
                </div>
                {selectedDate && selectedDate.getDay() === 0 && (
                  <p className="text-red-400 text-sm text-center mt-4">
                    Los domingos estamos cerrados. Por favor elige otro dia.
                  </p>
                )}
                {selectedDate && selectedDate.getDay() !== 0 && allSlotsTaken && (
                  <p className="text-red-400 text-sm text-center mt-4">
                    No hay horas disponibles para este dia. Por favor elige otro.
                  </p>
                )}
                {selectedDate && selectedDate.getDay() !== 0 && !allSlotsTaken && (
                  <p className="text-gray-500 text-sm text-center mt-4">
                    Horario: {SCHEDULE[selectedDate.getDay()]?.start} – {SCHEDULE[selectedDate.getDay()]?.end}
                  </p>
                )}
              </>
            )}

            {/* STEP 4 — hora */}
            {step === 4 && (
              <>
                <h2 className="text-2xl text-white font-bold mb-2">
                  Selecciona la hora
                </h2>
                <p className="text-gray-500 text-sm mb-6">
                  {format(selectedDate, "PPP", { locale: es })}
                </p>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {availableSlots.map(({ slot, taken }) => (
                    <button
                      key={slot}
                      disabled={taken}
                      onClick={() => !taken && setSelectedTime(slot)}
                      className={`py-3 rounded-xl text-sm font-semibold transition-colors ${
                        taken
                          ? "bg-white/5 text-gray-600 cursor-not-allowed line-through"
                          : selectedTime === slot
                          ? "bg-white text-black"
                          : "bg-white/5 text-white hover:bg-white/10"
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
                <div className="flex gap-4 mt-4">
                  <span className="flex items-center gap-1 text-xs text-gray-500">
                    <span className="w-3 h-3 rounded bg-white/5 inline-block" /> Ocupado
                  </span>
                  <span className="flex items-center gap-1 text-xs text-gray-500">
                    <span className="w-3 h-3 rounded bg-white/10 inline-block" /> Disponible
                  </span>
                  <span className="flex items-center gap-1 text-xs text-gray-500">
                    <span className="w-3 h-3 rounded bg-white inline-block" /> Seleccionado
                  </span>
                </div>
              </>
            )}

            {/* STEP 5 — datos */}
            {step === 5 && (
              <>
                <h2 className="text-2xl text-white font-bold mb-6">Tus datos</h2>
                <div className="space-y-4 max-w-md mx-auto">
                  <Input
                    placeholder="Nombre completo"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="bg-white/5 border-white/10 text-white"
                  />
                  <Input
                    type="email"
                    placeholder="Correo electronico"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
              </>
            )}

          </motion.div>
        </AnimatePresence>

        {/* NAV */}
        <div className="flex justify-between mt-8">
          <button
            onClick={() => setStep(step - 1)}
            disabled={step === 1}
            className="text-gray-400 hover:text-white disabled:opacity-30 transition-colors"
          >
            <ChevronLeft className="inline mr-2" />
            Anterior
          </button>

          {step < 5 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={!canProceed()}
              className={`px-8 py-3 rounded-full font-bold transition-colors ${
                canProceed()
                  ? "bg-white text-black hover:bg-gray-100"
                  : "bg-white/10 text-gray-500 cursor-not-allowed"
              }`}
            >
              Siguiente
              <ChevronRight className="inline ml-2" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !canProceed()}
              className="bg-white text-black px-8 py-3 rounded-full font-bold hover:bg-gray-100 disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? "Confirmando..." : "Confirmar cita"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}