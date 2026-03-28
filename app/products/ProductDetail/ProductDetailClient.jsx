"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import db from "@/lib/firebase/firestore";
import { motion } from "framer-motion";
import { MessageCircle, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

const categoryLabels = {
  productos_cabello: "Productos para Cabello",
  productos_piel: "Productos para Piel",
  camisas_deportivas: "Camisas Deportivas",
};

export default function ProductDetail() {
  const searchParams = useSearchParams();
  const productId = searchParams.get("id");

  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setProduct(null);
      setRelatedProducts([]);

      const snap = await getDocs(collection(db, "products"));
      const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

      const found = productId
        ? all.find((p) => p.id === productId)
        : all[0];

      if (!found) {
        setLoading(false);
        return;
      }

      setProduct(found);

      const related = all
        .filter((p) => p.category === found.category && p.id !== found.id)
        .slice(0, 4);
      setRelatedProducts(related);

      setLoading(false);
    };

    fetchData();
  }, [productId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12">
            <div className="aspect-square rounded-2xl bg-white/5 animate-pulse" />
            <div className="space-y-4">
              <div className="h-10 w-3/4 bg-white/5 rounded-xl animate-pulse" />
              <div className="h-6 w-1/4 bg-white/5 rounded-xl animate-pulse" />
              <div className="h-32 w-full bg-white/5 rounded-xl animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <p className="text-gray-400">Producto no encontrado.</p>
      </div>
    );
  }

  const whatsappMessage = `Hola! Me interesa cotizar el producto: ${product.name} - ${Number(product.price).toLocaleString("es-CR")}₡`;
const whatsappUrl = `https://wa.me/50685654169?text=${encodeURIComponent(whatsappMessage)}`;
  return (
    <div className="min-h-screen bg-[#0A0A0A] pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-6">

        {/* BREADCRUMB */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-8"
        >
          <Link
            href="/products"
            className="text-gray-400 hover:text-white transition-colors inline-flex items-center gap-2"
          >
            <ChevronLeft size={18} />
            Volver a productos
          </Link>
        </motion.div>

        {/* PRODUCT */}
        <div className="grid lg:grid-cols-2 gap-12 mb-20">

          {/* IMAGEN */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="aspect-square rounded-2xl overflow-hidden bg-white/5 border border-white/10">
              <img
                src={product.image_url || "https://images.unsplash.com/photo-1631729371254-42c2892f0e6e?w=800&q=80"}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
          </motion.div>

          {/* INFO */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col"
          >
            <span className="text-xs font-semibold tracking-widest uppercase text-gray-500 mb-3">
              {categoryLabels[product.category] || product.category}
            </span>

            <h1 className="text-4xl md:text-5xl font-black text-white mb-4">
              {product.name}
            </h1>

            <span className="text-4xl font-black text-white mb-8">
              {Number(product.price).toLocaleString("es-CR")}₡
            </span>

            <div className="mb-8">
              <h3 className="text-white font-semibold mb-3">Descripcion del producto</h3>
              <p className="text-gray-400 leading-relaxed">
                {product.description || "Producto premium de TJ's Cuts Barbershop."}
              </p>
            </div>

            <div className="flex items-center gap-2 mb-8">
              {product.in_stock !== false ? (
                <>
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-gray-400 text-sm">En stock</span>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  <span className="text-gray-400 text-sm">Agotado</span>
                </>
              )}
            </div>

            <div className="w-full h-px bg-white/10 mb-8" />

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-3 bg-[#25D366] text-white px-8 py-4 rounded-full font-bold text-sm tracking-wider uppercase hover:bg-[#20bd5a] transition-all duration-300 shadow-lg"
            >
              <MessageCircle size={20} />
              Cotice con nosotros
            </a>
          </motion.div>
        </div>

        {/* PRODUCTOS RELACIONADOS */}
        {relatedProducts.length > 0 && (
          <div>
            <h2 className="text-2xl md:text-3xl font-black text-white mb-8">
              Te podria gustar
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((rel, index) => (
                <motion.div
                  key={rel.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link
                    href={`/products/ProductDetail?id=${rel.id}`}
                    className="group block bg-white/5 rounded-2xl border border-white/10 overflow-hidden hover:border-white/30 transition-all duration-500"
                  >
                    <div className="relative aspect-square overflow-hidden bg-black">
                      <img
                        src={rel.image_url || "https://images.unsplash.com/photo-1631729371254-42c2892f0e6e?w=400&q=80"}
                        alt={rel.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                    </div>
                    <div className="p-5">
                      <h3 className="text-white font-semibold mb-1 group-hover:text-gray-300 transition-colors">
                        {rel.name}
                      </h3>
                      <span className="text-xl font-black text-white">
                        {Number(rel.price).toLocaleString("es-CR")}₡
                      </span>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}