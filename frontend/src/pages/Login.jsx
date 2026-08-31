import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import GoogleLoginButton from "../components/GoogleLoginButton";

export default function Login() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(identifier, password);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Could not log in. Check your details and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <form
        className="w-full max-w-[380px] bg-surface border border-border rounded-lg p-8"
        onSubmit={handleSubmit}
      >
        <div className="flex items-center gap-2 font-bold mb-6">
          <span className="w-8 h-8 rounded-full flex items-center justify-center text-[13px] text-white bg-gradient-to-br from-pink-500 via-purple-500 to-cyan-500">
            VT
          </span>
          <span>VIDEO-TUBE-HUB</span>
        </div>
        <h1 className="m-0 mb-1 text-[22px]">Log in</h1>
        <p className="m-0 mb-6 text-muted text-sm">Welcome back to VIDEO-TUBE-HUB.</p>

        {error && (
          <p className="bg-danger/10 border border-danger text-danger px-3 py-2.5 rounded-lg text-[13px] mb-4">
            {error}
          </p>
        )}

        <div className="field">
          <label>Email or Username</label>
          <input
            className="input"
            type="text"
            required
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="Enter username or email"
          />
        </div>

        <div className="field">
          <label>Password</label>
          <input
            className="input"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button className="btn btn-primary w-full mt-2" disabled={loading}>
          {loading ? "Logging in..." : "Log in"}
        </button>

        <div className="flex items-center gap-3 my-5">
          <div className="h-px bg-border flex-1"></div>
          <span className="text-xs text-muted">OR</span>
          <div className="h-px bg-border flex-1"></div>
        </div>

        <GoogleLoginButton
          onSuccess={() => navigate("/")}
          onError={(message) => setError(message)}
        />

        <p className="mt-5 text-[13px] text-muted text-center">
          Don't have an account?{" "}
          <Link to="/signup" className="text-primary font-semibold">
            Sign up
          </Link>
        </p>
      </form>
    </div>
  );
}
