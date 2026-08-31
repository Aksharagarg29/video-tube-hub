import { createContext, useContext, useState, useEffect } from "react";
import api from "../api/axios";

// Context = a way to share data (like "who is logged in") with
// any component in the app, without passing props everywhere.
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // true while we check if user is already logged in

  // On first load, ask the backend "who am I?" using the saved cookie.
  useEffect(() => {
    checkLoggedInUser();
  }, []);

  async function checkLoggedInUser() {
    try {
      const res = await api.get("/users/get-user");

      const updatedUser = res.data.data;

      setUser(updatedUser);

      return updatedUser;
    } catch {
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }

  async function login(identifier, password) {
    const isEmail = identifier.includes("@");

    const loginData = isEmail
      ? { email: identifier, password }
      : { userName: identifier, password };

    const res = await api.post("/users/login", loginData);

    setUser(res.data.data.user);
  }

  async function googleLogin(credential) {
    const response = await api.post("/users/google", { credential });
    const signedInUser = response.data.data.user;
    setUser(signedInUser);
    return signedInUser;
  }

  async function signup(formData) {
    // formData is a FormData object because it includes files (avatar/cover image)
    await api.post("/users/register", formData);
  }

  async function logout() {
    await api.post("/users/logout");
    setUser(null);
  }

  const value = { user, loading, login, googleLogin, signup, logout, refreshUser: checkLoggedInUser };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Small helper hook so components can just do: const { user } = useAuth();
export function useAuth() {
  return useContext(AuthContext);
}
