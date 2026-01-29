/**
 * Product Entity
 * Representa un producto disponible en la tienda
 */

export class Product {
  constructor({
    name,
    description = "",
    price,
    category,
    image_url = "",
    in_stock = true,
  }) {
    this.name = name; // string
    this.description = description; // string
    this.price = price; // number
    this.category = category; // string
    this.image_url = image_url; // string
    this.in_stock = in_stock; // boolean
    this.created_at = new Date(); // fecha de creación
  }
}

/**
 * Categorías permitidas para productos
 * Útil para selects y validaciones
 */
export const PRODUCT_CATEGORIES = {
  CAMISAS_DEPORTIVAS: "camisas_deportivas",
  PRODUCTOS_CABELLO: "productos_cabello",
  PRODUCTOS_PIEL: "productos_piel",
};
