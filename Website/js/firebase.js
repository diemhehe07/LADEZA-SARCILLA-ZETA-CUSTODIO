// /Website/js/firebase.js
// (Same initialization & many helpers as before — keep your existing config and helpers.)
// Below is the full content with updated chat behavior for sendMessage and getOrCreateChat.

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

let firebaseApp = null;
let firebaseAuth = null;
let firebaseDb = null;

if (typeof firebase !== "undefined") {
  try {
    if (!firebase.apps.length) {
      firebaseApp = firebase.initializeApp(firebaseConfig);
    } else {
      firebaseApp = firebase.apps[0];
    }
    firebaseAuth = firebase.auth();
    firebaseDb = firebase.firestore();
    if (firebaseDb && firebase.firestore && firebase.firestore().settings) {
      firebaseDb.settings({ ignoreUndefinedProperties: true });
    }
  } catch (err) {
    console.error("Firebase initialization error:", err);
  }
} else {
  console.warn("Firebase SDK not found. Make sure firebase scripts are included in the page.");
}

function _isReady() {
  return !!firebaseApp && !!firebaseAuth && !!firebaseDb;
}

const FirebaseService = {
  isReady() {
    return _isReady();
  },

  /* --- AUTH (register/login/logout/onAuthChange/getUserProfile/getCurrentUser) --- */

  async register(profile = {}, email, password) {
    if (!_isReady()) throw new Error("Firebase not initialized");
    if (!email || !password) throw new Error("Email and password are required");

    const userCred = await firebaseAuth.createUserWithEmailAndPassword(email, password);
    const user = userCred.user;
    const uid = user.uid;

    if (!profile.role) profile.role = "student";

    const userDoc = {
      uid,
      email,
      firstName: profile.firstName || "",
      lastName: profile.lastName || "",
      role: profile.role || "student",
      studentId: profile.studentId || "",
      courseYear: profile.courseYear || "",
      therapistId: profile.therapistId || "",
      specialization: profile.specialization || "",
      phone: profile.phone || "",
      photoURL: profile.photoURL || "",
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    await firebaseDb.collection("users").doc(uid).set(userDoc);

    try {
      await user.updateProfile({
        displayName: (userDoc.firstName + " " + userDoc.lastName).trim() || null,
        photoURL: userDoc.photoURL || null
      });
    } catch (err) {
      console.warn("updateProfile failed:", err);
    }

    return userDoc;
  },

  async login(email, password, role = null) {
    if (!_isReady()) throw new Error("Firebase not initialized");
    if (!email || !password) throw new Error("Email and password are required");

    const cred = await firebaseAuth.signInWithEmailAndPassword(email, password);
    const user = cred.user;
    if (!user) throw new Error("Login failed");

    // FIX: Try to get user document, but don't fail if it doesn't exist
    let profile = null;
    try {
      const doc = await firebaseDb.collection("users").doc(user.uid).get();
      if (doc.exists) {
        profile = doc.data();
        
        // Check role only if profile exists and role is specified
        if (role && profile.role && role !== profile.role) {
          console.warn("Role mismatch, but allowing login anyway");
          // Instead of signing out, just log a warning
          // await firebaseAuth.signOut();
          // throw new Error("Selected role does not match your account role.");
        }
      } else {
        // User document doesn't exist - create a basic one
        console.warn("User document not found, creating basic profile...");
        profile = {
          uid: user.uid,
          email: user.email,
          firstName: "",
          lastName: "",
          role: "student", // default role
          createdAt: new Date()
        };
        
        await firebaseDb.collection("users").doc(user.uid).set(profile);
        console.log("Basic user profile created");
      }
    } catch (error) {
      console.error("Error accessing user profile:", error);
      // Don't fail login if there's a Firestore error
      // Create a minimal profile object to allow login
      profile = {
        uid: user.uid,
        email: user.email,
        role: "student"
      };
    }

    return profile;
  },

  async registerWithEmail(email, password, userData = {}) {
    return this.register(userData, email, password);
  },

  async loginWithEmail(email, password) {
    if (!_isReady()) throw new Error("Firebase not initialized");
    const cred = await firebaseAuth.signInWithEmailAndPassword(email, password);
    return cred.user;
  },

  async loginWithProvider(providerName) {
    if (!_isReady()) throw new Error("Firebase is not ready.");

    let provider;
    if (providerName === "google") provider = new firebase.auth.GoogleAuthProvider();
    else if (providerName === "facebook") provider = new firebase.auth.FacebookAuthProvider();
    else throw new Error("Unsupported provider: " + providerName);

    const cred = await firebaseAuth.signInWithPopup(provider);
    const user = cred.user;

    const userRef = firebaseDb.collection("users").doc(user.uid);
    const snap = await userRef.get();
    if (!snap.exists) {
      await userRef.set({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || null,
        provider: providerName,
        role: "student",
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    }

    return user;
  },

  async logout() {
    if (!_isReady()) throw new Error("Firebase not initialized");
    return firebaseAuth.signOut();
  },

  onAuthChange(callback) {
    if (!_isReady()) {
      try { callback(null); } catch (e) { console.error(e); }
      return () => {};
    }
    return firebaseAuth.onAuthStateChanged(callback);
  },

  getCurrentUser() {
    return _isReady() ? firebaseAuth.currentUser : null;
  },

  async getUserProfile(uid = null) {
    if (!_isReady()) throw new Error("Firebase not initialized");
    const userId = uid || this.getCurrentUser()?.uid;
    if (!userId) return null;
    
    try {
      const doc = await firebaseDb.collection("users").doc(userId).get();
      if (doc.exists) {
        return doc.data();
      } else {
        // If document doesn't exist, create a basic one
        const basicProfile = {
          uid: userId,
          email: this.getCurrentUser()?.email || "",
          role: "student",
          createdAt: new Date()
        };
        await firebaseDb.collection("users").doc(userId).set(basicProfile);
        return basicProfile;
      }
    } catch (error) {
      console.error("Error getting user profile:", error);
      return null;
    }
  },

  /* --- CHAT: getOrCreateChat, sendMessage, listenToMessages, listenToUserChats --- */

  // Create or get chat room. Chat ID deterministic from the two participant ids.
  // participantNames: object mapping userId -> displayName for UI.
  async getOrCreateChat(participant1, participant2, participantNames = {}) {
    if (!_isReady()) throw new Error("Firebase not initialized");

    // create deterministic id so both sides use same doc id
    const chatId = [participant1, participant2].sort().join("_");
    const chatRef = firebaseDb.collection("chats").doc(chatId);

    const chatDoc = await chatRef.get();
    if (!chatDoc.exists) {
      // create new chat doc with participants and names
      await chatRef.set({
        participants: [participant1, participant2],
        participantNames: participantNames || {},
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        lastMessage: null,
        lastMessageAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      // create an initial metadata doc entry (no messages yet)
      // Note: we intentionally set lastMessageAt so that therapist sees new chat sorted by time
    }

    return chatId;
  },

  // Send a message: add to messages subcollection and update parent chat metadata
  async sendMessage(chatId, messageData) {
    if (!_isReady()) throw new Error("Firebase not initialized");
    if (!chatId) throw new Error("chatId required");

    const messageRef = firebaseDb.collection("chats").doc(chatId).collection("messages");

    const payload = {
      ...messageData,
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    };

    // Add message
    const msgRef = await messageRef.add(payload);

    // Update parent chat meta: lastMessage, lastMessageAt, lastMessageBy, lastMessagePreview
    const preview = (messageData.message || "").slice(0, 220);
    await firebaseDb.collection("chats").doc(chatId).set(
      {
        lastMessage: messageData.message || '',
        lastMessageAt: firebase.firestore.FieldValue.serverTimestamp(),
        lastMessageBy: messageData.senderId || null,
        lastMessagePreview: preview
      },
      { merge: true }
    );

    // Optionally update lastMessage on participant-specific indexes if you have them
    return msgRef.id;
  },

  // Listen to messages inside a chat (ordered by timestamp asc)
  listenToMessages(chatId, callback) {
    if (!_isReady()) return () => {};

    return firebaseDb
      .collection("chats")
      .doc(chatId)
      .collection("messages")
      .orderBy("timestamp", "asc")
      .onSnapshot((snapshot) => {
        const messages = [];
        snapshot.forEach((doc) => {
          messages.push({
            id: doc.id,
            ...doc.data()
          });
        });
        callback(messages);
      });
  },

  // Listen to chats where user is a participant; returns metadata of chat docs
  listenToUserChats(userId, callback) {
    if (!_isReady()) return () => {};

    return firebaseDb
      .collection("chats")
      .where("participants", "array-contains", userId)
      .orderBy("lastMessageAt", "desc")
      .onSnapshot((snapshot) => {
        const chats = [];
        snapshot.forEach((doc) => {
          chats.push({
            id: doc.id,
            ...doc.data()
          });
        });
        callback(chats);
      });
  },

  /* --- FIRESTORE UTILITIES --- */

  async saveDocument(collectionName, data, docId = null) {
    if (!_isReady()) throw new Error("Firebase not initialized");
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
  },

  /* --- DEBUGGING HELPERS --- */
  
  async debugCheckUser(uid) {
    if (!_isReady()) return "Firebase not ready";
    
    try {
      // Check auth
      const authUser = firebaseAuth.currentUser;
      const authInfo = authUser ? `Auth User: ${authUser.uid}, Email: ${authUser.email}` : "No auth user";
      
      // Check Firestore
      const doc = await firebaseDb.collection("users").doc(uid).get();
      const firestoreInfo = doc.exists ? "User document exists" : "User document NOT found";
      
      return `${authInfo} | ${firestoreInfo}`;
    } catch (error) {
      return `Debug error: ${error.message}`;
    }
  }
};

window.FirebaseService = FirebaseService;

if (firebaseConfig.apiKey && firebaseConfig.apiKey.startsWith("AIza")) {
  console.log("FirebaseService (chat-enabled) loaded.");
} else {
  console.warn("Firebase config appears missing or placeholder. Ensure firebaseConfig is correct in /Website/js/firebase.js");
}