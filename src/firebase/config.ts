import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, Firestore, collection, getDocs, doc, getDocFromServer } from 'firebase/firestore';
import { getStorage, FirebaseStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { FirebaseConnectionConfig } from '../types';

const STORAGE_KEY = 'moslemganj_firebase_config';

// Load stored config or environment config
export function getSavedFirebaseConfig(): FirebaseConnectionConfig | null {
  try {
    const local = localStorage.getItem(STORAGE_KEY);
    if (local) {
      const parsed = JSON.parse(local);
      if (parsed.projectId && parsed.apiKey) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading saved firebase config:', e);
  }

  // Check Vite env
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
  if (apiKey && projectId) {
    return {
      apiKey,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || `${projectId}.firebaseapp.com`,
      projectId,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || `${projectId}.appspot.com`,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
      appId: import.meta.env.VITE_FIREBASE_APP_ID || ''
    };
  }

  return null;
}

export function saveFirebaseConfig(config: FirebaseConnectionConfig) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

export function removeFirebaseConfig() {
  localStorage.removeItem(STORAGE_KEY);
}

let firebaseApp: FirebaseApp | null = null;
let firestoreDb: Firestore | null = null;
let firebaseAuth: Auth | null = null;
let firebaseStorage: FirebaseStorage | null = null;

export function initializeFirebaseServices() {
  const config = getSavedFirebaseConfig();
  if (!config || !config.apiKey || !config.projectId) {
    return { app: null, db: null, auth: null, storage: null, isConfigured: false };
  }

  try {
    if (!getApps().length) {
      firebaseApp = initializeApp(config);
    } else {
      firebaseApp = getApp();
    }

    firestoreDb = getFirestore(firebaseApp);
    firebaseAuth = getAuth(firebaseApp);
    firebaseStorage = getStorage(firebaseApp);

    return {
      app: firebaseApp,
      db: firestoreDb,
      auth: firebaseAuth,
      storage: firebaseStorage,
      isConfigured: true
    };
  } catch (error) {
    console.warn('Firebase initialization note (using local storage fallback):', error);
    return { app: null, db: null, auth: null, storage: null, isConfigured: false, error };
  }
}

// Initial attempt
export const firebaseServices = initializeFirebaseServices();

export async function testConnection(): Promise<{ success: boolean; message: string }> {
  const { db, isConfigured } = initializeFirebaseServices();
  if (!isConfigured || !db) {
    return {
      success: false,
      message: 'ফায়ারবেস কনফিগারেশন এখনো সেট করা হয়নি। নিচে আপনার Firebase কনফিগ প্রদান করুন।'
    };
  }

  try {
    await getDocFromServer(doc(db, 'system', 'connection_test'));
    return {
      success: true,
      message: 'ফায়ারবেস ফায়ারস্টোর ডাটাবেসের সাথে সংযোগ সফল হয়েছে!'
    };
  } catch (error: any) {
    if (error?.message && error.message.includes('the client is offline')) {
      return {
        success: false,
        message: 'ফায়ারবেস সার্ভারের সাথে যোগাযোগ করা যাচ্ছে না। ক্লায়েন্ট অফলাইনে আছে বা প্রজেক্ট সেটিংস যাচাই করুন।'
      };
    }
    // Often permission denied or doc not found still means connection established
    if (error?.code === 'permission-denied') {
      return {
        success: true,
        message: 'ফায়ারবেসের সাথে সংযোগ তৈরি হয়েছে (Security Rules অনুযায়ী টেস্ট রিকোয়েস্ট ভ্যালিডেট হয়েছে)।'
      };
    }
    return {
      success: false,
      message: `সংযোগ ত্রুটি: ${error?.message || 'অজানা সমস্যা'}`
    };
  }
}

// Upload helper: Uploads to Firebase Storage if available, otherwise converts to data URL (offline/local friendly)
export async function uploadImageFile(file: File, folderPath: string = 'images'): Promise<string> {
  const { storage } = initializeFirebaseServices();

  if (storage) {
    try {
      const fileName = `${folderPath}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
      const storageRef = ref(storage, fileName);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(snapshot.ref);
      return downloadUrl;
    } catch (e) {
      console.warn('Firebase storage upload failed, falling back to DataURL:', e);
    }
  }

  // Fallback to Base64 Data URL so user is never blocked
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve(reader.result as string);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
