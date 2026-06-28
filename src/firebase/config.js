import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your live web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCb0yx8oKs9YUXHu-qDYq8KJt_Sg-kbuDo",
  authDomain: "forex-mentor-management-app.firebaseapp.com",
  projectId: "forex-mentor-management-app",
  storageBucket: "forex-mentor-management-app.appspot.com",
  messagingSenderId: "685151617499",
  appId: "1:685151617499:web:40f647b511c2ffb87567fe",
  measurementId: "G-NFHWVWQ1HT"
};

// Initialize Firebase App Instance
const app = initializeApp(firebaseConfig);

// Export instances to interact with your Google Cloud services
export const auth = getAuth(app);
export const db = getFirestore(app);