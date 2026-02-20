"use client";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Scissors, ShoppingBag, Users } from "lucide-react";
import AppointmentsTab from "@/components/admin/AppointmentsTab";
import ServicesTab from "@/components/admin/ServicesTab";
import ProductsTab from "@/components/admin/ProductsTab";
import BarbersTab from "@/components/admin/BarbersTab";

export default function AdminTab() {
  const [activeTab, setActiveTab] = useState("appointments");

  return (
    <div className="min-h-screen bg-black pt-28 pb-16">
      <div className="max-w-7xl mx-auto px-6">

        {/* HEADER */}
        <div className="mb-10">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-2">
            Panel de{" "}
            <span className="text-white underline underline-offset-8">
              Administración
            </span>
          </h1>
          <p className="text-gray-400">Gestiona tu negocio desde un solo lugar</p>
        </div>

        {/* TABS */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 gap-2 bg-white/5 p-2 rounded-2xl mb-10">
            <TabsTrigger
              value="appointments"
              className="flex items-center justify-center gap-2 text-white data-[state=active]:bg-white data-[state=active]:text-black rounded-xl"
            >
              <Calendar size={18} />
              <span className="hidden sm:inline">Citas</span>
            </TabsTrigger>

            <TabsTrigger
              value="services"
              className="flex items-center justify-center gap-2 text-white data-[state=active]:bg-white data-[state=active]:text-black rounded-xl"
            >
              <Scissors size={18} />
              <span className="hidden sm:inline">Servicios</span>
            </TabsTrigger>

            <TabsTrigger
              value="products"
              className="flex items-center justify-center gap-2 text-white data-[state=active]:bg-white data-[state=active]:text-black rounded-xl"
            >
              <ShoppingBag size={18} />
              <span className="hidden sm:inline">Productos</span>
            </TabsTrigger>

            <TabsTrigger
              value="barbers"
              className="flex items-center justify-center gap-2 text-white data-[state=active]:bg-white data-[state=active]:text-black rounded-xl"
            >
              <Users size={18} />
              <span className="hidden sm:inline">Barberos</span>
            </TabsTrigger>
          </TabsList>

          {/* CONTENT */}
          <TabsContent value="appointments">
            <AppointmentsTab />
          </TabsContent>
          <TabsContent value="services">
            <ServicesTab />
          </TabsContent>
          <TabsContent value="products">
            <ProductsTab />
          </TabsContent>
          <TabsContent value="barbers">
            <BarbersTab />
          </TabsContent>
        </Tabs>

      </div>
    </div>
  );
}