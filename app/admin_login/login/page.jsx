"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
  const router = useRouter();
  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();

    if (user === "admin" && password === "123") {
      document.cookie = "isAdmin=true; path=/";
      localStorage.setItem("isAdmin", "true");
      router.push("/admin_tab");
    } else {
      setError("Credenciales incorrectas");
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-6">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-sm bg-white text-black p-8 rounded-2xl shadow-xl"
      >
        <h1 className="text-2xl font-bold mb-6 text-center">
          Admin Login
        </h1>

        {error && (
          <p className="text-red-600 text-sm mb-4 text-center">
            {error}
          </p>
        )}

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">
            Usuario
          </label>
          <input
            type="text"
            value={user}
            onChange={(e) => setUser(e.target.value)}
            className="w-full border border-black px-3 py-2 focus:outline-none"
            required
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-1">
            Contraseña
          </label>
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
          className="w-full bg-black text-white py-2 font-semibold hover:bg-gray-900 transition"
        >
          Entrar
        </button>
      </form>
    </div>
  );
}
