"use client";
import { useEffect, useMemo, useState, useRef } from "react";
import { createPortal } from "react-dom";
import {
  collection, getDocs, deleteDoc, updateDoc, doc, addDoc, serverTimestamp,
} from "firebase/firestore";
import db from "@/lib/firebase/firestore";
import { format, isToday, isThisWeek } from "date-fns";
import { es } from "date-fns/locale";
import { Plus, Trash2, ChevronDown, ChevronUp, Check } from "lucide-react";
import emailjs from "@emailjs/browser";
import DarkCalendar from "@/components/ui/calendar";

const EMAILJS_SERVICE_ID         = "service_9pul3kl";
const EMAILJS_TEMPLATE_CONFIRMED = "template_hhi6zxr";
const EMAILJS_TEMPLATE_CANCELLED = "template_2y4ok6z";
const EMAILJS_PUBLIC_KEY         = "mMzuLzUZeh4Jl9Tmb";

const sendConfirmationEmail = async (appointment) => {
  try {
    await emailjs.send(
      EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_CONFIRMED,
      { client_name: appointment.client_name, client_email: appointment.client_email, barber_name: appointment.barber_name, service_name: appointment.service_name, date: appointment.date, time: appointment.time },
      EMAILJS_PUBLIC_KEY
    );
  } catch (err) { console.error("Error enviando correo de confirmación:", err); }
};

const sendCancellationEmail = async (appointment) => {
  try {
    await emailjs.send(
      EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_CANCELLED,
      { client_name: appointment.client_name, client_email: appointment.client_email, barber_name: appointment.barber_name, service_name: appointment.service_name, date: appointment.date, time: appointment.time },
      EMAILJS_PUBLIC_KEY
    );
  } catch (err) { console.error("Error enviando correo de cancelación:", err); }
};

const MONTHS = [
  { value: 0, label: "Enero" }, { value: 1, label: "Febrero" }, { value: 2, label: "Marzo" },
  { value: 3, label: "Abril" }, { value: 4, label: "Mayo" },    { value: 5, label: "Junio" },
  { value: 6, label: "Julio" }, { value: 7, label: "Agosto" },  { value: 8, label: "Septiembre" },
  { value: 9, label: "Octubre" },{ value: 10, label: "Noviembre" },{ value: 11, label: "Diciembre" },
];
const YEARS = [2026, 2027, 2028, 2029, 2030];

const SCHEDULE = {
  0: null,
  1: { start: "10:00 AM", end: "8:00 PM" }, 2: { start: "10:00 AM", end: "8:00 PM" },
  3: { start: "10:00 AM", end: "8:00 PM" }, 4: { start: "10:00 AM", end: "8:00 PM" },
  5: { start: "10:00 AM", end: "8:00 PM" }, 6: { start: "10:00 AM", end: "8:00 PM" },
};

const ALL_SLOTS = [
  "10:00 AM","10:30 AM","11:00 AM","11:30 AM","12:00 PM","12:30 PM",
  "1:00 PM","1:30 PM","2:00 PM","2:30 PM","3:00 PM","3:30 PM",
  "4:00 PM","4:30 PM","5:00 PM","5:30 PM","6:00 PM","6:30 PM",
  "7:00 PM","7:30 PM","8:00 PM",
];

const toMinutes = (slot) => {
  if (!slot) return 0;
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
  const startMin = toMinutes(schedule.start), endMin = toMinutes(schedule.end);
  return ALL_SLOTS.filter((s) => { const m = toMinutes(s); return m >= startMin && m <= endMin; });
};

const isClosed = (dateStr) => { if (!dateStr) return false; return new Date(`${dateStr}T00:00:00`).getDay() === 0; };

const isBarberDayOff = (dateStr, barberWorkingDays) => {
  if (!dateStr) return false;
  const day = new Date(`${dateStr}T00:00:00`).getDay();
  const workDays = Array.isArray(barberWorkingDays) && barberWorkingDays.length > 0
    ? barberWorkingDays : [1, 2, 3, 4, 5, 6];
  return !workDays.includes(day);
};

const todayStr = () => new Date().toISOString().split("T")[0];
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const EMPTY_CREATE = {
  client_name: "", client_email: "", client_phone: "", date: "", time: "",
  barber_id: "", barber_name: "", service_id: "", service_name: "", service_price: "",
};

