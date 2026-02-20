"use client";

import HeroSection from "@/components/home/HeroSection";
import AboutSection from "@/components/home/AboutSection";
import ServicesSection from "@/components/home/ServicesSection";
import LocationSection from "@/components/home/LocationSection";
import BarbersSection from '@/components/home/BarbersSection';
import { CalendarComponent } from "@/components/ui/calendar"



export default function HomeClient() {
  return (
    <main>
      <HeroSection />
      <AboutSection />
      <ServicesSection />
      <BarbersSection />
      <LocationSection />
    </main>
  );
}
