import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

let storage: any = null;

// Initialize Firebase only if config is present
try {
  if (firebaseConfig.apiKey && firebaseConfig.storageBucket) {
    const app = initializeApp(firebaseConfig);
    storage = getStorage(app);
    console.log("Firebase Storage Initialized");
  } else {
    console.log("Firebase credentials not found. Using local memory storage (Base64).");
  }
} catch (error) {
  console.warn("Failed to initialize Firebase:", error);
}

/**
 * Uploads a file to Cloud Storage or falls back to Base64
 * @param file The file object to upload
 * @returns Promise resolving to the download URL
 */
export const uploadImageToStorage = async (file: File): Promise<string> => {
  // Fallback: If no storage configured, return Base64 (Temporary Browser Storage)
  if (!storage) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
  }

  try {
    // Create a unique filename: timestamp-sanitized_name
    const fileName = `uploads/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
    const storageRef = ref(storage, fileName);
    
    // Upload
    const snapshot = await uploadBytes(storageRef, file);
    
    // Get URL
    const url = await getDownloadURL(snapshot.ref);
    return url;
  } catch (error) {
    console.error("Cloud Upload Failed, falling back to local:", error);
    // Fallback on error
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
  }
};