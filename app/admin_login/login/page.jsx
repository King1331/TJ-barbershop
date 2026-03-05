"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getAuth, signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import app from "@/lib/firebase/firebase";

const auth = getAuth(app);

export default function AdminLogin() {
  const router = useRouter();
  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetMsg, setResetMsg] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await signInWithEmailAndPassword(auth, user, password);
      document.cookie = "isAdmin=true; path=/";
      localStorage.setItem("isAdmin", "true");
      router.push("/admin_tab");
    } catch {
      setError("Credenciales incorrectas");
    }

    setLoading(false);
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setResetLoading(true);
    setResetMsg("");

    try {
      await sendPasswordResetEmail(auth, resetEmail);

      await fetch("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail }),
      });

      setResetMsg("Correo enviado. Revisa tu bandeja de entrada.");
    } catch {
      setResetMsg("No se pudo enviar el correo.");
    }

    setResetLoading(false);
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-6">
      <div className="w-full max-w-sm">

        {!showReset ? (
          <form
            onSubmit={handleLogin}
            className="bg-white text-black p-8 rounded-2xl shadow-xl"
          >
            <h1 className="text-2xl font-bold mb-6 text-center">Admin Login</h1>

            {error && (
              <p className="text-red-600 text-sm mb-4 text-center">{error}</p>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Usuario</label>
              <input
                type="text"
                value={user}
                onChange={(e) => setUser(e.target.value)}
                className="w-full border border-black px-3 py-2 focus:outline-none"
                required
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium mb-1">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-black px-3 py-2 focus:outline-none"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white py-2 font-semibold hover:bg-gray-900 transition disabled:opacity-50"
            >
              {loading ? "Entrando…" : "Entrar"}
            </button>

            <button
              type="button"
              onClick={() => { setShowReset(true); setError(""); }}
              className="w-full mt-4 text-sm text-gray-500 hover:text-black transition text-center"
            >
              Olvidé mi contraseña
            </button>
          </form>

        ) : (

          <form
            onSubmit={handleReset}
            className="bg-white text-black p-8 rounded-2xl shadow-xl"
          >
            <h1 className="text-2xl font-bold mb-2 text-center">Restablecer contraseña</h1>
            <p className="text-sm text-gray-500 text-center mb-6">
              Te enviaremos un correo para restablecer tu contraseña.
            </p>

            {resetMsg && (
              <p className={`text-sm mb-4 text-center ${
                resetMsg.includes("enviado") ? "text-green-600" : "text-red-600"
              }`}>
                {resetMsg}
              </p>
            )}

            <div className="mb-6">
              <label className="block text-sm font-medium mb-1">Correo</label>
              <input
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                className="w-full border border-black px-3 py-2 focus:outline-none"
                required
              />
            </div>

            <button
              type="submit"
              disabled={resetLoading}
              className="w-full bg-black text-white py-2 font-semibold hover:bg-gray-900 transition disabled:opacity-50"
            >
              {resetLoading ? "Enviando…" : "Enviar correo"}
            </button>

            <button
              type="button"
              onClick={() => { setShowReset(false); setResetMsg(""); setResetEmail(""); }}
              className="w-full mt-4 text-sm text-gray-500 hover:text-black transition text-center"
            >
              Volver al login
            </button>
          </form>
        )}

      </div>
    </div>
  );
}