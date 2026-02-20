"use client";
import { useEffect, useState } from "react";
import {
  collection, getDocs, addDoc, deleteDoc, updateDoc, doc, serverTimestamp,
} from "firebase/firestore";
import db from "@/lib/firebase/firestore";
import { Plus, Edit, Trash2, Clock, Eye, EyeOff } from "lucide-react";

const DAYS = [
  { key: "monday",    label: "Lunes"     },
  { key: "tuesday",   label: "Martes"    },
  { key: "wednesday", label: "Miércoles" },
  { key: "thursday",  label: "Jueves"    },
  { key: "friday",    label: "Viernes"   },
  { key: "saturday",  label: "Sábado"    },
  { key: "sunday",    label: "Domingo"   },
];

const EMPTY_WORKING_DAYS = {
  monday:    { enabled: false, start: "09:00", end: "18:00" },
  tuesday:   { enabled: false, start: "09:00", end: "18:00" },
  wednesday: { enabled: false, start: "09:00", end: "18:00" },
  thursday:  { enabled: false, start: "09:00", end: "18:00" },
  friday:    { enabled: false, start: "09:00", end: "18:00" },
  saturday:  { enabled: false, start: "09:00", end: "18:00" },
  sunday:    { enabled: false, start: "09:00", end: "18:00" },
};

const EMPTY_FORM = {
  name: "",
  role: "",
  experience: "",
  quote: "",
  image_url: "",
  specialties: "",
  visible: true,
  working_days: EMPTY_WORKING_DAYS,
};

