import { adminStorage } from "../../firebase.js";

export async function uploadImage(file) {
  if (!adminStorage)
    throw new Error("Firebase Storage not initialized. Export 'adminStorage' from firebase.js");

  const { ref: sRef, uploadBytes, getDownloadURL } = await import("firebase/storage");
  const path    = `admin-products/${Date.now()}_${file.name.replace(/\s+/g, "_")}`;
  const fileRef = sRef(adminStorage, path);
  await uploadBytes(fileRef, file);
  return getDownloadURL(fileRef);
}
