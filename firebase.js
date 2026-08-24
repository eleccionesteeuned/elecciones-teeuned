// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyD6ZGM3nJYElGAXJktCmckdT4ECK47ViKk",
  authDomain: "teeuned-5017c.firebaseapp.com",
  projectId: "teeuned-5017c",
  storageBucket: "teeuned-5017c.firebasestorage.app",
  messagingSenderId: "576591071666",
  appId: "1:576591071666:web:30975a5fb56b699597fcab"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
