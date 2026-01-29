import { FacebookIcon, InstagramIcon, MessageCircle } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-black border-t border-white/10">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          {/* Logo & Name (ACTUALIZADO CON TU IMAGEN) */}
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-black flex items-center justify-center">
              <img
                src="https://i.postimg.cc/6qh2X215/3F07E1B8-921A-4073-94D6-1708D1A74A20.png"
                alt="TJ's Cuts Logo"
                className="w-full h-full object-cover scale-105"
              />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg tracking-wide">
                TJ's Cuts Barbershop
              </h3>
              <p className="text-gray-500 text-sm">
                Estilo urbano, calidad premium
              </p>
            </div>
          </div>

          {/* Social Icons (igual que antes) */}
          <div className="flex items-center gap-6">
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-amber-400 hover:border-amber-400/50 transition-all duration-300"
            >
              <FacebookIcon size={18} />
            </a>

            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-amber-400 hover:border-amber-400/50 transition-all duration-300"
            >
              <InstagramIcon size={18} />
            </a>

            <a
              href="https://wa.me/1234567890"
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-amber-400 hover:border-amber-400/50 transition-all duration-300"
            >
              <MessageCircle size={18} />
            </a>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-10 pt-8 border-t border-white/5 text-center">
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} TJ's Cuts Barbershop. Todos los
            derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
