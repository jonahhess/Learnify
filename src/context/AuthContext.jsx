import { createContext, useContext, useState, useEffect } from "react";
import { getMe, logout } from "../api/auth";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  async function reloadUser() {
    try {
      const me = await getMe();
      setUser(me);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reloadUser();
  }, []);

  async function onLoggedOut() {
    try {
      await logout(); // call backend
    } catch (err) {
      console.error("Failed to call logout API:", err);
    }
    localStorage.removeItem("user");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, reloadUser, onLoggedOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
