"use client";

import { useEffect, useMemo, useState } from "react";
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import db from "@/lib/firebase/firestore";
import { format, isToday, isThisWeek, isThisMonth, isThisYear } from "date-fns";
import { es } from "date-fns/locale";

export default function AppointmentsTab() {
  const [appointments, setAppointments] = useState([]);
  const [filter, setFilter] = useState("day");
  const [loading, setLoading] = useState(true);

  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState(null);

  const [newAppointment, setNewAppointment] = useState({
    client_name: "",
    barber_name: "",
    service_name: "",
    service_price: 0,
    date: "",
    time: "",
  });

  /* ---------------- FETCH ---------------- */
  const fetchAppointments = async () => {
    const snap = await getDocs(collection(db, "appointments"));
    const data = snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));
    setAppointments(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  /* ---------------- FILTER ---------------- */
  const filteredAppointments = useMemo(() => {
    return appointments.filter((a) => {
      if (!a.date) return false;
      const date = new Date(`${a.date}T00:00:00`);

      if (filter === "day") return isToday(date);
      if (filter === "week") return isThisWeek(date);
      if (filter === "month") return isThisMonth(date);
      if (filter === "year") return isThisYear(date);

      return true;
    });
  }, [appointments, filter]);

  /* ---------------- METRICS ---------------- */
  const totalAppointments = filteredAppointments.length;

  const totalIncome = filteredAppointments.reduce(
    (acc, a) => acc + (Number(a.service_price) || 0),
    0
  );

  const avgIncome =
    totalAppointments > 0 ? totalIncome / totalAppointments : 0;

  /* ---------------- CREATE ---------------- */
  const handleCreate = async () => {
    if (!newAppointment.client_name || !newAppointment.date) {
      alert("Completa los campos obligatorios");
      return;
    }

    await addDoc(collection(db, "appointments"), {
      ...newAppointment,
      status: "confirmed",
      created_at: serverTimestamp(),
    });

    setShowCreate(false);
    setNewAppointment({
      client_name: "",
      barber_name: "",
      service_name: "",
      service_price: 0,
      date: "",
      time: "",
    });

    fetchAppointments();
  };

  /* ---------------- DELETE ---------------- */
  const handleDelete = async (id) => {
    const ok = confirm("¿Seguro que deseas eliminar esta cita?");
    if (!ok) return;

    await deleteDoc(doc(db, "appointments", id));
    setSelected(null);
    fetchAppointments();
  };

  if (loading) {
    return <p className="text-gray-400">Cargando citas…</p>;
  }

  return (
    <div className="space-y-10">
      {/* METRICS */}
      <div className="grid md:grid-cols-3 gap-6">
        <Metric title="Total de citas" value={totalAppointments} />
        <Metric title="Ingresos" value={`$${totalIncome.toFixed(2)}`} />
        <Metric title="Promedio por cita" value={`$${avgIncome.toFixed(2)}`} />
      </div>

      {/* FILTERS */}
      <div className="flex gap-3">
        {["day", "week", "month", "year"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl border transition ${
              filter === f
                ? "bg-white text-black"
                : "border-white/20 text-white hover:bg-white/10"
            }`}
          >
            {f === "day"
              ? "Día"
              : f === "week"
              ? "Semana"
              : f === "month"
              ? "Mes"
              : "Año"}
          </button>
        ))}
      </div>

      {/* CREATE */}
      <button
        onClick={() => setShowCreate(!showCreate)}
        className="bg-white text-black px-6 py-3 rounded-xl font-semibold"
      >
        + Agregar cita
      </button>

      {showCreate && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {[
              ["client_name", "Cliente"],
              ["barber_name", "Barbero"],
              ["service_name", "Servicio"],
            ].map(([key, label]) => (
              <input
                key={key}
                placeholder={label}
                className="bg-black border border-white/20 rounded-xl px-4 py-3 text-white"
                value={newAppointment[key]}
                onChange={(e) =>
                  setNewAppointment({
                    ...newAppointment,
                    [key]: e.target.value,
                  })
                }
              />
            ))}

            <input
              type="number"
              placeholder="Precio"
              className="bg-black border border-white/20 rounded-xl px-4 py-3 text-white"
              value={newAppointment.service_price}
              onChange={(e) =>
                setNewAppointment({
                  ...newAppointment,
                  service_price: Number(e.target.value),
                })
              }
            />

            <input
              type="date"
              className="bg-black border border-white/20 rounded-xl px-4 py-3 text-white"
              value={newAppointment.date}
              onChange={(e) =>
                setNewAppointment({ ...newAppointment, date: e.target.value })
              }
            />

            <input
              type="time"
              className="bg-black border border-white/20 rounded-xl px-4 py-3 text-white"
              value={newAppointment.time}
              onChange={(e) =>
                setNewAppointment({ ...newAppointment, time: e.target.value })
              }
            />
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleCreate}
              className="bg-white text-black px-6 py-2 rounded-xl"
            >
              Guardar
            </button>
            <button
              onClick={() => setShowCreate(false)}
              className="text-gray-400"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* LIST */}
      <div className="space-y-4">
        {filteredAppointments.map((a) => (
          <div
            key={a.id}
            className="border border-white/10 rounded-xl p-5 bg-white/5"
          >
            <div className="flex justify-between items-center">
              <div>
                <p className="text-white font-semibold">
                  {a.client_name} – {a.service_name}
                </p>
                <p className="text-gray-400 text-sm">
                  {format(new Date(`${a.date}T00:00:00`), "PPP", {
                    locale: es,
                  })}{" "}
                  {a.time}
                </p>
              </div>

              <button
                onClick={() => setSelected(a)}
                className="text-sm underline text-white"
              >
                Ver detalles
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* DETAILS */}
      {selected && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-black border border-white/20 rounded-2xl p-8 max-w-md w-full">
            <h3 className="text-xl text-white font-semibold mb-4">
              Detalles de la cita
            </h3>

            {Object.entries(selected).map(
              ([k, v]) =>
                !["id", "created_at"].includes(k) && (
                  <p key={k} className="text-gray-300 text-sm">
                    <span className="text-gray-500">{k}:</span> {String(v)}
                  </p>
                )
            )}

            <div className="flex gap-4 mt-6">
              <button
                onClick={() => handleDelete(selected.id)}
                className="bg-red-600 text-white px-4 py-2 rounded-xl"
              >
                Eliminar
              </button>
              <button
                onClick={() => setSelected(null)}
                className="text-gray-400"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- METRIC CARD ---------------- */
function Metric({ title, value }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
      <p className="text-gray-400 text-sm">{title}</p>
      <p className="text-3xl font-bold text-white mt-2">{value}</p>
    </div>
  );
}
