// Website/js/firebase.js

// 1. Your Firebase web app configuration
//    Replace these placeholder values with the config from your Firebase console:
//    Project settings → General → Your apps → Web app → Firebase SDK snippet (config).
const firebaseConfig = {
  apiKey: "YOUR_API_KEY_HERE",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// 2. Initialize Firebase (using compat SDK from CDN)
let firebaseApp = null;
let firebaseAuth = null;
let firebaseDb = null;

if (typeof firebase !== 'undefined') {
  firebaseApp = firebase.initializeApp(firebaseConfig);
  firebaseAuth = firebase.auth();
  firebaseDb = firebase.firestore();

  // Optional: enable timestamps in snapshots
  firebaseDb.settings({ ignoreUndefinedProperties: true });
}

// 3. Helper functions
window.FirebaseService = {
  isReady() {
    return !!firebaseApp && !!firebaseAuth && !!firebaseDb;
  },

  // --- Auth helpers ---

  async registerWithEmail(email, password, extraProfile = {}) {
    if (!this.isReady()) return null;

    const cred = await firebaseAuth.createUserWithEmailAndPassword(email, password);
    const user = cred.user;

    // Save profile in Firestore
    await firebaseDb.collection('users').doc(user.uid).set({
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

  // --- Firestore helpers ---

  async saveDocument(collectionName, data, docId = null) {
    if (!this.isReady()) return null;
    const colRef = firebaseDb.collection(collectionName);

    if (docId) {
      await colRef.doc(docId).set(
        { ...data, updatedAt: firebase.firestore.FieldValue.serverTimestamp() },
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
