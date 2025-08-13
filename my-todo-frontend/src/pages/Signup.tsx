import { useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../AuthContext";

const MIN_LEN = 8;
const hasLower = (s: string) => /[a-z]/.test(s);
const hasUpper = (s: string) => /[A-Z]/.test(s);
const hasDigit = (s: string) => /\d/.test(s);

export default function Signup() {
  const { signup } = useAuth();
  const nav = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const checks = useMemo(() => ({
    len: password.length >= MIN_LEN,
    lower: hasLower(password),
    upper: hasUpper(password),
    digit: hasDigit(password),
    match: confirm.length > 0 && password === confirm,
  }), [password, confirm]);

  const canSubmit = checks.len && checks.lower && checks.upper && checks.digit && checks.match;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");

    if (!canSubmit) {
      setErr("Please meet the password rules and confirm it.");
      return;
    }

    setLoading(true);
    try {
      await signup(email, password);     // backend will also validate
      nav("/", { replace: true });
    } catch (ex: unknown) {
      setErr(ex instanceof Error ? ex.message : "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  const Row = ({ ok, text }: { ok: boolean; text: string }) => (
    <div className={`text-sm ${ok ? "text-green-600" : "text-slate-500"}`}>
      {ok ? "✓" : "•"} {text}
    </div>
  );

  return (
    <div className="min-h-screen grid place-items-center bg-slate-50 dark:bg-slate-900">
      <form onSubmit={submit} className="card p-6 w-full max-w-sm">
        <h1 className="text-xl font-semibold mb-4">Create your account</h1>

        {err && <div className="mb-3 text-sm text-red-600">{err}</div>}

        <input
          className="input mb-3"
          placeholder="Email"
          type="email"
          value={email}
          onChange={e=>setEmail(e.target.value)}
          required
        />

        <div className="mb-3">
          <div className="flex gap-2">
            <input
              className="input flex-1"
              placeholder="Password"
              type={show ? "text" : "password"}
              value={password}
              onChange={e=>setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={()=>setShow(s=>!s)}
              className="btn btn-muted"
              aria-label="Toggle password visibility"
            >
              {show ? "Hide" : "Show"}
            </button>
          </div>
          <div className="mt-2 space-y-1">
            <Row ok={checks.len}   text={`At least ${MIN_LEN} characters`} />
            <Row ok={checks.lower} text="At least one lowercase (a-z)" />
            <Row ok={checks.upper} text="At least one uppercase (A-Z)" />
            <Row ok={checks.digit} text="At least one number (0-9)" />
          </div>
        </div>

        <input
          className="input mb-4"
          placeholder="Confirm password"
          type={show ? "text" : "password"}
          value={confirm}
          onChange={e=>setConfirm(e.target.value)}
          required
        />
        {!checks.match && confirm.length > 0 && (
          <div className="mb-3 text-xs text-red-600">Passwords do not match.</div>
        )}

        <button type="submit" className="btn btn-primary w-full" disabled={loading || !canSubmit}>
          {loading ? "Creating..." : "Sign up"}
        </button>

        <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
          Have an account? <Link className="underline" to="/login">Log in</Link>
        </p>
      </form>
    </div>
  );
}
