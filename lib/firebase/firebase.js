import { initializeApp, getApps, getApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyBCaZ4hFjLuk8AfgYPL7vHnDxEvXmfbm8c",
  authDomain: "tjs-cuts.firebaseapp.com",
  projectId: "tjs-cuts",
  storageBucket: "tjs-cuts.firebasestorage.app",
  messagingSenderId: "278295106390",
  appId: "1:278295106390:web:e26ab3be5f022213cb3cf7",
};

// Evita inicializar Firebase más de una vez (clave en Next.js)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export default app;
