import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Providers from "./providers";
import "./globals.css";

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className="bg-[#0A0A0A] min-h-screen flex flex-col">
        <Providers>
          <Navbar />
          <main className="pt-20 flex-1">
            {children}
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
