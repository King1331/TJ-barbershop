"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  collection, getDocs, addDoc, deleteDoc, updateDoc, doc, serverTimestamp,
} from "firebase/firestore";
import db from "@/lib/firebase/firestore";
import { Plus, Edit, Trash2 } from "lucide-react";

const EMPTY_FORM = {
  name: "",
  description: "",
  price: "",
  category: "productos_cabello",
  image_url: "",
  in_stock: true,
};

const categoryLabels = {
  productos_cabello: "Productos para Cabello",
  productos_piel: "Productos para Piel",
  camisas_deportivas: "Camisas Deportivas",
};

export default function ProductsTab() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ open: false, productId: null, productName: "" });

  /* ---------------- FETCH ---------------- */
  const fetchProducts = async () => {
    const snap = await getDocs(collection(db, "products"));
    setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    setLoading(false);
  };

  useEffect(() => { fetchProducts(); }, []);

  /* ---------------- HELPERS ---------------- */
  const handleClose = () => {
    setOpen(false);
    setEditingProduct(null);
    setFormData(EMPTY_FORM);
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name || "",
      description: product.description || "",
      price: product.price?.toString() || "",
      category: product.category || "productos_cabello",
      image_url: product.image_url || "",
      in_stock: product.in_stock !== false,
    });
    setOpen(true);
  };

  /* ---------------- SUBMIT ---------------- */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const productData = {
      ...formData,
      price: parseFloat(formData.price),
    };

    if (editingProduct) {
      await updateDoc(doc(db, "products", editingProduct.id), productData);
    } else {
      await addDoc(collection(db, "products"), {
        ...productData,
        created_date: serverTimestamp(),
      });
    }

    await fetchProducts();
    setSaving(false);
    handleClose();
  };

  /* ---------------- DELETE ---------------- */
  const handleDelete = (id) => {
    const product = products.find(p => p.id === id);
    setDeleteModal({ open: true, productId: id, productName: product?.name || "" });
  };

  const handleDeleteConfirm = async () => {
    const { productId } = deleteModal;
    setDeleteModal({ open: false, productId: null, productName: "" });
    await deleteDoc(doc(db, "products", productId));
    fetchProducts();
  };

  if (loading) return <p className="text-white p-4">Cargando…</p>;

  return (
    <div className="p-4 space-y-6 text-white">

      {/* DELETE MODAL */}
      {deleteModal.open && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.85)" }}>
          <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-red-500/15 flex items-center justify-center shrink-0">
                <Trash2 size={22} className="text-red-400" />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">Eliminar producto</h3>
                <p className="text-gray-400 text-xs">Esta acción no se puede deshacer</p>
              </div>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">
              ¿Estás seguro que deseas eliminar{" "}
              <span className="text-white font-semibold">"{deleteModal.productName}"</span>?
              El producto será eliminado permanentemente.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setDeleteModal({ open: false, productId: null, productName: "" })}
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

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Productos</h2>
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-xl font-semibold hover:bg-gray-100 transition-colors"
        >
          <Plus size={18} />
          Agregar Producto
        </button>
      </div>

      {/* PRODUCTS GRID */}
      {products.length === 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-2xl py-12 text-center">
          <p className="text-gray-400">No hay productos registrados</p>
          <p className="text-gray-500 text-sm mt-2">Agrega tu primer producto para comenzar</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden flex flex-col"
            >
              {product.image_url && (
                <img src={product.image_url} alt={product.name} className="w-full h-40 object-cover" />
              )}
              <div className="p-4 flex flex-col flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-white font-semibold text-lg leading-tight">{product.name}</h3>
                    <p className="text-white font-bold text-xl mt-1">
                      ₡ {Number(product.price).toLocaleString("es-CR")}
                    </p>
                    <p className="text-gray-500 text-xs mt-1">
                      {categoryLabels[product.category] || product.category}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => handleEdit(product)} className="text-gray-400 hover:text-white transition-colors">
                      <Edit size={18} />
                    </button>
                    <button onClick={() => handleDelete(product.id)} className="text-gray-400 hover:text-red-400 transition-colors">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                <p className="text-gray-400 text-sm mt-3 flex-1">{product.description}</p>
                <div className="mt-3">
                  {product.in_stock ? (
                    <span className="text-green-400 text-xs">✓ En stock</span>
                  ) : (
                    <span className="text-red-400 text-xs">✗ Agotado</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL CREAR/EDITAR */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <h3 className="text-lg font-bold text-white">
              {editingProduct ? "Editar Producto" : "Nuevo Producto"}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* NOMBRE */}
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-400">Nombre</label>
                <input
                  type="text" required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-white/30"
                />
              </div>

              {/* DESCRIPCIÓN */}
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-400">Descripción</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-white/30 resize-none"
                />
              </div>

              {/* PRECIO + CATEGORÍA */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-gray-400">Precio (₡)</label>
                  <input
                    type="number" step="0.01" required
                    value={formData.price}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "" || (Number(val) <= 9999999 && Number(val) >= 0)) {
                        setFormData({ ...formData, price: val });
                      }
                    }}
                    max={9999999} min={0}
                    className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-white/30"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-gray-400">Categoría</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none"
                  >
                    <option value="productos_cabello" className="text-black">Productos para Cabello</option>
                    <option value="productos_piel" className="text-black">Productos para Piel</option>
                    <option value="camisas_deportivas" className="text-black">Camisas Deportivas</option>
                  </select>
                </div>
              </div>

              {/* URL IMAGEN */}
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-400">URL de Imagen</label>
                <input
                  type="text" placeholder="https://..."
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-white/30"
                />
              </div>

              {/* EN STOCK */}
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-400">Disponibilidad</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, in_stock: true })}
                    className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors border ${
                      formData.in_stock
                        ? "bg-green-500/20 border-green-500/50 text-green-400"
                        : "bg-white/5 border-white/10 text-gray-500 hover:bg-white/10"
                    }`}
                  >
                    ✓ En stock
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, in_stock: false })}
                    className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors border ${
                      !formData.in_stock
                        ? "bg-red-500/20 border-red-500/50 text-red-400"
                        : "bg-white/5 border-white/10 text-gray-500 hover:bg-white/10"
                    }`}
                  >
                    ✗ Agotado
                  </button>
                </div>
              </div>

              {/* ACTIONS */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button" onClick={handleClose}
                  className="flex-1 border border-white/20 text-white py-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving || !formData.name || !formData.price || !formData.image_url}
                  className="flex-1 bg-white text-black py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? "Guardando…" : editingProduct ? "Actualizar" : "Crear"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}