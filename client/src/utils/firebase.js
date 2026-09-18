// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth , GoogleAuthProvider} from "firebase/auth";
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_APIKEY,
  authDomain: "interview-6bcf6.firebaseapp.com",
  projectId: "interview-6bcf6",
  storageBucket: "interview-6bcf6.firebasestorage.app",
  messagingSenderId: "790136688797",
  appId: "1:790136688797:web:a4a23951c921bdf1728474"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const provider = new GoogleAuthProvider();

export { auth, provider };
