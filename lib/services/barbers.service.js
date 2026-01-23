// lib/services/barbers.service.js

import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/firestore";

export const getBarbersService = async () => {
  const snapshot = await getDocs(collection(db, "barber"));

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }));
};
