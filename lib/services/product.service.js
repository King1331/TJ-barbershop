import {
  collection,
  getDocs,
  getDoc,
  addDoc,
  doc,
  query,
  where,
} from "firebase/firestore";

import db from "@/lib/firebase/firestore";
import { Product } from "@/lib/entities/product.entity";

/* ------------------ COLLECTION ------------------ */
const PRODUCTS_COLLECTION = "products";

/* ------------------ GET ALL PRODUCTS ------------------ */
export const getProductsService = async () => {
  const snapshot = await getDocs(
    query(
      collection(db, PRODUCTS_COLLECTION),
    )
  );

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};

/* ------------------ GET PRODUCTS BY CATEGORY ------------------ */
export const getProductsByCategoryService = async (category) => {
  const q = query(
    collection(db, PRODUCTS_COLLECTION),
    where("category", "==", category),
    where("in_stock", "==", true)
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};

/* ------------------ GET SINGLE PRODUCT ------------------ */
export const getProductByIdService = async (productId) => {
  const ref = doc(db, PRODUCTS_COLLECTION, productId);
  const snapshot = await getDoc(ref);

  if (!snapshot.exists()) return null;

  return {
    id: snapshot.id,
    ...snapshot.data(),
  };
};

/* ------------------ CREATE PRODUCT ------------------ */
export const createProductService = async (productData) => {
  const product = new Product(productData);

  const docRef = await addDoc(
    collection(db, PRODUCTS_COLLECTION),
    { ...product }
  );

  return {
    id: docRef.id,
    ...product,
  };
};
