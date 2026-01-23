export const AppointmentStatus = {
  PENDING: "pendiente",
  CONFIRMED: "confirmada",
  COMPLETED: "completada",
  CANCELED: "cancelada",
};

export function createAppointment(data) {
  return {
    barber_id: data.barber_id,
    barber_name: data.barber_name ?? "",
    service_id: data.service_id,
    service_name: data.service_name ?? "",
    service_price: data.service_price ?? 0,
    date: data.date, // luego Timestamp
    time: data.time,
    client_name: data.client_name,
    client_email: data.client_email,
    status: AppointmentStatus.PENDING,
    created_at: new Date(),
  };
}

