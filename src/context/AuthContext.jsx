import { createContext, useContext, useState } from "react";
import { getMe } from "../api/auth";

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

  function onLoggedOut() {
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
