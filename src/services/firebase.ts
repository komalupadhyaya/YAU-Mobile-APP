import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDownloadURL, getStorage, ref } from "firebase/storage";

const DEV = __DEV__;

const firebaseConfig = {
  apiKey: "AIzaSyCADG-9nm-61nmsHbe-hNlg82g0ccKpjkw",
  authDomain: "yau-app.firebaseapp.com",
  projectId: "yau-app",
  storageBucket: "yau-app.firebasestorage.app",
  messagingSenderId: "696491882997",
  appId: "1:696491882997:web:c191283f1415b8e913c8bc",
};

// Initialize Firebase app (check if already initialized to prevent errors)
let app;
try {
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
    if (DEV) console.log('[Firebase] Firebase initialized successfully');
  } else {
    app = getApp();
    if (DEV) console.log('[Firebase] Firebase already initialized, using existing instance');
  }
} catch (error) {
  if (DEV) console.error('[Firebase] Firebase initialization error:', error);
  // Fallback: try to get existing app if initialization fails
  try {
    app = getApp();
    if (DEV) console.log('[Firebase] Using existing Firebase app after initialization error');
  } catch (e) {
    if (DEV) console.error('[Firebase] Critical: Cannot get Firebase app', e);
    app = initializeApp(firebaseConfig);
  }
}

export const auth = getAuth(app);

import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";

// Firebase web SDK handles persistence automatically in React Native, 
// but we explicitly enable persistent cache for better control.
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});

export const storage = getStorage(app);

// Helper function to get authenticated download URL from Firebase Storage
export async function getAuthenticatedImageUrl(storagePath: string): Promise<string | null> {
  try {
    const storageRef = ref(storage, storagePath);
    const downloadURL = await getDownloadURL(storageRef);
    if (DEV) console.log('[Firebase] Got authenticated download URL for:', storagePath);
    return downloadURL;
  } catch (error) {
    if (DEV) console.error('[Firebase] Error getting download URL for', storagePath, ':', error);
    return null;
  }
}