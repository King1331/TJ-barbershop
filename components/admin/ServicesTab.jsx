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
import  db  from "@/lib/firebase/firestore";

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

  /* =========================
     FETCH SERVICES
  ========================= */
  const fetchServices = async () => {
    setLoading(true);
    const q = query(
      collection(db, "services"),
      orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setServices(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchServices();
  }, []);

  /* =========================
     CREATE / UPDATE
  ========================= */
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

  /* =========================
     DELETE
  ========================= */
  const handleDelete = async (id) => {
    const ok = window.confirm(
      "¿Seguro que deseas eliminar este servicio?"
    );
    if (!ok) return;

    await deleteDoc(doc(db, "services", id));
    fetchServices();
  };

  /* =========================
     EDIT
  ========================= */
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
    await updateDoc(doc(db, "services", service.id), {
      visible: !service.visible,
    });
    fetchServices();
  };

  const handleClose = () => {
    setOpen(false);
    setEditingService(null);
    setFormData({
      name: "",
      description: "",
      price: "",
      duration: "",
      image_url: "",
      visible: true,
    });
  };

  if (loading) {
    return <p className="text-white">Cargando servicios…</p>;
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">
          Servicios
        </h2>

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
                {editingService
                  ? "Editar Servicio"
                  : "Nuevo Servicio"}
              </DialogTitle>
            </DialogHeader>

            <form
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              <div>
                <Label>Nombre</Label>
                <Input
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      name: e.target.value,
                    })
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
                    setFormData({
                      ...formData,
                      description: e.target.value,
                    })
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
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        price: e.target.value,
                      })
                    }
                    className="bg-white/5 border-white/10"
                  />
                </div>

                <div>
                  <Label>Duración (min)</Label>
                  <Input
                    type="number"
                    value={formData.duration}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        duration: e.target.value,
                      })
                    }
                    className="bg-white/5 border-white/10"
                  />
                </div>
              </div>

              <div>
                <Label>URL Imagen</Label>
                <Input
                  value={formData.image_url}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      image_url: e.target.value,
                    })
                  }
                  className="bg-white/5 border-white/10"
                />
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.visible}
                  onCheckedChange={(v) =>
                    setFormData({
                      ...formData,
                      visible: v,
                    })
                  }
                />
                <Label>Visible en el frontend</Label>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-white text-black hover:bg-gray-200"
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
          <Card
            key={service.id}
            className="bg-white/5 border-white/10"
          >
            <CardHeader>
              <div className="flex justify-between">
                <div>
                  <CardTitle className="text-white">
                    {service.name}
                  </CardTitle>
                  <p className="text-white font-bold">
                    ₡{service.price}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      toggleVisibility(service)
                    }
                    className="text-gray-400 hover:text-white"
                  >
                    {service.visible !== false ? (
                      <Eye size={18} />
                    ) : (
                      <EyeOff size={18} />
                    )}
                  </button>
                  <button
                    onClick={() => handleEdit(service)}
                    className="text-gray-400 hover:text-blue-400"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() =>
                      handleDelete(service.id)
                    }
                    className="text-gray-400 hover:text-red-400"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              {service.image_url && (
                <img
                  src={service.image_url}
                  className="w-full h-32 object-cover rounded mb-3"
                />
              )}
              <p className="text-gray-400 text-sm">
                {service.description}
              </p>
              {service.duration && (
                <p className="text-gray-500 text-xs mt-1">
                  {service.duration} minutos
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
