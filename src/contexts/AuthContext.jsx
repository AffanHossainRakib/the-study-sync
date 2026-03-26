"use client";

import { createContext, useContext, useState, useEffect } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onIdTokenChanged,
  updateProfile,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);

  // Initialize auth state listener
  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Get ID token for API calls
        const idToken = await firebaseUser.getIdToken();
        setToken(idToken);
        // Set auth cookie for middleware
        document.cookie = `auth-token=${idToken}; path=/; max-age=3600; SameSite=Lax`;

        // Fetch user profile from MongoDB to get role
        try {
          const res = await fetch("/api/auth/me", {
            headers: { Authorization: `Bearer ${idToken}` },
          });
          if (res.ok) {
            const dbUser = await res.json();
            // Merge firebase user with db user
            const mergedUser = { ...firebaseUser, ...dbUser };
            setUser(mergedUser);
          } else {
            const errorText = await res.text();
            console.error(
              "Failed to fetch user profile:",
              res.status,
              errorText,
            );
            setUser(firebaseUser);
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
          setUser(firebaseUser);
        }
      } else {
        setUser(null);
        setToken(null);
        // Clear auth cookie
        document.cookie = "auth-token=; path=/; max-age=0";
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Register with email and password
  const register = async (email, password, displayName) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );

      // Update display name
      if (displayName) {
        await updateProfile(userCredential.user, { displayName });
      }

      return { user: userCredential.user, error: null };
    } catch (error) {
      console.error("Registration error:", error);
      return { user: null, error: error.message };
    }
  };

  // Sign in with email and password
  const signIn = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password,
      );

      return { user: userCredential.user, error: null };
    } catch (error) {
      console.error("Sign in error:", error);
      return { user: null, error: error.message };
    }
  };

  // Sign in with Google
  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);

      return { user: userCredential.user, error: null };
    } catch (error) {
      console.error("Google sign in error:", error);
      return { user: null, error: error.message };
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setToken(null);
      // Clear auth cookie
      document.cookie = "auth-token=; path=/; max-age=0";
      return { error: null };
    } catch (error) {
      console.error("Sign out error:", error);
      return { error: error.message };
    }
  };

  // Refresh token
  const refreshToken = async () => {
    if (auth.currentUser) {
      try {
        const idToken = await auth.currentUser.getIdToken(true); // Force refresh
        setToken(idToken);
        document.cookie = `auth-token=${idToken}; path=/; max-age=3600; SameSite=Lax`;
        return idToken;
      } catch (error) {
        console.error("Token refresh error:", error);
        return null;
      }
    }
    return null;
  };

  const value = {
    user,
    token,
    loading,
    register,
    signIn,
    signInWithGoogle,
    signOut,
    refreshToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
