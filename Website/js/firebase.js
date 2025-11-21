import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyAZl6zJEd8w4NZ6ut0AJAJTOAQmxK80DwQ",
  authDomain: "sls-u-matter.firebaseapp.com",
  databaseURL: "https://sls-u-matter-default-rtdb.firebaseio.com",
  projectId: "sls-u-matter",
  storageBucket: "sls-u-matter.firebasestorage.app",
  messagingSenderId: "278771732420",
  appId: "1:278771732420:web:5a0bbff7c9199237cade91",
  measurementId: "G-4F1R3D07D8"
};

// 2. Initialize Firebase (Compat SDK)
let firebaseApp = null;
let firebaseAuth = null;
let firebaseDb = null;

if (typeof firebase !== "undefined") {
  firebaseApp = firebase.initializeApp(firebaseConfig);
  firebaseAuth = firebase.auth();
  firebaseDb = firebase.firestore();

  firebaseDb.settings({ ignoreUndefinedProperties: true });
}

window.FirebaseService = {
  isReady() {
    return !!firebaseApp && !!firebaseAuth && !!firebaseDb;
  },

  // ---------- AUTH HELPERS ----------

  async registerWithEmail(email, password, extraProfile = {}) {
    if (!this.isReady()) return null;

    const cred = await firebaseAuth.createUserWithEmailAndPassword(email, password);
    const user = cred.user;

    await firebaseDb.collection("users").doc(user.uid).set({
      email: user.email,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      ...extraProfile
    });

    return user;
  },

  async loginWithEmail(email, password) {
    if (!this.isReady()) return null;
    const cred = await firebaseAuth.signInWithEmailAndPassword(email, password);
    return cred.user;
  },

  async loginWithProvider(providerName) {
    if (!this.isReady()) throw new Error("Firebase is not ready.");

    let provider;
    if (providerName === "google") {
      provider = new firebase.auth.GoogleAuthProvider();
    } else if (providerName === "facebook") {
      provider = new firebase.auth.FacebookAuthProvider();
    } else {
      throw new Error("Unsupported provider: " + providerName);
    }

    const cred = await firebaseAuth.signInWithPopup(provider);
    const user = cred.user;

    // Ensure a user doc exists
    const userRef = firebaseDb.collection("users").doc(user.uid);
    const snap = await userRef.get();
    if (!snap.exists) {
      await userRef.set({
        email: user.email,
        displayName: user.displayName || null,
        provider: providerName,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    }

    return user;
  },

  async logout() {
    if (!this.isReady()) return;
    return firebaseAuth.signOut();
  },

  onAuthChange(callback) {
    if (!this.isReady()) {
      callback(null);
      return () => {};
    }
    return firebaseAuth.onAuthStateChanged(callback);
  },

  getCurrentUser() {
    return this.isReady() ? firebaseAuth.currentUser : null;
  },

  // ---------- FIRESTORE HELPERS ----------

  async saveDocument(collectionName, data, docId = null) {
    if (!this.isReady()) return null;

    const colRef = firebaseDb.collection(collectionName);

    if (docId) {
      await colRef.doc(docId).set(
        {
          ...data,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        },
        { merge: true }
      );
      return docId;
    } else {
      const docRef = await colRef.add({
        ...data,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      return docRef.id;
    }
  }
};
