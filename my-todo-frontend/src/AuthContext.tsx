import { createContext, useContext, useMemo, useState } from "react";
import { api } from "./api";

/** Server response types */
type TokenResponse = { access_token: string; token_type: string };
// type UserOut = { id: number; email: string };

/** What the rest of the app can use */
type AuthCtx = {
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const Ctx = createContext<AuthCtx | undefined>(undefined);


// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}



export function AuthProvider({ children }: { children: React.ReactNode }) {

  const [token, setToken] = useState<string | null>(() => localStorage.getItem("token"));

  /** Log in: call backend, store JWT */
  const login = async (email: string, password: string) => {
    const { data } = await api.post<TokenResponse>("/auth/login", { email, password });
    localStorage.setItem("token", data.access_token);
    setToken(data.access_token);
  };

  /** Sign up: create user, then log in immediately */

// const signup = async (email: string, password: string) => {
//   try {
//     const { data } = await api.post<TokenResponse>("/auth/signup", { email, password });
//     localStorage.setItem("token", data.access_token);
//     setToken(data.access_token);    
//   } catch (err) {
  
//     throw err instanceof Error ? err : new Error("Signup failed");
//   }
// };

const signup = async (email: string, password: string) => {
  try {
    await api.post("/auth/signup", { email, password }); 
    await login(email, password);  
  } catch (err) {
    throw err instanceof Error ? err : new Error("Signup failed");
  }
};


  /** Log out: clear JWT */
  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
  };

  const value = useMemo<AuthCtx>(
    () => ({
      token,
      isAuthenticated: Boolean(token),
      login,
      signup,
      logout,
    }),
    [token]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
