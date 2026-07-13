import { use, useState } from "react";
import { getMe, logout } from "../api/auth";
import { getUserById } from "../api/users";
import { AuthContext } from "./authContext.js";

const authCache = new Map();

function getAuthResource(version) {
  if (!authCache.has(version)) {
    authCache.set(
      version,
      (async () => {
        try {
          const me = await getMe();
          if (!me?._id) return null;
          return await getUserById(me._id);
        } catch (err) {
          console.error("Failed to reload user:", err);
          return null;
        }
      })()
    );
  }

  return authCache.get(version);
}

export function AuthProvider({ children }) {
  const [version, setVersion] = useState(0);
  const user = use(getAuthResource(version));

  async function reloadUser() {
    authCache.clear();
    setVersion(prev => prev + 1);
  }

  async function onLoggedOut() {
    try {
      await logout(); // call backend
    } catch (err) {
      console.error("Failed to call logout API:", err);
    }
    localStorage.removeItem("user");
    authCache.clear();
    setVersion(prev => prev + 1);
  }

  return (
    <AuthContext.Provider
      value={{ user, loading: false, reloadUser, onLoggedOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}
