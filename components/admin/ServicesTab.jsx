"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import db from "@/lib/firebase/firestore";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Edit, Trash2, Eye, EyeOff } from "lucide-react";

const DURATION_OPTIONS = [
  { label: "30 minutos", value: 30 },
  { label: "1 hora", value: 60 },
  { label: "1.5 horas", value: 90 },
  { label: "2 horas", value: 120 },
  { label: "2.5 horas", value: 150 },
  { label: "3 horas", value: 180 },
  { label: "3.5 horas", value: 210 },
  { label: "4 horas", value: 240 },
  { label: "4.5 horas", value: 270 },
  { label: "5 horas", value: 300 },
  { label: "5.5 horas", value: 330 },
  { label: "6 horas", value: 360 },
  { label: "6.5 horas", value: 390 },
  { label: "7 horas", value: 420 },
  { label: "7.5 horas", value: 450 },
  { label: "8 horas", value: 480 },
  { label: "8.5 horas", value: 510 },
  { label: "9 horas", value: 540 },
  { label: "9.5 horas", value: 570 },
  { label: "10 horas", value: 600 },
  { label: "10.5 horas", value: 630 },
  { label: "11 horas", value: 660 },
  { label: "11.5 horas", value: 690 },
  { label: "12 horas", value: 720 },
];

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
          <button
            onClick={onCancel}
            className="flex-1 border border-white/20 text-white py-2 rounded-lg hover:bg-white/10 transition-colors text-sm font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
              danger ? "bg-red-600 text-white hover:bg-red-700" : "bg-white text-black hover:bg-gray-100"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function ServicesTab() {
  const [services, setServices] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [open, setOpen]         = useState(false);
  const [editingService, setEditingService] = useState(null);

  const [formData, setFormData] = useState({
    name: "", description: "", price: "", duration: "", image_url: "", visible: true,
  });

  const [confirmModal, setConfirmModal] = useState({
    open: false, title: "", message: "", confirmLabel: "Continuar", danger: false, onConfirm: null,
  });

  const showConfirm = ({ title, message, confirmLabel = "Continuar", danger = false, onConfirm }) => {
    setConfirmModal({ open: true, title, message, confirmLabel, danger, onConfirm });
  };

  const closeConfirm = () => setConfirmModal((prev) => ({ ...prev, open: false, onConfirm: null }));

  const isFormValid = formData.name.trim() && formData.price && formData.duration;

  /* ── FETCH ── */
  const fetchServices = async () => {
    setLoading(true);
    const q = query(collection(db, "services"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    setServices(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    setLoading(false);
  };

  useEffect(() => { fetchServices(); }, []);

  /* ── SUBMIT ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      name: formData.name,
      description: formData.description,
      price: Number(formData.price),
      duration: Number(formData.duration),
      image_url: formData.image_url,
      visible: formData.visible,
      createdAt: new Date(),
    };
    if (editingService) {
      await updateDoc(doc(db, "services", editingService.id), payload);
    } else {
      await addDoc(collection(db, "services"), payload);
    }
    handleClose();
    fetchServices();
  };

  /* ── TOGGLE VISIBILITY ── */
  const toggleVisibility = (service) => {
    if (service.visible !== false) {
      showConfirm({
        title: "Ocultar servicio",
        message: "Este servicio no será mostrado en la página principal, estará oculto. El servicio se mantendrá guardado en la base de datos y podrás hacerlo visible nuevamente cuando quieras. ¿Desea continuar?",
        confirmLabel: "Continuar",
        danger: false,
        onConfirm: async () => {
          await updateDoc(doc(db, "services", service.id), { visible: false });
          fetchServices();
          closeConfirm();
        },
      });
    } else {
      updateDoc(doc(db, "services", service.id), { visible: true }).then(fetchServices);
    }
  };

  /* ── DELETE ── */
  const handleDelete = async (id) => {
    const today = new Date().toISOString().split("T")[0];

    // Solo filtra por service_id — sin índice compuesto
    const apptQuery = query(
      collection(db, "appointments"),
      where("service_id", "==", id)
    );
    const apptSnap = await getDocs(apptQuery);

    // Filtra fechas futuras en el cliente
    const futureLinked = apptSnap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((a) => a.date >= today);

    if (futureLinked.length > 0) {
      showConfirm({
        title: "Eliminar servicio",
        message: `Este servicio tiene ${futureLinked.length} cita${futureLinked.length !== 1 ? "s" : ""} a futuro vinculada${futureLinked.length !== 1 ? "s" : ""}. Al eliminarlo, esas citas serán canceladas y los horarios liberados. ¿Estás seguro que quieres continuar?`,
        confirmLabel: "Sí, eliminar",
        danger: true,
        onConfirm: async () => {
          await Promise.all(futureLinked.map((a) => deleteDoc(doc(db, "appointments", a.id))));
          await deleteDoc(doc(db, "services", id));
          fetchServices();
          closeConfirm();
        },
      });
    } else {
      showConfirm({
        title: "Eliminar servicio",
        message: "¿Seguro que deseas eliminar este servicio? Esta acción no se puede deshacer.",
        confirmLabel: "Sí, eliminar",
        danger: true,
        onConfirm: async () => {
          await deleteDoc(doc(db, "services", id));
          fetchServices();
          closeConfirm();
        },
      });
    }
  };

  /* ── EDIT ── */
  const handleEdit = (service) => {
    setEditingService(service);
    setFormData({
      name: service.name || "",
      description: service.description || "",
      price: service.price?.toString() || "",
      duration: service.duration?.toString() || "",
      image_url: service.image_url || "",
      visible: service.visible !== false,
    });
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingService(null);
    setFormData({ name: "", description: "", price: "", duration: "", image_url: "", visible: true });
  };

  const getDurationLabel = (minutes) => {
    const opt = DURATION_OPTIONS.find((d) => d.value === Number(minutes));
    return opt ? opt.label : `${minutes} min`;
  };

  if (loading) return <p className="text-white">Cargando servicios…</p>;

  return (
    <div className="space-y-6">
      <ConfirmModal
        open={confirmModal.open}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmLabel={confirmModal.confirmLabel}
        danger={confirmModal.danger}
        onConfirm={confirmModal.onConfirm}
        onCancel={closeConfirm}
      />

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Servicios</h2>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-white text-black hover:bg-gray-200">
              <Plus size={18} className="mr-2" />
              Agregar Servicio
            </Button>
          </DialogTrigger>

          <DialogContent className="bg-[#111] border-white/10 text-white">
            <DialogHeader>
              <DialogTitle>
                {editingService ? "Editar Servicio" : "Nuevo Servicio"}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Nombre</Label>
                <Input
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="bg-white/5 border-white/10"
                />
              </div>

              <div>
                <Label>Descripción</Label>
                <Textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="bg-white/5 border-white/10"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Precio</Label>
                  <Input
                    type="number"
                    required
                    value={formData.price}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (
                        val === "" ||
                        (Number(val) <= 9999999 && Number(val) >= 0)
                      ) {
                        setFormData({ ...formData, price: val });
                      }
                    }}
                    max={9999999}
                    min={0}
                    className="bg-white/5 border-white/10"
                  />
                </div>
                <div>
                  <Label>Duración</Label>
                  <select
                    required
                    value={formData.duration}
                    onChange={(e) =>
                      setFormData({ ...formData, duration: e.target.value })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white focus:outline-none mt-1"
                  >
                    <option value="" disabled className="text-black">
                      Seleccionar duración
                    </option>
                    {DURATION_OPTIONS.map((opt) => (
                      <option
                        key={opt.value}
                        value={opt.value}
                        className="text-black"
                      >
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <Label>URL Imagen</Label>
                <Input
                  value={formData.image_url}
                  onChange={(e) =>
                    setFormData({ ...formData, image_url: e.target.value })
                  }
                  className="bg-white/5 border-white/10"
                />
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.visible}
                  onCheckedChange={(v) =>
                    setFormData({ ...formData, visible: v })
                  }
                />
                <Label>Visible en el frontend</Label>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 bg-transparent text-white border border-white/30 hover:bg-white hover:text-black transition-all duration-300"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={!isFormValid}
                  className="flex-1 bg-white text-black hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {editingService ? "Actualizar" : "Crear"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* LIST */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map((service) => (
          <Card key={service.id} className="bg-white/5 border-white/10">
            <CardHeader>
              <div className="flex justify-between">
                <div>
                  <CardTitle className="text-white">{service.name}</CardTitle>
                  <p className="text-white font-bold mt-1">
                    ₡{Number(service.price).toLocaleString("es-CR")}
                  </p>
                </div>

                <div className="flex gap-2">
                  {/* OJO */}
                  <div className="relative group">
                    <button
                      onClick={() => toggleVisibility(service)}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      {service.visible !== false ? (
                        <Eye size={18} />
                      ) : (
                        <EyeOff size={18} />
                      )}
                    </button>
                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black border border-white/20 rounded-lg text-xs text-gray-300 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                      {service.visible !== false ? "Ocultar" : "Mostrar"}
                    </span>
                  </div>

                  {/* LÁPIZ */}
                  <div className="relative group">
                    <button
                      onClick={() => handleEdit(service)}
                      className="text-gray-400 hover:text-blue-400 transition-colors"
                    >
                      <Edit size={18} />
                    </button>
                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black border border-white/20 rounded-lg text-xs text-gray-300 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                      Editar
                    </span>
                  </div>

                  {/* BASURERO */}
                  <div className="relative group">
                    <button
                      onClick={() => handleDelete(service.id)}
                      className="text-gray-400 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black border border-white/20 rounded-lg text-xs text-gray-300 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                      Eliminar
                    </span>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              {service.image_url && (
                <img
                  src={service.image_url}
                  className="w-full h-32 object-cover rounded mb-3"
                  alt={service.name}
                />
              )}
              <p className="text-gray-400 text-sm">{service.description}</p>
              {service.duration && (
                <p className="text-gray-500 text-xs mt-1">
                  {getDurationLabel(service.duration)}
                </p>
              )}
              {service.visible === false && (
                <span className="inline-block mt-2 px-2 py-0.5 bg-white/10 text-gray-400 text-xs rounded-full">
                  Oculto
                </span>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {services.length === 0 && (
        <Card className="bg-white/5 border-white/10">
          <CardContent className="py-12 text-center text-gray-400">
            No hay servicios registrados
          </CardContent>
        </Card>
      )}
    </div>
  );
}