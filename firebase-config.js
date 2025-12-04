// Firebase configuration using compat SDK for better compatibility
const firebaseConfig = {
  apiKey: "AIzaSyDXXxXaN6ttZMn0-uRBW4_kFnUkGn6ajtk",
  authDomain: "titycgroup.firebaseapp.com",
  databaseURL: "https://titycgroup-default-rtdb.firebaseio.com",
  projectId: "titycgroup",
  storageBucket: "titycgroup.firebasestorage.app",
  messagingSenderId: "879179496136",
  appId: "1:879179496136:web:a146681312492c6a82c3fd"
};

// Initialize Firebase using compat SDK (this works with script tags)
if (typeof firebase !== 'undefined') {
    firebase.initializeApp(firebaseConfig);
    console.log('Firebase inicializado correctamente');
} else {
    console.error('Firebase SDK no encontrado. Verifica que los scripts estén incluidos.');
}