import HeroSection from "@/components/home/HeroSection";
import AboutSection from '@/components/home/AboutSection';
import ServicesSection from '@/components/home/ServicesSection';
import LocationSection from '@/components/home/LocationSection';




export default function Home() {
  return (
    <main>
      <HeroSection />
        <AboutSection />
       <ServicesSection/>
       <LocationSection />
    </main>
  );
}