export default function BarbersTab() {
  const [barbers, setBarbers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingBarber, setEditingBarber] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  /* ---------------- FETCH ---------------- */
  const fetchBarbers = async () => {
    const snap = await getDocs(collection(db, "barber"));
    setBarbers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    setLoading(false);
  };

  useEffect(() => { fetchBarbers(); }, []);

  /* ---------------- TOGGLE VISIBILITY ---------------- */
  const handleToggleVisibility = async (barber) => {
    await updateDoc(doc(db, "barber", barber.id), { visible: !barber.visible });
    fetchBarbers();
  };

  /* ---------------- HELPERS ---------------- */
  const handleClose = () => {
    setOpen(false);
    setEditingBarber(null);
    setFormData(EMPTY_FORM);
  };

  const handleEdit = (barber) => {
    setEditingBarber(barber);
    setFormData({
      name: barber.name || "",
      role: barber.role || "",
      experience: barber.experience || "",
      quote: barber.quote || "",
      image_url: barber.image_url || "",
      specialties: Array.isArray(barber.specialties)
        ? barber.specialties.join(", ")
        : "",
      visible: barber.visible !== false,
      working_days: barber.working_days || EMPTY_WORKING_DAYS,
    });
    setOpen(true);
  };

  const updateWorkingDay = (day, field, value) => {
    setFormData({
      ...formData,
      working_days: {
        ...formData.working_days,
        [day]: { ...formData.working_days[day], [field]: value },
      },
    });
  };

  /* ---------------- SUBMIT ---------------- */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    const barberData = {
      ...formData,
      specialties: formData.specialties
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    };

    if (editingBarber) {
      await updateDoc(doc(db, "barber", editingBarber.id), barberData);
    } else {
      await addDoc(collection(db, "barber"), {
        ...barberData,
        created_date: serverTimestamp(),
      });
    }

    await fetchBarbers();
    setSaving(false);
    handleClose();
  };

  /* ---------------- DELETE ---------------- */
  const handleDelete = async (id) => {
    if (!confirm("¿Estás seguro de eliminar este barbero?")) return;
    await deleteDoc(doc(db, "barber", id));
    fetchBarbers();
  };

  if (loading) return <p className="text-white p-4">Cargando…</p>;

  return (
    <div className="p-4 space-y-6 text-white">

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

      {/* BARBERS GRID */}
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
              className={`border rounded-2xl overflow-hidden flex flex-col transition-opacity ${
                barber.visible === false
                  ? "opacity-50 border-white/5 bg-white/5"
                  : "border-white/10 bg-white/5"
              }`}
            >
              {barber.image_url && (
                <div className="relative">
                  <img
                    src={barber.image_url}
                    alt={barber.name}
                    className="w-full h-48 object-cover"
                  />
                  {/* VISIBILITY BADGE */}
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
                    <h3 className="text-white font-semibold text-lg leading-tight">
                      {barber.name}
                    </h3>
                    <p className="text-gray-300 text-sm mt-1">{barber.role}</p>
                  </div>

                  {/* ACTIONS */}
                  <div className="flex gap-2 shrink-0">
                    {/* EYE TOGGLE */}
                    <button
                      onClick={() => handleToggleVisibility(barber)}
                      className={`transition-colors ${
                        barber.visible === false
                          ? "text-gray-600 hover:text-white"
                          : "text-white hover:text-gray-400"
                      }`}
                      title={barber.visible === false ? "Mostrar barbero" : "Ocultar barbero"}
                    >
                      {barber.visible === false
                        ? <EyeOff size={18} />
                        : <Eye size={18} />
                      }
                    </button>
                    <button
                      onClick={() => handleEdit(barber)}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(barber.id)}
                      className="text-gray-400 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                {barber.experience && (
                  <p className="text-gray-400 text-sm mt-2">
                    Experiencia: {barber.experience}
                  </p>
                )}

                {Array.isArray(barber.specialties) && barber.specialties.length > 0 && (
                  <div className="mt-2">
                    <p className="text-gray-500 text-xs mb-1">Especialidades:</p>
                    <div className="flex flex-wrap gap-1">
                      {barber.specialties.map((s, idx) => (
                        <span key={idx} className="text-xs bg-white/10 text-white px-2 py-1 rounded-lg">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {barber.quote && (
                  <p className="text-gray-500 text-xs italic mt-2">"{barber.quote}"</p>
                )}

                {barber.working_days && (
                  <div className="mt-3 pt-3 border-t border-white/10">
                    <p className="text-gray-500 text-xs mb-1">Días laborales:</p>
                    <div className="flex flex-wrap gap-1">
                      {DAYS.filter((d) => barber.working_days[d.key]?.enabled).map((d) => (
                        <span key={d.key} className="text-xs bg-white/10 text-white px-2 py-1 rounded-lg">
                          {d.label}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <h3 className="text-lg font-bold text-white">
              {editingBarber ? "Editar Barbero" : "Nuevo Barbero"}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">

              {/* NOMBRE + ROL */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-gray-400">Nombre</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-white/30"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-gray-400">Rol</label>
                  <input
                    type="text"
                    required
                    placeholder="ej: Master Barber"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-white/30"
                  />
                </div>
              </div>

              {/* EXPERIENCIA */}
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-400">Experiencia</label>
                <input
                  type="text"
                  placeholder="ej: 5 años"
                  value={formData.experience}
                  onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                  className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-white/30"
                />
              </div>

              {/* ESPECIALIDADES */}
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-400">Especialidades (separadas por comas)</label>
                <input
                  type="text"
                  placeholder="ej: Fades, Cortes clásicos, Diseño de barba"
                  value={formData.specialties}
                  onChange={(e) => setFormData({ ...formData, specialties: e.target.value })}
                  className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-white/30"
                />
              </div>

              {/* FRASE */}
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-400">Frase personal</label>
                <textarea
                  rows={2}
                  placeholder="Una frase que represente al barbero"
                  value={formData.quote}
                  onChange={(e) => setFormData({ ...formData, quote: e.target.value })}
                  className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-white/30 resize-none"
                />
              </div>

              {/* URL IMAGEN */}
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-400">URL de Imagen</label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-white/30"
                />
              </div>

              {/* VISIBILIDAD */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, visible: !formData.visible })}
                  className={`w-9 h-5 rounded-full transition-colors relative shrink-0 ${
                    formData.visible ? "bg-white" : "bg-white/20"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-4 h-4 rounded-full transition-all ${
                      formData.visible ? "bg-black left-4" : "bg-white left-0.5"
                    }`}
                  />
                </button>
                <label className="text-gray-300 text-sm flex items-center gap-2">
                  {formData.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                  {formData.visible ? "Visible en la web" : "Oculto en la web"}
                </label>
              </div>

              {/* DÍAS Y HORARIOS */}
              <div className="flex flex-col gap-2">
                <label className="text-xs text-gray-400 flex items-center gap-2">
                  <Clock size={14} />
                  Días y Horarios de Trabajo
                </label>
                <div className="space-y-2 bg-white/5 border border-white/10 rounded-lg p-4">
                  {DAYS.map(({ key, label }) => (
                    <div key={key} className="flex items-center gap-4">
                      <div className="flex items-center gap-2 w-36 shrink-0">
                        <button
                          type="button"
                          onClick={() =>
                            updateWorkingDay(key, "enabled", !formData.working_days[key].enabled)
                          }
                          className={`w-9 h-5 rounded-full transition-colors relative shrink-0 ${
                            formData.working_days[key].enabled ? "bg-white" : "bg-white/20"
                          }`}
                        >
                          <span
                            className={`absolute top-0.5 w-4 h-4 rounded-full transition-all ${
                              formData.working_days[key].enabled
                                ? "bg-black left-4"
                                : "bg-white left-0.5"
                            }`}
                          />
                        </button>
                        <span className="text-gray-300 text-sm">{label}</span>
                      </div>

                      {formData.working_days[key].enabled && (
                        <div className="flex items-center gap-2">
                          <input
                            type="time"
                            value={formData.working_days[key].start}
                            onChange={(e) => updateWorkingDay(key, "start", e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-white text-sm focus:outline-none w-28"
                          />
                          <span className="text-gray-500 text-sm">a</span>
                          <input
                            type="time"
                            value={formData.working_days[key].end}
                            onChange={(e) => updateWorkingDay(key, "end", e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-white text-sm focus:outline-none w-28"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* ACTIONS */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 border border-white/20 text-white py-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-white text-black py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors disabled:opacity-50"
                >
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