/* ── Toast Modal ── */
function ToastModal({ open, type, onClose }) {
  if (!open) return null;
  const isConfirm = type === "confirmed";
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.85)" }}>
      <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl text-center">
        <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto ${isConfirm ? "bg-green-500/20" : "bg-red-500/20"}`}>
          {isConfirm ? <Check size={28} className="text-green-400" /> : <Trash2 size={28} className="text-red-400" />}
        </div>
        <h3 className="text-white font-bold text-xl">{isConfirm ? "¡Cita creada!" : "Cita eliminada"}</h3>
        <p className="text-gray-300 text-sm leading-relaxed">
          {isConfirm ? "Se ha enviado un correo de confirmación al cliente." : "Se ha enviado un correo de cancelación al cliente."}
          <br />
          <span className="text-gray-500">Si no lo visualiza, indícale que revise su carpeta de spam.</span>
        </p>
        <button onClick={onClose} className={`w-full py-2 rounded-lg font-semibold transition-colors ${isConfirm ? "bg-white text-black hover:bg-gray-100" : "bg-red-600 text-white hover:bg-red-700"}`}>
          Entendido
        </button>
      </div>
    </div>
  );
}

function Dropdown({ triggerLabel, items, selectedValue, onSelect }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-white/30 text-white hover:bg-white/10 transition-colors">
        <span>{triggerLabel}</span>
        <ChevronDown size={14} className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-[#111] border border-white/15 rounded-xl shadow-2xl overflow-hidden min-w-[180px]">
          {items.map((item) => {
            const isSelected = selectedValue === item.value;
            return (
              <button key={item.value} onClick={() => { onSelect(item.value); setOpen(false); }}
                className={`w-full flex items-center justify-between px-4 py-2.5 text-sm text-left transition-colors ${isSelected ? "bg-white text-black font-semibold" : "text-gray-200 hover:bg-white/10"}`}>
                <span>{item.label}</span>
                {isSelected && <Check size={13} className="ml-3 flex-shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function PeriodDropdown({ filterMode, selectedMonth, selectedYear, onChangeMode, onChangeMonth, onChangeYear }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);
  const triggerLabel = () => {
    if (filterMode === "day")   return "Hoy";
    if (filterMode === "week")  return "Semana";
    if (filterMode === "month") return MONTHS.find(m => m.value === selectedMonth)?.label || "Mes";
    if (filterMode === "year")  return String(selectedYear);
    return "Período";
  };
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-white/30 text-white hover:bg-white/10 transition-colors">
        <span>{triggerLabel()}</span>
        <ChevronDown size={14} className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-[#111] border border-white/15 rounded-xl shadow-2xl overflow-hidden min-w-[180px]">
          <button onClick={() => { onChangeMode("day"); setOpen(false); }}
            className={`w-full flex items-center justify-between px-4 py-2.5 text-sm text-left transition-colors ${filterMode === "day" ? "bg-white text-black font-semibold" : "text-gray-200 hover:bg-white/10"}`}>
            <span>Hoy</span>{filterMode === "day" && <Check size={13} className="ml-3" />}
          </button>
          <button onClick={() => { onChangeMode("week"); setOpen(false); }}
            className={`w-full flex items-center justify-between px-4 py-2.5 text-sm text-left transition-colors ${filterMode === "week" ? "bg-white text-black font-semibold" : "text-gray-200 hover:bg-white/10"}`}>
            <span>Semana</span>{filterMode === "week" && <Check size={13} className="ml-3" />}
          </button>
          <div>
            <button onClick={() => onChangeMode("month")}
              className={`w-full flex items-center justify-between px-4 py-2.5 text-sm text-left transition-colors ${filterMode === "month" ? "bg-white/10 text-white font-semibold" : "text-gray-200 hover:bg-white/10"}`}>
              <span>Mes</span><ChevronDown size={13} className="opacity-40" />
            </button>
            <div className="border-t border-white/10">
              {MONTHS.map((m) => {
                const isSelected = filterMode === "month" && selectedMonth === m.value;
                return (
                  <button key={m.value} onClick={() => { onChangeMode("month"); onChangeMonth(m.value); setOpen(false); }}
                    className={`w-full flex items-center justify-between pl-8 pr-4 py-2 text-sm text-left transition-colors ${isSelected ? "bg-white text-black font-semibold" : "text-gray-400 hover:bg-white/10 hover:text-white"}`}>
                    <span>{m.label}</span>{isSelected && <Check size={13} className="ml-3" />}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="border-t border-white/10">
            <button onClick={() => onChangeMode("year")}
              className={`w-full flex items-center justify-between px-4 py-2.5 text-sm text-left transition-colors ${filterMode === "year" ? "bg-white/10 text-white font-semibold" : "text-gray-200 hover:bg-white/10"}`}>
              <span>Año</span><ChevronDown size={13} className="opacity-40" />
            </button>
            <div className="border-t border-white/10">
              {YEARS.map((y) => {
                const isSelected = filterMode === "year" && selectedYear === y;
                return (
                  <button key={y} onClick={() => { onChangeMode("year"); onChangeYear(y); setOpen(false); }}
                    className={`w-full flex items-center justify-between pl-8 pr-4 py-2 text-sm text-left transition-colors ${isSelected ? "bg-white text-black font-semibold" : "text-gray-400 hover:bg-white/10 hover:text-white"}`}>
                    <span>{y}</span>{isSelected && <Check size={13} className="ml-3" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SlotPicker({ date, selectedTime, appointments, excludeId, onChange, serviceDuration = 30 }) {
  const slots = useMemo(() => {
    if (!date) return [];
    const valid = getSlotsForDate(date);
    const blocked = new Set();
    appointments.filter((a) => a.date === date && a.id !== excludeId).forEach((a) => {
      const startMin = toMinutes(a.time);
      const duration = Number(a.service_duration || a.duration || 30);
      ALL_SLOTS.forEach((slot) => { const slotMin = toMinutes(slot); if (slotMin >= startMin && slotMin < startMin + duration) blocked.add(slot); });
    });
    const day = new Date(`${date}T00:00:00`).getDay();
    const scheduleEndMin = toMinutes(SCHEDULE[day]?.end || "8:00 PM");
    return valid.map((slot) => {
      const startMin = toMinutes(slot), endMin = startMin + serviceDuration;
      const noRoom = endMin > scheduleEndMin;
      let conflicts = false, current = startMin;
      while (current < endMin) { const s = ALL_SLOTS.find(x => toMinutes(x) === current); if (s && blocked.has(s)) { conflicts = true; break; } current += 30; }
      return { slot, taken: noRoom || conflicts, reason: noRoom ? "No hay tiempo antes del cierre" : conflicts ? "Hora ocupada" : null };
    });
  }, [date, appointments, excludeId, serviceDuration]);

  if (!date)                     return <p className="text-gray-500 text-sm">Selecciona una fecha primero.</p>;
  if (isClosed(date))            return <p className="text-red-400 text-sm">Cerrado los domingos.</p>;
  if (!slots.length)             return <p className="text-gray-500 text-sm">No hay horarios disponibles.</p>;
  if (slots.every(s => s.taken)) return <p className="text-red-400 text-sm">No hay horas disponibles para este día.</p>;

  return (
    <>
      <div className="grid grid-cols-4 gap-2">
        {slots.map(({ slot, taken, reason }) => (
          <div key={slot} className="relative group">
            <button type="button" disabled={taken} onClick={() => !taken && onChange(slot)}
              className={`w-full py-2 rounded-lg text-sm font-medium transition-colors ${taken ? "bg-white/5 text-gray-600 cursor-not-allowed line-through" : selectedTime === slot ? "bg-white text-black" : "bg-white/10 text-white hover:bg-white/20 border border-white/10"}`}>
              {slot}
            </button>
            {taken && reason && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black border border-white/20 rounded-lg text-xs text-gray-300 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">{reason}</div>
            )}
          </div>
        ))}
      </div>
      <div className="flex gap-4 mt-1">
        <span className="flex items-center gap-1 text-xs text-gray-500"><span className="w-3 h-3 rounded bg-white/5 inline-block" /><span className="line-through">Ocupado</span></span>
        <span className="flex items-center gap-1 text-xs text-gray-500"><span className="w-3 h-3 rounded bg-white inline-block" /> Seleccionado</span>
      </div>
    </>
  );
}

export default function AppointmentsTab() {
  const [appointments, setAppointments] = useState([]);
  const [services, setServices]         = useState([]);
  const [barbers, setBarbers]           = useState([]);
  const [loading, setLoading]           = useState(true);

  const [filterMode, setFilterMode]         = useState("day");
  const [selectedMonth, setSelectedMonth]   = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear]     = useState(new Date().getFullYear());
  const [selectedBarber, setSelectedBarber] = useState("all");

  const [selected, setSelected]     = useState(null);
  const [editData, setEditData]     = useState({});
  const [showCreate, setShowCreate] = useState(false);
  const [createData, setCreateData] = useState(EMPTY_CREATE);
  const [saving, setSaving]         = useState(false);

  const [bulkMode, setBulkMode]         = useState(false);
  const [bulkSelected, setBulkSelected] = useState(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [collapsedBarbers, setCollapsedBarbers] = useState(new Set());

  const [toast, setToast] = useState({ open: false, type: "confirmed" });

  // delete modal — individual
  const [deleteModal, setDeleteModal] = useState({ open: false, appointmentId: null, appointmentLabel: "" });
  // bulk delete modal
  const [bulkDeleteModal, setBulkDeleteModal] = useState({ open: false });

  const fetchAll = async () => {
    const [aSnap, sSnap, bSnap] = await Promise.all([
      getDocs(collection(db, "appointments")),
      getDocs(collection(db, "services")),
      getDocs(collection(db, "barber")),
    ]);
    setAppointments(aSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    setServices(sSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    setBarbers(bSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    setLoading(false);
  };
  useEffect(() => { fetchAll(); }, []);

  const filteredAppointments = useMemo(() => {
    const filtered = appointments.filter((a) => {
      if (!a.date) return false;
      const date = new Date(`${a.date}T00:00:00`);
      if (filterMode === "day")   return isToday(date);
      if (filterMode === "week")  return isThisWeek(date);
      if (filterMode === "month") return date.getMonth() === selectedMonth && date.getFullYear() === new Date().getFullYear();
      if (filterMode === "year")  return date.getFullYear() === selectedYear;
      return true;
    });
    return filtered.sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return toMinutes(a.time) - toMinutes(b.time);
    });
  }, [appointments, filterMode, selectedMonth, selectedYear]);

  const groupedByBarber = useMemo(() => {
    const source = selectedBarber === "all"
      ? filteredAppointments
      : filteredAppointments.filter(a => a.barber_id === selectedBarber);
    const map = new Map();
    source.forEach((a) => {
      const key = a.barber_id || "sin_barbero";
      if (!map.has(key)) map.set(key, { barber_id: key, barber_name: a.barber_name || "Sin barbero", appointments: [] });
      map.get(key).appointments.push(a);
    });
    return [...map.values()];
  }, [filteredAppointments, selectedBarber]);

  const totalAppointments = filteredAppointments.length;
  const totalIncome = filteredAppointments.reduce((acc, a) => acc + (Number(a.service_price) || 0), 0);
  const avgIncome   = totalAppointments > 0 ? totalIncome / totalAppointments : 0;

  const toggleBulkMode = () => { setBulkMode(!bulkMode); setBulkSelected(new Set()); setSelected(null); };
  const toggleBulkSelect = (id) => { const next = new Set(bulkSelected); if (next.has(id)) next.delete(id); else next.add(id); setBulkSelected(next); };
  const selectAll = () => { if (bulkSelected.size === filteredAppointments.length) setBulkSelected(new Set()); else setBulkSelected(new Set(filteredAppointments.map(a => a.id))); };

  /* ── CREATE ── */
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!createData.date || !createData.time) return alert("Selecciona fecha y hora.");
    if (isClosed(createData.date)) return alert("El local está cerrado los domingos.");
    const selectedBarberData = barbers.find(b => b.id === createData.barber_id);
    const barberWorkingDays = selectedBarberData?.working_days || [1,2,3,4,5,6];
    if (isBarberDayOff(createData.date, barberWorkingDays)) return alert(`${selectedBarberData?.name || "El barbero"} no trabaja ese día.`);
    if (createData.client_email && !isValidEmail(createData.client_email)) return alert("El correo no es válido.");
    if (createData.client_phone && createData.client_phone.length < 8) return alert("El teléfono debe tener 8 dígitos.");
    setSaving(true);
    const service = services.find(s => s.id === createData.service_id);
    await addDoc(collection(db, "appointments"), {
      ...createData,
      client_phone: createData.client_phone ? `+506${createData.client_phone}` : "",
      service_price: Number(createData.service_price),
      service_duration: Number(service?.duration || 30),
      created_at: serverTimestamp(),
    });
    if (createData.client_email) await sendConfirmationEmail(createData);
    await fetchAll();
    setSaving(false);
    setShowCreate(false);
    setCreateData(EMPTY_CREATE);
    setToast({ open: true, type: "confirmed" });
  };

  /* ── DELETE individual ── */
  const handleDelete = (id) => {
    const appointment = appointments.find(a => a.id === id);
    const label = appointment ? `${appointment.client_name} — ${appointment.service_name}` : "esta cita";
    setDeleteModal({ open: true, appointmentId: id, appointmentLabel: label });
  };

  const handleDeleteConfirm = async () => {
    const { appointmentId } = deleteModal;
    const appointment = appointments.find(a => a.id === appointmentId);
    setDeleteModal({ open: false, appointmentId: null, appointmentLabel: "" });
    await deleteDoc(doc(db, "appointments", appointmentId));
    if (appointment?.client_email) await sendCancellationEmail(appointment);
    setSelected(null);
    fetchAll();
    setToast({ open: true, type: "cancelled" });
  };

  /* ── DELETE bulk ── */
  const handleBulkDelete = () => {
    if (!bulkSelected.size) return;
    setBulkDeleteModal({ open: true });
  };

  const handleBulkDeleteConfirm = async () => {
    setBulkDeleteModal({ open: false });
    setBulkDeleting(true);
    const toDelete = appointments.filter(a => bulkSelected.has(a.id));
    await Promise.all(toDelete.map(a => deleteDoc(doc(db, "appointments", a.id))));
    await Promise.all(toDelete.filter(a => a.client_email).map(a => sendCancellationEmail(a)));
    setBulkDeleting(false); setBulkMode(false); setBulkSelected(new Set());
    fetchAll();
    setToast({ open: true, type: "cancelled" });
  };

  const toggleCollapseBarber = (id) => { const next = new Set(collapsedBarbers); if (next.has(id)) next.delete(id); else next.add(id); setCollapsedBarbers(next); };

  const handleUpdate = async () => {
    const service = services.find(s => s.id === editData.service_id);
    await updateDoc(doc(db, "appointments", selected.id), {
      ...editData,
      service_duration: Number(service?.duration || editData.service_duration || 30),
    });
    setSelected(null);
    fetchAll();
  };

  if (loading) return <p className="text-white p-4">Cargando…</p>;

  const allSelected = bulkSelected.size === filteredAppointments.length && filteredAppointments.length > 0;
  const barberDropdownItems = [{ value: "all", label: "Todos" }, ...barbers.map(b => ({ value: b.id, label: b.name }))];
  const barberTriggerLabel = selectedBarber === "all" ? "Barbero" : barbers.find(b => b.id === selectedBarber)?.name || "Barbero";

  const createFormInvalid =
    saving ||
    !createData.client_name ||
    !createData.date ||
    !createData.time ||
    !createData.barber_id ||
    !createData.service_id ||
    (createData.client_email && !isValidEmail(createData.client_email)) ||
    (createData.client_phone && createData.client_phone.length < 8);

  return (
    <div className="p-4 space-y-6 text-white">

      <ToastModal
        open={toast.open}
        type={toast.type}
        onClose={() => setToast({ ...toast, open: false })}
      />

      {/* DELETE INDIVIDUAL MODAL */}
      {deleteModal.open && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.85)" }}>
          <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-red-500/15 flex items-center justify-center shrink-0">
                <Trash2 size={22} className="text-red-400" />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">Eliminar cita</h3>
                <p className="text-gray-400 text-xs">Esta acción no se puede deshacer</p>
              </div>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">
              ¿Estás seguro que deseas eliminar la cita de{" "}
              <span className="text-white font-semibold">"{deleteModal.appointmentLabel}"</span>?
              Se enviará un correo de cancelación al cliente.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setDeleteModal({ open: false, appointmentId: null, appointmentLabel: "" })}
                className="flex-1 border border-white/20 text-white py-2 rounded-lg hover:bg-white/10 transition-colors text-sm font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="flex-1 bg-red-600 text-white py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors text-sm"
              >
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* BULK DELETE MODAL */}
      {bulkDeleteModal.open && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.85)" }}>
          <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-red-500/15 flex items-center justify-center shrink-0">
                <Trash2 size={22} className="text-red-400" />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">Eliminar citas</h3>
                <p className="text-gray-400 text-xs">Esta acción no se puede deshacer</p>
              </div>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">
              ¿Estás seguro que deseas eliminar{" "}
              <span className="text-white font-semibold">{bulkSelected.size} cita{bulkSelected.size !== 1 ? "s" : ""}</span>?
              Se enviará un correo de cancelación a cada cliente.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setBulkDeleteModal({ open: false })}
                className="flex-1 border border-white/20 text-white py-2 rounded-lg hover:bg-white/10 transition-colors text-sm font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleBulkDeleteConfirm}
                className="flex-1 bg-red-600 text-white py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors text-sm"
              >
                Sí, eliminar {bulkSelected.size}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* METRICS */}
      <div className="grid grid-cols-3 gap-4">
        <Metric title="Citas"    value={totalAppointments} />
        <Metric title="Ingresos" value={`₡${totalIncome.toLocaleString("es-CR")}`} />
        <Metric title="Promedio" value={`₡${avgIncome.toLocaleString("es-CR", { maximumFractionDigits: 0 })}`} />
      </div>

      {/* FILTER BAR */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <PeriodDropdown
              filterMode={filterMode} selectedMonth={selectedMonth} selectedYear={selectedYear}
              onChangeMode={(m) => { setFilterMode(m); setBulkMode(false); setBulkSelected(new Set()); }}
              onChangeMonth={setSelectedMonth} onChangeYear={setSelectedYear}
            />
            <Dropdown triggerLabel={barberTriggerLabel} items={barberDropdownItems} selectedValue={selectedBarber} onSelect={setSelectedBarber} />
          </div>
          <div className="flex gap-2">
            <button onClick={toggleBulkMode}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition-colors ${bulkMode ? "bg-red-600 text-white hover:bg-red-700" : "border border-red-500/50 text-red-400 hover:bg-red-500/10"}`}>
              <Trash2 size={16} />
              {bulkMode ? "Cancelar" : "Eliminar citas"}
            </button>
            <button onClick={() => { setShowCreate(true); setSelected(null); setBulkMode(false); }}
              className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-xl font-semibold hover:bg-gray-100 transition-colors">
              <Plus size={16} /> Crear cita
            </button>
          </div>
        </div>

        {bulkMode && (
          <div className="flex items-center justify-between bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
            <div className="flex items-center gap-3">
              <button onClick={selectAll} className="flex items-center gap-2 text-sm text-white hover:text-gray-300">
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${allSelected ? "bg-white border-white" : "border-white/40"}`}>
                  {allSelected && <span className="text-black text-xs font-bold">✓</span>}
                </div>
                {allSelected ? "Deseleccionar todas" : "Seleccionar todas"}
              </button>
              <span className="text-gray-400 text-sm">{bulkSelected.size} seleccionada{bulkSelected.size !== 1 ? "s" : ""}</span>
            </div>
            <button onClick={handleBulkDelete} disabled={!bulkSelected.size || bulkDeleting}
              className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              {bulkDeleting ? "Eliminando…" : `Eliminar ${bulkSelected.size > 0 ? bulkSelected.size : ""}`}
            </button>
          </div>
        )}
      </div>

      {/* MODAL CREAR */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <h3 className="text-lg font-bold">Nueva Cita</h3>
            <form onSubmit={handleCreate} className="space-y-4">

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-gray-400">Nombre del cliente</label>
                  <input type="text" required value={createData.client_name}
                    onChange={e => { const val = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g, ""); setCreateData({...createData, client_name: val}); }}
                    className={iCls} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-gray-400">Correo</label>
                  <input type="text" value={createData.client_email}
                    onChange={e => setCreateData({...createData, client_email: e.target.value})}
                    className={iCls} />
                  {createData.client_email && !isValidEmail(createData.client_email) && (
                    <p className="text-red-400 text-xs">Correo inválido.</p>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-400">Teléfono</label>
                <div className="flex gap-2">
                  <span className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-gray-400 text-sm flex items-center">+506</span>
                  <input type="tel" placeholder="8 dígitos" value={createData.client_phone} maxLength={8}
                    onChange={e => { const val = e.target.value.replace(/\D/g, "").slice(0, 8); setCreateData({...createData, client_phone: val}); }}
                    className={`${iCls} flex-1`} />
                </div>
                {createData.client_phone && createData.client_phone.length < 8 && (
                  <p className="text-red-400 text-xs">El número debe tener 8 dígitos.</p>
                )}
              </div>

              <Field label="Barbero">
                <select required value={createData.barber_id} onChange={e => {
                  const b = barbers.find(x => x.id === e.target.value);
                  if (!b) return;
                  setCreateData({...createData, barber_id: b.id, barber_name: b.name, date: "", time: ""});
                }} className={sCls}>
                  <option value="" disabled>Seleccionar barbero</option>
                  {barbers.map(b => <option key={b.id} value={b.id} className="text-black">{b.name}</option>)}
                </select>
              </Field>

              <div className="flex flex-col gap-2">
                <label className="text-xs text-gray-400">
                  Fecha{createData.date && <span className="text-white ml-2 font-semibold">{format(new Date(`${createData.date}T00:00:00`), "PPP", { locale: es })}</span>}
                </label>
                {createData.barber_id ? (
                  <>
                    <DarkCalendar
                      value={createData.date ? new Date(`${createData.date}T00:00:00`) : null}
                      onChange={(date) => {
                        const barberData = barbers.find(b => b.id === createData.barber_id);
                        const workDays = barberData?.working_days || [1,2,3,4,5,6];
                        const dateStr = format(date, "yyyy-MM-dd");
                        if (isClosed(dateStr)) { alert("El local está cerrado los domingos."); }
                        else if (isBarberDayOff(dateStr, workDays)) { alert(`${barberData?.name || "El barbero"} no trabaja ese día.`); }
                        else { setCreateData({...createData, date: dateStr, time: ""}); }
                      }}
                      minDate={new Date()}
                      maxDate={new Date(new Date().setDate(new Date().getDate() + 30))}
                      tileDisabled={({ date }) => {
                        const barberData = barbers.find(b => b.id === createData.barber_id);
                        const workDays = barberData?.working_days || [1,2,3,4,5,6];
                        const day = date.getDay();
                        return day === 0 || !workDays.includes(day);
                      }}
                    />
                    {createData.date && (
                      <p className="text-gray-500 text-xs">
                        Horario: {SCHEDULE[new Date(`${createData.date}T00:00:00`).getDay()]?.start} – {SCHEDULE[new Date(`${createData.date}T00:00:00`).getDay()]?.end}
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-gray-500 text-sm">Selecciona un barbero primero.</p>
                )}
              </div>

              <Field label="Servicio">
                <select required value={createData.service_id} onChange={e => { const s = services.find(x => x.id === e.target.value); if (!s) return; setCreateData({...createData, service_id:s.id, service_name:s.name, service_price:s.price, time:""}); }} className={sCls}>
                  <option value="" disabled>Seleccionar servicio</option>
                  {services.map(s => <option key={s.id} value={s.id} className="text-black">{s.name}</option>)}
                </select>
              </Field>

              <Field label="Precio"><div className={iCls}>{createData.service_price ? `₡${Number(createData.service_price).toLocaleString("es-CR")}` : "—"}</div></Field>

              <div className="flex flex-col gap-2">
                <label className="text-xs text-gray-400">Hora — seleccionada: <span className="text-white font-semibold">{createData.time || "ninguna"}</span></label>
                <SlotPicker date={createData.date} selectedTime={createData.time} appointments={appointments} excludeId={null} onChange={slot => setCreateData({...createData, time:slot})} serviceDuration={Number(services.find(s => s.id === createData.service_id)?.duration || 30)} />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowCreate(false); setCreateData(EMPTY_CREATE); }} className="flex-1 border border-white/20 text-white py-2 rounded-lg hover:bg-white/10 transition-colors">Cancelar</button>
                <button type="submit" disabled={createFormInvalid} className="flex-1 bg-white text-black py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  {saving ? "Guardando…" : "Crear cita"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LIST */}
      <div className="space-y-4">
        {filteredAppointments.length === 0 && <p className="text-gray-400">No hay citas para este período.</p>}
        {groupedByBarber.map(({ barber_id, barber_name, appointments: bAppts }) => (
          <div key={barber_id} className="border border-white/10 rounded-2xl overflow-hidden">
            <button onClick={() => toggleCollapseBarber(barber_id)} className="w-full flex items-center justify-between px-5 py-4 bg-white/5 hover:bg-white/10 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">{barber_name.charAt(0).toUpperCase()}</div>
                <div className="text-left">
                  <p className="font-semibold">{barber_name}</p>
                  <p className="text-xs text-gray-400">{bAppts.length} cita{bAppts.length !== 1 ? "s" : ""}</p>
                </div>
              </div>
              {collapsedBarbers.has(barber_id) ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
            </button>

            {!collapsedBarbers.has(barber_id) && (
              <div className="p-3 space-y-2">
                {bAppts.map((a) => (
                  <div key={a.id}>
                    <div className={`bg-white/10 rounded-xl p-4 flex justify-between items-center transition-colors ${bulkMode && bulkSelected.has(a.id) ? "bg-red-500/20 border border-red-500/40" : ""}`}>
                      <div className="flex items-center gap-3">
                        {bulkMode && (
                          <button onClick={() => toggleBulkSelect(a.id)} className={`w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors ${bulkSelected.has(a.id) ? "bg-red-500 border-red-500" : "border-white/40 hover:border-white"}`}>
                            {bulkSelected.has(a.id) && <span className="text-white text-xs font-bold">✓</span>}
                          </button>
                        )}
                        <div>
                          <p className="font-semibold">{a.client_name} — {a.service_name}</p>
                          <p className="text-sm text-gray-300">{format(new Date(`${a.date}T00:00:00`), "PPP", { locale: es })} · {a.time}</p>
                        </div>
                      </div>
                      {!bulkMode ? (
                        <button onClick={() => { if (selected?.id === a.id) setSelected(null); else { setSelected(a); setEditData(a); setShowCreate(false); } }} className="text-sm underline hover:text-gray-300">
                          {selected?.id === a.id ? "Cerrar" : "Ver detalles"}
                        </button>
                      ) : (
                        <button onClick={() => toggleBulkSelect(a.id)} className="text-sm text-gray-400 hover:text-white">{bulkSelected.has(a.id) ? "Deseleccionar" : "Seleccionar"}</button>
                      )}
                    </div>

                    {!bulkMode && selected?.id === a.id && (
                      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4 mt-2">
                        <h2 className="text-lg font-bold">Detalles de la cita</h2>

                        <div className="grid grid-cols-2 gap-3">
                          <Field label="Nombre"><input type="text" value={editData.client_name || ""} onChange={e => setEditData({...editData, client_name:e.target.value})} className={iCls2} /></Field>
                          <Field label="Correo"><input type="email" value={editData.client_email || editData.email || ""} onChange={e => setEditData({...editData, client_email:e.target.value, email:e.target.value})} className={iCls2} /></Field>
                          <Field label="Teléfono" className="col-span-2 sm:col-span-1"><input type="tel" value={editData.client_phone || ""} onChange={e => setEditData({...editData, client_phone:e.target.value})} className={iCls2} /></Field>
                        </div>

                        <Field label="Barbero">
                          <select value={editData.barber_id || ""} onChange={e => { const b = barbers.find(x => x.id === e.target.value); if (!b) return; setEditData({...editData, barber_id:b.id, barber_name:b.name, date:"", time:""}); }} className={sCls2}>
                            <option value="" disabled>Seleccionar barbero</option>
                            {barbers.map(b => <option key={b.id} value={b.id} className="text-black">{b.name}</option>)}
                          </select>
                        </Field>

                        <Field label="Servicio">
                          <select value={editData.service_id || ""} onChange={e => { const s = services.find(x => x.id === e.target.value); if (!s) return; setEditData({...editData, service_id:s.id, service_name:s.name, service_price:s.price, service_duration:s.duration, time:""}); }} className={sCls2}>
                            <option value="" disabled>Seleccionar servicio</option>
                            {services.map(s => <option key={s.id} value={s.id} className="text-black">{s.name}</option>)}
                          </select>
                        </Field>

                        <p className="text-sm text-gray-300">Precio: <span className="font-semibold text-white">{editData.service_price ? `₡${Number(editData.service_price).toLocaleString("es-CR")}` : "—"}</span></p>

                        <div className="flex flex-col gap-2">
                          <label className="text-xs text-gray-400">
                            Fecha{editData.date && <span className="text-white ml-2 font-semibold">{format(new Date(`${editData.date}T00:00:00`), "PPP", { locale: es })}</span>}
                          </label>
                          {editData.barber_id ? (
                            <>
                              <DarkCalendar
                                value={editData.date ? new Date(`${editData.date}T00:00:00`) : null}
                                onChange={(date) => {
                                  const barberData = barbers.find(b => b.id === editData.barber_id);
                                  const workDays = barberData?.working_days || [1,2,3,4,5,6];
                                  const dateStr = format(date, "yyyy-MM-dd");
                                  if (isClosed(dateStr)) { alert("El local está cerrado los domingos."); }
                                  else if (isBarberDayOff(dateStr, workDays)) { alert(`${barberData?.name || "El barbero"} no trabaja ese día.`); }
                                  else { setEditData({...editData, date: dateStr, time: ""}); }
                                }}
                                minDate={new Date()}
                                maxDate={new Date(new Date().setDate(new Date().getDate() + 30))}
                                tileDisabled={({ date }) => {
                                  const barberData = barbers.find(b => b.id === editData.barber_id);
                                  const workDays = barberData?.working_days || [1,2,3,4,5,6];
                                  const day = date.getDay();
                                  return day === 0 || !workDays.includes(day);
                                }}
                              />
                              {editData.date && (
                                <p className="text-gray-500 text-xs">
                                  Horario: {SCHEDULE[new Date(`${editData.date}T00:00:00`).getDay()]?.start} – {SCHEDULE[new Date(`${editData.date}T00:00:00`).getDay()]?.end}
                                </p>
                              )}
                            </>
                          ) : (
                            <p className="text-gray-500 text-sm">Selecciona un barbero primero.</p>
                          )}
                        </div>

                        <div className="flex flex-col gap-2">
                          <label className="text-xs text-gray-400">Hora — seleccionada: <span className="text-white font-semibold">{editData.time || "ninguna"}</span></label>
                          <SlotPicker date={editData.date} selectedTime={editData.time} appointments={appointments} excludeId={selected.id} onChange={slot => setEditData({...editData, time:slot})} serviceDuration={Number(services.find(s => s.id === editData.service_id)?.duration || editData.service_duration || 30)} />
                        </div>

                        <div className="flex gap-3 pt-2">
                          <button onClick={handleUpdate} className="bg-white text-black px-4 py-2 rounded-lg font-semibold hover:bg-gray-100">Actualizar</button>
                          <button onClick={() => handleDelete(selected.id)} className="bg-red-600 px-4 py-2 rounded-lg hover:bg-red-700">Eliminar</button>
                          <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-white ml-auto">Cerrar</button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const iCls  = "bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-white/30 w-full";
const iCls2 = "bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-white/40 w-full";
const sCls  = "bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none w-full";
const sCls2 = "bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none w-full";

function Field({ label, children, className = "" }) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label className="text-xs text-gray-400">{label}</label>
      {children}
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