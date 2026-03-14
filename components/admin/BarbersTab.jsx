"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  collection, getDocs, addDoc, deleteDoc, updateDoc, doc, serverTimestamp, query, where,
} from "firebase/firestore";
import db from "@/lib/firebase/firestore";
import { Plus, Edit, Trash2, Eye, EyeOff, Clock } from "lucide-react";
import emailjs from "@emailjs/browser";

const EMAILJS_SERVICE_ID         = "service_9pul3kl";
const EMAILJS_TEMPLATE_CANCELLED = "template_2y4ok6z";
const EMAILJS_PUBLIC_KEY         = "mMzuLzUZeh4Jl9Tmb";

const sendCancellationEmail = async (appointment) => {
  if (!appointment?.client_email) return;
  try {
    await emailjs.send(
      EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_CANCELLED,
      {
        client_name:  appointment.client_name,
        client_email: appointment.client_email,
        barber_name:  appointment.barber_name,
        service_name: appointment.service_name,
        date:         appointment.date,
        time:         appointment.time,
      },
      EMAILJS_PUBLIC_KEY
    );
  } catch (err) { console.error("Error enviando correo de cancelación:", err); }
};

const DAYS = [
  { value: 1, label: "Lun" },
  { value: 2, label: "Mar" },
  { value: 3, label: "Mié" },
  { value: 4, label: "Jue" },
  { value: 5, label: "Vie" },
  { value: 6, label: "Sáb" },
];

const DEFAULT_WORKING_DAYS = [1, 2, 3, 4, 5, 6];

const formatWorkingDays = (days) => {
  if (!Array.isArray(days) || days.length === 0) return "Sin horario";
  const sorted = [...days].sort((a, b) => a - b);
  const dayNames = { 1: "Lunes", 2: "Martes", 3: "Miércoles", 4: "Jueves", 5: "Viernes", 6: "Sábado" };
  const isConsecutive = sorted.every((d, i) => i === 0 || d === sorted[i - 1] + 1);
  if (isConsecutive && sorted.length > 1) {
    return `${dayNames[sorted[0]]} a ${dayNames[sorted[sorted.length - 1]]}`;
  }
  return sorted.map(d => dayNames[d]).join(", ");
};

const EMPTY_FORM = {
  name: "", role: "", experience: "", quote: "", image_url: "",
  specialties: "", visible: true, working_days: DEFAULT_WORKING_DAYS,
};

