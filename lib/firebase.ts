import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
    apiKey: "AIzaSyCjXQ5k49jcN3GyHbQ_zQw6iFjVcWcoT-U",
    authDomain: "fell-good-farm-stall.firebaseapp.com",
    databaseURL: "https://fell-good-farm-stall-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "fell-good-farm-stall",
    storageBucket: "fell-good-farm-stall.firebasestorage.app",
    messagingSenderId: "1020698573511",
    appId: "1:1020698573511:web:6e721c37a11cf420a55ce2"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app); 