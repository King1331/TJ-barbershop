export const dynamic = "force-dynamic";

import { Suspense } from "react";
import ProductDetailClient from "./ProductDetailClient";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
          <p className="text-gray-400">Cargando producto...</p>
        </div>
      }
    >
      <ProductDetailClient />
    </Suspense>
  );
}