/* ─── Confirm Modal ─── */
function ConfirmModal({ open, title, message, onConfirm, onCancel, confirmLabel = "Continuar", danger = false }) {
  if (!open) return null;
  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.85)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div
        className="bg-[#1a1a1a] border border-white/10 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-white font-bold text-lg">{title}</h3>
        <p className="text-gray-300 text-sm leading-relaxed">{message}</p>
        <div className="flex gap-3 pt-2">
          <button onClick={onCancel} className="flex-1 border border-white/20 text-white py-2 rounded-lg hover:bg-white/10 transition-colors text-sm font-medium">Cancelar</button>
          <button onClick={onConfirm} className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${danger ? "bg-red-600 text-white hover:bg-red-700" : "bg-white text-black hover:bg-gray-100"}`}>{confirmLabel}</button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function BarbersTab() {
  const [barbers, setBarbers]             = useState([]);
  const [loading, setLoading]             = useState(true);
  const [open, setOpen]                   = useState(false);
  const [editingBarber, setEditingBarber] = useState(null);
  const [formData, setFormData]           = useState(EMPTY_FORM);
  const [saving, setSaving]               = useState(false);

  const [confirmModal, setConfirmModal] = useState({
    open: false, title: "", message: "", confirmLabel: "Continuar", danger: false, onConfirm: null,
  });

  const [conflictModal, setConflictModal] = useState({
    open: false, conflicts: [], pendingData: null, barberId: null, barberName: "",
  });

  const showConfirm = ({ title, message, confirmLabel = "Continuar", danger = false, onConfirm }) => {
    setConfirmModal({ open: true, title, message, confirmLabel, danger, onConfirm });
  };

  const closeConfirm = () => setConfirmModal((prev) => ({ ...prev, open: false, onConfirm: null }));

  /* ── FETCH ── */
  const fetchBarbers = async () => {
    const snap = await getDocs(collection(db, "barber"));
    setBarbers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    setLoading(false);
  };

  useEffect(() => { fetchBarbers(); }, []);

  /* ── TOGGLE VISIBILITY ── */
  const handleToggleVisibility = (barber) => {
    if (barber.visible !== false) {
      showConfirm({
        title: "Ocultar barbero",
        message: "Este barbero no será mostrado en la página principal, estará oculto. El barbero se mantendrá guardado en la base de datos y podrás hacerlo visible nuevamente cuando quieras. ¿Desea continuar?",
        confirmLabel: "Continuar",
        danger: false,
        onConfirm: async () => {
          await updateDoc(doc(db, "barber", barber.id), { visible: false });
          fetchBarbers();
          closeConfirm();
        },
      });
    } else {
      updateDoc(doc(db, "barber", barber.id), { visible: true }).then(fetchBarbers);
    }
  };

  /* ── DELETE ── */
  const handleDelete = async (barber) => {
    const today = new Date().toISOString().split("T")[0];
    const apptQuery = query(collection(db, "appointments"), where("barber_id", "==", barber.id));
    const apptSnap = await getDocs(apptQuery);
    const futureLinked = apptSnap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((a) => a.date >= today);

    if (futureLinked.length > 0) {
      showConfirm({
        title: "Eliminar barbero",
        message: `${barber.name} tiene ${futureLinked.length} cita${futureLinked.length !== 1 ? "s" : ""} a futuro asignada${futureLinked.length !== 1 ? "s" : ""}. Al eliminarlo, esas citas serán canceladas y los horarios liberados. ¿Estás seguro que quieres continuar?`,
        confirmLabel: "Sí, eliminar",
        danger: true,
        onConfirm: async () => {
          await Promise.all(futureLinked.map((a) => deleteDoc(doc(db, "appointments", a.id))));
          await Promise.all(futureLinked.map((a) => sendCancellationEmail(a)));
          await deleteDoc(doc(db, "barber", barber.id));
          fetchBarbers();
          closeConfirm();
        },
      });
    } else {
      showConfirm({
        title: "Eliminar barbero",
        message: `¿Estás seguro de eliminar a ${barber.name}? Esta acción no se puede deshacer.`,
        confirmLabel: "Sí, eliminar",
        danger: true,
        onConfirm: async () => {
          await deleteDoc(doc(db, "barber", barber.id));
          fetchBarbers();
          closeConfirm();
        },
      });
    }
  };

  /* ── HELPERS ── */
  const handleClose = () => { setOpen(false); setEditingBarber(null); setFormData(EMPTY_FORM); };

  const handleEdit = (barber) => {
    setEditingBarber(barber);
    setFormData({
      name: barber.name || "",
      role: barber.role || "",
      experience: barber.experience || "",
      quote: barber.quote || "",
      image_url: barber.image_url || "",
      specialties: Array.isArray(barber.specialties) ? barber.specialties.join(", ") : "",
      visible: barber.visible !== false,
      working_days: Array.isArray(barber.working_days) ? barber.working_days : DEFAULT_WORKING_DAYS,
    });
    setOpen(true);
  };

  const toggleDay = (day) => {
    const current = formData.working_days;
    if (current.includes(day)) {
      setFormData({ ...formData, working_days: current.filter(d => d !== day) });
    } else {
      setFormData({ ...formData, working_days: [...current, day].sort((a, b) => a - b) });
    }
  };

  /* ── SUBMIT ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    const barberData = {
      ...formData,
      specialties: formData.specialties.split(",").map((s) => s.trim()).filter(Boolean),
    };

    if (editingBarber) {
      const today = new Date().toISOString().split("T")[0];
      const apptQuery = query(collection(db, "appointments"), where("barber_id", "==", editingBarber.id));
      const apptSnap = await getDocs(apptQuery);
      const futureAppts = apptSnap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(a => a.date >= today);

      const conflicting = futureAppts.filter(a => {
        const day = new Date(`${a.date}T00:00:00`).getDay();
        return !barberData.working_days.includes(day);
      });

      if (conflicting.length > 0) {
        setSaving(false);
        handleClose();
        setConflictModal({
          open: true,
          conflicts: conflicting,
          pendingData: barberData,
          barberId: editingBarber.id,
          barberName: editingBarber.name,
        });
        return;
      }

      await updateDoc(doc(db, "barber", editingBarber.id), barberData);
    } else {
      await addDoc(collection(db, "barber"), { ...barberData, created_date: serverTimestamp() });
    }

    await fetchBarbers();
    setSaving(false);
    handleClose();
  };

  /* ── CONFLICT CONFIRM ── */
  const handleConflictConfirm = async () => {
    const { conflicts, pendingData, barberId } = conflictModal;
    setConflictModal({ open: false, conflicts: [], pendingData: null, barberId: null, barberName: "" });
    setSaving(true);
    await Promise.all(conflicts.map(a => deleteDoc(doc(db, "appointments", a.id))));
    await Promise.all(conflicts.filter(a => a.client_email).map(a => sendCancellationEmail(a)));
    await updateDoc(doc(db, "barber", barberId), pendingData);
    await fetchBarbers();
    setSaving(false);
  };

  if (loading) return <p className="text-white p-4">Cargando…</p>;

  return (
    <div className="p-4 space-y-6 text-white">

      <ConfirmModal
        open={confirmModal.open}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmLabel={confirmModal.confirmLabel}
        danger={confirmModal.danger}
        onConfirm={confirmModal.onConfirm}
        onCancel={closeConfirm}
      />

      {/* CONFLICT MODAL */}
      {conflictModal.open && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.92)" }}>
          <div className="bg-[#1a1a1a] border border-yellow-500/30 rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl">

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-yellow-500/15 flex items-center justify-center shrink-0">
                <span className="text-2xl">⚠️</span>
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">Conflicto de horario</h3>
                <p className="text-yellow-400 text-xs font-medium">El nuevo horario afecta citas existentes</p>
              </div>
            </div>

            <p className="text-gray-300 text-sm leading-relaxed">
              El nuevo horario de <span className="text-white font-semibold">{conflictModal.barberName}</span> entra en conflicto con{" "}
              <span className="text-yellow-400 font-semibold">
                {conflictModal.conflicts.length} cita{conflictModal.conflicts.length !== 1 ? "s" : ""} agendada{conflictModal.conflicts.length !== 1 ? "s" : ""}
              </span>.
              {" "}Estas citas caen en días que ya no forman parte del horario.
            </p>

            <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
              {conflictModal.conflicts.map((a, i) => (
                <div key={a.id} className={`px-4 py-3 flex justify-between items-center text-sm ${i !== 0 ? "border-t border-white/5" : ""}`}>
                  <div>
                    <p className="text-white font-medium">{a.client_name}</p>
                    <p className="text-gray-400 text-xs">{a.service_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-300 text-xs">{a.date}</p>
                    <p className="text-gray-500 text-xs">{a.time}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
              <p className="text-red-400 text-xs leading-relaxed">
                <span className="font-semibold">Al continuar:</span> estas citas serán eliminadas permanentemente y se enviará un correo de cancelación a cada cliente. Deberás crear nuevas citas desde cero.
              </p>
            </div>

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setConflictModal({ open: false, conflicts: [], pendingData: null, barberId: null, barberName: "" })}
                className="flex-1 border border-white/20 text-white py-2.5 rounded-lg hover:bg-white/10 transition-colors text-sm font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleConflictConfirm}
                className="flex-1 bg-red-600 text-white py-2.5 rounded-lg font-semibold hover:bg-red-700 transition-colors text-sm"
              >
                Sí, actualizar y eliminar citas
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Barberos</h2>
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-xl font-semibold hover:bg-gray-100 transition-colors"
        >
          <Plus size={18} />
          Agregar Barbero
        </button>
      </div>

      {/* GRID */}
      {barbers.length === 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-2xl py-12 text-center">
          <p className="text-gray-400">No hay barberos registrados</p>
          <p className="text-gray-500 text-sm mt-2">Agrega tu primer barbero para comenzar</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {barbers.map((barber) => (
            <div
              key={barber.id}
              className={`border rounded-2xl overflow-visible flex flex-col transition-opacity ${
                barber.visible === false ? "opacity-50 border-white/5 bg-white/5" : "border-white/10 bg-white/5"
              }`}
            >
              {barber.image_url && (
                <div className="relative rounded-t-2xl overflow-hidden">
                  <img src={barber.image_url} alt={barber.name} className="w-full h-48 object-cover" />
                  <div className="absolute top-2 right-2">
                    {barber.visible === false ? (
                      <span className="flex items-center gap-1 bg-black/70 text-gray-400 text-xs px-2 py-1 rounded-full">
                        <EyeOff size={12} /> Oculto
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
                        <Eye size={12} /> Visible
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div className="p-4 flex flex-col flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-white font-semibold text-lg leading-tight">{barber.name}</h3>
                    <p className="text-gray-300 text-sm mt-1">{barber.role}</p>
                  </div>

                  <div className="flex gap-2 shrink-0">
                    {/* OJO */}
                    <div className="relative group">
                      <button onClick={() => handleToggleVisibility(barber)} className={`transition-colors ${barber.visible === false ? "text-gray-600 hover:text-white" : "text-white hover:text-gray-400"}`}>
                        {barber.visible === false ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black border border-white/20 rounded-lg text-xs text-gray-300 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                        {barber.visible === false ? "Mostrar" : "Ocultar"}
                      </span>
                    </div>

                    {/* LÁPIZ */}
                    <div className="relative group">
                      <button onClick={() => handleEdit(barber)} className="text-gray-400 hover:text-white transition-colors">
                        <Edit size={18} />
                      </button>
                      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black border border-white/20 rounded-lg text-xs text-gray-300 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                        Editar
                      </span>
                    </div>

                    {/* BASURERO */}
                    <div className="relative group">
                      <button onClick={() => handleDelete(barber)} className="text-gray-400 hover:text-red-400 transition-colors">
                        <Trash2 size={18} />
                      </button>
                      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black border border-white/20 rounded-lg text-xs text-gray-300 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                        Eliminar
                      </span>
                    </div>
                  </div>
                </div>

                {barber.experience && (
                  <p className="text-gray-400 text-sm mt-2">Experiencia: {barber.experience}</p>
                )}

                {Array.isArray(barber.specialties) && barber.specialties.length > 0 && (
                  <div className="mt-2">
                    <p className="text-gray-500 text-xs mb-1">Especialidades:</p>
                    <div className="flex flex-wrap gap-1">
                      {barber.specialties.map((s, idx) => (
                        <span key={idx} className="text-xs bg-white/10 text-white px-2 py-1 rounded-lg">{s}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* HORARIO */}
                <div className="mt-3 pt-3 border-t border-white/10">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock size={12} className="text-gray-500" />
                    <p className="text-gray-500 text-xs font-medium">Horario</p>
                  </div>
                  <p className="text-white text-sm font-medium">
                    {formatWorkingDays(barber.working_days || DEFAULT_WORKING_DAYS)}
                  </p>
                  <p className="text-gray-400 text-xs mt-0.5">10:00 AM – 8:00 PM</p>
                </div>

                {barber.quote && (
                  <p className="text-gray-500 text-xs italic mt-2">"{barber.quote}"</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <h3 className="text-lg font-bold text-white">
              {editingBarber ? "Editar Barbero" : "Nuevo Barbero"}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-gray-400">Nombre</label>
                  <input type="text" required value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-white/30" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-gray-400">Rol</label>
                  <input type="text" required placeholder="ej: Master Barber" value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-white/30" />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-400">Experiencia</label>
                <input type="text" placeholder="ej: 5 años" value={formData.experience}
                  onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                  className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-white/30" />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-400">Especialidades (separadas por comas)</label>
                <input type="text" placeholder="ej: Fades, Cortes clásicos, Diseño de barba" value={formData.specialties}
                  onChange={(e) => setFormData({ ...formData, specialties: e.target.value })}
                  className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-white/30" />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-400">Frase personal</label>
                <textarea rows={2} placeholder="Una frase que represente al barbero" value={formData.quote}
                  onChange={(e) => setFormData({ ...formData, quote: e.target.value })}
                  className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-white/30 resize-none" />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-400">URL de Imagen</label>
                <input type="text" placeholder="https://..." value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-white/30" />
              </div>

              {/* DÍAS DE TRABAJO */}
              <div className="flex flex-col gap-2">
                <label className="text-xs text-gray-400">Días laborales</label>
                <div className="grid grid-cols-6 gap-2">
                  {DAYS.map(({ value, label }) => {
                    const active = formData.working_days.includes(value);
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => toggleDay(value)}
                        className={`py-2 rounded-lg text-sm font-semibold transition-colors border ${
                          active
                            ? "bg-white text-black border-white"
                            : "bg-white/5 text-gray-500 border-white/10 hover:bg-white/10 hover:text-white"
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
                <p className="text-gray-500 text-xs">Horas: 10:00 AM – 8:00 PM (fijas)</p>
              </div>

              {/* VISIBLE */}
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => setFormData({ ...formData, visible: !formData.visible })}
                  className={`w-9 h-5 rounded-full transition-colors relative shrink-0 ${formData.visible ? "bg-white" : "bg-white/20"}`}>
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full transition-all ${formData.visible ? "bg-black left-4" : "bg-white left-0.5"}`} />
                </button>
                <label className="text-gray-300 text-sm flex items-center gap-2">
                  {formData.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                  {formData.visible ? "Visible en la web" : "Oculto en la web"}
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={handleClose}
                  className="flex-1 border border-white/20 text-white py-2 rounded-lg hover:bg-white/10 transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={saving || !formData.name || !formData.role || !formData.image_url || formData.working_days.length === 0}
                  className="flex-1 bg-white text-black py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  {saving ? "Guardando…" : editingBarber ? "Actualizar" : "Crear"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}