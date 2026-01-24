// lib/entities/service.entity.js

export const ServiceEntity = {
  name: "Service",
  collection: "services",
  schema: {
    name: {
      type: "string",
      required: true,
      description: "Nombre del servicio"
    },
    description: {
      type: "string",
      required: false,
      description: "Descripción del servicio"
    },
    price: {
      type: "number",
      required: true,
      description: "Precio del servicio en colones"
    },
    duration: {
      type: "number",
      required: false,
      description: "Duración del servicio en minutos"
    },
    image_url: {
      type: "string",
      required: false,
      description: "URL de la imagen del servicio"
    }
  }
};
