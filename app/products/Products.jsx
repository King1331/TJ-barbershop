"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Filter } from "lucide-react";

import { getProductsService } from "@/lib/services/product.service";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const categories = [
  { value: "all", label: "Todas las categorías" },
  { value: "camisas_deportivas", label: "Camisas Deportivas" },
  { value: "productos_cabello", label: "Productos para el Cabello" },
  { value: "productos_piel", label: "Productos para la Piel" },
];

export default function Products() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await getProductsService();
        setProducts(data);
      } catch (error) {
        console.error("Error cargando productos:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const filteredProducts =
    selectedCategory === "all"
      ? products
      : products.filter((p) => p.category === selectedCategory);

  const getCategoryLabel = (value) =>
    categories.find((c) => c.value === value)?.label || "Categorías";

  return (
    <div className="min-h-screen bg-[#0A0A0A] pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-6">

        {/* HEADER */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <span className="text-gray-400 text-sm font-semibold tracking-[0.3em] uppercase block mb-4">
            Tienda
          </span>

          <h1 className="text-4xl md:text-5xl font-black text-white mb-4">
            Nuestros{" "}
            <span className="text-white">
              Productos
            </span>
          </h1>

          <p className="text-gray-500 max-w-2xl mx-auto">
            Descubre nuestra selección de productos premium para el cuidado personal
          </p>
        </motion.div>

        {/* FILTER */}
        <div className="flex justify-end mb-8">
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 px-5 py-3 bg-white/5 border border-white/10 rounded-xl text-white hover:border-white/40 transition">
              <Filter size={18} className="text-white" />
              <span>{getCategoryLabel(selectedCategory)}</span>
              <ChevronDown size={16} />
            </DropdownMenuTrigger>

            <DropdownMenuContent className="bg-zinc-900 border border-white/10 text-white">
              {categories.map((category) => (
                <DropdownMenuItem
                  key={category.value}
                  onClick={() => setSelectedCategory(category.value)}
                  className={`cursor-pointer hover:bg-white/10 ${
                    selectedCategory === category.value
                      ? "text-white font-semibold"
                      : "text-gray-400"
                  }`}
                >
                  {category.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* PRODUCTS GRID */}
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedCategory}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <Skeleton
                  key={i}
                  className="h-80 rounded-2xl bg-white/5"
                />
              ))
            ) : (
              filteredProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link
                    href={`/products/${product.id}`}
                    className="group block bg-gradient-to-b from-white/5 to-transparent rounded-2xl border border-white/10 overflow-hidden hover:border-white/40 transition"
                  >
                    {/* IMAGE */}
                    <div className="relative aspect-square bg-zinc-900 overflow-hidden">
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                    </div>

                    {/* CONTENT */}
                    <div className="p-5">
                      <h3 className="text-white font-semibold mb-1 group-hover:text-white transition">
                        {product.name}
                      </h3>

                      <p className="text-gray-500 text-sm mb-3 line-clamp-1">
                        {product.description}
                      </p>

                      <span className="text-xl font-black text-white">
                        ${product.price.toFixed(2)}
                      </span>
                    </div>
                  </Link>
                </motion.div>
              ))
            )}
          </motion.div>
        </AnimatePresence>

        {!loading && filteredProducts.length === 0 && (
          <div className="text-center py-20 text-gray-500">
            No hay productos en esta categoría
          </div>
        )}
      </div>
    </div>
  );
}
