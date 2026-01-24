import { getFirestore, collection, getDocs, getDoc, doc, addDoc } from "firebase/firestore";
import app from "@/lib/firebase/firebase";

// Inicializa Firestore usando tu app existente
const db = getFirestore(app);

// Nombre EXACTO de la colección en Firebase
const SERVICES_COLLECTION = "services";

/**
 * Obtener todos los servicios
 */
export async function getServices() {
  try {
    const snapshot = await getDocs(collection(db, SERVICES_COLLECTION));
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error obteniendo servicios:", error);
    return [];
  }
}

/**
 * Obtener un servicio por ID
 */
export async function getServiceById(serviceId) {
  try {
    const ref = doc(db, SERVICES_COLLECTION, serviceId);
    const snapshot = await getDoc(ref);

    if (!snapshot.exists()) return null;

    return {
      id: snapshot.id,
      ...snapshot.data(),
    };
  } catch (error) {
    console.error("Error obteniendo servicio:", error);
    return null;
  }
}

/**
 * Crear un nuevo servicio
 * (opcional, útil para panel admin o seeds)
 */
export async function createService(serviceData) {
  try {
    const docRef = await addDoc(
      collection(db, SERVICES_COLLECTION),
      serviceData
    );
    return docRef.id;
  } catch (error) {
    console.error("Error creando servicio:", error);
    return null;
  }
}
