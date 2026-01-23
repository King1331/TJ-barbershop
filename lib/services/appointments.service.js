import { db } from "@/lib/firebase/firestore";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { createAppointment } from "@/lib/entities/appointment.entity";

const COLLECTION_NAME = "appointments";

export async function createAppointmentService(data) {
  try {
    // Creamos el objeto con estructura controlada
    const appointment = createAppointment({
      ...data,
      date: data.date instanceof Date
        ? Timestamp.fromDate(data.date)
        : data.date,
    });

    // Referencia a la colección
    const appointmentsRef = collection(db, COLLECTION_NAME);

    // Guardar documento
    const docRef = await addDoc(appointmentsRef, appointment);

    console.log("🔥 Appointment creada con ID:", docRef.id);

    return {
      success: true,
      id: docRef.id,
    };
  } catch (error) {
    console.error("❌ Error creando appointment:", error);

    return {
      success: false,
      error: error.message,
    };
  }
}
