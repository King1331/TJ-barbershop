"use client";
import { useEffect, useMemo, useState } from "react";
import {
  collection, getDocs, deleteDoc, updateDoc, doc, addDoc, serverTimestamp,
} from "firebase/firestore";
import db from "@/lib/firebase/firestore";
import { format, isToday, isThisWeek, isThisMonth, isThisYear } from "date-fns";
import { es } from "date-fns/locale";
import { Plus } from "lucide-react";

const FILTER_LABELS = { day: "Hoy", week: "Semana", month: "Mes", year: "Año" };

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

const getSlotsForDate = (dateStr) => {
  if (!dateStr) return [];
  const day = new Date(`${dateStr}T00:00:00`).getDay();
  const schedule = SCHEDULE[day];
  if (!schedule) return [];
  const startMin = toMinutes(schedule.start);
  const endMin   = toMinutes(schedule.end);
  return ALL_SLOTS.filter((s) => {
    const m = toMinutes(s);
    return m >= startMin && m <= endMin;
  });
};

const isClosed = (dateStr) => {
  if (!dateStr) return false;
  return new Date(`${dateStr}T00:00:00`).getDay() === 0;
};

const todayStr = () => new Date().toISOString().split("T")[0];

const EMPTY_CREATE = {
  client_name: "",
  email: "",
  date: "",
  time: "",
  barber_id: "",
  barber_name: "",
  service_id: "",
  service_name: "",
  service_price: "",
};

/* ─── SlotPicker reutilizable ─── */
function SlotPicker({ date, selectedTime, appointments, excludeId, onChange }) {
  const slots = useMemo(() => {
    if (!date) return [];
    const valid = getSlotsForDate(date);
    const taken = appointments
      .filter((a) => a.date === date && a.id !== excludeId)
      .map((a) => a.time);
    return valid.map((slot) => ({ slot, taken: taken.includes(slot) }));
  }, [date, appointments, excludeId]);

  if (!date)          return <p className="text-gray-500 text-sm">Selecciona una fecha primero.</p>;
  if (isClosed(date)) return <p className="text-red-400 text-sm">Cerrado los domingos.</p>;
  if (slots.length === 0) return <p className="text-gray-500 text-sm">No hay horarios disponibles.</p>;

  const allTaken = slots.every((s) => s.taken);
  if (allTaken) return <p className="text-red-400 text-sm">No hay horas disponibles para este día.</p>;

  return (
    <>
      <div className="grid grid-cols-4 gap-2">
        {slots.map(({ slot, taken }) => (
          <button
            key={slot}
            type="button"
            disabled={taken}
            onClick={() => !taken && onChange(slot)}
            className={`py-2 rounded-lg text-sm font-medium transition-colors ${
              taken
                ? "bg-white/5 text-gray-600 cursor-not-allowed line-through"
                : selectedTime === slot
                ? "bg-white text-black"
                : "bg-white/10 text-white hover:bg-white/20 border border-white/10"
            }`}
          >
            {slot}
          </button>
        ))}
      </div>
      <div className="flex gap-4 mt-1">
        <span className="flex items-center gap-1 text-xs text-gray-500">
          <span className="w-3 h-3 rounded bg-white/5 border border-white/10 inline-block" /> Ocupado
        </span>
        <span className="flex items-center gap-1 text-xs text-gray-500">
          <span className="w-3 h-3 rounded bg-white/10 border border-white/10 inline-block" /> Disponible
        </span>
        <span className="flex items-center gap-1 text-xs text-gray-500">
          <span className="w-3 h-3 rounded bg-white inline-block" /> Seleccionado
        </span>
      </div>
    </>
  );
}

