"use client";

import HeroSection from "@/components/home/HeroSection";
import AboutSection from "@/components/home/AboutSection";
import ServicesSection from "@/components/home/ServicesSection";
import LocationSection from "@/components/home/LocationSection";
import BarbersSection from '@/components/home/BarbersSection';

export default function HomeClient() {
  return (
    <main>
      <HeroSection />
      <AboutSection />
      <ServicesSection />
      <LocationSection />
      <BarbersSection />
    </main>
  );
}
