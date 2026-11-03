import { useState } from "react";
import { Eye, EyeOff, LogIn, Landmark } from "lucide-react";
import { loginApi, saveToken } from "../../utils/auth/auth";
import "../../styles/auth.css";

interface LoginProps {
  onSuccess: (token: string) => void;
  onGoRegister: () => void;
}

const Login = ({ onSuccess, onGoRegister }: LoginProps) => {
  const [form, setForm] = useState({ username: "", password: "" });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError(null);
  };

  const handleSubmit = async () => {
    if (!form.username || !form.password) {
      setError("All fields are required.");
      return;
    }
    try {
      setLoading(true);
      const { token } = await loginApi(form);
      saveToken(token);
      onSuccess(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
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
          <h2 className="auth-title">Welcome back</h2>
          <p className="auth-sub">Sign in to your account</p>
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
            <label className="auth-label">Password</label>
            <div className="auth-input-wrap">
              <input
                className="auth-input"
                name="password"
                type={showPass ? "text" : "password"}
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                autoComplete="current-password"
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
              <LogIn size={14} />
              <span>Sign In</span>
            </>
          )}
        </button>

        <p className="auth-switch">
          Don't have an account?{" "}
          <button className="auth-link" onClick={onGoRegister}>
            Register
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;