export default function AppointmentsTab() {
  const [appointments, setAppointments] = useState([]);
  const [services, setServices]         = useState([]);
  const [barbers, setBarbers]           = useState([]);
  const [filter, setFilter]             = useState("day");
  const [loading, setLoading]           = useState(true);

  /* edit */
  const [selected, setSelected] = useState(null);
  const [editData, setEditData] = useState({});

  /* create */
  const [showCreate, setShowCreate] = useState(false);
  const [createData, setCreateData] = useState(EMPTY_CREATE);
  const [saving, setSaving]         = useState(false);

  /* ---------------- FETCH ---------------- */
  const fetchAll = async () => {
    const [aSnap, sSnap, bSnap] = await Promise.all([
      getDocs(collection(db, "appointments")),
      getDocs(collection(db, "services")),
      getDocs(collection(db, "barber")),
    ]);
    setAppointments(aSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
    setServices(sSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
    setBarbers(bSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  /* ---------------- FILTER ---------------- */
  const filteredAppointments = useMemo(() => {
    return appointments.filter((a) => {
      if (!a.date) return false;
      const date = new Date(`${a.date}T00:00:00`);
      if (filter === "day")   return isToday(date);
      if (filter === "week")  return isThisWeek(date);
      if (filter === "month") return isThisMonth(date);
      if (filter === "year")  return isThisYear(date);
      return true;
    });
  }, [appointments, filter]);

  /* ---------------- METRICS ---------------- */
  const totalAppointments = filteredAppointments.length;
  const totalIncome = filteredAppointments.reduce((acc, a) => acc + (Number(a.service_price) || 0), 0);
  const avgIncome   = totalAppointments > 0 ? totalIncome / totalAppointments : 0;

  /* ---------------- CREATE ---------------- */
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!createData.date || !createData.time) return alert("Selecciona fecha y hora.");
    if (isClosed(createData.date)) return alert("El local está cerrado los domingos.");
    setSaving(true);
    await addDoc(collection(db, "appointments"), {
      ...createData,
      service_price: Number(createData.service_price),
      created_at: serverTimestamp(),
    });
    await fetchAll();
    setSaving(false);
    setShowCreate(false);
    setCreateData(EMPTY_CREATE);
  };

  /* ---------------- DELETE ---------------- */
  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar esta cita?")) return;
    await deleteDoc(doc(db, "appointments", id));
    setSelected(null);
    fetchAll();
  };

  /* ---------------- UPDATE ---------------- */
  const handleUpdate = async () => {
    await updateDoc(doc(db, "appointments", selected.id), editData);
    setSelected(null);
    fetchAll();
  };

  if (loading) return <p className="text-white p-4">Cargando…</p>;

  return (
    <div className="p-4 space-y-6 text-white">

      {/* METRICS */}
      <div className="grid grid-cols-3 gap-4">
        <Metric title="Citas"    value={totalAppointments} />
        <Metric title="Ingresos" value={`$${totalIncome.toFixed(2)}`} />
        <Metric title="Promedio" value={`$${avgIncome.toFixed(2)}`} />
      </div>

      {/* FILTER + CREAR */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex gap-2 flex-wrap">
          {["day", "week", "month", "year"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl transition-colors ${
                filter === f
                  ? "bg-white text-black font-semibold"
                  : "text-white border border-white/30 hover:bg-white/10"
              }`}
            >
              {FILTER_LABELS[f]}
            </button>
          ))}
        </div>
        <button
          onClick={() => { setShowCreate(true); setSelected(null); }}
          className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-xl font-semibold hover:bg-gray-100 transition-colors"
        >
          <Plus size={16} />
          Crear cita
        </button>
      </div>

      {/* ═══════════ MODAL CREAR CITA ═══════════ */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <h3 className="text-lg font-bold">Nueva Cita</h3>

            <form onSubmit={handleCreate} className="space-y-4">

              {/* NOMBRE + EMAIL */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-gray-400">Nombre del cliente</label>
                  <input
                    type="text"
                    required
                    value={createData.client_name}
                    onChange={(e) => setCreateData({ ...createData, client_name: e.target.value })}
                    className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-white/30"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-gray-400">Correo</label>
                  <input
                    type="email"
                    value={createData.email}
                    onChange={(e) => setCreateData({ ...createData, email: e.target.value })}
                    className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-white/30"
                  />
                </div>
              </div>

              {/* FECHA */}
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-400">Fecha</label>
                <input
                  type="date"
                  required
                  min={todayStr()}
                  value={createData.date}
                  onChange={(e) => {
                    const newDate = e.target.value;
                    if (isClosed(newDate)) {
                      alert("El local está cerrado los domingos. Por favor elige otro día.");
                      setCreateData({ ...createData, date: "", time: "" });
                    } else {
                      setCreateData({ ...createData, date: newDate, time: "" });
                    }
                  }}
                  className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-white/30"
                />
                {createData.date && !isClosed(createData.date) && (
                  <p className="text-gray-500 text-xs">
                    Horario:{" "}
                    {SCHEDULE[new Date(`${createData.date}T00:00:00`).getDay()]?.start} –{" "}
                    {SCHEDULE[new Date(`${createData.date}T00:00:00`).getDay()]?.end}
                  </p>
                )}
              </div>

              {/* HORA */}
              <div className="flex flex-col gap-2">
                <label className="text-xs text-gray-400">
                  Hora — seleccionada:{" "}
                  <span className="text-white font-semibold">{createData.time || "ninguna"}</span>
                </label>
                <SlotPicker
                  date={createData.date}
                  selectedTime={createData.time}
                  appointments={appointments}
                  excludeId={null}
                  onChange={(slot) => setCreateData({ ...createData, time: slot })}
                />
              </div>

              {/* BARBERO */}
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-400">Barbero</label>
                <select
                  required
                  value={createData.barber_id}
                  onChange={(e) => {
                    const barber = barbers.find((b) => b.id === e.target.value);
                    if (!barber) return;
                    setCreateData({ ...createData, barber_id: barber.id, barber_name: barber.name });
                  }}
                  className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none"
                >
                  <option value="" disabled>Seleccionar barbero</option>
                  {barbers.map((b) => (
                    <option key={b.id} value={b.id} className="text-black">{b.name}</option>
                  ))}
                </select>
              </div>

              {/* SERVICIO */}
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-400">Servicio</label>
                <select
                  required
                  value={createData.service_id}
                  onChange={(e) => {
                    const service = services.find((s) => s.id === e.target.value);
                    if (!service) return;
                    setCreateData({
                      ...createData,
                      service_id: service.id,
                      service_name: service.name,
                      service_price: service.price,
                    });
                  }}
                  className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none"
                >
                  <option value="" disabled>Seleccionar servicio</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id} className="text-black">{s.name}</option>
                  ))}
                </select>
              </div>

              {/* PRECIO (auto) */}
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-400">Precio</label>
                <div className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white">
                  {createData.service_price ? `$${Number(createData.service_price).toFixed(2)}` : "—"}
                </div>
              </div>

              {/* ACTIONS */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowCreate(false); setCreateData(EMPTY_CREATE); }}
                  className="flex-1 border border-white/20 text-white py-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-white text-black py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors disabled:opacity-50"
                >
                  {saving ? "Guardando…" : "Crear cita"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LIST */}
      <div className="space-y-2">
        {filteredAppointments.length === 0 && (
          <p className="text-gray-400">No hay citas para este período.</p>
        )}
        {filteredAppointments.map((a) => (
          <div
            key={a.id}
            className="bg-white/10 rounded-xl p-4 flex justify-between items-center"
          >
            <div>
              <p className="font-semibold">{a.client_name} — {a.service_name}</p>
              <p className="text-sm text-gray-300">
                {format(new Date(`${a.date}T00:00:00`), "PPP", { locale: es })} · {a.time}
              </p>
            </div>
            <button
              onClick={() => { setSelected(a); setEditData(a); setShowCreate(false); }}
              className="text-sm underline hover:text-gray-300"
            >
              Ver detalles
            </button>
          </div>
        ))}
      </div>

      {/* DETAILS / EDIT PANEL */}
      {selected && (
        <div className="bg-white/10 rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-bold">Detalles de la cita</h2>

          <div className="grid grid-cols-2 gap-3">
            {["client_name", "email"].map((field) => (
              <div key={field} className="flex flex-col gap-1">
                <label className="text-xs text-gray-400 capitalize">
                  {field.replace("_", " ")}
                </label>
                <input
                  type="text"
                  value={editData[field] || ""}
                  onChange={(e) => setEditData({ ...editData, [field]: e.target.value })}
                  className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-white/40"
                />
              </div>
            ))}

            <div className="flex flex-col gap-1 col-span-2 sm:col-span-1">
              <label className="text-xs text-gray-400">Fecha</label>
              <input
                type="date"
                min={todayStr()}
                value={editData.date || ""}
                onChange={(e) => {
                  const newDate = e.target.value;
                  if (isClosed(newDate)) {
                    alert("El local está cerrado los domingos. Por favor elige otro día.");
                    setEditData({ ...editData, date: "", time: "" });
                  } else {
                    setEditData({ ...editData, date: newDate, time: "" });
                  }
                }}
                className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-white/40"
              />
              {editData.date && !isClosed(editData.date) && (
                <p className="text-gray-500 text-xs">
                  Horario:{" "}
                  {SCHEDULE[new Date(`${editData.date}T00:00:00`).getDay()]?.start} –{" "}
                  {SCHEDULE[new Date(`${editData.date}T00:00:00`).getDay()]?.end}
                </p>
              )}
            </div>
          </div>

          {/* TIME SLOT PICKER (editar) */}
          <div className="flex flex-col gap-2">
            <label className="text-xs text-gray-400">
              Hora — seleccionada:{" "}
              <span className="text-white font-semibold">{editData.time || "ninguna"}</span>
            </label>
            <SlotPicker
              date={editData.date}
              selectedTime={editData.time}
              appointments={appointments}
              excludeId={selected.id}
              onChange={(slot) => setEditData({ ...editData, time: slot })}
            />
          </div>

          {/* SERVICE SELECT */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-400">Servicio</label>
            <select
              value={editData.service_id || ""}
              onChange={(e) => {
                const service = services.find((s) => s.id === e.target.value);
                if (!service) return;
                setEditData({ ...editData, service_id: service.id, service_name: service.name, service_price: service.price });
              }}
              className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none"
            >
              <option value="" disabled>Seleccionar servicio</option>
              {services.map((s) => (
                <option key={s.id} value={s.id} className="text-black">{s.name}</option>
              ))}
            </select>
          </div>

          {/* BARBER SELECT */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-400">Barbero</label>
            <select
              value={editData.barber_id || ""}
              onChange={(e) => {
                const barber = barbers.find((b) => b.id === e.target.value);
                if (!barber) return;
                setEditData({ ...editData, barber_id: barber.id, barber_name: barber.name });
              }}
              className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none"
            >
              <option value="" disabled>Seleccionar barbero</option>
              {barbers.map((b) => (
                <option key={b.id} value={b.id} className="text-black">{b.name}</option>
              ))}
            </select>
          </div>

          <p className="text-sm text-gray-300">
            Precio: <span className="font-semibold text-white">${editData.service_price ?? "—"}</span>
          </p>

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleUpdate}
              className="bg-white text-black px-4 py-2 rounded-lg font-semibold hover:bg-gray-100"
            >
              Actualizar
            </button>
            <button
              onClick={() => handleDelete(selected.id)}
              className="bg-red-600 px-4 py-2 rounded-lg hover:bg-red-700"
            >
              Eliminar
            </button>
            <button
              onClick={() => setSelected(null)}
              className="text-gray-400 hover:text-white ml-auto"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Metric({ title, value }) {
  return (
    <div className="bg-white/10 rounded-xl p-4 text-center">
      <p className="text-xs text-gray-400 uppercase tracking-wide">{title}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}