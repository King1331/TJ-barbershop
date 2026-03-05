"use client";

import { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
} from "firebase/firestore";
import db from "@/lib/firebase/firestore";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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

export default function ServicesTab() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    duration: "",
    image_url: "",
    visible: true,
  });

  const isFormValid =
    formData.name.trim() &&
    formData.price &&
    formData.duration;

  /* ── FETCH ── */
  const fetchServices = async () => {
    setLoading(true);
    const q = query(collection(db, "services"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    setServices(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
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

  /* ── DELETE ── */
  const handleDelete = async (id) => {
    if (!window.confirm("¿Seguro que deseas eliminar este servicio?")) return;
    await deleteDoc(doc(db, "services", id));
    fetchServices();
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

  const toggleVisibility = async (service) => {
    await updateDoc(doc(db, "services", service.id), { visible: !service.visible });
    fetchServices();
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
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-white/5 border-white/10"
                />
              </div>

              <div>
                <Label>Descripción</Label>
                <Textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="bg-white/5 border-white/10"
                  />
                </div>

                {/* DROPDOWN DURACIÓN */}
                <div>
                  <Label>Duración</Label>
                  <select
                    required
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white focus:outline-none mt-1"
                  >
                    <option value="" disabled className="text-black">Seleccionar duración</option>
                    {DURATION_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value} className="text-black">
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
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  className="bg-white/5 border-white/10"
                />
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.visible}
                  onCheckedChange={(v) => setFormData({ ...formData, visible: v })}
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
                    {Number(service.price).toLocaleString("es-CR")}₡
                  </p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => toggleVisibility(service)} className="text-gray-400 hover:text-white">
                    {service.visible !== false ? <Eye size={18} /> : <EyeOff size={18} />}
                  </button>
                  <button onClick={() => handleEdit(service)} className="text-gray-400 hover:text-blue-400">
                    <Edit size={18} />
                  </button>
                  <button onClick={() => handleDelete(service.id)} className="text-gray-400 hover:text-red-400">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              {service.image_url && (
                <img src={service.image_url} className="w-full h-32 object-cover rounded mb-3" />
              )}
              <p className="text-gray-400 text-sm">{service.description}</p>
              {service.duration && (
                <p className="text-gray-500 text-xs mt-1">
                  {getDurationLabel(service.duration)}
                </p>
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