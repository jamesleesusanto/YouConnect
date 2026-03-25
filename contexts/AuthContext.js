"use client";

import { createContext, useContext, useEffect, useState } from "react";
import app from "../lib/firebase";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  updateProfile,
  sendEmailVerification,
  sendPasswordResetEmail,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";

const AuthContext = createContext({});
const googleProvider = new GoogleAuthProvider();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null); // "student" | "organizer" | "master"
  const [roleStatus, setRoleStatus] = useState(null); // "active" | "pending"

  useEffect(() => {
    const auth = getAuth(app);
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        await fetchUserRole(u.uid);
      } else {
        setUserRole(null);
        setRoleStatus(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  async function fetchUserRole(uid) {
    const db = getFirestore(app);
    // Check master admin first
    try {
      const masterSnap = await getDoc(doc(db, "master_admins", uid));
      if (masterSnap.exists()) {
        setUserRole("master");
        setRoleStatus("active");
        return;
      }
    } catch {}
    // Check user_roles
    try {
      const roleSnap = await getDoc(doc(db, "user_roles", uid));
      if (roleSnap.exists()) {
        const data = roleSnap.data();
        setUserRole(data.role || "student");
        setRoleStatus(data.status || "active");
      } else {
        setUserRole("student");
        setRoleStatus("active");
      }
    } catch {
      setUserRole("student");
      setRoleStatus("active");
    }
  }

  async function login(email, password, rememberMe = false) {
    const auth = getAuth(app);
    await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
    return signInWithEmailAndPassword(auth, email, password);
  }

  async function loginWithGoogle() {
    const auth = getAuth(app);
    const cred = await signInWithPopup(auth, googleProvider);
    // If no role exists yet, default to student
    const db = getFirestore(app);
    const roleSnap = await getDoc(doc(db, "user_roles", cred.user.uid));
    if (!roleSnap.exists()) {
      await setDoc(doc(db, "user_roles", cred.user.uid), {
        role: "student",
        status: "active",
        email: cred.user.email || "",
        name: cred.user.displayName || "",
        created_at: new Date().toISOString(),
      });
    }
    return cred;
  }

  async function signup(email, password, displayName, role = "student") {
    const auth = getAuth(app);
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    if (displayName) await updateProfile(cred.user, { displayName });
    await sendEmailVerification(cred.user);
    // Save role to Firestore
    const db = getFirestore(app);
    await setDoc(doc(db, "user_roles", cred.user.uid), {
      role,
      status: role === "organizer" ? "pending" : "active",
      email,
      name: displayName || "",
      created_at: new Date().toISOString(),
    });
    return cred;
  }

  async function resetPassword(email) {
    const auth = getAuth(app);
    return sendPasswordResetEmail(auth, email);
  }

  async function logout() {
    const auth = getAuth(app);
    setUserRole(null);
    setRoleStatus(null);
    return signOut(auth);
  }

  return (
    <AuthContext.Provider value={{ user, loading, userRole, roleStatus, login, loginWithGoogle, signup, logout, resetPassword, fetchUserRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
