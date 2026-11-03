import { useState } from "react";
import { Eye, EyeOff, UserPlus, Landmark } from "lucide-react";
import { registerApi, saveToken } from "../../utils/auth/auth";
import "../../styles/auth.css";

interface RegisterProps {
  onSuccess: (token: string) => void;
  onGoLogin: () => void;
}

const Register = ({ onSuccess, onGoLogin }: RegisterProps) => {
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError(null);
  };

  const handleSubmit = async () => {
    if (!form.username || !form.email || !form.password) {
      setError("All fields are required.");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    try {
      setLoading(true);
      await registerApi(form);
      onGoLogin();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSubmit();
  };

  return (
    <div className="auth-shell">
      <div className="auth-card" onKeyDown={handleKeyDown}>
        {/* Brand */}
        <div className="auth-brand">
          <div className="auth-brand-icon">
            <Landmark size={20} color="#818cf8" />
          </div>
          <h1 className="auth-brand-name">ExpenseFlow</h1>
        </div>

        <div className="auth-heading">
          <h2 className="auth-title">Create account</h2>
          <p className="auth-sub">Start tracking your finances</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <div className="auth-fields">
          <div className="auth-field">
            <label className="auth-label">Username</label>
            <input
              className="auth-input"
              name="username"
              value={form.username}
              onChange={handleChange}
              placeholder="your_username"
              autoComplete="username"
              autoFocus
            />
          </div>

          <div className="auth-field">
            <label className="auth-label">Email</label>
            <input
              className="auth-input"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>

          <div className="auth-field">
            <label className="auth-label">Password</label>
            <div className="auth-input-wrap">
              <input
                className="auth-input"
                name="password"
                type={showPass ? "text" : "password"}
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                autoComplete="new-password"
              />
              <button
                className="auth-eye"
                onClick={() => setShowPass((v) => !v)}
                tabIndex={-1}
                type="button"
              >
                {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
        </div>

        <button
          className={`auth-btn ${loading ? "auth-btn-loading" : ""}`}
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <span className="auth-spinner" />
          ) : (
            <>
              <UserPlus size={14} />
              <span>Create Account</span>
            </>
          )}
        </button>

        <p className="auth-switch">
          Already have an account?{" "}
          <button className="auth-link" onClick={onGoLogin}>
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
};

export default Register;
