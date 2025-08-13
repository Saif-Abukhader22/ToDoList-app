import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../AuthContext";
import axios from "axios";

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    try {
      await login(email, password);
      nav("/", { replace: true });
    } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      const data = err.response?.data as { detail?: string; message?: string } | undefined;
      setErr(data?.detail || data?.message || err.message || "Login failed");
    } else if (err instanceof Error) {
      setErr(err.message);
    } else {
      setErr("Login failed");
    }
  }
};

  return (
    <div className="min-h-screen grid place-items-center bg-slate-50 dark:bg-slate-900">
      <form onSubmit={submit} className="card p-6 w-full max-w-sm">
        <h1 className="text-xl font-semibold mb-4">Welcome back</h1>
        {err && <div className="mb-3 text-sm text-red-600">{err}</div>}

        <input
          className="input mb-3"
          placeholder="Email"
          type="email"
          value={email}
          onChange={e=>setEmail(e.target.value)}
          required
        />

        <input
          className="input mb-4"
          placeholder="Password"
          type="password"
          value={password}
          onChange={e=>setPassword(e.target.value)}
          required
        />

        <button className="btn btn-primary w-full">Log in</button>

        <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
          No account? <Link className="underline" to="/signup">Sign up</Link>
        </p>
      </form>
    </div>
  );
}
